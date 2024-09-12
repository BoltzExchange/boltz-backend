import { getPairId } from '../Utils';
import { PairConfig } from '../consts/Types';
import Errors from '../swap/Errors';
import TimeoutDeltaProvider from './TimeoutDeltaProvider';

class InvoiceExpiryHelper {
  private static readonly minInvoiceExpiry = 60;
  private static readonly defaultInvoiceExpiry = 3_600;

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

  public getExpiry = (pair: string, customExpiry?: number): number => {
    if (customExpiry !== undefined) {
      if (!this.isValidExpiry(pair, customExpiry)) {
        throw Errors.INVALID_INVOICE_EXPIRY();
      }

      return customExpiry;
    }

    return (
      this.invoiceExpiry.get(pair) || InvoiceExpiryHelper.defaultInvoiceExpiry
    );
  };

  private isValidExpiry = (pair: string, expiry: number) =>
    expiry >= InvoiceExpiryHelper.minInvoiceExpiry &&
    expiry <=
      (this.invoiceExpiry.get(pair) ||
        InvoiceExpiryHelper.defaultInvoiceExpiry);
}

export default InvoiceExpiryHelper;
