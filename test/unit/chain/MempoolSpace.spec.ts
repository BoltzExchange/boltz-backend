import Logger from '../../../lib/Logger';
import MempoolSpace from '../../../lib/chain/MempoolSpace';

describe('MempoolSpace', () => {
  test('should filter stale fee estimations', () => {
    const mempool = new MempoolSpace(Logger.disabledLogger, 'BTC', '');
    mempool['apis'].push({
      data: {
        tipHeight: 100,
        fee: 42,
      },
    } as any);
    mempool['apis'].push({
      data: {
        tipHeight: 101,
        fee: 21,
      },
    } as any);

    expect(mempool.latestFee()).toEqual(21);
  });
});
