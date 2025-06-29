import Logger from '../../../../lib/Logger';
import Database from '../../../../lib/db/Database';
import RefundTransaction, {
  RefundStatus,
} from '../../../../lib/db/models/RefundTransaction';
import ChainSwapRepository from '../../../../lib/db/repositories/ChainSwapRepository';
import RefundTransactionRepository from '../../../../lib/db/repositories/RefundTransactionRepository';
import ReverseSwapRepository from '../../../../lib/db/repositories/ReverseSwapRepository';

describe('RefundTransactionRepository', () => {
  const db = new Database(Logger.disabledLogger, Database.memoryDatabase);

  beforeAll(async () => {
    await db.init();
  });

  beforeEach(async () => {
    await RefundTransaction.truncate();
  });

  afterAll(async () => {
    await db.close();
  });

  test('should add refund transaction', async () => {
    const tx = await RefundTransactionRepository.addTransaction({
      swapId: 'swapId',
      id: 'test',
      vin: 123,
    });

    expect(tx).not.toBeNull();
    expect(tx.id).toEqual('test');
    expect(tx.swapId).toEqual('swapId');
    expect(tx.vin).toEqual(123);
    expect(tx.status).toEqual(RefundStatus.Pending);
  });

  test('should set refund transaction status', async () => {
    const swapId = 'swapId';
    await RefundTransactionRepository.addTransaction({
      id: 'test',
      vin: 123,
      swapId,
    });

    await RefundTransactionRepository.setStatus(swapId, RefundStatus.Confirmed);

    const tx = await RefundTransactionRepository.getTransactionForSwap(swapId);
    expect(tx).not.toBeNull();
    expect(tx!.status).toEqual(RefundStatus.Confirmed);
  });

  describe('getTransactionForSwap', () => {
    test('should get transaction for swap', async () => {
      const swapId = 'swapId';
      const transactionId = 'txId';

      await RefundTransactionRepository.addTransaction({
        swapId,
        id: transactionId,
        vin: 456,
      });

      const tx =
        await RefundTransactionRepository.getTransactionForSwap(swapId);

      expect(tx).not.toBeNull();
      expect(tx!.swapId).toEqual(swapId);
      expect(tx!.id).toEqual(transactionId);
      expect(tx!.vin).toEqual(456);
      expect(tx!.status).toEqual(RefundStatus.Pending);
    });

    test('should return null when no transaction exists for swap', async () => {
      await expect(
        RefundTransactionRepository.getTransactionForSwap('not found'),
      ).resolves.toBeNull();
    });
  });

  describe('getPendingTransactions', () => {
    test('should return pending transactions', async () => {
      const swapId = 'swapId';
      const transactionId = 'txId';

      await RefundTransactionRepository.addTransaction({
        swapId,
        id: transactionId,
      });

      ReverseSwapRepository.getReverseSwap = jest.fn().mockResolvedValue({
        id: swapId,
      });

      const txs = await RefundTransactionRepository.getPendingTransactions();
      expect(txs).toHaveLength(1);
      expect(txs[0].tx.id).toEqual(transactionId);
      expect(txs[0].tx.swapId).toEqual(swapId);
      expect(txs[0].tx.status).toEqual(RefundStatus.Pending);
      expect(txs[0].swap.id).toEqual(swapId);
    });
  });

  describe('getSwapForTransaction', () => {
    test('should return reverse swap', async () => {
      const id = 'swapId';

      ReverseSwapRepository.getReverseSwap = jest.fn().mockResolvedValue({
        id,
      });
      ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue(null);

      await expect(
        RefundTransactionRepository['getSwapForTransaction'](id),
      ).resolves.toEqual({ id });

      expect(ReverseSwapRepository.getReverseSwap).toHaveBeenCalledWith({
        id,
      });
    });

    test('should return chain swap', async () => {
      const id = 'swapId';

      ReverseSwapRepository.getReverseSwap = jest.fn().mockResolvedValue(null);
      ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue({
        id,
      });

      await expect(
        RefundTransactionRepository['getSwapForTransaction'](id),
      ).resolves.toEqual({ id });

      expect(ChainSwapRepository.getChainSwap).toHaveBeenCalledWith({
        id,
      });
    });

    test('should throw when both reverse and chain swaps are found', async () => {
      ReverseSwapRepository.getReverseSwap = jest.fn().mockResolvedValue({
        id: 'swapId',
      });
      ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue({
        id: 'swapId',
      });

      await expect(
        RefundTransactionRepository['getSwapForTransaction'],
      ).rejects.toEqual(
        new Error('both reverse and chain swaps found for refund transaction'),
      );
    });

    test('should throw when no swap with id can be found', async () => {
      ReverseSwapRepository.getReverseSwap = jest.fn().mockResolvedValue(null);
      ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue(null);

      await expect(
        RefundTransactionRepository['getSwapForTransaction'],
      ).rejects.toEqual(new Error('no swap found for refund transaction'));
    });
  });
});
