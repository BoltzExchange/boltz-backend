import AsyncLock from 'async-lock';
import { address } from 'bitcoinjs-lib';
import bolt11 from 'bolt11';
import { Networks, OutputType } from 'boltz-core';
import { Networks as LiquidNetworks } from 'boltz-core/dist/lib/liquid';
import { randomBytes } from 'crypto';
import { address as addressLiquid } from 'liquidjs-lib';
import { Op, type Sequelize } from 'sequelize';
import { setup } from '../../../lib/Core';
import { ECPair } from '../../../lib/ECPairHelper';
import Logger from '../../../lib/Logger';
import {
  getHexBuffer,
  getHexString,
  getPairId,
  getUnixTime,
} from '../../../lib/Utils';
import ChainClient from '../../../lib/chain/ChainClient';
import {
  CurrencyType,
  FinalChainSwapEvents,
  OrderSide,
  SwapType,
  SwapUpdateEvent,
  SwapVersion,
} from '../../../lib/consts/Enums';
import Database from '../../../lib/db/Database';
import { NodeType } from '../../../lib/db/models/ReverseSwap';
import type Swap from '../../../lib/db/models/Swap';
import ChainSwapRepository from '../../../lib/db/repositories/ChainSwapRepository';
import ReverseSwapRepository from '../../../lib/db/repositories/ReverseSwapRepository';
import ScriptPubKeyRepository from '../../../lib/db/repositories/ScriptPubKeyRepository';
import SwapRepository from '../../../lib/db/repositories/SwapRepository';
import LndClient from '../../../lib/lightning/LndClient';
import RateProvider from '../../../lib/rates/RateProvider';
import ServiceErrors from '../../../lib/service/Errors';
import InvoiceExpiryHelper from '../../../lib/service/InvoiceExpiryHelper';
import type PaymentRequestUtils from '../../../lib/service/PaymentRequestUtils';
import TimeoutDeltaProvider from '../../../lib/service/TimeoutDeltaProvider';
import { InvoiceType } from '../../../lib/sidecar/DecodedInvoice';
import type Sidecar from '../../../lib/sidecar/Sidecar';
import Errors from '../../../lib/swap/Errors';
import NodeSwitch from '../../../lib/swap/NodeSwitch';
import SwapManager from '../../../lib/swap/SwapManager';
import SwapOutputType from '../../../lib/swap/SwapOutputType';
import Wallet from '../../../lib/wallet/Wallet';
import type { Currency } from '../../../lib/wallet/WalletManager';
import WalletManager from '../../../lib/wallet/WalletManager';
import { networks } from '../../../lib/wallet/ethereum/EvmNetworks';
import { raceCall } from '../../Utils';

Database.sequelize = {
  transaction: jest
    .fn()
    .mockImplementation(async (_options: any, callback: () => Promise<any>) => {
      return await callback();
    }),
} as unknown as Sequelize;

const mockAddSwap = jest.fn().mockResolvedValue(undefined);

const mockSetInvoice = jest.fn().mockImplementation(async (arg) => {
  return arg;
});

jest.mock('../../../lib/db/repositories/SwapRepository');

const mockAddReverseSwap = jest.fn().mockResolvedValue(undefined);

let mockGetReverseSwapsResult: any[] = [];
const mockGetReverseSwaps = jest.fn().mockImplementation(async () => {
  return mockGetReverseSwapsResult;
});

jest.mock('../../../lib/db/repositories/ReverseSwapRepository');

let mockGetChainSwapsResult: any[] = [];
const mockGetChainSwaps = jest.fn().mockImplementation(async () => {
  return mockGetChainSwapsResult;
});

jest.mock('../../../lib/rates/RateProvider', () => {
  return jest.fn().mockImplementation(() => {
    return {
      acceptZeroConf: jest.fn().mockReturnValue(true),
      feeProvider: {
        minerFees: new Map<string, any>([
          [
            'BTC',
            {
              [SwapVersion.Legacy]: {
                reverse: {
                  claim: 2,
                },
              },
              [SwapVersion.Taproot]: {
                reverse: {
                  claim: 1,
                },
              },
            },
          ],
        ]),
      },
    };
  });
});

const MockedRateProvider = <jest.Mock<RateProvider>>(<any>RateProvider);

const keys = ECPair.fromPrivateKey(
  getHexBuffer(
    '4c2a3023e0e6804b459dbd50bb028f0cf69dd128ef670e5c5284af7ce6db3d9e',
  ),
);
const mockGetNewKeysResult = {
  index: 21,
  keys: {
    ...keys,
    publicKey: Buffer.from(keys.publicKey),
    privateKey: Buffer.from(keys.privateKey!),
  },
};
const mockGetNewKeys = jest.fn().mockReturnValue(mockGetNewKeysResult);

const mockDecodeAddress = jest.fn().mockImplementation((toDecode: string) => {
  return address.toOutputScript(toDecode, Networks.bitcoinRegtest);
});

const mockEncodeAddress = jest
  .fn()
  .mockImplementation((outputScript: Buffer) => {
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

const MockedWallet = <jest.Mock<Wallet>>(<any>Wallet);

const mockWallets = new Map<string, Wallet>([
  ['BTC', new MockedWallet()],
  ['LTC', new MockedWallet()],
  [
    'L-BTC',
    {
      ...new MockedWallet(),
      network: LiquidNetworks.liquidRegtest,
      decodeAddress: jest
        .fn()
        .mockImplementation((address: string) =>
          addressLiquid.toOutputScript(address, LiquidNetworks.liquidRegtest),
        ),
      deriveBlindingKeyFromScript: jest.fn().mockReturnValue({
        privateKey: getHexBuffer(
          '4e09bc9895ccef1eab4e2e67adcff67be2af26110ffb35f26592688c0e88dc76',
        ),
      }),
    } as any,
  ],
]);

jest.mock('../../../lib/wallet/WalletManager', () => {
  return jest.fn().mockImplementation(() => {
    return {
      wallets: mockWallets,
      ethereumManagers: [
        {
          networkDetails: networks.Ethereum,
          hasSymbol: jest.fn().mockReturnValue(true),
        },
      ],
    };
  });
});

const MockedWalletManager = <jest.Mock<WalletManager>>(<any>WalletManager);

const mockAddInputFilter = jest.fn().mockImplementation();
const mockAddOutputFilter = jest.fn().mockImplementation();

const mockGetBlockchainInfoResult = {
  blocks: 123,
};
const mockGetBlockchainInfo = jest
  .fn()
  .mockResolvedValue(mockGetBlockchainInfoResult);

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

const MockedChainClient = <jest.Mock<ChainClient>>(<any>ChainClient);

const mockDecodedInvoiceAmount = 1000000;
const mockDecodePayReqRawResponse = jest
  .fn()
  .mockImplementation(async (invoice: string) => {
    const featuresMap: [number, any][] = [];

    if (invoice === 'multi') {
      featuresMap.push([
        17,
        {
          name: 'multi-path-payments',
          isKnown: true,
        },
      ]);
    }

    return {
      getDestination: () => invoice,
      getNumSatoshis: () => mockDecodedInvoiceAmount,
      getRouteHintsList: () => undefined,
      toObject: () => ({
        featuresMap,
      }),
    };
  });

const mockQueryRoutes = jest
  .fn()
  .mockImplementation(async (destination: string) => {
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
  return mockListChannelsResult;
});

const mockAddHoldInvoiceResult = 'holdInvoice';
const mockAddHoldInvoice = jest.fn().mockImplementation(async () => {
  return mockAddHoldInvoiceResult;
});

const mockSubscribeSingleInvoice = jest.fn().mockResolvedValue(undefined);

const mockServiceName = jest.fn().mockReturnValue('LND');
const mockGetInfo = jest.fn().mockResolvedValue({ pubkey: 'me' });

jest.mock('../../../lib/lightning/LndClient', () => {
  const mockedImplementation = jest.fn().mockImplementation(() => {
    return {
      raceCall,
      on: () => {},
      isConnected: () => true,
      getInfo: mockGetInfo,
      queryRoutes: mockQueryRoutes,
      serviceName: mockServiceName,
      listChannels: mockListChannels,
      addHoldInvoice: mockAddHoldInvoice,
      subscribeSingleInvoice: mockSubscribeSingleInvoice,
      decodePayReqRawResponse: mockDecodePayReqRawResponse,
    };
  });

  // Hack to set the static property
  (mockedImplementation as any).paymentMaxParts = 3;

  return mockedImplementation;
});

const MockedLndClient = <jest.Mock<LndClient>>(<any>LndClient);

jest.mock('../../../lib/service/TimeoutDeltaProvider', () => {
  const mockedImplementation = jest.fn().mockImplementation(() => {
    return {};
  });

  (mockedImplementation as any).blockTimes = {
    get: jest.fn().mockReturnValue(10),
  };

  return mockedImplementation;
});

const MockedTimeoutDeltaProvider = <jest.Mock<TimeoutDeltaProvider>>(
  (<any>TimeoutDeltaProvider)
);

const mockGetExpiryResult = 123321;
const mockGetExpiry = jest.fn().mockImplementation(() => {
  return mockGetExpiryResult;
});

jest.mock('../../../lib/service/InvoiceExpiryHelper', () => {
  const mockedImplementation = jest.fn().mockImplementation(() => ({
    getExpiry: mockGetExpiry,
  }));

  (mockedImplementation as any).getInvoiceExpiry = (
    timestamp?: number,
    timeExpireDate?: number,
  ) => {
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

(InvoiceExpiryHelper as any).minInvoiceExpiry = 60;

jest.mock('../../../lib/swap/SwapNursery', () => {
  return jest.fn().mockImplementation(() => ({
    lock: new AsyncLock(),
    init: jest.fn().mockImplementation(async () => {}),
  }));
});

ScriptPubKeyRepository.add = jest.fn().mockResolvedValue(undefined);

describe('SwapManager', () => {
  let manager: SwapManager;

  const sidecar = {
    decodeInvoiceOrOffer: jest
      .fn()
      .mockImplementation(async (invoice: string) => {
        const dec = bolt11.decode(invoice);
        const expiry = dec.timeExpireDate || dec.timestamp! + 3_600;

        return {
          expiryTimestamp: expiry,
          type: InvoiceType.Bolt11,
          amountMsat: dec.satoshis! * 1000,
          payee: getHexBuffer(dec.payeeNodeKey!),
          isExpired: expiry < getUnixTime(),
          paymentHash: getHexBuffer(
            dec.tags.find((tag) => tag.tagName === 'payment_hash')!
              .data as string,
          ),
        };
      }),
  } as unknown as Sidecar;

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

  const lbtcCurrency = {
    symbol: 'L-BTC',
    type: CurrencyType.Liquid,
    network: LiquidNetworks.liquidRegtest,
    chainClient: new MockedChainClient(),
  } as any as Currency;

  const rbtcCurrency = {
    symbol: 'RBTC',
    type: CurrencyType.Ether,
  } as any as Currency;

  beforeAll(async () => {
    await setup();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    SwapRepository.addSwap = mockAddSwap;
    SwapRepository.setInvoice = mockSetInvoice;
    SwapRepository.getSwapsClaimable = jest.fn().mockResolvedValue([]);
    SwapRepository.getSwaps = jest.fn().mockResolvedValue([]);

    ReverseSwapRepository.addReverseSwap = mockAddReverseSwap;
    ReverseSwapRepository.getReverseSwaps = mockGetReverseSwaps;

    ChainSwapRepository.getChainSwaps = mockGetChainSwaps;

    if (manager !== undefined && manager.routingHints !== undefined) {
      if (
        manager.routingHints.stop !== undefined &&
        typeof manager.routingHints.stop === 'function'
      ) {
        manager.routingHints.stop();
      }
    }

    // Reset the injected mocked methods
    manager = new SwapManager(
      Logger.disabledLogger,
      undefined,
      new MockedWalletManager(),
      new NodeSwitch(Logger.disabledLogger),
      new MockedRateProvider(),
      new MockedTimeoutDeltaProvider(),
      {} as PaymentRequestUtils,
      new SwapOutputType(OutputType.Compatibility),
      0,
      {
        deferredClaimSymbols: [],
      } as any,
      {} as any,
      sidecar,
      {} as any,
    );

    manager['currencies'].set(btcCurrency.symbol, btcCurrency);
    manager['currencies'].set(ltcCurrency.symbol, ltcCurrency);
    manager['currencies'].set(rbtcCurrency.symbol, rbtcCurrency);
    manager['currencies'].set(lbtcCurrency.symbol, lbtcCurrency);

    manager['nodeFallback'] = {
      getReverseSwapInvoice: jest.fn().mockResolvedValue({
        lightningClient: btcCurrency.lndClient,
      }),
    } as any;
    manager['invoiceExpiryHelper'] = {
      getExpiry: jest.fn().mockReturnValue(3600),
    } as any;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    manager['reverseRoutingHints'] = {
      getHints: jest.fn().mockReturnValue({
        invoiceMemo: 'mock',
        receivedAmount: 420,
      }),
    } as any;
  });

  afterAll(() => {
    if (manager !== undefined && manager.routingHints !== undefined) {
      manager.routingHints.stop();
    }
  });

  test.each`
    side              | rate     | onchainAmount | baseFee | percentageFee | expected
    ${OrderSide.BUY}  | ${1}     | ${1000000}    | ${210}  | ${0.02}       | ${980186}
    ${OrderSide.SELL} | ${1}     | ${1000000}    | ${210}  | ${0.02}       | ${980186}
    ${OrderSide.BUY}  | ${0.005} | ${1000000}    | ${120}  | ${0.05}       | ${190453333}
    ${OrderSide.SELL} | ${0.005} | ${1000000}    | ${120}  | ${0.05}       | ${4761}
  `(
    'should calculate invoice amounts',
    ({ side, rate, onchainAmount, baseFee, percentageFee, expected }) => {
      expect(
        SwapManager.calculateInvoiceAmount(
          side,
          rate,
          onchainAmount,
          baseFee,
          percentageFee,
        ),
      ).toEqual(expected);
    },
  );

  test('should init', async () => {
    const mockRecreateSubscriptions = jest.fn().mockImplementation();
    manager['recreateSubscriptions'] = mockRecreateSubscriptions;

    const mockRecreateChainSwapSubscriptions = jest.fn().mockImplementation();
    manager['recreateChainSwapSubscriptions'] =
      mockRecreateChainSwapSubscriptions;

    mockGetReverseSwapsResult = [
      {
        pair: 'BTC/BTC',
      },
      {
        some: 'otherData',
      },
    ];

    mockGetChainSwapsResult = [
      {
        chainSwap: {
          id: 'chain1',
          status: SwapUpdateEvent.SwapCreated,
        },
        sendingData: {
          symbol: 'BTC',
        },
        receivingData: {
          symbol: 'BTC',
        },
      },
      {
        chainSwap: {
          id: 'chain2',
          status: SwapUpdateEvent.TransactionMempool,
        },
        sendingData: {
          symbol: 'LTC',
        },
        receivingData: {
          symbol: 'BTC',
        },
      },
    ];

    await manager.init([btcCurrency, ltcCurrency], []);

    expect(manager.currencies.size).toEqual(4);

    expect(manager.currencies.get('BTC')).toEqual(btcCurrency);
    expect(manager.currencies.get('LTC')).toEqual(ltcCurrency);

    expect(mockGetReverseSwaps).toHaveBeenCalledTimes(1);
    expect(mockGetReverseSwaps).toHaveBeenCalledWith({
      status: {
        [Op.notIn]: [
          SwapUpdateEvent.SwapExpired,
          SwapUpdateEvent.InvoiceSettled,
          SwapUpdateEvent.TransactionFailed,
          SwapUpdateEvent.TransactionRefunded,
        ],
      },
    });

    expect(mockGetChainSwaps).toHaveBeenCalledWith({
      status: {
        [Op.notIn]: FinalChainSwapEvents,
      },
    });

    expect(mockRecreateSubscriptions).toHaveBeenCalledTimes(2);
    expect(mockRecreateSubscriptions).toHaveBeenCalledWith([]);
    expect(mockRecreateSubscriptions).toHaveBeenCalledWith(
      mockGetReverseSwapsResult,
    );

    expect(mockRecreateChainSwapSubscriptions).toHaveBeenCalledTimes(1);
    expect(mockRecreateChainSwapSubscriptions).toHaveBeenCalledWith(
      mockGetChainSwapsResult,
    );
  });

  test('should return invoice expiry range', () => {
    const range = manager.getInvoiceExpiryRange('BTC/BTC');
    expect(range).toEqual({ min: 60, max: 3600 });
  });

  test('should create Swaps', async () => {
    const baseCurrency = 'BTC';
    const quoteCurrency = 'BTC';
    const orderSide = OrderSide.BUY;
    const preimageHash = getHexBuffer(
      '4d57a64c3b4f19cd4a8c79e3038dba7024bbf77ee4f768f0c1b42fbb590c835c',
    );
    const refundKey = getHexBuffer(
      '03f1c589378d79bb4a38be80bd085f5454a07d7f5c515fa0752f1b443816442ac2',
    );
    const timeoutBlockDelta = 140;

    const swap = await manager.createSwap({
      orderSide,
      preimageHash,
      baseCurrency,
      quoteCurrency,
      timeoutBlockDelta,
      refundPublicKey: refundKey,
      version: SwapVersion.Legacy,
    });

    expect(swap).toEqual({
      id: swap.id,
      address: '2Mu28zPUNMkM5w9q3UhVhpw8p2p5zwtv9Ce',
      timeoutBlockHeight:
        mockGetBlockchainInfoResult.blocks + timeoutBlockDelta,
      redeemScript:
        'a9144631a4007d7e5b0f02f86f3a7f3b5c1442ac98f587632102c9c71ee3fee0c400ff64e51e955313e77ea499fc609973c71c5a4104a8d903bb67020701b1752103f1c589378d79bb4a38be80bd085f5454a07d7f5c515fa0752f1b443816442ac268ac',
    });

    expect(mockGetBlockchainInfo).toHaveBeenCalledTimes(1);
    expect(mockGetNewKeys).toHaveBeenCalledTimes(1);
    expect(mockEncodeAddress).toHaveBeenCalledTimes(1);

    expect(ScriptPubKeyRepository.add).toHaveBeenCalledTimes(1);
    expect(ScriptPubKeyRepository.add).toHaveBeenCalledWith(
      swap.id,
      baseCurrency,
      getHexBuffer('a9141376abf97f0345aecbda15f95453f4a7446b326287'),
      expect.any(Object),
    );

    expect(mockAddSwap).toHaveBeenCalledTimes(1);
    expect(mockAddSwap).toHaveBeenCalledWith(
      {
        orderSide,
        id: swap.id,
        version: SwapVersion.Legacy,
        status: SwapUpdateEvent.SwapCreated,
        keyIndex: mockGetNewKeysResult.index,
        pair: `${baseCurrency}/${quoteCurrency}`,
        refundPublicKey: getHexString(refundKey),
        preimageHash: getHexString(preimageHash),
        lockupAddress: '2Mu28zPUNMkM5w9q3UhVhpw8p2p5zwtv9Ce',
        timeoutBlockHeight:
          mockGetBlockchainInfoResult.blocks + timeoutBlockDelta,
        redeemScript:
          'a9144631a4007d7e5b0f02f86f3a7f3b5c1442ac98f587632102c9c71ee3fee0c400ff64e51e955313e77ea499fc609973c71c5a4104a8d903bb67020701b1752103f1c589378d79bb4a38be80bd085f5454a07d7f5c515fa0752f1b443816442ac268ac',
        createdRefundSignature: false,
      },
      expect.any(Object),
    );

    // No LND client found
    const notFoundSymbol = 'DOGE';
    manager['currencies'].set(notFoundSymbol, {
      symbol: notFoundSymbol,
    } as any);

    await expect(
      manager.createSwap({
        orderSide,
        preimageHash,
        quoteCurrency,
        timeoutBlockDelta,
        refundPublicKey: refundKey,
        version: SwapVersion.Legacy,
        baseCurrency: notFoundSymbol,
      }),
    ).rejects.toEqual(Errors.NO_LIGHTNING_SUPPORT(notFoundSymbol));
  });

  test('should set invoices of Swaps', async () => {
    const swap = {
      id: 'id',
      pair: 'BTC/BTC',
      chainCurrency: 'BTC',
      lightningCurrency: 'BTC',
      type: SwapType.Submarine,
      orderSide: OrderSide.BUY,
      preimageHash:
        '1558d179d9e3de706997e3b6bb33f704a5b8086b27538fd04ef5e313467333b8',
      expectedAmount: 350,
      onchainAmount: 350,
      status: SwapUpdateEvent.TransactionConfirmed,
    } as any as Swap;

    SwapRepository.getSwap = jest.fn().mockResolvedValue(swap);

    // The invoice has to be generated here because the timestamp is used when setting the invoice of a Swap
    const invoicePreimageHash = swap.preimageHash;
    const invoiceSignKeys = getHexBuffer(
      'bd67aa04f8e310ad257f2d7f5a2f4cf314c6c6017515748fb05c33763b1c6744',
    );
    const invoiceEncode = bolt11.encode({
      payeeNodeKey: getHexString(
        Buffer.from(ECPair.fromPrivateKey(invoiceSignKeys).publicKey),
      ),
      satoshis: 200,
      tags: [
        {
          data: swap.preimageHash,
          tagName: 'payment_hash',
        },
      ],
    });

    const invoice = bolt11.sign(invoiceEncode, invoiceSignKeys).paymentRequest!;

    const expectedAmount = 350;
    const percentageFee = 50;
    const acceptZeroConf = false;
    const emitSwapInvoiceSet = jest.fn().mockImplementation();

    manager['rateProvider'].acceptZeroConf = jest
      .fn()
      .mockImplementation(() => acceptZeroConf);

    const fees = {
      baseFee: 100,
      percentageFee: 50,
      percentageFeeRate: 0.05,
    };

    const creationHook = jest.spyOn(manager.creationHook, 'hook');
    await manager.setSwapInvoice(
      swap,
      invoice,
      1,
      fees,
      true,
      emitSwapInvoiceSet,
    );

    expect(creationHook).toHaveBeenCalledTimes(1);
    expect(creationHook).toHaveBeenCalledWith(SwapType.Submarine, {
      id: swap.id,
      symbolSending: 'BTC',
      symbolReceiving: 'BTC',
      referral: swap.referral,
      invoice,
      invoiceAmount: invoiceEncode.satoshis!,
    });

    expect(mockSetInvoice).toHaveBeenCalledTimes(1);
    expect(mockSetInvoice).toHaveBeenCalledWith(
      swap,
      invoice,
      invoiceEncode.satoshis,
      expectedAmount,
      percentageFee,
      acceptZeroConf,
    );

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

    swap.lockupTransactionId =
      '1558d179d9e3de706997e3b6bb33f704a5b8086b27538fd04ef5e313467333b8';
    mockGetRawTransactionResult =
      '020000000001018542307f1f57326e533123327f6a7e5729241c9cf468bca7897c47c0019a21010100000000fdffffff0298560b0000000000160014c99fd000fb30137ae03fd2b28f52878e9b29194f2e020000000000001976a91462e907b15cbf27d5425399ebf6f0fb50ebb88f1888ac02473044022034deabdeb0d1d4d2fe2cf450f5ef27c1e5709670b87dbe3b8e175ac094fb935802207630148ec8e73c24e284af700ac1f34e8058735a8852e8fd4c81ad04233b12230121031f6fa906bb52f3e1bdc59156a5659ce1aa251eaf26f411413c76409360ef7205bcaf0900';

    await manager.setSwapInvoice(
      swap,
      invoice,
      1,
      fees,
      true,
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
      1,
      fees,
      true,
      emitSwapInvoiceSet,
    );

    expect(mockAttemptSettleSwap).toHaveBeenCalledTimes(2);
    expect(mockAttemptSettleSwap).toHaveBeenNthCalledWith(
      2,
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
      1,
      fees,
      true,
      emitSwapInvoiceSet,
    );

    expect(mockAttemptSettleSwap).toHaveBeenCalledTimes(3);

    swap.lockupTransactionId = undefined;

    // Swap that has mismatched amounts should not be settled
    const originalGetSwap = SwapRepository.getSwap;
    SwapRepository.getSwap = jest.fn().mockResolvedValue({
      ...swap,
      lockupTransactionId:
        '1558d179d9e3de706997e3b6bb33f704a5b8086b27538fd04ef5e313467333b8',
      status: SwapUpdateEvent.TransactionConfirmed,
      expectedAmount: 100,
      onchainAmount: 90, // Different amount to prevent settlement
    });

    await expect(
      manager.setSwapInvoice(swap, invoice, 1, fees, true, emitSwapInvoiceSet),
    ).rejects.toEqual(ServiceErrors.INVALID_INVOICE_AMOUNT(0));

    // Settlement should not be attempted because amounts don't match
    expect(mockAttemptSettleSwap).toHaveBeenCalledTimes(3);

    // Swap that has already created a refund signature should throw error
    SwapRepository.getSwap = jest.fn().mockResolvedValue({
      ...swap,
      createdRefundSignature: true,
    });

    await expect(
      manager.setSwapInvoice(swap, invoice, 1, fees, true, emitSwapInvoiceSet),
    ).rejects.toEqual(Errors.SWAP_ALREADY_REFUNDED(swap.id));

    SwapRepository.getSwap = originalGetSwap;

    expect(mockAttemptSettleSwap).toHaveBeenCalledTimes(3);

    let error: any;

    // Invoice that expired already
    const invoiceExpired =
      'lnbcrt3210n1p00galgpp5z4vdz7weu008q6vhuwmtkvlhqjjmszrtyafcl5zw7h33x3nnxwuqdqqcqzpgsp5q70xcl9mw3dcxmc78el7m2gl86rtv60tazlay6tz5ddpjuu0p4mq9qy9qsqcympv8hx4j877hm26uyrpfxur497x27kuqvlq7kdd8wjucjla849d8nc2m38ce04f26vycv6mjqxusva8ge36jnrrgnj4fzey70yy4cpaac77a';

    try {
      await manager.setSwapInvoice(
        swap,
        invoiceExpired,
        1,
        fees,
        true,
        emitSwapInvoiceSet,
      );
    } catch (e) {
      error = e;
    }

    expect(error!.code).toEqual('6.13');
    expect(error!.message).toEqual('the provided invoice expired already');

    // Invalid preimage hash
    swap.preimageHash = getHexString(randomBytes(32));

    await expect(
      manager.setSwapInvoice(swap, invoice, 1, fees, true, emitSwapInvoiceSet),
    ).rejects.toEqual(Errors.INVOICE_INVALID_PREIMAGE_HASH(swap.preimageHash));

    swap.preimageHash = invoicePreimageHash;

    // Routability check fails
    await expect(
      manager.setSwapInvoice(swap, invoice, 1, fees, false, emitSwapInvoiceSet),
    ).rejects.toEqual(Errors.NO_ROUTE_FOUND());

    mockAttemptSettleSwapThrow = false;
  });

  test('should only attempt to settle swap when status is TransactionConfirmed', async () => {
    const swap = {
      id: 'settleOnlyWhenConfirmed',
      pair: 'BTC/BTC',
      chainCurrency: 'BTC',
      lightningCurrency: 'BTC',
      type: SwapType.Submarine,
      orderSide: OrderSide.BUY,
      preimageHash:
        '1558d179d9e3de706997e3b6bb33f704a5b8086b27538fd04ef5e313467333b8',
      expectedAmount: 350,
      onchainAmount: 350,
      lockupTransactionId:
        '1558d179d9e3de706997e3b6bb33f704a5b8086b27538fd04ef5e313467333b8',
    } as any as Swap;

    const invoiceSignKeys = getHexBuffer(
      'bd67aa04f8e310ad257f2d7f5a2f4cf314c6c6017515748fb05c33763b1c6744',
    );
    const invoiceEncode = bolt11.encode({
      payeeNodeKey: getHexString(
        Buffer.from(ECPair.fromPrivateKey(invoiceSignKeys).publicKey),
      ),
      satoshis: 200,
      tags: [
        {
          data: swap.preimageHash,
          tagName: 'payment_hash',
        },
      ],
    });
    const invoice = bolt11.sign(invoiceEncode, invoiceSignKeys).paymentRequest!;

    const fees = {
      baseFee: 100,
      percentageFee: 50,
      percentageFeeRate: 0.05,
    };
    const emitSwapInvoiceSet = jest.fn().mockImplementation();

    const mockAttemptSettleSwap = jest.fn().mockResolvedValue(undefined);
    manager.nursery.attemptSettleSwap = mockAttemptSettleSwap;
    SwapRepository.setInvoice = jest
      .fn()
      .mockImplementation(async (updatedSwap: Swap) => {
        updatedSwap.status = SwapUpdateEvent.InvoiceSet;
        return updatedSwap;
      }) as any;

    mockGetRawTransactionResult =
      '020000000001018542307f1f57326e533123327f6a7e5729241c9cf468bca7897c47c0019a21010100000000fdffffff0298560b0000000000160014c99fd000fb30137ae03fd2b28f52878e9b29194f2e020000000000001976a91462e907b15cbf27d5425399ebf6f0fb50ebb88f1888ac02473044022034deabdeb0d1d4d2fe2cf450f5ef27c1e5709670b87dbe3b8e175ac094fb935802207630148ec8e73c24e284af700ac1f34e8058735a8852e8fd4c81ad04233b12230121031f6fa906bb52f3e1bdc59156a5659ce1aa251eaf26f411413c76409360ef7205bcaf0900';

    swap.status = SwapUpdateEvent.TransactionMempool;
    SwapRepository.getSwap = jest.fn().mockResolvedValue(swap);

    await manager.setSwapInvoice(
      swap,
      invoice,
      1,
      fees,
      true,
      emitSwapInvoiceSet,
    );

    expect(mockAttemptSettleSwap).toHaveBeenCalledTimes(0);

    // Test with status TransactionConfirmed (should call attemptSettleSwap)
    swap.status = SwapUpdateEvent.TransactionConfirmed;
    SwapRepository.getSwap = jest.fn().mockResolvedValue(swap);

    await manager.setSwapInvoice(
      swap,
      invoice,
      1,
      fees,
      true,
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

    // no lockup tx
    mockAttemptSettleSwap.mockClear();
    swap.lockupTransactionId = undefined;
    SwapRepository.getSwap = jest.fn().mockResolvedValue(swap);

    await manager.setSwapInvoice(
      swap,
      invoice,
      1,
      fees,
      true,
      emitSwapInvoiceSet,
    );

    expect(mockAttemptSettleSwap).toHaveBeenCalledTimes(0);
  });

  test('should throw when setting expired invoices', async () => {
    const swap = {
      id: 'expiredInvoice',
      pair: 'BTC/BTC',
      chainCurrency: 'BTC',
      lightningCurrency: 'BTC',
      type: SwapType.Submarine,
      orderSide: OrderSide.BUY,
      preimageHash:
        '1558d179d9e3de706997e3b6bb33f704a5b8086b27538fd04ef5e313467333b8',
      expectedAmount: 350,
      onchainAmount: 350,
    } as any as Swap;

    SwapRepository.getSwap = jest.fn().mockResolvedValue(swap);

    const expiredInvoice =
      'lnbcrt3210n1p00galgpp5z4vdz7weu008q6vhuwmtkvlhqjjmszrtyafcl5zw7h33x3nnxwuqdqqcqzpgsp5q70xcl9mw3dcxmc78el7m2gl86rtv60tazlay6tz5ddpjuu0p4mq9qy9qsqcympv8hx4j877hm26uyrpfxur497x27kuqvlq7kdd8wjucjla849d8nc2m38ce04f26vycv6mjqxusva8ge36jnrrgnj4fzey70yy4cpaac77a';

    const fees = {
      baseFee: 100,
      percentageFee: 50,
      percentageFeeRate: 0.05,
    };
    const emitSwapInvoiceSet = jest.fn().mockImplementation();

    await expect(
      manager.setSwapInvoice(
        swap,
        expiredInvoice,
        1,
        fees,
        true,
        emitSwapInvoiceSet,
      ),
    ).rejects.toEqual(Errors.INVOICE_EXPIRED_ALREADY());
  });

  test('should reject setting invoices that expire too soon', async () => {
    const swap = {
      id: 'expiryTooSoon',
      pair: 'BTC/BTC',
      chainCurrency: 'BTC',
      lightningCurrency: 'BTC',
      type: SwapType.Submarine,
      orderSide: OrderSide.BUY,
      preimageHash:
        '1558d179d9e3de706997e3b6bb33f704a5b8086b27538fd04ef5e313467333b8',
      expectedAmount: 350,
      onchainAmount: 350,
    } as any as Swap;

    SwapRepository.getSwap = jest.fn().mockResolvedValue(swap);

    const invoiceSignKeys = getHexBuffer(
      'bd67aa04f8e310ad257f2d7f5a2f4cf314c6c6017515748fb05c33763b1c6744',
    );
    const invoiceEncode = bolt11.encode({
      payeeNodeKey: getHexString(
        Buffer.from(ECPair.fromPrivateKey(invoiceSignKeys).publicKey),
      ),
      satoshis: 200,
      tags: [
        {
          data: swap.preimageHash,
          tagName: 'payment_hash',
        },
        {
          data: 60,
          tagName: 'expire_time',
        },
      ],
    });

    const invoice = bolt11.sign(invoiceEncode, invoiceSignKeys).paymentRequest!;

    manager['rateProvider'].acceptZeroConf = jest
      .fn()
      .mockImplementation(() => false);

    const fees = {
      baseFee: 100,
      percentageFee: 50,
      percentageFeeRate: 0.05,
    };
    const emitSwapInvoiceSet = jest.fn().mockImplementation();

    await expect(
      manager.setSwapInvoice(swap, invoice, 1, fees, true, emitSwapInvoiceSet),
    ).rejects.toEqual(ServiceErrors.INVOICE_EXPIRY_TOO_SHORT());
  });

  test('should create Reverse Swaps', async () => {
    manager['recreateFilters'] = jest.fn().mockImplementation();
    manager['recreateSubscriptions'] = jest.fn().mockImplementation();
    await manager.init([btcCurrency, ltcCurrency], []);

    const preimageHash = getHexBuffer(
      '6b0d0275c597a18cfcc23261a62e095e2ba12ac5c866823d2926912806a5b10a',
    );
    const claimKey = getHexBuffer(
      '026c94d2958888e70fd32349b3c195803976e0865a54ab1755f19c2c820fcbafa8',
    );

    const baseCurrency = 'BTC';
    const quoteCurrency = 'BTC';
    const orderSide = OrderSide.BUY;
    const holdInvoiceAmount = 10;
    const onchainAmount = 8;
    const onchainTimeoutBlockDelta = 140;
    const lightningTimeoutBlockDelta = 143;
    const percentageFee = 1;
    const invoiceExpiry = 6_111;

    const creationHook = jest.spyOn(manager.creationHook, 'hook');

    const reverseSwap = await manager.createReverseSwap({
      orderSide,
      preimageHash,
      baseCurrency,
      quoteCurrency,
      onchainAmount,
      percentageFee,
      invoiceExpiry,
      holdInvoiceAmount,
      onchainTimeoutBlockDelta,
      lightningTimeoutBlockDelta,
      claimCovenant: false,
      claimPublicKey: claimKey,
      version: SwapVersion.Legacy,
    });

    expect(creationHook).toHaveBeenCalledTimes(1);
    expect(creationHook).toHaveBeenCalledWith(SwapType.ReverseSubmarine, {
      id: reverseSwap.id,
      symbolSending: 'BTC',
      symbolReceiving: 'BTC',
      invoiceAmount: holdInvoiceAmount,
    });

    expect(reverseSwap).toEqual({
      id: expect.anything(),
      minerFeeInvoice: undefined,
      invoice: mockAddHoldInvoiceResult,
      lockupAddress:
        'bcrt1q2f4axqr8859mmemce2fcvdvuqlu8vqtjfg3z4j2w4fu52t58g42sjtfv2y',
      timeoutBlockHeight:
        onchainTimeoutBlockDelta + mockGetBlockchainInfoResult.blocks,
      redeemScript:
        '8201208763a9142f958e32209e7d5f60d321d4f4f6e12bdbf06db28821026c94d2958888e70fd32349b3c195803976e0865a54ab1755f19c2c820fcbafa86775020701b1752102c9c71ee3fee0c400ff64e51e955313e77ea499fc609973c71c5a4104a8d903bb68ac',
    });

    expect(mockGetExpiry).toHaveBeenCalledTimes(1);
    expect(mockGetExpiry).toHaveBeenCalledWith(
      getPairId({ base: baseCurrency, quote: quoteCurrency }),
      invoiceExpiry,
    );

    expect(mockAddHoldInvoice).toHaveBeenCalledTimes(1);
    expect(mockAddHoldInvoice).toHaveBeenCalledWith(
      holdInvoiceAmount,
      preimageHash,
      lightningTimeoutBlockDelta,
      mockGetExpiryResult,
      'mock',
      undefined,
      [],
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
      node: NodeType.LND,
      id: reverseSwap.id,
      minerFeeInvoice: undefined,
      version: SwapVersion.Legacy,
      invoice: mockAddHoldInvoiceResult,
      invoiceAmount: holdInvoiceAmount,
      status: SwapUpdateEvent.SwapCreated,
      keyIndex: mockGetNewKeysResult.index,
      claimPublicKey: getHexString(claimKey),
      pair: `${baseCurrency}/${quoteCurrency}`,
      preimageHash: getHexString(preimageHash),
      lockupAddress:
        'bcrt1q2f4axqr8859mmemce2fcvdvuqlu8vqtjfg3z4j2w4fu52t58g42sjtfv2y',
      timeoutBlockHeight:
        onchainTimeoutBlockDelta + mockGetBlockchainInfoResult.blocks,
      redeemScript:
        '8201208763a9142f958e32209e7d5f60d321d4f4f6e12bdbf06db28821026c94d2958888e70fd32349b3c195803976e0865a54ab1755f19c2c820fcbafa86775020701b1752102c9c71ee3fee0c400ff64e51e955313e77ea499fc609973c71c5a4104a8d903bb68ac',
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
      claimCovenant: false,
      claimPublicKey: claimKey,
      version: SwapVersion.Legacy,
    });

    expect(prepayReverseSwap).toEqual({
      id: expect.anything(),
      invoice: mockAddHoldInvoiceResult,
      minerFeeInvoice: mockAddHoldInvoiceResult,
      lockupAddress:
        'bcrt1q2f4axqr8859mmemce2fcvdvuqlu8vqtjfg3z4j2w4fu52t58g42sjtfv2y',
      timeoutBlockHeight:
        onchainTimeoutBlockDelta + mockGetBlockchainInfoResult.blocks,
      redeemScript:
        '8201208763a9142f958e32209e7d5f60d321d4f4f6e12bdbf06db28821026c94d2958888e70fd32349b3c195803976e0865a54ab1755f19c2c820fcbafa86775020701b1752102c9c71ee3fee0c400ff64e51e955313e77ea499fc609973c71c5a4104a8d903bb68ac',
    });

    expect(mockSubscribeSingleInvoice).toHaveBeenCalledTimes(3);

    expect(mockAddHoldInvoice).toHaveBeenCalledTimes(3);
    expect(mockAddHoldInvoice).toHaveBeenNthCalledWith(
      2,
      holdInvoiceAmount,
      preimageHash,
      lightningTimeoutBlockDelta,
      mockGetExpiryResult,
      'mock',
      undefined,
      [],
    );
    expect(mockAddHoldInvoice).toHaveBeenNthCalledWith(
      3,
      prepayMinerFeeInvoiceAmount,
      expect.anything(),
      undefined,
      mockGetExpiryResult,
      'Miner fee for sending to BTC address',
      undefined,
      [],
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
      node: NodeType.LND,
      id: prepayReverseSwap.id,
      version: SwapVersion.Legacy,
      invoice: mockAddHoldInvoiceResult,
      invoiceAmount: holdInvoiceAmount,
      status: SwapUpdateEvent.SwapCreated,
      keyIndex: mockGetNewKeysResult.index,
      claimPublicKey: getHexString(claimKey),
      pair: `${baseCurrency}/${quoteCurrency}`,
      preimageHash: getHexString(preimageHash),
      minerFeeInvoice: mockAddHoldInvoiceResult,
      minerFeeInvoicePreimage: expect.anything(),
      minerFeeOnchainAmount: prepayMinerFeeOnchainAmount,
      lockupAddress:
        'bcrt1q2f4axqr8859mmemce2fcvdvuqlu8vqtjfg3z4j2w4fu52t58g42sjtfv2y',
      timeoutBlockHeight:
        onchainTimeoutBlockDelta + mockGetBlockchainInfoResult.blocks,
      redeemScript:
        '8201208763a9142f958e32209e7d5f60d321d4f4f6e12bdbf06db28821026c94d2958888e70fd32349b3c195803976e0865a54ab1755f19c2c820fcbafa86775020701b1752102c9c71ee3fee0c400ff64e51e955313e77ea499fc609973c71c5a4104a8d903bb68ac',
    });

    // Private routing hints
    const nodePublicKey = 'some node';

    const mockGetRoutingHintsResult = ['private', 'channel', 'data'];
    const mockGetRoutingHints = jest
      .fn()
      .mockImplementation(() => mockGetRoutingHintsResult);

    manager['routingHints'].stop();
    manager['nodeFallback']['routingHints'] = {
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
      prepayMinerFeeInvoiceAmount,
      claimCovenant: false,
      claimPublicKey: claimKey,
      routingNode: nodePublicKey,
      version: SwapVersion.Legacy,
    });

    expect(mockGetRoutingHints).toHaveBeenCalledTimes(1);
    expect(mockGetRoutingHints).toHaveBeenCalledWith(
      baseCurrency,
      nodePublicKey,
      NodeType.LND,
    );

    expect(mockSubscribeSingleInvoice).toHaveBeenCalledTimes(5);

    expect(mockAddHoldInvoice).toHaveBeenCalledTimes(5);
    expect(mockAddHoldInvoice).toHaveBeenNthCalledWith(
      4,
      holdInvoiceAmount,
      preimageHash,
      lightningTimeoutBlockDelta,
      mockGetExpiryResult,
      'mock',
      undefined,
      mockGetRoutingHintsResult,
    );
    expect(mockAddHoldInvoice).toHaveBeenNthCalledWith(
      5,
      prepayMinerFeeInvoiceAmount,
      expect.anything(),
      undefined,
      mockGetExpiryResult,
      'Miner fee for sending to BTC address',
      undefined,
      mockGetRoutingHintsResult,
    );

    // No LND client found
    const notFoundSymbol = 'DOGE';
    manager['currencies'].set(notFoundSymbol, {
      symbol: notFoundSymbol,
    } as any);

    await expect(
      manager.createReverseSwap({
        orderSide,
        baseCurrency,
        preimageHash,
        percentageFee,
        onchainAmount,
        holdInvoiceAmount,
        onchainTimeoutBlockDelta,
        lightningTimeoutBlockDelta,
        claimCovenant: false,
        claimPublicKey: claimKey,
        version: SwapVersion.Legacy,
        quoteCurrency: notFoundSymbol,
      }),
    ).rejects.toEqual(Errors.NO_LIGHTNING_SUPPORT(notFoundSymbol));
  });

  test('should create reverse swap with covenant', async () => {
    const params = {
      version: SwapVersion.Taproot,
      orderSide: OrderSide.SELL,
      baseCurrency: btcCurrency.symbol,
      quoteCurrency: lbtcCurrency.symbol,
      percentageFee: 500,
      onchainAmount: 9_500,
      holdInvoiceAmount: 10_000,
      onchainTimeoutBlockDelta: 123,
      lightningTimeoutBlockDelta: 125,

      claimCovenant: true,
      preimageHash: getHexBuffer(
        'e5b18d8d20cbdf72f595dccd22508a6f3acc570e7659ed1ec362b4ee1136eb70',
      ),
      claimPublicKey: getHexBuffer(
        '0302804e7f86e9ca29f582f1fd2b91e6eee6be10b5e2b086dfa52a14aa8ca63fcb',
      ),
      userAddress:
        'el1qq0lcekdcnur4hcgk2ctyt7kj0yr5yjqjlvnsrq5hsxhyk5duc9d2jfsxgy4vpm4lrdmeeadsu5jhsv2mdgvay2re3lt8wwq25',
    };

    expect(
      (await manager.createReverseSwap(params)).swapTree,
    ).toMatchSnapshot();
  });

  test('should throw when creating reverse swaps with covenant on chain that is not Liquid', async () => {
    const params = {
      version: SwapVersion.Taproot,
      orderSide: OrderSide.SELL,
      baseCurrency: btcCurrency.symbol,
      quoteCurrency: btcCurrency.symbol,
      percentageFee: 500,
      onchainAmount: 9_500,
      holdInvoiceAmount: 10_000,
      onchainTimeoutBlockDelta: 123,
      lightningTimeoutBlockDelta: 125,

      claimCovenant: true,
      preimageHash: randomBytes(32),
    };

    await expect(manager.createReverseSwap(params)).rejects.toEqual(
      'claim covenant only supported on Liquid',
    );
  });

  test('should throw when creating reverse swaps with covenant without address', async () => {
    const params = {
      version: SwapVersion.Taproot,
      orderSide: OrderSide.SELL,
      baseCurrency: btcCurrency.symbol,
      quoteCurrency: lbtcCurrency.symbol,
      percentageFee: 500,
      onchainAmount: 9_500,
      holdInvoiceAmount: 10_000,
      onchainTimeoutBlockDelta: 123,
      lightningTimeoutBlockDelta: 125,

      claimCovenant: true,
      preimageHash: randomBytes(32),
    };

    await expect(manager.createReverseSwap(params)).rejects.toEqual(
      'userAddress for covenant not specified',
    );
  });

  test('should throw when creating reverse swaps with covenant with invalid address', async () => {
    const params = {
      version: SwapVersion.Taproot,
      orderSide: OrderSide.SELL,
      baseCurrency: btcCurrency.symbol,
      quoteCurrency: lbtcCurrency.symbol,
      percentageFee: 500,
      onchainAmount: 9_500,
      holdInvoiceAmount: 10_000,
      onchainTimeoutBlockDelta: 123,
      lightningTimeoutBlockDelta: 125,

      claimCovenant: true,
      preimageHash: randomBytes(32),
      userAddress: 'not a liquid address',
    };

    await expect(manager.createReverseSwap(params)).rejects.toEqual(
      Errors.INVALID_ADDRESS(),
    );
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
