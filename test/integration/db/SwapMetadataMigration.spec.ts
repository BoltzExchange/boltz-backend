import Logger from '../../../lib/Logger';
import Database from '../../../lib/db/Database';
import DatabaseVersion from '../../../lib/db/models/DatabaseVersion';
import SwapMetadata from '../../../lib/db/models/SwapMetadata';
import DatabaseVersionRepository from '../../../lib/db/repositories/DatabaseVersionRepository';

describe('SwapMetadata migration', () => {
  let database: Database;

  beforeEach(async () => {
    database = new Database(Logger.disabledLogger, Database.memoryDatabase);
    await Database.sequelize.authenticate();
    await DatabaseVersion.sync();
  });

  afterEach(async () => {
    await database.close();
  });

  test('should migrate schema version 26 to 27', async () => {
    await DatabaseVersionRepository.createVersion(26);

    await database.migrate(new Map());

    const table = await Database.sequelize
      .getQueryInterface()
      .describeTable(SwapMetadata.tableName);

    expect(table).toHaveProperty('swap_id');
    expect(table).toHaveProperty('data');
    expect(table).toHaveProperty('created_at');
    expect(table).not.toHaveProperty('updated_at');
    await expect(
      DatabaseVersionRepository.getVersion(),
    ).resolves.toHaveProperty('version', 27);
  });

  test('should tolerate an existing swap metadata table', async () => {
    await SwapMetadata.sync();
    await DatabaseVersionRepository.createVersion(26);

    await expect(database.migrate(new Map())).resolves.toBeUndefined();
    await expect(
      DatabaseVersionRepository.getVersion(),
    ).resolves.toHaveProperty('version', 27);
  });
});
