import { SwapUpdateEvent } from '../consts/Enums';

enum LockupWriteOutcome {
  Acquired = 'acquired',
  Idempotent = 'idempotent',
  Rejected = 'rejected',
}

type LockupWriteResult<T> = {
  outcome: LockupWriteOutcome;
  // Whether the target status was persisted, not just who owns the lockup
  written: boolean;
  swap: T;
};

type LockupTargetStatus =
  | SwapUpdateEvent.TransactionMempool
  | SwapUpdateEvent.TransactionConfirmed
  | SwapUpdateEvent.TransactionLockupFailed;

type LockupTarget =
  | {
      status:
        | SwapUpdateEvent.TransactionMempool
        | SwapUpdateEvent.TransactionConfirmed;
    }
  | {
      status: SwapUpdateEvent.TransactionLockupFailed;
      failureReason: string;
    };

type LockupIdentity = {
  transactionId: string;
  vout?: number | null;
};

const lockupTakeoverStatuses = [
  SwapUpdateEvent.TransactionLockupFailed,
  SwapUpdateEvent.TransactionZeroConfRejected,
];

const canTakeOverLockup = (status: SwapUpdateEvent): boolean =>
  lockupTakeoverStatuses.includes(status);

const isSameLockup = (
  existing: LockupIdentity,
  incoming: LockupIdentity,
): boolean =>
  existing.transactionId === incoming.transactionId &&
  (existing.vout == null ||
    incoming.vout == null ||
    existing.vout === incoming.vout);

// Unlike "isSameLockup", a missing vout never matches a real one: acting on a
// lockup must never act on the wrong output of the transaction. Both spellings
// of a missing vout are equivalent though
const ownsLockup = (
  recorded: LockupIdentity,
  incoming: LockupIdentity,
): boolean =>
  recorded.transactionId === incoming.transactionId &&
  (recorded.vout ?? null) === (incoming.vout ?? null);

const formatLockupIdentity = (identity: LockupIdentity): string =>
  `${identity.transactionId}:${identity.vout}`;

type LockupWriteDecision = {
  outcome: LockupWriteOutcome;
  write: boolean;
  vout: number | null;
};

const decideLockupWrite = ({
  existing,
  incoming,
  currentStatus,
  targetStatus,
  updatable,
}: {
  existing: LockupIdentity | null;
  incoming: LockupIdentity;
  currentStatus: SwapUpdateEvent;
  targetStatus: LockupTargetStatus;
  updatable: boolean;
}): LockupWriteDecision => {
  if (existing === null) {
    if (!updatable) {
      return { outcome: LockupWriteOutcome.Rejected, write: false, vout: null };
    }

    return {
      outcome: LockupWriteOutcome.Acquired,
      write: true,
      vout: incoming.vout ?? null,
    };
  }

  if (isSameLockup(existing, incoming)) {
    const wouldDowngradeConfirmed =
      currentStatus === SwapUpdateEvent.TransactionConfirmed &&
      targetStatus !== SwapUpdateEvent.TransactionConfirmed;

    return {
      outcome: LockupWriteOutcome.Idempotent,
      write: updatable && !wouldDowngradeConfirmed,
      vout: incoming.vout ?? existing.vout ?? null,
    };
  }

  if (updatable && canTakeOverLockup(currentStatus)) {
    return {
      outcome: LockupWriteOutcome.Acquired,
      write: true,
      vout: incoming.vout ?? null,
    };
  }

  return { outcome: LockupWriteOutcome.Rejected, write: false, vout: null };
};

const shouldWriteZeroConfRejection = ({
  existing,
  incoming,
  currentStatus,
}: {
  existing: LockupIdentity | null;
  incoming: LockupIdentity;
  currentStatus: SwapUpdateEvent;
}): boolean =>
  existing !== null &&
  currentStatus === SwapUpdateEvent.TransactionMempool &&
  isSameLockup(existing, incoming);

export {
  LockupWriteOutcome,
  canTakeOverLockup,
  isSameLockup,
  ownsLockup,
  formatLockupIdentity,
  decideLockupWrite,
  shouldWriteZeroConfRejection,
};
export type {
  LockupWriteResult,
  LockupTargetStatus,
  LockupTarget,
  LockupIdentity,
  LockupWriteDecision,
};
