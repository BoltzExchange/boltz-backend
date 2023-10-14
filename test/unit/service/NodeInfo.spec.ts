import Logger from '../../../lib/Logger';
import NodeInfo from '../../../lib/service/NodeInfo';
import LndClient from '../../../lib/lightning/LndClient';
import ChainClient from '../../../lib/chain/ChainClient';
import { Currency } from '../../../lib/wallet/WalletManager';

const getNodeInfo = (symbol: string) => ({
  pubkey: `${symbol}identityPubkey`,
  uris: [`${symbol}@127.0.0.1:9735`, `${symbol}@hidden.onion:9735`],
  peers: 321,
});

const channelsBtc = [
  {
    private: false,
    capacity: 21,
    chanId: '159429186093056',
    channelPoint:
      '90eaae760896b0a18cfcc12661adda0830520bf4756ef4f7700f1354cdd4a804:0',
  },
  {
    private: false,
    capacity: 7,
    chanId: '113249697726464',
    channelPoint:
      '73c81d3495ba12e62892c95adc5b68147c12f14ef52ecbdcc38b3e75d04291c8:0',
  },
  {
    private: true,
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
        return [];
      }

      return channelsBtc;
    }),
  }));
});

const mockedLightningClient = <jest.Mock<LndClient>>(<any>LndClient);

const rawTxResult = { blocktime: 123 };

jest.mock('../../../lib/chain/ChainClient', () => {
  return jest.fn().mockImplementation(() => ({
    getRawTransactionVerbose: jest.fn().mockResolvedValue(rawTxResult),
  }));
});

const mockedChainClient = <jest.Mock<ChainClient>>(<any>ChainClient);

describe('NodeInfo', () => {
  const currencies = new Map<string, Currency>([
    [
      'BTC',
      {
        lndClient: mockedLightningClient('BTC'),
        chainClient: mockedChainClient(),
      },
    ],
    [
      'LTC',
      {
        lndClient: mockedLightningClient('LTC'),
      },
    ],
    [
      'CLN',
      {
        clnClient: mockedLightningClient('CLN'),
        chainClient: mockedChainClient(),
      },
    ],
    [
      'BOTH',
      {
        lndClient: mockedLightningClient('BOTH_LND'),
        clnClient: mockedLightningClient('BOTH_CLN'),
        chainClient: mockedChainClient(),
      },
    ],
    ['NEITHER', {}],
  ] as [string, Currency][]);
  const nodeInfo = new NodeInfo(Logger.disabledLogger, currencies);

  afterAll(() => {
    nodeInfo.stopSchedule();
  });

  test('should fetch node URIs', async () => {
    expect(nodeInfo['uris'].size).toEqual(0);

    await nodeInfo.init();

    expect(nodeInfo['uris'].size).toEqual(4);
  });

  test('should get node URIs', () => {
    const uris = nodeInfo.getUris();

    expect(uris.size).toEqual(4);

    expect(uris.get('BTC')).toEqual({
      nodeKey: 'BTCidentityPubkey',
      uris: ['BTC@127.0.0.1:9735', 'BTC@hidden.onion:9735'],
    });
    expect(uris.get('LTC')).toEqual({
      nodeKey: 'LTCidentityPubkey',
      uris: ['LTC@127.0.0.1:9735', 'LTC@hidden.onion:9735'],
    });
    expect(uris.get('CLN')).toEqual({
      nodeKey: 'CLNidentityPubkey',
      uris: ['CLN@127.0.0.1:9735', 'CLN@hidden.onion:9735'],
    });
    expect(uris.get('BOTH')).toEqual({
      nodeKey: 'BOTH_LNDidentityPubkey',
      uris: ['BOTH_LND@127.0.0.1:9735', 'BOTH_LND@hidden.onion:9735'],
    });
  });

  test('should get node stats', async () => {
    const info = getNodeInfo('BTC');

    const nodeStats = nodeInfo.getStats();

    expect(nodeStats.size).toEqual(4);
    expect(nodeStats.get('BTC')).toEqual({
      channels: 2,
      peers: info.peers,
      oldestChannel: rawTxResult.blocktime,
      capacity: channelsBtc[0].capacity + channelsBtc[1].capacity,
    });
    expect(nodeStats.get('LTC')).toEqual({
      capacity: 0,
      channels: 0,
      peers: info.peers,
    });
    expect(nodeStats.get('CLN')).toEqual({
      channels: 2,
      peers: info.peers,
      oldestChannel: rawTxResult.blocktime,
      capacity: channelsBtc[0].capacity + channelsBtc[1].capacity,
    });
    expect(nodeStats.get('BOTH')).toEqual({
      channels: 4,
      peers: info.peers * 2,
      oldestChannel: rawTxResult.blocktime,
      capacity: (channelsBtc[0].capacity + channelsBtc[1].capacity) * 2,
    });
  });

  test.each`
    pubkey                      | isOurs
    ${'BOTH_LNDidentityPubkey'} | ${true}
    ${'BOTH_CLNidentityPubkey'} | ${true}
    ${'LTCidentityPubkey'}      | ${true}
    ${'CLNidentityPubkey'}      | ${true}
    ${'notOurs'}                | ${false}
  `('should check if node $pubkey is ours', ({ pubkey, isOurs }) => {
    expect(nodeInfo['pubkeys'].size).toEqual(
      Array.from(currencies.values()).reduce((count, currency) => {
        [currency.lndClient, currency.clnClient]
          .filter((client) => client !== undefined)
          .forEach(() => count++);
        return count;
      }, 0),
    );
    expect(nodeInfo.isOurNode(pubkey)).toEqual(isOurs);
  });
});
