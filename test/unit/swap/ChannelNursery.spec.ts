import { Op } from 'sequelize';
import { Networks } from 'boltz-core';
import { wait } from '../../Utils';
import Logger from '../../../lib/Logger';
import Swap from '../../../lib/db/models/Swap';
import ChainClient from '../../../lib/chain/ChainClient';
import LndClient from '../../../lib/lightning/LndClient';
import SwapRepository from '../../../lib/db/SwapRepository';
import { Currency } from '../../../lib/wallet/WalletManager';
import { ChannelPoint } from '../../../lib/proto/lnd/rpc_pb';
import ChannelNursery from '../../../lib/swap/ChannelNursery';
import ChannelCreation from '../../../lib/db/models/ChannelCreation';
import ChannelCreationRepository from '../../../lib/db/ChannelCreationRepository';
import { ChannelCreationStatus, OrderSide, SwapUpdateEvent } from '../../../lib/consts/Enums';

let mockGetSwapResult: any = {
  some: 'swapData',
};
const mockGetSwap = jest.fn().mockImplementation(async () => {
  return mockGetSwapResult;
});

const mockSetSwapStatus = jest.fn().mockResolvedValue(undefined);

jest.mock('../../../lib/db/SwapRepository', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getSwap: mockGetSwap,
      setSwapStatus: mockSetSwapStatus,
    };
  });
});

const MockedSwapRepository = <jest.Mock<SwapRepository>>SwapRepository;

const mockSetSettled = jest.fn().mockResolvedValue(undefined);

const mockSetAbandoned = jest.fn().mockResolvedValue(undefined);

const mockSetAttempted = jest.fn().mockResolvedValue(undefined);

let mockGetChannelCreationResult: any = undefined;
const mockGetChannelCreation = jest.fn().mockImplementation(async () => {
  return mockGetChannelCreationResult;
});

let mockGetChannelCreationsResult: any[] = [];
const mockGetChannelCreations = jest.fn().mockImplementation(async () => {
  return mockGetChannelCreationsResult;
});

const mockSetFundingTransaction = jest.fn().mockImplementation(async (arg) => {
  return arg;
});

jest.mock('../../../lib/db/ChannelCreationRepository', () => {
  return jest.fn().mockImplementation(() => {
    return {
      setSettled: mockSetSettled,
      setAbandoned: mockSetAbandoned,
      setAttempted: mockSetAttempted,
      getChannelCreation: mockGetChannelCreation,
      getChannelCreations: mockGetChannelCreations,
      setFundingTransaction: mockSetFundingTransaction,
    };
  });
});

const MockedChannelCreationRepository = <jest.Mock<ChannelCreationRepository>>ChannelCreationRepository;

const mockEstimateFee = jest.fn().mockResolvedValue(3);

jest.mock('../../../lib/chain/ChainClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      estimateFee: mockEstimateFee,
    };
  });
});

const MockedChainClient = <jest.Mock<ChainClient>><any>ChainClient;

type peerOnlineCallback = (nodePublicKey: string) => Promise<void>;
type channelActiveCallback = (channelPoint: ChannelPoint.AsObject) => Promise<void>;

let emitPeerOnline: peerOnlineCallback;
let emitChannelActive: channelActiveCallback;

const mockOnLndClient = jest.fn().mockImplementation((event: string, callback: any) => {
  switch (event) {
    case 'peer.online':
      emitPeerOnline = callback;
      break;
    case 'channel.active':
      emitChannelActive = callback;
      break;
  }
});

let mockListPeersResult: any[] = [];
const mockListPeers = jest.fn().mockImplementation(async () => {
  return {
    peersList: mockListPeersResult,
  };
});

let mockOpenChannelResponse: any = {};
const mockOpenChannel = jest.fn().mockImplementation(async () => {
  if (typeof mockOpenChannelResponse === 'string') {
    const toThrow = mockOpenChannelResponse;
    mockOpenChannelResponse = {};

    throw toThrow;
  }

  return mockOpenChannelResponse;
});

let mockListChannelsResult: any[] = [];
const mockListChannels = jest.fn().mockImplementation(async () => {
  return {
    channelsList: mockListChannelsResult,
  };
});

jest.mock('../../../lib/lightning/LndClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      on: mockOnLndClient,
      listPeers: mockListPeers,
      openChannel: mockOpenChannel,
      listChannels: mockListChannels,
    };
  });
});

const MockedLndClient = <jest.Mock<LndClient>><any>LndClient;

let mockConnectByPublicKeyShouldThrow = false;
const mockConnectByPublicKey = jest.fn().mockImplementation(async () => {
  if (mockConnectByPublicKeyShouldThrow) {
    throw 'some connection error';
  }
});

jest.mock('../../../lib/lightning/ConnectionHelper', () => {
  return jest.fn().mockImplementation(() => ({
    connectByPublicKey: mockConnectByPublicKey,
  }));
});

let mockSettleSwapError: string | undefined = undefined;
const mockSettleSwap = jest.fn().mockImplementation(async () => {
  if (mockSettleSwapError) {
    throw mockSettleSwapError;
  }
});

describe('ChannelNursery', () => {
  let channelNursery: ChannelNursery;

  const btcCurrency = {
    symbol: 'BTC',
    network: Networks.bitcoinRegtest,
    chainClient: new MockedChainClient(),
    lndClient: new MockedLndClient(),
  } as any as Currency;

  const ltcCurrency = {
    symbol: 'LTC',
    network: Networks.litecoinRegtest,
    chainClient: new MockedChainClient(),
    lndClient: new MockedLndClient(),
  } as any as Currency;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset the injected mocked methods
    channelNursery = new ChannelNursery(
      Logger.disabledLogger,
      new MockedSwapRepository(),
      new MockedChannelCreationRepository(),
      mockSettleSwap,
    );

    channelNursery['currencies'].set(btcCurrency.symbol, btcCurrency);
    channelNursery['currencies'].set(ltcCurrency.symbol, ltcCurrency);
  });

  test('should init', async () => {
    const mockOpenChannel = jest.fn().mockResolvedValue(undefined);
    const mockSettleChannelWrapper = jest.fn().mockResolvedValue(undefined);
    const mockRetryOpeningChannels = jest.fn().mockResolvedValue(undefined);
    const mockSettleCreatedChannels = jest.fn().mockResolvedValue(undefined);

    channelNursery.openChannel = mockOpenChannel;
    channelNursery['settleChannelWrapper'] = mockSettleChannelWrapper;
    channelNursery['retryOpeningChannels'] = mockRetryOpeningChannels;
    channelNursery['settleCreatedChannels'] = mockSettleCreatedChannels;

    channelNursery['currencies'] = new Map<string, Currency>();

    await channelNursery.init([
      btcCurrency,
      {
        ...ltcCurrency,
        lndClient: undefined,
      },
    ]);

    expect(channelNursery['currencies'].size).toEqual(2);

    expect(mockOnLndClient).toHaveBeenCalledTimes(2);

    expect(mockRetryOpeningChannels).toHaveBeenCalledTimes(1);
    expect(mockSettleCreatedChannels).toHaveBeenCalledTimes(1);

    // Test peer connection listener
    mockGetChannelCreationsResult = [
      {
        swapId: 'id',
      },
    ];

    mockGetSwapResult = {
      pair: 'BTC/BTC',
      onchainAmount: 1,
      expectedAmount: 1,
      lockupTransactionId: '',
    };

    const nodePublicKey = 'node';
    await emitPeerOnline(nodePublicKey);

    expect(mockGetChannelCreations).toHaveBeenCalledTimes(1);
    expect(mockGetChannelCreations).toHaveBeenCalledWith({
      status: {
        [Op.eq]: ChannelCreationStatus.Attempted,
      },
      nodePublicKey: {
        [Op.eq]: nodePublicKey,
      },
    });

    expect(mockGetSwap).toHaveBeenCalledTimes(1);
    expect(mockGetSwap).toHaveBeenCalledWith({
      id: {
        [Op.eq]: mockGetChannelCreationsResult[0].swapId,
      },
      status: {
        [Op.not]: SwapUpdateEvent.SwapExpired,
      },
    });

    expect(mockOpenChannel).toHaveBeenCalledTimes(1);

    // Should not open channel when Swap is not eligible or cannot be found at all
    mockGetSwapResult.expectedAmount = mockGetSwapResult.onchainAmount * 2;
    await emitPeerOnline(nodePublicKey);

    expect(mockOpenChannel).toHaveBeenCalledTimes(1);

    mockGetSwapResult = undefined;
    await emitPeerOnline(nodePublicKey);

    expect(mockOpenChannel).toHaveBeenCalledTimes(1);

    // Test channel event listener
    mockGetChannelCreationResult = {
      swapId: 'settleId',
    };
    mockGetSwapResult = {};

    const channelPoint = {
      outputIndex: 1,
      fundingTxidBytes: 'PnemZ7+wVd0SLtj9eyJ4IwR9fzEEewM24oSZP2dKmgU=',
    } as any as ChannelPoint.AsObject;
    await emitChannelActive(channelPoint);

    expect(mockGetChannelCreation).toHaveBeenCalledTimes(1);
    expect(mockGetChannelCreation).toHaveBeenCalledWith({
      status: {
        [Op.eq]: ChannelCreationStatus.Created,
      },
      fundingTransactionId: {
        [Op.eq]: '059a4a673f9984e236037b04317f7d042378227bfdd82e12dd55b0bf67a6773e',
      },
      fundingTransactionVout: {
        [Op.eq]: 1,
      },
    });

    expect(mockGetSwap).toHaveBeenCalledTimes(4);
    expect(mockGetSwap).toHaveBeenNthCalledWith(4, {
      id: {
        [Op.eq]: mockGetChannelCreationResult.swapId,
      },
      status: {
        [Op.not]: SwapUpdateEvent.TransactionClaimed,
      },
    });

    expect(mockSettleChannelWrapper).toHaveBeenCalledTimes(1);
    expect(mockSettleChannelWrapper).toHaveBeenCalledWith(mockGetSwapResult, mockGetChannelCreationResult);

    // Should not settle expired Swaps
    mockGetSwapResult.status = SwapUpdateEvent.SwapExpired;

    await emitChannelActive(channelPoint);

    expect(mockSetAbandoned).toHaveBeenCalledTimes(1);
    expect(mockSettleChannelWrapper).toHaveBeenCalledTimes(1);

    // Should not settle when there is no Channel Creation Swap
    mockGetChannelCreationResult = undefined;

    await emitChannelActive(channelPoint);

    expect(mockSetAbandoned).toHaveBeenCalledTimes(1);
    expect(mockSettleChannelWrapper).toHaveBeenCalledTimes(1);
  });

  test('should open channels', async () => {
    const swap = {
      invoice: 'lnbcrt10m1p0delccpp5p5cac22nngz4qhauqp26dqpjpcj0axgqdlvpuu3nl43vcftez46qdqqcqzpgsp5vc9fq50g5g4mazplly5ac906udwx345uk75rad5fh8m75c8xupeq9qy9qsqyc78aqkraklr0jcg6lrg6ha736y7c6ldvjvqfn6zqq90azvzn2znyhdvz0applw2cym58gs32zytlzz943pr9csfluhhxpl88efglycpfqzqy9',
    } as any as Swap;

    const channelCreation = {
      private: true,
      inboundLiquidity: 33,
      status: ChannelCreationStatus.Created,
    } as any as ChannelCreation;

    mockOpenChannelResponse = {
      outputIndex: 2,
      fundingTxidBytes: 'O6Pt/Xp7ErJ6xyw+Z3aPYX/IG8OIilEyOp+4qkseXko=',
    };

    let eventEmitted = false;

    channelNursery.once('channel.created', (eventSwap: Swap, eventChannelCreation: ChannelCreation) => {
      expect(eventSwap).toEqual(swap);
      expect(eventChannelCreation).toEqual(channelCreation);

      eventEmitted = true;
    });

    await channelNursery.openChannel(btcCurrency, swap, channelCreation);

    expect(eventEmitted).toEqual(true);

    expect(mockSetAttempted).toHaveBeenCalledTimes(1);
    expect(mockSetAttempted).toHaveBeenCalledWith(channelCreation);

    expect(mockEstimateFee).toHaveBeenCalledTimes(1);

    expect(mockOpenChannel).toHaveBeenCalledTimes(1);
    expect(mockOpenChannel).toHaveBeenCalledWith(
      '02d4c41c75f79c52d31014f0665f327c47f92505217d9a8b75019374a6ebd04ce0',
      1492538,
      true,
      3,
    );

    expect(mockSetSwapStatus).toHaveBeenCalledTimes(1);
    expect(mockSetSwapStatus).toHaveBeenCalledWith(swap, SwapUpdateEvent.ChannelCreated);

    expect(mockSetFundingTransaction).toHaveBeenCalledTimes(1);
    expect(mockSetFundingTransaction).toHaveBeenCalledWith(channelCreation, '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b', 2);

    // Should retry when the error indicates that our LND is syncing
    mockOpenChannelResponse = '2 UNKNOWN: channels cannot be created before the wallet is fully synced';

    setTimeout(() => {
      mockOpenChannelResponse = {};
    }, 100);

    await channelNursery.openChannel(btcCurrency, swap, channelCreation);

    expect(mockOpenChannel).toHaveBeenCalledTimes(3);

    // Should retry when the error indicated that the remote LND is syncing
    mockOpenChannelResponse = '2 UNKNOWN: received funding error from 0380e1dbcae8ca0df4eb8dca5b7262808c68c9a4eb662fa599db3e6fbaad95e97b: chan_id=4c63f4f69b447ff1c3bb2d729b0ae9349c6687a65540edcf15abb1c936dd24d0, err=Synchronizing blockchain';

    setTimeout(() => {
      mockOpenChannelResponse = {};
    }, 100);

    await channelNursery.openChannel(btcCurrency, swap, channelCreation);

    expect(mockOpenChannel).toHaveBeenCalledTimes(5);

    // Should try to connect to remote node when not connected already
    mockConnectByPublicKeyShouldThrow = false;
    mockOpenChannelResponse = '2 UNKNOWN: peer 02d4c41c75f79c52d31014f0665f327c47f92505217d9a8b75019374a6ebd04ce0 is not online';

    await channelNursery.openChannel(btcCurrency, swap, channelCreation);

    expect(mockOpenChannel).toHaveBeenCalledTimes(6);
    expect(mockConnectByPublicKey).toHaveBeenCalledTimes(1);

    // Should not retry when arbitrary errors are thrown
    mockOpenChannelResponse = 'some other error';

    await channelNursery.openChannel(btcCurrency, swap, channelCreation);

    expect(mockOpenChannel).toHaveBeenCalledTimes(7);
  });

  test('should retry opening channel', async () => {
    const mockOpenChannel = jest.fn().mockResolvedValue(undefined);
    channelNursery['openChannel'] = mockOpenChannel;

    mockGetChannelCreationsResult = [
      {
        swapId: 'id',
        nodePublicKey: 'nodeKey',
      },
    ];
    mockGetSwapResult = {
      pair: 'LTC/BTC',
      onchainAmount: 2,
      expectedAmount: 1,
      lockupTransactionId: '',
    };

    mockListPeersResult = [
      {
        pubKey: mockGetChannelCreationsResult[0].nodePublicKey,
      },
    ];

    const retryOpeningChannels = channelNursery['retryOpeningChannels'];

    await retryOpeningChannels();

    expect(mockGetChannelCreations).toHaveBeenCalledTimes(1);
    expect(mockGetChannelCreations).toHaveBeenCalledWith({
      status: {
        [Op.eq]: ChannelCreationStatus.Attempted,
      },
    });

    expect(mockGetSwap).toHaveBeenCalledTimes(1);
    expect(mockGetSwap).toHaveBeenCalledWith({
      id: {
        [Op.eq]: mockGetChannelCreationsResult[0].swapId,
      },
      status: {
        [Op.not]: SwapUpdateEvent.SwapExpired,
      },
    });

    expect(mockListPeers).toHaveBeenCalledTimes(1);

    expect(mockOpenChannel).toHaveBeenCalledTimes(1);
    expect(mockOpenChannel).toHaveBeenCalledWith(btcCurrency, mockGetSwapResult, mockGetChannelCreationsResult[0]);

    // Should not try to open a channel if no or too little onchain coins were sent
    mockGetSwapResult.expectedAmount = mockGetSwapResult.onchainAmount + 1;
    expect(mockListPeers).toHaveBeenCalledTimes(1);
    expect(mockOpenChannel).toHaveBeenCalledTimes(1);

    await retryOpeningChannels();

    mockGetSwapResult = undefined;

    expect(mockListPeers).toHaveBeenCalledTimes(1);
    expect(mockOpenChannel).toHaveBeenCalledTimes(1);

    await retryOpeningChannels();
  });

  test('should settle channels', async () => {
    const settleChannel = channelNursery['settleChannel'];

    const swap = {
      pair: 'LTC/BTC',
      orderSide: OrderSide.SELL,
    } as any as Swap;

    const channelCreation = {
      fundingTransactionId: 'id',
      fundingTransactionVout: 123,
    } as any as ChannelCreation;

    mockListChannelsResult = [
      { channelPoint: `someOtherChannel:${ channelCreation.fundingTransactionVout }`,
        chanId: 'wrong',
      },
      {
        channelPoint: `${ channelCreation.fundingTransactionId }:${ channelCreation.fundingTransactionVout! - 1 }`,
        chanId: 'wrong',
      },
      {
        channelPoint: `${ channelCreation.fundingTransactionId }:${ channelCreation.fundingTransactionVout }`,
        chanId: 'correct',
      },
    ];

    expect(await settleChannel(swap, channelCreation)).toEqual(true);

    expect(btcCurrency.lndClient!.listChannels).toHaveBeenCalledTimes(1);
    expect(btcCurrency.lndClient!.listChannels).toHaveBeenCalledWith(true);

    expect(mockSettleSwap).toHaveBeenCalledTimes(1);
    expect(mockSettleSwap).toHaveBeenCalledWith(ltcCurrency, swap, 'correct');

    expect(mockSetSettled).toHaveBeenCalledTimes(1);
    expect(mockSetSettled).toHaveBeenNthCalledWith(1, channelCreation);

    // Should also consider channel as settled if the invoice was paid already
    mockSettleSwapError = 'could not pay invoice: invoice is already paid';

    expect(await settleChannel(swap, channelCreation)).toEqual(true);

    expect(mockSetSettled).toHaveBeenCalledTimes(2);
    expect(mockSetSettled).toHaveBeenNthCalledWith(2, channelCreation);

    // Should return false in case the channel cannot be settled
    mockSettleSwapError = 'some other error';

    expect(await settleChannel(swap, channelCreation)).toEqual(false);

    expect(mockSetSettled).toHaveBeenCalledTimes(2);

    mockSettleSwapError = undefined;
  });

  test('should retry settling channels periodically', async () => {
    let settleChannelResult = false;
    const settleChannel = jest.fn().mockImplementation(async () => {
      return settleChannelResult;
    });

    channelNursery['settleChannel'] = settleChannel;

    let resolvePromise: () => void = () => {};

    const lockSettleChannel = () => {
      channelNursery['lock'].acquire('channelSettle', () => {
        return new Promise<void>((resolve) => {
          resolvePromise = resolve;
        });
      });
    };

    const swap = {
      id: 'id123',
      swap: 'swap',
    } as any as Swap;

    const channelCreation = {
      channel: 'creation',
    } as any as ChannelCreation;

    const settleChannelWrapper = channelNursery['settleChannelWrapper'];

    lockSettleChannel();
    await settleChannelWrapper(swap, channelCreation, 10);

    expect(channelNursery['settleRetries'].get(swap.id)).toEqual(1);

    expect(settleChannel).toHaveBeenCalledTimes(1);
    expect(settleChannel).toHaveBeenCalledWith(swap, channelCreation);

    await wait(100);
    resolvePromise();
    await wait(10);
    lockSettleChannel();

    expect(channelNursery['settleRetries'].get(swap.id)).toEqual(2);
    expect(settleChannel).toHaveBeenCalledTimes(2);

    await wait(100);
    resolvePromise();
    await wait(10);
    lockSettleChannel();

    expect(channelNursery['settleRetries'].get(swap.id)).toEqual(4);
    expect(settleChannel).toHaveBeenCalledTimes(3);

    await wait(100);
    resolvePromise();
    await wait(10);
    lockSettleChannel();

    expect(channelNursery['settleRetries'].size).toEqual(0);
    expect(channelNursery['settleRetries'].get(swap.id)).toEqual(undefined);

    expect(settleChannel).toHaveBeenCalledTimes(4);

    // Should not retry if the first attempt is successful
    settleChannelResult = true;

    lockSettleChannel();
    await settleChannelWrapper(swap, channelCreation, 0);

    expect(channelNursery['settleRetries'].size).toEqual(0);
    expect(channelNursery['settleRetries'].get(swap.id)).toEqual(undefined);

    expect(settleChannel).toHaveBeenCalledTimes(5);
  });

  test('should settle created channels', async () => {
    const settleChannel = jest.fn().mockResolvedValue(true);
    channelNursery['settleChannel'] = settleChannel;

    mockGetChannelCreationsResult = [
      {
        swapId: '123',
      },
      {
        swapId: 'm1011',
      },
    ];

    await channelNursery['settleCreatedChannels']();

    expect(settleChannel).toHaveBeenCalledTimes(2);
    expect(settleChannel).toHaveBeenNthCalledWith(1, mockGetSwapResult, mockGetChannelCreationsResult[0]);
    expect(settleChannel).toHaveBeenNthCalledWith(2, mockGetSwapResult, mockGetChannelCreationsResult[1]);

    expect(mockGetChannelCreations).toHaveBeenCalledTimes(1);
    expect(mockGetChannelCreations).toHaveBeenCalledWith({
      status: {
        [Op.eq]: ChannelCreationStatus.Created,
      },
    });

    expect(mockGetSwap).toHaveBeenCalledTimes(2);
    expect(mockGetSwap).toHaveBeenNthCalledWith(1, {
      id: {
        [Op.eq]: mockGetChannelCreationsResult[0].swapId,
      },
      status: {
        [Op.not]: SwapUpdateEvent.TransactionClaimed,
      },
    });
    expect(mockGetSwap).toHaveBeenNthCalledWith(2, {
      id: {
        [Op.eq]: mockGetChannelCreationsResult[1].swapId,
      },
      status: {
        [Op.not]: SwapUpdateEvent.TransactionClaimed,
      },
    });
  });

  test('should check whether Swaps are eligible for a Channel Creation', () => {
    const eligibleForChannel = channelNursery['eligibleForChannel'];

    const swap = {} as any as Swap;

    expect(eligibleForChannel(swap)).toEqual(false);

    swap.lockupTransactionId = '';
    expect(eligibleForChannel(swap)).toEqual(false);

    swap.expectedAmount = 1;
    swap.onchainAmount = swap.expectedAmount;
    expect(eligibleForChannel(swap)).toEqual(true);

    swap.onchainAmount *= 2;
    expect(eligibleForChannel(swap)).toEqual(true);
  });

  test('should parse IDs of funding transactions', () => {
    expect(
      channelNursery['parseFundingTransactionId']('PnemZ7+wVd0SLtj9eyJ4IwR9fzEEewM24oSZP2dKmgU='),
    ).toEqual('059a4a673f9984e236037b04317f7d042378227bfdd82e12dd55b0bf67a6773e');
  });

  test('should split channel points', () => {
    expect(channelNursery['splitChannelPoint']('059a4a673f9984e236037b04317f7d042378227bfdd82e12dd55b0bf67a6773e:1')).toEqual({
      vout: 1,
      id: '059a4a673f9984e236037b04317f7d042378227bfdd82e12dd55b0bf67a6773e',
    });
  });

  test('should get currencies', () => {
    const getCurrency = channelNursery['getCurrency'];

    const swap = {
      pair: 'BTC/LTC',
      orderSide: OrderSide.BUY,
    } as any as Swap;

    expect(getCurrency(swap, true)).toEqual('BTC');
    expect(getCurrency(swap, false)).toEqual('LTC');
  });
});
