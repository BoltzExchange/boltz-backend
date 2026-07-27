import { SwapUpdateEvent } from '../../../lib/consts/Enums';
import type { LockupTargetStatus } from '../../../lib/db/LockupIdentity';
import {
  LockupWriteOutcome,
  canTakeOverLockup,
  decideLockupWrite,
  formatLockupIdentity,
  isSameLockup,
  ownsLockup,
  shouldWriteZeroConfRejection,
} from '../../../lib/db/LockupIdentity';

describe('LockupIdentity', () => {
  const owner = { transactionId: 'a'.repeat(64), vout: 1 };
  const other = { transactionId: 'b'.repeat(64), vout: 0 };

  describe('isSameLockup', () => {
    test('should match identical lockups', () => {
      expect(isSameLockup(owner, { ...owner })).toEqual(true);
    });

    test('should not match different transactions', () => {
      expect(isSameLockup(owner, other)).toEqual(false);
    });

    test('should not match another vout of the same transaction', () => {
      expect(
        isSameLockup(owner, { transactionId: owner.transactionId, vout: 2 }),
      ).toEqual(false);
    });

    test.each`
      existingVout | incomingVout
      ${null}      | ${2}
      ${undefined} | ${2}
      ${2}         | ${null}
      ${2}         | ${undefined}
      ${null}      | ${null}
    `(
      'should match when a vout is missing ($existingVout, $incomingVout)',
      ({ existingVout, incomingVout }) => {
        expect(
          isSameLockup(
            { transactionId: owner.transactionId, vout: existingVout },
            { transactionId: owner.transactionId, vout: incomingVout },
          ),
        ).toEqual(true);
      },
    );
  });

  describe('ownsLockup', () => {
    test('should match identical lockups', () => {
      expect(ownsLockup(owner, { ...owner })).toEqual(true);
    });

    test('should not match different transactions', () => {
      expect(ownsLockup(owner, other)).toEqual(false);
    });

    test('should not match another vout of the same transaction', () => {
      expect(
        ownsLockup(owner, { transactionId: owner.transactionId, vout: 2 }),
      ).toEqual(false);
    });

    test.each`
      recordedVout | incomingVout
      ${null}      | ${2}
      ${undefined} | ${2}
      ${2}         | ${null}
      ${2}         | ${undefined}
    `(
      'should not match when a vout is missing ($recordedVout, $incomingVout)',
      ({ recordedVout, incomingVout }) => {
        const recorded = {
          transactionId: owner.transactionId,
          vout: recordedVout,
        };
        const incoming = {
          transactionId: owner.transactionId,
          vout: incomingVout,
        };

        expect(ownsLockup(recorded, incoming)).toEqual(false);
        expect(isSameLockup(recorded, incoming)).toEqual(true);
      },
    );

    test.each`
      recordedVout | incomingVout
      ${null}      | ${null}
      ${null}      | ${undefined}
      ${undefined} | ${null}
      ${undefined} | ${undefined}
    `(
      'should match when neither side has a vout ($recordedVout, $incomingVout)',
      ({ recordedVout, incomingVout }) => {
        expect(
          ownsLockup(
            { transactionId: owner.transactionId, vout: recordedVout },
            { transactionId: owner.transactionId, vout: incomingVout },
          ),
        ).toEqual(true);
      },
    );
  });

  describe('formatLockupIdentity', () => {
    test('should format a lockup as its outpoint', () => {
      expect(formatLockupIdentity(owner)).toEqual(`${owner.transactionId}:1`);
    });
  });

  describe('canTakeOverLockup', () => {
    test.each([
      SwapUpdateEvent.TransactionLockupFailed,
      SwapUpdateEvent.TransactionZeroConfRejected,
    ])('should allow a takeover from %s', (status) => {
      expect(canTakeOverLockup(status)).toEqual(true);
    });

    test.each([
      SwapUpdateEvent.SwapCreated,
      SwapUpdateEvent.InvoiceSet,
      SwapUpdateEvent.TransactionMempool,
      SwapUpdateEvent.TransactionConfirmed,
      SwapUpdateEvent.InvoicePending,
      SwapUpdateEvent.InvoicePaid,
      SwapUpdateEvent.TransactionClaimPending,
      SwapUpdateEvent.TransactionClaimed,
      SwapUpdateEvent.SwapExpired,
    ])('should not allow a takeover from %s', (status) => {
      expect(canTakeOverLockup(status)).toEqual(false);
    });
  });

  describe('decideLockupWrite', () => {
    const decide = (params: Partial<Parameters<typeof decideLockupWrite>[0]>) =>
      decideLockupWrite({
        existing: null,
        incoming: owner,
        currentStatus: SwapUpdateEvent.SwapCreated,
        targetStatus: SwapUpdateEvent.TransactionConfirmed,
        updatable: true,
        ...params,
      } as Parameters<typeof decideLockupWrite>[0]);

    describe('without a recorded lockup', () => {
      test('should acquire the lockup', () => {
        expect(decide({ existing: null })).toEqual({
          outcome: LockupWriteOutcome.Acquired,
          write: true,
          vout: owner.vout,
        });
      });

      test('should acquire a lockup without a vout', () => {
        expect(
          decide({
            existing: null,
            incoming: { transactionId: owner.transactionId },
          }),
        ).toEqual({
          outcome: LockupWriteOutcome.Acquired,
          write: true,
          vout: null,
        });
      });

      test('should reject when the swap is not updatable', () => {
        expect(decide({ existing: null, updatable: false })).toEqual({
          outcome: LockupWriteOutcome.Rejected,
          write: false,
          vout: null,
        });
      });
    });

    describe('with the same lockup recorded', () => {
      test('should write idempotently', () => {
        expect(decide({ existing: owner, incoming: { ...owner } })).toEqual({
          outcome: LockupWriteOutcome.Idempotent,
          write: true,
          vout: owner.vout,
        });
      });

      test('should backfill a missing stored vout', () => {
        expect(
          decide({
            existing: { transactionId: owner.transactionId, vout: null },
            incoming: owner,
          }),
        ).toEqual({
          outcome: LockupWriteOutcome.Idempotent,
          write: true,
          vout: owner.vout,
        });
      });

      test('should keep the stored vout when the incoming one is missing', () => {
        expect(
          decide({
            existing: owner,
            incoming: { transactionId: owner.transactionId },
          }),
        ).toEqual({
          outcome: LockupWriteOutcome.Idempotent,
          write: true,
          vout: owner.vout,
        });
      });

      test('should resolve to no vout when neither side has one', () => {
        expect(
          decide({
            existing: { transactionId: owner.transactionId, vout: null },
            incoming: { transactionId: owner.transactionId },
          }),
        ).toEqual({
          outcome: LockupWriteOutcome.Idempotent,
          write: true,
          vout: null,
        });
      });

      test('should not write when the swap is not updatable', () => {
        expect(
          decide({
            existing: owner,
            incoming: { ...owner },
            updatable: false,
          }),
        ).toEqual({
          outcome: LockupWriteOutcome.Idempotent,
          write: false,
          vout: owner.vout,
        });
      });

      test.each<LockupTargetStatus>([
        SwapUpdateEvent.TransactionMempool,
        SwapUpdateEvent.TransactionLockupFailed,
      ])('should not downgrade a confirmed lockup to %s', (targetStatus) => {
        expect(
          decide({
            existing: owner,
            incoming: { ...owner },
            currentStatus: SwapUpdateEvent.TransactionConfirmed,
            targetStatus,
          }),
        ).toEqual({
          outcome: LockupWriteOutcome.Idempotent,
          write: false,
          vout: owner.vout,
        });
      });

      test('should write a confirmation of a confirmed lockup', () => {
        expect(
          decide({
            existing: owner,
            incoming: { ...owner },
            currentStatus: SwapUpdateEvent.TransactionConfirmed,
            targetStatus: SwapUpdateEvent.TransactionConfirmed,
          }),
        ).toEqual({
          outcome: LockupWriteOutcome.Idempotent,
          write: true,
          vout: owner.vout,
        });
      });

      test.each<LockupTargetStatus>([
        SwapUpdateEvent.TransactionMempool,
        SwapUpdateEvent.TransactionLockupFailed,
      ])('should write %s for a lockup in the mempool', (targetStatus) => {
        expect(
          decide({
            existing: owner,
            incoming: { ...owner },
            currentStatus: SwapUpdateEvent.TransactionMempool,
            targetStatus,
          }),
        ).toEqual({
          outcome: LockupWriteOutcome.Idempotent,
          write: true,
          vout: owner.vout,
        });
      });
    });

    describe('with a competing lockup recorded', () => {
      test.each([
        SwapUpdateEvent.TransactionLockupFailed,
        SwapUpdateEvent.TransactionZeroConfRejected,
      ])('should take over from %s', (currentStatus) => {
        expect(
          decide({ existing: other, incoming: owner, currentStatus }),
        ).toEqual({
          outcome: LockupWriteOutcome.Acquired,
          write: true,
          vout: owner.vout,
        });
      });

      test('should take over without a vout', () => {
        expect(
          decide({
            existing: other,
            incoming: { transactionId: owner.transactionId },
            currentStatus: SwapUpdateEvent.TransactionZeroConfRejected,
          }),
        ).toEqual({
          outcome: LockupWriteOutcome.Acquired,
          write: true,
          vout: null,
        });
      });

      test.each([
        SwapUpdateEvent.SwapCreated,
        SwapUpdateEvent.InvoiceSet,
        SwapUpdateEvent.TransactionMempool,
        SwapUpdateEvent.TransactionConfirmed,
        SwapUpdateEvent.InvoicePending,
        SwapUpdateEvent.TransactionClaimPending,
        SwapUpdateEvent.TransactionClaimed,
      ])('should reject a takeover from %s', (currentStatus) => {
        expect(
          decide({ existing: other, incoming: owner, currentStatus }),
        ).toEqual({
          outcome: LockupWriteOutcome.Rejected,
          write: false,
          vout: null,
        });
      });

      test('should reject a takeover when the swap is not updatable', () => {
        expect(
          decide({
            existing: other,
            incoming: owner,
            currentStatus: SwapUpdateEvent.TransactionLockupFailed,
            updatable: false,
          }),
        ).toEqual({
          outcome: LockupWriteOutcome.Rejected,
          write: false,
          vout: null,
        });
      });

      test('should treat another vout of the same transaction as competing', () => {
        expect(
          decide({
            existing: owner,
            incoming: { transactionId: owner.transactionId, vout: 2 },
            currentStatus: SwapUpdateEvent.TransactionConfirmed,
          }),
        ).toEqual({
          outcome: LockupWriteOutcome.Rejected,
          write: false,
          vout: null,
        });
      });
    });
  });

  describe('shouldWriteZeroConfRejection', () => {
    const check = (
      params: Partial<Parameters<typeof shouldWriteZeroConfRejection>[0]>,
    ) =>
      shouldWriteZeroConfRejection({
        existing: owner,
        incoming: { ...owner },
        currentStatus: SwapUpdateEvent.TransactionMempool,
        ...params,
      } as Parameters<typeof shouldWriteZeroConfRejection>[0]);

    test('should write for the recorded lockup in the mempool', () => {
      expect(check({})).toEqual(true);
    });

    test('should write when a vout is missing on either side', () => {
      expect(
        check({
          existing: { transactionId: owner.transactionId, vout: null },
        }),
      ).toEqual(true);
    });

    test('should not write when no lockup is recorded', () => {
      expect(check({ existing: null })).toEqual(false);
    });

    test('should not write for a competing transaction', () => {
      expect(check({ incoming: other })).toEqual(false);
    });

    test('should not write for another vout of the same transaction', () => {
      expect(
        check({ incoming: { transactionId: owner.transactionId, vout: 2 } }),
      ).toEqual(false);
    });

    test.each([
      SwapUpdateEvent.SwapCreated,
      SwapUpdateEvent.TransactionConfirmed,
      SwapUpdateEvent.TransactionZeroConfRejected,
      SwapUpdateEvent.TransactionLockupFailed,
      SwapUpdateEvent.InvoicePending,
      SwapUpdateEvent.TransactionClaimed,
    ])('should not write in status %s', (currentStatus) => {
      expect(check({ currentStatus })).toEqual(false);
    });
  });
});
