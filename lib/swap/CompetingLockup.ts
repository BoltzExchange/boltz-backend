import type { SwapUpdateEvent } from '../consts/Enums';
import { SwapType } from '../consts/Enums';
import type { LockupIdentity } from '../db/LockupIdentity';
import { canTakeOverLockup, isSameLockup } from '../db/LockupIdentity';
import type Swap from '../db/models/Swap';
import type { ChainSwapInfo } from '../db/repositories/ChainSwapRepository';

type CompetingLockupParams = {
  recorded: LockupIdentity | null;
  incoming: LockupIdentity;
  recordedStatus: SwapUpdateEvent;
};

export const getLockupIdentity = (
  swap: Swap | ChainSwapInfo,
): LockupIdentity | null => {
  const [transactionId, vout] =
    swap.type === SwapType.Chain
      ? [
          (swap as ChainSwapInfo).receivingData.transactionId,
          (swap as ChainSwapInfo).receivingData.transactionVout,
        ]
      : [
          (swap as Swap).lockupTransactionId,
          (swap as Swap).lockupTransactionVout,
        ];

  return transactionId == null ? null : { transactionId, vout };
};

export const shouldIgnoreCompetingLockup = ({
  recorded,
  incoming,
  recordedStatus,
}: CompetingLockupParams): boolean => {
  if (recorded === null || isSameLockup(recorded, incoming)) {
    return false;
  }

  return !canTakeOverLockup(recordedStatus);
};
