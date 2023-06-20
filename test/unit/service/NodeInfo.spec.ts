import Logger from '../../../lib/Logger';
import NodeInfo from '../../../lib/service/NodeInfo';
import LndClient from '../../../lib/lightning/LndClient';
import ChainClient from '../../../lib/chain/ChainClient';

const getNodeInfo = (symbol: string) => ({
  identityPubkey: `${symbol}identityPubkey`,
  urisList: [`${symbol}@127.0.0.1:9735`, `${symbol}@hidden.onion:9735`],
  numPeers: 321,
});

const channelsBtc = [
  {
    pb_private: false,
    capacity: 21,
    chanId: '159429186093056',
    channelPoint:
      '90eaae760896b0a18cfcc12661adda0830520bf4756ef4f7700f1354cdd4a804:0',
  },
  {
    pb_private: false,
    capacity: 7,
    chanId: '113249697726464',
    channelPoint:
      '73c81d3495ba12e62892c95adc5b68147c12f14ef52ecbdcc38b3e75d04291c8:0',
  },
  {
    pb_private: true,
    capacity: 1231123123123123,
    chanId: '713249697726464',
    channelPoint:
      '643a54916d3d982e659487305b93914951d290cfa94b46e8d73645451c5a4cbb:0',
  },
];

jest.mock('../../../lib/lightning/LndClient', () => {
  return jest.fn().mockImplementation((symbol: string) => ({
    getInfo: jest.fn().mockImplementation(async () => {
      return getNodeInfo(symbol);
    }),
    listChannels: jest.fn().mockImplementation(() => {
      if (symbol === 'LTC') {
        return {
          channelsList: [],
        };
      }

      return {
        channelsList: channelsBtc,
      };
    }),
  }));
});

const mockedLndClient = <jest.Mock<LndClient>>(<any>LndClient);

const rawTxResult = { blocktime: 123 };

jest.mock('../../../lib/chain/ChainClient', () => {
  return jest.fn().mockImplementation(() => ({
    getRawTransactionVerbose: jest.fn().mockResolvedValue(rawTxResult),
  }));
});

const mockedChainClient = <jest.Mock<ChainClient>>(<any>ChainClient);

describe('NodeInfo', () => {
  const currencies = new Map<string, any>([
    [
      'BTC',
      {
        lndClient: mockedLndClient('BTC'),
        chainClient: mockedChainClient(),
      },
    ],
    [
      'LTC',
      {
        lndClient: mockedLndClient('LTC'),
      },
    ],
  ]);
  const nodeInfo = new NodeInfo(Logger.disabledLogger, currencies);

  afterAll(() => {
    nodeInfo.stopSchedule();
  });

  test('should fetch node URIs', async () => {
    expect(nodeInfo['uris'].size).toEqual(0);

    await nodeInfo.init();

    expect(nodeInfo['uris'].size).toEqual(2);
  });

  test('should get node URIs', () => {
    const uris = nodeInfo.getUris();

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

  test('should get node stats', async () => {
    const info = getNodeInfo('BTC');

    const nodeStats = nodeInfo.getStats();

    expect(nodeStats.size).toEqual(2);
    expect(nodeStats.get('BTC')).toEqual({
      channels: 2,
      peers: info.numPeers,
      oldestChannel: rawTxResult.blocktime,
      capacity: channelsBtc[0].capacity + channelsBtc[1].capacity,
    });
    expect(nodeStats.get('LTC')).toEqual({
      capacity: 0,
      channels: 0,
      peers: info.numPeers,
    });
  });
});
