import Logger from '../../../lib/Logger';
import { wait } from '../../Utils';
import MempoolSpace, {
  MempoolSpaceClient,
} from '../../../lib/chain/MempoolSpace';

describe('MempoolSpace', () => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  MempoolSpaceClient['fetchInterval'] = 500;

  const mempool = new MempoolSpace(
    Logger.disabledLogger,
    'BTC',
    'https://mempool.space/api,https://mempool.michael1011.at/api',
  );

  afterAll(() => {
    mempool.stop();
  });

  test('should init', async () => {
    expect(mempool['apis']).toHaveLength(2);

    expect(mempool.latestFee()).toBeUndefined();
    await mempool.init();
    expect(mempool.latestFee()).not.toBeUndefined();
  });

  test('should pick results in order', async () => {
    mempool.stop();

    const expectedFee = 42;

    mempool['apis'][0]['latestFee'] = expectedFee;
    mempool['apis'][1]['latestFee'] = expectedFee - 12;
    expect(mempool.latestFee()).toEqual(expectedFee);

    mempool['apis'][0]['latestFee'] = undefined;
    mempool['apis'][1]['latestFee'] = expectedFee;
    expect(mempool.latestFee()).toEqual(expectedFee);
  });
});

describe('MempoolSpaceClient', () => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  MempoolSpaceClient['fetchInterval'] = 500;

  const mempoolSpace = new MempoolSpaceClient(
    Logger.disabledLogger,
    'BTC',
    'https://mempool.space/api',
  );

  afterAll(() => {
    mempoolSpace.stop();
  });

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
    const invalidMempoolSpace = new MempoolSpaceClient(
      Logger.disabledLogger,
      'BTC',
      'notEvenAnUrl',
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
