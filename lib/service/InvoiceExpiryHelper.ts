import { getPairId } from '../Utils';
import { PairConfig } from '../consts/Types';
import TimeoutDeltaProvider from './TimeoutDeltaProvider';

class InvoiceExpiryHelper {
  private static readonly defaultInvoiceExpiry = 3600;

  private readonly invoiceExpiry = new Map<string, number>();

  constructor(pairs: PairConfig[], timeoutDeltaProvider: TimeoutDeltaProvider) {
    for (const pair of pairs) {
      const pairId = getPairId(pair);

      if (pair.invoiceExpiry) {
        this.invoiceExpiry.set(pairId, pair.invoiceExpiry);
        continue;
      }

      const delta = timeoutDeltaProvider.timeoutDeltas.get(getPairId(pair))!
        .quote.reverse;

      // Convert to seconds and divide by 2
      const expiry = Math.ceil(
        (delta * TimeoutDeltaProvider.blockTimes.get(pair.quote)! * 60) / 2,
      );

      this.invoiceExpiry.set(pairId, expiry);
    }
  }

  public getExpiry = (pair: string): number => {
    return (
      this.invoiceExpiry.get(pair) || InvoiceExpiryHelper.defaultInvoiceExpiry
    );
  };

  /**
   * Calculates the expiry of an invoice
   * Reference: https://github.com/lightningnetwork/lightning-rfc/blob/master/11-payment-encoding.md#tagged-fields
   *
   * @param timestamp creation timestamp of the invoice
   * @param timeExpireDate expiry timestamp of the invoice
   */
  public static getInvoiceExpiry = (
    timestamp?: number,
    timeExpireDate?: number,
  ): number => {
    let invoiceExpiry = timestamp || 0;

    if (timeExpireDate) {
      invoiceExpiry = timeExpireDate;
    } else {
      invoiceExpiry += InvoiceExpiryHelper.defaultInvoiceExpiry;
    }

    return invoiceExpiry;
  };
}

export default InvoiceExpiryHelper;
