import { BackupConfig } from '../../../lib/Config';
import Logger from '../../../lib/Logger';
import BackupScheduler from '../../../lib/backup/BackupScheduler';
import S3 from '../../../lib/backup/providers/S3';
import EventHandler from '../../../lib/service/EventHandler';

type callback = (args: { currency: string; channelBackup: string }) => void;

const mockInfo = jest.fn().mockImplementation();
const mockWarn = jest.fn().mockImplementation();
const mockError = jest.fn().mockImplementation();
const mockSilly = jest.fn().mockImplementation();

jest.mock('../../../lib/Logger', () => {
  return jest.fn().mockImplementation(() => ({
    info: mockInfo,
    warn: mockWarn,
    error: mockError,
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

jest.mock('../../../lib/backup/providers/S3', () => {
  return jest.fn().mockImplementation(() => {
    return {
      uploadString: mockUploadString,
    };
  });
});

const mockedS3 = <jest.Mock<S3>>(<any>S3);

describe('BackupScheduler', () => {
  const channelBackupCurrency = 'BTC';

  const eventHandler = mockedEventHandler();

  const backupConfig: BackupConfig = {
    interval: '',
  };

  const backupScheduler = new BackupScheduler(
    mockedLogger(),
    undefined,
    backupConfig,
    eventHandler,
  );

  beforeAll(() => {
    backupScheduler['providers'].push(mockedS3());
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
  });
});
