import { Sequelize } from 'sequelize';
import Logger from '../../../lib/Logger';
import Migration from '../../../lib/db/Migration';
import DatabaseVersion from '../../../lib/db/models/DatabaseVersion';

const MockedSequelize = <Sequelize><any>jest.fn().mockImplementation(() => {

});

jest.mock('../../../lib/db/models/DatabaseVersion');

DatabaseVersion.sync = jest.fn().mockResolvedValue(undefined);

let mockGetVersionResult: any = undefined;
const mockGetVersion = jest.fn().mockImplementation(async () => {
  return mockGetVersionResult;
});

const mockCreateVersion = jest.fn().mockResolvedValue(undefined);

jest.mock('../../../lib/db/DatabaseVersionRepository', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getVersion: mockGetVersion,
      createVersion: mockCreateVersion,
    };
  });
});

describe('Migration', () => {
  const emptyCurrenciesMap = new Map<any, any>();

  const migration = new Migration(Logger.disabledLogger, MockedSequelize);

  beforeEach(() => {
    mockGetVersionResult = undefined;

    jest.clearAllMocks();
  });

  test('should insert the latest database schema version in case there none already', async () => {
    await migration.migrate(emptyCurrenciesMap);

    expect(mockGetVersion).toHaveBeenCalledTimes(1);

    expect(mockCreateVersion).toHaveBeenCalledTimes(1);
    expect(mockCreateVersion).toHaveBeenCalledWith(Migration['latestSchemaVersion']);
  });

  test('should do nothing in case the database has already the latest schema version', async () => {
    mockGetVersionResult = {
      version: Migration['latestSchemaVersion'],
    };

    await migration.migrate(emptyCurrenciesMap);

    expect(mockGetVersion).toHaveBeenCalledTimes(1);
  });

  test('should throw when there is an unexpected database schema version', async () => {
    mockGetVersionResult = {
      version: -42,
    };

    await expect(migration.migrate(emptyCurrenciesMap)).rejects.toEqual(`found unexpected database version ${mockGetVersionResult.version}`);
  });
});
