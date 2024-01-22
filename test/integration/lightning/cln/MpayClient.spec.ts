import { crypto } from 'bitcoinjs-lib';
import { bitcoinClient, bitcoinLndClient, clnClient } from '../../Nodes';

describe('MpayClient', () => {
  beforeAll(async () => {
    await bitcoinClient.generate(1);
    await bitcoinLndClient.connect(false);
  });

  afterAll(() => {
    clnClient.removeAllListeners();
    clnClient.disconnect();
    bitcoinLndClient.disconnect();
  });

  const mpay = clnClient['mpay']!;

  test('should init with CLN client', async () => {
    expect(mpay.isConnected()).toEqual(false);
    await clnClient.connect();
    expect(mpay.isConnected()).toEqual(true);
  });

  test('should get info', async () => {
    const info = await mpay.getInfo();
    expect(info).toEqual({
      version: expect.anything(),
    });
  });

  test('should pay invoices', async () => {
    const { paymentRequest, rHash } = await bitcoinLndClient.addInvoice(10_000);

    const payRes = await mpay.sendPayment(paymentRequest, 10_000, 10);

    expect(payRes.feeMsat).not.toBeUndefined();
    expect(crypto.sha256(payRes.preimage)).toEqual(
      Buffer.from(rHash as string, 'base64'),
    );
  });
});
