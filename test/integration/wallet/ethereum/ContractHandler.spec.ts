import { randomBytes } from 'crypto';
import { crypto } from 'bitcoinjs-lib';
import { EtherSwap } from 'boltz-core/typechain/EtherSwap';
import { ERC20Swap } from 'boltz-core/typechain/ERC20Swap';
import { BigNumber, ContractTransaction, utils } from 'ethers';
import Logger from '../../../../lib/Logger';
import ContractHandler from '../../../../lib/wallet/ethereum/ContractHandler';
import ERC20WalletProvider from '../../../../lib/wallet/providers/ERC20WalletProvider';
import { fundSignerWallet, getSigner, getSwapContracts, getTokenContract } from '../EthereumTools';

describe('ContractHandler', () => {
  const { signer, provider, etherBase } = getSigner();

  const tokenContract = getTokenContract(signer);
  const { etherSwap, erc20Swap } = getSwapContracts(signer);

  const erc20WalletProvider = new ERC20WalletProvider(
    Logger.disabledLogger,
    signer,
    {
      decimals: 18,
      symbol: 'TRC',
      contract: tokenContract,
    },
  );

  const contractHandler = new ContractHandler(Logger.disabledLogger);
  const contractHandlerEtherBase = new ContractHandler(Logger.disabledLogger);

  contractHandler.init(etherSwap, erc20Swap);
  contractHandlerEtherBase.init(etherSwap.connect(etherBase), erc20Swap.connect(etherBase));

  const amount = BigNumber.from(10).pow(17);
  const preimage = randomBytes(32);
  const preimageHash = crypto.sha256(preimage);

  let timelock: number;

  const waitForTransaction = async (transaction: ContractTransaction) => {
    return transaction.wait(1);
  };

  const hashEtherSwapValues = async () => {
    return utils.solidityKeccak256(
      ['bytes32', 'uint', 'address', 'address', 'uint'],
      [
        preimageHash,
        amount,
        await etherBase.getAddress(),
        await signer.getAddress(),
        timelock,
      ],
    );
  };

  const hashErc20SwapValues = async () => {
    return utils.solidityKeccak256(
      ['bytes32', 'uint', 'address', 'address', 'address', 'uint'],
      [
        preimageHash,
        amount,
        tokenContract.address,
        await etherBase.getAddress(),
        await signer.getAddress(),
        timelock,
      ],
    );
  };


  const querySwap = async (contract: EtherSwap | ERC20Swap, hash: string) => {
    return await contract.swaps(hash);
  };

  const lockupEther = async () => {
    const transaction = await contractHandler.lockupEther(
      preimageHash,
      amount,
      await etherBase.getAddress(),
      timelock,
    );

    await waitForTransaction(transaction);
  };

  const lockupErc20 = async () => {
    const approveTransaction = await tokenContract.approve(erc20Swap.address, amount);

    const transaction = await contractHandler.lockupToken(
      erc20WalletProvider,
      preimageHash,
      amount,
      await etherBase.getAddress(),
      timelock,
    );

    await Promise.all([
      waitForTransaction(approveTransaction),
      waitForTransaction(transaction),
    ]);
  };

  beforeAll(async () => {
    timelock = await provider.getBlockNumber();

    await fundSignerWallet(signer, etherBase, tokenContract);
  });

  test('should lockup Ether', async () => {
    await lockupEther();

    expect(await querySwap(
      etherSwap,
      await hashEtherSwapValues(),
    )).toEqual(true);
  });

  test('should claim Ether', async () => {
    const transaction = await contractHandlerEtherBase.claimEther(
      preimage,
      amount,
      await signer.getAddress(),
      timelock,
    );
    await waitForTransaction(transaction);

    expect(await querySwap(
      etherSwap,
      await hashEtherSwapValues(),
    )).toEqual(false);
  });

  test('should refund Ether', async () => {
    // Lockup again and sanity check
    await lockupEther();

    expect(await querySwap(
      etherSwap,
      await hashEtherSwapValues(),
    )).toEqual(true);

    const transactionHash = await contractHandler.refundEther(
      preimageHash,
      amount,
      await etherBase.getAddress(),
      timelock,
    );
    await waitForTransaction(transactionHash);

    expect(await querySwap(
      etherSwap,
      await hashEtherSwapValues(),
    )).toEqual(false);
  });

  test('should lockup ERC20 tokens', async () => {
    await lockupErc20();

    expect(await querySwap(
      erc20Swap,
      await hashErc20SwapValues(),
    )).toEqual(true);
  });

  test('should claim ERC20 tokens', async () => {
    const transactionHash = await contractHandlerEtherBase.claimToken(
      erc20WalletProvider,
      preimage,
      amount,
      await signer.getAddress(),
      timelock,
    );
    await waitForTransaction(transactionHash);

    expect(await querySwap(
      erc20Swap,
      await hashErc20SwapValues(),
    )).toEqual(false);
  });

  test('should refund ERC20 tokens', async () => {
    // Lockup again and sanity check
    await lockupErc20();

    expect(await querySwap(
      erc20Swap,
      await hashErc20SwapValues(),
    )).toEqual(true);

    const transactionHash = await contractHandler.refundToken(
      erc20WalletProvider,
      preimageHash,
      amount,
      await etherBase.getAddress(),
      timelock,
    );
    await waitForTransaction(transactionHash);

    expect(await querySwap(
      erc20Swap,
      await hashErc20SwapValues(),
    )).toEqual(false);
  });

  afterAll(async () => {
    await provider.destroy();
  });
});

