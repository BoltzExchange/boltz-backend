import { satToMsat } from '../../../lib/lightning/ChannelUtils';
import { calculatePaymentFee } from '../../../lib/lightning/LightningClient';
import LndClient from '../../../lib/lightning/LndClient';

describe('LightningClient', () => {
  test.each`
    fee                           | amount
    ${10000}                      | ${1000000}
    ${87544}                      | ${8754398}
    ${LndClient['paymentMinFee']} | ${0}
    ${LndClient['paymentMinFee']} | ${1}
  `(
    'should calculate payment fee $fee for invoice amount $amount',
    async ({ fee, amount }) => {
      expect(
        calculatePaymentFee(
          satToMsat(amount),
          0.01,
          LndClient['paymentMinFee'],
        ),
      ).toEqual(fee);
    },
  );
});
