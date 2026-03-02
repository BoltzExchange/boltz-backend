import Logger from '../../../lib/Logger';
import Database from '../../../lib/db/Database';
import Migration from '../../../lib/db/Migration';
import { getPostgresDatabase } from '../../Utils';

describe('Migration', () => {
  let database: Database;
  let migration: Migration;

  beforeAll(async () => {
    database = getPostgresDatabase();
    await database.init();
    migration = new Migration(Logger.disabledLogger, Database.sequelize);
  });

  afterAll(async () => {
    await database.close();
  });

  describe('isMissingTableError', () => {
    test('should identify error from describeTable on non-existent table', async () => {
      const nonExistentTable = 'table_that_does_not_exist';
      const queryInterface = Database.sequelize.getQueryInterface();

      let caughtError: unknown;
      try {
        await queryInterface.describeTable(nonExistentTable);
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).toBeDefined();
      expect(
        migration['isMissingTableError'](caughtError, nonExistentTable),
      ).toBe(true);
    });

    test('should return false for unrelated Postgres errors', async () => {
      let caughtError: unknown;
      try {
        await Database.sequelize.query('SELECT * FROM commitments WHERE');
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).toBeDefined();
      expect(migration['isMissingTableError'](caughtError, 'commitments')).toBe(
        false,
      );
    });

    test('should not throw for existing tables', async () => {
      const queryInterface = Database.sequelize.getQueryInterface();
      await expect(
        queryInterface.describeTable('commitments'),
      ).resolves.toBeDefined();
    });
  });
});
