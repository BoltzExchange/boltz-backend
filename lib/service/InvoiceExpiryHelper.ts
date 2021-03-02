import { CurrencyConfig } from '../Config';

class InvoiceExpiryHelper {
  private static readonly defaultInvoiceExpiry = 3600;

  private readonly invoiceExpiry = new Map<string, number>();

  constructor(currencies: CurrencyConfig[]) {
    for (const currency of currencies) {
      if (currency.invoiceExpiry) {
        this.invoiceExpiry.set(currency.symbol, currency.invoiceExpiry);
      }
    }
  }

  public getExpiry = (symbol: string): number => {
    return this.invoiceExpiry.get(symbol) || InvoiceExpiryHelper.defaultInvoiceExpiry;
  }

  /**
   * Calculates the expiry of an invoice
   * Reference: https://github.com/lightningnetwork/lightning-rfc/blob/master/11-payment-encoding.md#tagged-fields
   *
   * @param timestamp creation timestamp of the invoice
   * @param timeExpireDate expiry timestamp of the invoice
   */
  public static getInvoiceExpiry = (timestamp?: number, timeExpireDate?: number): number => {
    let invoiceExpiry = timestamp || 0;

    if (timeExpireDate) {
      invoiceExpiry = timeExpireDate;
    } else {
      invoiceExpiry += 3600;
    }

    return invoiceExpiry;
  }
}

export default InvoiceExpiryHelper;
