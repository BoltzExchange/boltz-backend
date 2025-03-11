import { OverPaymentConfig } from '../../../lib/Config';
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

      expect(protector['overPaymentExemptAmount']).toEqual(config.exemptAmount);
      expect(protector['overPaymentMaxPercentage']).toEqual(
        config.maxPercentage! / 100,
      );
    });

    test('should coalesce exempt amount', () => {
      const config: OverPaymentConfig = {
        maxPercentage: 432,
      };
      const protector = new OverpaymentProtector(Logger.disabledLogger, config);

      expect(protector['overPaymentExemptAmount']).toEqual(
        OverpaymentProtector['defaultConfig'].exemptAmount,
      );
      expect(protector['overPaymentMaxPercentage']).toEqual(
        config.maxPercentage! / 100,
      );
    });

    test('should coalesce max fee percentage', () => {
      const config: OverPaymentConfig = {
        exemptAmount: 123,
      };
      const protector = new OverpaymentProtector(Logger.disabledLogger, config);

      expect(protector['overPaymentExemptAmount']).toEqual(config.exemptAmount);
      expect(protector['overPaymentMaxPercentage']).toEqual(
        OverpaymentProtector['defaultConfig'].maxPercentage / 100,
      );
    });

    test('should handle undefined config', () => {
      const protector = new OverpaymentProtector(Logger.disabledLogger);

      expect(protector['overPaymentExemptAmount']).toEqual(
        OverpaymentProtector['defaultConfig'].exemptAmount,
      );
      expect(protector['overPaymentMaxPercentage']).toEqual(
        OverpaymentProtector['defaultConfig'].maxPercentage / 100,
      );
    });
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
