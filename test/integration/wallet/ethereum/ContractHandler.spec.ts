import { BigNumber } from 'ethers';
import { randomBytes } from 'crypto';
import { crypto } from 'bitcoinjs-lib';
import Logger from '../../../../lib/Logger';
import { etherDecimals } from '../../../../lib/consts/Consts';
import ContractHandler from '../../../../lib/wallet/ethereum/ContractHandler';
import { getSigner, getSwapContracts, getTokenContract } from '../EthereumTools';
import ERC20WalletProvider from '../../../../lib/wallet/providers/ERC20WalletProvider';
import { EtherSwap } from 'boltz-core/typechain/EtherSwap';
import { Erc20Swap } from 'boltz-core/typechain/Erc20Swap';

describe('ContractHandler', () => {
  const { signer, provider } = getSigner();

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

  const contractHandler = new ContractHandler(
    Logger.disabledLogger,
    etherSwap,
    erc20Swap,
  );

  const amount = 1;
  const preimage = randomBytes(32);
  const preimageHash = crypto.sha256(preimage);

  let timelock: number;

  const waitForTransaction = async (transactionHash: string) => {
    return (await provider.getTransaction(transactionHash)).wait(1);
  };

  const verifySwapEmpty = async (contract: EtherSwap | Erc20Swap) => {
    const swap = await contract.swaps(preimageHash);
    expect(swap.amount).toEqual(BigNumber.from(0));
  };

  const lockupEther = async () => {
    const transactionHash = await contractHandler.lockupEther(
      preimageHash,
      await signer.getAddress(),
      timelock,
      amount,
    );

    await waitForTransaction(transactionHash);
  };

  const lockupErc20 = async () => {
    await (await tokenContract.approve(erc20Swap.address, erc20WalletProvider.formatTokenAmount(amount))).wait(1);

    const transactionHash = await contractHandler.lockupToken(
      erc20WalletProvider,
      preimageHash,
      amount,
      await signer.getAddress(),
      timelock,
    );

    await waitForTransaction(transactionHash);
  };

  beforeAll(async () => {
    timelock = await provider.getBlockNumber();
  });

  test('should lockup Ether', async () => {
    await lockupEther();

    const swap = await etherSwap.swaps(preimageHash);

    expect(swap.timelock.toNumber()).toEqual(timelock);
    expect(swap.claimAddress).toEqual(await signer.getAddress());
    expect(swap.refundAddress).toEqual(await signer.getAddress());
    expect(swap.amount).toEqual(BigNumber.from(amount).mul(etherDecimals));
  });

  test('should claim Ether', async () => {
    const transactionHash = await contractHandler.claimEther(preimage);
    await waitForTransaction(transactionHash);

    await verifySwapEmpty(etherSwap);
  });

  test('should refund Ether', async () => {
    await lockupEther();

    const transactionHash = await contractHandler.refundEther(preimageHash);
    await waitForTransaction(transactionHash);

    await verifySwapEmpty(etherSwap);
  });

  test('should lockup ERC20 tokens', async () => {
    await lockupErc20();

    const swap = await erc20Swap.swaps(preimageHash);

    expect(swap.timelock.toNumber()).toEqual(timelock);
    expect(swap.erc20Token).toEqual(tokenContract.address);
    expect(swap.claimAddress).toEqual(await signer.getAddress());
    expect(swap.refundAddress).toEqual(await signer.getAddress());
    expect(swap.amount).toEqual(erc20WalletProvider.formatTokenAmount(amount));
  });

  test('should claim ERC20 tokens', async () => {
    const transactionHash = await contractHandler.claimToken(erc20WalletProvider, preimage);
    await waitForTransaction(transactionHash);

    await verifySwapEmpty(erc20Swap);
  });

  test('should refund ERC20 tokens', async () => {
    await lockupErc20();

    const transactionHash = await contractHandler.refundToken(erc20WalletProvider, preimageHash);
    await waitForTransaction(transactionHash);

    await verifySwapEmpty(erc20Swap);
  });
});
