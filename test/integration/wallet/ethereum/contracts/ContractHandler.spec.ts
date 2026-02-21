import { crypto } from 'bitcoinjs-lib';
import type { ERC20 } from 'boltz-core/typechain/ERC20';
import type { ERC20Swap } from 'boltz-core/typechain/ERC20Swap';
import type { EtherSwap } from 'boltz-core/typechain/EtherSwap';
import { randomBytes } from 'crypto';
import { Signature, Wallet } from 'ethers';
import Logger from '../../../../../lib/Logger';
import { getHexBuffer } from '../../../../../lib/Utils';
import { SwapType } from '../../../../../lib/consts/Enums';
import type { AnySwap } from '../../../../../lib/consts/Types';
import Database from '../../../../../lib/db/Database';
import Commitment from '../../../../../lib/db/models/Commitment';
import TransactionLabel from '../../../../../lib/db/models/TransactionLabel';
import CommitmentRepository from '../../../../../lib/db/repositories/CommitmentRepository';
import TransactionLabelRepository from '../../../../../lib/db/repositories/TransactionLabelRepository';
import Errors from '../../../../../lib/wallet/ethereum/Errors';
import { networks } from '../../../../../lib/wallet/ethereum/EvmNetworks';
import type { BatchClaimValues } from '../../../../../lib/wallet/ethereum/contracts/ContractHandler';
import ContractHandler from '../../../../../lib/wallet/ethereum/contracts/ContractHandler';
import { computeLockupHash } from '../../../../../lib/wallet/ethereum/contracts/ContractUtils';
import { Feature } from '../../../../../lib/wallet/ethereum/contracts/Contracts';
import ERC20WalletProvider from '../../../../../lib/wallet/providers/ERC20WalletProvider';
import { wait } from '../../../../Utils';
import type { EthereumSetup } from '../../EthereumTools';
import {
  erc20SwapCommitTypes,
  etherSwapCommitTypes,
  fundSignerWallet,
  getContracts,
  getErc20SwapDomain,
  getEtherSwapDomain,
  getSigner,
} from '../../EthereumTools';

describe('ContractHandler', () => {
  let database: Database;
  let setup: EthereumSetup;

  let etherSwap: EtherSwap;
  let erc20Swap: ERC20Swap;
  let tokenContract: ERC20;

  let erc20WalletProvider: ERC20WalletProvider;

  const contractHandler = new ContractHandler(networks.Ethereum);
  const contractHandlerEtherBase = new ContractHandler(networks.Ethereum);

  const amount = BigInt(10) ** BigInt(17);
  const preimage = randomBytes(32);
  const preimageHash = crypto.sha256(preimage);

  const swap = {
    id: 'id',
    type: SwapType.ReverseSubmarine,
  } as AnySwap;

  let timelock: number;

  const hashEtherSwapValues = async (claimAddress: string) => {
    return etherSwap.hashValues(
      preimageHash,
      amount,
      claimAddress,
      await setup.signer.getAddress(),
      timelock,
    );
  };

  const hashErc20SwapValues = async (claimAddress: string) => {
    return erc20Swap.hashValues(
      preimageHash,
      amount,
      await tokenContract.getAddress(),
      claimAddress,
      await setup.signer.getAddress(),
      timelock,
    );
  };

  const querySwap = async (contract: EtherSwap | ERC20Swap, hash: string) => {
    return await contract.swaps(hash);
  };

  const lockupEther = async (swap: AnySwap) => {
    const transaction = await contractHandler.lockupEther(
      swap,
      preimageHash,
      amount,
      await setup.etherBase.getAddress(),
      timelock,
    );

    return await transaction.wait(1);
  };

  const lockupErc20 = async (swap: AnySwap) => {
    const feeData = await setup.provider.getFeeData();
    const approveTransaction = await tokenContract.approve(
      await erc20Swap.getAddress(),
      amount,
      {
        type: 2,
        maxFeePerGas: feeData.maxFeePerGas!,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas!,
      },
    );
    await approveTransaction.wait(1);

    const transaction = await contractHandler.lockupToken(
      swap,
      erc20WalletProvider,
      preimageHash,
      amount,
      await setup.etherBase.getAddress(),
      timelock,
    );
    return await transaction.wait(1);
  };

  beforeAll(async () => {
    database = new Database(Logger.disabledLogger, Database.memoryDatabase);
    await database.init();

    setup = await getSigner();
    const contracts = await getContracts(setup.signer);

    etherSwap = contracts.etherSwap;
    erc20Swap = contracts.erc20Swap;
    tokenContract = contracts.token;

    erc20WalletProvider = new ERC20WalletProvider(
      Logger.disabledLogger,
      setup.signer,
      {
        decimals: 18,
        symbol: 'TRC',
        contract: tokenContract,
        address: await tokenContract.getAddress(),
      },
    );

    const features = new Set<Feature>([Feature.BatchClaim]);

    contractHandler.init(
      features,
      setup.provider,
      setup.signer,
      etherSwap,
      erc20Swap,
    );
    contractHandlerEtherBase.init(
      features,
      setup.provider,
      setup.etherBase,
      etherSwap.connect(setup.etherBase) as EtherSwap,
      erc20Swap.connect(setup.etherBase) as ERC20Swap,
    );

    timelock = await setup.provider.getBlockNumber();

    await fundSignerWallet(setup.signer, setup.etherBase, tokenContract);
  });

  afterAll(async () => {
    setup.provider.destroy();

    await TransactionLabel.destroy({
      truncate: true,
    });
    await Commitment.destroy({
      truncate: true,
    });
    await database.close();
  });

  afterEach(async () => {
    await wait(150);
  });

  test('should lockup Ether', async () => {
    const tx = await lockupEther(swap);

    expect(
      await querySwap(
        etherSwap,
        await hashEtherSwapValues(await setup.etherBase.getAddress()),
      ),
    ).toEqual(true);

    const label = await TransactionLabelRepository.getLabel(tx!.hash);
    expect(label!).not.toBeNull();
    expect(label!.id).toEqual(tx!.hash);
    expect(label!.symbol).toEqual(networks.Ethereum.symbol);
    expect(label!.label).toEqual(
      TransactionLabelRepository.lockupLabel(swap, false),
    );
  });

  test('should lockup Ether with prepay miner fee', async () => {
    const randomWallet = Wallet.createRandom().connect(setup.provider);

    expect(
      await setup.provider.getBalance(await randomWallet.getAddress()),
    ).toEqual(BigInt(0));

    const amountPrepay = BigInt(123);

    const transaction = await contractHandler.lockupEtherPrepayMinerfee(
      swap,
      preimageHash,
      amount,
      amountPrepay,
      randomWallet.address,
      timelock,
    );
    await transaction.wait(1);
    await wait(150);

    // Sanity check the gas limit
    expect(Number(transaction.gasLimit)).toBeLessThan(150000);

    // Check that the prepay amount was forwarded to the claim address
    expect(await setup.provider.getBalance(randomWallet.address)).toEqual(
      amountPrepay,
    );

    // Make sure the funds were locked in the contract
    expect(
      await querySwap(
        etherSwap,
        await hashEtherSwapValues(randomWallet.address),
      ),
    ).toEqual(true);

    const label = await TransactionLabelRepository.getLabel(transaction!.hash);
    expect(label!).not.toBeNull();
    expect(label!.id).toEqual(transaction!.hash);
    expect(label!.symbol).toEqual(networks.Ethereum.symbol);
    expect(label!.label).toEqual(
      TransactionLabelRepository.lockupLabel(swap, true),
    );
  });

  test('should claim Ether', async () => {
    const transaction = await contractHandlerEtherBase.claimEther(
      swap,
      preimage,
      amount,
      await setup.signer.getAddress(),
      timelock,
    );
    await transaction.wait(1);

    expect(
      await querySwap(
        etherSwap,
        await hashEtherSwapValues(await setup.etherBase.getAddress()),
      ),
    ).toEqual(false);

    const label = await TransactionLabelRepository.getLabel(transaction!.hash);
    expect(label!).not.toBeNull();
    expect(label!.id).toEqual(transaction!.hash);
    expect(label!.symbol).toEqual(networks.Ethereum.symbol);
    expect(label!.label).toEqual(TransactionLabelRepository.claimLabel(swap));
  });

  test('should claim Ether with commitment signature', async () => {
    const commitmentSwap = {
      id: 'commitmentEther',
      type: SwapType.Submarine,
    } as AnySwap;
    const commitmentPreimage = randomBytes(32);
    const commitmentPreimageHash = crypto.sha256(commitmentPreimage);
    const zeroPreimageHash = Buffer.alloc(32);
    const commitmentAmount = BigInt(10) ** BigInt(16);
    const commitmentTimelock = await setup.provider.getBlockNumber();

    const lockupTx = await contractHandler.lockupEther(
      commitmentSwap,
      zeroPreimageHash,
      commitmentAmount,
      await setup.etherBase.getAddress(),
      commitmentTimelock,
    );
    await lockupTx.wait(1);

    const claimAddress = await setup.etherBase.getAddress();
    const refundAddress = await setup.signer.getAddress();

    const signatureRaw = await setup.signer.signTypedData(
      await getEtherSwapDomain(setup.provider, etherSwap),
      etherSwapCommitTypes,
      {
        preimageHash: commitmentPreimageHash,
        amount: commitmentAmount,
        claimAddress,
        refundAddress,
        timelock: commitmentTimelock,
      },
    );

    const lockupHash = await computeLockupHash(etherSwap, {
      preimageHash: zeroPreimageHash,
      amount: commitmentAmount,
      claimAddress,
      refundAddress,
      timelock: BigInt(commitmentTimelock),
    });

    await CommitmentRepository.create({
      swapId: commitmentSwap.id,
      lockupHash,
      transactionHash: lockupTx.hash,
      signature: getHexBuffer(signatureRaw.slice(2)),
    });

    const claimTx = await contractHandlerEtherBase.claimEther(
      commitmentSwap,
      commitmentPreimage,
      commitmentAmount,
      await setup.signer.getAddress(),
      commitmentTimelock,
    );
    await claimTx.wait(1);

    const swapHash = await etherSwap.hashValues(
      zeroPreimageHash,
      commitmentAmount,
      await setup.etherBase.getAddress(),
      await setup.signer.getAddress(),
      commitmentTimelock,
    );
    expect(await etherSwap.swaps(swapHash)).toEqual(false);

    const label = await TransactionLabelRepository.getLabel(claimTx.hash);
    expect(label!).not.toBeNull();
    expect(label!.label).toEqual(
      TransactionLabelRepository.claimLabel(commitmentSwap),
    );
  });

  describe('claimBatchEther', () => {
    test('should batch claim Ether', async () => {
      const values: BatchClaimValues[] = [
        {
          amount: 21n,
          timelock: 1,
          preimage: randomBytes(32),
          refundAddress: await setup.signer.getAddress(),
        },
        {
          amount: 42n,
          timelock: 2,
          preimage: randomBytes(32),
          refundAddress: await setup.signer.getAddress(),
        },
        {
          amount: 50n,
          timelock: 3,
          preimage: randomBytes(32),
          refundAddress: await setup.signer.getAddress(),
        },
        {
          amount: 2121n,
          timelock: 21,
          preimage: randomBytes(32),
          refundAddress: await setup.signer.getAddress(),
        },
        {
          amount: 2142n,
          timelock: 32,
          preimage: randomBytes(32),
          refundAddress: await setup.signer.getAddress(),
        },
      ];
      const valuesWithPreimageHash = values.map((v) => ({
        ...v,
        preimageHash: crypto.sha256(v.preimage),
      }));

      let nonce = await setup.signer.getNonce();
      for (const v of valuesWithPreimageHash) {
        const tx = await etherSwap['lock(bytes32,address,uint256)'](
          v.preimageHash,
          await setup.signer.getAddress(),
          v.timelock,
          {
            nonce,
            value: v.amount,
          },
        );
        await tx.wait(1);

        nonce += 1;
      }

      await wait(150);
      const tx = await contractHandler.claimBatchEther([swap.id], values);
      await tx.wait(1);

      for (const v of valuesWithPreimageHash) {
        await expect(
          etherSwap.swaps(
            await etherSwap.hashValues(
              v.preimageHash,
              v.amount,
              await setup.signer.getAddress(),
              v.refundAddress,
              v.timelock,
            ),
          ),
        ).resolves.toEqual(false);
      }

      const label = await TransactionLabelRepository.getLabel(tx!.hash);
      expect(label!).not.toBeNull();
      expect(label!.id).toEqual(tx!.hash);
      expect(label!.symbol).toEqual(networks.Ethereum.symbol);
      expect(label!.label).toEqual(
        TransactionLabelRepository.claimBatchLabel([swap.id]),
      );
    });

    test('should batch claim Ether with commitment signatures', async () => {
      const zeroPreimageHash = Buffer.alloc(32);
      const values: BatchClaimValues[] = [
        {
          amount: 100n,
          timelock: 100,
          preimage: randomBytes(32),
          refundAddress: await setup.signer.getAddress(),
        },
        {
          amount: 200n,
          timelock: 101,
          preimage: randomBytes(32),
          refundAddress: await setup.signer.getAddress(),
        },
      ];
      const valuesWithPreimageHash = values.map((v) => ({
        ...v,
        preimageHash: crypto.sha256(v.preimage),
      }));

      let nonce = await setup.signer.getNonce();
      for (const v of valuesWithPreimageHash) {
        const tx = await etherSwap['lock(bytes32,address,uint256)'](
          zeroPreimageHash,
          await setup.signer.getAddress(),
          v.timelock,
          {
            nonce,
            value: v.amount,
          },
        );
        await tx.wait(1);
        nonce += 1;
      }

      const domain = await getEtherSwapDomain(setup.provider, etherSwap);
      const valuesWithCommitments: BatchClaimValues[] = [];
      for (const v of valuesWithPreimageHash) {
        const signatureRaw = await setup.signer.signTypedData(
          domain,
          etherSwapCommitTypes,
          {
            preimageHash: v.preimageHash,
            amount: v.amount,
            claimAddress: await setup.signer.getAddress(),
            refundAddress: v.refundAddress,
            timelock: v.timelock,
          },
        );
        const signature = Signature.from(signatureRaw);

        valuesWithCommitments.push({
          ...v,
          commitmentSignature: {
            v: signature.v,
            r: signature.r,
            s: signature.s,
          },
        });
      }

      await wait(150);
      const tx = await contractHandler.claimBatchEther(
        [swap.id],
        valuesWithCommitments,
      );
      await tx.wait(1);

      for (const v of valuesWithPreimageHash) {
        await expect(
          etherSwap.swaps(
            await etherSwap.hashValues(
              zeroPreimageHash,
              v.amount,
              await setup.signer.getAddress(),
              v.refundAddress,
              v.timelock,
            ),
          ),
        ).resolves.toEqual(false);
      }

      const label = await TransactionLabelRepository.getLabel(tx!.hash);
      expect(label!).not.toBeNull();
      expect(label!.label).toEqual(
        TransactionLabelRepository.claimBatchLabel([swap.id]),
      );
    });

    test('should batch claim Ether with mixed normal and commitment swaps', async () => {
      const zeroPreimageHash = Buffer.alloc(32);

      const normalSwap = {
        amount: 150n,
        timelock: 300,
        preimage: randomBytes(32),
        refundAddress: await setup.signer.getAddress(),
      };
      const normalSwapPreimageHash = crypto.sha256(normalSwap.preimage);

      const commitmentSwap = {
        amount: 250n,
        timelock: 301,
        preimage: randomBytes(32),
        refundAddress: await setup.signer.getAddress(),
      };
      const commitmentSwapPreimageHash = crypto.sha256(commitmentSwap.preimage);

      let nonce = await setup.signer.getNonce();
      const normalLockTx = await etherSwap['lock(bytes32,address,uint256)'](
        normalSwapPreimageHash,
        await setup.signer.getAddress(),
        normalSwap.timelock,
        {
          nonce,
          value: normalSwap.amount,
        },
      );
      await normalLockTx.wait(1);
      nonce += 1;

      const commitmentLockTx = await etherSwap['lock(bytes32,address,uint256)'](
        zeroPreimageHash,
        await setup.signer.getAddress(),
        commitmentSwap.timelock,
        {
          nonce,
          value: commitmentSwap.amount,
        },
      );
      await commitmentLockTx.wait(1);

      const signatureRaw = await setup.signer.signTypedData(
        await getEtherSwapDomain(setup.provider, etherSwap),
        etherSwapCommitTypes,
        {
          preimageHash: commitmentSwapPreimageHash,
          amount: commitmentSwap.amount,
          claimAddress: await setup.signer.getAddress(),
          refundAddress: commitmentSwap.refundAddress,
          timelock: commitmentSwap.timelock,
        },
      );
      const signature = Signature.from(signatureRaw);

      const batchValues: BatchClaimValues[] = [
        {
          ...normalSwap,
        },
        {
          ...commitmentSwap,
          commitmentSignature: {
            v: signature.v,
            r: signature.r,
            s: signature.s,
          },
        },
      ];

      await wait(150);
      const tx = await contractHandler.claimBatchEther([swap.id], batchValues);
      await tx.wait(1);

      await expect(
        etherSwap.swaps(
          await etherSwap.hashValues(
            normalSwapPreimageHash,
            normalSwap.amount,
            await setup.signer.getAddress(),
            normalSwap.refundAddress,
            normalSwap.timelock,
          ),
        ),
      ).resolves.toEqual(false);

      await expect(
        etherSwap.swaps(
          await etherSwap.hashValues(
            zeroPreimageHash,
            commitmentSwap.amount,
            await setup.signer.getAddress(),
            commitmentSwap.refundAddress,
            commitmentSwap.timelock,
          ),
        ),
      ).resolves.toEqual(false);

      const label = await TransactionLabelRepository.getLabel(tx!.hash);
      expect(label!).not.toBeNull();
      expect(label!.label).toEqual(
        TransactionLabelRepository.claimBatchLabel([swap.id]),
      );
    });

    test('should not batch claim when contract does not support it', async () => {
      const handler = new ContractHandler(networks.Ethereum);
      handler.init(
        new Set(),
        setup.provider,
        setup.signer,
        etherSwap,
        erc20Swap,
      );

      await expect(handler.claimBatchEther([], [])).rejects.toEqual(
        Errors.NOT_SUPPORTED_BY_CONTRACT_VERSION(),
      );
    });
  });

  test('should refund Ether', async () => {
    // Lockup again and sanity check
    await lockupEther(swap);

    expect(
      await querySwap(
        etherSwap,
        await hashEtherSwapValues(await setup.etherBase.getAddress()),
      ),
    ).toEqual(true);

    const transaction = await contractHandler.refundEther(
      swap,
      preimageHash,
      amount,
      await setup.etherBase.getAddress(),
      timelock,
    );
    await transaction.wait(1);

    expect(
      await querySwap(
        etherSwap,
        await hashEtherSwapValues(await setup.etherBase.getAddress()),
      ),
    ).toEqual(false);

    const label = await TransactionLabelRepository.getLabel(transaction!.hash);
    expect(label!).not.toBeNull();
    expect(label!.id).toEqual(transaction!.hash);
    expect(label!.symbol).toEqual(networks.Ethereum.symbol);
    expect(label!.label).toEqual(TransactionLabelRepository.refundLabel(swap));
  });

  test('should lockup ERC20 tokens', async () => {
    const tx = await lockupErc20(swap);

    expect(
      await querySwap(
        erc20Swap,
        await hashErc20SwapValues(await setup.etherBase.getAddress()),
      ),
    ).toEqual(true);

    const label = await TransactionLabelRepository.getLabel(tx!.hash);
    expect(label!).not.toBeNull();
    expect(label!.id).toEqual(tx!.hash);
    expect(label!.symbol).toEqual(erc20WalletProvider.symbol);
    expect(label!.label).toEqual(
      TransactionLabelRepository.lockupLabel(swap, false),
    );
  });

  test('should lockup ERC20 tokens with prepay miner fee', async () => {
    // For explanations check the "should lockup Ether with prepay miner fee" test
    const randomWallet = Wallet.createRandom().connect(setup.provider);

    expect(
      await setup.provider.getBalance(await randomWallet.getAddress()),
    ).toEqual(BigInt(0));

    const amountPrepay = BigInt(1);

    const feeData = await setup.provider.getFeeData();
    const approveTransaction = await tokenContract.approve(
      await erc20Swap.getAddress(),
      amount,
      {
        type: 2,
        maxFeePerGas: feeData.maxFeePerGas!,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas!,
      },
    );
    await approveTransaction.wait(1);

    const transaction = await contractHandler.lockupTokenPrepayMinerfee(
      swap,
      erc20WalletProvider,
      preimageHash,
      amount,
      amountPrepay,
      randomWallet.address,
      timelock,
    );
    await transaction.wait(1);

    expect(Number(transaction.gasLimit)).toBeLessThan(200000);

    expect(
      await setup.provider.getBalance(await randomWallet.getAddress()),
    ).toEqual(amountPrepay);

    expect(
      await querySwap(
        erc20Swap,
        await hashErc20SwapValues(randomWallet.address),
      ),
    ).toEqual(true);

    const label = await TransactionLabelRepository.getLabel(transaction!.hash);
    expect(label!).not.toBeNull();
    expect(label!.id).toEqual(transaction!.hash);
    expect(label!.symbol).toEqual(erc20WalletProvider.symbol);
    expect(label!.label).toEqual(
      TransactionLabelRepository.lockupLabel(swap, true),
    );
  });

  test('should claim ERC20 tokens', async () => {
    const transaction = await contractHandlerEtherBase.claimToken(
      swap,
      erc20WalletProvider,
      preimage,
      amount,
      await setup.signer.getAddress(),
      timelock,
    );
    await transaction.wait(1);

    expect(
      await querySwap(
        erc20Swap,
        await hashErc20SwapValues(await setup.etherBase.getAddress()),
      ),
    ).toEqual(false);

    const label = await TransactionLabelRepository.getLabel(transaction!.hash);
    expect(label!).not.toBeNull();
    expect(label!.id).toEqual(transaction!.hash);
    expect(label!.symbol).toEqual(erc20WalletProvider.symbol);
    expect(label!.label).toEqual(TransactionLabelRepository.claimLabel(swap));
  });

  test('should claim ERC20 tokens with commitment signature', async () => {
    const commitmentSwap = {
      id: 'commitmentToken',
      type: SwapType.Submarine,
    } as AnySwap;
    const commitmentPreimage = randomBytes(32);
    const commitmentPreimageHash = crypto.sha256(commitmentPreimage);
    const zeroPreimageHash = Buffer.alloc(32);
    const commitmentAmount = BigInt(10) ** BigInt(16);
    const commitmentTimelock = await setup.provider.getBlockNumber();

    await wait(150);

    const feeData = await setup.provider.getFeeData();
    const approveTransaction = await tokenContract.approve(
      await erc20Swap.getAddress(),
      commitmentAmount,
      {
        type: 2,
        maxFeePerGas: feeData.maxFeePerGas!,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas!,
      },
    );
    await approveTransaction.wait(1);

    const lockupTx = await contractHandler.lockupToken(
      commitmentSwap,
      erc20WalletProvider,
      zeroPreimageHash,
      commitmentAmount,
      await setup.etherBase.getAddress(),
      commitmentTimelock,
    );
    await lockupTx.wait(1);
    await wait(150);

    const tokenAddress = await tokenContract.getAddress();
    const claimAddress = await setup.etherBase.getAddress();
    const refundAddress = await setup.signer.getAddress();

    const signatureRaw = await setup.signer.signTypedData(
      await getErc20SwapDomain(setup.provider, erc20Swap),
      erc20SwapCommitTypes,
      {
        preimageHash: commitmentPreimageHash,
        amount: commitmentAmount,
        tokenAddress,
        claimAddress,
        refundAddress,
        timelock: commitmentTimelock,
      },
    );

    const lockupHash = await computeLockupHash(erc20Swap, {
      preimageHash: zeroPreimageHash,
      amount: commitmentAmount,
      claimAddress,
      refundAddress,
      timelock: BigInt(commitmentTimelock),
      tokenAddress,
    });

    await CommitmentRepository.create({
      swapId: commitmentSwap.id,
      lockupHash,
      transactionHash: lockupTx.hash,
      signature: getHexBuffer(signatureRaw.slice(2)),
    });

    const claimTx = await contractHandlerEtherBase.claimToken(
      commitmentSwap,
      erc20WalletProvider,
      commitmentPreimage,
      commitmentAmount,
      await setup.signer.getAddress(),
      commitmentTimelock,
    );
    await claimTx.wait(1);

    const swapHash = await erc20Swap.hashValues(
      zeroPreimageHash,
      commitmentAmount,
      await tokenContract.getAddress(),
      await setup.etherBase.getAddress(),
      await setup.signer.getAddress(),
      commitmentTimelock,
    );
    expect(await erc20Swap.swaps(swapHash)).toEqual(false);

    const label = await TransactionLabelRepository.getLabel(claimTx.hash);
    expect(label!).not.toBeNull();
    expect(label!.label).toEqual(
      TransactionLabelRepository.claimLabel(commitmentSwap),
    );
  });

  describe('claimBatchToken', () => {
    test('should batch claim ERC20 tokens', async () => {
      const values: BatchClaimValues[] = [
        {
          amount: 21n,
          timelock: 1,
          preimage: randomBytes(32),
          refundAddress: await setup.signer.getAddress(),
        },
        {
          amount: 42n,
          timelock: 2,
          preimage: randomBytes(32),
          refundAddress: await setup.signer.getAddress(),
        },
      ];
      const valuesWithPreimageHash = values.map((v) => ({
        ...v,
        preimageHash: crypto.sha256(v.preimage),
      }));

      let nonce = await setup.signer.getNonce();
      const approveTx = await tokenContract.approve(
        await erc20Swap.getAddress(),
        values.reduce((sum, { amount }) => sum + amount, 0n),
        {
          nonce,
        },
      );
      await approveTx.wait(1);
      nonce += 1;

      for (const v of valuesWithPreimageHash) {
        const tx = await erc20Swap[
          'lock(bytes32,uint256,address,address,uint256)'
        ](
          v.preimageHash,
          v.amount,
          await tokenContract.getAddress(),
          await setup.signer.getAddress(),
          v.timelock,
          {
            nonce,
          },
        );
        await tx.wait(1);

        nonce += 1;
      }

      await wait(150);
      const tx = await contractHandler.claimBatchToken(
        [swap.id],
        erc20WalletProvider,
        values,
      );
      await tx.wait(1);

      for (const v of valuesWithPreimageHash) {
        await expect(
          erc20Swap.swaps(
            await erc20Swap.hashValues(
              v.preimageHash,
              v.amount,
              await tokenContract.getAddress(),
              await setup.signer.getAddress(),
              v.refundAddress,
              v.timelock,
            ),
          ),
        ).resolves.toEqual(false);
      }

      const label = await TransactionLabelRepository.getLabel(tx!.hash);
      expect(label!).not.toBeNull();
      expect(label!.id).toEqual(tx!.hash);
      expect(label!.symbol).toEqual(erc20WalletProvider.symbol);
      expect(label!.label).toEqual(
        TransactionLabelRepository.claimBatchLabel([swap.id]),
      );
    });

    test('should batch claim ERC20 tokens with commitment signatures', async () => {
      const zeroPreimageHash = Buffer.alloc(32);
      const values: BatchClaimValues[] = [
        {
          amount: 100n,
          timelock: 200,
          preimage: randomBytes(32),
          refundAddress: await setup.signer.getAddress(),
        },
        {
          amount: 200n,
          timelock: 201,
          preimage: randomBytes(32),
          refundAddress: await setup.signer.getAddress(),
        },
      ];
      const valuesWithPreimageHash = values.map((v) => ({
        ...v,
        preimageHash: crypto.sha256(v.preimage),
      }));

      let nonce = await setup.signer.getNonce();
      const approveTx = await tokenContract.approve(
        await erc20Swap.getAddress(),
        values.reduce((sum, { amount }) => sum + amount, 0n),
        { nonce },
      );
      await approveTx.wait(1);
      nonce += 1;

      for (const v of valuesWithPreimageHash) {
        const tx = await erc20Swap[
          'lock(bytes32,uint256,address,address,uint256)'
        ](
          zeroPreimageHash,
          v.amount,
          await tokenContract.getAddress(),
          await setup.signer.getAddress(),
          v.timelock,
          { nonce },
        );
        await tx.wait(1);
        nonce += 1;
      }

      const domain = await getErc20SwapDomain(setup.provider, erc20Swap);
      const valuesWithCommitments: BatchClaimValues[] = [];
      for (const v of valuesWithPreimageHash) {
        const signatureRaw = await setup.signer.signTypedData(
          domain,
          erc20SwapCommitTypes,
          {
            preimageHash: v.preimageHash,
            amount: v.amount,
            tokenAddress: await tokenContract.getAddress(),
            claimAddress: await setup.signer.getAddress(),
            refundAddress: v.refundAddress,
            timelock: v.timelock,
          },
        );
        const signature = Signature.from(signatureRaw);

        valuesWithCommitments.push({
          ...v,
          commitmentSignature: {
            v: signature.v,
            r: signature.r,
            s: signature.s,
          },
        });
      }

      await wait(150);
      const tx = await contractHandler.claimBatchToken(
        [swap.id],
        erc20WalletProvider,
        valuesWithCommitments,
      );
      await tx.wait(1);

      for (const v of valuesWithPreimageHash) {
        await expect(
          erc20Swap.swaps(
            await erc20Swap.hashValues(
              zeroPreimageHash,
              v.amount,
              await tokenContract.getAddress(),
              await setup.signer.getAddress(),
              v.refundAddress,
              v.timelock,
            ),
          ),
        ).resolves.toEqual(false);
      }

      const label = await TransactionLabelRepository.getLabel(tx!.hash);
      expect(label!).not.toBeNull();
      expect(label!.label).toEqual(
        TransactionLabelRepository.claimBatchLabel([swap.id]),
      );
    });

    test('should batch claim ERC20 tokens with mixed normal and commitment swaps', async () => {
      const zeroPreimageHash = Buffer.alloc(32);

      const normalSwap = {
        amount: 150n,
        timelock: 400,
        preimage: randomBytes(32),
        refundAddress: await setup.signer.getAddress(),
      };
      const normalSwapPreimageHash = crypto.sha256(normalSwap.preimage);

      const commitmentSwap = {
        amount: 250n,
        timelock: 401,
        preimage: randomBytes(32),
        refundAddress: await setup.signer.getAddress(),
      };
      const commitmentSwapPreimageHash = crypto.sha256(commitmentSwap.preimage);

      let nonce = await setup.signer.getNonce();
      const approveTx = await tokenContract.approve(
        await erc20Swap.getAddress(),
        normalSwap.amount + commitmentSwap.amount,
        { nonce },
      );
      await approveTx.wait(1);
      nonce += 1;

      const normalLockTx = await erc20Swap[
        'lock(bytes32,uint256,address,address,uint256)'
      ](
        normalSwapPreimageHash,
        normalSwap.amount,
        await tokenContract.getAddress(),
        await setup.signer.getAddress(),
        normalSwap.timelock,
        { nonce },
      );
      await normalLockTx.wait(1);
      nonce += 1;

      const commitmentLockTx = await erc20Swap[
        'lock(bytes32,uint256,address,address,uint256)'
      ](
        zeroPreimageHash,
        commitmentSwap.amount,
        await tokenContract.getAddress(),
        await setup.signer.getAddress(),
        commitmentSwap.timelock,
        { nonce },
      );
      await commitmentLockTx.wait(1);

      const signatureRaw = await setup.signer.signTypedData(
        await getErc20SwapDomain(setup.provider, erc20Swap),
        erc20SwapCommitTypes,
        {
          preimageHash: commitmentSwapPreimageHash,
          amount: commitmentSwap.amount,
          tokenAddress: await tokenContract.getAddress(),
          claimAddress: await setup.signer.getAddress(),
          refundAddress: commitmentSwap.refundAddress,
          timelock: commitmentSwap.timelock,
        },
      );
      const signature = Signature.from(signatureRaw);

      const batchValues: BatchClaimValues[] = [
        {
          ...normalSwap,
        },
        {
          ...commitmentSwap,
          commitmentSignature: {
            v: signature.v,
            r: signature.r,
            s: signature.s,
          },
        },
      ];

      await wait(150);
      const tx = await contractHandler.claimBatchToken(
        [swap.id],
        erc20WalletProvider,
        batchValues,
      );
      await tx.wait(1);

      await expect(
        erc20Swap.swaps(
          await erc20Swap.hashValues(
            normalSwapPreimageHash,
            normalSwap.amount,
            await tokenContract.getAddress(),
            await setup.signer.getAddress(),
            normalSwap.refundAddress,
            normalSwap.timelock,
          ),
        ),
      ).resolves.toEqual(false);

      await expect(
        erc20Swap.swaps(
          await erc20Swap.hashValues(
            zeroPreimageHash,
            commitmentSwap.amount,
            await tokenContract.getAddress(),
            await setup.signer.getAddress(),
            commitmentSwap.refundAddress,
            commitmentSwap.timelock,
          ),
        ),
      ).resolves.toEqual(false);

      const label = await TransactionLabelRepository.getLabel(tx!.hash);
      expect(label!).not.toBeNull();
      expect(label!.label).toEqual(
        TransactionLabelRepository.claimBatchLabel([swap.id]),
      );
    });

    test('should not batch claim when contract does not support it', async () => {
      const handler = new ContractHandler(networks.Ethereum);
      handler.init(
        new Set(),
        setup.provider,
        setup.signer,
        etherSwap,
        erc20Swap,
      );

      await expect(
        handler.claimBatchToken([], erc20WalletProvider, []),
      ).rejects.toEqual(Errors.NOT_SUPPORTED_BY_CONTRACT_VERSION());
    });
  });

  test('should refund ERC20 tokens', async () => {
    // Lockup again and sanity check
    await lockupErc20(swap);
    await wait(150);

    expect(
      await querySwap(
        erc20Swap,
        await hashErc20SwapValues(await setup.etherBase.getAddress()),
      ),
    ).toEqual(true);

    const transaction = await contractHandler.refundToken(
      swap,
      erc20WalletProvider,
      preimageHash,
      amount,
      await setup.etherBase.getAddress(),
      timelock,
    );
    await transaction.wait(1);

    expect(
      await querySwap(
        erc20Swap,
        await hashErc20SwapValues(await setup.etherBase.getAddress()),
      ),
    ).toEqual(false);

    const label = await TransactionLabelRepository.getLabel(transaction!.hash);
    expect(label!).not.toBeNull();
    expect(label!.id).toEqual(transaction!.hash);
    expect(label!.symbol).toEqual(erc20WalletProvider.symbol);
    expect(label!.label).toEqual(TransactionLabelRepository.refundLabel(swap));
  });
});
