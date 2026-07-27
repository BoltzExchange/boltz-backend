import { SwapType, SwapUpdateEvent } from '../../../lib/consts/Enums';
import type Swap from '../../../lib/db/models/Swap';
import type { ChainSwapInfo } from '../../../lib/db/repositories/ChainSwapRepository';
import {
  getLockupIdentity,
  shouldIgnoreCompetingLockup,
} from '../../../lib/swap/CompetingLockup';

describe('getLockupIdentity', () => {
  test('should read the lockup of a Submarine Swap', () => {
    expect(
      getLockupIdentity({
        type: SwapType.Submarine,
        lockupTransactionId: 'a'.repeat(64),
        lockupTransactionVout: 1,
      } as Swap),
    ).toEqual({ transactionId: 'a'.repeat(64), vout: 1 });
  });

  test('should read the receiving lockup of a Chain Swap', () => {
    expect(
      getLockupIdentity({
        type: SwapType.Chain,
        receivingData: {
          transactionId: 'b'.repeat(64),
          transactionVout: 2,
        },
      } as ChainSwapInfo),
    ).toEqual({ transactionId: 'b'.repeat(64), vout: 2 });
  });

  test.each([undefined, null])(
    'should be null when no lockup was recorded (%p)',
    (transactionId) => {
      expect(
        getLockupIdentity({
          type: SwapType.Submarine,
          lockupTransactionId: transactionId,
        } as Swap),
      ).toBeNull();
      expect(
        getLockupIdentity({
          type: SwapType.Chain,
          receivingData: { transactionId },
        } as ChainSwapInfo),
      ).toBeNull();
    },
  );

  test('should keep a missing vout', () => {
    expect(
      getLockupIdentity({
        type: SwapType.Submarine,
        lockupTransactionId: 'a'.repeat(64),
        lockupTransactionVout: null,
      } as unknown as Swap),
    ).toEqual({ transactionId: 'a'.repeat(64), vout: null });
  });
});

describe('shouldIgnoreCompetingLockup', () => {
  const base = {
    recorded: { transactionId: 'a'.repeat(64) },
    incoming: { transactionId: 'b'.repeat(64) },
    recordedStatus: SwapUpdateEvent.TransactionMempool,
  };

  test('should proceed when no lockup is recorded yet', () => {
    expect(shouldIgnoreCompetingLockup({ ...base, recorded: null })).toEqual(
      false,
    );
  });

  test('should proceed for the same transaction and vout', () => {
    expect(
      shouldIgnoreCompetingLockup({
        ...base,
        recorded: { transactionId: base.recorded.transactionId, vout: 5 },
        incoming: { transactionId: base.recorded.transactionId, vout: 5 },
      }),
    ).toEqual(false);
  });

  test('should treat another vout of the same transaction as competing', () => {
    expect(
      shouldIgnoreCompetingLockup({
        ...base,
        recorded: { transactionId: base.recorded.transactionId, vout: 5 },
        incoming: { transactionId: base.recorded.transactionId, vout: 7 },
      }),
    ).toEqual(true);
  });

  test('should treat a missing vout on either side as the same lockup', () => {
    expect(
      shouldIgnoreCompetingLockup({
        ...base,
        recorded: { transactionId: base.recorded.transactionId, vout: null },
        incoming: { transactionId: base.recorded.transactionId, vout: 7 },
      }),
    ).toEqual(false);
    expect(
      shouldIgnoreCompetingLockup({
        ...base,
        recorded: { transactionId: base.recorded.transactionId, vout: 5 },
        incoming: {
          transactionId: base.recorded.transactionId,
          vout: undefined,
        },
      }),
    ).toEqual(false);
  });

  test.each([
    SwapUpdateEvent.TransactionLockupFailed,
    SwapUpdateEvent.TransactionZeroConfRejected,
  ])('should allow takeover from explicitly rejected status %s', (status) => {
    expect(
      shouldIgnoreCompetingLockup({
        ...base,
        recordedStatus: status,
      }),
    ).toEqual(false);
  });

  test.each([
    SwapUpdateEvent.SwapCreated,
    SwapUpdateEvent.InvoiceSet,
    SwapUpdateEvent.TransactionMempool,
    SwapUpdateEvent.TransactionConfirmed,
    SwapUpdateEvent.InvoicePending,
    SwapUpdateEvent.TransactionClaimPending,
    SwapUpdateEvent.TransactionClaimed,
  ])('should protect a recorded owner in status %s', (status) => {
    expect(
      shouldIgnoreCompetingLockup({
        ...base,
        recordedStatus: status,
      }),
    ).toEqual(true);
  });
});
