import Logger from '../../../lib/Logger';
import Database from '../../../lib/db/Database';
import DatabaseVersion from '../../../lib/db/models/DatabaseVersion';
import SwapRoutingMetadata from '../../../lib/db/models/SwapRoutingMetadata';
import DatabaseVersionRepository from '../../../lib/db/repositories/DatabaseVersionRepository';

describe('SwapRoutingMetadata migration', () => {
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

    await expect(
      Database.sequelize
        .getQueryInterface()
        .describeTable(SwapRoutingMetadata.tableName),
    ).resolves.toHaveProperty('data');
    await expect(
      DatabaseVersionRepository.getVersion(),
    ).resolves.toHaveProperty('version', 27);
  });

  test('should tolerate an existing swap routing metadata table', async () => {
    await SwapRoutingMetadata.sync();
    await DatabaseVersionRepository.createVersion(26);

    await expect(database.migrate(new Map())).resolves.toBeUndefined();
    await expect(
      DatabaseVersionRepository.getVersion(),
    ).resolves.toHaveProperty('version', 27);
  });
});
