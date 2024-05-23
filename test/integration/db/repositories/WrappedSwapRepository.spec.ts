import { randomBytes } from 'crypto';
import Logger from '../../../../lib/Logger';
import { getHexString } from '../../../../lib/Utils';
import { SwapUpdateEvent } from '../../../../lib/consts/Enums';
import Database from '../../../../lib/db/Database';
import ChainSwap from '../../../../lib/db/models/ChainSwap';
import ChainSwapData from '../../../../lib/db/models/ChainSwapData';
import Pair from '../../../../lib/db/models/Pair';
import ReverseSwap from '../../../../lib/db/models/ReverseSwap';
import ChainSwapRepository from '../../../../lib/db/repositories/ChainSwapRepository';
import WrappedSwapRepository from '../../../../lib/db/repositories/WrappedSwapRepository';
import { createChainSwap, createReverseSwap } from './Fixtures';

describe('WrappedSwapRepository', () => {
  const database = new Database(Logger.disabledLogger, ':memory:');

  beforeAll(async () => {
    await database.init();
    await Pair.create({
      quote: 'BTC',
      base: 'L-BTC',
      id: 'L-BTC/BTC',
    });
  });

  beforeEach(async () => {
    await ReverseSwap.destroy({
      truncate: true,
    });
    await ChainSwapData.destroy({
      truncate: true,
    });
    await ChainSwap.destroy({
      truncate: true,
    });
  });

  afterAll(async () => {
    await database.close();
  });

  describe('setStatus', () => {
    test('should set swap status for reverse swaps', async () => {
      const swap = await createReverseSwap();
      const newStatus = SwapUpdateEvent.SwapExpired;

      const updated = await WrappedSwapRepository.setStatus(swap, newStatus);
      expect(updated.status).toEqual(newStatus);
    });

    test('should set swap status for chain swaps', async () => {
      const swap = await createChainSwap();
      const newStatus = SwapUpdateEvent.SwapExpired;

      const updated = await WrappedSwapRepository.setStatus(
        (await ChainSwapRepository.getChainSwap({
          id: swap.chainSwap.id,
        }))!,
        newStatus,
      );

      expect(updated.status).toEqual(newStatus);
    });
  });

  describe('setServerLockupTransaction', () => {
    test('should set server lockup transaction for reverse swaps', async () => {
      const swap = await createReverseSwap();
      const txId = 'tx';
      const fee = 423;
      const vout = 1;

      const updated = await WrappedSwapRepository.setServerLockupTransaction(
        swap,
        txId,
        100_000,
        fee,
        vout,
      );

      expect(updated).not.toBeNull();
      expect(updated.minerFee).toEqual(fee);
      expect(updated.transactionId).toEqual(txId);
      expect(updated.transactionVout).toEqual(vout);
      expect(updated.status).toEqual(SwapUpdateEvent.TransactionMempool);
    });

    test('should set server lockup transaction for chain swaps', async () => {
      const swap = await createChainSwap();
      const txId = 'tx';
      const onchainAmount = swap.sendingData.expectedAmount! + 1;
      const fee = 423;
      const vout = 1;

      const updated = await WrappedSwapRepository.setServerLockupTransaction(
        (await ChainSwapRepository.getChainSwap({
          id: swap.chainSwap.id,
        }))!,
        txId,
        onchainAmount,
        fee,
        vout,
      );

      expect(updated).not.toBeNull();
      expect(updated!.chainSwap.status).toEqual(
        SwapUpdateEvent.TransactionServerMempool,
      );
      expect(updated!.sendingData.fee).toEqual(fee);
      expect(updated!.sendingData.transactionId).toEqual(txId);
      expect(updated!.sendingData.amount).toEqual(onchainAmount);
      expect(updated!.sendingData.transactionVout).toEqual(vout);
    });
  });

  describe('setPreimage', () => {
    test('should set preimage for reverse swaps', async () => {
      const swap = await createReverseSwap();
      const preimage = randomBytes(32);

      const updated = await WrappedSwapRepository.setPreimage(swap, preimage);
      expect(updated.preimage).toEqual(getHexString(preimage));
    });

    test('should set preimage for chain swaps', async () => {
      const swap = await createChainSwap();
      const preimage = randomBytes(32);

      const updated = await WrappedSwapRepository.setPreimage(
        (await ChainSwapRepository.getChainSwap({
          id: swap.chainSwap.id,
        }))!,
        preimage,
      );

      expect(updated.chainSwap.preimage).toEqual(getHexString(preimage));
    });
  });

  describe('setTransactionRefunded', () => {
    test('should set transaction refunded for reverse swaps', async () => {
      const swap = await createReverseSwap();

      const minerFee = 123;
      const reason = 'no';
      swap.minerFee = 321;

      const updated = await WrappedSwapRepository.setTransactionRefunded(
        swap,
        minerFee,
        reason,
      );

      expect(updated.failureReason).toEqual(reason);
      expect(updated.minerFee).toEqual(321 + minerFee);
      expect(updated.status).toEqual(SwapUpdateEvent.TransactionRefunded);
    });

    test('should set transaction refunded for chain swaps', async () => {
      const swap = await createChainSwap();

      const minerFee = 123;
      const reason = 'no';

      const existing = (await ChainSwapRepository.getChainSwap({
        id: swap.chainSwap.id,
      }))!;
      existing.sendingData.fee = 321;
      const updated = await WrappedSwapRepository.setTransactionRefunded(
        existing,
        minerFee,
        reason,
      );

      expect(updated.status).toEqual(SwapUpdateEvent.TransactionRefunded);
      expect(updated.failureReason).toEqual(reason);
      expect(updated.sendingData.fee).toEqual(321 + minerFee);
    });
  });
});
