import { OverPaymentConfig } from '../Config';
import Logger from '../Logger';

class OverpaymentProtector {
  private static readonly defaultConfig = {
    exemptAmount: 10_000,
    maxPercentage: 2,
  };

  private readonly overPaymentExemptAmount: number;
  private readonly overPaymentMaxPercentage: number;

  constructor(logger: Logger, config?: OverPaymentConfig) {
    this.overPaymentExemptAmount =
      config?.exemptAmount || OverpaymentProtector.defaultConfig.exemptAmount;
    logger.debug(
      `Onchain payment overpayment exempt amount: ${this.overPaymentExemptAmount}`,
    );

    this.overPaymentMaxPercentage =
      (config?.maxPercentage ||
        OverpaymentProtector.defaultConfig.maxPercentage) / 100;
    logger.debug(
      `Maximal accepted onchain overpayment: ${this.overPaymentMaxPercentage * 100}%`,
    );
  }

  public isUnacceptableOverpay = (expected: number, actual: number): boolean =>
    actual - expected >
    Math.max(
      this.overPaymentExemptAmount,
      actual * this.overPaymentMaxPercentage,
    );
}

export default OverpaymentProtector;
