import type { OverPaymentConfig } from '../Config';
import type Logger from '../Logger';
import { SwapType } from '../consts/Enums';

class OverpaymentProtector {
  private static readonly defaultConfig: Required<OverPaymentConfig> = {
    exemptAmount: 10_000,
    maxPercentage: 2,
  };

  private readonly exemptAmount: number;
  private readonly maxPercentage: number;

  constructor(logger: Logger, config?: OverPaymentConfig) {
    this.exemptAmount =
      config?.exemptAmount ?? OverpaymentProtector.defaultConfig.exemptAmount;
    this.maxPercentage =
      config?.maxPercentage ?? OverpaymentProtector.defaultConfig.maxPercentage;

    logger.debug(
      `Onchain payment overpayment exempt amount: ${this.exemptAmount}`,
    );
    logger.debug(
      `Maximal accepted onchain overpayment: ${this.maxPercentage}%`,
    );
  }

  public getAllowedPositiveSlippage = (
    amount: number,
    maxPercentageOverride?: number,
  ): number =>
    Math.max(
      this.exemptAmount,
      Math.ceil((amount * (maxPercentageOverride ?? this.maxPercentage)) / 100),
    );

  public isUnacceptableOverpay = (
    type: SwapType,
    expected: number,
    actual: number,
  ): boolean => {
    // For chain swaps we renegotiate overpayments
    if (type === SwapType.Chain) {
      return actual > expected;
    }

    return (
      actual - expected > this.getAllowedPositiveSlippage(expected) ||
      actual > expected * 2
    );
  };
}

export default OverpaymentProtector;
