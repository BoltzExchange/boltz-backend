import type {
  ERC20Swap,
  LockupEvent as ERC20SwapLockupEvent,
} from 'boltz-core/typechain/ERC20Swap';
import type {
  EtherSwap,
  LockupEvent as EtherSwapLockupEvent,
} from 'boltz-core/typechain/EtherSwap';
import type { Provider, Result } from 'ethers';
import { getHexBuffer } from '../../../Utils';
import type {
  AnySwap,
  ERC20SwapValues,
  EtherSwapValues,
} from '../../../consts/Types';
import CommitmentRepository from '../../../db/repositories/CommitmentRepository';
import Errors from '../Errors';
import { parseBuffer } from '../EthereumUtils';

export type LockupIdentifier =
  | { preimageHash: Buffer }
  | { lockupHash: string };

export type LockupHashParams = {
  preimageHash: Buffer | string;
  amount: bigint;
  claimAddress: string;
  refundAddress: string;
  timelock: bigint;
  tokenAddress?: string;
};

export const computeLockupHash = async (
  contract: EtherSwap | ERC20Swap,
  params: LockupHashParams,
): Promise<string> => {
  if (params.tokenAddress !== undefined) {
    return await (contract as ERC20Swap).hashValues(
      params.preimageHash,
      params.amount,
      params.tokenAddress,
      params.claimAddress,
      params.refundAddress,
      params.timelock,
    );
  }

  return await (contract as EtherSwap).hashValues(
    params.preimageHash,
    params.amount,
    params.claimAddress,
    params.refundAddress,
    params.timelock,
  );
};

const querySwapValuesFromLock = async <T extends { preimageHash: Buffer }>(
  provider: Provider,
  contract: EtherSwap | ERC20Swap,
  lockTransactionHash: string,
  identifier: LockupIdentifier,
  formatValues: (args: Result) => T,
): Promise<T> => {
  const lockTransactionReceipt =
    await provider.getTransactionReceipt(lockTransactionHash);

  const topicHash = contract.filters.Lockup().fragment.topicHash;

  if (lockTransactionReceipt) {
    for (const log of lockTransactionReceipt.logs) {
      if (log.topics[0] !== topicHash) {
        continue;
      }

      const event = contract.interface.parseLog(log as any);
      const values = formatValues(event!.args);

      if ('preimageHash' in identifier) {
        if (!values.preimageHash.equals(identifier.preimageHash)) {
          continue;
        }
      } else if ('lockupHash' in identifier) {
        const computedHash = await computeLockupHash(
          contract,
          event!.args as unknown as LockupHashParams,
        );
        if (computedHash !== identifier.lockupHash) {
          continue;
        }
      }

      return values;
    }
  }

  throw Errors.INVALID_LOCKUP_TRANSACTION(lockTransactionHash);
};

export const queryEtherSwapValuesFromLock = async (
  swap: AnySwap,
  provider: Provider,
  etherSwap: EtherSwap,
  lockTransactionHash: string,
): Promise<EtherSwapValues> =>
  querySwapValuesFromLock(
    provider,
    etherSwap,
    lockTransactionHash,
    await getIdentifier(swap),
    formatEtherSwapValues,
  );

export const queryERC20SwapValuesFromLock = async (
  swap: AnySwap,
  provider: Provider,
  erc20Swap: ERC20Swap,
  lockTransactionHash: string,
): Promise<ERC20SwapValues> =>
  querySwapValuesFromLock(
    provider,
    erc20Swap,
    lockTransactionHash,
    await getIdentifier(swap),
    formatERC20SwapValues,
  );

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

const getIdentifier = async (swap: AnySwap): Promise<LockupIdentifier> => {
  // When there is a commitment, we use the lockup hash
  const commitment = await CommitmentRepository.getBySwapId(swap.id);
  if (commitment !== null && commitment !== undefined) {
    return { lockupHash: commitment.lockupHash };
  }

  return { preimageHash: getHexBuffer(swap.preimageHash) };
};
