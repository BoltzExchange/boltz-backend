import Logger from '../../../../../lib/Logger';
import AmountTrigger from '../../../../../lib/service/cooperative/triggers/AmountTrigger';

describe('AmountTrigger', () => {
  describe('constructor', () => {
    test('should throw an error if sweepAmountTrigger is not a number', () => {
      expect(
        () =>
          new AmountTrigger(
            Logger.disabledLogger,
            jest.fn(),
            'not a number' as unknown as number,
          ),
      ).toThrow();
    });

    test.each([0, -1, -100, Number.NEGATIVE_INFINITY])(
      'should throw an error if sweepAmountTrigger is not positive',
      (triggerValue) => {
        expect(
          () =>
            new AmountTrigger(Logger.disabledLogger, jest.fn(), triggerValue),
        ).toThrow();
      },
    );
  });

  describe('check', () => {
    test('should return false if sweepAmountTrigger is not set', async () => {
      const pendingValues = jest.fn();
      const trigger = new AmountTrigger(
        Logger.disabledLogger,
        pendingValues,
        undefined,
      );

      await expect(trigger.check('BTC')).resolves.toEqual(false);
      expect(pendingValues).not.toHaveBeenCalled();
    });

    test('should return false if pendingValues is empty', async () => {
      const pendingValues = jest.fn().mockReturnValue(new Map());
      const trigger = new AmountTrigger(
        Logger.disabledLogger,
        pendingValues,
        100,
      );

      await expect(trigger.check('BTC')).resolves.toEqual(false);
    });

    test('should return false if toSweep is less than sweepAmountTrigger', async () => {
      const pendingValues = jest
        .fn()
        .mockReturnValue(new Map([['BTC', [{ onchainAmount: 21 }]]]));
      const trigger = new AmountTrigger(
        Logger.disabledLogger,
        pendingValues,
        100,
      );

      await expect(trigger.check('BTC')).resolves.toEqual(false);
    });

    test.each([100, 120, 121])(
      'should return true if toSweep is greater or equal to sweepAmountTrigger',
      async (triggerValue) => {
        const pendingValues = jest
          .fn()
          .mockReturnValue(
            new Map([['BTC', [{ onchainAmount: 21 }, { onchainAmount: 100 }]]]),
          );
        const trigger = new AmountTrigger(
          Logger.disabledLogger,
          pendingValues,
          triggerValue,
        );

        await expect(trigger.check('BTC')).resolves.toEqual(true);
      },
    );
  });
});
