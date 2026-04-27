import Logger from '../../../../lib/Logger';
import Database from '../../../../lib/db/Database';
import ClaimTransaction from '../../../../lib/db/models/ClaimTransaction';
import ClaimTransactionRepository from '../../../../lib/db/repositories/ClaimTransactionRepository';

describe('ClaimTransactionRepository', () => {
  const db = new Database(Logger.disabledLogger, Database.memoryDatabase);

  beforeAll(async () => {
    await db.init();
  });

  beforeEach(async () => {
    await ClaimTransaction.truncate();
  });

  afterAll(async () => {
    await db.close();
  });

  test('should add claim transaction', async () => {
    const tx = await ClaimTransactionRepository.addTransaction({
      swapId: 'swapId',
      symbol: 'RBTC',
      id: 'test',
    });

    expect(tx).not.toBeNull();
    expect(tx.swapId).toEqual('swapId');
    expect(tx.symbol).toEqual('RBTC');
    expect(tx.id).toEqual('test');
  });

  test('should upsert claim transaction', async () => {
    const swapId = 'swapId';

    await ClaimTransactionRepository.addTransaction({
      swapId,
      symbol: 'RBTC',
      id: 'test',
    });

    const upsert = await ClaimTransactionRepository.addTransaction({
      swapId,
      symbol: 'RBTC',
      id: 'test2',
    });

    expect(upsert).not.toBeNull();
    expect(upsert.id).toEqual('test2');

    const fetched =
      await ClaimTransactionRepository.getTransactionForSwap(swapId);
    expect(fetched).not.toBeNull();
    expect(fetched!.id).toEqual('test2');
  });

  describe('persistTransaction', () => {
    test('should persist transaction', async () => {
      await ClaimTransactionRepository.persistTransaction(
        Logger.disabledLogger,
        { swapId: 'swapId', symbol: 'RBTC', id: 'persistTest' },
      );

      const fetched =
        await ClaimTransactionRepository.getTransactionForSwap('swapId');
      expect(fetched).not.toBeNull();
      expect(fetched!.id).toEqual('persistTest');
    });

    test('should swallow and log errors from addTransaction', async () => {
      const addSpy = jest
        .spyOn(ClaimTransactionRepository, 'addTransaction')
        .mockRejectedValueOnce(new Error('db down'));
      const errorSpy = jest.fn();
      const logger = {
        ...Logger.disabledLogger,
        error: errorSpy,
      } as unknown as Logger;

      await expect(
        ClaimTransactionRepository.persistTransaction(logger, {
          swapId: 'swapId',
          symbol: 'RBTC',
          id: 'persistFail',
        }),
      ).resolves.toBeUndefined();

      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy.mock.calls[0][0]).toContain('swapId');
      expect(errorSpy.mock.calls[0][0]).toContain('db down');

      addSpy.mockRestore();
    });
  });

  describe('getTransactionForSwap', () => {
    test('should get transaction for swap', async () => {
      const swapId = 'swapId';
      const transactionId = 'txId';

      await ClaimTransactionRepository.addTransaction({
        swapId,
        id: transactionId,
        symbol: 'RBTC',
      });

      const tx = await ClaimTransactionRepository.getTransactionForSwap(swapId);

      expect(tx).not.toBeNull();
      expect(tx!.swapId).toEqual(swapId);
      expect(tx!.id).toEqual(transactionId);
      expect(tx!.symbol).toEqual('RBTC');
    });

    test('should return null when no transaction exists for swap', async () => {
      await expect(
        ClaimTransactionRepository.getTransactionForSwap('not found'),
      ).resolves.toBeNull();
    });
  });

  describe('getTransactionsForSwaps', () => {
    test('should return an empty array when given no swap ids', async () => {
      await expect(
        ClaimTransactionRepository.getTransactionsForSwaps([]),
      ).resolves.toEqual([]);
    });

    test('should return transactions for matching swap ids only', async () => {
      await ClaimTransactionRepository.addTransaction({
        swapId: 'swapA',
        symbol: 'RBTC',
        id: 'txA',
      });
      await ClaimTransactionRepository.addTransaction({
        swapId: 'swapB',
        symbol: 'USDT',
        id: 'txB',
      });
      await ClaimTransactionRepository.addTransaction({
        swapId: 'swapC',
        symbol: 'BTC',
        id: 'txC',
      });

      const txs = await ClaimTransactionRepository.getTransactionsForSwaps([
        'swapA',
        'swapC',
        'notFound',
      ]);

      expect(txs).toHaveLength(2);
      expect(txs.map((t) => t.swapId).sort()).toEqual(['swapA', 'swapC']);
    });
  });
});
