import Logger from '../../../lib/Logger';
import DiscordClient from '../../../lib/notifications/DiscordClient';
import DiskUsageChecker, {
  DiskUsage,
} from '../../../lib/notifications/DiskUsageChecker';

const mockSendMessage = jest.fn().mockImplementation(() => Promise.resolve());

jest.mock('../../../lib/notifications/DiscordClient', () => {
  return jest.fn().mockImplementation(() => ({
    sendMessage: mockSendMessage,
  }));
});

const mockedDiscordClient = <jest.Mock<DiscordClient>>(<any>DiscordClient);

const gigabyte = DiskUsageChecker['gigabyte'];

const highDiskUsage: DiskUsage = {
  available: 0,
  total: 20 * gigabyte,
};

const lowDiskUsage: DiskUsage = {
  available: 5 * gigabyte,
  total: 10 * gigabyte,
};

let diskUsage: DiskUsage = {
  total: 10 * gigabyte,
  available: gigabyte,
};

const mockGetUsage = jest.fn().mockImplementation(async () => diskUsage);

describe('DiskUsageChecker', () => {
  const discordClient = mockedDiscordClient();
  const checker = new DiskUsageChecker(Logger.disabledLogger, discordClient);

  beforeEach(() => {
    jest.clearAllMocks();
    checker['getUsage'] = mockGetUsage;
  });

  test('should format numbers', () => {
    const formatNumber = checker['formatNumber'];

    expect(formatNumber(100.123)).toEqual(100.12);
    expect(formatNumber(100.0000123)).toEqual(100);
  });

  test('should convert bytes to gigabytes', () => {
    const convertToGb = checker['convertToGb'];

    expect(convertToGb(536870912)).toEqual(0.5);
    expect(convertToGb(1073741824)).toEqual(1);
    expect(convertToGb(2147483648)).toEqual(2);
  });

  test('should get disk usage from df command', async () => {
    const diskUsage = await new DiskUsageChecker(
      Logger.disabledLogger,
      discordClient,
    )['getUsage']();

    expect(diskUsage.total).toBeDefined();
    expect(diskUsage.available).toBeDefined();

    expect(typeof diskUsage.total).toEqual('number');
    expect(typeof diskUsage.available).toEqual('number');
  });

  test('should send a warning if disk usage is 90% or greater', async () => {
    await checker.checkUsage();

    expect(checker['alertSent']).toBeTruthy();

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      ':rotating_light: Disk usage is **90%**: **1 GB** of **10 GB** available :rotating_light:',
    );

    diskUsage = highDiskUsage;

    checker['alertSent'] = false;
    await checker.checkUsage();

    expect(checker['alertSent']).toBeTruthy();

    expect(mockSendMessage).toHaveBeenCalledTimes(2);
    expect(mockSendMessage).toHaveBeenCalledWith(
      ':rotating_light: Disk usage is **100%**: **0 GB** of **20 GB** available :rotating_light:',
    );
  });

  test('should not send a warning if disk usage is less than 90%', async () => {
    diskUsage = lowDiskUsage;

    checker['alertSent'] = false;
    await checker.checkUsage();

    expect(checker['alertSent']).toBeFalsy();
    expect(mockSendMessage).toHaveBeenCalledTimes(0);
  });

  test('should send warnings only once', async () => {
    diskUsage = highDiskUsage;

    checker['alertSent'] = false;
    await checker.checkUsage();
    await checker.checkUsage();

    expect(checker['alertSent']).toBeTruthy();
    expect(mockSendMessage).toHaveBeenCalledTimes(1);
  });
});
