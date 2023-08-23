import Logger from '../../../../lib/Logger';
import LndClient from '../../../../lib/lightning/LndClient';
import RoutingHintsLnd from '../../../../lib/swap/routing/RoutingHintsLnd';

const mockGetInfo = jest.fn().mockResolvedValue({
  pubkey: 'me',
});

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
  return mockListChannelsResult;
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
      node1Pub: 'me',
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
const mockGetChannelInfo = jest
  .fn()
  .mockImplementation(async (channelId: string) => {
    return mockGetChannelInfoResults.get(channelId);
  });

const lndSymbol = 'BTC';

jest.mock('../../../../lib/lightning/LndClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      symbol: lndSymbol,
      getInfo: mockGetInfo,
      listChannels: mockListChannels,
      getChannelInfo: mockGetChannelInfo,
    };
  });
});

const MockedLndClient = <jest.Mock<LndClient>>(<any>LndClient);

describe('RoutingHintsProvider', () => {
  let provider = new RoutingHintsLnd(
    Logger.disabledLogger,
    new MockedLndClient(),
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    provider.stop();
  });

  test('should initialize', async () => {
    expect(RoutingHintsLnd['channelFetchInterval']).toEqual(15);

    // Inject a mock into the class to be able to check whether the function is called
    const mockUpdateChannels = jest.fn().mockImplementation();
    provider['update'] = mockUpdateChannels;

    await provider.start();

    expect(mockUpdateChannels).toHaveBeenCalledTimes(1);

    provider.stop();

    // Initialize a new routing hints provider without the injected mock
    provider = new RoutingHintsLnd(
      Logger.disabledLogger,
      new MockedLndClient(),
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
    await provider['update']();

    expect(mockListChannels).toHaveBeenCalledTimes(1);
    expect(mockListChannels).toHaveBeenCalledWith(true, true);

    expect(mockGetChannelInfo).toHaveBeenCalledTimes(
      mockListChannelsResult.length,
    );

    for (let i = 0; i < mockListChannelsResult.length; i++) {
      expect(mockGetChannelInfo).toHaveBeenNthCalledWith(
        i + 1,
        mockListChannelsResult[i].chanId,
      );
    }

    const channels = provider['channelInfos'];

    expect(channels.size).toEqual(2);
    expect(channels.get('1')?.length).toEqual(2);
    expect(channels.get('2')?.length).toEqual(1);

    for (const chan of mockListChannelsResult) {
      const chanPolicy = mockGetChannelInfoResults.get(chan.chanId);
      const policy = chanPolicy.node1Policy || chanPolicy.node2Policy;

      const saved = channels.get(chan.remotePubkey);
      expect(saved?.find((entry) => entry[0].chanId === chan.chanId)).toEqual([
        {
          nodeId: chan.remotePubkey,
          chanId: chan.chanId,
          feeBaseMsat: policy.feeBaseMsat,
          cltvExpiryDelta: policy.timeLockDelta,
          feeProportionalMillionths: policy.feeRateMilliMsat,
        },
      ]);
    }
  });

  test('should get routing hints', async () => {
    const pubkey = mockListChannelsResult[0].remotePubkey;
    const routingHints = await provider.routingHints(pubkey);

    expect(routingHints.length).toEqual(2);

    for (const hintList of routingHints) {
      expect(hintList.length).toEqual(1);

      const chanPolicy = mockGetChannelInfoResults.get(hintList[0].chanId)!;
      const routingInfo = chanPolicy.node1Policy || chanPolicy.node2Policy;

      const hint = hintList[0];
      expect(hint.nodeId).toEqual(pubkey);
      expect(hint.feeBaseMsat).toEqual(routingInfo.feeBaseMsat);
      expect(hint.cltvExpiryDelta).toEqual(routingInfo.timeLockDelta);
      expect(hint.feeProportionalMillionths).toEqual(
        routingInfo.feeRateMilliMsat,
      );
    }
  });
});
