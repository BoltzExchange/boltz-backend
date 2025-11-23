import { scheduleJob } from 'node-schedule';
import type Logger from '../../../../../lib/Logger';
import ScheduledAmountTrigger from '../../../../../lib/service/cooperative/triggers/ScheduledAmountTrigger';

jest.mock('node-schedule');

describe('ScheduledAmountTrigger', () => {
  const mockLogger = {
    verbose: jest.fn(),
    warn: jest.fn(),
  } as unknown as Logger;

  const interval = '0 * * * *';
  const threshold = 100_000;

  let mockJob: any;
  let mockPendingValues: jest.Mock;
  let mockOnTrigger: jest.Mock;
  let trigger: ScheduledAmountTrigger;

  beforeEach(() => {
    jest.clearAllMocks();

    mockJob = {
      cancel: jest.fn(),
    };

    mockPendingValues = jest.fn().mockReturnValue(
      new Map([
        [
          'BTC',
          [
            { id: 'swap1', type: 0, onchainAmount: 50_000 },
            { id: 'swap2', type: 0, onchainAmount: 30_000 },
          ],
        ],
        ['L-BTC', [{ id: 'swap3', type: 1, onchainAmount: 20_000 }]],
      ]),
    );

    mockOnTrigger = jest.fn().mockResolvedValue(undefined);

    (scheduleJob as jest.Mock).mockReturnValue(mockJob);
  });

  describe('constructor', () => {
    test('should schedule a job when config is set', () => {
      trigger = new ScheduledAmountTrigger(
        mockLogger,
        { threshold, interval },
        mockPendingValues,
        mockOnTrigger,
      );

      expect(mockLogger.verbose).toHaveBeenCalledWith(
        `Scheduled amount trigger: >= ${threshold} every ${interval}`,
      );

      expect(scheduleJob).toHaveBeenCalledTimes(1);
      expect(scheduleJob).toHaveBeenCalledWith(interval, expect.any(Function));
    });

    test('should log info and not schedule when config is undefined', () => {
      trigger = new ScheduledAmountTrigger(
        mockLogger,
        undefined,
        mockPendingValues,
        mockOnTrigger,
      );

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Scheduled amount trigger not set',
      );
      expect(scheduleJob).not.toHaveBeenCalled();
    });

    test('should throw error if threshold is undefined', () => {
      expect(() => {
        new ScheduledAmountTrigger(
          mockLogger,
          { interval } as any,
          mockPendingValues,
          mockOnTrigger,
        );
      }).toThrow('scheduleAmountTrigger.threshold is required');
    });

    test('should throw error if interval is undefined', () => {
      expect(() => {
        new ScheduledAmountTrigger(
          mockLogger,
          { threshold } as any,
          mockPendingValues,
          mockOnTrigger,
        );
      }).toThrow('scheduleAmountTrigger.interval is required');
    });
  });

  describe('check', () => {
    beforeEach(() => {
      trigger = new ScheduledAmountTrigger(
        mockLogger,
        { threshold, interval },
        mockPendingValues,
        mockOnTrigger,
      );
    });

    test('should always return false', async () => {
      const result = await trigger.check();
      expect(result).toBe(false);
    });
  });

  describe('checkAndTrigger', () => {
    beforeEach(() => {
      trigger = new ScheduledAmountTrigger(
        mockLogger,
        { threshold, interval },
        mockPendingValues,
        mockOnTrigger,
      );
    });

    test('should trigger sweep when total amount exceeds threshold', async () => {
      mockPendingValues.mockReturnValue(
        new Map([
          [
            'BTC',
            [
              { id: 'swap1', type: 0, onchainAmount: 60_000 },
              { id: 'swap2', type: 0, onchainAmount: 50_000 },
            ],
          ],
          ['L-BTC', [{ id: 'swap3', type: 1, onchainAmount: 20_000 }]],
        ]),
      );

      const scheduledFunction = (scheduleJob as jest.Mock).mock.calls[0][1];

      await scheduledFunction();

      expect(mockOnTrigger).toHaveBeenCalledTimes(1);
      expect(mockOnTrigger).toHaveBeenCalledWith('BTC');
      expect(mockLogger.verbose).toHaveBeenCalledWith(
        `Scheduled amount trigger for BTC: 110000 >= ${threshold}`,
      );
    });

    test('should not trigger sweep when amounts are below threshold', async () => {
      mockPendingValues.mockReturnValue(
        new Map([
          [
            'BTC',
            [
              { id: 'swap1', type: 0, onchainAmount: 40_000 },
              { id: 'swap2', type: 0, onchainAmount: 30_000 },
            ],
          ],
        ]),
      );

      const scheduledFunction = (scheduleJob as jest.Mock).mock.calls[0][1];

      await scheduledFunction();

      expect(mockOnTrigger).not.toHaveBeenCalled();
      expect(mockLogger.verbose).toHaveBeenCalledTimes(1);
    });

    test('should check all configured symbols', async () => {
      mockPendingValues.mockReturnValue(
        new Map([
          ['BTC', [{ id: 'swap1', type: 0, onchainAmount: 150_000 }]],
          ['L-BTC', [{ id: 'swap2', type: 1, onchainAmount: 120_000 }]],
        ]),
      );

      const scheduledFunction = (scheduleJob as jest.Mock).mock.calls[0][1];

      await scheduledFunction();

      expect(mockOnTrigger).toHaveBeenCalledTimes(2);
      expect(mockOnTrigger).toHaveBeenCalledWith('BTC');
      expect(mockOnTrigger).toHaveBeenCalledWith('L-BTC');
    });

    test('should not trigger if config is undefined', async () => {
      trigger = new ScheduledAmountTrigger(
        mockLogger,
        undefined,
        mockPendingValues,
        mockOnTrigger,
      );

      await trigger['checkAndTrigger']();

      expect(mockOnTrigger).not.toHaveBeenCalled();
    });

    test('should calculate total amount correctly', async () => {
      mockPendingValues.mockReturnValue(
        new Map([
          [
            'BTC',
            [
              { id: 'swap1', type: 0, onchainAmount: 30_000 },
              { id: 'swap2', type: 0, onchainAmount: 40_000 },
              { id: 'swap3', type: 0, onchainAmount: 35_000 },
            ],
          ],
        ]),
      );

      const scheduledFunction = (scheduleJob as jest.Mock).mock.calls[0][1];

      await scheduledFunction();

      expect(mockOnTrigger).toHaveBeenCalledWith('BTC');
      expect(mockLogger.verbose).toHaveBeenCalledWith(
        'Scheduled amount trigger for BTC: 105000 >= 100000',
      );
    });
  });

  describe('close', () => {
    test('should cancel the scheduled job', () => {
      trigger = new ScheduledAmountTrigger(
        mockLogger,
        { threshold, interval },
        mockPendingValues,
        mockOnTrigger,
      );

      trigger.close();

      expect(mockJob.cancel).toHaveBeenCalledTimes(1);
    });

    test('should handle close being called multiple times', () => {
      trigger = new ScheduledAmountTrigger(
        mockLogger,
        { threshold, interval },
        mockPendingValues,
        mockOnTrigger,
      );

      trigger.close();
      trigger.close();

      expect(mockJob.cancel).toHaveBeenCalledTimes(1);
    });
  });
});
