import Logger from '../../../../lib/Logger';
import { SwapUpdateEvent } from '../../../../lib/consts/Enums';
import Database from '../../../../lib/db/Database';
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

  describe('setLockupTransaction', () => {
    test.each([
      SwapUpdateEvent.InvoicePaid,
      SwapUpdateEvent.TransactionClaimPending,
      SwapUpdateEvent.TransactionClaimed,
    ])('should not downgrade status from %s', async (status) => {
      const swap = await Swap.create(createSubmarineSwapData());

      await SwapRepository.setLockupTransaction(
        swap,
        'initial-lockup',
        123_000,
        true,
        1,
      );
      await SwapRepository.setSwapStatus(swap, status);

      const updated = await SwapRepository.setLockupTransaction(
        swap,
        'stale-lockup',
        321_000,
        false,
        2,
      );

      await swap.reload();

      expect(updated.status).toEqual(status);
      expect(swap.status).toEqual(status);
      expect(swap.lockupTransactionId).toEqual('initial-lockup');
      expect(swap.onchainAmount).toEqual(123_000);
      expect(swap.lockupTransactionVout).toEqual(1);
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
