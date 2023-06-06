import { randomBytes } from 'crypto';
import { crypto } from 'bitcoinjs-lib';
import { ERC20 } from 'boltz-core/typechain/ERC20';
import { Wallet } from 'ethers';
import { EtherSwap } from 'boltz-core/typechain/EtherSwap';
import { ERC20Swap } from 'boltz-core/typechain/ERC20Swap';
import Logger from '../../../../lib/Logger';
import { getContracts } from '../../../../lib/cli/ethereum/EthereumUtils';
import ContractHandler from '../../../../lib/wallet/ethereum/ContractHandler';
import { EthereumSetup, fundSignerWallet, getSigner } from '../EthereumTools';
import ERC20WalletProvider from '../../../../lib/wallet/providers/ERC20WalletProvider';

describe('ContractHandler', () => {
  let setup: EthereumSetup;

  let etherSwap: EtherSwap;
  let erc20Swap: ERC20Swap;
  let tokenContract: ERC20;

  let erc20WalletProvider: ERC20WalletProvider;

  const contractHandler = new ContractHandler(Logger.disabledLogger);
  const contractHandlerEtherBase = new ContractHandler(Logger.disabledLogger);

  const amount = BigInt(10) ** BigInt(17);
  const preimage = randomBytes(32);
  const preimageHash = crypto.sha256(preimage);

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

  const lockupEther = async () => {
    const transaction = await contractHandler.lockupEther(
      preimageHash,
      amount,
      await setup.etherBase.getAddress(),
      timelock,
    );

    await transaction.wait(1);
  };

  const lockupErc20 = async () => {
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
      erc20WalletProvider,
      preimageHash,
      amount,
      await setup.etherBase.getAddress(),
      timelock,
    );
    await transaction.wait(1);
  };

  beforeAll(async () => {
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

  test('should lockup Ether', async () => {
    await lockupEther();

    expect(
      await querySwap(
        etherSwap,
        await hashEtherSwapValues(await setup.etherBase.getAddress()),
      ),
    ).toEqual(true);
  });

  test('should lockup Ether with prepay miner fee', async () => {
    const randomWallet = Wallet.createRandom().connect(setup.provider);

    expect(
      await setup.provider.getBalance(await randomWallet.getAddress()),
    ).toEqual(BigInt(0));

    const amountPrepay = BigInt(1);

    const transaction = await contractHandler.lockupEtherPrepayMinerfee(
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
  });

  test('should claim Ether', async () => {
    const transaction = await contractHandlerEtherBase.claimEther(
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
  });

  test('should refund Ether', async () => {
    // Lockup again and sanity check
    await lockupEther();

    expect(
      await querySwap(
        etherSwap,
        await hashEtherSwapValues(await setup.etherBase.getAddress()),
      ),
    ).toEqual(true);

    const transaction = await contractHandler.refundEther(
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
  });

  test('should lockup ERC20 tokens', async () => {
    await lockupErc20();

    expect(
      await querySwap(
        erc20Swap,
        await hashErc20SwapValues(await setup.etherBase.getAddress()),
      ),
    ).toEqual(true);
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
  });

  test('should claim ERC20 tokens', async () => {
    const transaction = await contractHandlerEtherBase.claimToken(
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
  });

  test('should refund ERC20 tokens', async () => {
    // Lockup again and sanity check
    await lockupErc20();

    expect(
      await querySwap(
        erc20Swap,
        await hashErc20SwapValues(await setup.etherBase.getAddress()),
      ),
    ).toEqual(true);

    const transaction = await contractHandler.refundToken(
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
  });

  afterAll(async () => {
    setup.provider.destroy();
  });
});
