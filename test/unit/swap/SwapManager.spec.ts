import { Op } from 'sequelize';
import bolt11 from '@boltz/bolt11';
import { randomBytes } from 'crypto';
import { address, ECPair } from 'bitcoinjs-lib';
import { Networks, OutputType } from 'boltz-core';
import Logger from '../../../lib/Logger';
import Errors from '../../../lib/swap/Errors';
import Swap from '../../../lib/db/models/Swap';
import Wallet from '../../../lib/wallet/Wallet';
import ChainClient from '../../../lib/chain/ChainClient';
import LndClient from '../../../lib/lightning/LndClient';
import RateProvider from '../../../lib/rates/RateProvider';
import ReverseSwap from '../../../lib/db/models/ReverseSwap';
import InvoiceExpiryHelper from '../../../lib/service/InvoiceExpiryHelper';
import WalletManager, { Currency } from '../../../lib/wallet/WalletManager';
import SwapManager, { ChannelCreationInfo } from '../../../lib/swap/SwapManager';
import { ChannelCreationType, CurrencyType, OrderSide, SwapUpdateEvent } from '../../../lib/consts/Enums';
import { decodeInvoice, getHexBuffer, getHexString, getUnixTime, reverseBuffer } from '../../../lib/Utils';

const mockAddSwap = jest.fn().mockResolvedValue(undefined);

let mockGetSwapsResult: any[] = [];
const mockGetSwaps = jest.fn().mockImplementation(async () => {
  return mockGetSwapsResult;
});

const mockSetInvoice = jest.fn().mockImplementation(async (arg) => {
  return arg;
});

jest.mock('../../../lib/db/SwapRepository', () => {
  return jest.fn().mockImplementation(() => {
    return {
      addSwap: mockAddSwap,
      getSwaps: mockGetSwaps,
      setInvoice: mockSetInvoice,
    };
  });
});

const mockAddReverseSwap = jest.fn().mockResolvedValue(undefined);

let mockGetReverseSwapsResult: any[] = [];
const mockGetReverseSwaps = jest.fn().mockImplementation(async () => {
  return mockGetReverseSwapsResult;
});

jest.mock('../../../lib/db/ReverseSwapRepository', () => {
  return jest.fn().mockImplementation(() => {
    return {
      addReverseSwap: mockAddReverseSwap,
      getReverseSwaps: mockGetReverseSwaps,
    };
  });
});

const mockSetNodePublicKey = jest.fn().mockResolvedValue(undefined);

const mockAddChannelCreation = jest.fn().mockResolvedValue(undefined);

let mockGetChannelCreationResult: any = undefined;
const mockGetChannelCreation = jest.fn().mockImplementation(async () => {
  return mockGetChannelCreationResult;
});

const mockGetChannelCreationsResult = [];
const mockGetChannelCreations = jest.fn().mockImplementation(async () => {
  return mockGetChannelCreationsResult;
});

jest.mock('../../../lib/db/ChannelCreationRepository', () => {
  return jest.fn().mockImplementation(() => {
    return {
      setNodePublicKey: mockSetNodePublicKey,
      addChannelCreation: mockAddChannelCreation,
      getChannelCreation: mockGetChannelCreation,
      getChannelCreations: mockGetChannelCreations,
    };
  });
});

jest.mock('../../../lib/rates/RateProvider', () => {
  return jest.fn().mockImplementation(() => {
    return {};
  });
});

const MockedRateProvider = <jest.Mock<RateProvider>><any>RateProvider;

const mockGetNewKeysResult = {
  index: 21,
  keys: ECPair.fromPrivateKey(getHexBuffer('4c2a3023e0e6804b459dbd50bb028f0cf69dd128ef670e5c5284af7ce6db3d9e')),
};
const mockGetNewKeys = jest.fn().mockReturnValue(mockGetNewKeysResult);

const mockDecodeAddress = jest.fn().mockImplementation((toDecode: string) => {
  return address.toOutputScript(toDecode, Networks.bitcoinRegtest);
});

const mockEncodeAddress = jest.fn().mockImplementation((outputScript: Buffer) => {
  return address.fromOutputScript(outputScript, Networks.bitcoinRegtest);
});

jest.mock('../../../lib/wallet/Wallet', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getNewKeys: mockGetNewKeys,
      decodeAddress: mockDecodeAddress,
      encodeAddress: mockEncodeAddress,
    };
  });
});

const MockedWallet = <jest.Mock<Wallet>><any>Wallet;

const mockWallets = new Map<string, Wallet>([
  ['BTC', new MockedWallet()],
  ['LTC', new MockedWallet()],
]);

jest.mock('../../../lib/wallet/WalletManager', () => {
  return jest.fn().mockImplementation(() => {
    return {
      wallets: mockWallets,
    };
  });
});

const MockedWalletManager = <jest.Mock<WalletManager>><any>WalletManager;

const mockAddInputFilter = jest.fn().mockImplementation();
const mockAddOutputFilter = jest.fn().mockImplementation();

const mockGetBlockchainInfoResult = {
  blocks: 123,
};
const mockGetBlockchainInfo = jest.fn().mockResolvedValue(mockGetBlockchainInfoResult);

let mockGetRawTransactionResult = '';
const mockGetRawTransaction = jest.fn().mockImplementation(async () => {
  return mockGetRawTransactionResult;
});

jest.mock('../../../lib/chain/ChainClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      on: () => {},
      addInputFilter: mockAddInputFilter,
      addOutputFilter: mockAddOutputFilter,
      getBlockchainInfo: mockGetBlockchainInfo,
      getRawTransaction: mockGetRawTransaction,
    };
  });
});

const MockedChainClient = <jest.Mock<ChainClient>><any>ChainClient;

const mockDecodedInvoiceAmount = 1000000;
const mockDecodePayReq = jest.fn().mockImplementation(async (invoice: string) => {
  const featuresMap = {};

  if (invoice === 'multi') {
    featuresMap['17'] = {
      is_known: true,
    };
  }

  return {
    featuresMap,
    destination: invoice,
    numSatoshis: mockDecodedInvoiceAmount,
  };
});

const mockQueryRoutes = jest.fn().mockImplementation(async (destination: string) => {
  const routesList: any[] = [];

  switch (destination) {
    case 'throw':
      throw 'error';

    case 'single':
      routesList.push({});
      break;

    case 'multi':
      routesList.push({});
      routesList.push({});
      break;
  }

  return {
    routesList,
  };
});

const mockListChannelsResult = [];
const mockListChannels = jest.fn().mockImplementation(() => {
  return {
    channelsList: mockListChannelsResult,
  };
});

const mockAddHoldInvoiceResult = 'holdInvoice';
const mockAddHoldInvoice = jest.fn().mockResolvedValue({
  paymentRequest: mockAddHoldInvoiceResult,
});

const mockSubscribeSingleInvoice = jest.fn().mockResolvedValue(undefined);

jest.mock('../../../lib/lightning/LndClient', () => {
  const mockedImplementation = jest.fn().mockImplementation(() => {
    return {
      on: () => {},
      queryRoutes: mockQueryRoutes,
      decodePayReq: mockDecodePayReq,
      listChannels: mockListChannels,
      addHoldInvoice: mockAddHoldInvoice,
      subscribeSingleInvoice: mockSubscribeSingleInvoice,
    };
  });

  // Hack to set the static property
  (mockedImplementation as any).paymentMaxParts = 3;

  return mockedImplementation;
});

const MockedLndClient = <jest.Mock<LndClient>><any>LndClient;

const mockGetExpiryResult = 123321;
const mockGetExpiry = jest.fn().mockImplementation(() => {
  return mockGetExpiryResult;
});

jest.mock('../../../lib/service/InvoiceExpiryHelper', () => {
  const mockedImplementation = jest.fn().mockImplementation(() => ({
    getExpiry: mockGetExpiry,
  }));

  (mockedImplementation as any).getInvoiceExpiry = (timestamp?: number, timeExpireDate?: number) => {
    let invoiceExpiry = timestamp || 0;

    if (timeExpireDate) {
      invoiceExpiry = timeExpireDate;
    } else {
      invoiceExpiry += 3600;
    }

    return invoiceExpiry;
  };

  return mockedImplementation;
});

const MockedInvoiceExpiryHelper = <jest.Mock<InvoiceExpiryHelper>><any>InvoiceExpiryHelper;

jest.mock('../../../lib/swap/SwapNursery', () => {
  return jest.fn().mockImplementation(() => ({
    init: jest.fn().mockImplementation(async () => {}),
  }));
});

describe('SwapManager', () => {
  let manager: SwapManager;

  const btcCurrency = {
    symbol: 'BTC',
    type: CurrencyType.BitcoinLike,
    network: Networks.bitcoinRegtest,
    chainClient: new MockedChainClient(),
    lndClient: new MockedLndClient(),
  } as any as Currency;

  const ltcCurrency = {
    symbol: 'LTC',
    type: CurrencyType.BitcoinLike,
    network: Networks.litecoinRegtest,
    chainClient: new MockedChainClient(),
    lndClient: new MockedLndClient(),
  } as any as Currency;

  beforeEach(() => {
    jest.clearAllMocks();

    if (manager !== undefined && manager.routingHints !== undefined) {
      if (manager.routingHints.stop !== undefined && typeof manager.routingHints.stop === 'function') {
        manager.routingHints.stop();
      }
    }

    // Reset the injected mocked methods
    manager = new SwapManager(
      Logger.disabledLogger,
      new MockedWalletManager(),
      new MockedRateProvider(),
      new MockedInvoiceExpiryHelper(),
      OutputType.Compatibility,
      0,
    );

    manager['currencies'].set(btcCurrency.symbol, btcCurrency);
    manager['currencies'].set(ltcCurrency.symbol, ltcCurrency);
  });

  afterAll(() => {
    if (manager !== undefined && manager.routingHints !== undefined) {
      manager.routingHints.stop();
    }
  });

  test('it should init', async() => {
    const mockRecreateFilters = jest.fn().mockImplementation();
    manager['recreateFilters'] = mockRecreateFilters;

    mockGetSwapsResult = [
      {
        swap: 'data',
      },
      {
        more: {
          swap: 'data',
        },
      },
    ];

    mockGetReverseSwapsResult = [
      {
        pair: 'BTC/BTC',
      },
      {
        some: 'otherData',
      },
    ];

    await manager.init([
      btcCurrency,
      ltcCurrency,
    ]);

    expect(manager.currencies.size).toEqual(2);

    expect(manager.currencies.get('BTC')).toEqual(btcCurrency);
    expect(manager.currencies.get('LTC')).toEqual(ltcCurrency);

    expect(mockGetSwaps).toHaveBeenCalledTimes(1);
    expect(mockGetSwaps).toHaveBeenCalledWith({
      status: {
        [Op.not]: [
          SwapUpdateEvent.SwapExpired,
          SwapUpdateEvent.InvoicePending,
          SwapUpdateEvent.InvoiceFailedToPay,
          SwapUpdateEvent.TransactionClaimed,
        ],
      },
    });

    expect(mockGetReverseSwaps).toHaveBeenCalledTimes(1);
    expect(mockGetReverseSwaps).toHaveBeenCalledWith({
      status: {
        [Op.not]: [
          SwapUpdateEvent.SwapExpired,
          SwapUpdateEvent.InvoiceSettled,
          SwapUpdateEvent.TransactionFailed,
          SwapUpdateEvent.TransactionRefunded,
        ],
      },
    });

    expect(mockRecreateFilters).toHaveBeenCalledTimes(2);

    expect(mockRecreateFilters).toHaveBeenNthCalledWith(1, mockGetSwapsResult, false);
    expect(mockRecreateFilters).toHaveBeenNthCalledWith(2, mockGetReverseSwapsResult, true);
  });

  test('should create Swaps', async () => {
    const baseCurrency = 'BTC';
    const quoteCurrency = 'BTC';
    const orderSide = OrderSide.BUY;
    const preimageHash = getHexBuffer('4d57a64c3b4f19cd4a8c79e3038dba7024bbf77ee4f768f0c1b42fbb590c835c');
    const refundKey = getHexBuffer('03f1c589378d79bb4a38be80bd085f5454a07d7f5c515fa0752f1b443816442ac2');
    const timeoutBlockDelta = 140;

    const swap = await manager.createSwap({
      orderSide,
      preimageHash,
      baseCurrency,
      quoteCurrency,
      timeoutBlockDelta,
      refundPublicKey: refundKey,
    });

    expect(swap).toEqual({
      id: swap.id,
      address: '2Mu28zPUNMkM5w9q3UhVhpw8p2p5zwtv9Ce',
      timeoutBlockHeight: mockGetBlockchainInfoResult.blocks + timeoutBlockDelta,
      redeemScript: 'a9144631a4007d7e5b0f02f86f3a7f3b5c1442ac98f587632102c9c71ee3fee0c400ff64e51e955313e77ea499fc609973c71c5a4104a8d903bb67020701b1752103f1c589378d79bb4a38be80bd085f5454a07d7f5c515fa0752f1b443816442ac268ac',
    });

    expect(mockGetBlockchainInfo).toHaveBeenCalledTimes(1);
    expect(mockGetNewKeys).toHaveBeenCalledTimes(1);
    expect(mockEncodeAddress).toHaveBeenCalledTimes(1);

    expect(mockAddOutputFilter).toHaveBeenCalledTimes(1);
    expect(mockAddOutputFilter).toHaveBeenCalledWith(getHexBuffer('a9141376abf97f0345aecbda15f95453f4a7446b326287'));

    expect(mockAddSwap).toHaveBeenCalledTimes(1);
    expect(mockAddSwap).toHaveBeenCalledWith({
      orderSide,
      id: swap.id,
      status: SwapUpdateEvent.SwapCreated,
      keyIndex: mockGetNewKeysResult.index,
      pair: `${baseCurrency}/${quoteCurrency}`,
      preimageHash: getHexString(preimageHash),
      lockupAddress: '2Mu28zPUNMkM5w9q3UhVhpw8p2p5zwtv9Ce',
      timeoutBlockHeight: mockGetBlockchainInfoResult.blocks + timeoutBlockDelta,
      redeemScript: 'a9144631a4007d7e5b0f02f86f3a7f3b5c1442ac98f587632102c9c71ee3fee0c400ff64e51e955313e77ea499fc609973c71c5a4104a8d903bb67020701b1752103f1c589378d79bb4a38be80bd085f5454a07d7f5c515fa0752f1b443816442ac268ac',
    });

    // Channel Creation
    const channel = {
      auto: true,
      private: true,
      inboundLiquidity: 25,
    } as ChannelCreationInfo;

    const swapChannelCreation = await manager.createSwap({
      channel,
      orderSide,
      preimageHash,
      baseCurrency,
      quoteCurrency,
      timeoutBlockDelta,
      refundPublicKey: refundKey,
    });

    expect(swapChannelCreation).toEqual({
      id: swapChannelCreation.id,
      address: '2Mu28zPUNMkM5w9q3UhVhpw8p2p5zwtv9Ce',
      timeoutBlockHeight: mockGetBlockchainInfoResult.blocks + timeoutBlockDelta,
      redeemScript: 'a9144631a4007d7e5b0f02f86f3a7f3b5c1442ac98f587632102c9c71ee3fee0c400ff64e51e955313e77ea499fc609973c71c5a4104a8d903bb67020701b1752103f1c589378d79bb4a38be80bd085f5454a07d7f5c515fa0752f1b443816442ac268ac',
    });

    expect(mockGetBlockchainInfo).toHaveBeenCalledTimes(2);
    expect(mockGetNewKeys).toHaveBeenCalledTimes(2);
    expect(mockEncodeAddress).toHaveBeenCalledTimes(2);

    expect(mockAddOutputFilter).toHaveBeenCalledTimes(2);
    expect(mockAddOutputFilter).toHaveBeenNthCalledWith(2, getHexBuffer('a9141376abf97f0345aecbda15f95453f4a7446b326287'));

    expect(mockAddSwap).toHaveBeenCalledTimes(2);
    expect(mockAddSwap).toHaveBeenNthCalledWith(2, {
      orderSide,
      id: swapChannelCreation.id,
      status: SwapUpdateEvent.SwapCreated,
      keyIndex: mockGetNewKeysResult.index,
      pair: `${baseCurrency}/${quoteCurrency}`,
      preimageHash: getHexString(preimageHash),
      lockupAddress: '2Mu28zPUNMkM5w9q3UhVhpw8p2p5zwtv9Ce',
      timeoutBlockHeight: mockGetBlockchainInfoResult.blocks + timeoutBlockDelta,
      redeemScript: 'a9144631a4007d7e5b0f02f86f3a7f3b5c1442ac98f587632102c9c71ee3fee0c400ff64e51e955313e77ea499fc609973c71c5a4104a8d903bb67020701b1752103f1c589378d79bb4a38be80bd085f5454a07d7f5c515fa0752f1b443816442ac268ac',
    });

    expect(mockAddChannelCreation).toHaveBeenCalledTimes(1);
    expect(mockAddChannelCreation).toHaveBeenCalledWith({
      private: channel.private,
      type: ChannelCreationType.Auto,
      swapId: swapChannelCreation.id,
      inboundLiquidity: channel.inboundLiquidity,
    });

    // Manual Channel Creation
    channel.auto = false;
    channel.private = false;

    const swapChannelCreationManual = await manager.createSwap({
      channel,
      orderSide,
      preimageHash,
      baseCurrency,
      quoteCurrency,
      timeoutBlockDelta,
      refundPublicKey: refundKey,
    });

    expect(mockAddChannelCreation).toHaveBeenCalledTimes(2);
    expect(mockAddChannelCreation).toHaveBeenNthCalledWith(2, {
      private: channel.private,
      type: ChannelCreationType.Create,
      swapId: swapChannelCreationManual.id,
      inboundLiquidity: channel.inboundLiquidity,
    });

    // No LND client found
    const notFoundSymbol = 'DOGE';
    manager['currencies'].set(notFoundSymbol, {
      symbol: notFoundSymbol,
    } as any);

    await expect(manager.createSwap({
      orderSide,
      preimageHash,
      quoteCurrency,
      timeoutBlockDelta,
      refundPublicKey: refundKey,
      baseCurrency: notFoundSymbol,
    })).rejects.toEqual(Errors.NO_LND_CLIENT(notFoundSymbol));
  });

  test('should set invoices of Swaps', async () => {
    let mockCheckRoutabilityResult = true;
    const mockCheckRoutability = jest.fn().mockImplementation(async () => {
      return mockCheckRoutabilityResult;
    });

    manager['checkRoutability'] = mockCheckRoutability;

    const swap = {
      id: 'id',
      pair: 'BTC/BTC',
      orderSide: OrderSide.BUY,
      preimageHash: '1558d179d9e3de706997e3b6bb33f704a5b8086b27538fd04ef5e313467333b8',
    } as any as Swap;

    // The invoice has to be generated here because the timestamp is used when setting the invoice of a Swap
    const invoicePreimageHash = swap.preimageHash;
    const invoiceSignKeys = getHexBuffer('bd67aa04f8e310ad257f2d7f5a2f4cf314c6c6017515748fb05c33763b1c6744');
    const invoiceEncode = bolt11.encode({
      payeeNodeKey: getHexString(ECPair.fromPrivateKey(invoiceSignKeys).publicKey),
      satoshis: 200,
      tags: [
        {
          data: swap.preimageHash,
          tagName: 'payment_hash',
        },
      ],
    });

    const invoice = bolt11.sign(invoiceEncode, invoiceSignKeys).paymentRequest!;

    const expectedAmount = 100;
    const percentageFee = 50;
    const acceptZeroConf = false;
    const emitSwapInvoiceSet = jest.fn().mockImplementation();

    await manager.setSwapInvoice(
      swap,
      invoice,
      expectedAmount,
      percentageFee,
      acceptZeroConf,
      emitSwapInvoiceSet,
    );

    expect(mockGetChannelCreation).toHaveBeenCalledTimes(1);
    expect(mockGetChannelCreation).toHaveBeenCalledWith({
      swapId: {
        [Op.eq]: swap.id,
      },
    });

    expect(mockCheckRoutability).toHaveBeenCalledTimes(1);
    expect(mockCheckRoutability).toHaveBeenCalledWith(btcCurrency.lndClient, invoice);

    expect(mockSetInvoice).toHaveBeenCalledTimes(1);
    expect(mockSetInvoice).toHaveBeenCalledWith(swap, invoice, expectedAmount, percentageFee, acceptZeroConf);

    expect(emitSwapInvoiceSet).toHaveBeenCalledTimes(1);
    expect(emitSwapInvoiceSet).toHaveBeenCalledWith(swap.id);

    // Swap that has a transaction id and should be settled
    let mockAttemptSettleSwapThrow = false;
    const mockAttemptSettleSwap = jest.fn().mockImplementation(async () => {
      if (mockAttemptSettleSwapThrow) {
        throw 'some error';
      }
    });

    manager.nursery.attemptSettleSwap = mockAttemptSettleSwap;

    swap.lockupTransactionId = '1558d179d9e3de706997e3b6bb33f704a5b8086b27538fd04ef5e313467333b8';
    mockGetRawTransactionResult = '020000000001018542307f1f57326e533123327f6a7e5729241c9cf468bca7897c47c0019a21010100000000fdffffff0298560b0000000000160014c99fd000fb30137ae03fd2b28f52878e9b29194f2e020000000000001976a91462e907b15cbf27d5425399ebf6f0fb50ebb88f1888ac02473044022034deabdeb0d1d4d2fe2cf450f5ef27c1e5709670b87dbe3b8e175ac094fb935802207630148ec8e73c24e284af700ac1f34e8058735a8852e8fd4c81ad04233b12230121031f6fa906bb52f3e1bdc59156a5659ce1aa251eaf26f411413c76409360ef7205bcaf0900';

    await manager.setSwapInvoice(
      swap,
      invoice,
      expectedAmount,
      percentageFee,
      acceptZeroConf,
      emitSwapInvoiceSet,
    );

    expect(mockAttemptSettleSwap).toHaveBeenCalledTimes(1);
    expect(mockAttemptSettleSwap).toHaveBeenCalledWith(
      {
        ...btcCurrency,
        wallet: mockWallets.get('BTC'),
      },
      swap,
    );

    // Swap that has a transaction id which is confirmed and should be settled
    swap.status = SwapUpdateEvent.TransactionConfirmed;

    await manager.setSwapInvoice(
      swap,
      invoice,
      expectedAmount,
      percentageFee,
      acceptZeroConf,
      emitSwapInvoiceSet,
    );

    expect(mockAttemptSettleSwap).toHaveBeenCalledTimes(2);
    expect(mockAttemptSettleSwap).toHaveBeenNthCalledWith(2,
      {
        ...btcCurrency,
        wallet: mockWallets.get('BTC'),
      },
      swap,
    );

    // Swap that has a transaction id and settling throws
    mockAttemptSettleSwapThrow = true;

    await manager.setSwapInvoice(
      swap,
      invoice,
      expectedAmount,
      percentageFee,
      acceptZeroConf,
      emitSwapInvoiceSet,
    );

    expect(mockAttemptSettleSwap).toHaveBeenCalledTimes(3);

    swap.lockupTransactionId = undefined;

    // Swap with Channel Creation
    mockGetChannelCreationResult = {
      some: 'data',
    };

    await manager.setSwapInvoice(
      swap,
      invoice,
      expectedAmount,
      percentageFee,
      acceptZeroConf,
      emitSwapInvoiceSet,
    );

    expect(mockCheckRoutability).toHaveBeenCalledTimes(4);

    expect(mockGetChannelCreation).toHaveBeenCalledTimes(5);
    expect(mockSetInvoice).toHaveBeenCalledTimes(5);
    expect(emitSwapInvoiceSet).toHaveBeenCalledTimes(5);

    // Swap with Channel Creation and invoice that expires too soon
    swap.timeoutBlockHeight = 1000;

    let error: any;

    try {
      await manager.setSwapInvoice(
        swap,
        invoice,
        expectedAmount,
        percentageFee,
        acceptZeroConf,
        emitSwapInvoiceSet,
      );
    } catch (e) {
      error = e;
    }

    expect(error.code).toEqual('6.4');
    expect(error.message.startsWith(`invoice expiry ${bolt11.decode(invoice).timeExpireDate!} is before Swap timeout: `)).toBeTruthy();

    error = undefined;

    // Swap with Channel Creation and invoice that has no expiry encoded in it
    const invoiceNoExpiryEncode = bolt11.encode({
      satoshis: 200,
      timestamp: getUnixTime(),
      payeeNodeKey: getHexString(ECPair.fromPrivateKey(invoiceSignKeys).publicKey),
      tags: [
        {
          data: swap.preimageHash,
          tagName: 'payment_hash',
        },
        {
          data: '',
          tagName: 'description',
        },
      ],
    }, false);
    const invoiceNoExpiry = bolt11.sign(invoiceNoExpiryEncode, invoiceSignKeys).paymentRequest!;

    try {
      await manager.setSwapInvoice(
        swap,
        invoiceNoExpiry,
        expectedAmount,
        percentageFee,
        acceptZeroConf,
        emitSwapInvoiceSet,
      );
    } catch (e) {
      error = e;
    }

    expect(error!.code).toEqual('6.4');
    expect(error!.message.startsWith(`invoice expiry ${bolt11.decode(invoiceNoExpiry).timestamp! + 3600} is before Swap timeout: `)).toBeTruthy();

    // Invoice that expired already
    const invoiceExpired = 'lnbcrt3210n1p00galgpp5z4vdz7weu008q6vhuwmtkvlhqjjmszrtyafcl5zw7h33x3nnxwuqdqqcqzpgsp5q70xcl9mw3dcxmc78el7m2gl86rtv60tazlay6tz5ddpjuu0p4mq9qy9qsqcympv8hx4j877hm26uyrpfxur497x27kuqvlq7kdd8wjucjla849d8nc2m38ce04f26vycv6mjqxusva8ge36jnrrgnj4fzey70yy4cpaac77a';

    try {
      await manager.setSwapInvoice(
        swap,
        invoiceExpired,
        expectedAmount,
        percentageFee,
        acceptZeroConf,
        emitSwapInvoiceSet,
      );
    } catch (e) {
      error = e;
    }

    expect(error!.code).toEqual('6.13');
    expect(error!.message).toEqual('the provided invoice expired already');

    mockGetChannelCreationResult = undefined;

    // Invalid preimage hash
    swap.preimageHash = getHexString(randomBytes(32));

    await expect(manager.setSwapInvoice(
      swap,
      invoice,
      expectedAmount,
      percentageFee,
      acceptZeroConf,
      emitSwapInvoiceSet,
    )).rejects.toEqual(Errors.INVOICE_INVALID_PREIMAGE_HASH(swap.preimageHash));

    swap.preimageHash = invoicePreimageHash;

    // Routability check fails
    mockCheckRoutabilityResult = false;

    await expect(manager.setSwapInvoice(
      swap,
      invoice,
      expectedAmount,
      percentageFee,
      acceptZeroConf,
      emitSwapInvoiceSet,
    )).rejects.toEqual(Errors.NO_ROUTE_FOUND());

    mockCheckRoutabilityResult = true;
    mockAttemptSettleSwapThrow = false;
  });

  test('should create Reverse Swaps', async () => {
    const preimageHash = getHexBuffer('6b0d0275c597a18cfcc23261a62e095e2ba12ac5c866823d2926912806a5b10a');
    const claimKey = getHexBuffer('026c94d2958888e70fd32349b3c195803976e0865a54ab1755f19c2c820fcbafa8');

    const baseCurrency = 'BTC';
    const quoteCurrency = 'BTC';
    const orderSide = OrderSide.BUY;
    const holdInvoiceAmount = 10;
    const onchainAmount = 8;
    const onchainTimeoutBlockDelta = 140;
    const lightningTimeoutBlockDelta = 143;
    const percentageFee = 1;

    const reverseSwap = await manager.createReverseSwap({
      orderSide,
      preimageHash,
      baseCurrency,
      quoteCurrency,
      onchainAmount,
      percentageFee,
      holdInvoiceAmount,
      onchainTimeoutBlockDelta,
      lightningTimeoutBlockDelta,
      claimPublicKey: claimKey,
    });

    expect(reverseSwap).toEqual({
      id: expect.anything(),
      minerFeeInvoice: undefined,
      invoice: mockAddHoldInvoiceResult,
      lockupAddress: 'bcrt1q2f4axqr8859mmemce2fcvdvuqlu8vqtjfg3z4j2w4fu52t58g42sjtfv2y',
      timeoutBlockHeight: onchainTimeoutBlockDelta + mockGetBlockchainInfoResult.blocks,
      redeemScript: '8201208763a9142f958e32209e7d5f60d321d4f4f6e12bdbf06db28821026c94d2958888e70fd32349b3c195803976e0865a54ab1755f19c2c820fcbafa86775020701b1752102c9c71ee3fee0c400ff64e51e955313e77ea499fc609973c71c5a4104a8d903bb68ac',
    });

    expect(mockGetExpiry).toHaveBeenCalledTimes(1);
    expect(mockGetExpiry).toHaveBeenCalledWith(quoteCurrency);

    expect(mockAddHoldInvoice).toHaveBeenCalledTimes(1);
    expect(mockAddHoldInvoice).toHaveBeenCalledWith(
      holdInvoiceAmount,
      preimageHash,
      lightningTimeoutBlockDelta,
      mockGetExpiryResult,
      'Send to BTC address',
      undefined,
    );

    expect(mockSubscribeSingleInvoice).toHaveBeenCalledTimes(1);
    expect(mockSubscribeSingleInvoice).toHaveBeenCalledWith(preimageHash);

    expect(mockGetNewKeys).toHaveBeenCalledTimes(1);
    expect(mockGetBlockchainInfo).toHaveBeenCalledTimes(1);
    expect(mockEncodeAddress).toHaveBeenCalledTimes(1);

    expect(mockAddReverseSwap).toHaveBeenCalledTimes(1);
    expect(mockAddReverseSwap).toHaveBeenCalledWith({
      orderSide,
      onchainAmount,
      fee: percentageFee,
      id: reverseSwap.id,
      minerFeeInvoice: undefined,
      invoice: mockAddHoldInvoiceResult,
      status: SwapUpdateEvent.SwapCreated,
      keyIndex: mockGetNewKeysResult.index,
      pair: `${baseCurrency}/${quoteCurrency}`,
      preimageHash: getHexString(preimageHash),
      lockupAddress: 'bcrt1q2f4axqr8859mmemce2fcvdvuqlu8vqtjfg3z4j2w4fu52t58g42sjtfv2y',
      timeoutBlockHeight: onchainTimeoutBlockDelta + mockGetBlockchainInfoResult.blocks,
      redeemScript: '8201208763a9142f958e32209e7d5f60d321d4f4f6e12bdbf06db28821026c94d2958888e70fd32349b3c195803976e0865a54ab1755f19c2c820fcbafa86775020701b1752102c9c71ee3fee0c400ff64e51e955313e77ea499fc609973c71c5a4104a8d903bb68ac',
    });

    // Prepay miner fee
    const prepayMinerFeeInvoiceAmount = 310;
    const prepayMinerFeeOnchainAmount = 10;

    const prepayReverseSwap = await manager.createReverseSwap({
      orderSide,
      preimageHash,
      baseCurrency,
      onchainAmount,
      quoteCurrency,
      percentageFee,
      holdInvoiceAmount,
      onchainTimeoutBlockDelta,
      lightningTimeoutBlockDelta,
      prepayMinerFeeInvoiceAmount,
      prepayMinerFeeOnchainAmount,

      claimPublicKey: claimKey,
    });

    expect(prepayReverseSwap).toEqual({
      id: expect.anything(),
      invoice: mockAddHoldInvoiceResult,
      minerFeeInvoice: mockAddHoldInvoiceResult,
      lockupAddress: 'bcrt1q2f4axqr8859mmemce2fcvdvuqlu8vqtjfg3z4j2w4fu52t58g42sjtfv2y',
      timeoutBlockHeight: onchainTimeoutBlockDelta + mockGetBlockchainInfoResult.blocks,
      redeemScript: '8201208763a9142f958e32209e7d5f60d321d4f4f6e12bdbf06db28821026c94d2958888e70fd32349b3c195803976e0865a54ab1755f19c2c820fcbafa86775020701b1752102c9c71ee3fee0c400ff64e51e955313e77ea499fc609973c71c5a4104a8d903bb68ac',
    });

    expect(mockSubscribeSingleInvoice).toHaveBeenCalledTimes(3);

    expect(mockAddHoldInvoice).toHaveBeenCalledTimes(3);
    expect(mockAddHoldInvoice).toHaveBeenNthCalledWith(2,
      holdInvoiceAmount,
      preimageHash,
      lightningTimeoutBlockDelta,
      mockGetExpiryResult,
      'Send to BTC address',
      undefined,
    );
    expect(mockAddHoldInvoice).toHaveBeenNthCalledWith(3,
      prepayMinerFeeInvoiceAmount,
      expect.anything(),
      undefined,
      mockGetExpiryResult,
      'Miner fee for sending to BTC address',
      undefined,
    );

    expect(mockSubscribeSingleInvoice).toHaveBeenCalledTimes(3);
    expect(mockSubscribeSingleInvoice).toHaveBeenNthCalledWith(2, preimageHash);

    expect(mockGetNewKeys).toHaveBeenCalledTimes(2);
    expect(mockGetBlockchainInfo).toHaveBeenCalledTimes(2);
    expect(mockEncodeAddress).toHaveBeenCalledTimes(2);

    expect(mockAddReverseSwap).toHaveBeenCalledTimes(2);
    expect(mockAddReverseSwap).toHaveBeenNthCalledWith(2, {
      orderSide,
      onchainAmount,
      fee: percentageFee,

      id: prepayReverseSwap.id,
      invoice: mockAddHoldInvoiceResult,
      status: SwapUpdateEvent.SwapCreated,
      keyIndex: mockGetNewKeysResult.index,
      pair: `${baseCurrency}/${quoteCurrency}`,
      preimageHash: getHexString(preimageHash),
      minerFeeInvoice: mockAddHoldInvoiceResult,
      minerFeeInvoicePreimage: expect.anything(),
      minerFeeOnchainAmount: prepayMinerFeeOnchainAmount,
      lockupAddress: 'bcrt1q2f4axqr8859mmemce2fcvdvuqlu8vqtjfg3z4j2w4fu52t58g42sjtfv2y',
      timeoutBlockHeight: onchainTimeoutBlockDelta + mockGetBlockchainInfoResult.blocks,
      redeemScript: '8201208763a9142f958e32209e7d5f60d321d4f4f6e12bdbf06db28821026c94d2958888e70fd32349b3c195803976e0865a54ab1755f19c2c820fcbafa86775020701b1752102c9c71ee3fee0c400ff64e51e955313e77ea499fc609973c71c5a4104a8d903bb68ac',
    });

    // Private routing hints
    const nodePublicKey = 'some node';

    const mockGetRoutingHintsResult = ['private', 'channel', 'data'];
    const mockGetRoutingHints = jest.fn().mockImplementation(() => mockGetRoutingHintsResult);
    manager['routingHints'] = {
      getRoutingHints: mockGetRoutingHints,
    } as any;

    await manager.createReverseSwap({
      orderSide,
      preimageHash,
      baseCurrency,
      quoteCurrency,
      onchainAmount,
      percentageFee,
      holdInvoiceAmount,
      onchainTimeoutBlockDelta,
      lightningTimeoutBlockDelta,

      claimPublicKey: claimKey,
      routingNode: nodePublicKey,
      prepayMinerFeeInvoiceAmount,
    });

    expect(mockGetRoutingHints).toHaveBeenCalledTimes(1);
    expect(mockGetRoutingHints).toHaveBeenCalledWith(baseCurrency, nodePublicKey);

    expect(mockSubscribeSingleInvoice).toHaveBeenCalledTimes(5);

    expect(mockAddHoldInvoice).toHaveBeenCalledTimes(5);
    expect(mockAddHoldInvoice).toHaveBeenNthCalledWith(4,
      holdInvoiceAmount,
      preimageHash,
      lightningTimeoutBlockDelta,
      mockGetExpiryResult,
      'Send to BTC address',
      mockGetRoutingHintsResult,
    );
    expect(mockAddHoldInvoice).toHaveBeenNthCalledWith(5,
      prepayMinerFeeInvoiceAmount,
      expect.anything(),
      undefined,
      mockGetExpiryResult,
      'Miner fee for sending to BTC address',
      mockGetRoutingHintsResult,
    );

    // No LND client found
    const notFoundSymbol = 'DOGE';
    manager['currencies'].set(notFoundSymbol, {
      symbol: notFoundSymbol,
    } as any);

    await expect(manager.createReverseSwap({
      orderSide,
      baseCurrency,
      preimageHash,
      percentageFee,
      onchainAmount,
      holdInvoiceAmount,
      onchainTimeoutBlockDelta,
      lightningTimeoutBlockDelta,
      claimPublicKey: claimKey,
      quoteCurrency: notFoundSymbol,
    })).rejects.toEqual(Errors.NO_LND_CLIENT(notFoundSymbol));
  });

  test('should recreate filters', () => {
    const recreateFilters = manager['recreateFilters'];

    const reverseSwaps = [
      {
        pair: 'BTC/BTC',
        orderSide: OrderSide.BUY,
        status: SwapUpdateEvent.SwapCreated,
        minerFeeInvoice: 'lnbcrt10n1p0wwwfppp5chef6eznn05q2xh4399ufttf4lacxuxhl6f4nwmych0sy46qesysdqqcqzpgsp554r6j0g22kjgm5gt7cs4uu034eqmtudqskampn9qt6rvun6ya2zq9qy9qsqkzk64ql9vynz58hugcvausfe30fsd5kpefxjejyf6vg5ka52f4tnpa5c8ladgxhzxw2hwzwu3xzx55ugu945cmuh2le6nc2ye0zq22spz9zhvc',
        invoice: 'lnbcrt20n1p0wwwfzpp50xkp4kv7n6lepmqnvzflzasq0y5ukvtlq9h5lqen6nvrcdgk6pasdqqcqzpgsp5dskzqsa28gg6kmcqpx4vufj26vkjrglhg8dvlrcmthgpq45sevaq9qy9qsqw0rx65c42wggx4sstrulg4vrr82hcdcps5gx6j0dqavgcl2ydaa4pg0zs8anuqxvurqs2peselhtnd9ky2dpr7l4xujurw0cfslxpzcpxfnwxl',
      },
    ] as any as ReverseSwap[];

    // Invoice subscriptions
    recreateFilters(reverseSwaps, true);

    expect(mockSubscribeSingleInvoice).toHaveBeenCalledTimes(2);

    expect(mockSubscribeSingleInvoice).toHaveBeenNthCalledWith(1, getHexBuffer(decodeInvoice(reverseSwaps[0].minerFeeInvoice!).paymentHash!));
    expect(mockSubscribeSingleInvoice).toHaveBeenNthCalledWith(2, getHexBuffer(decodeInvoice(reverseSwaps[0].invoice).paymentHash!));

    reverseSwaps[0].status = SwapUpdateEvent.MinerFeePaid;
    recreateFilters(reverseSwaps, true);

    expect(mockSubscribeSingleInvoice).toHaveBeenCalledTimes(3);

    expect(mockSubscribeSingleInvoice).toHaveBeenNthCalledWith(3, getHexBuffer(decodeInvoice(reverseSwaps[0].invoice).paymentHash!));

    // Reverse swap input and output filters
    reverseSwaps[0].status = SwapUpdateEvent.TransactionMempool;
    reverseSwaps[0].lockupAddress = '2N5sb4t4HPDsmhmQ6jggnCsr8q4TeXDghcL';
    reverseSwaps[0].transactionId = '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b';

    recreateFilters(reverseSwaps, true);

    expect(mockAddInputFilter).toHaveBeenCalledTimes(1);
    expect(mockAddInputFilter).toHaveBeenCalledWith(reverseBuffer(getHexBuffer(reverseSwaps[0].transactionId)));

    expect(mockDecodeAddress).toHaveBeenCalledTimes(1);
    expect(mockDecodeAddress).toHaveBeenCalledWith(reverseSwaps[0].lockupAddress);

    expect(mockAddOutputFilter).toHaveBeenCalledTimes(1);
    expect(mockAddOutputFilter).toHaveBeenCalledWith(address.toOutputScript(reverseSwaps[0].lockupAddress, Networks.bitcoinRegtest));

    reverseSwaps[0].status = SwapUpdateEvent.TransactionConfirmed;

    recreateFilters(reverseSwaps, true);

    expect(mockAddInputFilter).toHaveBeenCalledTimes(2);
    expect(mockAddInputFilter).toHaveBeenCalledWith(reverseBuffer(getHexBuffer(reverseSwaps[0].transactionId)));

    expect(mockDecodeAddress).toHaveBeenCalledTimes(1);
    expect(mockAddOutputFilter).toHaveBeenCalledTimes(1);

    // Output filter for all other cases
    const swaps = [
      {
        pair: 'BTC/BTC',
        orderSide: OrderSide.BUY,
        status: SwapUpdateEvent.SwapCreated,
        lockupAddress: '2N9hN6epf3wNkK4QbsWMz4kKYitHquhPtP7',
      },
    ] as any as Swap[];

    recreateFilters(swaps, false);

    expect(mockDecodeAddress).toHaveBeenCalledTimes(2);
    expect(mockDecodeAddress).toHaveBeenNthCalledWith(2, swaps[0].lockupAddress);

    expect(mockAddOutputFilter).toHaveBeenCalledTimes(2);
    expect(mockAddOutputFilter).toHaveBeenNthCalledWith(2, address.toOutputScript(swaps[0].lockupAddress, Networks.bitcoinRegtest));
  });

  test('should check routability', async () => {
    const lndClient = new MockedLndClient();

    const checkRoutability = manager['checkRoutability'];

    expect(await checkRoutability(lndClient, 'single')).toEqual(true);
    expect(mockQueryRoutes).toHaveBeenCalledWith('single', mockDecodedInvoiceAmount);

    expect(await checkRoutability(lndClient, 'multi')).toEqual(true);
    expect(mockQueryRoutes).toHaveBeenCalledWith('multi', Math.round(mockDecodedInvoiceAmount / 3));

    expect(await checkRoutability(lndClient, 'throw')).toEqual(false);
  });

  test('it should get currencies', () => {
    const getCurrencies = manager['getCurrencies'];

    expect(getCurrencies('LTC', 'BTC', OrderSide.BUY)).toEqual({
      sendingCurrency: {
        ...ltcCurrency,
        wallet: mockWallets.get('LTC'),
      },
      receivingCurrency: {
        ...btcCurrency,
        wallet: mockWallets.get('BTC'),
      },
    });

    expect(getCurrencies('LTC', 'BTC', OrderSide.SELL)).toEqual({
      sendingCurrency: {
        ...btcCurrency,
        wallet: mockWallets.get('BTC'),
      },
      receivingCurrency: {
        ...ltcCurrency,
        wallet: mockWallets.get('LTC'),
      },
    });
  });

  test('it should get a currency', () => {
    const getCurrency = manager['getCurrency'];

    expect(getCurrency('BTC')).toEqual(btcCurrency);

    const notFound = 'notFound';
    expect(() => {
      getCurrency(notFound);
    }).toThrow(Errors.CURRENCY_NOT_FOUND(notFound).message);
  });
});
