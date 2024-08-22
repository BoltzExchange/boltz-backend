import { getRoute } from '../../../../lib/lightning/cln/Router';
import { bitcoinClient, bitcoinLndClient, clnClient } from '../../Nodes';

describe('Router', () => {
  beforeAll(async () => {
    await bitcoinClient.generate(1);
    await Promise.all([
      clnClient.connect(false),
      bitcoinLndClient.connect(false),
    ]);
  });

  afterAll(() => {
    clnClient.removeAllListeners();
    clnClient.disconnect();
    bitcoinLndClient.disconnect();
  });

  describe('getRoute', () => {
    test.each`
      cltv
      ${9}
      ${21}
      ${160}
    `('should handle final CLTV $cltv', async ({ cltv }) => {
      const { pubkey } = await bitcoinLndClient.getInfo();

      const route = await getRoute(
        clnClient['unaryNodeCall'],
        pubkey,
        10_000,
        undefined,
        cltv,
      );
      expect(route.ctlv).toEqual(cltv);
      expect(route.feesMsat).toEqual(0);
    });

    test('should throw error when there is no route', async () => {
      const { pubkey } = await bitcoinLndClient.getInfo();

      await expect(
        getRoute(clnClient['unaryNodeCall'], pubkey, 1, 0),
      ).rejects.toEqual(expect.anything());
    });
  });
});
