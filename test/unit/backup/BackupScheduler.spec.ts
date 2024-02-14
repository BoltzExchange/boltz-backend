import { BackupConfig } from '../../../lib/Config';
import Logger from '../../../lib/Logger';
import BackupScheduler from '../../../lib/backup/BackupScheduler';
import Webdav from '../../../lib/backup/providers/Webdav';
import Database, { DatabaseType } from '../../../lib/db/Database';
import EventHandler from '../../../lib/service/EventHandler';

type callback = (args: { currency: string; channelBackup: string }) => void;

const mockInfo = jest.fn().mockImplementation();
const mockWarn = jest.fn().mockImplementation();
const mockSilly = jest.fn().mockImplementation();

jest.mock('../../../lib/Logger', () => {
  return jest.fn().mockImplementation(() => ({
    info: mockInfo,
    warn: mockWarn,
    silly: mockSilly,
  }));
});

const mockedLogger = <jest.Mock<Logger>>(<any>Logger);

let emitChannelBackup: callback;

jest.mock('../../../lib/service/EventHandler', () => {
  return jest.fn().mockImplementation(() => {
    return {
      on: (event: string, callback: callback) => {
        expect(event).toEqual('channel.backup');

        emitChannelBackup = callback;
      },
    };
  });
});

const mockedEventHandler = <jest.Mock<EventHandler>>(<any>EventHandler);

let mockUploadStringImplementation = () => Promise.resolve();
const mockUploadString = jest
  .fn()
  .mockImplementation(() => mockUploadStringImplementation());

let mockUploadFileImplementation = () => Promise.resolve();
const mockUploadFile = jest
  .fn()
  .mockImplementation(() => mockUploadFileImplementation());

jest.mock('../../../lib/backup/providers/Webdav', () => {
  return jest.fn().mockImplementation(() => {
    return {
      uploadString: mockUploadString,
      uploadFile: mockUploadFile,
    };
  });
});

const mockedWebdav = <jest.Mock<Webdav>>(<any>Webdav);

describe('BackupScheduler', () => {
  const dbPath = 'backend.db';

  const channelBackupCurrency = 'BTC';

  const eventHandler = mockedEventHandler();

  const backupConfig: BackupConfig = {
    interval: '',
  };

  const backupScheduler = new BackupScheduler(
    mockedLogger(),
    dbPath,
    undefined,
    backupConfig,
    eventHandler,
  );

  beforeAll(() => {
    Database.type = DatabaseType.SQLite;
    backupScheduler['providers'].push(mockedWebdav());
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should format date correctly', () => {
    const date = new Date(1556457455724);
    const dateString = BackupScheduler['getDate'](date);

    const addLeadingZeros = BackupScheduler['addLeadingZeros'];

    expect(dateString).toEqual(
      `${date.getFullYear()}${addLeadingZeros(
        date.getMonth(),
      )}${addLeadingZeros(date.getDate())}` +
        `-${addLeadingZeros(date.getHours())}${addLeadingZeros(
          date.getMinutes(),
        )}`,
    );
  });

  test('should upload the database', async () => {
    const date = new Date();
    const dateString = BackupScheduler['getDate'](date);

    await backupScheduler.uploadDatabase(date);

    expect(mockUploadFile).toHaveBeenCalledTimes(1);
    expect(mockUploadFile).toHaveBeenCalledWith(
      `backend/database-${dateString}.db`,
      dbPath,
    );
  });

  test('should upload LND multi channel backups', async () => {
    const date = new Date();
    const dateString = BackupScheduler['getDate'](date);
    const channelBackup =
      'b3be5ae30c223333b693a1f310e92edbae2c354abfd8a87ec2c36862c576cde4';

    backupScheduler['subscribeChannelBackups']();
    emitChannelBackup({ channelBackup, currency: channelBackupCurrency });

    expect(mockUploadString).toHaveBeenCalledTimes(1);
    expect(mockUploadString).toHaveBeenCalledWith(
      `lnd/BTC/multiChannelBackup-${dateString}`,
      channelBackup,
    );
  });

  test('should not throw when upload fails', async () => {
    mockUploadStringImplementation = () => Promise.reject('service offline');

    backupScheduler['subscribeChannelBackups']();
    emitChannelBackup({
      currency: channelBackupCurrency,
      channelBackup: 'some-data',
    });
    expect(mockUploadString).toHaveBeenCalledTimes(1);

    mockUploadFileImplementation = () => Promise.reject('not working');

    await backupScheduler.uploadDatabase(new Date());
    expect(mockUploadString).toHaveBeenCalledTimes(1);
  });

  test('should not throw if the Google API private key does not exist', () => {
    const path = 'path';

    new BackupScheduler(
      mockedLogger(),
      dbPath,
      undefined,
      {
        interval: '0 0 * * *',

        gcloud: {
          email: '@',
          bucketname: 'bucket',
          privatekeypath: path,
        },
      },
      eventHandler,
    );

    expect(mockWarn).toHaveBeenCalledTimes(1);
    expect(mockWarn).toHaveBeenCalledWith(
      `Could not start backup scheduler: Error: ENOENT: no such file or directory, open '${path}'`,
    );
  });
});
