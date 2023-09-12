import { randomBytes } from 'crypto';
import { crypto } from 'bitcoinjs-lib';
import Errors from '../../../lib/lightning/Errors';
import { bitcoinClient, bitcoinLndClient, clnClient } from '../Nodes';
import { InvoiceFeature } from '../../../lib/lightning/LightningClient';

describe('ClnClient', () => {
  beforeAll(async () => {
    await bitcoinClient.generate(1);
    await bitcoinLndClient.connect(false);
  });

  afterAll(() => {
    clnClient.removeAllListeners();
    clnClient.disconnect();
    bitcoinLndClient.disconnect();
  });

  test('should init', async () => {
    await clnClient.connect();
  });

  test('should generate hold invoices', async () => {
    const invoice = await clnClient.addHoldInvoice(10_000, randomBytes(32));
    expect(invoice.startsWith('lnbcrt')).toBeTruthy();
  });

  test('should fail settle for invalid states', async () => {
    await expect(clnClient.settleHoldInvoice(randomBytes(32))).rejects.toEqual(
      expect.anything(),
    );

    const preimageHash = randomBytes(32);
    await clnClient.addHoldInvoice(10_000, preimageHash);
    await expect(clnClient.settleHoldInvoice(preimageHash)).rejects.toEqual(
      expect.anything(),
    );
  });

  test('should query routes', async () => {
    const { pubkey } = await bitcoinLndClient.getInfo();

    let routes = await clnClient.queryRoutes(pubkey, 10_000);
    expect(routes.length).toEqual(1);
    expect(routes[0].ctlv).toEqual(9);
    expect(routes[0].feesMsat).toEqual(0);

    routes = await clnClient.queryRoutes(pubkey, 10_000, undefined, 89);
    expect(routes.length).toEqual(1);
    expect(routes[0].ctlv).toEqual(89);
    expect(routes[0].feesMsat).toEqual(0);

    await expect(clnClient.queryRoutes(pubkey, 10_000, 1)).rejects.toEqual(
      Errors.NO_ROUTE(),
    );
  });

  test('should detect pending payments', async () => {
    const preimage = randomBytes(32);
    const invoice = await bitcoinLndClient.addHoldInvoice(
      10_000,
      crypto.sha256(preimage),
    );

    bitcoinLndClient.subscribeSingleInvoice(crypto.sha256(preimage));
    const acceptedPromise = new Promise((resolve) => {
      bitcoinLndClient.on('htlc.accepted', resolve);
    });
    const payPromise = clnClient.sendPayment(invoice);
    await acceptedPromise;

    await expect(clnClient.sendPayment(invoice)).rejects.toEqual(
      'payment already pending',
    );

    await bitcoinLndClient.settleHoldInvoice(preimage);
    expect((await payPromise).preimage).toEqual(preimage);
  });

  test('should emit events for invoice acceptance and settlement', async () => {
    const preimage = randomBytes(32);
    const preimageHash = crypto.sha256(preimage);
    const invoice = await clnClient.addHoldInvoice(10, preimageHash);

    const acceptedPromise = new Promise<void>((resolve) => {
      clnClient.on('htlc.accepted', (eventInvoice: string) => {
        expect(eventInvoice).toEqual(invoice);
        resolve();
      });
    });

    const settledPromise = new Promise<void>((resolve) => {
      clnClient.on('invoice.settled', (eventInvoice: string) => {
        expect(eventInvoice).toEqual(invoice);
        resolve();
      });
    });

    const paymentPromise = bitcoinLndClient.sendPayment(invoice);
    await acceptedPromise;

    await clnClient.settleHoldInvoice(preimage);
    await paymentPromise;
    await settledPromise;
  });

  test('should decode invoices', async () => {
    const mppInvoice =
      'lnbcrt1m1pjdlsrqpp5jde4zp60f39rppkpq3fear0pqptqwpjp63m0v749sffmf0s3dxuqdqqcqzzsxqyz5vqsp5m6qqudhd3z8t2pqrpjekpfn44744zmkp3upafe9u46hx2n8lvr6q9qyyssqlvzl9f5a06m342mdvyl8vfltqt8arqusll7ce792pwyakcp3c0qsgaezprew08ejc2yshverayqjuhz5gtg09n6ffu9pll08n8y3vsqpqpt9f5';
    let res = await clnClient.decodeInvoice(mppInvoice);
    expect(res.features.size).toEqual(1);
    expect(res.features.has(InvoiceFeature.MPP)).toBeTruthy();

    const routingHintsInvoice =
      'lnbc1pjwp5lvpp59kx6l0etkcdzfr33u4e6z2u6thty263w74svcfdgsh0k3svqkdxscqpjsp5emlemc9ehxkc9etwlue29arap0v23n2tfmj2nmu9l8lemn2ta8ls9q7sqqqqqqqqqqqqqqqqqqqsqqqqqysgqdqqmqz9gxqyjw5qrzjqwryaup9lh50kkranzgcdnn2fgvx390wgj5jd07rwr3vxeje0glclll3zu949263tyqqqqlgqqqqqeqqjqqjmswn6zzycvcecrkwlg5cnrpxqr3v46dpsn20fm5g8x8hm8zqqx24t5szrelp6sxs5akftcd2cra8s5vnc4d4k9vkulzr5mwjqz2mqpfvcsyr';
    res = await clnClient.decodeInvoice(routingHintsInvoice);
    expect(res.routingHints.length).toEqual(1);
    expect(res.routingHints[0].length).toEqual(1);
    expect(res.routingHints[0][0]).toEqual({
      nodeId:
        '03864ef025fde8fb587d989186ce6a4a186895ee44a926bfc370e2c366597a3f8f',
      cltvExpiryDelta: 144,
      feeBaseMsat: 1000,
      chanId: '18442547286457930073',
      feeProportionalMillionths: 100,
    });

    // Throw for AMP invoices
    await expect(
      clnClient.decodeInvoice(
        'lnbcrt1m1pjdl0y5pp5f4ljuqc3hphgadf0nqyw8hxn6klcupntynpggm487dcx2slhhndsdqqcqzzsxq9z0rgqsp59fkq9py9rzes0n4gyvwqktk6020cjzjt6lydkd2casxn4gwq00lq9q8pqqqssq4c42h37htf2w873jthvx9n8zfunl07fjvkv739xggy9uvht95crk08qdwqd59hffxryjfgcylkqlzx3hf8q2tkvnjnlkqqn768k5e5gprl27z9',
      ),
    ).rejects.toEqual(expect.anything());
  });
});
