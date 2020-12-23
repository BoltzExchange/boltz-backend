import { bitcoinLndClient } from '../Nodes';
import LndClient from '../../../lib/lightning/LndClient';

describe('LndClient', () => {
  beforeAll(async () => {
    await bitcoinLndClient.connect();
  });

  afterAll(async () => {
    bitcoinLndClient.disconnect();
  });

  test('should calculate payment fees', async () => {
    const calculatePaymentFee = bitcoinLndClient['calculatePaymentFee'];

    const bigInvoiceAmount = 8754398;
    let invoice = await bitcoinLndClient.addInvoice(bigInvoiceAmount);

    // Should use the payment fee ratio for big payments
    expect(calculatePaymentFee(invoice.paymentRequest)).toEqual(Math.ceil(bigInvoiceAmount * LndClient['maxPaymentFeeRatio']));

    // Should use the minimal payment fee for small payments
    invoice = await bitcoinLndClient.addInvoice(1);
    expect(calculatePaymentFee(invoice.paymentRequest)).toEqual(LndClient['minPaymentFee']);

    invoice = await bitcoinLndClient.addInvoice(0);
    expect(calculatePaymentFee(invoice.paymentRequest)).toEqual(LndClient['minPaymentFee']);
  });
});
