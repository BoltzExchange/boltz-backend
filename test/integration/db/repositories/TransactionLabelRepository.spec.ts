import Logger from '../../../../lib/Logger';
import Database from '../../../../lib/db/Database';
import TransactionLabel from '../../../../lib/db/models/TransactionLabel';
import TransactionLabelRepository from '../../../../lib/db/repositories/TransactionLabelRepository';

describe('TransactionLabelRepository', () => {
  let database: Database;

  beforeAll(async () => {
    database = new Database(Logger.disabledLogger, Database.memoryDatabase);
    await database.init();
  });

  beforeEach(async () => {
    await TransactionLabel.destroy({
      truncate: true,
    });
  });

  afterAll(async () => {
    await database.close();
  });

  test('should add labels', async () => {
    const txId = 'id';
    const symbol = 'BTC';
    const label = 'important info';

    await TransactionLabelRepository.addLabel(txId, symbol, label);

    const entry = await TransactionLabel.findOne({
      where: {
        id: txId,
      },
    });

    expect(entry).not.toBeNull();
    expect(entry!.id).toEqual(txId);
    expect(entry!.symbol).toEqual(symbol);
    expect(entry!.label).toEqual(label);
  });
});
