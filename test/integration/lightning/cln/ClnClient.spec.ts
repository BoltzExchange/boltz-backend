import { crypto } from 'bitcoinjs-lib';
import { randomBytes } from 'crypto';
import { getHexString, getUnixTime } from '../../../../lib/Utils';
import Errors from '../../../../lib/lightning/Errors';
import { InvoiceFeature } from '../../../../lib/lightning/LightningClient';
import * as noderpc from '../../../../lib/proto/cln/node_pb';
import * as primitivesrpc from '../../../../lib/proto/cln/primitives_pb';
import Sidecar from '../../../../lib/sidecar/Sidecar';
import { wait } from '../../../Utils';
import {
  bitcoinClient,
  bitcoinLndClient,
  clnClient,
  waitForClnChainSync,
} from '../../Nodes';
import { sidecar, startSidecar } from '../../sidecar/Utils';

describe('ClnClient', () => {
  beforeAll(async () => {
    startSidecar();

    await bitcoinClient.generate(1);
    await bitcoinLndClient.connect(false);
    await sidecar.connect(
      { on: jest.fn(), removeAllListeners: jest.fn() } as any,
      {} as any,
      false,
    );
  });

  afterAll(async () => {
    await Sidecar.stop();

    clnClient.removeAllListeners();
    clnClient.disconnect();
    bitcoinLndClient.disconnect();
  });

  test('should init', async () => {
    expect(clnClient.isConnected()).toEqual(false);
    await clnClient.connect();
    expect(clnClient.isConnected()).toEqual(true);

    clnClient.subscribeTrackHoldInvoices();
  });

  test('should parse node URIs in getinfo', async () => {
    const { pubkey, uris } = await clnClient.getInfo();

    expect(uris).toHaveLength(1);
    expect(uris[0]).toEqual(`${pubkey}@127.0.0.1:9737`);
  });

  describe('addHoldInvoice', () => {
    test('should generate hold invoices', async () => {
      const invoice = await clnClient.addHoldInvoice(10_000, randomBytes(32));
      expect(invoice.startsWith('lnbcrt')).toBeTruthy();
    });

    test.each`
      expiry
      ${60}
      ${1200}
      ${3600}
      ${43200}
    `('should create invoices with expiry $expiry', async ({ expiry }) => {
      const invoice = await clnClient.addHoldInvoice(
        10_000,
        randomBytes(32),
        undefined,
        expiry,
      );
      const dec = await sidecar.decodeInvoiceOrOffer(invoice);
      expect(dec.isExpired).toEqual(false);
      expect(getUnixTime() + expiry - dec.expiryTimestamp).toBeLessThanOrEqual(
        5,
      );
    });

    test('should create invoices with description hash', async () => {
      const descriptionHash = randomBytes(32);
      const invoice = await clnClient.addHoldInvoice(
        1,
        randomBytes(32),
        undefined,
        undefined,
        undefined,
        descriptionHash,
      );
      const dec = await sidecar.decodeInvoiceOrOffer(invoice);
      expect(getHexString(dec.descriptionHash!)).toEqual(
        getHexString(descriptionHash),
      );
    });

    test('should prefer description hash over memo', async () => {
      const descriptionHash = randomBytes(32);
      const invoice = await clnClient.addHoldInvoice(
        1,
        randomBytes(32),
        undefined,
        undefined,
        'test',
        descriptionHash,
      );
      const dec = await sidecar.decodeInvoiceOrOffer(invoice);
      expect(dec.description).toBeUndefined();
      expect(getHexString(dec.descriptionHash!)).toEqual(
        getHexString(descriptionHash),
      );
    });
  });

  describe('sendPayment', () => {
    test('should send payments', async () => {
      const invoice = await bitcoinLndClient.addInvoice(100);

      const res = await clnClient.sendPayment(invoice.paymentRequest);

      expect(res.feeMsat).toEqual(0);
      expect(getHexString(crypto.sha256(res.preimage))).toEqual(
        getHexString(Buffer.from(invoice.rHash as string, 'base64')),
      );
    });

    test('should handle payment failures', async () => {
      const invoice = await bitcoinLndClient.addInvoice(100);
      await bitcoinLndClient.cancelHoldInvoice(
        Buffer.from(invoice.rHash as string, 'base64'),
      );

      await expect(
        clnClient.sendPayment(invoice.paymentRequest),
      ).rejects.toEqual(
        "Destination said it doesn't know invoice: incorrect_or_unknown_payment_details",
      );
    });
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

    await waitForClnChainSync();

    const payPromise = clnClient.sendPayment(invoice);
    await acceptedPromise;

    await expect(clnClient.sendPayment(invoice)).rejects.toEqual(
      'payment already pending',
    );

    await bitcoinLndClient.settleHoldInvoice(preimage);
    expect((await payPromise).preimage).toEqual(preimage);
  });

  test('should detect successful payments', async () => {
    const invoice = (await bitcoinLndClient.addInvoice(10_000)).paymentRequest;

    const payRes = await clnClient.sendPayment(invoice);
    expect(await clnClient.checkPayStatus(invoice)).toEqual(payRes);
  });

  test('should not throw when getting pay status of BOLT12 invoices', async () => {
    const offerReq = new noderpc.OfferRequest();
    offerReq.setAmount('any');

    const offer: noderpc.OfferResponse.AsObject = await clnClient[
      'unaryNodeCall'
    ]('offer', offerReq, true);

    const invoiceReq = new noderpc.FetchinvoiceRequest();
    invoiceReq.setOffer(offer.bolt12);

    const amount = new primitivesrpc.Amount();
    amount.setMsat(1_000);
    invoiceReq.setAmountMsat(amount);

    const invoice: noderpc.FetchinvoiceResponse.AsObject = await clnClient[
      'unaryNodeCall'
    ]('fetchInvoice', invoiceReq, true);

    await expect(
      clnClient.checkPayStatus(invoice.invoice),
    ).resolves.toBeUndefined();

    await clnClient.sendPayment(invoice.invoice);
    await expect(
      clnClient.checkPayStatus(invoice.invoice),
    ).resolves.not.toBeUndefined();
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

  describe('decodeInvoice', () => {
    test.each`
      name                | data
      ${'BOLT11 invoice'} | ${'lnbcrt10n1pn307v7sp5z8sv5xm8s5pzq0ce3acyaragy837p7eylhrnwcgfqsvqltqqw25qpp5ql2eyvs5ta0x0y2rad38vvkku3kdhxtvcyfwtz78czvpxfym7vtsdq8w3jhxaqxqyjw5qcqp2rzjqfvg48ucx4jzmz43lwqp3ukeekzm37e48nznwhc00avu4kr6vgfnvqqq0sqqqqgqqqqqqqlgqqqqqqgq2q9qxpqysgqsvv505kfm9q5yhjs5c6mw5nhqfzzh20620qlqgjv9d9vgny969r9vm2eamgjwy92kfqxwc0pyv7m4wpshm2fu6qkpkjux048jdv7tusq9jspfe'}
      ${'BOLT12 offer'}   | ${'lno1qgsqvgnwgcg35z6ee2h3yczraddm72xrfua9uve2rlrm9deu7xyfzrckyyp6uwj68kzykhswug0ldtv7ntl8eqlvuww9kggmj6p5mpstd4ju2dc'}
      ${'BOLT12 invoice'} | ${'lni1qqggmp4yg4wwy4qkscckjms6mlme7q3qqc3xu3s3rg94nj40zfsy866mhu5vxne6tcej5878k2mneuvgjy83vggr4ca950vyfd0qacsl76keaxh70jp7ecuutvs3h95rfkrqkmt9c5m4qgqxyfhyvyg6pdvu4tcjvpp7kkal9rp57wj7xv4pl3ajku70rzy3pafqyqlgtqss85jhv5707n4lz3zts5fmndmklklg85fvsg6wldv0p9hv4pqq4u325zvq8t36tg7cgj67pm3pla4dn6d0ulyran3eckeprwtgxnvxpdkkt3fhqguwqn4428t64fgd0lu89tfk4h07tflzhpfuc2vwwfun9kcsr5zs5qgzzuqz2k48ds0gxmq8284355qzaffhzk3tv77xvp00l6drg3utg39qqvjenf03h375smp7pyvnkks9afp6panls6ncysshxxhct9qhtncelnm9ymfw8rrwufd8w70hgft806dfdudzrsqqqqqqqqqqqqqqpgqqqqqqqqqqqqqayjedltzjqqqqqq9yq3n3075s4qs83cccjqyv2kem9wyusr2s9448g00vq3tcknxh9y9r4wdlj9ae7wa2qgp73vppqwhr5k3as394urhzrlm2m856le7g8m8rn3djzxuksdxcvzmdvhzn0uzqj82tst6prngzltpmul002rt7w0vjujw7reppms0wmks2rgyn6d77nzhdz9c7dmt8p0apmy6yjtsvrfkw9mj8yh7ztsf504uxpagry5c'}
    `('should get destination of $name', async ({ data }) => {
      const dec = await clnClient.decodeInvoice(data);
      expect(dec.destination).toEqual(
        '03ae3a5a3d844b5e0ee21ff6ad9e9afe7c83ece39c5b211b96834d860b6d65c537',
      );
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

  test('should subscribe to single invoices', async () => {
    expect.assertions(4);

    const preimage = randomBytes(32);
    const preimageHash = crypto.sha256(preimage);

    const invoice = await clnClient.addHoldInvoice(1_000, preimageHash);

    clnClient.disconnect();

    clnClient.once('htlc.accepted', (acceptedInvoice) => {
      expect(acceptedInvoice).toEqual(invoice);
    });

    const payPromise = bitcoinLndClient.sendPayment(invoice);
    await wait(1_000);

    clnClient.subscribeSingleInvoice(preimageHash);
    expect(clnClient['holdInvoicesToSubscribe'].size).toEqual(1);
    expect(clnClient['holdInvoicesToSubscribe'].has(preimageHash)).toEqual(
      true,
    );

    await clnClient.connect();
    clnClient.subscribeTrackHoldInvoices();

    expect(clnClient['holdInvoicesToSubscribe'].size).toEqual(0);

    await clnClient.settleHoldInvoice(preimage);
    await payPromise;
  });

  test('should get routing hints', async () => {
    await expect(
      clnClient.routingHints(
        '02588a9f9835642d8ab1fb8018f2d9cd85b8fb353cc5375f0f7f59cad87a621336',
      ),
    ).resolves.toEqual([]);

    const channels = await clnClient.listChannels(false, true);
    expect(channels.length).toBeGreaterThan(0);

    const routingHints = await clnClient.routingHints(channels[0].remotePubkey);
    expect(routingHints).toHaveLength(1);
  });

  test.each`
    error                        | expected
    ${{
  message: 'Error calling method Xpay: RpcError { code: Some(203), message: "Destination said it doesn\'t know invoice: incorrect_or_unknown_payment_details", data: None }',
}} | ${"Destination said it doesn't know invoice: incorrect_or_unknown_payment_details"}
    ${{ message: 'gRPC error' }} | ${'gRPC error'}
    ${'fail'}                    | ${'fail'}
  `('should parse error', ({ error, expected }) => {
    expect(clnClient['parseError'](error)).toEqual(expected);
  });
});
