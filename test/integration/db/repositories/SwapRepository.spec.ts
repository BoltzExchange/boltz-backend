import Logger from '../../../../lib/Logger';
import { SwapUpdateEvent } from '../../../../lib/consts/Enums';
import Database from '../../../../lib/db/Database';
import { LockupWriteOutcome } from '../../../../lib/db/LockupIdentity';
import Pair from '../../../../lib/db/models/Pair';
import Swap from '../../../../lib/db/models/Swap';
import SwapRepository from '../../../../lib/db/repositories/SwapRepository';
import { createSubmarineSwapData } from './Fixtures';

describe('SwapRepository', () => {
  let database: Database;

  beforeAll(async () => {
    database = new Database(Logger.disabledLogger, Database.memoryDatabase);
    await database.init();
    await Pair.create({
      base: 'BTC',
      quote: 'BTC',
      id: 'BTC/BTC',
    });
  });

  beforeEach(async () => {
    await Swap.destroy({
      truncate: true,
    });
  });

  afterAll(async () => {
    await database.close();
  });

  describe('disableZeroConf', () => {
    test('should disable 0-conf', async () => {
      const swaps: Swap[] = [];

      for (let i = 0; i < 3; i++) {
        swaps.push(await Swap.create(createSubmarineSwapData(true)));
      }

      expect(swaps.every((s) => s.acceptZeroConf)).toEqual(true);

      await SwapRepository.disableZeroConf([swaps[0], swaps[1]]);

      expect(
        (await SwapRepository.getSwap({
          id: swaps[0].id,
        }))!.acceptZeroConf,
      ).toEqual(false);
      expect(
        (await SwapRepository.getSwap({
          id: swaps[1].id,
        }))!.acceptZeroConf,
      ).toEqual(false);
      expect(
        (await SwapRepository.getSwap({
          id: swaps[2].id,
        }))!.acceptZeroConf,
      ).toEqual(true);
    });

    test('should ignore when no swaps are given as parameter', async () => {
      const swaps: Swap[] = [];

      for (let i = 0; i < 3; i++) {
        swaps.push(await Swap.create(createSubmarineSwapData(true)));
      }

      await SwapRepository.disableZeroConf([]);

      for (const swap of swaps) {
        expect(
          (await SwapRepository.getSwap({
            id: swap.id,
          }))!.acceptZeroConf,
        ).toEqual(true);
      }
    });
  });

  describe('setSwapStatus', () => {
    test('should update status', async () => {
      const swap = await Swap.create(createSubmarineSwapData());

      const newStatus = SwapUpdateEvent.TransactionConfirmed;
      await SwapRepository.setSwapStatus(swap, newStatus);
      await swap.reload();

      expect(swap.status).toEqual(newStatus);
      expect(swap.failureReason).toBeNull();
    });

    test('should set failure reason', async () => {
      const swap = await Swap.create(createSubmarineSwapData());
      expect(swap.failureReason).toBeUndefined();

      const newStatus = SwapUpdateEvent.TransactionConfirmed;
      const failureReason = 'denied';
      await SwapRepository.setSwapStatus(swap, newStatus, failureReason);
      await swap.reload();

      expect(swap.status).toEqual(newStatus);
      expect(swap.failureReason).toEqual(failureReason);
    });

    test('should not overwrite failure reason', async () => {
      const swap = await Swap.create(createSubmarineSwapData());
      expect(swap.failureReason).toBeUndefined();

      const failureReason = 'denied';
      await SwapRepository.setSwapStatus(
        swap,
        SwapUpdateEvent.TransactionConfirmed,
        failureReason,
      );

      const newFailureReason = 'new message';
      await SwapRepository.setSwapStatus(
        swap,
        SwapUpdateEvent.SwapExpired,
        newFailureReason,
      );
      await swap.reload();

      expect(swap.status).toEqual(SwapUpdateEvent.SwapExpired);
      expect(swap.failureReason).toEqual(failureReason);
    });
  });

  describe('setRefundAddress', () => {
    test('should persist the refund address', async () => {
      const swap = await Swap.create(createSubmarineSwapData());
      const refundAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

      const updated = await SwapRepository.setRefundAddress(
        swap,
        refundAddress,
      );

      await swap.reload();

      expect(updated.refundAddress).toEqual(refundAddress);
      expect(swap.refundAddress).toEqual(refundAddress);
    });
  });

  describe('setLockupTransaction', () => {
    test('should acquire an ownerless lockup', async () => {
      const swap = await Swap.create(createSubmarineSwapData());

      const result = await SwapRepository.setLockupTransaction(
        swap,
        'lockup-a',
        100_000,
        { status: SwapUpdateEvent.TransactionConfirmed },
        0,
      );

      expect(result.outcome).toEqual(LockupWriteOutcome.Acquired);
      expect(result.swap.status).toEqual(SwapUpdateEvent.TransactionConfirmed);
      expect(result.swap.lockupTransactionId).toEqual('lockup-a');
      expect(result.swap.onchainAmount).toEqual(100_000);
      expect(result.swap.lockupTransactionVout).toEqual(0);
    });

    test('should write a failure and its reason in one call', async () => {
      const swap = await Swap.create(createSubmarineSwapData());

      const result = await SwapRepository.setLockupTransaction(
        swap,
        'lockup-a',
        100_000,
        {
          status: SwapUpdateEvent.TransactionLockupFailed,
          failureReason: 'not enough',
        },
        0,
      );

      expect(result.outcome).toEqual(LockupWriteOutcome.Acquired);
      expect(result.swap.status).toEqual(
        SwapUpdateEvent.TransactionLockupFailed,
      );
      expect(result.swap.failureReason).toEqual('not enough');
      expect(result.swap.lockupTransactionId).toEqual('lockup-a');
    });

    test('should reject when the swap does not exist anymore', async () => {
      const swap = await Swap.create(createSubmarineSwapData());
      await swap.destroy();

      const result = await SwapRepository.setLockupTransaction(
        swap,
        'lockup-a',
        100_000,
        { status: SwapUpdateEvent.TransactionConfirmed },
        0,
      );

      expect(result.outcome).toEqual(LockupWriteOutcome.Rejected);
      expect(result.swap).toEqual(swap);
    });

    test.each([
      SwapUpdateEvent.InvoicePending,
      SwapUpdateEvent.InvoicePaid,
      SwapUpdateEvent.InvoiceFailedToPay,
      SwapUpdateEvent.TransactionClaimPending,
      SwapUpdateEvent.TransactionClaimed,
      SwapUpdateEvent.SwapExpired,
    ])('should not downgrade status from %s', async (status) => {
      const swap = await Swap.create(createSubmarineSwapData());

      await SwapRepository.setLockupTransaction(
        swap,
        'initial-lockup',
        123_000,
        { status: SwapUpdateEvent.TransactionConfirmed },
        1,
      );
      await SwapRepository.setSwapStatus(swap, status);

      const result = await SwapRepository.setLockupTransaction(
        swap,
        'stale-lockup',
        321_000,
        { status: SwapUpdateEvent.TransactionMempool },
        2,
      );

      await swap.reload();

      expect(result.outcome).toEqual(LockupWriteOutcome.Rejected);
      expect(result.swap.status).toEqual(status);
      expect(swap.status).toEqual(status);
      expect(swap.lockupTransactionId).toEqual('initial-lockup');
      expect(swap.onchainAmount).toEqual(123_000);
      expect(swap.lockupTransactionVout).toEqual(1);
    });

    test.each([SwapUpdateEvent.InvoicePending, SwapUpdateEvent.InvoicePaid])(
      'should not acquire an ownerless lockup in status %s',
      async (status) => {
        const swap = await Swap.create(createSubmarineSwapData());
        await SwapRepository.setSwapStatus(swap, status);

        const result = await SwapRepository.setLockupTransaction(
          swap,
          'lockup-a',
          100_000,
          { status: SwapUpdateEvent.TransactionConfirmed },
          0,
        );

        expect(result.outcome).toEqual(LockupWriteOutcome.Rejected);
        expect(result.swap.lockupTransactionId).toBeNull();
      },
    );

    test('should not let a different transaction replace a confirmed lockup', async () => {
      const swap = await Swap.create(createSubmarineSwapData());

      await SwapRepository.setLockupTransaction(
        swap,
        'lockup-a',
        100_000,
        { status: SwapUpdateEvent.TransactionConfirmed },
        0,
      );
      const result = await SwapRepository.setLockupTransaction(
        swap,
        'lockup-b',
        1_000,
        { status: SwapUpdateEvent.TransactionConfirmed },
        1,
      );

      await swap.reload();
      expect(result.outcome).toEqual(LockupWriteOutcome.Rejected);
      expect(swap.status).toEqual(SwapUpdateEvent.TransactionConfirmed);
      expect(swap.lockupTransactionId).toEqual('lockup-a');
      expect(swap.onchainAmount).toEqual(100_000);
      expect(swap.lockupTransactionVout).toEqual(0);
    });

    test('should treat another log index of a confirmed transaction as competing', async () => {
      const swap = await Swap.create(createSubmarineSwapData());

      await SwapRepository.setLockupTransaction(
        swap,
        'lockup-a',
        100_000,
        { status: SwapUpdateEvent.TransactionConfirmed },
        5,
      );
      const result = await SwapRepository.setLockupTransaction(
        swap,
        'lockup-a',
        1_000,
        { status: SwapUpdateEvent.TransactionConfirmed },
        7,
      );

      await swap.reload();
      expect(result.outcome).toEqual(LockupWriteOutcome.Rejected);
      expect(swap.onchainAmount).toEqual(100_000);
      expect(swap.lockupTransactionVout).toEqual(5);
    });

    test('should not let a different transaction replace an unconfirmed lockup', async () => {
      const swap = await Swap.create(createSubmarineSwapData());

      await SwapRepository.setLockupTransaction(
        swap,
        'lockup-a',
        100_000,
        { status: SwapUpdateEvent.TransactionMempool },
        0,
      );
      const result = await SwapRepository.setLockupTransaction(
        swap,
        'lockup-b',
        100_000,
        { status: SwapUpdateEvent.TransactionConfirmed },
        1,
      );

      await swap.reload();
      expect(result.outcome).toEqual(LockupWriteOutcome.Rejected);
      expect(swap.status).toEqual(SwapUpdateEvent.TransactionMempool);
      expect(swap.lockupTransactionId).toEqual('lockup-a');
      expect(swap.lockupTransactionVout).toEqual(0);
    });

    test('should let a valid lockup take over from a failed one', async () => {
      const swap = await Swap.create(createSubmarineSwapData());

      await SwapRepository.setLockupTransaction(
        swap,
        'lockup-a',
        1_000,
        {
          status: SwapUpdateEvent.TransactionLockupFailed,
          failureReason: 'lockup failed',
        },
        0,
      );
      const result = await SwapRepository.setLockupTransaction(
        swap,
        'lockup-b',
        100_000,
        { status: SwapUpdateEvent.TransactionConfirmed },
        1,
      );

      await swap.reload();
      expect(result.outcome).toEqual(LockupWriteOutcome.Acquired);
      expect(swap.status).toEqual(SwapUpdateEvent.TransactionConfirmed);
      expect(swap.lockupTransactionId).toEqual('lockup-b');
      expect(swap.failureReason).toBeNull();
    });

    test('should let a valid lockup take over from a zero-conf rejected one', async () => {
      const swap = await Swap.create(createSubmarineSwapData());

      await SwapRepository.setLockupTransaction(
        swap,
        'lockup-a',
        100_000,
        { status: SwapUpdateEvent.TransactionMempool },
        0,
      );
      await SwapRepository.setSwapStatus(
        swap,
        SwapUpdateEvent.TransactionZeroConfRejected,
      );
      const result = await SwapRepository.setLockupTransaction(
        swap,
        'lockup-b',
        100_000,
        { status: SwapUpdateEvent.TransactionConfirmed },
        1,
      );

      await swap.reload();
      expect(result.outcome).toEqual(LockupWriteOutcome.Acquired);
      expect(swap.status).toEqual(SwapUpdateEvent.TransactionConfirmed);
      expect(swap.lockupTransactionId).toEqual('lockup-b');
      expect(swap.lockupTransactionVout).toEqual(1);
    });

    test('should allow the same transaction to transition to confirmed', async () => {
      const swap = await Swap.create(createSubmarineSwapData());

      await SwapRepository.setLockupTransaction(
        swap,
        'lockup-a',
        100_000,
        { status: SwapUpdateEvent.TransactionMempool },
        0,
      );
      const result = await SwapRepository.setLockupTransaction(
        swap,
        'lockup-a',
        100_000,
        { status: SwapUpdateEvent.TransactionConfirmed },
        0,
      );

      await swap.reload();
      expect(result.outcome).toEqual(LockupWriteOutcome.Idempotent);
      expect(swap.status).toEqual(SwapUpdateEvent.TransactionConfirmed);
      expect(swap.lockupTransactionId).toEqual('lockup-a');
    });

    test('should not downgrade a confirmed lockup to lockup failed', async () => {
      const swap = await Swap.create(createSubmarineSwapData());

      await SwapRepository.setLockupTransaction(
        swap,
        'lockup-a',
        100_000,
        { status: SwapUpdateEvent.TransactionConfirmed },
        0,
      );
      const result = await SwapRepository.setLockupTransaction(
        swap,
        'lockup-a',
        100_000,
        {
          status: SwapUpdateEvent.TransactionLockupFailed,
          failureReason: 'lockup failed',
        },
        0,
      );

      await swap.reload();
      expect(result.outcome).toEqual(LockupWriteOutcome.Idempotent);
      expect(swap.status).toEqual(SwapUpdateEvent.TransactionConfirmed);
      expect(swap.lockupTransactionId).toEqual('lockup-a');
    });

    test('should not downgrade a confirmed lockup to mempool', async () => {
      const swap = await Swap.create(createSubmarineSwapData());

      await SwapRepository.setLockupTransaction(
        swap,
        'lockup-a',
        100_000,
        { status: SwapUpdateEvent.TransactionConfirmed },
        0,
      );
      const result = await SwapRepository.setLockupTransaction(
        swap,
        'lockup-a',
        100_000,
        { status: SwapUpdateEvent.TransactionMempool },
        0,
      );

      await swap.reload();
      expect(result.outcome).toEqual(LockupWriteOutcome.Idempotent);
      expect(swap.status).toEqual(SwapUpdateEvent.TransactionConfirmed);
      expect(swap.lockupTransactionId).toEqual('lockup-a');
    });

    test('should match and backfill when the stored lockup has no vout', async () => {
      const swap = await Swap.create(createSubmarineSwapData());

      await SwapRepository.setLockupTransaction(swap, 'lockup-a', 100_000, {
        status: SwapUpdateEvent.TransactionMempool,
      });
      const result = await SwapRepository.setLockupTransaction(
        swap,
        'lockup-a',
        100_000,
        { status: SwapUpdateEvent.TransactionConfirmed },
        3,
      );

      await swap.reload();
      expect(result.outcome).toEqual(LockupWriteOutcome.Idempotent);
      expect(swap.status).toEqual(SwapUpdateEvent.TransactionConfirmed);
      expect(swap.lockupTransactionVout).toEqual(3);
    });

    test('should keep the stored vout when a redelivery has none', async () => {
      const swap = await Swap.create(createSubmarineSwapData());

      await SwapRepository.setLockupTransaction(
        swap,
        'lockup-a',
        100_000,
        { status: SwapUpdateEvent.TransactionMempool },
        2,
      );
      const result = await SwapRepository.setLockupTransaction(
        swap,
        'lockup-a',
        100_000,
        { status: SwapUpdateEvent.TransactionConfirmed },
      );

      await swap.reload();
      expect(result.outcome).toEqual(LockupWriteOutcome.Idempotent);
      expect(swap.status).toEqual(SwapUpdateEvent.TransactionConfirmed);
      expect(swap.lockupTransactionVout).toEqual(2);
    });
  });

  describe('setLockupFailed', () => {
    const failLockup = (swap: Swap) =>
      SwapRepository.setLockupFailed(
        swap,
        { transactionId: 'lockup-a', vout: 0 },
        'not enough',
      );

    const recordLockup = (swap: Swap) =>
      SwapRepository.setLockupTransaction(
        swap,
        'lockup-a',
        100_000,
        { status: SwapUpdateEvent.TransactionConfirmed },
        0,
      );

    test('should write the status and its reason in one call', async () => {
      const swap = await Swap.create(createSubmarineSwapData());
      await recordLockup(swap);

      const result = await failLockup(swap);

      expect(result.outcome).toEqual(LockupWriteOutcome.Acquired);
      expect(result.swap.status).toEqual(
        SwapUpdateEvent.TransactionLockupFailed,
      );
      expect(result.swap.failureReason).toEqual('not enough');
    });

    test('should reject a lockup that does not own the swap', async () => {
      const swap = await Swap.create(createSubmarineSwapData());
      await recordLockup(swap);

      const result = await SwapRepository.setLockupFailed(
        swap,
        { transactionId: 'lockup-b', vout: 0 },
        'not enough',
      );

      expect(result.outcome).toEqual(LockupWriteOutcome.Rejected);
      expect(result.swap.status).toEqual(SwapUpdateEvent.TransactionConfirmed);
      expect(result.swap.failureReason).toBeNull();
    });

    test.each([1, null, undefined])(
      'should reject another vout (%p) of the recorded transaction',
      async (vout) => {
        const swap = await Swap.create(createSubmarineSwapData());
        await recordLockup(swap);

        const result = await SwapRepository.setLockupFailed(
          swap,
          { transactionId: 'lockup-a', vout },
          'not enough',
        );

        expect(result.outcome).toEqual(LockupWriteOutcome.Rejected);
        expect(result.swap.status).toEqual(
          SwapUpdateEvent.TransactionConfirmed,
        );
        expect(result.swap.failureReason).toBeNull();
      },
    );

    test('should reject when no lockup was recorded yet', async () => {
      const swap = await Swap.create(createSubmarineSwapData());

      const result = await failLockup(swap);

      expect(result.outcome).toEqual(LockupWriteOutcome.Rejected);
      expect(result.swap.failureReason).toBeNull();
    });

    test.each([
      SwapUpdateEvent.InvoicePending,
      SwapUpdateEvent.InvoicePaid,
      SwapUpdateEvent.InvoiceFailedToPay,
      SwapUpdateEvent.TransactionClaimPending,
      SwapUpdateEvent.TransactionClaimed,
      SwapUpdateEvent.SwapExpired,
    ])('should reject a swap that moved on to %s', async (status) => {
      const swap = await Swap.create(createSubmarineSwapData());
      await recordLockup(swap);
      await SwapRepository.setSwapStatus(swap, status);

      const result = await failLockup(swap);

      expect(result.outcome).toEqual(LockupWriteOutcome.Rejected);
      expect(result.swap.status).toEqual(status);
      expect(result.swap.failureReason).toBeNull();
    });
  });

  describe('setZeroConfRejected', () => {
    test('should reject the recorded mempool lockup', async () => {
      const swap = await Swap.create(createSubmarineSwapData());
      await SwapRepository.setLockupTransaction(
        swap,
        'lockup-a',
        100_000,
        { status: SwapUpdateEvent.TransactionMempool },
        0,
      );

      const updated = await SwapRepository.setZeroConfRejected(
        swap,
        'lockup-a',
        0,
      );

      expect(updated.status).toEqual(
        SwapUpdateEvent.TransactionZeroConfRejected,
      );
    });

    test('should not downgrade a confirmed lockup', async () => {
      const swap = await Swap.create(createSubmarineSwapData());
      await SwapRepository.setLockupTransaction(
        swap,
        'lockup-a',
        100_000,
        { status: SwapUpdateEvent.TransactionConfirmed },
        0,
      );

      const updated = await SwapRepository.setZeroConfRejected(
        swap,
        'lockup-a',
        0,
      );

      expect(updated.status).toEqual(SwapUpdateEvent.TransactionConfirmed);
    });

    test('should ignore rejections from a transaction that does not own the lockup', async () => {
      const swap = await Swap.create(createSubmarineSwapData());
      await SwapRepository.setLockupTransaction(
        swap,
        'lockup-a',
        100_000,
        { status: SwapUpdateEvent.TransactionMempool },
        0,
      );

      const updated = await SwapRepository.setZeroConfRejected(
        swap,
        'lockup-b',
        1,
      );

      expect(updated.status).toEqual(SwapUpdateEvent.TransactionMempool);
      expect(updated.lockupTransactionId).toEqual('lockup-a');
    });

    test('should ignore rejections when no lockup is recorded', async () => {
      const swap = await Swap.create(createSubmarineSwapData());

      const updated = await SwapRepository.setZeroConfRejected(
        swap,
        'lockup-a',
        0,
      );

      expect(updated.status).toEqual(SwapUpdateEvent.SwapCreated);
    });
  });

  describe('setInvoicePaid', () => {
    test('should set failureReason to null', async () => {
      const swap = await Swap.create(createSubmarineSwapData());
      expect(swap.failureReason).toBeUndefined();

      const failureReason = 'denied';
      await SwapRepository.setSwapStatus(
        swap,
        SwapUpdateEvent.InvoiceFailedToPay,
        failureReason,
      );
      await swap.reload();

      expect(swap.failureReason).toEqual(failureReason);

      const routingFee = 123;
      const preimage = 'abab';
      await SwapRepository.setInvoicePaid(swap, routingFee, preimage);

      await swap.reload();

      expect(swap.preimage).toEqual(preimage);
      expect(swap.failureReason).toEqual(null);
      expect(swap.routingFee).toEqual(routingFee);
      expect(swap.status).toEqual(SwapUpdateEvent.InvoicePaid);
    });
  });

  describe('setRefundSignatureCreated', () => {
    test('should set createdRefundSignature to true', async () => {
      const swap = await Swap.create(createSubmarineSwapData());

      expect(swap.createdRefundSignature).toEqual(false);

      const [affectedCount] = await SwapRepository.setRefundSignatureCreated(
        swap.id,
      );
      expect(affectedCount).toEqual(1);

      const updatedSwap = await SwapRepository.getSwap({ id: swap.id });
      expect(updatedSwap!.createdRefundSignature).toEqual(true);
    });

    test('should handle non-existent swap ID gracefully', async () => {
      const nonExistentId = 'non-existent-swap-id';

      const [affectedCount] =
        await SwapRepository.setRefundSignatureCreated(nonExistentId);
      expect(affectedCount).toEqual(0);
    });
  });
});
