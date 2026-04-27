import type { OverPaymentConfig } from '../../../lib/Config';
import Logger from '../../../lib/Logger';
import { SwapType } from '../../../lib/consts/Enums';
import OverpaymentProtector from '../../../lib/swap/OverpaymentProtector';

describe('OverpaymentProtector', () => {
  describe('constructor', () => {
    test('should use config when given as parameter', () => {
      const config: OverPaymentConfig = {
        exemptAmount: 123,
        maxPercentage: 432,
      };
      const protector = new OverpaymentProtector(Logger.disabledLogger, config);

      expect(protector['exemptAmount']).toEqual(config.exemptAmount);
      expect(protector['maxPercentage']).toEqual(config.maxPercentage);
    });

    test('should coalesce exempt amount', () => {
      const config: OverPaymentConfig = {
        maxPercentage: 432,
      };
      const protector = new OverpaymentProtector(Logger.disabledLogger, config);

      expect(protector['exemptAmount']).toEqual(
        OverpaymentProtector['defaultConfig'].exemptAmount,
      );
      expect(protector['maxPercentage']).toEqual(config.maxPercentage);
    });

    test('should coalesce max fee percentage', () => {
      const config: OverPaymentConfig = {
        exemptAmount: 123,
      };
      const protector = new OverpaymentProtector(Logger.disabledLogger, config);

      expect(protector['exemptAmount']).toEqual(config.exemptAmount);
      expect(protector['maxPercentage']).toEqual(
        OverpaymentProtector['defaultConfig'].maxPercentage,
      );
    });

    test('should handle undefined config', () => {
      const protector = new OverpaymentProtector(Logger.disabledLogger);

      expect(protector['exemptAmount']).toEqual(
        OverpaymentProtector['defaultConfig'].exemptAmount,
      );
      expect(protector['maxPercentage']).toEqual(
        OverpaymentProtector['defaultConfig'].maxPercentage,
      );
    });

    test('should preserve zero config values', () => {
      const protector = new OverpaymentProtector(Logger.disabledLogger, {
        exemptAmount: 0,
        maxPercentage: 0,
      });

      expect(protector['exemptAmount']).toEqual(0);
      expect(protector['maxPercentage']).toEqual(0);
    });
  });

  describe('getAllowedPositiveSlippage', () => {
    test.each`
      amount       | config                                   | maxPercentageOverride | expected
      ${100}       | ${undefined}                             | ${undefined}          | ${10_000}
      ${1_000_000} | ${undefined}                             | ${undefined}          | ${20_000}
      ${100}       | ${{ exemptAmount: 123 }}                 | ${undefined}          | ${123}
      ${10_000}    | ${{ exemptAmount: 0, maxPercentage: 1 }} | ${3.5}                | ${350}
    `(
      'should calculate allowed slippage from configured tolerance',
      ({ amount, config, maxPercentageOverride, expected }) => {
        expect(
          new OverpaymentProtector(
            Logger.disabledLogger,
            config,
          ).getAllowedPositiveSlippage(amount, maxPercentageOverride),
        ).toBeCloseTo(expected);
      },
    );

    test('should use the larger configured tolerance', () => {
      expect(
        new OverpaymentProtector(Logger.disabledLogger, {
          exemptAmount: 123,
          maxPercentage: 2,
        }).getAllowedPositiveSlippage(10_000),
      ).toEqual(200);
    });

    test.each`
      amount  | config                                      | maxPercentageOverride | expected
      ${101}  | ${{ exemptAmount: 0, maxPercentage: 1 }}    | ${undefined}          | ${2}
      ${333}  | ${{ exemptAmount: 0, maxPercentage: 1 }}    | ${undefined}          | ${4}
      ${999}  | ${{ exemptAmount: 0, maxPercentage: 0.05 }} | ${undefined}          | ${1}
      ${1}    | ${{ exemptAmount: 0, maxPercentage: 1 }}    | ${undefined}          | ${1}
      ${1000} | ${{ exemptAmount: 0, maxPercentage: 1 }}    | ${0.05}               | ${1}
    `(
      'should round non-integer slippage up to the next integer',
      ({ amount, config, maxPercentageOverride, expected }) => {
        expect(
          new OverpaymentProtector(
            Logger.disabledLogger,
            config,
          ).getAllowedPositiveSlippage(amount, maxPercentageOverride),
        ).toEqual(expected);
      },
    );

    test.each`
      amount    | config                                   | maxPercentageOverride
      ${10_000} | ${{ exemptAmount: 0, maxPercentage: 2 }} | ${undefined}
      ${5_000}  | ${{ exemptAmount: 0, maxPercentage: 1 }} | ${4}
    `(
      'should leave already-integer slippage unchanged',
      ({ amount, config, maxPercentageOverride }) => {
        const protector = new OverpaymentProtector(
          Logger.disabledLogger,
          config,
        );
        const result = protector.getAllowedPositiveSlippage(
          amount,
          maxPercentageOverride,
        );

        expect(Number.isInteger(result)).toBe(true);
        expect(result).toEqual(
          amount * ((maxPercentageOverride ?? config.maxPercentage) / 100),
        );
      },
    );
  });

  describe('isUnacceptableOverpay', () => {
    test.each`
      expected | actual | config
      ${100}   | ${101} | ${{ exemptAmount: 10, maxPercentage: 1 }}
      ${100}   | ${105} | ${{ exemptAmount: 10, maxPercentage: 1 }}
      ${100}   | ${110} | ${{ exemptAmount: 10, maxPercentage: 0 }}
    `(
      'should allow deltas less than exempt amount',
      ({ expected, actual, config }) => {
        expect(
          new OverpaymentProtector(
            Logger.disabledLogger,
            config,
          ).isUnacceptableOverpay(SwapType.Submarine, expected, actual),
        ).toEqual(false);
      },
    );

    test.each`
      expected | actual | config
      ${100}   | ${101} | ${{ exemptAmount: 0, maxPercentage: 10 }}
      ${100}   | ${105} | ${{ exemptAmount: 1, maxPercentage: 10 }}
      ${100}   | ${110} | ${{ exemptAmount: 1, maxPercentage: 10 }}
    `(
      'should allow deltas less than max percentage',
      ({ expected, actual, config }) => {
        expect(
          new OverpaymentProtector(
            Logger.disabledLogger,
            config,
          ).isUnacceptableOverpay(SwapType.Submarine, expected, actual),
        ).toEqual(false);
      },
    );

    test.each`
      expected | actual     | config
      ${100}   | ${103}     | ${{ exemptAmount: 1, maxPercentage: 2 }}
      ${100}   | ${110}     | ${{ exemptAmount: 1, maxPercentage: 2 }}
      ${100}   | ${420_000} | ${{ exemptAmount: 1, maxPercentage: 2 }}
    `(
      'should forbid deltas greater than exempt amount or max percentage',
      ({ expected, actual, config }) => {
        expect(
          new OverpaymentProtector(
            Logger.disabledLogger,
            config,
          ).isUnacceptableOverpay(SwapType.Submarine, expected, actual),
        ).toEqual(true);
      },
    );

    test.each`
      expected | actual | expectedResult
      ${100}   | ${101} | ${true}
      ${100}   | ${105} | ${true}
      ${100}   | ${110} | ${true}
      ${100}   | ${100} | ${false}
    `(
      'should not allow overpayment for chain swaps',
      ({ expected, actual, expectedResult }) => {
        expect(
          new OverpaymentProtector(Logger.disabledLogger).isUnacceptableOverpay(
            SwapType.Chain,
            expected,
            actual,
          ),
        ).toEqual(expectedResult);
      },
    );

    test.each`
      expected | actual  | config                                        | expectedResult
      ${100}   | ${150}  | ${{ exemptAmount: 500, maxPercentage: 60 }}   | ${false}
      ${100}   | ${150}  | ${{ exemptAmount: 500, maxPercentage: 40 }}   | ${false}
      ${100}   | ${300}  | ${{ exemptAmount: 500, maxPercentage: 1 }}    | ${true}
      ${5000}  | ${5500} | ${{ exemptAmount: 100, maxPercentage: 1 }}    | ${true}
      ${1020}  | ${3000} | ${{ exemptAmount: 10_000, maxPercentage: 2 }} | ${true}
    `(
      'should not allow overpayment when actual > expected * 2',
      ({ expected, actual, config, expectedResult }) => {
        expect(
          new OverpaymentProtector(
            Logger.disabledLogger,
            config,
          ).isUnacceptableOverpay(SwapType.Submarine, expected, actual),
        ).toEqual(expectedResult);
      },
    );
  });
});
