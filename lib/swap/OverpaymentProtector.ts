import type { OverPaymentConfig } from '../Config';
import type Logger from '../Logger';
import { SwapType } from '../consts/Enums';

export type PositiveSlippageTolerance = {
  exemptAmount: number;
  maxPercentage: number;
};

export const overpaymentDefaultConfig: Required<OverPaymentConfig> = {
  exemptAmount: 10_000,
  maxPercentage: 2,
};

export const resolvePositiveSlippageTolerance = (
  config?: OverPaymentConfig,
  maxPercentageOverride?: number,
): PositiveSlippageTolerance => ({
  exemptAmount: config?.exemptAmount ?? overpaymentDefaultConfig.exemptAmount,
  maxPercentage:
    (maxPercentageOverride ??
      config?.maxPercentage ??
      overpaymentDefaultConfig.maxPercentage) / 100,
});

export const getAllowedPositiveSlippage = (
  amount: number,
  tolerance: PositiveSlippageTolerance,
): number => Math.max(tolerance.exemptAmount, amount * tolerance.maxPercentage);

export const getAllowedPositiveSlippageFromConfig = (
  amount: number,
  config?: OverPaymentConfig,
  maxPercentageOverride?: number,
): number =>
  getAllowedPositiveSlippage(
    amount,
    resolvePositiveSlippageTolerance(config, maxPercentageOverride),
  );

class OverpaymentProtector {
  private static readonly defaultConfig = overpaymentDefaultConfig;

  private readonly overPaymentExemptAmount: number;
  private readonly overPaymentMaxPercentage: number;

  constructor(logger: Logger, config?: OverPaymentConfig) {
    const tolerance = resolvePositiveSlippageTolerance({
      ...OverpaymentProtector.defaultConfig,
      ...config,
    });

    this.overPaymentExemptAmount = tolerance.exemptAmount;
    logger.debug(
      `Onchain payment overpayment exempt amount: ${this.overPaymentExemptAmount}`,
    );

    this.overPaymentMaxPercentage = tolerance.maxPercentage;
    logger.debug(
      `Maximal accepted onchain overpayment: ${this.overPaymentMaxPercentage * 100}%`,
    );
  }

  public isUnacceptableOverpay = (
    type: SwapType,
    expected: number,
    actual: number,
  ): boolean => {
    // For chain swaps we renegotiate overpayments
    if (type === SwapType.Chain) {
      return actual > expected;
    } else {
      return (
        actual - expected >
          getAllowedPositiveSlippage(expected, {
            exemptAmount: this.overPaymentExemptAmount,
            maxPercentage: this.overPaymentMaxPercentage,
          }) || actual > expected * 2
      );
    }
  };
}

export default OverpaymentProtector;
