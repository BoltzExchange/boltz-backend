import { Bucket } from '@google-cloud/storage';
import Logger from '../../../lib/Logger';
import Report from '../../../lib/data/Report';
import Swap from '../../../lib/db/models/Swap';
import { OrderSide } from '../../../lib/consts/Enums';
import EventHandler from '../../../lib/service/EventHandler';
import SwapRepository from '../../../lib/service/SwapRepository';
import ReverseSwapRepository from '../../../lib/service/ReverseSwapRepository';
import BackupScheduler, { BackupConfig } from '../../../lib/backup/BackupScheduler';

type callback = (currency: string, channelBackup: string) => void;

const swap = {
  fee: 780,
  pair: 'BTC/BTC',
  orderSide: OrderSide.BUY,
  createdAt: '2019-04-19 09:21:01.156 +00:00',
} as any as Swap;

jest.mock('../../../lib/service/SwapRepository', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getSwaps: () => Promise.resolve([swap]),
    };
  });
});

const mockedSwapRepository = <jest.Mock<SwapRepository>><any>SwapRepository;

jest.mock('../../../lib/service/ReverseSwapRepository', () => {
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
  const dbPath = 'middleware.db';

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
    Logger.disabledLogger,
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
    mockSave.mockClear();
    mockUpload.mockClear();
  });

  test('should format date correctly', () => {
    const date = new Date(1556457455724);
    const dateString = BackupScheduler['getDate'](date);

    expect(dateString).toEqual('20190328-1517');
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
});
