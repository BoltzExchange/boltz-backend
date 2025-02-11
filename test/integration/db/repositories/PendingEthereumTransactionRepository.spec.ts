import Logger from '../../../../lib/Logger';
import Database from '../../../../lib/db/Database';
import PendingEthereumTransaction from '../../../../lib/db/models/PendingEthereumTransaction';
import PendingEthereumTransactionRepository from '../../../../lib/db/repositories/PendingEthereumTransactionRepository';

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

  describe('getHighestNonce', () => {
    test('should get highest nonce when there are no pending transactions', async () => {
      await expect(
        PendingEthereumTransactionRepository.getHighestNonce(),
      ).resolves.toEqual(undefined);
    });

    test('should get highest nonce when there are pending transactions', async () => {
      await PendingEthereumTransactionRepository.addTransaction('txHash', 20);

      await expect(
        PendingEthereumTransactionRepository.getHighestNonce(),
      ).resolves.toEqual(21);
    });
  });
});
