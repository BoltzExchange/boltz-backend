import Logger from '../../../lib/Logger';
import MempoolSpace, {
  MempoolSpaceClient,
} from '../../../lib/chain/MempoolSpace';
import { wait } from '../../Utils';

describe('MempoolSpace', () => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  MempoolSpaceClient['fetchInterval'] = 500;

  const mempool = new MempoolSpace(
    Logger.disabledLogger,
    'BTC',
    'https://mempool.space/api,https://mempool.michael1011.net/api',
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

  test('should pick highest returned fee', async () => {
    mempool.stop();

    const expectedFee = 42;
    const tipHeight = 213;

    mempool['apis'][0]['data'] = {
      tipHeight,
      fee: expectedFee - 12,
    };
    mempool['apis'][1]['data'] = {
      tipHeight,
      fee: expectedFee,
    };
    expect(mempool.latestFee()).toEqual(expectedFee);

    mempool['apis'][0]['data'] = undefined;
    mempool['apis'][1]['data'] = { tipHeight, fee: expectedFee };
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
    expect(mempoolSpace.data).toBeUndefined();
    expect(mempoolSpace['fetchInterval']).toBeUndefined();

    await mempoolSpace.init();

    expect(mempoolSpace.data).not.toBeUndefined();
    expect(mempoolSpace['fetchInterval']).not.toBeUndefined();
  });

  test('should fetch new fee estimations on every interval iteration', async () => {
    mempoolSpace.data = undefined;

    await wait(1500);

    expect(mempoolSpace.data).not.toBeUndefined();
    expect(mempoolSpace.data!.fee).toBeGreaterThan(0);
    expect(mempoolSpace.data!.tipHeight).toBeGreaterThan(810_000);
  });

  test('should stop', () => {
    expect(mempoolSpace.data).not.toBeUndefined();
    expect(mempoolSpace['fetchInterval']).not.toBeUndefined();

    mempoolSpace.stop();

    expect(mempoolSpace.data).toBeUndefined();
    expect(mempoolSpace['fetchInterval']).toBeUndefined();
  });

  test('should fetch recommended fees', async () => {
    mempoolSpace.data = undefined;

    expect(mempoolSpace.data).toBeUndefined();

    await mempoolSpace['fetchRecommendedFees']();

    expect(mempoolSpace.data).not.toBeUndefined();
    expect(mempoolSpace.data!.fee).toBeGreaterThan(0);
    expect(mempoolSpace.data!.tipHeight).toBeGreaterThan(810_000);

    mempoolSpace.data = undefined;
  });

  test('should handle failed requests', async () => {
    const invalidMempoolSpace = new MempoolSpaceClient(
      Logger.disabledLogger,
      'BTC',
      'notEvenAnUrl',
    );

    const sanityCheckFailedHandling = async () => {
      invalidMempoolSpace['data'] = {
        fee: 21,
        tipHeight: 123,
      };

      await invalidMempoolSpace['fetchRecommendedFees']();

      expect(invalidMempoolSpace['data']).toBeUndefined();
    };

    // Invalid URL (Axios error)
    await sanityCheckFailedHandling();

    // Invalid path (parsing error)
    invalidMempoolSpace['apiUrl'] = 'https://mempool.space/notApi';
    await sanityCheckFailedHandling();
  });
});
