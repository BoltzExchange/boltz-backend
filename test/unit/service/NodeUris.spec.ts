import NodeUris from '../../../lib/service/NodeUris';
import LndClient from '../../../lib/lightning/LndClient';

const mockGetInfo = jest.fn().mockImplementation(async (symbol: string) => {
  return {
    identityPubkey: `${symbol}identityPubkey`,
    urisList: [`${symbol}@127.0.0.1:9735`, `${symbol}@hidden.onion:9735`],
  };
});

jest.mock('../../../lib/lightning/LndClient', () => {
  return jest.fn().mockImplementation((symbol: string) => ({
    getInfo: () => mockGetInfo(symbol),
  }));
});

const mockedLndClient = <jest.Mock<LndClient>>(<any>LndClient);

describe('NodeUris', () => {
  const currencies = new Map<string, any>([
    [
      'BTC',
      {
        lndClient: mockedLndClient('BTC'),
      },
    ],
    [
      'LTC',
      {
        lndClient: mockedLndClient('LTC'),
      },
    ],
  ]);

  const nodeUris = new NodeUris(currencies);

  test('should fetch node URIs', async () => {
    expect(nodeUris['uris'].size).toEqual(0);

    await nodeUris.init();

    expect(nodeUris['uris'].size).toEqual(2);
  });

  test('should get node URIs', () => {
    const uris = nodeUris.getNodes();

    expect(uris.size).toEqual(2);

    expect(uris.get('BTC')).toEqual({
      nodeKey: 'BTCidentityPubkey',
      uris: ['BTC@127.0.0.1:9735', 'BTC@hidden.onion:9735'],
    });
    expect(uris.get('LTC')).toEqual({
      nodeKey: 'LTCidentityPubkey',
      uris: ['LTC@127.0.0.1:9735', 'LTC@hidden.onion:9735'],
    });
  });
});
