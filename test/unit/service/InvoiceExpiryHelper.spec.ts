import { CurrencyConfig } from '../../../lib/Config';
import InvoiceExpiryHelper from '../../../lib/service/InvoiceExpiryHelper';

describe('InvoiceExpiryHelper', () => {
  const currencies = [
    {
      symbol: 'BTC',
      invoiceExpiry: 123,
    },
    {
      symbol: 'LTC',
      invoiceExpiry: 210,
    },
  ] as any as CurrencyConfig[];

  const helper = new InvoiceExpiryHelper(currencies);

  test('should get expiry of invoices', () => {
    // Defined in the currency array
    expect(helper.getExpiry(currencies[0].symbol)).toEqual(currencies[0].invoiceExpiry);
    expect(helper.getExpiry(currencies[1].symbol)).toEqual(currencies[1].invoiceExpiry);

    // Default value
    expect(helper.getExpiry('DOGE')).toEqual(3600);
  });

  test('should calculate expiry of invoices', () => {
    // Should use expiry date when defined
    expect(InvoiceExpiryHelper.getInvoiceExpiry(120, 360)).toEqual(360);

    // Should add default expiry to timestamp when expiry is not defined
    expect(InvoiceExpiryHelper.getInvoiceExpiry(120)).toEqual(3720);

    // should use 0 as timestamp when not defined
    expect(InvoiceExpiryHelper.getInvoiceExpiry()).toEqual(3600);
  });
});
