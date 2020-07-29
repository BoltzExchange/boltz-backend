import { EtherSwap } from 'boltz-core/typechain/EtherSwap';
import { Erc20Swap } from 'boltz-core/typechain/Erc20Swap';
import { ERC20SwapValues, EtherSwapValues } from './ContractEventHandler';

const noLockupFoundError = 'no lockup transaction found';

export const queryEtherSwapValues = async (etherSwap: EtherSwap, preimageHash: Buffer): Promise<EtherSwapValues> => {
  const events = await etherSwap.queryFilter(
    etherSwap.filters.Lockup(preimageHash, null, null, null),
  );

  if (events.length === 0) {
    throw noLockupFoundError;
  }

  const event = events[0];
  const lockupTransaction = await etherSwap.provider.getTransaction(event.transactionHash);

  return {
    preimageHash,
    amount: event.args!.amount,
    claimAddress: event.args!.claimAddress,
    refundAddress: lockupTransaction.from,
    timelock: event.args!.timelock.toNumber(),
  };
};

export const queryERC20SwapValues = async (erc20Swap: Erc20Swap, preimageHash: Buffer): Promise<ERC20SwapValues> => {
  const events = await erc20Swap.queryFilter(
    erc20Swap.filters.Lockup(preimageHash, null, null, null, null),
  );

  if (events.length === 0) {
    throw noLockupFoundError;
  }

  const event = events[0];
  const lockupTransaction = await erc20Swap.provider.getTransaction(event.transactionHash);

  return {
    preimageHash,
    amount: event.args!.amount,
    tokenAddress: event.args!.tokenAddress,
    claimAddress: event.args!.claimAddress,
    refundAddress: lockupTransaction.from,
    timelock: event.args!.timelock.toNumber(),
  };
};
