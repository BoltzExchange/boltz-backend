import { crypto } from 'bitcoinjs-lib';
import { ERC20 } from 'boltz-core/typechain/ERC20';
import { ERC20Swap } from 'boltz-core/typechain/ERC20Swap';
import { EtherSwap } from 'boltz-core/typechain/EtherSwap';
import { randomBytes } from 'crypto';
import { Wallet } from 'ethers';
import Logger from '../../../../lib/Logger';
import { SwapType } from '../../../../lib/consts/Enums';
import { AnySwap } from '../../../../lib/consts/Types';
import Database from '../../../../lib/db/Database';
import TransactionLabel from '../../../../lib/db/models/TransactionLabel';
import TransactionLabelRepository from '../../../../lib/db/repositories/TransactionLabelRepository';
import ContractHandler from '../../../../lib/wallet/ethereum/ContractHandler';
import { Ethereum } from '../../../../lib/wallet/ethereum/EvmNetworks';
import ERC20WalletProvider from '../../../../lib/wallet/providers/ERC20WalletProvider';
import {
  EthereumSetup,
  fundSignerWallet,
  getContracts,
  getSigner,
} from '../EthereumTools';

describe('ContractHandler', () => {
  let database: Database;
  let setup: EthereumSetup;

  let etherSwap: EtherSwap;
  let erc20Swap: ERC20Swap;
  let tokenContract: ERC20;

  let erc20WalletProvider: ERC20WalletProvider;

  const contractHandler = new ContractHandler(Ethereum);
  const contractHandlerEtherBase = new ContractHandler(Ethereum);

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

    contractHandler.init(setup.provider, etherSwap, erc20Swap);
    contractHandlerEtherBase.init(
      setup.provider,
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
    await database.close();
  });

  test('should lockup Ether', async () => {
    const tx = await lockupEther(swap);

    expect(
      await querySwap(
        etherSwap,
        await hashEtherSwapValues(await setup.etherBase.getAddress()),
      ),
    ).toEqual(true);

    const label = await TransactionLabel.findOne({
      where: {
        id: tx!.hash,
      },
    });
    expect(label!).not.toBeNull();
    expect(label!.id).toEqual(tx!.hash);
    expect(label!.symbol).toEqual(Ethereum.symbol);
    expect(label!.label).toEqual(
      TransactionLabelRepository.lockupLabel(swap, false),
    );
  });

  test('should lockup Ether with prepay miner fee', async () => {
    const randomWallet = Wallet.createRandom().connect(setup.provider);

    expect(
      await setup.provider.getBalance(await randomWallet.getAddress()),
    ).toEqual(BigInt(0));

    const amountPrepay = BigInt(1);

    const transaction = await contractHandler.lockupEtherPrepayMinerfee(
      swap,
      preimageHash,
      amount,
      amountPrepay,
      randomWallet.address,
      timelock,
    );
    await transaction.wait(1);

    // Sanity check the gas limit
    expect(Number(transaction.gasLimit)).toBeLessThan(150000);

    // Check that the prepay amount was forwarded to the claim address
    expect(
      await setup.provider.getBalance(await randomWallet.getAddress()),
    ).toEqual(amountPrepay);

    // Make sure the funds were locked in the contract
    expect(
      await querySwap(
        etherSwap,
        await hashEtherSwapValues(randomWallet.address),
      ),
    ).toEqual(true);

    const label = await TransactionLabel.findOne({
      where: {
        id: transaction!.hash,
      },
    });
    expect(label!).not.toBeNull();
    expect(label!.id).toEqual(transaction!.hash);
    expect(label!.symbol).toEqual(Ethereum.symbol);
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

    const label = await TransactionLabel.findOne({
      where: {
        id: transaction!.hash,
      },
    });
    expect(label!).not.toBeNull();
    expect(label!.id).toEqual(transaction!.hash);
    expect(label!.symbol).toEqual(Ethereum.symbol);
    expect(label!.label).toEqual(TransactionLabelRepository.claimLabel(swap));
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

    const label = await TransactionLabel.findOne({
      where: {
        id: transaction!.hash,
      },
    });
    expect(label!).not.toBeNull();
    expect(label!.id).toEqual(transaction!.hash);
    expect(label!.symbol).toEqual(Ethereum.symbol);
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

    const label = await TransactionLabel.findOne({
      where: {
        id: tx!.hash,
      },
    });
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

    const label = await TransactionLabel.findOne({
      where: {
        id: transaction!.hash,
      },
    });
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

    const label = await TransactionLabel.findOne({
      where: {
        id: transaction!.hash,
      },
    });
    expect(label!).not.toBeNull();
    expect(label!.id).toEqual(transaction!.hash);
    expect(label!.symbol).toEqual(erc20WalletProvider.symbol);
    expect(label!.label).toEqual(TransactionLabelRepository.claimLabel(swap));
  });

  test('should refund ERC20 tokens', async () => {
    // Lockup again and sanity check
    await lockupErc20(swap);

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

    const label = await TransactionLabel.findOne({
      where: {
        id: transaction!.hash,
      },
    });
    expect(label!).not.toBeNull();
    expect(label!.id).toEqual(transaction!.hash);
    expect(label!.symbol).toEqual(erc20WalletProvider.symbol);
    expect(label!.label).toEqual(TransactionLabelRepository.refundLabel(swap));
  });
});
