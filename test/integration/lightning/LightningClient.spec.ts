import Logger from '../../../lib/Logger';
import Database from '../../../lib/db/Database';
import LndClient from '../../../lib/lightning/LndClient';
import { bitcoinClient, bitcoinLndClient } from '../Nodes';
import { calculatePaymentFee } from '../../../lib/lightning/LightningClient';

describe('LightningClient', () => {
  const db = new Database(Logger.disabledLogger, Database.memoryDatabase);

  beforeAll(async () => {
    await db.init();
    await bitcoinClient.connect();
    await Promise.all([bitcoinLndClient.connect(), bitcoinClient.generate(1)]);
  });

  afterAll(async () => {
    bitcoinClient.disconnect();
    bitcoinLndClient.disconnect();

    await db.close();
  });

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
          (await bitcoinLndClient.addInvoice(amount)).paymentRequest,
          0.01,
          LndClient['paymentMinFee'],
        ),
      ).toEqual(fee);
    },
  );
});
