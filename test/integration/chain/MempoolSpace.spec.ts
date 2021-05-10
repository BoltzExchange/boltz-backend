import Logger from '../../../lib/Logger';
import MempoolSpace from '../../../lib/chain/MempoolSpace';
import { wait } from '../../Utils';

describe('MempoolSpace', () => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  MempoolSpace['fetchInterval'] = 500;

  const mempoolSpace = new MempoolSpace(
    Logger.disabledLogger,
    'BTC',
    'https://mempool.space/api',
  );

  test('should init', async () => {
    expect(mempoolSpace.latestFee).toBeUndefined();
    expect(mempoolSpace['fetchInterval']).toBeUndefined();

    await mempoolSpace.init();

    expect(mempoolSpace.latestFee).not.toBeUndefined();
    expect(mempoolSpace['fetchInterval']).not.toBeUndefined();
  });

  test('should fetch new fee estimations on every interval iteration', async () => {
    mempoolSpace.latestFee = undefined;

    await wait(1500);

    expect(mempoolSpace.latestFee).not.toBeUndefined();
    expect(mempoolSpace.latestFee).toBeGreaterThan(0);
  });

  test('should stop', () => {
    expect(mempoolSpace.latestFee).not.toBeUndefined();
    expect(mempoolSpace['fetchInterval']).not.toBeUndefined();

    mempoolSpace.stop();

    expect(mempoolSpace.latestFee).toBeUndefined();
    expect(mempoolSpace['fetchInterval']).toBeUndefined();
  });

  test('should fetch recommended fees', async () => {
    mempoolSpace.latestFee = undefined;

    expect(mempoolSpace.latestFee).toBeUndefined();

    await mempoolSpace['fetchRecommendedFees']();

    expect(mempoolSpace.latestFee).not.toBeUndefined();
    expect(mempoolSpace.latestFee).toBeGreaterThan(0);

    mempoolSpace.latestFee = undefined;
  });

  test('should handle failed requests', async () => {
    const invalidMempoolSpace = new MempoolSpace(
      Logger.disabledLogger,
      'BTC',
      'https://notmempool.space/api',
    );

    const sanityCheckFailedHandling = async () => {
      invalidMempoolSpace['latestFee'] = 1;

      await invalidMempoolSpace['fetchRecommendedFees']();

      expect(invalidMempoolSpace['latestFee']).toBeUndefined();
    };

    // Invalid URL (Axios error)
    await sanityCheckFailedHandling();

    // Invalid path (parsing error)
    invalidMempoolSpace['apiUrl'] = 'https://mempool.space/notApi';
    await sanityCheckFailedHandling();
  });
});
