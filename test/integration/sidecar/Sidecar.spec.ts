import * as noderpc from '../../../lib/proto/cln/node_pb';
import { InvoiceType } from '../../../lib/sidecar/DecodedInvoice';
import Sidecar from '../../../lib/sidecar/Sidecar';
import { clnClient } from '../Nodes';
import { sidecar, startSidecar } from './Utils';

describe('Sidecar', () => {
  beforeAll(async () => {
    startSidecar();
    await Promise.all([
      sidecar.connect(
        { on: jest.fn(), removeAllListeners: jest.fn() } as any,
        {} as any,
        false,
      ),
      clnClient.connect(false),
    ]);
  });

  afterAll(async () => {
    sidecar.disconnect();
    clnClient.disconnect();

    await Sidecar.stop();
  });

  test('should fetch bolt12 offers', async () => {
    const req = new noderpc.OfferRequest();
    req.setAmount('any');
    req.setDescription('test');

    const offer = (
      await clnClient['unaryNodeCall']<
        noderpc.OfferRequest,
        noderpc.OfferResponse.AsObject
      >('offer', req, true)
    ).bolt12;

    expect(offer).toBeDefined();

    const invoice = await sidecar.fetchOffer('BTC', offer, 10_000);
    const decoded = await sidecar.decodeInvoiceOrOffer(invoice);
    expect(decoded.type).toEqual(InvoiceType.Bolt12Invoice);
  });
});
