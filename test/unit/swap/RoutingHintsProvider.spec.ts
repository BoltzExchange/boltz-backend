import Logger from '../../../lib/Logger';
import LndClient from '../../../lib/lightning/LndClient';
import RoutingHintsProvider from '../../../lib/swap/RoutingHintsProvider';

const mockListChannelsResult: any = [
  {
    remotePubkey: '1',
    chanId: 123,
  },
  {
    remotePubkey: '1',
    chanId: 321,
  },
  {
    remotePubkey: '2',
    chanId: 987,
  },
];
const mockListChannels = jest.fn().mockImplementation(async () => {
  return {
    channelsList: mockListChannelsResult,
  };
});

const mockGetChannelInfoResults = new Map<string, any>([
  [
    mockListChannelsResult[0].chanId,
    {
      node1Pub: mockListChannelsResult[0].remotePubkey,
      node1Policy: {
        feeBaseMsat: 2100,
        timeLockDelta: 123,
        feeRateMilliMsat: 100000,
      },
    },
  ],
  [
    mockListChannelsResult[1].chanId,
    {
      node1Pub: 'some other node',
      node2Policy: {
        feeBaseMsat: 1200,
        timeLockDelta: 420,
        feeRateMilliMsat: 90000,
      },
    },
  ],
  [
    mockListChannelsResult[2].chanId,
    {
      node1Pub: mockListChannelsResult[2].remotePubkey,
      node1Policy: {
        feeBaseMsat: 2101,
        timeLockDelta: 123,
        feeRateMilliMsat: 100000,
      },
    },
  ],
]);
const mockGetChannelInfo = jest.fn().mockImplementation(async (channelId: string) => {
  return mockGetChannelInfoResults.get(channelId);
});

const lndSymbol = 'BTC';

jest.mock('../../../lib/lightning/LndClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      symbol: lndSymbol,
      listChannels: mockListChannels,
      getChannelInfo: mockGetChannelInfo,
    };
  });
});

const MockedLndClient =<jest.Mock<LndClient>><any>LndClient;

describe('RoutingHintsProvider', () => {
  let provider = new RoutingHintsProvider(
    Logger.disabledLogger,
    [
      new MockedLndClient()
    ],
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    provider.stop();
  });

  test('should initialize', async () => {
    expect(RoutingHintsProvider['channelFetchInterval']).toEqual(5);

    // Inject a mock into the class to be able to check whether the function is called
    const mockUpdateChannels = jest.fn().mockImplementation();
    provider['updateChannels'] = mockUpdateChannels;

    await provider.start();

    expect(mockUpdateChannels).toHaveBeenCalledTimes(1);

    provider.stop();

    // Initialize a new routing hints provider without the injected mock
    provider = new RoutingHintsProvider(
      Logger.disabledLogger,
      [
        new MockedLndClient(),
      ],
    );
  });

  test('should clear interval when stopped', async () => {
    expect(provider['interval']).toBeUndefined();

    await provider.start();
    expect(provider['interval']).not.toBeUndefined();

    provider.stop();
    expect(provider['interval']).toBeUndefined();
  });

  test('should update private channel list', async () => {
    await provider['updateChannels']();

    expect(mockListChannels).toHaveBeenCalledTimes(1);
    expect(mockListChannels).toHaveBeenCalledWith(true, true);

    expect(mockGetChannelInfo).toHaveBeenCalledTimes(mockListChannelsResult.length);

    for (let i = 0; i < mockListChannelsResult.length; i++) {
      expect(mockGetChannelInfo).toHaveBeenNthCalledWith(i + 1, mockListChannelsResult[i].chanId);
    }

    const channels = provider['channels'];
    const lndChannels = channels.get(lndSymbol)!;

    expect(channels.size).toEqual(1);
    expect(lndChannels.length).toEqual(mockListChannelsResult.length);

    for (let i = 0; i < mockListChannelsResult.length; i++) {
      expect(lndChannels[i]).toEqual({
        channel: mockListChannelsResult[i],
        routingInfo: mockGetChannelInfoResults.get(mockListChannelsResult[i].chanId),
      });
    }
  });

  test('should get routing hints', () => {
    const routingHints = provider.getRoutingHints(lndSymbol, mockListChannelsResult[0].remotePubkey);

    expect(routingHints.length).toEqual(2);

    for (let i = 0; i < routingHints.length; i++) {
      const hintList = routingHints[i].getHopHintsList();

      expect(hintList.length).toEqual(1);

      const channelInfo = mockGetChannelInfoResults.get(mockListChannelsResult[i].chanId)!;
      const routingInfo = i === 0 ? channelInfo.node1Policy : channelInfo.node2Policy;

      expect(hintList[0].getFeeBaseMsat()).toEqual(routingInfo.feeBaseMsat);
      expect(hintList[0].getChanId()).toEqual(mockListChannelsResult[i].chanId);
      expect(hintList[0].getCltvExpiryDelta()).toEqual(routingInfo.timeLockDelta);
      expect(hintList[0].getNodeId()).toEqual(mockListChannelsResult[0].remotePubkey);
      expect(hintList[0].getFeeProportionalMillionths()).toEqual(routingInfo.feeRateMilliMsat);
    }
  });
});
