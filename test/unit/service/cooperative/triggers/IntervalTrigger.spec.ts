import { scheduleJob } from 'node-schedule';
import type Logger from '../../../../../lib/Logger';
import IntervalTrigger from '../../../../../lib/service/cooperative/triggers/IntervalTrigger';

jest.mock('node-schedule');

describe('IntervalTrigger', () => {
  const mockLogger = {
    verbose: jest.fn(),
  } as unknown as Logger;

  const mockCallback = jest.fn().mockResolvedValue(undefined);
  const interval = '*/5 * * * *';

  let mockJob: any;
  let trigger: IntervalTrigger;

  beforeEach(() => {
    jest.clearAllMocks();

    mockJob = {
      cancel: jest.fn(),
    };

    (scheduleJob as jest.Mock).mockReturnValue(mockJob);
  });

  describe('constructor', () => {
    test('should log the batch claim interval', () => {
      trigger = new IntervalTrigger(mockLogger, interval, mockCallback);

      expect(mockLogger.verbose).toHaveBeenCalledTimes(1);
      expect(mockLogger.verbose).toHaveBeenCalledWith(
        `Batch claim interval: ${interval}`,
      );
    });

    test('should schedule a job with the provided interval and callback', () => {
      trigger = new IntervalTrigger(mockLogger, interval, mockCallback);

      expect(scheduleJob).toHaveBeenCalledTimes(1);
      expect(scheduleJob).toHaveBeenCalledWith(interval, expect.any(Function));
    });

    test('should execute the callback when the scheduled job runs', async () => {
      trigger = new IntervalTrigger(mockLogger, interval, mockCallback);

      const scheduledFunction = (scheduleJob as jest.Mock).mock.calls[0][1];

      await scheduledFunction();

      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    test('should work with different interval formats', () => {
      const cronInterval = '0 */2 * * *';
      trigger = new IntervalTrigger(mockLogger, cronInterval, mockCallback);

      expect(scheduleJob).toHaveBeenCalledWith(
        cronInterval,
        expect.any(Function),
      );
    });
  });

  describe('check', () => {
    beforeEach(() => {
      trigger = new IntervalTrigger(mockLogger, interval, mockCallback);
    });

    test('should always return false', async () => {
      const result = await trigger.check();
      expect(result).toBe(false);
    });
  });

  describe('close', () => {
    beforeEach(() => {
      trigger = new IntervalTrigger(mockLogger, interval, mockCallback);
    });

    test('should cancel the scheduled job', () => {
      trigger.close();

      expect(mockJob.cancel).toHaveBeenCalledTimes(1);
    });

    test('should handle close being called multiple times', () => {
      trigger.close();
      trigger.close();

      expect(mockJob.cancel).toHaveBeenCalledTimes(1);
    });
  });
});
