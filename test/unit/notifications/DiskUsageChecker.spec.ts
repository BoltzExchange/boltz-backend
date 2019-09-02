import { platform } from 'os';
import { DiskUsage } from 'diskusage';
import Logger from '../../../lib/Logger';
import DiscordClient from '../../../lib/notifications/DiscordClient';
import DiskUsageChecker from '../../../lib/notifications/DiskUsageChecker';

const mockSendAlert = jest.fn().mockImplementation(() => Promise.resolve());

jest.mock('../../../lib/notifications/DiscordClient', () => {
  return jest.fn().mockImplementation(() => ({
    sendAlert: mockSendAlert,
  }));
});

const mockedDiscordClient = <jest.Mock<DiscordClient>><any>DiscordClient;

const gigabyte = 1073741824;

let diskUsage: DiskUsage = {
  free: 2 * gigabyte,
  total: 10 * gigabyte,
  available: 1 * gigabyte,
};

const mockCheck = jest.fn().mockImplementation(() => diskUsage);

jest.mock('diskusage', () => {
  return {
    check: async () => {
      return mockCheck();
    },
  };
});

describe('DiskUsageChecker', () => {
  const discordClient = mockedDiscordClient();
  const checker = new DiskUsageChecker(Logger.disabledLogger, discordClient);

  beforeEach(() => {
    mockSendAlert.mockClear();
  });

  test('should get correct root path', () => {
    if (platform() !== 'win32') {
      expect(DiskUsageChecker['rootDir']).toEqual('/');
    } else {
      expect(DiskUsageChecker['rootDir']).toEqual('C:');
    }
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

  test('should send a warning if disk usage is 90% or greater', async () => {
    await checker.checkUsage();

    expect(mockSendAlert).toHaveBeenCalledTimes(1);
    expect(mockSendAlert).toHaveBeenCalledWith('Disk usage is **90%**: **1 GB** of **10 GB** available');

    diskUsage = {
      available: 0,
      free: 5 * gigabyte,
      total: 20 * gigabyte,
    };

    await checker.checkUsage();

    expect(mockSendAlert).toHaveBeenCalledTimes(2);
    expect(mockSendAlert).toHaveBeenCalledWith('Disk usage is **100%**: **0 GB** of **20 GB** available');
  });

  test('should not send a warning if disk usage is less than 90%', async () => {
    diskUsage = {
      free: 5.05 * gigabyte,
      available: 5 * gigabyte,
      total: 10 * gigabyte,
    };

    await checker.checkUsage();

    expect(mockSendAlert).toHaveBeenCalledTimes(0);
  });
});
