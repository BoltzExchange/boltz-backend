import Logger from '../../../../lib/Logger';
import Database from '../../../../lib/db/Database';
import PendingEthereumTransaction from '../../../../lib/db/models/PendingEthereumTransaction';
import PendingEthereumTransactionRepository from '../../../../lib/db/repositories/PendingEthereumTransactionRepository';
import { networks } from '../../../../lib/wallet/ethereum/EvmNetworks';

describe('PendingEthereumTransactionRepository', () => {
  let database: Database;

  beforeAll(async () => {
    database = new Database(Logger.disabledLogger, Database.memoryDatabase);
    await database.init();
  });

  beforeEach(async () => {
    await PendingEthereumTransaction.truncate();
  });

  afterAll(async () => {
    await database.close();
  });

  describe('getTransactions', () => {
    test('should get all transactions when no chain is specified', async () => {
      await PendingEthereumTransactionRepository.addTransaction(
        'txHash1',
        networks.Rootstock.symbol,
        10,
        100n,
        'hex1',
      );
      await PendingEthereumTransactionRepository.addTransaction(
        'txHash2',
        networks.Ethereum.symbol,
        20,
        200n,
        'hex2',
      );

      const transactions =
        await PendingEthereumTransactionRepository.getTransactions();

      expect(transactions).toHaveLength(2);
      expect(transactions.map((t) => t.chain).sort()).toEqual([
        networks.Ethereum.symbol,
        networks.Rootstock.symbol,
      ]);
    });

    test('should filter transactions by chain', async () => {
      await PendingEthereumTransactionRepository.addTransaction(
        'txHash1',
        networks.Rootstock.symbol,
        10,
        100n,
        'hex1',
      );
      await PendingEthereumTransactionRepository.addTransaction(
        'txHash2',
        networks.Ethereum.symbol,
        20,
        200n,
        'hex2',
      );
      await PendingEthereumTransactionRepository.addTransaction(
        'txHash3',
        networks.Rootstock.symbol,
        11,
        150n,
        'hex3',
      );

      const rskTransactions =
        await PendingEthereumTransactionRepository.getTransactions(
          networks.Rootstock.symbol,
        );

      expect(rskTransactions).toHaveLength(2);
      expect(
        rskTransactions.every((t) => t.chain === networks.Rootstock.symbol),
      ).toBe(true);
      expect(rskTransactions.map((t) => t.hash).sort()).toEqual([
        'txHash1',
        'txHash3',
      ]);

      const ethTransactions =
        await PendingEthereumTransactionRepository.getTransactions(
          networks.Ethereum.symbol,
        );

      expect(ethTransactions).toHaveLength(1);
      expect(ethTransactions[0].chain).toBe(networks.Ethereum.symbol);
      expect(ethTransactions[0].hash).toBe('txHash2');
    });
  });

  describe('getHighestNonce', () => {
    test('should get highest nonce when there are no pending transactions', async () => {
      await expect(
        PendingEthereumTransactionRepository.getHighestNonce(
          networks.Rootstock.symbol,
        ),
      ).resolves.toEqual(undefined);
    });

    test('should get highest nonce when there are pending transactions', async () => {
      await PendingEthereumTransactionRepository.addTransaction(
        'txHash',
        networks.Rootstock.symbol,
        20,
        1n,
        '',
      );

      await expect(
        PendingEthereumTransactionRepository.getHighestNonce(
          networks.Rootstock.symbol,
        ),
      ).resolves.toEqual(21);
    });

    test('should only consider nonces for the specified chain', async () => {
      await PendingEthereumTransactionRepository.addTransaction(
        'txHash1',
        networks.Rootstock.symbol,
        10,
        1n,
        '',
      );
      await PendingEthereumTransactionRepository.addTransaction(
        'txHash2',
        networks.Ethereum.symbol,
        50,
        1n,
        '',
      );
      await PendingEthereumTransactionRepository.addTransaction(
        'txHash3',
        networks.Rootstock.symbol,
        20,
        1n,
        '',
      );

      await expect(
        PendingEthereumTransactionRepository.getHighestNonce(
          networks.Rootstock.symbol,
        ),
      ).resolves.toEqual(21);

      await expect(
        PendingEthereumTransactionRepository.getHighestNonce(
          networks.Ethereum.symbol,
        ),
      ).resolves.toEqual(51);
    });
  });

  describe('getTotalSent', () => {
    test('should get total sent when there are no pending transactions', async () => {
      await expect(
        PendingEthereumTransactionRepository.getTotalSent(
          networks.Rootstock.symbol,
        ),
      ).resolves.toEqual(BigInt(0));
    });

    test('should get total sent when there are pending transactions', async () => {
      await PendingEthereumTransactionRepository.addTransaction(
        'txHash',
        networks.Rootstock.symbol,
        20,
        21n,
        '',
      );
      await PendingEthereumTransactionRepository.addTransaction(
        'txHash2',
        networks.Rootstock.symbol,
        21,
        21n,
        '',
      );

      await expect(
        PendingEthereumTransactionRepository.getTotalSent(
          networks.Rootstock.symbol,
        ),
      ).resolves.toEqual(BigInt(42));
    });

    test('should only sum amounts for the specified chain', async () => {
      await PendingEthereumTransactionRepository.addTransaction(
        'txHash1',
        networks.Rootstock.symbol,
        10,
        100n,
        '',
      );
      await PendingEthereumTransactionRepository.addTransaction(
        'txHash2',
        networks.Ethereum.symbol,
        20,
        500n,
        '',
      );
      await PendingEthereumTransactionRepository.addTransaction(
        'txHash3',
        networks.Rootstock.symbol,
        11,
        200n,
        '',
      );
      await PendingEthereumTransactionRepository.addTransaction(
        'txHash4',
        networks.Ethereum.symbol,
        21,
        300n,
        '',
      );

      await expect(
        PendingEthereumTransactionRepository.getTotalSent(
          networks.Rootstock.symbol,
        ),
      ).resolves.toEqual(BigInt(300));

      await expect(
        PendingEthereumTransactionRepository.getTotalSent(
          networks.Ethereum.symbol,
        ),
      ).resolves.toEqual(BigInt(800));
    });
  });
});
