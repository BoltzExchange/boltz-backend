import type {
  ERC20Swap,
  LockupEvent as ERC20SwapLockupEvent,
} from 'boltz-core/typechain/ERC20Swap';
import type {
  EtherSwap,
  LockupEvent as EtherSwapLockupEvent,
} from 'boltz-core/typechain/EtherSwap';
import type { Provider, Result } from 'ethers';
import type { ERC20SwapValues, EtherSwapValues } from '../../../consts/Types';
import Errors from '../Errors';
import { parseBuffer } from '../EthereumUtils';

// TODO: what happens if the hash doesn't exist or the transaction isn't confirmed yet?

export const queryEtherSwapValuesFromLock = async (
  provider: Provider,
  etherSwap: EtherSwap,
  lockTransactionHash: string,
): Promise<EtherSwapValues> => {
  const lockTransactionReceipt =
    await provider.getTransactionReceipt(lockTransactionHash);

  const topicHash = etherSwap.filters.Lockup().fragment.topicHash;

  if (lockTransactionReceipt) {
    for (const log of lockTransactionReceipt.logs) {
      if (log.topics[0] === topicHash) {
        const event = etherSwap.interface.parseLog(log as any);
        // @ts-ignore
        return formatEtherSwapValues(event!.args);
      }
    }
  }

  throw Errors.INVALID_LOCKUP_TRANSACTION(lockTransactionHash);
};

export const queryERC20SwapValuesFromLock = async (
  provider: Provider,
  erc20Swap: ERC20Swap,
  lockTransactionHash: string,
): Promise<ERC20SwapValues> => {
  const lockTransactionReceipt =
    await provider.getTransactionReceipt(lockTransactionHash);

  const topicHash = erc20Swap.filters.Lockup().fragment.topicHash;

  if (lockTransactionReceipt) {
    for (const log of lockTransactionReceipt.logs) {
      if (log.topics[0] === topicHash) {
        const event = erc20Swap.interface.parseLog(log as any);
        // @ts-ignore
        return formatERC20SwapValues(event!.args);
      }
    }
  }

  throw Errors.INVALID_LOCKUP_TRANSACTION(lockTransactionHash);
};

export const queryEtherSwapValues = async (
  etherSwap: EtherSwap,
  preimageHash: Buffer,
  startHeight?: number,
): Promise<EtherSwapValues> => {
  const events = await etherSwap.queryFilter(
    etherSwap.filters.Lockup(preimageHash),
    startHeight,
  );

  if (events.length === 0) {
    throw Errors.NO_LOCKUP_FOUND();
  }

  const event = events[0];

  return formatEtherSwapValues(event.args!);
};

export const queryERC20SwapValues = async (
  erc20Swap: ERC20Swap,
  preimageHash: Buffer,
  startHeight?: number,
): Promise<ERC20SwapValues> => {
  const events = await erc20Swap.queryFilter(
    erc20Swap.filters.Lockup(preimageHash),
    startHeight,
  );

  if (events.length === 0) {
    throw Errors.NO_LOCKUP_FOUND();
  }

  const event = events[0];

  return formatERC20SwapValues(event.args!);
};

export const formatEtherSwapValues = (
  args: Result | EtherSwapLockupEvent.OutputObject,
): EtherSwapValues => {
  return {
    amount: args.amount,
    claimAddress: args.claimAddress,
    refundAddress: args.refundAddress,
    timelock: Number(args.timelock),
    preimageHash: parseBuffer(args.preimageHash),
  };
};

export const formatERC20SwapValues = (
  args: Result | ERC20SwapLockupEvent.OutputObject,
): ERC20SwapValues => {
  return {
    amount: args.amount,
    claimAddress: args.claimAddress,
    tokenAddress: args.tokenAddress,
    refundAddress: args.refundAddress,
    timelock: Number(args.timelock),
    preimageHash: parseBuffer(args.preimageHash),
  };
};
