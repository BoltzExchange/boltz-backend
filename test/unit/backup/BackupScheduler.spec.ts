import { Bucket } from '@google-cloud/storage';
import Logger from '../../../lib/Logger';
import Report from '../../../lib/data/Report';
import Swap from '../../../lib/db/models/Swap';
import { OrderSide } from '../../../lib/consts/Enums';
import EventHandler from '../../../lib/service/EventHandler';
import SwapRepository from '../../../lib/db/repositories/SwapRepository';
import ReverseSwapRepository from '../../../lib/db/repositories/ReverseSwapRepository';
import BackupScheduler, { BackupConfig } from '../../../lib/backup/BackupScheduler';

type callback = (currency: string, channelBackup: string) => void;

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

const mockedLogger = <jest.Mock<Logger>><any>Logger;

const swap = {
  fee: 780,
  pair: 'BTC/BTC',
  orderSide: OrderSide.BUY,
  createdAt: '2019-04-19 09:21:01.156 +00:00',
} as any as Swap;

jest.mock('../../../lib/db/repositories/SwapRepository', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getSwaps: () => Promise.resolve([swap]),
    };
  });
});

const mockedSwapRepository = <jest.Mock<SwapRepository>><any>SwapRepository;

jest.mock('../../../lib/db/repositories/ReverseSwapRepository', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getReverseSwaps: () => Promise.resolve([]),
    };
  });
});

const mockedReverseSwapRepository = <jest.Mock<ReverseSwapRepository>><any>ReverseSwapRepository;

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

const mockedEventHandler = <jest.Mock<EventHandler>><any>EventHandler;

const mockSave = jest.fn().mockImplementation(() => Promise.resolve());
const mockUpload = jest.fn().mockImplementation(() => Promise.resolve());

describe('BackupScheduler', () => {
  const dbPath = 'backend.db';

  const channelBackupCurrency = 'BTC';

  const eventHandler = mockedEventHandler();

  const report = new Report(
    mockedSwapRepository(),
    mockedReverseSwapRepository(),
  );

  const backupConfig: BackupConfig = {
    email: '',
    privatekeypath: '',

    bucketname: '',

    interval: '',
  };

  const backupScheduler = new BackupScheduler(
    mockedLogger(),
    dbPath,
    backupConfig,
    eventHandler,
    report,
  );

  backupScheduler['bucket'] = {
    upload: mockUpload,

    file: () => ({
      save: mockSave,
    }),
  } as any as Bucket;

  beforeEach(() => {
    mockWarn.mockClear();

    mockSave.mockClear();
    mockUpload.mockClear();
  });

  test('should format date correctly', () => {
    const date = new Date(1556457455724);
    const dateString = BackupScheduler['getDate'](date);

    const addLeadingZeros = BackupScheduler['addLeadingZeros'];

    expect(dateString).toEqual(
      `${date.getFullYear()}${addLeadingZeros(date.getMonth())}${addLeadingZeros(date.getDate())}` +
      `-${addLeadingZeros(date.getHours())}${addLeadingZeros(date.getMinutes())}`);
  });

  test('should upload the database', async () =>  {
    const date = new Date();
    const dateString = BackupScheduler['getDate'](date);

    await backupScheduler.uploadDatabase(date);

    expect(mockUpload).toHaveBeenCalledTimes(1);
    expect(mockUpload).toHaveBeenCalledWith(
      dbPath,
      {
        destination: `backend/database-${dateString}.db`,
      },
    );
  });

  test('should upload the report', async () => {
    await backupScheduler.uploadReport();

    const csv = await report.generate();

    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockSave).toHaveBeenCalledWith(csv);
  });

  test('should upload LND multi channel backups', async () => {
    const channelBackup = 'b3be5ae30c223333b693a1f310e92edbae2c354abfd8a87ec2c36862c576cde4';

    backupScheduler['subscribeChannelBackups']();
    emitChannelBackup(channelBackupCurrency, channelBackup);

    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockSave).toHaveBeenCalledWith(channelBackup);
  });

  test('should not throw if the private key does not exist', () => {
    const path = 'path';

    new BackupScheduler(
      mockedLogger(),
      dbPath,
      {
        email: '@',
        bucketname: 'bucket',
        privatekeypath: path,
        interval: '0 0 * * *',
      },
      eventHandler,
      report,
    );

    expect(mockWarn).toHaveBeenCalledTimes(1);
    expect(mockWarn).toHaveBeenCalledWith(`Could not start backup scheduler: Error: ENOENT: no such file or directory, open '${path}'`);
  });
});
