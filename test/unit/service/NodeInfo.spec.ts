import type { CurrencyConfig } from '../../../lib/Config';
import Logger from '../../../lib/Logger';
import ChainClient from '../../../lib/chain/ChainClient';
import { NodeType } from '../../../lib/db/models/ReverseSwap';
import LndClient from '../../../lib/lightning/LndClient';
import NodeInfo from '../../../lib/service/NodeInfo';
import type { Currency } from '../../../lib/wallet/WalletManager';

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
    id: `${symbol}-id`,
    type: symbol.includes('CLN') ? NodeType.CLN : NodeType.LND,
    serviceName: jest.fn().mockReturnValue(symbol),
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
        lndClients: new Map([['BTC-id', mockedLightningClient('BTC')]]),
        chainClient: mockedChainClient(),
      },
    ],
    [
      'LTC',
      {
        lndClients: new Map([['LTC-id', mockedLightningClient('LTC')]]),
      },
    ],
    [
      'CLN',
      {
        lndClients: new Map(),
        clnClient: mockedLightningClient('CLN'),
        chainClient: mockedChainClient(),
      },
    ],
    [
      'BOTH',
      {
        lndClients: new Map([
          ['BOTH_LND-id', mockedLightningClient('BOTH_LND')],
        ]),
        clnClient: mockedLightningClient('BOTH_CLN'),
        chainClient: mockedChainClient(),
      },
    ],
    ['NEITHER', { lndClients: new Map() }],
  ] as [string, Currency][]);

  const currencyConfigs = [
    {
      symbol: 'BTC',
      noRoute: ['a', 'b'],
    },
    {
      symbol: 'L-BTC',
      noRoute: ['C'],
    },
    {
      symbol: 'R-BTC',
    },
  ] as CurrencyConfig[];

  const nodeInfo = new NodeInfo(
    Logger.disabledLogger,
    currencies,
    currencyConfigs,
  );

  afterAll(() => {
    nodeInfo.stopSchedule();
  });

  test('should fetch node URIs', async () => {
    expect(nodeInfo['uris'].size).toEqual(0);

    await nodeInfo.init();

    expect(nodeInfo['uris'].size).toEqual(4);
  });

  test('should get node URIs', () => {
    expect(nodeInfo.uris.size).toEqual(4);

    expect(nodeInfo.uris.get('BTC')).toEqual(
      new Map([
        [
          'BTC-id',
          {
            nodeKey: 'BTCidentityPubkey',
            uris: ['BTC@127.0.0.1:9735', 'BTC@hidden.onion:9735'],
            nodeType: NodeType.LND,
          },
        ],
      ]),
    );
    expect(nodeInfo.uris.get('LTC')).toEqual(
      new Map([
        [
          'LTC-id',
          {
            nodeKey: 'LTCidentityPubkey',
            uris: ['LTC@127.0.0.1:9735', 'LTC@hidden.onion:9735'],
            nodeType: NodeType.LND,
          },
        ],
      ]),
    );
    expect(nodeInfo.uris.get('CLN')).toEqual(
      new Map([
        [
          'CLN-id',
          {
            nodeKey: 'CLNidentityPubkey',
            uris: ['CLN@127.0.0.1:9735', 'CLN@hidden.onion:9735'],
            nodeType: NodeType.CLN,
          },
        ],
      ]),
    );
    expect(nodeInfo.uris.get('BOTH')).toEqual(
      new Map([
        [
          'BOTH_LND-id',
          {
            nodeKey: 'BOTH_LNDidentityPubkey',
            uris: ['BOTH_LND@127.0.0.1:9735', 'BOTH_LND@hidden.onion:9735'],
            nodeType: NodeType.LND,
          },
        ],
        [
          'BOTH_CLN-id',
          {
            nodeKey: 'BOTH_CLNidentityPubkey',
            uris: ['BOTH_CLN@127.0.0.1:9735', 'BOTH_CLN@hidden.onion:9735'],
            nodeType: NodeType.CLN,
          },
        ],
      ]),
    );
  });

  test('should get node stats', async () => {
    const info = getNodeInfo('BTC');

    expect(nodeInfo.stats.size).toEqual(4);
    expect(nodeInfo.stats.get('BTC')).toEqual(
      new Map([
        [
          'BTC-id',
          {
            channels: 2,
            peers: info.peers,
            oldestChannel: rawTxResult.blocktime,
            capacity: channelsBtc[0].capacity + channelsBtc[1].capacity,
          },
        ],
      ]),
    );
    expect(nodeInfo.stats.get('LTC')).toEqual(
      new Map([
        [
          'LTC-id',
          {
            capacity: 0,
            channels: 0,
            peers: info.peers,
          },
        ],
      ]),
    );
    expect(nodeInfo.stats.get('CLN')).toEqual(
      new Map([
        [
          'CLN-id',
          {
            channels: 2,
            peers: info.peers,
            oldestChannel: rawTxResult.blocktime,
            capacity: channelsBtc[0].capacity + channelsBtc[1].capacity,
          },
        ],
      ]),
    );
    expect(nodeInfo.stats.get('BOTH')).toEqual(
      new Map([
        [
          'BOTH_LND-id',
          {
            channels: 2,
            peers: info.peers,
            oldestChannel: rawTxResult.blocktime,
            capacity: channelsBtc[0].capacity + channelsBtc[1].capacity,
          },
        ],
        [
          'BOTH_CLN-id',
          {
            channels: 2,
            peers: info.peers,
            oldestChannel: rawTxResult.blocktime,
            capacity: channelsBtc[0].capacity + channelsBtc[1].capacity,
          },
        ],
      ]),
    );
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
        Array.from(currency.lndClients.values()).forEach(() => count++);
        if (currency.clnClient !== undefined) {
          count++;
        }
        return count;
      }, 0),
    );
    expect(nodeInfo.isOurNode(pubkey)).toEqual(isOurs);
  });

  test.each`
    symbol     | pubkey | noRoute
    ${'BTC'}   | ${'a'} | ${true}
    ${'BTC'}   | ${'A'} | ${true}
    ${'BTC'}   | ${'b'} | ${true}
    ${'BTC'}   | ${'c'} | ${false}
    ${'L-BTC'} | ${'c'} | ${true}
    ${'RBTC'}  | ${'c'} | ${false}
  `(
    'should check if $symbol node $pubkey is not routable',
    async ({ symbol, pubkey, noRoute }) => {
      expect(nodeInfo.isNoRoute(symbol, pubkey)).toEqual(noRoute);
    },
  );
});
