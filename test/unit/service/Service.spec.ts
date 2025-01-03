import { address } from 'bitcoinjs-lib';
import bolt11 from 'bolt11';
import { Networks } from 'boltz-core';
import { randomBytes } from 'crypto';
import { Provider } from 'ethers';
import {
  Transaction as LiquidTransaction,
  networks as liquidNetworks,
} from 'liquidjs-lib';
import { ConfigType } from '../../../lib/Config';
import { ECPair } from '../../../lib/ECPairHelper';
import Logger from '../../../lib/Logger';
import {
  getHexBuffer,
  getHexString,
  getPairId,
  getUnixTime,
} from '../../../lib/Utils';
import ApiErrors from '../../../lib/api/Errors';
import ChainClient from '../../../lib/chain/ChainClient';
import {
  etherDecimals,
  ethereumPrepayMinerFeeGasLimit,
  gweiDecimals,
} from '../../../lib/consts/Consts';
import {
  BaseFeeType,
  CurrencyType,
  OrderSide,
  PercentageFeeType,
  ServiceInfo,
  ServiceWarning,
  SwapType,
  SwapUpdateEvent,
  SwapVersion,
} from '../../../lib/consts/Enums';
import { PairConfig } from '../../../lib/consts/Types';
import Swap from '../../../lib/db/models/Swap';
import ChainSwapRepository from '../../../lib/db/repositories/ChainSwapRepository';
import ChannelCreationRepository from '../../../lib/db/repositories/ChannelCreationRepository';
import PairRepository from '../../../lib/db/repositories/PairRepository';
import ReferralRepository from '../../../lib/db/repositories/ReferralRepository';
import ReverseRoutingHintRepository from '../../../lib/db/repositories/ReverseRoutingHintRepository';
import ReverseSwapRepository from '../../../lib/db/repositories/ReverseSwapRepository';
import SwapRepository from '../../../lib/db/repositories/SwapRepository';
import { satToMsat } from '../../../lib/lightning/ChannelUtils';
import LightningErrors from '../../../lib/lightning/Errors';
import { InvoiceFeature } from '../../../lib/lightning/LightningClient';
import LndClient from '../../../lib/lightning/LndClient';
import { CurrencyInfo } from '../../../lib/proto/boltzrpc_pb';
import FeeProvider from '../../../lib/rates/FeeProvider';
import RateCalculator from '../../../lib/rates/RateCalculator';
import Errors from '../../../lib/service/Errors';
import Service, {
  WebHookData,
  cancelledViaCliFailureReason,
} from '../../../lib/service/Service';
import { InvoiceType } from '../../../lib/sidecar/DecodedInvoice';
import Sidecar from '../../../lib/sidecar/Sidecar';
import SwapErrors from '../../../lib/swap/Errors';
import NodeSwitch from '../../../lib/swap/NodeSwitch';
import SwapManager from '../../../lib/swap/SwapManager';
import Wallet from '../../../lib/wallet/Wallet';
import WalletManager, { Currency } from '../../../lib/wallet/WalletManager';
import { Ethereum } from '../../../lib/wallet/ethereum/EvmNetworks';
import packageJson from '../../../package.json';
import { createInvoice } from '../swap/InvoiceUtils';

const mockGetPairs = jest.fn().mockResolvedValue([]);
const mockAddPair = jest.fn().mockReturnValue(Promise.resolve());

jest.mock('../../../lib/db/repositories/PairRepository');

let mockGetSwapResult: any = undefined;
const mockGetSwap = jest.fn().mockImplementation(async () => {
  if (Array.isArray(mockGetSwapResult)) {
    return mockGetSwapResult.shift();
  } else {
    return mockGetSwapResult;
  }
});

const mockAddSwap = jest.fn().mockResolvedValue(undefined);

jest.mock('../../../lib/db/repositories/SwapRepository');

const mockedSwapRepository = <jest.Mock<SwapRepository>>(<any>SwapRepository);

let mockGetReverseSwapResult: any = null;
jest.mock('../../../lib/db/repositories/ReverseSwapRepository', () => {
  return {
    getReverseSwap: jest
      .fn()
      .mockImplementation(async () => mockGetReverseSwapResult),
  };
});

let mockGetChannelCreationResult: any = undefined;
const mockGetChannelCreation = jest.fn().mockImplementation(() => {
  return mockGetChannelCreationResult;
});

jest.mock('../../../lib/db/repositories/ChannelCreationRepository');

const mockedChannelCreationRepository = <jest.Mock<ChannelCreationRepository>>(
  (<any>ChannelCreationRepository)
);

const mockAddReferral = jest.fn().mockImplementation(async () => {});

let referralByRoutingNode: any = undefined;
const mockGetReferralByRoutingNode = jest.fn().mockImplementation(async () => {
  return referralByRoutingNode;
});

ReferralRepository.addReferral = mockAddReferral;
ReferralRepository.getReferralByRoutingNode = mockGetReferralByRoutingNode;

const mockedSwap = {
  id: 'swapId',
  keyIndex: 42,
  address: 'bcrt1',
  redeemScript: '0x',
  timeoutBlockHeight: 123,
};
const mockCreateSwap = jest.fn().mockResolvedValue(mockedSwap);

const mockSetSwapInvoice = jest
  .fn()
  .mockImplementation(
    async (
      swap: Swap,
      _invoice: string,
      _invoiceAmount: number,
      _expectedAmount: number,
      _percentageFee: number,
      _acceptZeroConf: boolean,
      _canBeRouted: boolean,
      emitSwapInvoiceSet: (id: string) => void,
    ) => {
      emitSwapInvoiceSet(swap.id);
    },
  );

const mockedReverseSwap = {
  keyIndex: 43,
  id: 'reverseId',
  invoice: 'lnbcrt1',
  redeemScript: '0x',
  lockupAddress: 'bcrt1',
  timeoutBlockHeight: 123,
  minerFeeInvoice: 'lnbcrt2',
};
const mockCreateReverseSwap = jest.fn().mockResolvedValue(mockedReverseSwap);

const mockGetRoutingHintsResultToObjectResult = { some: 'routingData' };

const mockGetRoutingHintsResult = [
  mockGetRoutingHintsResultToObjectResult,
  mockGetRoutingHintsResultToObjectResult,
];
const mockGetRoutingHints = jest
  .fn()
  .mockImplementation(() => mockGetRoutingHintsResult);

jest.mock('../../../lib/swap/SwapManager', () => {
  return jest.fn().mockImplementation(() => ({
    nursery: {
      on: () => {},
      channelNursery: {
        on: () => {},
      },
      emit: jest.fn(),
    },
    routingHints: {
      getRoutingHints: mockGetRoutingHints,
    },
    swapRepository: mockedSwapRepository(),
    channelCreationRepository: mockedChannelCreationRepository(),
    createSwap: mockCreateSwap,
    setSwapInvoice: mockSetSwapInvoice,
    createReverseSwap: mockCreateReverseSwap,
  }));
});

const mockedSwapManager = <jest.Mock<SwapManager>>(<any>SwapManager);

const mockGetFeeDataResult: any = {
  gasPrice: BigInt(10) * gweiDecimals,
};
const mockGetFeeData = jest.fn().mockImplementation(async () => {
  return mockGetFeeDataResult;
});

const mockGetBlockNumberResult = 100;
const mockGetBlockNumber = jest
  .fn()
  .mockImplementation(async () => mockGetBlockNumberResult);

const mockedProvider = <jest.Mock<Provider>>(
  (<any>jest.fn().mockImplementation(() => ({
    getFeeData: mockGetFeeData,
    getBlockNumber: mockGetBlockNumber,
  })))
);

const mockGetBalanceResult = {
  totalBalance: 1,
  confirmedBalance: 2,
  unconfirmedBalance: 3,
};
const mockGetBalance = jest.fn().mockResolvedValue(mockGetBalanceResult);

const newAddress = 'bcrt1';
const mockGetAddress = jest.fn().mockResolvedValue(newAddress);

const mockGetKeysByIndexResult = ECPair.fromPrivateKey(
  getHexBuffer(
    'e682c45fff6f6f1d793e8d520d4660ac0f853636d47519614cc5d7e4077b1b82',
  ),
);
const mockGetKeysByIndex = jest.fn().mockReturnValue(mockGetKeysByIndexResult);

const mockTransaction = {
  vout: 1,
  transactionId: 'id',
  transaction: {
    getId: () => 'id',
    toHex: () => 'hex',
  },
};
const mockSendToAddress = jest.fn().mockResolvedValue(mockTransaction);
const mockSweepWallet = jest.fn().mockResolvedValue(mockTransaction);

const ethereumAddress = '0xc3b03f52ed641e59a40e1425481a8f3655b7edd5';

const mockGetEthereumAddress = jest.fn().mockResolvedValue(ethereumAddress);

const etherBalance = 239874;
const tokenBalance = 120210;

const etherTransaction = {
  transactionId:
    '0x90a060627f9a489cf816e2dae8babdf94a0f866982c6f489fb57c4ed218329f8',
};

const mockSendEther = jest.fn().mockResolvedValue(etherTransaction);
const mockSweepEther = jest.fn().mockResolvedValue(etherTransaction);

const tokenTransaction = {
  transactionId:
    '0x1d5c0fdc8d1816b730d37373510e7054f6e09fbbbfae1e6ad1067b3f13406cfe',
};

const mockSendToken = jest.fn().mockResolvedValue(tokenTransaction);
const mockSweepToken = jest.fn().mockResolvedValue(tokenTransaction);

const mockRescan = jest.fn().mockResolvedValue(undefined);

jest.mock('../../../lib/wallet/WalletManager', () => {
  return jest.fn().mockImplementation(() => ({
    ethereumManagers: [
      {
        networkDetails: Ethereum,
        provider: mockedProvider(),
        tokenAddresses: new Map<string, string>(),
        hasSymbol: jest.fn().mockReturnValue(true),
        contractEventHandler: {
          rescan: mockRescan,
        },
      },
    ],
    wallets: new Map<string, Wallet>([
      [
        'BTC',
        {
          serviceName: () => 'mockedCore',
          getBalance: mockGetBalance,
          getAddress: mockGetAddress,
          getKeysByIndex: mockGetKeysByIndex,
          sendToAddress: mockSendToAddress,
          sweepWallet: mockSweepWallet,
          encodeAddress: (script: Buffer) =>
            address.fromOutputScript(script, Networks.bitcoinRegtest),
        } as any as Wallet,
      ],
      [
        'L-BTC',
        {
          serviceName: () => 'mockedElements',
          getBalance: mockGetBalance,
          getAddress: mockGetAddress,
          getKeysByIndex: mockGetKeysByIndex,
          sendToAddress: mockSendToAddress,
          sweepWallet: mockSweepWallet,
          encodeAddress: (script: Buffer) =>
            address.fromOutputScript(script, liquidNetworks.regtest),
        } as any as Wallet,
      ],
      [
        'LTC',
        {
          serviceName: () => 'mockedCore',
          getBalance: () => ({
            totalBalance: 0,
            confirmedBalance: 0,
            unconfirmedBalance: 0,
          }),
        } as any as Wallet,
      ],
      [
        'ETH',
        {
          serviceName: () => 'ETH',
          getAddress: mockGetEthereumAddress,
          sweepWallet: mockSweepEther,
          sendToAddress: mockSendEther,
          getBalance: jest.fn().mockResolvedValue({
            totalBalance: etherBalance,
            confirmedBalance: etherBalance,
          }),
        } as any as Wallet,
      ],
      [
        'TRC',
        {
          serviceName: () => 'TRC',
          getAddress: mockGetEthereumAddress,
          sweepWallet: mockSweepToken,
          sendToAddress: mockSendToken,
          getBalance: jest.fn().mockResolvedValue({
            totalBalance: tokenBalance,
            confirmedBalance: tokenBalance,
          }),
        } as any as Wallet,
      ],
    ]),
  }));
});

const mockedWalletManager = <jest.Mock<WalletManager>>(<any>WalletManager);

const mockInitFeeProvider = jest.fn().mockReturnValue(undefined);

const mockGetFees = jest.fn().mockReturnValue({
  baseFee: 1,
  percentageFee: 1,
  percentageSwapInFee: 0,
});

const mockGetBaseFeeResult = 320;
const mockGetBaseFee = jest.fn().mockReturnValue(mockGetBaseFeeResult);

const mockGetPercentageFeeResult = 0.02;
const mockGetPercentageFee = jest
  .fn()
  .mockReturnValue(mockGetPercentageFeeResult);

const mockGetPercentageSwapInFeeResult = 0.02;
const mockGetPercentageSwapInFee = jest
  .fn()
  .mockReturnValue(mockGetPercentageSwapInFeeResult);

jest.mock('../../../lib/rates/FeeProvider', () => {
  return jest.fn().mockImplementation(() => ({
    init: mockInitFeeProvider,
    getFees: mockGetFees,
    getBaseFee: mockGetBaseFee,
    getPercentageFee: mockGetPercentageFee,
    getPercentageSwapInFee: mockGetPercentageSwapInFee,
  }));
});

const MockedFeeProvider = <jest.Mock<FeeProvider>>(<any>FeeProvider);

const mockCalculateRate = jest.fn().mockReturnValue(0.041);

jest.mock('../../../lib/rates/RateCalculator', () => {
  return jest.fn().mockImplementation(() => ({
    calculateRate: mockCalculateRate,
  }));
});

const MockedRateCalculator = <jest.Mock<RateCalculator>>(<any>RateCalculator);

const pairs = new Map<string, any>([
  [
    'BTC/BTC',
    {
      rate: 1,
      limits: {
        minimal: 1,
        maximal: Number.MAX_SAFE_INTEGER,
      },
      hash: 'hashOfBtcBtcPair',
    },
  ],
  [
    'LTC/BTC',
    {
      rate: 0.004,
      limits: {
        minimal: 1,
        maximal: Number.MAX_SAFE_INTEGER,
      },
      hash: 'hashOfLtcBtcPair',
    },
  ],
  [
    'ETH/BTC',
    {
      rate: 0.041,
      limits: {
        minimal: 1,
        maximal: Number.MAX_SAFE_INTEGER,
      },
    },
  ],
  [
    'test/pair',
    {
      limits: {
        minimal: 5,
        maximal: 10,
      },
      hash: 'hashOfTestPair',
    },
  ],
]);

const pairsTaprootSubmarine = new Map<string, Map<string, any>>([
  [
    'BTC',
    new Map<string, any>([
      [
        'BTC',
        {
          rate: 1,
          limits: {
            minimal: 1,
            maximal: 1_000_000,
          },
          hash: 'hashOfBtcBtcPair',
        },
      ],
    ]),
  ],
]);

const pairsTaprootReverse = new Map<string, Map<string, any>>([
  [
    'BTC',
    new Map<string, any>([
      [
        'BTC',
        {
          rate: 1,
          limits: {
            minimal: 2,
            maximal: 2_000_000,
          },
          hash: 'hashOfBtcBtcPair',
        },
      ],
    ]),
  ],
]);

const pairsTaprootChain = new Map<string, Map<string, any>>([
  [
    'BTC',
    new Map<string, any>([
      [
        'BTC',
        {
          rate: 1,
          limits: {
            minimal: 50_000,
            maximal: 5_000_000,
          },
          hash: 'hashOfBtcBtcPair',
        },
      ],
    ]),
  ],
]);

const mockInitRateProvider = jest.fn().mockReturnValue(Promise.resolve());

let mockAcceptZeroConfResult = true;
const mockAcceptZeroConf = jest
  .fn()
  .mockImplementation(() => mockAcceptZeroConfResult);

jest.mock('../../../lib/rates/RateProvider', () => {
  return jest.fn().mockImplementation(() => ({
    providers: {
      [SwapVersion.Legacy]: {
        pairs,
        validatePairHash: jest.fn().mockImplementation((hash) => {
          if (['', 'wrongHash'].includes(hash)) {
            throw Errors.INVALID_PAIR_HASH();
          }
        }),
      },
      [SwapVersion.Taproot]: {
        getChainPairs: jest.fn().mockReturnValue(pairsTaprootChain),
        getReversePairs: jest.fn().mockReturnValue(pairsTaprootReverse),
        getSubmarinePairs: jest.fn().mockReturnValue(pairsTaprootSubmarine),
        validatePairHash: jest.fn().mockImplementation((hash) => {
          if (['', 'wrongHash'].includes(hash)) {
            throw Errors.INVALID_PAIR_HASH();
          }
        }),
      },
    },
    init: mockInitRateProvider,
    feeProvider: MockedFeeProvider(),
    acceptZeroConf: mockAcceptZeroConf,
    rateCalculator: MockedRateCalculator(),
    has: jest
      .fn()
      .mockImplementation((pair) => ['BTC/BTC', 'LTC/BTC'].includes(pair)),
  }));
});

const mockEstimateFee = jest.fn().mockResolvedValue(2);

const mockGetNetworkInfo = jest.fn().mockResolvedValue({
  version: 180000,
  connections: 8,
});

const blockchainInfo = {
  blocks: 123,
  scannedBlocks: 321,
};
const mockGetBlockchainInfo = jest.fn().mockResolvedValue(blockchainInfo);

const rawTransaction = 'rawTransaction';
const mockGetRawTransaction = jest.fn().mockResolvedValue(rawTransaction);

let sendRawTransaction: any = 'id';
const mockSendRawTransaction = jest.fn().mockImplementation(async () => {
  if (typeof sendRawTransaction === 'string') {
    return sendRawTransaction;
  } else {
    throw sendRawTransaction;
  }
});

const mockGetRawTransactionVerbose = jest.fn().mockImplementation(async () => {
  return {
    blockTime: 21,
  };
});

const mockRescanChain = jest.fn().mockResolvedValue(undefined);

jest.mock('../../../lib/chain/ChainClient', () => {
  return jest.fn().mockImplementation(() => ({
    on: () => {},
    rescanChain: mockRescanChain,
    estimateFee: mockEstimateFee,
    getNetworkInfo: mockGetNetworkInfo,
    getBlockchainInfo: mockGetBlockchainInfo,
    getRawTransaction: mockGetRawTransaction,
    sendRawTransaction: mockSendRawTransaction,
    getRawTransactionVerbose: mockGetRawTransactionVerbose,
  }));
});

const mockedChainClient = <jest.Mock<ChainClient>>(<any>ChainClient);

const lndInfo = {
  pubkey: '321',
  blockHeight: 123,
  version: '0.7.1-beta commit=v0.7.1-beta',
  uris: ['321@127.0.0.1:9735', '321@hidden.onion:9735'],
  channels: {
    active: 3,
    inactive: 2,
    pending: 1,
  },
};
const mockGetInfo = jest.fn().mockResolvedValue(lndInfo);

const mockSendPayment = jest.fn().mockResolvedValue({
  paymentHash: '',
  paymentRoute: {},
  paymentPreimage: Buffer.alloc(0),
});

const channelBalance = {
  localBalance: 2,
  remoteBalance: 4,
};
let mockListChannelsResult: any[] = [];

const mockListChannels = jest.fn().mockImplementation(async () => {
  return mockListChannelsResult;
});

const decodedInvoice: any = {
  features: new Set<InvoiceFeature>(),
};
const mockDecodeInvoice = jest.fn().mockImplementation(async () => {
  return decodedInvoice;
});

const mockQueryRoutes = jest.fn().mockImplementation(async () => {
  return [
    {
      totalTimeLock: 80,
    },
  ];
});

const lndBalance = {
  confirmedBalance: 123321,
  unconfirmedBalance: 21,
};
const mockLndGetBalance = jest.fn().mockImplementation(async () => {
  return lndBalance;
});

jest.mock('../../../lib/lightning/LndClient', () => {
  return jest.fn().mockImplementation(() => ({
    on: () => {},
    serviceName: () => 'mockLnd',
    isConnected: () => true,
    getInfo: mockGetInfo,
    sendPayment: mockSendPayment,
    queryRoutes: mockQueryRoutes,
    getBalance: mockLndGetBalance,
    listChannels: mockListChannels,
    decodeInvoice: mockDecodeInvoice,
  }));
});

const mockedLndClient = <jest.Mock<LndClient>>(<any>LndClient);

jest.mock('../../../lib/db/repositories/ReverseRoutingHintRepository');

jest.mock('../../../lib/service/BalanceCheck', () => {
  return jest.fn().mockImplementation(() => ({
    checkBalance: jest.fn().mockImplementation(async () => {}),
  }));
});

jest.mock('../../../lib/rates/LockupTransactionTracker', () => {
  return jest.fn().mockImplementation(() => ({
    init: jest.fn(),
  }));
});

describe('Service', () => {
  const configPairs = [
    {
      base: 'BTC',
      quote: 'BTC',
      fee: 1,
      timeoutDelta: 10,
      minSwapAmount: 50000,
      maxSwapAmount: 100000000,
    },
    {
      base: 'LTC',
      quote: 'BTC',
      fee: 5,
      timeoutDelta: 400,
      minSwapAmount: 50000,
      maxSwapAmount: 100000000,
    },
    {
      base: 'ETH',
      quote: 'BTC',
      fee: 2,
      timeoutDelta: 180,
      minSwapAmount: 100000,
      maxSwapAmount: 10000000,
    },
  ] as PairConfig[];

  const currencies = new Map<string, Currency>([
    [
      'BTC',
      {
        symbol: 'BTC',
        type: CurrencyType.BitcoinLike,
        network: Networks.bitcoinRegtest,
        limits: {} as any,
        lndClient: mockedLndClient(),
        chainClient: mockedChainClient(),
      },
    ],
    [
      'L-BTC',
      {
        symbol: 'L-BTC',
        type: CurrencyType.Liquid,
        network: liquidNetworks.regtest,
        limits: {} as any,
        lndClient: mockedLndClient(),
        chainClient: mockedChainClient(),
      },
    ],
    [
      'LTC',
      {
        symbol: 'LTC',
        type: CurrencyType.BitcoinLike,
        network: Networks.litecoinRegtest,
        limits: {} as any,
        lndClient: mockedLndClient(),
        chainClient: mockedChainClient(),
      },
    ],
    [
      'ETH',
      {
        symbol: 'ETH',
        type: CurrencyType.Ether,
        limits: {} as any,
        provider: mockedProvider(),
      },
    ],
    [
      'USDT',
      {
        symbol: 'USDT',
        type: CurrencyType.ERC20,
        limits: {} as any,
        provider: mockedProvider(),
      },
    ],
  ]);

  const sidecar = {
    rescanMempool: jest.fn(),
    createWebHook: jest.fn().mockImplementation(async () => {}),
    decodeInvoiceOrOffer: jest
      .fn()
      .mockImplementation(async (invoice: string) => {
        const dec = bolt11.decode(invoice);
        const preimageHash = dec.tags.find(
          (tag) => tag.tagName === 'payment_hash',
        )!.data as string;

        return {
          type: InvoiceType.Bolt11,
          features: new Set<InvoiceFeature>(),
          paymentHash: getHexBuffer(preimageHash),
          amountMsat: satToMsat(dec.satoshis || 0),
          payee: getHexBuffer(dec.payeeNodeKey as string),
          expiryTimestamp: dec.timeExpireDate || dec.timestamp! + 3_600,
        };
      }),
  } as any as Sidecar;

  const service = new Service(
    Logger.disabledLogger,
    undefined,
    {
      rates: {
        interval: Number.MAX_SAFE_INTEGER,
      },
      swap: {},
      pairs: [],
      currencies: [],
    } as any as ConfigType,
    mockedWalletManager(),
    new NodeSwitch(Logger.disabledLogger),
    currencies,
    {} as any,
    sidecar,
  );

  // Inject a mocked SwapManager
  service.swapManager = mockedSwapManager();

  beforeEach(() => {
    jest.clearAllMocks();

    PairRepository.addPair = mockAddPair;
    PairRepository.getPairs = mockGetPairs;

    SwapRepository.getSwap = mockGetSwap;
    SwapRepository.addSwap = mockAddSwap;

    ChannelCreationRepository.getChannelCreation = mockGetChannelCreation;

    mockListChannelsResult = [
      {
        localBalance: channelBalance.localBalance / 2,
        remoteBalance: channelBalance.remoteBalance / 2,
      },
      {
        localBalance: channelBalance.localBalance / 2,
        remoteBalance: channelBalance.remoteBalance / 2,
      },
    ];
  });

  afterAll(() => {
    service['nodeInfo'].stopSchedule();
  });

  test('should not init if a currency of a pair cannot be found', async () => {
    await expect(
      service.init([
        {
          base: 'not',
          quote: 'BTC',
          fee: 0,
          timeoutDelta: 0,
          minSwapAmount: 1,
          maxSwapAmount: 2,
        },
      ]),
    ).rejects.toEqual(Errors.CURRENCY_NOT_FOUND('not'));
  });

  test('should init', async () => {
    mockListChannelsResult = [];
    await service.init(configPairs);

    expect(mockGetPairs).toHaveBeenCalledTimes(1);

    expect(mockAddPair).toHaveBeenCalledTimes(3);
    expect(mockAddPair).toHaveBeenCalledWith({
      ...configPairs[0],
      id: 'BTC/BTC',
      timeoutDelta: expect.anything(),
    });
    expect(mockAddPair).toHaveBeenCalledWith({
      ...configPairs[1],
      id: 'LTC/BTC',
      timeoutDelta: expect.anything(),
    });
    expect(mockAddPair).toHaveBeenCalledWith({
      ...configPairs[2],
      id: 'ETH/BTC',
      timeoutDelta: expect.anything(),
    });

    expect(mockInitFeeProvider).toHaveBeenCalledTimes(1);
    expect(mockInitFeeProvider).toHaveBeenCalledWith(configPairs);

    expect(mockInitRateProvider).toHaveBeenCalledTimes(1);
    expect(mockInitRateProvider).toHaveBeenCalledWith(configPairs);

    expect(service['lockupTransactionTracker'].init).toHaveBeenCalledTimes(1);
  });

  test.each`
    from     | to       | expected
    ${'LTC'} | ${'BTC'} | ${{ pairId: 'LTC/BTC', orderSide: 'sell' }}
    ${'BTC'} | ${'LTC'} | ${{ pairId: 'LTC/BTC', orderSide: 'buy' }}
  `(
    'should convert from/to to pairId and order side',
    ({ from, to, expected }) => {
      expect(service.convertToPairAndSide(from, to)).toEqual(expected);
    },
  );

  test('should throw when converting non existent from/to to pairId and order side', () => {
    const from = 'DOGE';
    const to = 'BTC';

    expect(() => service.convertToPairAndSide(from, to)).toThrow(
      Errors.PAIR_NOT_FOUND(getPairId({ base: from, quote: to })).message,
    );
  });

  test('should get info', async () => {
    const info = (await service.getInfo()).toObject();

    expect(mockGetInfo).toHaveBeenCalledTimes(3);
    expect(mockGetNetworkInfo).toHaveBeenCalledTimes(3);
    expect(mockGetBlockchainInfo).toHaveBeenCalledTimes(3);

    expect(info.version.startsWith(packageJson.version)).toBeTruthy();

    const [symbol, currency] = info.chainsMap[0] as [
      string,
      CurrencyInfo.AsObject,
    ];

    expect(symbol).toEqual('BTC');

    expect(currency.chain).toEqual({
      ...(await mockGetNetworkInfo()),
      ...(await mockGetBlockchainInfo()),
      error: '',
    });

    const lndInfo = await mockGetInfo();

    expect(currency.lightningMap.length).toEqual(1);
    expect(currency.lightningMap[0]).toEqual([
      'mockLnd',
      {
        error: '',
        version: lndInfo.version,
        blockHeight: lndInfo.blockHeight,

        channels: {
          active: lndInfo.channels.active,
          inactive: lndInfo.channels.inactive,
          pending: lndInfo.channels.pending,
        },
      },
    ]);
  });

  describe('listSwaps', () => {
    SwapRepository.getSwaps = jest
      .fn()
      .mockResolvedValue([{ id: 'submarine' }]);

    ReverseSwapRepository.getReverseSwaps = jest
      .fn()
      .mockResolvedValue([{ id: 'reverse' }]);

    ChainSwapRepository.getChainSwaps = jest
      .fn()
      .mockResolvedValue([{ id: 'chain' }]);

    afterEach(() => {
      jest.clearAllMocks();
    });

    test('should list swaps', async () => {
      await expect(service.listSwaps()).resolves.toEqual({
        chain: ['chain'],
        reverse: ['reverse'],
        submarine: ['submarine'],
      });

      expect(SwapRepository.getSwaps).toHaveBeenCalledTimes(1);
      expect(SwapRepository.getSwaps).toHaveBeenCalledWith(
        {},
        [['createdAt', 'DESC']],
        undefined,
      );
      expect(ReverseSwapRepository.getReverseSwaps).toHaveBeenCalledTimes(1);
      expect(ReverseSwapRepository.getReverseSwaps).toHaveBeenCalledWith(
        {},
        [['createdAt', 'DESC']],
        undefined,
      );
      expect(ChainSwapRepository.getChainSwaps).toHaveBeenCalledTimes(1);
      expect(ChainSwapRepository.getChainSwaps).toHaveBeenCalledWith(
        {},
        [['createdAt', 'DESC']],
        undefined,
      );
    });

    test('should list swaps with status filter', async () => {
      const status = 'swap.created';
      await service.listSwaps(status);

      expect(SwapRepository.getSwaps).toHaveBeenCalledTimes(1);
      expect(SwapRepository.getSwaps).toHaveBeenCalledWith(
        {
          status,
        },
        [['createdAt', 'DESC']],
        undefined,
      );
      expect(ReverseSwapRepository.getReverseSwaps).toHaveBeenCalledTimes(1);
      expect(ReverseSwapRepository.getReverseSwaps).toHaveBeenCalledWith(
        {
          status,
        },
        [['createdAt', 'DESC']],
        undefined,
      );
      expect(ChainSwapRepository.getChainSwaps).toHaveBeenCalledTimes(1);
      expect(ChainSwapRepository.getChainSwaps).toHaveBeenCalledWith(
        {
          status,
        },
        [['createdAt', 'DESC']],
        undefined,
      );
    });

    test('should list swaps with limit', async () => {
      const limit = 123;
      await service.listSwaps(undefined, limit);

      expect(SwapRepository.getSwaps).toHaveBeenCalledTimes(1);
      expect(SwapRepository.getSwaps).toHaveBeenCalledWith(
        {},
        [['createdAt', 'DESC']],
        limit,
      );
      expect(ReverseSwapRepository.getReverseSwaps).toHaveBeenCalledTimes(1);
      expect(ReverseSwapRepository.getReverseSwaps).toHaveBeenCalledWith(
        {},
        [['createdAt', 'DESC']],
        limit,
      );
      expect(ChainSwapRepository.getChainSwaps).toHaveBeenCalledTimes(1);
      expect(ChainSwapRepository.getChainSwaps).toHaveBeenCalledWith(
        {},
        [['createdAt', 'DESC']],
        limit,
      );
    });
  });

  describe('rescan', () => {
    test('should rescan currencies with chain client', async () => {
      const startHeight = 21;

      await expect(service.rescan('BTC', startHeight)).resolves.toEqual(123);
      expect(mockRescanChain).toHaveBeenCalledTimes(1);
      expect(mockRescanChain).toHaveBeenCalledWith(startHeight);
    });

    test('should rescan currencies with chain client including mempool', async () => {
      const startHeight = 22;

      await expect(service.rescan('BTC', startHeight, true)).resolves.toEqual(
        123,
      );

      expect(mockRescanChain).toHaveBeenCalledTimes(1);
      expect(mockRescanChain).toHaveBeenCalledWith(startHeight);
      expect(sidecar.rescanMempool).toHaveBeenCalledTimes(1);
      expect(sidecar.rescanMempool).toHaveBeenCalledWith(['BTC']);
    });

    test('should rescan currencies with provider', async () => {
      const startHeight = 21;

      await expect(service.rescan('ETH', startHeight)).resolves.toEqual(100);
      expect(mockRescan).toHaveBeenCalledTimes(1);
      expect(mockRescan).toHaveBeenCalledWith(startHeight);
    });

    test('should throw when rescanning currency that does not exist', async () => {
      const symbol = 'no';
      await expect(service.rescan(symbol, 123)).rejects.toEqual(
        Errors.CURRENCY_NOT_FOUND(symbol),
      );
    });
  });

  describe('calculateTransactionFee', () => {
    afterAll(() => {
      currencies.get('BTC')!.chainClient!.getRawTransaction =
        mockGetRawTransaction;
    });

    test('should calculate transaction fee on Bitcoin like chains', async () => {
      currencies.get('BTC')!.chainClient!.getRawTransaction = jest
        .fn()
        .mockImplementation(async (txId: string) => {
          switch (txId) {
            case '02b1eda582decb797b19d8968f23f43de04d9cd343e83f7345a28ed91ceb7bb6':
              return '020000000001013d0825efe5490457c1764a35f8476b43dfe33dc06c85833a3769934ea757fd500000000000fdffffff02b6266bee00000000225120350afac40171f06e502aeddabd67a60394ad316e01d32b3bc37d90add0adc02c00ca9a3b00000000225120f7cb0dfa30fd70a692b7c718d00d389d1214cc1f376c96484f1bed8e2efe37f102473044022048ab706797cb6ff588e62372cc5f2ff1682d3ce677e1a01a9f3cc57d89a293a202206b2dd5a053c8673c5da69037ed972cb948bec11f13ee5005ba1ed7b940ac84cc012103c04f952b30a235f53fcf1389e31759bf233eee1c78dd23e2fa0a7a2d78434919d0000000';

            case '50fd57a74e9369373a83856cc03de3df436b47f8354a76c1570449e5ef25083d':
              return '020000000001010000000000000000000000000000000000000000000000000000000000000000ffffffff03016c00ffffffff0200f2052a01000000160014c40b1751e35328869ad13183f8042b8055395b0b0000000000000000266a24aa21a9ede2f61c3f71d1defd3fa999dfa36953755c690689799962b48bebd836974e8cf90120000000000000000000000000000000000000000000000000000000000000000000000000';

            default:
              throw 'no such tx';
          }
        });

      await expect(
        service.calculateTransactionFee(
          'BTC',
          '02b1eda582decb797b19d8968f23f43de04d9cd343e83f7345a28ed91ceb7bb6',
        ),
      ).resolves.toEqual({
        absolute: 330,
        satPerVbyte: 2,
      });
    });

    test.each`
      discountCt | satPerVbyte
      ${true}    | ${2}
      ${false}   | ${0.2149420695165801}
    `(
      'should calculate transaction fee on Liquid with Discount CT: $discountCt',
      async ({ discountCt, satPerVbyte }) => {
        (
          service['walletManager'].wallets.get('L-BTC')! as any
        ).supportsDiscountCT = discountCt;

        currencies.get('L-BTC')!.chainClient!.getRawTransaction = jest
          .fn()
          .mockImplementation(async (txId: string) => {
            switch (txId) {
              case 'b9df6f0e4fb9f2014bf90f4a00e8e14952a2a699681fff89666b212d3e5d7c05':
                return '020000000101b3cccca88d67cc0222056e3f11770fb6f07e2b3123966bff3d2eb99065bb79e10000000000fdffffff030bd18473373c679acebaa303c334260a51f5903ee8b6481ae1664e3315cc481e3c0846753b9f94869a06e65c9d8a817089ba02bcfbd561707e109cd9274cfa6a410302fbab377568a8e62f9283ff7349ed19cc6a88cead8f82fd428d54848d43a7fde2160014e6931020f77c2375a761bdbc8db677ee06b0b6280a24f8a4e2014d8099dd908f4ce4a12c92a0528a3ecd03b82c78a8093b15f78c420889ef6d9d827f4fdebf75027151b9185a180d73cb5b39b5d092556d868b78191202cb60a5ba1ec170125b0e2f987eca15fcbc977cbb1880c7b1a470375dd59ef18c2251209a4408eeabe9b5ac9c82245199fb2ff37ab051008da13be7edb21db0eff114fe0125b251070e29ca19043cf33ccd7324e2ddab03ecc4ae0b5e77c4fc0e5cf6c95a01000000000000021a00007f0000000000024730440220730255d4e2a9ec2629c68c95c0d2fd0b80e911e4d89c97bfb57d0ab9c0c9c8ee0220010b51dfd4bf139aeb07a5f628942f925e0dc26f6a57b29d61bc72e669f9a8ea012103ccaa29ee6b9a75b4157154e024e8c28703d58a1e4e319474f07073c1611e205700430100013b4b250c06fb5f9d2bb2f6aa741edf381293f82784de797c7229f6c848521c9f86ef56f52b82be2462fd4228d2884bc7130d32eceb4d15eaf8bad5d541bd754cfd4e10603300000000000000018e8d3101b06677da306a4a1197edc9d44e52d69b7f4381c13bae04a44351562b5b940d21b946853e02b0af3ad4eaa2aa4db47afd72d73ffe0008ff5b80dd514e20499b564fb6b30004b74e96c007045245b20ff01b27ef9261b06fb6e82da5ce9e36e8bb252177227321e85a98aa807a77ff16af3b5c083e9305cde689deced9350a3f4ef473f0bfa2537b4a5cdc39db572e20187c9a4e80b85600b03c5eff3f1896fdb2c4045ad8da31d6eb8dc6f5877b038490a125144ee9e66a07466aebd97fefb4800f5249e0aa51bffd8e62f96c5a6a0c00bed2d0837d2aa261bc8644f40f30e747bf2575c6143e6c3121845a4658c79632c72a24c6cc227e90f0de3f4f4be98947067d281699eb18bff0fe6b5aab9f3e1d46917674d84dd555e4278a522158b06c23341170be449872dbc1887c7d5619edb6b6d3e32b08b45655ca18b8b6d133fa952b31e5f92eb03fc18d613fca3f7a4db7852f7ce820e06af5e2b2920d60d7670476527c2f46f4834d70e36dfd520eddb153a08284dcf3fd974d962eb39b3848d888eb12def69256899b66fb3f69c0ba9fc5602458c1966b47736e14a1dc2be8800bd217bdd4715b5df60cd1c16de7afcc426daae17f402ac2be78b102b0f9914f07ad6d4fd21e6aff2963c470b375b7b112115499836f87d31428218bfee8658b86377d3f5cbaca619be4f62637fb1fe45b80d75f56fb491264196a169df25f98a3357c7826e4e9fcc8cf6ae05e6aaa6ba81c9ddea6216b4631c35e59a200fb74f0ab9b440fd3c115b99d178388316d3e8c8af418b155685c1499dfe8ca36b69a06d775eb3cd7f5e380255317653512cbb15fcaebb5426567b3ca53e0ce55236b52b9600b0a049d09bbd049e604440176d9e6986581a4533411935b2d7b9f986278b9dc7121173115c36d14774e4ae4e2af14b9daee4da6f4daf9b55945cf7d554cb5ee0040a681d76c2c18802d4de2195c9ef8bf38af8cb1feac3a9cd0de21b4b3f7a996cad68994c8b62441b2a58430cb1f0d6952f8880d6fb81cb0436c37c5b0d2cd92e4a8be52944c808c9cb0de246d2372dbf4f5df3abc76db09d5d3b663a0a99be7eb7adcd8af3fb0bb3b675bfb3ad92e0456a4f2e01f5f92d42a1d8bebf992f4af327700258dbad5e4f238c090c474c6ceb1c219791f5f2584597ad3649ae4aee9cc47f4fb017ee3cb4579f68c5ef37de8ff853e16486c952fe7231cd5c6c6caf145914c07dabcad88579d0732fa8c18c0da2a00f3a650c4fc89ea05f41d924795731c82d31a405d1fd88e03cc1c605cfbebe72d6828f9c9832737c9daa08791a1acd1575598a69e9aab5873b860de989691f2a74ccca34728f174aea89756907a0389ccf1638f5c47fc54a8cc71afddeddffcce57baaa39a2f0a7e0c6e1908e556e9a901e1b3890e88870203ce6327a2da3e38cd92a21acc48a74c43bceaa1b8ef1badd763e60707a8c1dd4902621ab648bea9e2175bc814adce39e6dca9bd0f7016c6a6c5ecbbc372f23e29b7402bf6a4b28433bf77c3ed4246ebe4569ae5a3a2c19acdcbea147bdd7147f036b08ca77abae494f506c74d278208cc977e9496421ce5a207878bed9d527d64097e77bce333e30f6d37375fc2e814fdbb1f4a31c3fc5d149a72b739eae208bcdc77d2114cfe1bca4c928e7f98e201d6b108f0634875a976209ed4e907a7d01eea501f877aa5abaa2efcd09b8edac6adce8f5500d8a64ccd45daef9eb74efcd1b0c7637e826bdc1385a41a615877ef73f5a1592bbe13188a73f5feda4977e0e230c73f43e9a129a546545ae4ee20323aeddb79aca912c731af6da4d20d139189430afd6e95b7291ee4081fa48b6f4b456a1781c368a339049139cdac0a38527ae0fa5743e96d98d5b3e27754436b5c4cc55eee294a339db476d0ad1d55c7220557156f9c4c90b2f49aad700b065d0d05dcf7bbcb56e0d3fde2eb6df2340982abdc482e66fbb4dc730b6ebbf3ad6112c1410ce45ef17b383e4ffe9b05327b3b67b837e6ea392747050aba0204dcde975a6bc90ff3c98fa4e6786430a119d7ca2378be793093d1162887b49d53caf6f66f2fe14df8c44957e688f4c1303318f808302ec2eca82dab4ae5f1b85cbf74775b41c8d00bcdc99d1c201c975fe856de856bc8bca65622e4277986fed3405d4c076c442ab79d7e30f9240dd1a9a1cc2334f04fb5c114461299e885b97fca035cffcad8acc23a38a32c8bb327dcee99c3fc0171820a479345422652f4cf0f936510d8bbe4ae6cd293680544317592d5086dfb46141ba1551fc3c1561eb760c1905f9ec61115bb9034f7d8b716b453f5c8e493a22be98bd7b1a8e89a74872ddfa6b5ff850c8d4418297bea7e85b5e265cf99ad29908e17d4fbcb56e34baa1b5ca90585f895f393e8f85cbce9ca02c2d76c9430505759a4f2850dc799ac7990957cd4e63e77acaea749bf91558f8afeca4d438a37a26a32762980095331661fbd26666d53df2042c5f51fca0bfa268ef8924def7cbb4ec822befccdb38af5de94e66519b0b413f00a56b346b7414d06a4dc9ee6d348169fec24fc2a12d5b2a8a528b07d9a6862058bd2dc7b9ec29afe73e1322be3decd515f71aee8925aee6038e76315d238310962952d2476cae0658b3e0b0666522c7a141e58800e7a4942f594963834ec4fbd33ff2a5c62731c9ecf4f42d1e131592b42a43e6ba8c5ca6622ad379d63fc8132dad44e453d04f2c593cebac7b0e38f57f5f141490cbf5b1cea4f372af3f5d77bdb67b71fd8bcd824b607c2377cf0dcc9dbbbdff1d4e042d34e1f539a488101c38fd07edba37d4bf123863f24dc45b5fccf4c9b2d6e8b618a272bc8f45a58a732e0d086fc30eeeda473fa271f134cee5732f13ea204bc0bdb2fdd6644c638c9ffa9449594d236f1a53a973b26d2658c86978e7d929b7691b3ea6e925acb8dc3b0737de22f3ab11def3d4d6205566d94eb7c2b9930b031d985c4d1e360f5096c5d3b3fe858506fb5ed7b5a7c25e30f524fdc49365cd418c78739b9976abe4f63f14d169bfe79ef895dd265f365302a3f641f5f27166338c1f6687ce299d6e5c2e2335ada47f2b3bbe09d25b7a2f8e6f1226ef227869e1d96010e642a1fef1d68b4087bf96a663552988fec8681df8818d7b8322add757ba47177d13bbfec642c224bbb04e0cde818b0d95a054feda59ae05ba4395747cec3963f3db07eb3eb9ce8bd1555e8b422d2090c8ef87b64518467b2d26441b4d3b7411de6baef1e2e0dfed15e763178e433ea3de3e510886cfb8a29f5409fad52a97fa811c1b6dd1b1ef76e8deadb1c6e767cb1c1e16a642ec1049ff0fddd339094f47b1ae361b9771c5febe5f08dde96a707002fb986794a76d476dda5999a67ed92c354cf08e28b83f04da06f9f275f991f55b52217117775f277fba0c0a32ba25f949695ce26a1175ccf5ab68368c4a6910a2a27ac52f2724bef86c4845cd9eedff5162b0cae97d8a9ca251224d1c586bde6bf16466b50f0dea1295ca3828514211fefdc80c895365749e12cb1893b5bba9ef2359707d7a0de62ae7f9618698fbaf9af690cf3e5b2e3b9b9aaf0484a723f5bf12c5821a0936998c9be727053a77529cdc27d0eff8edad9e60dc36506a78cb047fb1d829f3da182660df1e1bd0756e63d464e67f58879050738a066c5ab9c218beae5733b2c40f8533627a0c3138f8496ce4c0431e40e29b7103e9aeb53da23db89d3305bf22c172fba3c9a014f2671a843606d712a2e3c5295d5c310d0c3abe260d5a2b12944691a8fcd8ccd07e0511a6d1b538f63eff6639c177654286273b9befa890b024bdefa2a9db897e30fd92ee71149968ec29f958d504996e431f9507fb8948969ca1b6738f878d483fcb52c2c1b40cae7ebe7b70a16c60ab576f88b89cd0318de647255776f729b6002ba72b377b8a5f6e5efe8bf1b3e0a85f41fa466c94c2a0e4a33ef1e798fcbbd82e2dbb2ed8bc7d87412a83ed09ced6bbb8e9abb75dd92c6e4b44ff78cae5d977cad7548e249ecdfa426169da611f7493ef35e48e457d29c90cd7de25316bc6e80c0be9fa26eb71f6d385ce8202d4a06e69bdead4543043c8d7f042a3c62951e81b9de659db0030b2286be7f940567f69fe8b5784ae8c87b3f6cf3c6f1eb30be22ea43e21a6b24615843c47fd786d38ceffb48648f15407531cc507ae5a1623a7c04245332ca5709691e05fd429622bde27f6551eea0ab323828f0d0a9a3c105cd895929b622194efb11993bd22492a97d577225cb722853fe0c5cf4aab57fbf579d68f4799a08722e0933b33fd81ca7e686911afcecdb7a1ded74e4dcfb089d2e71e317602bb92ced6de5f6234fb2fcf0a2bd60cf9694464fe6703d88e264f4f51b45a27b770bd8fd754c8f9bf5e17db72daa50eaf264d61a81b9ba307e8d58710346c23d61809228c97e8cc81b3693c01d81159bcd8011c7da34c51278fe9c8f594aecf0b89f1d5d88a600af0289b4a01ea5b9a502f2a4d63d1ae9c1258fc752fbc1a829a75c9b459e37ba95dbe8a1d2a847165b5b8b08a2e146fdb3f03938a30d9875431423edac9d54d8edc000c2b5d167e2b09edc14d46be8917924c3688eaa2191c24744ea38641419e2b3b3e6f69a7b0af565ef2188e430d95655a86a66ccf63e7454955f9883d835aeb69d6d09eb54c8a028419da075bbfcd2a78e99f99af116661583568abf6a52d1d6803a1d541ca98e76e17f69d8cf1e6e25aa2d35a2a6165a2465479a77aa78d7e2760cb1ff8678d1737c4aea15943cf6369a71e26c93838a4c149bb2de75a5eb814fe9c5d43074cbb052f5ca75658dcf8dca5576229c0ed114bc191d9642713a304774170ddb18ea4d877abd521ff51b4ba5a2477e7b30f4aef4423e8784b94e1f686db6f28f28e85e0f74a8455752aeb7372571269ba7ef48071759fe920a28427858266ea3fdd52b43b3995161c55aac31685979b0217fb9f7e13b8f59f82725a6a139f8a0b637bab420d22debb9e0f2c95193ee2f12e176010bad378f936d04b46270835c53b85636b64a3271d216ab65062641ea72c5ccd00a1dba08fb21ce2e6b4eb5f82a4fcc0a56f94147fb07320ae15b1af5c217ee9d008ccbd1098c97c16b920d544258bf8d305df4fbd5d5b7fa2d62bbb2282234df4dbf8865496d67d66a9d07fd11fe1701fc69f4d56abce29ec37da7a758a8beca20812919fa888e065ff6d1276475d5da41455b31b3417e561e9474d3055c4a99b386233ae476493f87bc463ff8c6a72e2fa1d84072832bd059023c3c8184a75a88a14f495cbcdae08d4ead659a9a6d3be57f2f04e825ce232ac0daf5e4570a8c2dcd207b9e4b55d0fa715af93e387f6dab2a608d2f0b2ea2c981b5b6fd66cc2df8725ed2b0bc517e9b552e6cfce4b01ed79792abd367a5520039de460e3e5caaba1791744b534eedd18cf72de74918f7d28f64632908fc75266fa2e4dbcce0a5a916830c5b0066e68f220c9ff6fc6271f94fe141256bb800faa61c34ceba38c81c0dfea43729ea3ca873e70ec7e3e94a2cdf36ea256f3bc22ad58a51b2fa46ecfbdac98b36b7f51f06f8ca8bc350616a82312a5fd44a34637a0981f2b8987c8134c30511ee4f6927afc5e12dc47f6ac3ff6bc7b67e76a9c3e9ead5d89fd6a8282aa2bcf1bdb7ab00defa60d9479ddcdf6e574165f465238c9f371ecd61ecb7110fd33a5356023d3d4e4ceb6fc088b9f61e9656db94013c25f5eb426df1da93de8a7b271011db8033d59724761bf922ea6ca0228b15a9a386037588b309240d4f03b485153429c0c64ea910d4b63055a4957330c2c29c7f4809f2a0a6bf47802a6038e5a9e8b9dac1f456a5314bc909f9e73112e03cea3255d6595e274430100014ac8de0a6f349d475a983ca629dca62348825612ceeb59a422552fde434b61cf1847b81e3548d7dec0f953351897ae7f471be05b85b9d0e7a8f68942c7e291d3fd4e106033000000000000000100560a012b929d258f28cac26abb3189a1849f520d695486829fb0b5b6e07b31f2ad6599a649827ea2c072402492ae61aa556a7cd02eb175471b95c24b2bf730d2cd5065f5fcb0dfd5682c51bffa18ec664003f635747a00f7f6f82b07a31a81bd7aedc836269cef9eded3b1b448b9d35d44fd2b47dc610472dc419843a87b501223f60c1e76fb60ca48545f18283299dd1599c05eddca8c6ebcc75c1cccaec5ebfdab770d4ae1b3d11333b9ee3a5317e4b795d7a52359a04dd76eb712a6586506b97c4b4b587ddd6176f76617a1a677ce7c4607d1dd286df7a0535b481f83496c37b3a2d89a32d6ac1237616ef7ae0b593acacada039642fb762f3f96cce5df78c7095f2f3af24c03feefaa208cf1c9b3cd9db6b33e6a1566f8077fe9a7e5eeae9047defe5312102c05060c8d902b891902c5f35624a5254086469960c3d041c5000d6091c14829853f4ef7f4b66f47af30efe207e2787f0d6ea777ad6efd04b0610d62552b17f96f063fc23a687515b4b95ffacce0b3f4d7afe3613ce8c2484bc406414e4d8235022b1fa5fd2beb5348cca09dffc8993d7f2be8926bce966950b9b35b531a030496805019d30db84e49af3564abf9f594a2b6d2196145b3287bb9e259cc5fa167a079c30275aa65bfccc3d254ff754fde37ad3ca8492eff5198e791dac725ba06110c7d2b8f6b429f4138f658d0e6741e5b25ad9a3232e35b5ad1eb74b49bad40546aea86b8abfc8424059c8a98c26d3a17ccb1d823473389f0470a5275bd8832849662e512c09e20fe742b5de26bd50c67d093a0df3c3b76e6a46645f22908b9e9f1bd02c8f89bb88c56a521bcf29c4f08bd86b28b93be8e3d4cdb6f1e0e896c87245d9380db68471024799104802745e8f1bf9164f503571985c19247232897873c343c8a2d1a1d50ab67d29f977480086d56b616d4abdef1979eb54a476a48250687f14d9eb05e48c9ed7372696c8098f131dc8210a2f269a73bf44094c06ed8eba33e2d79ed4c9fb9f74b0b2f72b49a2eae9fffb0fd915ea387fe81643456d6b02cc0b0801749c814a40738c065e40b8b495748bb8e36cd163fc7dcadce1fa138e6515819429b2a80bde68a830a6344fcf164ed081bf60f90e5ad0ed9b4826d2f3f2279a5712d310953a7018c147abe5d654c05271f74706154a8c83c2ba864a7a2e3a304fa8a2d8194353686560ea2b3646ee9a42d8ba7a40f5a493d0854c648b96834df11c89772f0eea516a3caef256a9c92dbe40c264a31967b8faf225716bd8684f79b5f2454332b075493eb7c7143d26cc465c18c136bfe45363b5c1b1e52f1e433ff8f7f93f64ffdb30f7f9c2df6617eebf0f883f393073be1075b6d32791961f6cbfe01972e9f19a537875498c4d3783ba36762f0153e49573d4818eb08410832ed1710340e4e88f20806e67dc5bbdf9b16bcf590eb969ad3035ea34eb0b8ee552cb0f9be6c511b1d5865832e0e37cbb160237fea31e61c65cc11569f54a1f2442e72bad665568c380401734b28b50590dc864eebae3069f6602e87c51386d316cae2fd46967bc4f562a215b97b4a77a02f299825dc37fe9e26175ff2957ae345692763b435865da249873c7e6016727c86a7a7c645a1eeb1564eaccaf27d295eaf4b2db187a55c82916f815919854f0decb72ed1dbbc6ecba1440af571aa0a32b6c53d87d33c5a65ea9fcc6f4058a5c5838f5cd236df462c30b2e03d6dfb9142b1e0c479c7e6088e812d187696c6e29dd7ebc9b33063743316ac125e9322215b3df994a9368c81ac13c599afc9d5794cb4bfa2828463d978ebbc46643f50f4201d852acf2ae2c6461659bc97d25ad393a61d8b41e2f11a92b9f99d05a536165ef63f2efef14256ad7ca73cd1ed94d2d268ced1128fd2fb4a21740bad0ac2b36e597e71f9d715f052103459d2c29966dcef655849f373ebbc1a0c46aa38fe4a31175fa0ea961d4938c8a3f68db9539764b07b70f94c4854045dd4d4f4c92fa03cb5f01fb48bee970393ff2bbdfcd80064254f853594e2dce117b6cbcf05bbee716c185c62859e736eaeb06b73b3bfb8cc5b147e5787a88ed45b897f4c8a884e2f3246e1f6125ecd51d8792f3f8004acf171f51ec18fb0546089ef6637b27010e8b44f7a4c3c87ffe6a8bd5f4b7d5275691ed9c937379748654759d1d32532fe1f8e667b653c969a152a8feb47b60c39d896d1fa1e35a003db41f1a24e546c2d8736d34de2e04c38c83894ef7152af46fe537ca683a0c5f76338590c07b352e915c22c7098c8c9dbd8a6111eb32a32cb8dad79cc01515ab4d45381eff76e0d3b42215ece371ed5d544cb91efc45ac2552678b221020b1ad5a803083de5355ac92b6d5e13471b7a480b7a098c331dcf8b8dc34032a90bf7cdebd2790dc4f8beca94814a603cddac4028dcf8a5b016d22f1e7c31fc27a5c7a0d38584907b756b1cfda863cdfc667ce1b290739e3cd6028ddd80020c9889f5502e55370fcd5e97573320b8f00caf5316ec42f66f5b3d5e8f5bee6922249276f581b4c43a3f1e3545e11271bd2033a105a49c32acc71ff136d3710a7799b4bec701a713069e91f90762a452b5687bfecdb9c6101cc734f15044ca47d71689bd634affc5b151e72ec3e440f6d0c333d2502debba8903ece97578f8a7f37d8d1082c096054a41d578fb219911d2fdfc09a210c2d1ead7ed5e8357c13fd6d8788a68fe7a64e2cbd25efe3eefef8272e25e651a44417876eadf622c2ee96f19bb1a4cd2246582e0c8eba299a33e8d4633afd0a1b441b217d22cfa090c67d68212160f3900d8e4e31d5c1fbf608f327435ebb3aa08891c72c98e720143d0c56c66a9b1b60c7128ee0ebdfd219b40956aa057bcd15066c01f342fad0650c91b2682ee23fc17b8591083656a4491d8d539ec8ac36c51a0a2f94fb4be658729043fb493d6579951517e24ad4c2a2a034b10ebaa409dc9559884dd5b6803ae6affa6f965776dae70fc8cc0e1e68c82623c240a0071659222eec17532d307804ff1c8f68c94d9b127803f5188ed64ce9d67e44cfeecdda5d8a415dab5d3041a30ab373915fe8f00ee9f006273071175fea0c57547301ed95cbf0dfe9f57dd80341aa23ac5f73044023559259ec5f16c670022f288f3ab0ea22bb641c0c50c48bd5922b0d3bc912c2e3c1fe8cf53e746421be1c4d739293d22238a0492a03946ff9ae2780cead5ed966e708e5dd79c2a73dac179217e89bca730f8261d8b2d4b659e7b988ef6bef69404869034c7308dade0eba7dd2eaf35e08394de169782f1c9b41be531cb6234fd095819dedc57163e452742f65422d01b7b4eb3b47bb8ec4e372d5cc1cefc63a860b705ac43654e117d000a664c106ad39574c0c31e47027cde3f74a948aea5680fc4d4ac7a6e83050a3ed92fb8c32415d1eb55829f415e3c1d403a6b123bf356e694ab8dd1cab8e0605b9fb16fbdcb2a17f1c6704898d7db28df381a9758af357856aa1472a7498e19e6d71560c246660ed8568c6e8634d80dcc60a56cfa3b8aee1e336d77d4eed7b1f18d4bce0ba12d44421ddff3236d4a7b7a3159adbdd2cf5c9cdd5a30db286dc872aac986e36f7f7f50103aa1a91a342d1f31a2e027fb6597c68d6d65fcce85f6f210ef43612f9a7b5f471a5aa2ee2be48f73767cf5fc8a60bb2d6d6b02d42e14ac3c639036484b9b92030d20d5fc0813df6a1f03cef6a4843822313abefbdd026c31c8dfd5a9db6d45936887f8623c217d15ce63cf15554cc15ad29033531028580d7f1c04d6de0d70d68bb775a2edf0b3f27831670ac93fdaee71482ed8d9d41aa8e67adbd589d3e9cbb2f2cc0ab43be21c107c26d9d8d69ea8ad8981501a08ece611dce1d837af78dc48e22245479527ea75d67df12b7cc03ff3a9c618f7c64edd3b3bccad8da79b736ca6370901547696dec2383bc8ccf411832fdea2f50cebc6dd46e7e4ed4d9d7a8cbe06e52323a5beb9a370916041454b8e0411088e7bca09c6917b68fd4b6cc9b24828313a7e7775f4822f3a0b4374a1d69110fc01804b1dbe298bd535487e69ae2ba422333b03763019ff2ad2b9909d2909b8410599c9034de5264bdc590102f9e6f4d21cad45cca637702bbdc59dc1d1a7e8972c4dd54959b27df7657a1c41e76f0bf6633bb023a7b8a9bd540d8a190c73c457f7534d8445f13b02861ae6b34318b79ee7bbcbafda3ef60e878a7c0b830f0a5585ac6b5765b06c315958ecf710a5c5949804813ab1ff01a35626bb75f3f1b008cb31aa39946a33ab03b2a9fe69dec450f60662af94c8f5d204a65880a4ecbeb330d0b1c860a34053357c5a778158c36e3d9c958b2187aba41b39bf00ec7eea3fdb6bc113af1591463a92bc5d3359fdbfe1c6913756abac40e7dc88075698a8de65bee5c90481eea8748709c005f5b9b464c9653e086e4f89f556b87755d023c0eb4f95494665aca37733f3acd5a815fa2b884e455c783b56354839e66df1e833928a2d23ff94db0dde93ec3af4b2e9a7d9fdd3690a85519a845178a1d67bb642ff1627c245c3f440e57c30b629e82692f020d1e92a102cc0f2a7afac6fee9b892d4f10266107443a6e987dc593609ee9991a31ef5c2e0f46916f1b11056a6cc7feaf88cd20268b80065e3fe10203ea84450ead3863f64efde9bfe849cf9e99579788ed18d6b77bedfdd46c447fcdd9c2432c55505e7eff71c9af1a6e44d0fd0b3092c62810748051b614714ef236150b80e796b15fd7b1c5f2276a68215379013e282e90b05d77593e641357cfbc24bc1922bb529cc93f6c0259bad92b67aa432309392d15971ef949ecbdcad4fbdca2d8e22f49daf0504f4a4cafc23d508dbb976e65c8a9280deef63194f46d26d3d8538c6516cd872a5ab92807254f5a1abfd31cd17420c6540437a0ba4daf9cddc7f09c9e655fecd933ab7e59c7d593ceba47ae640f38dd25dd4332531c259e0b9860a5cabb6f27fe661a00e839dcf9cf2c137e52106fe6038dbb140e665c7335d936db12fb87cf3f68975265ed530b11df71ac52f855e77cf21687fd50f8bf61daea86590f0d6e7aaf5411d1bf49b9a197b09f5bf2fdc658ee96d3448b21bd8f5093e5b499764fc3dadfdfcb10f8bf906ef5af9ee94ef5adcaf293eb948b1a12d93f2a1f7258cd9a93422cd343d6413e00274275f67979abfad7d84645153db7891442fa4db5dfbc915e6527f07620a1710191bf18281b10adb31df6ceae9fb5fbdd284dbfa87ae8f092af8a8ac004efec0b772d9109fee53108d26f38227b61c80789f02d3688ef6d63fc284a7ef1ca79a43fb7cda503762f4aa26346805884c2b29d47da1e22eb0cddfc8aa7deb8bc31b04227ca9ad60446ce1c63b95950a75a6ba8f5f4f152a00fa6b40e270ab6a994bf81e4ce6361340f18fe748fe0b077e4c3f8a1342a570a7ca3da65d24aa524b28ba3500b4172e592639c1522e6a31af09d4df2fbb0e8be4c71198e0e870597f97a06a0eb8cc6726675e9e43526e59eb59a6ab2f2daf91fd121fbad8c3fd42af57a68ce5bf25854f3b27c0d00a4ccb1a0c5dd1b8aad81f4cd6ce0db889efea3ae63e0b93cca348fc153c33d4b0cc61dc504223ee99d68d8ba3114f57d0a4059b3445fbe152f820c771a07ee45f05187b35c2b13bf6b85a97091de1a927e43b150e0054c4e87bd3c825f1d087b118fc35cfbe4836ad0dde17af2dfe579081278473ead65374f3e6057613d8343024e601cabf944232acdd89551bde1016649c32558f10eb0458a91dda4702e2f0d3c8367bed612e908311b66003ee4921e83a53af8c898252c2463a0d971d846a0d3de8e5723823c6bad2d6e163cdc830c03a9e1637e52c51f53d8d9c5e13a23e875b359f91b4e94670000';

              default:
                throw 'no such tx';
            }
          });

        await expect(
          service.calculateTransactionFee(
            'L-BTC',
            'b9df6f0e4fb9f2014bf90f4a00e8e14952a2a699681fff89666b212d3e5d7c05',
          ),
        ).resolves.toEqual({
          satPerVbyte,
          absolute: 538,
        });
      },
    );

    test('should calculate fee on EVM chains', async () => {
      currencies.get('ETH')!.provider!.getTransactionReceipt = jest
        .fn()
        .mockResolvedValue({
          gasUsed: 21_000n,
          gasPrice: 1_000_018_550n,
        });

      const txHash =
        '0x0c348a6c04f38483806c8f1d4a72d83cd21c9d98d3db3edcd15a36c91b19f67c';
      await expect(
        service.calculateTransactionFee('ETH', txHash),
      ).resolves.toEqual({
        absolute: 2_100,
        gwei: 1.00001855,
      });
    });

    test('should thrown when calculating fee on EVM chains if receipt cannot be fetched', async () => {
      currencies.get('ETH')!.provider!.getTransactionReceipt = jest
        .fn()
        .mockResolvedValue(null);

      const txHash =
        '0x0c348a6c04f38483806c8f1d4a72d83cd21c9d98d3db3edcd15a36c91b19f67c';
      await expect(
        service.calculateTransactionFee('ETH', txHash),
      ).rejects.toEqual(Errors.NO_TRANSACTION(txHash));
    });
  });

  test('should get balance', async () => {
    const response = await service.getBalance();
    const balances = response.getBalancesMap();

    expect(balances.get('LTC')).toBeDefined();
    expect(balances.get('BTC').toObject()).toEqual({
      walletsMap: [
        [
          'mockLnd',
          {
            confirmed: lndBalance.confirmedBalance,
            unconfirmed: lndBalance.unconfirmedBalance,
          },
        ],
        [
          'mockedCore',
          {
            confirmed: mockGetBalanceResult.confirmedBalance,
            unconfirmed: mockGetBalanceResult.unconfirmedBalance,
          },
        ],
      ],
      lightningMap: [
        [
          'mockLnd',
          {
            local: channelBalance.localBalance,
            remote: channelBalance.remoteBalance,
          },
        ],
      ],
    });

    expect(balances.get('ETH').toObject()).toEqual({
      lightningMap: [],
      walletsMap: [
        [
          'ETH',
          {
            unconfirmed: 0,
            confirmed: etherBalance,
          },
        ],
      ],
    });
    expect(balances.get('TRC').toObject()).toEqual({
      lightningMap: [],
      walletsMap: [
        [
          'TRC',
          {
            unconfirmed: 0,
            confirmed: tokenBalance,
          },
        ],
      ],
    });
  });

  test('should get pairs', () => {
    expect(service.getPairs()).toEqual({
      pairs,
      info: [],
      warnings: [],
    });

    service.allowReverseSwaps = false;

    expect(service.getPairs()).toEqual({
      pairs,
      info: [],
      warnings: [ServiceWarning.ReverseSwapsDisabled],
    });

    service.allowReverseSwaps = true;

    service['prepayMinerFee'] = true;

    expect(service.getPairs()).toEqual({
      pairs,
      info: [ServiceInfo.PrepayMinerFee],
      warnings: [],
    });

    service['prepayMinerFee'] = false;
  });

  test('should get nodes', () => {
    expect(service.getNodes()).toEqual(service['nodeInfo'].uris);
  });

  test('should get routing hints', async () => {
    const symbol = 'BTC';
    const routingNode = '2someNode';

    const routingHints = await service.getRoutingHints(symbol, routingNode);

    expect(routingHints.length).toEqual(mockGetRoutingHintsResult.length);
    expect(routingHints).toEqual([
      {
        hopHintsList: mockGetRoutingHintsResultToObjectResult,
      },
      {
        hopHintsList: mockGetRoutingHintsResultToObjectResult,
      },
    ]);

    expect(mockGetRoutingHints).toHaveBeenCalledTimes(1);
    expect(mockGetRoutingHints).toHaveBeenCalledWith(symbol, routingNode);
  });

  test('should get timeouts', () => {
    expect(service.getTimeouts()).toEqual(
      service['timeoutDeltaProvider'].timeoutDeltas,
    );
  });

  test('should get contracts', async () => {
    const managerPrev = service['walletManager']['ethereumManagers'];

    const ethereumManagers = [
      {
        networkDetails: Ethereum,
        network: {
          chainId: BigInt(123),
          name: 'hello',
        },
        etherSwap: {
          getAddress: async () => {
            return '0x18A4374d714762FA7DE346E997f7e28Fb3744EC1';
          },
        },
        erc20Swap: {
          getAddress: async () => {
            return '0xC685b2c4369D7bf9242DA54E9c391948079d83Cd';
          },
        },
        tokenAddresses: new Map<string, string>([
          ['USDT', '0xDf567Cd5d0cf3d90cE6E3E9F897e092f9ECE359a'],
        ]),
        getContractDetails: jest.fn().mockResolvedValue({
          network: {
            chainId: Number(123),
            name: 'hello',
          },
          tokens: new Map<string, string>([
            ['USDT', '0xDf567Cd5d0cf3d90cE6E3E9F897e092f9ECE359a'],
          ]),
          swapContracts: new Map<string, string>([
            ['EtherSwap', '0x18A4374d714762FA7DE346E997f7e28Fb3744EC1'],
            ['ERC20Swap', '0xC685b2c4369D7bf9242DA54E9c391948079d83Cd'],
          ]),
        }),
      },
    ];

    service['walletManager']['ethereumManagers'] = ethereumManagers as any;

    expect(await service.getContracts()).toEqual({
      ethereum: {
        network: {
          name: ethereumManagers[0].network.name,
          chainId: Number(ethereumManagers[0].network.chainId),
        },
        tokens: ethereumManagers[0].tokenAddresses,
        swapContracts: new Map<string, string>([
          ['EtherSwap', await ethereumManagers[0].etherSwap.getAddress()],
          ['ERC20Swap', await ethereumManagers[0].erc20Swap.getAddress()],
        ]),
      },
    });

    // Should throw when the Ethereum integration is not enabled
    service['walletManager']['ethereumManagers'] = [];

    await expect(service.getContracts()).rejects.toEqual(
      Errors.ETHEREUM_NOT_ENABLED(),
    );

    service['walletManager']['ethereumManagers'] = managerPrev;
  });

  test('should get transactions', async () => {
    await expect(service.getTransaction('BTC', '')).resolves.toEqual(
      rawTransaction,
    );

    // Throw if currency cannot be found
    const notFound = 'notFound';

    await expect(service.getTransaction(notFound, '')).rejects.toEqual(
      Errors.CURRENCY_NOT_FOUND(notFound),
    );
  });

  test('should get BIP-21 for reverse swaps', async () => {
    ReverseRoutingHintRepository.getHint = jest.fn().mockResolvedValue({
      bip21: 'bitcoin:bip21',
      signature: 'some valid sig',
    });

    const id = 'bip21Reverse';
    mockGetReverseSwapResult = {
      id,
    };

    const invoice = 'someInvoice';
    const res = await service.getReverseBip21(invoice);

    expect(ReverseSwapRepository.getReverseSwap).toHaveBeenCalledTimes(1);
    expect(ReverseSwapRepository.getReverseSwap).toHaveBeenCalledWith({
      invoice,
    });

    expect(ReverseRoutingHintRepository.getHint).toHaveBeenCalledTimes(1);
    expect(ReverseRoutingHintRepository.getHint).toHaveBeenCalledWith(id);

    expect(res).toEqual(await ReverseRoutingHintRepository.getHint(id));
  });

  test('should return undefined when no BIP-21 was set for reverse swap', async () => {
    ReverseRoutingHintRepository.getHint = jest
      .fn()
      .mockResolvedValue(undefined);

    const id = 'reverseId';
    const res = await service.getReverseBip21(id);

    expect(res).toEqual(undefined);
  });

  describe('getSubmarinePreimage', () => {
    test('should throw when swap cannot be found', async () => {
      SwapRepository.getSwap = jest.fn().mockResolvedValue(null);

      const id = 'asdf';
      await expect(service.getSubmarinePreimage(id)).rejects.toEqual(
        Errors.SWAP_NOT_FOUND(id),
      );
    });

    test('should throw when preimage is not set', async () => {
      SwapRepository.getSwap = jest.fn().mockResolvedValue({});

      await expect(service.getSubmarinePreimage('asdf')).rejects.toEqual(
        Errors.PREIMAGE_NOT_AVAILABLE(),
      );
    });

    test('should return preimage when it is set', async () => {
      const preimage =
        'ec74738cec448035204f5fcffc754096c11e75418b434eb3cc0b23d0aebab74f';
      SwapRepository.getSwap = jest.fn().mockResolvedValue({
        preimage,
      });

      const id = 'asdf';
      await expect(service.getSubmarinePreimage(id)).resolves.toEqual(preimage);

      expect(SwapRepository.getSwap).toHaveBeenCalledTimes(1);
      expect(SwapRepository.getSwap).toHaveBeenCalledWith({
        id,
      });
    });
  });

  test('should derive keys', async () => {
    const response = service.deriveKeys('BTC', 123);

    expect(response.getPublicKey()).toEqual(
      getHexString(mockGetKeysByIndexResult.publicKey),
    );
    expect(response.getPrivateKey()).toEqual(
      getHexString(mockGetKeysByIndexResult.privateKey!),
    );

    const notFoundSymbol = 'notFound';
    expect(() => service.deriveKeys(notFoundSymbol, 321)).toThrow(
      Errors.CURRENCY_NOT_FOUND(notFoundSymbol).message,
    );
  });

  describe('getAddress', () => {
    test('should get new addresses', async () => {
      const label = 'test label';
      await expect(service.getAddress('BTC', label)).resolves.toEqual(
        newAddress,
      );
      expect(mockGetAddress).toHaveBeenCalledTimes(1);
      expect(mockGetAddress).toHaveBeenCalledWith(label);
    });

    test.each`
      symbol
      ${'ETH'}
      ${'TRC'}
    `('should get Ethereum address for $symbol', async ({ symbol }) => {
      await expect(service.getAddress(symbol, '')).resolves.toEqual(
        ethereumAddress,
      );
    });

    test('should throw when currency cannot be found', async () => {
      const notFound = 'notFound';
      await expect(service.getAddress(notFound, '')).rejects.toEqual(
        Errors.CURRENCY_NOT_FOUND(notFound),
      );
    });
  });

  test('should get block heights', async () => {
    await expect(service.getBlockHeights()).resolves.toEqual(
      new Map([
        ['BTC', 123],
        ['L-BTC', 123],
        ['LTC', 123],
        ['ETH', 100],
        ['USDT', 100],
      ]),
    );
  });

  test('should get block height for symbol', async () => {
    await expect(service.getBlockHeights('BTC')).resolves.toEqual(
      new Map([['BTC', 123]]),
    );
  });

  test('should throw when getting block height for symbol that cannot be found', async () => {
    const symbol = 'notFound';
    await expect(service.getBlockHeights(symbol)).rejects.toEqual(
      Errors.CURRENCY_NOT_FOUND(symbol),
    );
  });

  test('should get fee estimation', async () => {
    // Get fee estimation of all currencies
    const feeEstimation = await service.getFeeEstimation();

    expect(feeEstimation).toEqual(
      new Map<string, number>([
        ['BTC', 2],
        ['L-BTC', 2],
        ['LTC', 2],
        ['ETH', Number(mockGetFeeDataResult.gasPrice / gweiDecimals)],
      ]),
    );

    expect(mockEstimateFee).toHaveBeenCalledTimes(3);
    expect(mockEstimateFee).toHaveBeenNthCalledWith(1, 2);

    expect(mockGetFeeData).toHaveBeenCalledTimes(2);

    // Get fee estimation for a single currency
    expect(await service.getFeeEstimation('BTC')).toEqual(
      new Map<string, number>([['BTC', 2]]),
    );

    expect(mockEstimateFee).toHaveBeenCalledTimes(4);
    expect(mockEstimateFee).toHaveBeenNthCalledWith(4, 2);

    // Get fee estimation for a single currency for a specified amount of blocks
    expect(await service.getFeeEstimation('BTC', 5)).toEqual(
      new Map<string, number>([['BTC', 2]]),
    );

    expect(mockEstimateFee).toHaveBeenCalledTimes(5);
    expect(mockEstimateFee).toHaveBeenNthCalledWith(5, 5);

    // Get fee estimation for an ERC20 token
    expect(await service.getFeeEstimation('USDT')).toEqual(
      new Map<string, number>([
        ['ETH', Number(mockGetFeeDataResult.gasPrice / gweiDecimals)],
      ]),
    );

    expect(mockGetFeeData).toHaveBeenCalledTimes(3);

    // Get fee estimation for a single currency that cannot be found
    const notFound = 'notFound';

    await expect(service.getFeeEstimation(notFound)).rejects.toEqual(
      Errors.CURRENCY_NOT_FOUND(notFound),
    );
  });

  describe('broadcastTransaction', () => {
    const lowballTransactionHex =
      '02000000010147be68b6ffc3a6232d18cb26b5bde4bc5406a3df2affb8a7169d80ea2f7798860100000000fdffffff020b8d94aa4c28a8d3f9107d2ed60d34d3ea66ce210206547d434233345e33c0b98408355b510bce192aaa7ef985ecbbc95e87c987ab1e5200a027438c5727799764370336b5ebce389b3544a0c0c2c9abcef37b458b20b33641b6471525a594d9f38cd6160014ad533ca86ecf5cfdd25a790d2dbcdd8225f3964c016d521c38ec1ea15734ae22b7c46064412829c0d0579f0a713d1c04ede979026f01000000000000000e000000000000000003473044022054e78defd1234ecfd6f38e5ffeeb6e8b9e40cd0a787778349fdba9fb6416f29c02200ceee8c2dad4c240a32438e9f83f51d791452122a56e0690f66a9b478997a5930120ccaf6f7ad4c09686a577132ba13d974d96a2debf3a46b6009fdc86cc6df9fa9665a9149f1be4d865c3c4a46878de3ad68a76a79314a1058763210362a931e4774409d85034bd7ad7f9c6284aaab81b479416f18b1b2884207c8a656703e0032db17521029b8fca59a765a0d9903cbc8565a16c84b0f3e21642405fd243b7e83ad8003bb368ac00430100015e969b8055d44e5971c7cbc532bb641542ec5566b2d13c6e3242277b94f2bacef739bcfb8762384738887f5a47d9c7a92425726ffecb5cf4ff8ca03167eeab6afd4e1060330000000000000001c3bd0801c30fd0eec07fc52efa579d86bddd196307efe28c562c705d3e437343e5a0d88bd370d9564829366b4d36f32bbd26fd36cf671f89f1cceeb877537c4c1f1f245fe7c3a5cc51dce13e7968c348fa26e70d3bdd49f79ee745903e40a8931ef3e3ff77ea74896307244ee2ee6768d2b89e4f3af3112781168be82c0b1efdad54056caa5a665177c56cf9a91560a3a000f769e04f9432f2df287ea0c74af6573fff3435f374fe620e18a26ffcd842b672bd6deae2fcb2492b0a67088b522a24c4d2e89077ee3b86b687a76e5b304bf64aa34edf64b8e90d2de439b45106ca386a32599efeb81145cd20a509c788ac6cfaddf38ffaee21c10f8a48d1d02468355e1f6dcc67f5fa8f5b0c0cfb450bc0819e08350f5fbc26f663b0097f8b99817b270a8faa56647170503b59a0d49916cbfaaafed4c7b4c359e0b5eb3cb7596fd7496a2d988f4141e7dec3055f445a4cb6145d8c507fcd35a4ff61aa2728ecbf7f3eee8c7632fd81f6d762cbb7bac3bb238c7a7b690dea21de9118b7a74d696727227cbac5664f52f8349a12bf3d462cdaea253fda81feba198926c8e2c0060b139108707506497d3af5fdae1617d308929e5a5cb234219b61e42b18a6076ee9edf8f8738a9240b70eaa682fe119c1a0a655ef6ac9e685a148880033fcc9ef060d32588ea73ab71beaefa4f6d140819f0ca144b39706d6afdc374048a49c115734f1e7d79f4134bd9c51831f058ace660b57fec0192a72e657b5dfb2fbad93d7b047ffa6e4ab0cf13808bd9107ebf4ec98396b14f6f13f5d556e9603a1f2931dc8c008ae46f819b21aefe99103aed7837f8f76b7cf9aeef70919bf004a2d85027f74ace1165e36fcec4203bd30d7900bbdc56716308644c563eb69974fbfd7b51505e3296cfd0671818c88e628f14db5f0d4240e0feea49127d06be57bd844e4623af9d77371ca2e4c9feddbf6e56f3fcbcc4a1461e4301422d7fed8b960ce3177eec48412429c27721eb823c5c21166ce64eef1d720d51c24cc51a7105964ce0b093336f6aba84d0d11afae6dfb7e8ac0997ff7fefed1252da579ea81bb7211e0e78caec39c9d522091f1bf5dbe017c175b12898c362c9ef9c27c8d4ba2923d47c48e27d3a38510b5f573ce01c80f450c4a611e867c41fd1d3f05aa16729950cbf552143a2ba121530226815c5f9a9dbdd4f8b6ca41093620cd0140954c5738df64c7079e5599be16729bd2842c18439e019983158a54272eead5d4ec96b6a166b623cd2e66f98bab1dfeafc46aab584d58bc3ec9983443ce2cf771314a401d469475dd14c99848abee8c17f2a0a16c32ab3718fea5e2f1930b30b5b826857f929c401d2ad317eb3631ec04fc5d59bc20eb05ccb8256345a3ea58ec0f07630d6a03c1430bb161f755d0db5a29f986a1294fbaf15fe6179edc36d43d635626051238e48adf20cc3f80fdad3e575dab58f3ceba24a92f0c4ce1330e6f04d594c3b5f6f2b568edd28bce0f5a32bff3e54ef42c87c9863bb727c9030c1647d0effe976861a4adb7db39dd8087b24ae89b41149e55f83c0017ca65ed5187ba3b808f9f621c3e20b763e9cd8cb8619b0e155a5cf51ad2e59dfc648fad033916c35d51618586abb861db86062457dfcbc992e74161abce0d7baf9d85125e2ff63c68c5163ef7ab38d50fa1af48c89cc2d997a876674c5f16dae20db2fad2bd8f5a85d91d5e75a60081dcf3d6cc6813fd1aa4477da859248d5877b6a1838742f96b1aa5dd9dba10e05012109ecead3daa953061af7fbd376a727b39e62da72da6743e20d1eb2524d63dfe81959f0570d57746aef13e54d3d69a829680a1e348010e5e4a156985b53ca665a953dff80c63ee1df780aa71208138f9a104cfa11e39f35f42899ccf6d850ac7b664b29582851e7c48ed32ef2c5efa427334e0604a25a34a96639b759283df0a3f80b4fdca24d97d41fa2f369df0b551b80a036ba5eaadff53250ee715b449685aaa713458c54d41eed61f33fc1665253963410a6f9b3b6da8cc68ff1b48ae40d6428d6368e4baaa75624ca66343c3755d0aa14c718d00be7c60728a28f180e8a99da216aefe098d06df7c3e19f48f1663e182320e5bcad1ab44077c2cb39815f7bb03eca8145ffa3c54e3b6bcff522ff9802ba16ed0d329d9467b76b24b81acc16858c824327fbea8b122a3049010e8a2be6a050b402f28465e517888066828fb871c54ebdcf351038c22fb9c0e2f0040bc7e59ac942342a7b0654a6ff9a77dc02830d834a844d641da35b22bd4f87948dac256bbd277f10ede9a93de6ff335a991f3ad41a44e3800ecc35c6cc9570fc1909a8727093c024974287a9e6a5a1380815b4a3f8948002492383d53db173267b7a2dd94ceca3f4dceeaf1e1083906623702ef1c709af0e4d7633477c9b13d130387422c9be4ac8ec4e529bfa331a6d3bc69c8bf93d663046382e71d5b95f21cafde24fb7767f361c6c5a40b38a1327e1b758df644fab4423ebb8c9732bfd213bed42dff3ee3a3a83e13d238b45af60d06e50e1f908c94548bdee159ce2b588fc55dfb864f0ede48482b1ef9de8a5c26c26c578d9d228f1542c31d9fb78106170c1ccb3329567aedbc76760ba86f39fec2fbb4594051300d703f79dae08ac8b4a5f60b7b80ee98bff68c3f5223faebcd1b387a71ca397f68873dd98c33720fab120065ea921014c94f757fd80fdb917ece980962ed832db862c1c55b07b39bb862ba1853ac492d1b62734a8a58c03f221f2188ecdc0509aef0395e27d7e5c253e554ad01072109faed3d1199ff6107cdf2d77c2cdfe3782ca55cc37074a66106f27502bfbcc3884507d1c9abaa1c82d8eba9da232a3f319fc294607be426db44fad3c3a77f48171da4121e4769eb14ad120764c658230554e77acc5eb490b2af69715c2171fb976ff2c36899be35bd77055601cd93c1198985067bc59cabae46cad89f9401040611b99f706b5ded126070b5160f4148ef4fbca09ef8342338f682ad9ba824f63824df6e615235e9d6390b66f2ad7cd313235b0666f69cfd02b9ff3dca179f1d2beaa2c97f4ad2f79a571f506bb49c643154721861d3ada2067351669b3a07c793189c258c4c925a951ac1db475f236dd4590b6b3136546eaf85159840ca795f712b2b7e6430482f815ae35b40769177557dfaf85756e417b945cfd64c274f92e213770ff4954f44affd4dbef7c37ef0cb4f710a5a56f77e398898c903f936a10c0361bbdec757c9ca00c49e4371e2656163b0ebaffd157ceb04857542c48d7e4240b639c544c5276fa79ee5d50a88a240ddc2faff1bc75814e89df59e40550d16e20d67cb18965a852c52a21b5c98cd13984449c82d6a67bc4e6214211ffb24b615a04b4d00cf323a6867e54c828627645cc0b692cc15d11745d9683d3cba1e1a80a94f9db86c6f64903f579baec91b3be94ee4e7d4421793663003fee4eea17c8f57de19c34e9f87b2786a979b3c66a67306562324a9b98ee557289f9a8d4478fa2740567f14cc5511465aa0b7ec3027c7df4c44d52c74611b8a6fc247a1a706285ce8754e503939a35355a0c02feb9cf14cb491c3a858daf8df36b56cf532a2f07877656ddb6b0f6bd25b8f66ed1aba050ff2e81175ce439a4605a08a6940a349762cd480219ba83e97c66fac79197594a0f40541da600e2dce508d49398bde78b21b6b9619202b25e00832477123336608ab6a888f004e1677981e320d7a7807478fea8c828e74634fcb7dc19892e268b4ecbb0ab585e23d8363e352f5d9789bf98e25a0c9f4231e0c7111ade9e33097b6a907781590dad8d13d12646eda1bce2b54bf5c46e9b30528dcf4f18119727bcad2c651b652530abb6559609c5898b1b39641dea0340d414b59becbdc7399dd2f73716f8850a8171c5b3919fe656b1b16a7f1ed802bc85a0bf923447135aa14a03d7774d847dfc063cfb1dfa0d48e1fb4ca2659d8eec859ae217aa98379bafcc8da8cfafee93a9b3887e7806e929634f3abf0cbd60dd71f2c420d6a00d1141e3484e9ce988a0ef3d88a881e68f7c7f9d558b48bb081ee2a3a9ce672a51e4bc7e792d38b476cebc253596bab44eaf84cb1f5a5a6f51c14dfaa4f264f21c9e28e7f84e519c0f8b043b67585049f4796aed6231ef190feab9a1372490fb743549b37efc2d3d5eba1e4cceb1f64b929d649a598c3f20c20e053ebf5adcc812e4d62798746323b0f086161ac5ae3bc0e4776bbc20bddb7f71ea488ad67ad072180865ceafb0e11668b5cd15aaca412d7706e10a1aee12d1776594f7af3d6e90a34931cb98bcaed8857068a315a618c2c09f440d8f88d144773cc7c018e6c35fff8e38f88abfd0834927324c9bbde0f1133f34e5c0a3b0cffcaf4aca66013ae076b7dd0036376d4e3e10f5a19eaa7c7d7eaf96f0e0fa9336c584a9631ffe44f0c28718e638003255dcf8e591de42393f9cc3f4c2fb2946e9b828ab323c23db492de02d69544f99b0e94c7b2bef1bbe15d9cfa4e0ad3e47388570f2c76fc9a0aaed0a4d24f8c0a7c39a9d83ed696f0aab84d0ec9ed331113d53e0d8fe23003688e0daeeedb73c22e26f1c3c70de735febf2b465b923beffe7035bac3b1bbbc506e8793eb4dcbae7ff477fef4c7cc3761748ada6ea36a6ad3ce78ace68529b33ea2fa61579e92899dc706ce3d06f3bc96eaaeb6f900218ea1d335f63abdb6891ec008ed90b90e6a0ac85300802e3fa19e1322fea1235e1d5ffeaefe756a76c549151f42fbec971335fefe4df0842cf935be3a988e73cbae42016b723572ea168ab942aa239aa2b023b656ee589a7eceab7b493dbddc80ecf3df0a469e7470195f70667b262638798403756bf1adc3a7493e86657a3774125f947e684612cff8567c475a1af91d5052514c30db7830bcc138e97d83a5e79ef3afcd5d87f49838f293c4affb6fb698ad665ac697c60a217796052143ffc95b43d93a46db72f5de661085012799ff1056eb8d1212d5d48d9cf01781f985055c976a9223180e52aeea3b9bfaf9a91acd55d9233d347c279bdccf51c4cb3b3bdf0be88665fa946697239935e7761f064d1d14e343b97f1454eaa2f146c04a6b182ef6c62395fe3c0f88ddf91b08204c8ff34cb6701dbb2150f60ff13c166da08c30178bd8c24e5a9bb566a3048383862877999a84698bd88f649fab5b71f99aa025ebdd55f28cb4e9604a61648579d8eccc8f5fd0c2d9db2f56aabd96065f9ef78f6e8f6bfb78a4583faea4717bcaf18f8190205a8e98536867b562ca83b759a4002a321c6b4cf1df90b04d788bafe406caf3b5422e6d7a46687682f3890254ad0ec1d5a966fb4f39f4fa11e2dd9fb79fd17ce51d6efed67158010734af340b3d4161cc536e25686852de6947aa88678cf78936fbf8f7a88985e6c798c306ad4938fff930239ed9b10cb9160875702c1b2091907055fa657298a3a85db9d6e94f2722a44a835b7c21bb62961438f046cd0f0731a4540fad5ef37a8144bcdc65bda95ae7b5dfc6389f484777a69d034ad4686e24be3cc13dc86fa098090ccb601f5a6e140384dbda5eedf237d756ed759c61e154bb389f9470268f4c9eb6fc1a905598539d8bd93ef2767e88855fa602fa98578df76702d50a28a354a06af3f79d3e8f68ef93e832baec2d0d55e7db9a6b59e84dc784c1a6bf5eb7be4080ace381dda37b081510a84ecf61bea4a1c8db5862607655b91be1c652ccbd0758db715c8ca062222c2e1939e7ada4ddd3ee5763e8830f628b9e055804f0cc42e192083f4102cc61271a59c942e142a6cedd2ab36573da1e88d070f82602ea93fb50e041416301be054a2be6f9f1d65a5bc5ff79e45a707dbd978d541eeef2b6ed9eddb70000';
    const nonLowballTransactionHex =
      '020000000101002a29a0380da108b5a72e1eb4d93b2bf1594047f9a70234f4d698d69007651a0400000017160014540473df69dc1def2d4fc415b8e3674e10774f9ffeffffff030a71433aecfeda1b7bd44a6ea39f14d4cd5867e123c9bc7a180309005cf52f0d250830f6292e424533d6585c1084a6d774fe32532a27399b9c710a58280ac8a5d67b021b73dcffe42e122f8f91418e72741b5515027434c4eff0090af056d30b987ff717a9141965abee12b45e85258bb0f029d1895465089455870a9cf3e30114ffc8a545ef5b1763fda712f6e1a83709892aa713ccfbf3aea3dcb2094d0b35b74fc3758b33aaf35cfa8fad95cc059a40477268445748d645b08326a10263af433d70079afc48595feb57bfb9568717f8f26243d1b28b4e66a105a66cbe2200205b01897d1948883465f29d1b7e944d440252389869b0a405d082aaf34a31bbae016d521c38ec1ea15734ae22b7c46064412829c0d0579f0a713d1c04ede979026f010000000000000105000000000000000002473044022060854b92bbf966af0787888b4b62ddb16878c41b2124a9dde0c5d3d8d02a49e402206d7f554b0115b6c112a38151f0664108a3dbb9d94be6fa0ce4fc170115cb12f10121023f250be8c6fe961861aabd2fad394052487c0471b1e3a4942debec9ede6519b90043010001075784211c3b7d9cb30dbc8614ff1ba159457ff406a33a00ae54db89093bcb08b17bf467965382944a7a0b430c429ec10a9ebd28f29b14cef824e209193413a7fd4e1060330000000000000001f8128301218d90d9d513f9601b542653300c986005bbd75d6c17a53e0fa876a1d1893ce85a7e67dc080524663f6d969bb6a6f359b9e8cdcb9308c1a9796a1eca9cf00b2526abe9fd303cb96e077d40bf75bfdd401970a458698832d96f3b96e7cb43f17f5cee1e357b47626a048b9f8d7695fd14110d4f9b09fb6e1c7faedb74b83e2b652de65b1e53d9fcdb323eadd79a3ad0df16697ce0a6df912b382a3ecc6e6946f4605045bbbb5c97c3460b4151e23677c2921eba35805e186de9d73a6d5d88875864fb11274f3c183cd3992eee67558d487b5cbb553e9e3fe35d2f12c8d4386239319e4646d00a9aae6fc2a9c75e6190bb58f1850c2466aa63c1cd113fc01d9e858590ff109770d83a292327d3b6434f984fa0ba5d7505ae64802ccab06fd9827a0edeeb4b889b6fb6d6ae2aad5d8d2a058aba0f95b421111dc35d7edf3e77650386dc0d786232a2f2ba5e0c051643fffa27a05a1e35133d95c02788dbe31af231dbc6871669d398a672bde0b9334ed067bcb8e2cadc660d400802f97c9302d219f2cfd610629182d7b08f29f11c59c5c019cd33f047eb883dd5455455a6d3e15e0a6b1a7a5c716b1f7fbe4e8bfed797f81e9adbf85e79cbfa654ef5a87d96287a6e9c5f5f67028b274f4ae700d8182d10350e987e4a2de7facff0a48db5858eb94d52b6b5db474a966c4c6ba52e68d8b40fbc116bdcab89fbe8c69e68487fa1a6a1bb57c5a03dbf27c878c43d23d6385f59013dba62d7590981a113a5f61b69730d57f7955efc9c7067ada0aba552d14b5831f2b7b3ce38ac1a3fd460a64823d49295c9e79444bf3976a36e2642f74df8ad916faf3c66c046a54b952c4919b763b5f958cc0711f799e2cb7e020412f7529a0026bfa12e93ec253d362dc6157141adf840d359129364103fa6205213d6727dda3feb2f76ae5ac0add34e7a28930d0e4b0ab29cc884e300996ad351b940e9a5dbbdde47c17acd160087a35428cb30c863d7949447cdb49b8cef88d581f9f9af3507ae75d4854e68bbca887b8aefdcd429ff7d8d20515f2d79ce4619fc40d572daf1995548232119aa83b1817896ae876b0a6ee5afc1ef7bf669c3aebb525b198e257db0977b0361651e4cdd08124c46af439d8b475d3542d53065f0a9aeee0b78375db25df14951125e7d291bcadabb617971ba8a67287819f745be2d7fd46cdd3dfb99d7fb31ecda130d54f0a241c7e47ebd2a54f1378e483418eea82a3319dc7727dd6f883215564a8ce02034126081a722215eb5d69cea10616bdd7d918387fef1d52437edd2b0b7d19351a05b072ac6989be394a41a4217c2eaffa81bcb50b0175975eeda40cbe75879a19c33b36a4c55ca63e4093caa9ccbad1b1b11b5f9850f36b23bcf8f23fceecdd35a4d31cd47a8cdd7e9cd28603f3f0af79fecaf5a46fdcaa393c68d93565c238ffd69558564c75e4b1fe0f13ec83672125bdbc55ec595edc9250e3e0bc0373089b9cccf98f2d9f9828c36a3e8f4e50d5c1448ddc3c4417ba6b872258e16abeb1699ab2893dbedef6ee6c82765ada771f8e6b2aeb3da3e4bc6cbcf79a4429cebf02d5caae53c6c85ec8bbdeea2608969ee4a11c100e21a0f064e2d6034acbb08ddf41b86f30c02fae7e25b07a7dfe4eed58c215001241fb9a5cb062928980e07cf4848e8f4164117c79f4d766417ce2418eff8cd047bb45e467c14f7fd7fedfeb189a79d4caa786c02518b5fc3359d45279dce3e0040e52a684e8caeb9f8521fa03dcf8bcbcec3d6e660d5af0e2220e0d09f35330891dacbc87845e4e5d579c12aca6c35e0d1510735ff96be606d2bd52b7da10f99fafa3c68f4fec01e8072c77a53e16d421fece07e74ef5046c2ef99e9505fd80eef2bb675c26430a81c21cc052359ddb2143d0b5ceca27a6d3d17d4e56b27050bf54c746dcb94f7d3f364a2cf1970bcaf8aebcdd339d0c7863b417097b86904a321ac8556d3f79778ad5f9836308f25639c0083e73e00548a094c4ed5c82ffd3e02fb1881814f4db4f87ee167d097f7e405a112912bc57757883b9da32b4e769ca7cb49d41fa90d14aead2bad7d5b50a1920878ab79063a99a6e758af743603c18b689859d9437e428ff6a6930e92b58cbf3d1e018d28956b24d2e5675a4c6ed45613af6b43874dab8f6961c9a6a8b237d6525becf602dd75e9956dd7b7f2ecd4efaf17139c06ab354525122ac7acd42fd6fd5abf2f0ad07d0f000a39611e93d9dfa789c8e7a41a7a061b680bef07435bc06b28638753c2dc464b75f2c886500742d6959208b082ee47838a332b8d51294c023dfd2406b916b0e58ce45932d945b6d11fe2b95cf3366fa7e6e88e5af41b3c82838b78b6a82b8391b686b0dda869f2c9a70d77aab3708120b9e85e8ef6cb5ca1e0366f47c5ac000e02ec34aa97bc3639c5cb244443f924ddcd833a779179e3fc129ec82d9cab1a04ad0e9cf4546c5b6cbd37b28e8b45640bc22b0b15ba0a8b5630c9b127930b18bbdca14936abebe83691e87275e59a7bfa7cd3a9878095e329ad4a1c50b8d1fba72e3f629b7042d1c83505ce34e258894226b104d633e64fe2ba2e65204658e773ca2e621def25d59a83bd2dfaaa01df216edc679f86cececf7447b2c86d12c4b3e29f5a44bd36f503a330eaecc776b496af26310e9b9709aa8821a8ced8f71e44e706d1279d2b4204ff7c02049ba8daf0d7296a95c48881032d69b2413179c399360a62836c269a19f6540c73a6c76fb661f7ba43c09e2e597acf51750af09be5b6ce310f50d0c32dc7526baa0dfc4fda320ac4a95d570120daa65ad513cac696b8c182ec709ea11e1cc0e4d63ae15f0c93e04122474ec516703a38c7a56b1596a94efbefe6feb8ebac3757de1407067d26c0dc9bcb871fa8924a3d6cbf80e2fae6f8f6f5b6116554b7b652650e5fb8b6152e0e77a02d82c9dbe3ec27d850fda3ecb624bcb18a6e6eb1660eb3455edac3fcb9276f053fda80851a4c47a19df1e3c4836360f7d786520044207d05b7f66e28ee327c83d57285e21b6296ec436c71b4ec366da72018c1c4ca127c5923ae530a58e07d30614ac15ba6c0414b59187afe2a63bdfee1bf7794ae50ec381692758a98922cf50160224682e437400dd71f8bdfd9e9f518faf6d1df80fcc6633f1cd44697c5f34f47b1cf77d8f2634316f617a1c2dd1481f24f4d6f55efafe0552a74f6648f39adc44a90e9d112b9dae0b48989c691ceddbb85eb9c30118046294cb2d6f47f59b4332d9af5ece0b2b7a0580b0d43ad8aff4069b328f263b73d7474f3efd8220e63c52ba7d4b9ec7ddd968d5f3ca04daa20d24f2dedf098815e972f95b90126bffc7ca7354dca440f7312e1381cdca52447eabb396b8bc70d5e1c028ed654b8a34d2d67001ed1428eeb9cc9bdf1330d39cdbffe694207869add4972c500e394270e978855bd2675c794894b9a1a83487ac14b7ff828abf28ca5bbfdd131e4ab2d67d42af8b92021c0790f86518b63942691f12e0e0015207da29d2162e0d8506038233f8186aa71ceaddb34365d9fe006d5a1a4791280e2e0d2731deab57883520da29440d028ea8c2f55f675428d5faf039643cb1fa227e826429ddb69c2078f683f0c475894c17caa68ae2fb9b652c54357069ea1498ea7e08a412857226931e88dc7a6ea42a7c4d3a2c041f51a55a003c2f2180f66e003def796cc044084878d4cc8e45f355c5d74977d9365da90a9f1d5ac813f305bbee3ba6ceb4adbd020ee9f46c0f95f660e1111424293b5439df5999987270f4fa9766542e567936f2260b61d78a680014247259c50bc4df711412a000a5ebfbd93fe703187490bbb755111eee56edd63f1b4bacb4697ce0d19de5ca755cfbb21e6ef9dd5976aed869d1b72e3ffa32b601bcc56828bf57a6e37cb53025e0e26ec64424459d970ee66b9c68c29fa050ee6a78977c7f20abaf6f127bb90c30b63315eef9caf9c4077c3da0e22533e421be73945bcf90a7773aaff8bf6528c617a070f22cd91ae26665194885814a8e64929bfd4948c728503a699bcfd6b3e9b6cc3442ae7985c0b3e0ee4340bbfc42815f6f9e0d97e10d714230c154a73ac115bcedf22bc87aa4183feeb0429cf6bb6d8e8640d5e73dbfb455760542881723a15f570e33f8bafbcfd6245a576779b640149e8f609f3dc646bf2d114ec2ace7f66f8f6f6eee3af0b95ece6388ad02c006107a3824b0098ba910a9d72ec9e95fc898a26746817f7219381096fcdd30ff12208395ef2bc3d75353452d851186db3594b74fd1e0e0be70c1b8595b5481fd1ceb296c9f02a71a64c1c42b79380150b165026104f925a5e644f7c67097aa8adaafe1ba958b5e78a1ff6772c8d6b7b81cf59fac96cde1656eaca1feb9e0aecb64a4a170f25bd18ab5bbe5d685792705f40d6601d152280916c208c4013bccf028817785792c94e2ab2db9bc54c686546d14a632426cc2dbfa836ea913e6506140fb094411d6cdf3c0678c2de60237429599f85f6ab6a19a36dc6f44663d7036f1e7d4280e6370fa1c5acc7a20336306be1f2e17eb1030651b8bcc7ce1db9b8938987b651f2fc0f0f91e340fd54d0c7da173c31fb5b7131f957ee566ef0719fbd394eba95464cfd90d8a822c6ca86a84d61551ba3e9c511653d246881011b6d144b9c3d61c797ad274304319f65384c96f8e662724f8689762c670849d7534e9dbc8e6e7ea1e67d8393f6d1425e91f2a2234868d164967e0d0c2526732f39d6f1244a1f3ec972829d27640902b6bc8cb08585fbaefa40da97098c67bc1daa19d6a1da1caca2d613ded9a388aa1c62778037a5f0e6a6da68ced786d7a5c9ed66075776ba5701fbe8a553e82c5c32905e0d685fac9906cbb74fc3b600edb8c5ea444be350805d212ebdfb1f755e68f8c0c0f9e40a5056973f6c8bc68250eb043eb339afb2a290bff567577c8c98aae0a210c50dbf1d602025bcaf13de21c2ec88d52f107d03b706806b7ce459a387290716ab3eb5e425dfb3b074cb508308ce3ffbf68bb60b860425dce0047fc4e5b44e7b5176276914f23784e2d65c01731369200a93d546407c8ddbd8192046679555ed4129fed0195fed1a0c733cfb5d83411d879ca03401a1b5f4b7a75bd20c179b2f34d7a1c0e50a007557254f53bb986a4fb309cd6ae943807846a89b9a75f5a81870f32d56c2ba1532aa5576da00642b9e0a33482026a1cd3adbdb69e8eaf5019d41ad6e2e1a42f9462c67d651558462d03cfd3b9890d2313626e170d209eeb193f8586a696b3c1c58bd2c013caf3e32bec511d50ee36dafca76604651c142cff8e92cdad01c106553b3368e14534ee7195924b951b55f25ad2f2b344d1b9d05a67d9f2b2e3847374affed1d7d2923ab6cc3d9b6f656ee6e487b97749e97d90482cfef8d00a0f811071e9d4718fb01a2ba1edc5bccd9b61a772c548c27daf7a6cc1f518d5ab73605b747d6f0d7a797ff44525e1dfcb36a779377b963b9c551558adef365610d12ad9ed7388ff87f2b2ec271f52ab5bf8ecd0dd08689115b1077e7518cd29a4be2ec3831d5ba90f1f43e6bee4901f4776fb2e60455d8336c31a5167bf39a5f1d3bbb4b5b67aaa1009ca0306e73ef6b08a92775c92c95ecb4fed3bc1868a3518c2d7033baa779e8ca1b769879dc7ba9a1914cd91be36ca78bdf898a86c68b347b42ebd96aab5ce83f22c1f6521db28d1a5a377d81ea10989331bb6c05e99f3ea2a642aabed7c89359ee9d27f2429e60c686c1d9ec0fd907ce76c5100483e6604b100cc673d2f83dcfdf90c04e3815e24ee2c429fe464311dba2eb5a3e838140d8b77fd6a4cf8155d9a223221020c33c6f9bfb9188945c503439556992c6b22ae6a672601d5a43010001948df73a805d5008c662eec8b20eb3eec5438cd5d5b6e60cfe9ffed48d0625f0ae62e6ceacaa18bb6cc67d04e35f3e633ecaff8a5c598cbb868f176a66f77306fd4e1060330000000000000001bc661301bc393c3d1dbb7eafa2c7f1595fadd9fb8e918e418cb8327d8e3737c348ca04f6681f1915a84e591462f973b01a4141989462a6102f5bdcf49522ea706d98001771c53a96bb52a3ea7ba42aca971c57beb0cdd1a9c39cd3a746fcf8d0e93b03f8a986c17d96a8668caa41ec3b7dd5e26b24316891db618ea3833eba7800003b1671e5e64f68018591258f2162af73b29c71212cc5fc2b10dabcbfade28c184b09f310fd902ede79171e210ada84c70af83d7b775f3513df8e3ca5a0e93182aac23300c0fea57b834c39100db814dc9b86a7a279fc828393bcb58a56c17ea02ab494d5ce68a2f3094e9c3a8577a639f37b42b2f25a02e7f74d7dbadab60f978ce679bb0c2fcc9d0d53cb405f2bc9e55a2819b088fd2119d38e21b1743477e1489fee0969a29e3a5a2f76b750112b29141e1a44d7edc44e0d24db58ca0cc0c02089c7426c2fa953e5232390cac180a08f7b53928e857b4a1bb99b25338df0f6250726a10f5b09fde0a1558cc360e84139945f380b7a93e66683f903dc593241c1eb6cbcd666b4e30b05ed1f7500cf69adefad5298cac0f0e7d5acf3ee24227b1afc1acd62d738fe40cf4ee35e42afbb6b71f5ffa2eb2716b767dbfb32653e93743e31c9ef215c00b60afe78ca07ae8678b6b30fe808a5d644b5b64492326fd44a2e88532be272d10fa72d2f72c4fd8354cfb14f0e780f167f776fea16ae2d77b7a70c19ebc3f94eccc2c60ba4404f56b269f1b6a8fa6793f7b06493fbdbc7bff81add9369c1df312c4be53d85ca0cc9b7fe6c5aa986389fb060fa1b6257d8fccf5106d4ab49e06e30026b568b3e6594396ee142140ce677f5756bd114cbd359929a11298942712b48ac22f2e6dfeaa6ceaae5d2482c69dbe8240f3a305db086adc3f50b61500549cdf40c00a1041aeb547a38f2d0730453c142f7860d6833b74645fd08efcd98294a544a601254801221ee2bc67847e65d169b49bc62ab520ee4f01e06651812d2ddf5652805796eb9d2fbd496f9e9cfc43ec1ad53fd126cb8c4a6256f931b8aeb83c7a7328d4019d1ce7b4eb4dde0a4a33e79892f7f4d8350151b9bea4e0119e4a707ae3a0ae812410e722a9b2a33c30f9d51f655fd164d286cd26175b76cca166f34c3797f78369e813c61b39682879cf6af89f66add4e54491a72d0b916899e1ecb571f99528e08a0935224cd20c588315851994051c68e082293f625e9ec9e7c3f27577aa85f5b4a90a0d77d05e1b24dd972310e7499011f6540bfffac143550b98350229a1ba0b66c9dce6eb49f5b03e4f7850649055391a653cbf3848088260bcea8f0e6cbb16de5e7aff07d3c9a86fe08e39bf03e02f3f24014fa8b834f38a1d9f1133f6a3dc4551e43e4a55467743877976c3223544874baaee99fa56dd4db9bfd3439da6e0263f7a300549895c6ddb566bdab282121f98ba6495c69f1c41e68237ba2cef280c8b8d1b1c41e601318db6e95abca2aa143d9e9d92364139cde6bd87c557ff14b4e0bafe31eb5b8fe0065496884df0d00a83b51d25dfd3a4f1bc2e3c1fd1acb0dfce86a17ada2f1adf0f272fbc145c0b678a23958f93360e0c06941c033fe3c09a0cd10e1c0cb5a8d50b6edb1164dd565e168f850b75c3d26cfe73537ecd9a0874525a914ca0950c1f7449d6e6304accb20e7978b78fa942a86c0686feda194b0e901e2ab6bb9e7131bd7bf23b68543afd9908b86ff1e52f0aa98d2e0428daddc9cdacecc41867fd856fd9a3459024032194cfb041994343cbcbc5fcf8e27b835449a0bb0b4dfa1330dadf312a0bd6b7a28863e79eee362508f5d247da060ee4beaa8133fd66ed2de5625722507e38c69d46905ec1f4f5ba7190ff9df399fff5997d7f1e29488979b6534a7a7bb15633469f1ad4d87eaf293f5eec6e7725e2c808db1ed7130d96b7d9aecf411b08d2cb96d1b61ed19955edf7d2707dd2d69e8f4948b3babac884b7c29d822d62fb77b5d1127b0bb9ea85ce57e4f9b48f7d09e9e79370bcaf3bbb7d7288f26ee5e4ee91e950e4d190e959c535e6aa174c01dfa073522cec94470ae6ca072c2def02c04c18bc21430fad6f87670cf19e6573785405e1b48dc6b5421f4cd8582117ab49dc5f691fb8f968fc9807682c7285baba7403cc7a2b28d224fffaf0162264142a4a7b6b11618a936bd3531f3a79ef600442766bf230053c73b286e5ece4e972c5b917d934cbc255c490cd24a015f0f19a698cbaf5174e24a083a3868dba0a0f791ceb889aed6608968fa21b74edd828316636f8ba54f5076465d9b673c21a050134595dcf82cc40688282ff29960d5e5f11a9e02c2c98e4d83d32919d4223eae1075920bf4c0687432bdd566dc3425bc61943c257825d01e36586f030e3261ee9d70f778f34383c4a09cf972457836cadb584e2c981cbc9be4d24ed44e3111ae8048a918ecf04de5f12e8d68f7ddc7273bdd77364044a56c229602d04c537d001ac85762671f9d67e977089f793908f96b9d7479634d99202e58ccd0698f624f68d0a075b25b809e60d2d4cc753a9665f3932ae5c92e60b906f3078448cd4cf7cf3f017004b51b15305252284a2386924f05aeb37cc792591b78a3d03a3c3f2db2c43d45d1c2a8a2e3487979107191d031b8572c658d1866b07cbbacbcd1faea30b7d1c27b1847511aeb7fe954ee981628107dbbead13e1250477a74e4772ca7edce43807aa845666e77cb74f4233c77ef02e105bf2b54f6202308f051b857ad2c1f927ecce19a50d4e91b947eb040d4897b8a8523c74e997f546d0156596024cabb4caf1ec03ed90f89e5b115d0b70f3d0e5bd8c93b6e5e118c6ada5dcc183f82e924d0fef099b3e2de059d56293b13df5f651c99c316f687e8d51d4306b73ede2ae640e943d71c8f915c4ad3d691ed5db552c6faf721a9771637ce17c2909908c45221d2b991f952ff8088c00ce145eb4028d7eb2dd68018c1c941f077d1ffd6c9ac8f52fd4306d65a4e6e8bc6b4435c7d3e06662c735b17824648e5c68ab98d6b2dce9a089a26886697d11ed92c1193983a23c6f9811c7f24a760e889eeb9e4a3dbe5bc9addf81bcb29a7f8df08cee67c83aaf63974fafd928f4d41c4f679d54aba4ee79f94af0688163482d3ad17c867ce546dd49fef1497bd84298f51b650aa77efb250a6fc6401caa050f956540132eab240795ac17d22c7fa049699b9675079070dc6ea9d763f38709674f7054723620ea5c8536ecf41db013164cc6d5773d307bed8c084bef9da85e11c52c0ffe4f437f04ab8cb009b80792feaeea0869ebc0255a85faab6c6ae0b45174397c901e1f9c2ce81a09637dcd996b9ad65d2359b8d8c66b41577b9e5b53d9ecd102ae6524d2d74e8e177eaee44dba5184d199c844eaebe70e2489f5e39f788fdfcf2968dc72d6070b03f9ffa0cda9ccf9f736f584fa2744d9cb1e9083a33df4bf87a0f65c9d4b0d4c0c0e7583b496e19194a2f2c3890b48b5f3cc1316e72095892fc998c6f202c3e9f85df12786ee9b78b2ab3c4d3cca797cff7d9d05c6177a743c42be523f2bf788a3e4e6ca0f536a1f9e43ec2672449d2be8734fbb7df927385c00f32132b72ae6b83c33336d30aee1ae2aeb3dd6f4fff04bdedfd81f9689fba1923e470fc31a62d3ffa145aabd5a893c7bcf578da15925ccf95b671401901c65ff6951567e1bf6d4f1b322fae4d36370e1a6333ecfbfa75698686d2ab318a8115b891ebcf537c370b21a09ec260ee170c2bf0bbeb8a330c03460f445577a22e80b6d7e3d38c17cae37274349d2fc5379f3bf247c60d0bb5e68c304fa8043fea3935d79df922ad24964075c8a87b32679a5dbcf36475e45b25ed97bbc20f217d12066b9f5a44bd9a31a2840b36fa9aaa6ea8c0f73834e3dc0c96ee4a6f85d22ddd64966948f23faa6564603b4430c781f1a6dd90685715a3102aca6d3c9d3ff02ca4c0f5e75cfbd3fa3de1eb822aa87604273c6b05defc17594e51c3efac42db7c09557e18f00f9511c916c4e67f28d2b3fb71ac7c016e4ea14ca1078b47cdba21b8da6237e9613564e751a18998f258514c84aaf852570a050662e50eb0f77dc7fd83b9e664b18c27e6ea0f8e39648c13d0a723083e9b03da9c0a661601ed518867f6d808a727996bc64f36a90cc17155ef26f2e425f6ab7082b8166c6fae22591986b823a8c37f64c7a06471d00b7f41af73d1ff5fc37527c17c1e8b79e5f8c1debdc26833d47c5669f457dba96c2656e9c8641c658bc2561e9cd83814d1ed98802837b03f6402fcf1e6382b7a17d265c7a253a9d58ca20ff2a77a5090bf26e91b7d45002f11f8394fa30fe5f4aca3e3b90a3d20640019384c1f06f63d12bd58e3fdc6eb557309897355c1ca8c991ea685bc2a5b587ea83886a09b81486b30ef8feff907b404abb15cdd363a919ea18f2d8abc3af926d46521f3e03760ccdb8dcb16869ec7a6ec7a5667da5ec5d3ffcaeb64538e79801cdb2df178bf008f6c8befd0330f25eaa5d920b2f960054bf00c92caa11d2cb804fdee13ffe64c0adf529dabd5bf80bc5c3ec5c666f1f0b6d036d51b09cec8ac3f6777ddb16fb8dcf3c8ea992d36cce468ff186e8781efa817bb45ce9be696a0150461767c0bd3c2d75637eeb45ad666179297829213cc0062ba398e935e8a96db94b18b66c8ebc5c24f0c60325dfaae1f2d13ecfadac1be5787021e3b720dd251cebf56ba168a629d906ed60db616a7da1d1821ca8f6395b4d411fa4280b67b61a5718d17daa6a7624613e6f10e158981a8399dd934fdf41b58d724dca6beb54bb3153f402b4483c77f6ebce774141bf7adc773ee8689398e88c19746881abea02791c94e4fef839f771143bbe70c00025ec1450c5a9661919740ef0bc0d915d24dd3dd9cdebf221c36468f725f3f86ba72993e515528258fbfbf89e51ad93edcead4e57efbd6257bde9920952d9d05df627763006b66916f827e9a2a096b1d59fb81b146cfde2d466b6da94bc8d029fc701471ad676962940599a79905e0ac1ae7114f4768cff8599145656a57e326e1f98010df9d5152b92978dfeab85da550750c2773465dc1aa552ee8ebe40c047ae42a456c47680be75add60a9a6c7453af7593bed05ae49ca98618df2eac3f16ffc3c0e990dba9681e599f53fad2622bcf742aa7086e8b4dee293e1a36c027a2d321bca49cf322ae51244ef0ae0599aa48c73fa6d6fd84fe6c3b138da955bb7b97d0b2d524922a66319667a2dd1ace7031f7090e4a841bcac90cfb34538ee9f6b8d6266310d07699f30cbad9c0e6b94b6ff56791e969384d6b67281e4293faaf929df94b832871cb92045b54ffcc7c5023adae498f40b4eea2911757bed0eb086858d9cfa2d6700d1d3b26a00a0026333888d9989efe9560398f9b557df505e66f8644cf219aa1d9030f1cc0bdbd7bc37ed9631bd219e1cbecc6aa93e66fd3e6b0d06247d8507d0a86180cbe3d5dbaef9f1d6f9f82ddc60788c0a0d1a6230c32c2ef91cfd333cf6a7c779d43a99d2c4650f5722290f4990ea78793aab748bcdb79028b051af04ec630b74d9b4a591d89cf7c3104e73fd6956142a25f2bc37b5b50f61213da35ef154dd4a0790ae9e86cd5d95ccb69c7c2276e050cd61f8d59099e71e330930700a642de6ce47dcca4e35d24cccfe6bf30550ab39895679113b8b610fe0519174e85dbbaec8dd412c6e99bed3e4fc570f9a83114c550e133d26b57e30fb17e48db58d88975495decfeb86f806972d71ab008e14cea5e2c99c456d6f66b3051a463020fab1ef79d7904521bb9f873bc8dfb00e16873c00b7d7d2a0f1f947e26e99aee5f007bb4183959a1b815ec8103f0612159c3d6e170560e7b1c7d3cccd90fccde85b79c20000';

    test('should broadcast transactions', async () => {
      service.transactionFetcher.getSwapsSpentInInputs = jest
        .fn()
        .mockResolvedValue({
          swapsRefunded: [],
          chainSwapsSpent: [],
          reverseSwapsClaimed: [],
        });
      service.transactionFetcher.getSwapsFundedInOutputs = jest
        .fn()
        .mockResolvedValue({
          swapLockups: [],
          chainSwapLockups: [],
        });

      await expect(
        service.broadcastTransaction('L-BTC', lowballTransactionHex),
      ).resolves.toEqual(sendRawTransaction);

      expect(mockSendRawTransaction).toHaveBeenCalledTimes(1);
      expect(mockSendRawTransaction).toHaveBeenCalledWith(
        lowballTransactionHex,
        false,
      );

      expect(
        service.transactionFetcher.getSwapsSpentInInputs,
      ).toHaveBeenCalledTimes(1);
      expect(
        service.transactionFetcher.getSwapsSpentInInputs,
      ).toHaveBeenCalledWith(LiquidTransaction.fromHex(lowballTransactionHex));

      expect(
        service.transactionFetcher.getSwapsFundedInOutputs,
      ).toHaveBeenCalledTimes(1);
      expect(
        service.transactionFetcher.getSwapsFundedInOutputs,
      ).toHaveBeenCalledWith(
        expect.anything(),
        LiquidTransaction.fromHex(lowballTransactionHex),
      );
    });

    test('should detect swap related transactions when Reverse Swaps are being claimed', async () => {
      service.transactionFetcher.getSwapsSpentInInputs = jest
        .fn()
        .mockResolvedValue({
          swapsRefunded: [],
          chainSwapsSpent: [],
          reverseSwapsClaimed: [
            {
              id: 'cheap swap',
            },
          ],
        });

      await expect(
        service.broadcastTransaction('L-BTC', lowballTransactionHex),
      ).resolves.toEqual(sendRawTransaction);

      expect(mockSendRawTransaction).toHaveBeenCalledTimes(1);
      expect(mockSendRawTransaction).toHaveBeenCalledWith(
        lowballTransactionHex,
        true,
      );
    });

    test('should detect swap related transactions when Submarine Swaps are being refunded', async () => {
      service.transactionFetcher.getSwapsSpentInInputs = jest
        .fn()
        .mockResolvedValue({
          chainSwapsSpent: [],
          reverseSwapsClaimed: [],
          swapsRefunded: [{ id: 'i am being refunded' }],
        });

      await expect(
        service.broadcastTransaction('L-BTC', lowballTransactionHex),
      ).resolves.toEqual(sendRawTransaction);

      expect(mockSendRawTransaction).toHaveBeenCalledTimes(1);
      expect(mockSendRawTransaction).toHaveBeenCalledWith(
        lowballTransactionHex,
        true,
      );
    });

    test('should detect swap related transactions when Chain Swaps are being spent', async () => {
      service.transactionFetcher.getSwapsSpentInInputs = jest
        .fn()
        .mockResolvedValue({
          swapsRefunded: [],
          reverseSwapsClaimed: [],
          chainSwapsSpent: [{ id: 'i am being spent' }],
        });

      await expect(
        service.broadcastTransaction('L-BTC', lowballTransactionHex),
      ).resolves.toEqual(sendRawTransaction);

      expect(mockSendRawTransaction).toHaveBeenCalledTimes(1);
      expect(mockSendRawTransaction).toHaveBeenCalledWith(
        lowballTransactionHex,
        true,
      );
    });

    test('should not disable 0-conf for non-lowball lockup transactions', async () => {
      ChainSwapRepository.disableZeroConf = jest.fn();

      service.transactionFetcher.getSwapsFundedInOutputs = jest
        .fn()
        .mockResolvedValue({
          swapLockups: [{ id: 'swap' }],
          chainSwapLockups: [{ id: 'more swaps' }],
        });
      service.transactionFetcher.getSwapsSpentInInputs = jest
        .fn()
        .mockResolvedValue({
          swapsRefunded: [],
          chainSwapsSpent: [],
          reverseSwapsClaimed: [],
        });

      await expect(
        service.broadcastTransaction('L-BTC', nonLowballTransactionHex),
      ).resolves.toEqual(sendRawTransaction);

      expect(SwapRepository.disableZeroConf).toHaveBeenCalledTimes(0);
      expect(ChainSwapRepository.disableZeroConf).toHaveBeenCalledTimes(0);
    });

    test('should detect swap related transactions when Submarine Swaps are being funded', async () => {
      const swapLockups = [{ id: 'lockup' }];

      service.transactionFetcher.getSwapsFundedInOutputs = jest
        .fn()
        .mockResolvedValue({
          swapLockups,
          chainSwapLockups: [],
        });
      service.transactionFetcher.getSwapsSpentInInputs = jest
        .fn()
        .mockResolvedValue({
          swapsRefunded: [],
          chainSwapsSpent: [],
          reverseSwapsClaimed: [],
        });

      await expect(
        service.broadcastTransaction('L-BTC', lowballTransactionHex),
      ).resolves.toEqual(sendRawTransaction);

      expect(mockSendRawTransaction).toHaveBeenCalledTimes(1);
      expect(mockSendRawTransaction).toHaveBeenCalledWith(
        lowballTransactionHex,
        true,
      );

      expect(SwapRepository.disableZeroConf).toHaveBeenCalledTimes(1);
      expect(SwapRepository.disableZeroConf).toHaveBeenCalledWith(swapLockups);
    });

    test('should detect swap related transactions when Chain Swaps are being funded', async () => {
      const chainSwapLockups = [{ id: 'lockup' }];

      service.transactionFetcher.getSwapsFundedInOutputs = jest
        .fn()
        .mockResolvedValue({
          chainSwapLockups,
          swapLockups: [],
        });
      service.transactionFetcher.getSwapsSpentInInputs = jest
        .fn()
        .mockResolvedValue({
          swapsRefunded: [],
          chainSwapsSpent: [],
          reverseSwapsClaimed: [],
        });

      await expect(
        service.broadcastTransaction('L-BTC', lowballTransactionHex),
      ).resolves.toEqual(sendRawTransaction);

      expect(mockSendRawTransaction).toHaveBeenCalledTimes(1);
      expect(mockSendRawTransaction).toHaveBeenCalledWith(
        lowballTransactionHex,
        true,
      );

      expect(ChainSwapRepository.disableZeroConf).toHaveBeenCalledTimes(1);
      expect(ChainSwapRepository.disableZeroConf).toHaveBeenCalledWith(
        chainSwapLockups,
      );
    });

    test('should throw swap timeout error', async () => {
      ChainSwapRepository.disableZeroConf = jest.fn();

      sendRawTransaction = {
        code: -26,
        message:
          'non-mandatory-script-verify-flag (Locktime requirement not satisfied) (code 64)',
      };

      const blockDelta = 1;
      const swap = {
        timeoutBlockHeight: blockchainInfo.blocks + blockDelta,
      };
      service.transactionFetcher.getSwapsSpentInInputs = jest
        .fn()
        .mockResolvedValue({
          swapsRefunded: [swap],
          chainSwapsSpent: [],
          reverseSwapsClaimed: [],
        });

      await expect(
        service.broadcastTransaction('L-BTC', lowballTransactionHex),
      ).rejects.toEqual({
        error: sendRawTransaction.message,
        timeoutBlockHeight: swap.timeoutBlockHeight,
        timeoutEta: Math.round(new Date().getTime() / 1000) + blockDelta * 60,
      });
    });

    test('should bubble up node error when the transaction is not a Submarine refund', async () => {
      ChainSwapRepository.disableZeroConf = jest.fn();

      service.transactionFetcher.getSwapsSpentInInputs = jest
        .fn()
        .mockResolvedValue({
          swapsRefunded: [],
          chainSwapsSpent: [],
          reverseSwapsClaimed: [],
        });

      await expect(
        service.broadcastTransaction('L-BTC', lowballTransactionHex),
      ).rejects.toEqual(sendRawTransaction);

      // Throw other Bitcoin Core errors
      sendRawTransaction = {
        code: 1,
        message: 'test',
      };

      await expect(
        service.broadcastTransaction('L-BTC', lowballTransactionHex),
      ).rejects.toEqual(sendRawTransaction);
    });

    test('should throw when currency cannot be found', async () => {
      const notFound = 'notFound';

      await expect(
        service.broadcastTransaction(notFound, lowballTransactionHex),
      ).rejects.toEqual(Errors.CURRENCY_NOT_FOUND(notFound));

      sendRawTransaction = 'rawTx';
    });
  });

  test('should add referral', async () => {
    const referral = {
      id: 'adsf',
      feeShare: 25,
      routingNode: '03',
    };

    await service.addReferral(referral);

    expect(mockAddReferral).toHaveBeenCalledTimes(1);
    expect(mockAddReferral).toHaveBeenCalledWith(
      expect.objectContaining(referral),
    );

    // Throw if fee share is not in bounds
    referral.feeShare = -1;

    await expect(service.addReferral(referral)).rejects.toEqual(
      new Error('referral fee share must be between 0 and 100'),
    );

    referral.feeShare = 101;

    await expect(service.addReferral(referral)).rejects.toEqual(
      new Error('referral fee share must be between 0 and 100'),
    );

    // Throw if ID is empty
    referral.id = '';

    await expect(service.addReferral(referral)).rejects.toEqual(
      new Error('referral IDs cannot be empty'),
    );
  });

  // TODO: add channel creations
  test('should create swaps', async () => {
    ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue(null);
    mockGetSwapResult = null;
    mockGetReverseSwapResult = null;

    const pair = 'BTC/BTC';
    const orderSide = 'buy';
    const referralId = 'referral';
    const refundPublicKey = getHexBuffer('0xfff');
    const preimageHash = getHexBuffer(
      'ac3703b99248a0a2d948c6021fdd70debb90ab37233e62531c7f900fe3852c89',
    );

    // Create a new swap
    let emittedId = '';

    service.eventHandler.once('swap.update', ({ id, status }) => {
      expect(status).toEqual({ status: SwapUpdateEvent.SwapCreated });
      emittedId = id;
    });

    const webHook: WebHookData = {
      url: 'http',
      hashSwapId: true,
    };

    const response = await service.createSwap({
      webHook,
      orderSide,
      referralId,
      preimageHash,
      refundPublicKey,
      pairId: pair,
      version: SwapVersion.Legacy,
    });

    expect(emittedId).toEqual(response.id);
    expect(response).toEqual({
      referralId,
      id: mockedSwap.id,
      canBeRouted: true,
      address: mockedSwap.address,
      redeemScript: mockedSwap.redeemScript,
      timeoutBlockHeight: mockedSwap.timeoutBlockHeight,
    });

    expect(mockGetSwap).toHaveBeenCalledTimes(1);
    expect(mockGetSwap).toHaveBeenCalledWith({
      preimageHash: getHexString(preimageHash),
    });

    expect(mockCreateSwap).toHaveBeenCalledTimes(1);
    expect(mockCreateSwap).toHaveBeenCalledWith({
      referralId,
      preimageHash,
      refundPublicKey,
      baseCurrency: 'BTC',
      quoteCurrency: 'BTC',
      timeoutBlockDelta: 1,
      orderSide: OrderSide.BUY,
      version: SwapVersion.Legacy,
    });

    expect(sidecar.createWebHook).toHaveBeenCalledTimes(1);
    expect(sidecar.createWebHook).toHaveBeenCalledWith(
      response.id,
      webHook.url,
      webHook.hashSwapId,
      undefined,
    );

    // Throw if swap with preimage exists already
    mockGetSwapResult = {};
    await expect(
      service.createSwap({
        pairId: '',
        orderSide: '',
        version: SwapVersion.Legacy,
        preimageHash: Buffer.alloc(0),
      }),
    ).rejects.toEqual(Errors.SWAP_WITH_PREIMAGE_EXISTS());
  });

  test('should delete swap when adding webhook fails', async () => {
    mockGetSwapResult = null;

    const pair = 'BTC/BTC';
    const orderSide = 'buy';
    const referralId = 'referral';
    const refundPublicKey = getHexBuffer('0xfff');
    const preimageHash = getHexBuffer(
      'fc3703b99248a0a2d948c6021fdd70debb90ab37233e62531c7f900fe3852c89',
    );

    const webHook: WebHookData = {
      url: 'http',
      hashSwapId: true,
    };

    sidecar.createWebHook = jest.fn().mockImplementation(async () => {
      throw 'fail';
    });
    await expect(
      service.createSwap({
        webHook,
        orderSide,
        referralId,
        preimageHash,
        refundPublicKey,
        pairId: pair,
        version: SwapVersion.Legacy,
      }),
    ).rejects.toEqual('setting Webhook failed: fail');

    expect(sidecar.createWebHook).toHaveBeenCalledTimes(1);
    expect(ChannelCreationRepository.getChannelCreation).toHaveBeenCalledTimes(
      1,
    );
    expect(ChannelCreationRepository.getChannelCreation).toHaveBeenCalledWith({
      swapId: mockedSwap.id,
    });
    expect(SwapRepository.getSwap).toHaveBeenCalledTimes(2);
    expect(SwapRepository.getSwap).toHaveBeenCalledWith({ id: mockedSwap.id });
  });

  test('should get swap rates', async () => {
    const id = 'id';

    mockGetSwapResult = {
      rate: 1,
      pair: 'BTC/BTC',
      orderSide: OrderSide.BUY,
      onchainAmount: 1000000,
    };

    const response = await service.getSwapRates(id);

    expect(response).toEqual({
      onchainAmount: mockGetSwapResult.onchainAmount,
      submarineSwap: {
        invoiceAmount: Math.floor(
          (mockGetSwapResult.onchainAmount - mockGetBaseFeeResult) /
            (1 + mockGetPercentageFeeResult),
        ),
      },
    });

    // Throw if onchain amount is not set
    mockGetSwapResult = {};
    await expect(service.getSwapRates(id)).rejects.toEqual(
      Errors.SWAP_NO_LOCKUP(),
    );

    // Throw if the Swap cannot be found
    mockGetSwapResult = undefined;
    await expect(service.getSwapRates(id)).rejects.toEqual(
      Errors.SWAP_NOT_FOUND(id),
    );
  });

  test('should set invoices of swaps', async () => {
    mockGetSwapResult = {
      id: 'invoiceId',
      pair: 'BTC/BTC',
      orderSide: 0,
      version: SwapVersion.Taproot,
      lockupAddress: 'bcrt1qae5nuz2cv7gu2dpps8rwrhsfv6tjkyvpd8hqsu',
    };

    const invoiceAmount = 100_000;
    const invoice = createInvoice(
      undefined,
      undefined,
      undefined,
      invoiceAmount,
    );

    let emittedId = '';

    service.eventHandler.once('swap.update', ({ id, status }) => {
      expect(status).toEqual({ status: SwapUpdateEvent.InvoiceSet });
      emittedId = id;
    });

    const response = await service.setInvoice(mockGetSwapResult.id, invoice);

    expect(emittedId).toEqual(mockGetSwapResult.id);
    expect(response).toEqual({
      acceptZeroConf: true,
      expectedAmount: 100002,
      bip21:
        'bitcoin:bcrt1qae5nuz2cv7gu2dpps8rwrhsfv6tjkyvpd8hqsu?amount=0.00100002&label=Send%20to%20BTC%20lightning',
    });

    expect(mockGetSwap).toHaveBeenCalledTimes(1);
    expect(mockGetSwap).toHaveBeenCalledWith({
      id: mockGetSwapResult.id,
    });

    expect(mockGetFees).toHaveBeenCalledTimes(1);
    expect(mockGetFees).toHaveBeenCalledWith(
      mockGetSwapResult.pair,
      mockGetSwapResult.version,
      1,
      mockGetSwapResult.orderSide,
      invoiceAmount,
      SwapType.Submarine,
      BaseFeeType.NormalClaim,
      null,
    );

    expect(mockAcceptZeroConf).toHaveBeenCalledTimes(1);
    expect(mockAcceptZeroConf).toHaveBeenCalledWith('BTC', invoiceAmount + 2);

    expect(mockSetSwapInvoice).toHaveBeenCalledTimes(1);
    expect(mockSetSwapInvoice).toHaveBeenCalledWith(
      mockGetSwapResult,
      invoice,
      invoiceAmount,
      invoiceAmount + 2,
      1,
      true,
      true,
      expect.anything(),
    );

    // Should execute with valid pair hash (it should just not throw)
    await service.setInvoice(
      mockGetSwapResult.id,
      invoice,
      pairs.get('BTC/BTC')!.hash,
    );

    // Throw when an invalid pair hash is provided
    await expect(
      service.setInvoice(mockGetSwapResult.id, invoice, 'wrongHash'),
    ).rejects.toEqual(Errors.INVALID_PAIR_HASH());
    await expect(
      service.setInvoice(mockGetSwapResult.id, invoice, ''),
    ).rejects.toEqual(Errors.INVALID_PAIR_HASH());

    // Throw if a swap doesn't respect the limits
    const invoiceLimit =
      'lnbcrt1p0xdz2epp59nrc7lqcnw37suzed83e8s33sxl9p0hk4xu6gya9rcxfmnzd8jfsdqqcqzpgsp5228z07nxfghfzf3p2lu7vc03zss8cgklql845yjr990zsa3nj2hq9qy9qsqqpw8n4s5v3w7t9rryccz46f5v0542td098dun4yzfru4saxhd5apcxl5clxn8a70afn7j3e6avvk3s9gn3ypt2revyuh47aftft3kpcpek9lma';
    const invoiceLimitAmount = 0;

    await expect(
      service.setInvoice(mockGetSwapResult.id, invoiceLimit),
    ).rejects.toEqual(Errors.BENEATH_MINIMAL_AMOUNT(invoiceLimitAmount, 1));

    // Throw if swap with id does not exist
    mockGetSwapResult = undefined;
    const notFoundId = 'asdfasdf';

    await expect(service.setInvoice(notFoundId, '')).rejects.toEqual(
      Errors.SWAP_NOT_FOUND(notFoundId),
    );

    // Throw if invoice is already set
    mockGetSwapResult = {
      invoice: 'invoice',
    };

    await expect(service.setInvoice(mockGetSwapResult.id, '')).rejects.toEqual(
      Errors.SWAP_HAS_INVOICE_ALREADY(mockGetSwapResult.id),
    );
  });

  test('should throw when setting expired invoices', async () => {
    mockGetSwapResult = {
      id: 'invoiceId',
      pair: 'BTC/BTC',
      orderSide: 0,
      version: SwapVersion.Taproot,
      lockupAddress: 'bcrt1qae5nuz2cv7gu2dpps8rwrhsfv6tjkyvpd8hqsu',
    };

    const invoice = createInvoice(undefined, getUnixTime() - 100, 1, 100000);
    await expect(
      service.setInvoice(mockGetSwapResult.id, invoice),
    ).rejects.toEqual(SwapErrors.INVOICE_EXPIRED_ALREADY());
  });

  test('should not set swap invoice if it is from one of our nodes', async () => {
    mockGetSwapResult = {
      id: 'swapOurPubkey',
      pair: 'BTC/BTC',
      orderSide: 0,
      lockupAddress: 'bcrt1qae5nuz2cv7gu2dpps8rwrhsfv6tjkyvpd8hqsu',
    };

    const ourPubkey = 'pubkey';
    service['nodeInfo']['pubkeys'].add(ourPubkey);
    decodedInvoice.destination = ourPubkey;

    const invoice =
      'lnbcrt1230n1pjw20v9pp5k4hlsgl93azhjkz5zxs3zsgnvksz2r6yee83av2r2jjncwrc0upsdqqcqzzsxq9z0rgqsp5ce7wh3ff7kz5f8sxfulcp48982gyqy935m6fzvrqr8547kh8rz2s9q8pqqqssq2u68l700shh7gzfeuetugp3h5kh80c40g5tsx7awwruy06309gy4ehwrw2h7vd7cwevc0p60td0wk22p5ldfp84nlueka8ft7kng0lsqwqjjq9';
    await expect(
      service.setInvoice(mockGetSwapResult.id, invoice),
    ).rejects.toEqual(Errors.DESTINATION_BOLTZ_NODE());

    decodedInvoice.destination = undefined;
  });

  test('should not set swap invoice if it is from an un-route-able node', async () => {
    mockGetSwapResult = {
      id: 'swapOurPubkey',
      pair: 'BTC/BTC',
      orderSide: 0,
      lockupAddress: 'bcrt1qae5nuz2cv7gu2dpps8rwrhsfv6tjkyvpd8hqsu',
    };

    const noRouteKey = 'asdf';
    service['nodeInfo']['noRoutes'].set('BTC', new Set([noRouteKey]));
    decodedInvoice.destination = noRouteKey;

    const invoice =
      'lnbcrt1230n1pjw20v9pp5k4hlsgl93azhjkz5zxs3zsgnvksz2r6yee83av2r2jjncwrc0upsdqqcqzzsxq9z0rgqsp5ce7wh3ff7kz5f8sxfulcp48982gyqy935m6fzvrqr8547kh8rz2s9q8pqqqssq2u68l700shh7gzfeuetugp3h5kh80c40g5tsx7awwruy06309gy4ehwrw2h7vd7cwevc0p60td0wk22p5ldfp84nlueka8ft7kng0lsqwqjjq9';
    await expect(
      service.setInvoice(mockGetSwapResult.id, invoice),
    ).rejects.toEqual(LightningErrors.NO_ROUTE());

    decodedInvoice.destination = undefined;
  });

  test('should reject setting AMP invoices swap', async () => {
    mockGetSwapResult = {
      id: 'invoiceId',
      pair: 'BTC/BTC',
      orderSide: 0,
      lockupAddress: 'bcrt1qae5nuz2cv7gu2dpps8rwrhsfv6tjkyvpd8hqsu',
    };

    decodedInvoice.features = new Set<InvoiceFeature>([InvoiceFeature.AMP]);

    const invoice =
      'lnbcrt1230n1pjw20v9pp5k4hlsgl93azhjkz5zxs3zsgnvksz2r6yee83av2r2jjncwrc0upsdqqcqzzsxq9z0rgqsp5ce7wh3ff7kz5f8sxfulcp48982gyqy935m6fzvrqr8547kh8rz2s9q8pqqqssq2u68l700shh7gzfeuetugp3h5kh80c40g5tsx7awwruy06309gy4ehwrw2h7vd7cwevc0p60td0wk22p5ldfp84nlueka8ft7kng0lsqwqjjq9';
    await expect(
      service.setInvoice(mockGetSwapResult.id, invoice),
    ).rejects.toEqual(Errors.AMP_INVOICES_NOT_SUPPORTED());
    expect(mockDecodeInvoice).toHaveBeenCalledTimes(1);
    expect(mockDecodeInvoice).toHaveBeenCalledWith(invoice);

    decodedInvoice.features = new Set<InvoiceFeature>();
  });

  test('should reject setting invoices that expire too soon', async () => {
    mockGetSwapResult = {
      id: 'invoiceId',
      pair: 'BTC/BTC',
      orderSide: 0,
      acceptZeroConfig: false,
      lockupAddress: 'bcrt1qae5nuz2cv7gu2dpps8rwrhsfv6tjkyvpd8hqsu',
    };

    mockAcceptZeroConfResult = false;
    const invoice = createInvoice(undefined, undefined, 1200 - 1);

    await expect(
      service.setInvoice(mockGetSwapResult.id, invoice),
    ).rejects.toEqual(Errors.INVOICE_EXPIRY_TOO_SHORT());

    mockAcceptZeroConfResult = true;
  });

  test('should set invoices with sufficient time left until expiry', async () => {
    mockGetSwapResult = {
      id: 'invoiceId',
      pair: 'BTC/BTC',
      orderSide: 0,
      acceptZeroConfig: false,
      lockupAddress: 'bcrt1qae5nuz2cv7gu2dpps8rwrhsfv6tjkyvpd8hqsu',
    };

    mockAcceptZeroConfResult = false;
    const invoice = createInvoice(undefined, undefined, 1200 + 10);

    await service.setInvoice(mockGetSwapResult.id, invoice);

    mockAcceptZeroConfResult = true;
  });

  // TODO: channel creation logic
  test('should create swaps with invoices', async () => {
    const createSwapResult = {
      id: 'swapInvoice',
      referralId: 'asdf',
      timeoutBlockHeight: 504893,
      address: 'bcrt1qundqmnml8644l23g7cr3fjnksks4nc6mxf4gk9',
      redeemScript: getHexBuffer(
        'a914e3be605a911034ca6fc38ae3a027bf374d37be708763210288ff09ee16a91183fd42afa8329a7b4387e5e61e5c66c6eb43058008c95136c56702fc00b1752103e25b3f3bb7f9978410d52b4c763e3c8fe6d43cf462e91138c5b0f61b92c93d7068ac',
      ),
    };

    const setSwapInvoiceResult = {
      acceptZeroConf: true,
      expectedAmount: 100002,
      bip21:
        'bitcoin:bcrt1qundqmnml8644l23g7cr3fjnksks4nc6mxf4gk9?amount=0.00100002&label=Send%20to%20BTC%20lightning',
    };

    // Inject mocks into the service
    service.createSwap = jest.fn().mockResolvedValue(createSwapResult);
    service['setSwapInvoice'] = jest
      .fn()
      .mockResolvedValue(setSwapInvoiceResult);

    mockGetSwapResult = [
      undefined,
      { pair: 'BTC/BTC', lockupAddress: createSwapResult.address },
    ];

    const pair = 'BTC/BTC';
    const orderSide = 'sell';
    const referralId = 'referral';
    const refundPublicKey = getHexBuffer(
      '02d3727f1c2017adf58295378d02ace4c514666b8d75d4751940b940718ceb34ed',
    );
    const invoice =
      'lnbcrt1m1p0xdry7pp5jadnlr9y5qs5nl93u06v9w2azqr8rf5n09u2wk0c6jktyfxwfpwqdqqcqzpgsp5svss08dmgw9q6emmwfzp74hcs2rq2fu3u78qge5l942al5glzjmq9qy9qsq4v5x0qlfp3fvpm9mrzmmdrptwdrd7gxyaypz4y0g8l8apmzfjgvqtxg9z89y0kg2lh6ykd8czt5ven6nlvr407vdm0mp9l9tvhg33gspv3yr0j';

    const response = await service.createSwapWithInvoice(
      pair,
      orderSide,
      refundPublicKey,
      invoice,
      undefined,
      referralId,
    );

    expect(response).toEqual({
      ...createSwapResult,
      ...setSwapInvoiceResult,
    });

    expect(service.createSwap).toHaveBeenCalledTimes(1);
    expect(service.createSwap).toHaveBeenCalledWith({
      invoice,
      orderSide,
      referralId,
      refundPublicKey,
      pairId: pair,
      version: SwapVersion.Legacy,
      preimageHash: getHexBuffer(
        '975b3f8ca4a02149fcb1e3f4c2b95d100671a6937978a759f8d4acb224ce485c',
      ),
    });

    expect(service['setSwapInvoice']).toHaveBeenCalledTimes(1);
    expect(service['setSwapInvoice']).toHaveBeenCalledWith(
      { pair: 'BTC/BTC', lockupAddress: createSwapResult.address },
      invoice,
      undefined,
      undefined,
    );

    // Throw and remove the database entry if "setSwapInvoice" fails
    const error = {
      message: 'error thrown by Service',
    };

    const mockDestroySwap = jest.fn().mockResolvedValue({});
    const mockDestroyChannelCreation = jest.fn().mockResolvedValue({});
    service['setSwapInvoice'] = jest.fn().mockImplementation(async () => {
      mockGetSwapResult = {
        destroy: mockDestroySwap,
      };
      mockGetChannelCreationResult = {
        destroy: mockDestroyChannelCreation,
      };

      throw error;
    });

    await expect(
      service.createSwapWithInvoice(pair, orderSide, refundPublicKey, invoice),
    ).rejects.toEqual(error);

    expect(mockDestroySwap).toHaveBeenCalledTimes(1);
    expect(mockDestroyChannelCreation).toHaveBeenCalledTimes(1);

    // Throw if swap with invoice exists already
    mockGetSwapResult = {};

    await expect(
      service.createSwapWithInvoice('', '', Buffer.alloc(0), ''),
    ).rejects.toEqual(Errors.SWAP_WITH_INVOICE_EXISTS());
  });

  test('should create reverse swaps', async () => {
    ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue(null);
    mockGetSwapResult = null;
    mockGetReverseSwapResult = null;

    service.allowReverseSwaps = true;

    let pair = 'BTC/BTC';
    const orderSide = 'buy';
    const referralId = 'asdf';
    const invoiceAmount = 100000;
    const description = 'custom message';
    const preimageHash = randomBytes(32);
    const claimPublicKey = getHexBuffer('0xfff');

    const onchainAmount =
      invoiceAmount * (1 - mockGetPercentageFeeResult) - mockGetBaseFeeResult;

    let emittedId = '';

    service.eventHandler.once('swap.update', ({ id, status }) => {
      expect(status).toEqual({ status: SwapUpdateEvent.SwapCreated });
      emittedId = id;
    });

    const webHook: WebHookData = {
      url: 'http',
      hashSwapId: true,
    };
    sidecar.createWebHook = jest.fn();

    const response = await service.createReverseSwap({
      webHook,
      orderSide,
      referralId,
      description,
      preimageHash,
      invoiceAmount,
      claimPublicKey,
      pairId: pair,
      version: SwapVersion.Legacy,
    });

    expect(emittedId).toEqual(response.id);
    expect(response).toEqual({
      referralId,
      onchainAmount,
      id: mockedReverseSwap.id,
      invoice: mockedReverseSwap.invoice,
      redeemScript: mockedReverseSwap.redeemScript,
      lockupAddress: mockedReverseSwap.lockupAddress,
      timeoutBlockHeight: mockedReverseSwap.timeoutBlockHeight,
    });

    expect(mockGetPercentageFee).toHaveBeenCalledTimes(1);
    expect(mockGetPercentageFee).toHaveBeenCalledWith(
      pair,
      OrderSide.BUY,
      SwapType.ReverseSubmarine,
      PercentageFeeType.Calculation,
      null,
    );

    expect(mockGetBaseFee).toHaveBeenCalledTimes(1);
    expect(mockGetBaseFee).toHaveBeenCalledWith(
      'BTC',
      SwapVersion.Legacy,
      BaseFeeType.ReverseLockup,
    );

    expect(mockCreateReverseSwap).toHaveBeenCalledTimes(1);
    expect(mockCreateReverseSwap).toHaveBeenCalledWith({
      referralId,
      preimageHash,
      onchainAmount,
      claimPublicKey,
      memo: description,
      baseCurrency: 'BTC',
      quoteCurrency: 'BTC',
      claimCovenant: false,
      orderSide: OrderSide.BUY,
      onchainTimeoutBlockDelta: 1,
      version: SwapVersion.Legacy,
      lightningTimeoutBlockDelta: 16,
      holdInvoiceAmount: invoiceAmount,
      percentageFee: invoiceAmount * mockGetPercentageFeeResult,
    });

    expect(sidecar.createWebHook).toHaveBeenCalledTimes(1);
    expect(sidecar.createWebHook).toHaveBeenCalledWith(
      mockedReverseSwap.id,
      webHook.url,
      webHook.hashSwapId,
      undefined,
    );

    // Should add a 10% buffer to the lightning timeout block delta for cross chain swaps
    pair = 'LTC/BTC';
    const pairRate = 1 / pairs.get(pair)!.rate;
    const percentageFee = invoiceAmount * pairRate * mockGetPercentageFeeResult;

    await service.createReverseSwap({
      orderSide,
      preimageHash,
      invoiceAmount,
      claimPublicKey,
      pairId: pair,
      version: SwapVersion.Legacy,
    });

    expect(mockCreateReverseSwap).toHaveBeenCalledTimes(2);
    expect(mockCreateReverseSwap).toHaveBeenNthCalledWith(2, {
      preimageHash,
      percentageFee,
      claimPublicKey,
      baseCurrency: 'LTC',
      quoteCurrency: 'BTC',
      claimCovenant: false,
      orderSide: OrderSide.BUY,
      version: SwapVersion.Legacy,
      onchainTimeoutBlockDelta: 160,
      lightningTimeoutBlockDelta: 50,
      holdInvoiceAmount: invoiceAmount,
      onchainAmount:
        invoiceAmount * pairRate - percentageFee - mockGetBaseFeeResult,
    });

    pair = 'BTC/BTC';

    // Should execute with valid pair hash (it should just not throw)
    await service.createReverseSwap({
      orderSide,
      preimageHash,
      invoiceAmount,
      claimPublicKey,
      pairId: pair,
      version: SwapVersion.Legacy,
      pairHash: pairs.get(pair)!.hash,
    });

    // Throw when an invalid pair hash is provided
    await expect(
      service.createReverseSwap({
        orderSide,
        preimageHash,
        invoiceAmount,
        claimPublicKey,
        pairId: pair,
        pairHash: 'wrongHash',
        version: SwapVersion.Legacy,
      }),
    ).rejects.toEqual(Errors.INVALID_PAIR_HASH());
    await expect(
      service.createReverseSwap({
        orderSide,
        preimageHash,
        invoiceAmount,
        claimPublicKey,
        pairId: pair,
        pairHash: '',
        version: SwapVersion.Legacy,
      }),
    ).rejects.toEqual(Errors.INVALID_PAIR_HASH());

    // Throw if the onchain amount is less than 1
    await expect(
      service.createReverseSwap({
        orderSide,
        preimageHash,
        claimPublicKey,
        pairId: pair,
        invoiceAmount: 1,
        version: SwapVersion.Legacy,
      }),
    ).rejects.toEqual(Errors.ONCHAIN_AMOUNT_TOO_LOW());

    // Throw if a reverse swaps doesn't respect the limits
    const invoiceAmountLimit = 0;

    await expect(
      service.createReverseSwap({
        orderSide,
        preimageHash,
        claimPublicKey,
        pairId: pair,
        version: SwapVersion.Legacy,
        invoiceAmount: invoiceAmountLimit,
      }),
    ).rejects.toEqual(Errors.BENEATH_MINIMAL_AMOUNT(invoiceAmountLimit, 1));

    // Throw if reverse swaps are disabled
    service.allowReverseSwaps = false;

    await expect(
      service.createReverseSwap({
        orderSide,
        preimageHash,
        invoiceAmount,
        claimPublicKey,
        pairId: pair,
        version: SwapVersion.Legacy,
      }),
    ).rejects.toEqual(Errors.REVERSE_SWAPS_DISABLED());

    service.allowReverseSwaps = true;

    const invalidNumber = 3.141;

    // Throw if invoice amount is not a whole number
    await expect(
      service.createReverseSwap({
        orderSide,
        preimageHash,
        claimPublicKey,
        pairId: pair,
        version: SwapVersion.Legacy,
        invoiceAmount: invalidNumber,
      }),
    ).rejects.toEqual(Errors.NOT_WHOLE_NUMBER(invalidNumber));

    // Throw if onchain amount is not a whole number
    await expect(
      service.createReverseSwap({
        orderSide,
        preimageHash,
        claimPublicKey,
        pairId: pair,
        onchainAmount: invalidNumber,
        version: SwapVersion.Legacy,
      }),
    ).rejects.toEqual(Errors.NOT_WHOLE_NUMBER(invalidNumber));
  });

  test('should delete reverse swap when adding webhook fails', async () => {
    const pair = 'BTC/BTC';
    const orderSide = 'buy';
    const referralId = 'asdf';
    const invoiceAmount = 100000;
    const description = 'custom message';
    const preimageHash = randomBytes(32);
    const claimPublicKey = getHexBuffer('0xfff');

    const webHook: WebHookData = {
      url: 'http',
      hashSwapId: true,
    };
    sidecar.createWebHook = jest.fn();

    sidecar.createWebHook = jest.fn().mockImplementation(async () => {
      throw 'fail';
    });
    await expect(
      service.createReverseSwap({
        webHook,
        orderSide,
        referralId,
        description,
        preimageHash,
        invoiceAmount,
        claimPublicKey,
        pairId: pair,
        version: SwapVersion.Legacy,
      }),
    ).rejects.toEqual('setting Webhook failed: fail');

    expect(sidecar.createWebHook).toHaveBeenCalledTimes(1);
    expect(ReverseRoutingHintRepository.getHint).toHaveBeenCalledTimes(1);
    expect(ReverseRoutingHintRepository.getHint).toHaveBeenCalledWith(
      mockedReverseSwap.id,
    );
    expect(ReverseSwapRepository.getReverseSwap).toHaveBeenCalledTimes(2);
    expect(ReverseSwapRepository.getReverseSwap).toHaveBeenCalledWith({
      id: mockedReverseSwap.id,
    });
  });

  test('should not create Reverse Swaps with reused preiamge hash', async () => {
    mockGetReverseSwapResult = { id: 'something' };

    const preimageHash = randomBytes(32);
    await expect(
      service.createReverseSwap({
        preimageHash,
      } as any),
    ).rejects.toEqual(Errors.SWAP_WITH_PREIMAGE_EXISTS());

    expect(ReverseSwapRepository.getReverseSwap).toHaveBeenCalledTimes(1);
    expect(ReverseSwapRepository.getReverseSwap).toHaveBeenCalledWith({
      preimageHash: getHexString(preimageHash),
    });

    mockGetReverseSwapResult = null;
  });

  test('should create Reverse Swaps with referral IDs', async () => {
    const pair = 'BTC/BTC';
    const orderSide = 'buy';
    const invoiceAmount = 100000;
    const referralId = 'referral';
    const preimageHash = randomBytes(32);
    const claimPublicKey = getHexBuffer('0xfff');

    const onchainAmount =
      invoiceAmount * (1 - mockGetPercentageFeeResult) - mockGetBaseFeeResult;

    await service.createReverseSwap({
      orderSide,
      referralId,
      preimageHash,
      invoiceAmount,
      claimPublicKey,
      pairId: pair,
      version: SwapVersion.Legacy,
    });

    expect(mockCreateReverseSwap).toHaveBeenCalledWith({
      referralId,
      preimageHash,
      onchainAmount,
      claimPublicKey,
      baseCurrency: 'BTC',
      quoteCurrency: 'BTC',
      claimCovenant: false,
      orderSide: OrderSide.BUY,
      onchainTimeoutBlockDelta: 1,
      version: SwapVersion.Legacy,
      lightningTimeoutBlockDelta: 16,
      holdInvoiceAmount: invoiceAmount,
      percentageFee: invoiceAmount * mockGetPercentageFeeResult,
    });
  });

  test('should create Reverse Swaps with specified onchain amount', async () => {
    service.allowReverseSwaps = true;

    const pair = 'BTC/BTC';
    const orderSide = 'buy';
    const onchainAmount = 97680;
    const preimageHash = randomBytes(32);
    const claimPublicKey = getHexBuffer('0xfff');

    const invoiceAmount =
      (onchainAmount + mockGetBaseFeeResult) / (1 - mockGetPercentageFeeResult);
    const percentageFee = invoiceAmount * mockGetPercentageFeeResult;

    await service.createReverseSwap({
      orderSide,
      preimageHash,
      onchainAmount,
      claimPublicKey,
      pairId: pair,
      version: SwapVersion.Legacy,
    });

    expect(mockCreateReverseSwap).toHaveBeenCalledWith({
      preimageHash,
      onchainAmount,
      percentageFee,
      claimPublicKey,
      baseCurrency: 'BTC',
      quoteCurrency: 'BTC',
      claimCovenant: false,
      orderSide: OrderSide.BUY,
      version: SwapVersion.Legacy,
      holdInvoiceAmount: invoiceAmount,
      onchainTimeoutBlockDelta: expect.anything(),
      lightningTimeoutBlockDelta: expect.anything(),
    });
  });

  test('should create prepay miner fee reverse swaps', async () => {
    service['prepayMinerFee'] = true;

    const pair = 'BTC/BTC';
    const orderSide = 'buy';
    const invoiceAmount = 100000;
    const onchainAmount =
      invoiceAmount * (1 - mockGetPercentageFeeResult) - mockGetBaseFeeResult;
    const preimageHash = randomBytes(32);
    const claimPublicKey = getHexBuffer('0xfff');

    const response = await service.createReverseSwap({
      orderSide,
      preimageHash,
      invoiceAmount,
      claimPublicKey,
      pairId: pair,
      version: SwapVersion.Legacy,
    });

    expect(response).toEqual({
      onchainAmount,
      id: mockedReverseSwap.id,
      invoice: mockedReverseSwap.invoice,
      redeemScript: mockedReverseSwap.redeemScript,
      lockupAddress: mockedReverseSwap.lockupAddress,
      minerFeeInvoice: mockedReverseSwap.minerFeeInvoice,
      timeoutBlockHeight: mockedReverseSwap.timeoutBlockHeight,
    });

    expect(mockCreateReverseSwap).toHaveBeenCalledTimes(1);
    expect(mockCreateReverseSwap).toHaveBeenCalledWith({
      preimageHash,
      onchainAmount,
      claimPublicKey,
      baseCurrency: 'BTC',
      quoteCurrency: 'BTC',
      claimCovenant: false,
      orderSide: OrderSide.BUY,
      onchainTimeoutBlockDelta: 1,
      version: SwapVersion.Legacy,
      lightningTimeoutBlockDelta: 16,
      prepayMinerFeeInvoiceAmount: mockGetBaseFeeResult,
      holdInvoiceAmount: invoiceAmount - mockGetBaseFeeResult,
      percentageFee: invoiceAmount * mockGetPercentageFeeResult,
    });

    service['prepayMinerFee'] = false;
  });

  test('should create Reverse Swaps with Ethereum prepay miner fee', async () => {
    const args = {
      pairId: 'ETH/BTC',
      orderSide: 'buy',
      prepayMinerFee: true,
      invoiceAmount: 100000,
      preimageHash: randomBytes(32),
      claimAddress: '0x00000000219ab540356cbb839cbe05303d7705fa',
    } as any;

    const response = await service.createReverseSwap(args);

    const pairRate = 1 / pairs.get(args.pairId)!.rate;
    const percentageFee = Math.ceil(
      pairRate * args.invoiceAmount * mockGetPercentageFeeResult,
    );
    const onchainAmount =
      Math.floor(
        pairRate * args.invoiceAmount - percentageFee - mockGetBaseFeeResult,
      ) - response.prepayMinerFeeAmount!;

    const prepayMinerFeeOnchainAmount = Number(
      (ethereumPrepayMinerFeeGasLimit *
        (await service['getGasPrice'](currencies.get('ETH')!.provider!))) /
        etherDecimals,
    );
    const prepayMinerFeeInvoiceAmount =
      prepayMinerFeeOnchainAmount * (1 / pairRate);

    expect(response).toEqual({
      onchainAmount,
      id: mockedReverseSwap.id,
      invoice: mockedReverseSwap.invoice,
      redeemScript: mockedReverseSwap.redeemScript,
      lockupAddress: mockedReverseSwap.lockupAddress,
      prepayMinerFeeAmount: prepayMinerFeeOnchainAmount,
      minerFeeInvoice: mockedReverseSwap.minerFeeInvoice,
      timeoutBlockHeight: mockedReverseSwap.timeoutBlockHeight,
    });

    expect(mockCalculateRate).toHaveBeenCalledTimes(1);
    expect(mockCalculateRate).toHaveBeenCalledWith('ETH', 'BTC');

    expect(mockCreateReverseSwap).toHaveBeenCalledTimes(1);
    expect(mockCreateReverseSwap).toHaveBeenCalledWith({
      onchainAmount,
      percentageFee,
      prepayMinerFeeOnchainAmount,
      prepayMinerFeeInvoiceAmount,
      baseCurrency: 'ETH',
      quoteCurrency: 'BTC',
      claimCovenant: false,
      orderSide: OrderSide.BUY,
      onchainTimeoutBlockDelta: 900,
      lightningTimeoutBlockDelta: 23,
      claimAddress: args.claimAddress,
      preimageHash: args.preimageHash,
      holdInvoiceAmount: args.invoiceAmount - prepayMinerFeeInvoiceAmount,
    });

    // Throw if the sending currency is Bitcoin like
    args.pairId = 'BTC/BTC';
    args.claimPublicKey =
      '03ecb98dc3f82af3efac152f3c5692548754df047042dcb89620fc72fd3ea479ab';

    await expect(service.createReverseSwap(args)).rejects.toEqual(
      ApiErrors.UNSUPPORTED_PARAMETER('BTC', 'prepayMinerFee'),
    );
  });

  test('should create Reverse Swaps with Ethereum prepay miner fee and specified onchain amount', async () => {
    const args = {
      pairId: 'ETH/BTC',
      orderSide: 'buy',
      prepayMinerFee: true,
      onchainAmount: 3200000000,
      preimageHash: randomBytes(32),
      claimAddress: '0x00000000219ab540356cbb839cbe05303d7705fa',
    } as any;

    await service.createReverseSwap(args);

    const pairRate = 1 / pairs.get(args.pairId)!.rate;
    const invoiceAmount = Math.ceil(
      (args.onchainAmount + mockGetBaseFeeResult) /
        pairRate /
        (1 - mockGetPercentageFeeResult),
    );

    const prepayMinerFeeOnchainAmount = Number(
      (ethereumPrepayMinerFeeGasLimit * mockGetFeeDataResult.gasPrice) /
        etherDecimals,
    );
    const prepayMinerFeeInvoiceAmount =
      prepayMinerFeeOnchainAmount * (1 / pairRate);

    expect(mockCreateReverseSwap).toHaveBeenCalledWith({
      prepayMinerFeeOnchainAmount,
      prepayMinerFeeInvoiceAmount,
      baseCurrency: 'ETH',
      quoteCurrency: 'BTC',
      claimCovenant: false,
      orderSide: OrderSide.BUY,
      claimAddress: args.claimAddress,
      preimageHash: args.preimageHash,
      holdInvoiceAmount: invoiceAmount,
      onchainAmount: args.onchainAmount,
      onchainTimeoutBlockDelta: expect.anything(),
      lightningTimeoutBlockDelta: expect.anything(),
      percentageFee: Math.ceil(
        invoiceAmount * pairRate * mockGetPercentageFeeResult,
      ),
    });
  });

  describe('sendCoins', () => {
    test('should send BTC', async () => {
      const fee = 3;
      const amount = 1;
      const symbol = 'BTC';
      const label = 'send some sats';
      const address = 'bcrt1qmv7axanlc090h2j79ufg530eaw88w8rfglnjl3';

      await expect(
        service.sendCoins({
          fee,
          label,
          amount,
          symbol,
          address,
        }),
      ).resolves.toEqual({
        vout: mockTransaction.vout,
        transaction: expect.anything(),
        transactionId: mockTransaction.transaction.getId(),
      });

      expect(mockSendToAddress).toHaveBeenCalledTimes(1);
      expect(mockSendToAddress).toHaveBeenCalledWith(
        address,
        amount,
        fee,
        label,
      );
    });

    test('should sweep BTC', async () => {
      const fee = 3;
      const amount = 1;
      const symbol = 'BTC';
      const label = 'sweep  some sats';
      const address = 'bcrt1qmv7axanlc090h2j79ufg530eaw88w8rfglnjl3';

      await expect(
        service.sendCoins({
          fee,
          label,
          amount,
          symbol,
          address,
          sendAll: true,
        }),
      ).resolves.toEqual({
        vout: mockTransaction.vout,
        transaction: expect.anything(),
        transactionId: mockTransaction.transaction.getId(),
      });

      expect(mockSweepWallet).toHaveBeenCalledTimes(1);
      expect(mockSweepWallet).toHaveBeenCalledWith(address, fee, label);
    });

    test('should send Ether', async () => {
      const fee = 3;
      const amount = 2;
      const symbol = 'ETH';
      const label = 'send some WEI';
      const address = '0x0000000000000000000000000000000000000000';

      const response = await service.sendCoins({
        fee,
        label,
        amount,
        symbol,
        address,
      });

      expect(response).toEqual({
        transactionId: etherTransaction.transactionId,
      });

      expect(mockSendEther).toHaveBeenCalledTimes(1);
      expect(mockSendEther).toHaveBeenCalledWith(address, amount, fee, label);
    });

    test('should send ERC20 tokens', async () => {
      const fee = 3;
      const amount = 2;
      const symbol = 'TRC';
      const label = 'send some tokens';
      const address = '0x0000000000000000000000000000000000000000';

      const response = await service.sendCoins({
        fee,
        label,
        amount,
        symbol,
        address,
      });

      expect(response).toEqual({
        transactionId: tokenTransaction.transactionId,
      });

      expect(mockSendToken).toHaveBeenCalledTimes(1);
      expect(mockSendToken).toHaveBeenCalledWith(address, amount, fee, label);
    });

    test('should throw of currency to send cannot be found', async () => {
      const notFound = 'notFound';

      expect(() =>
        service.sendCoins({
          fee: 0,
          amount: 0,
          label: 'no',
          address: '',
          sendAll: false,
          symbol: notFound,
        }),
      ).toThrow(Errors.CURRENCY_NOT_FOUND(notFound).message);
    });
  });

  test('should get gas price', async () => {
    await expect(
      service['getGasPrice'](currencies.get('ETH')!.provider!),
    ).resolves.toEqual(mockGetFeeDataResult.gasPrice);

    mockGetFeeDataResult.maxFeePerGas = mockGetFeeDataResult.gasPrice;
    mockGetFeeDataResult.maxFeePerGas += BigInt(1);
    await expect(
      service['getGasPrice'](currencies.get('ETH')!.provider!),
    ).resolves.toEqual(mockGetFeeDataResult.gasPrice);

    mockGetFeeDataResult.gasPrice = undefined;
    await expect(
      service['getGasPrice'](currencies.get('ETH')!.provider!),
    ).resolves.toEqual(mockGetFeeDataResult.maxFeePerGas);
  });

  test('should get referral IDs', async () => {
    const getReferralId = service['getReferralId'];

    const id = 'id';
    const routingNode = '03';

    expect(await getReferralId(id)).toEqual(id);
    expect(await getReferralId(id, routingNode)).toEqual(id);

    referralByRoutingNode = { id };
    expect(await getReferralId(undefined, routingNode)).toEqual(id);

    expect(mockGetReferralByRoutingNode).toHaveBeenCalledTimes(1);
    expect(mockGetReferralByRoutingNode).toHaveBeenCalledWith(routingNode);
  });

  describe('verifyAmount', () => {
    const pair = 'test/pair';
    const verifyAmount = service['verifyAmount'];

    describe('legacy', () => {
      const rate = 2;

      test.each`
        amount | side
        ${2.5} | ${OrderSide.BUY}
        ${5}   | ${OrderSide.BUY}
        ${5}   | ${OrderSide.SELL}
        ${10}  | ${OrderSide.SELL}
      `(
        'should not throw when submarine amount is in bounds',
        ({ amount, side }) => {
          verifyAmount(
            pair,
            rate,
            amount,
            side,
            SwapVersion.Legacy,
            SwapType.Submarine,
          );
        },
      );

      test.each`
        amount    | side              | error
        ${1.5}    | ${OrderSide.BUY}  | ${Errors.BENEATH_MINIMAL_AMOUNT(3, 5)}
        ${2}      | ${OrderSide.BUY}  | ${Errors.BENEATH_MINIMAL_AMOUNT(4, 5)}
        ${4}      | ${OrderSide.SELL} | ${Errors.BENEATH_MINIMAL_AMOUNT(4, 5)}
        ${11}     | ${OrderSide.SELL} | ${Errors.EXCEED_MAXIMAL_AMOUNT(11, 10)}
        ${5.5}    | ${OrderSide.BUY}  | ${Errors.EXCEED_MAXIMAL_AMOUNT(11, 10)}
        ${21_000} | ${OrderSide.SELL} | ${Errors.EXCEED_MAXIMAL_AMOUNT(21_000, 10)}
      `(
        'should throw when submarine amount is out of bounds',
        async ({ amount, side, error }) => {
          await expect(
            verifyAmount(
              pair,
              rate,
              amount,
              side,
              SwapVersion.Legacy,
              SwapType.Submarine,
            ),
          ).rejects.toEqual(error);
        },
      );

      test.each`
        amount | side
        ${2.5} | ${OrderSide.SELL}
        ${5}   | ${OrderSide.SELL}
        ${5}   | ${OrderSide.BUY}
        ${10}  | ${OrderSide.BUY}
      `(
        'should not throw when reverse amount is in bounds',
        ({ amount, side }) => {
          verifyAmount(
            pair,
            rate,
            amount,
            side,
            SwapVersion.Legacy,
            SwapType.ReverseSubmarine,
          );
        },
      );

      test.each`
        amount    | side              | error
        ${1.5}    | ${OrderSide.SELL} | ${Errors.BENEATH_MINIMAL_AMOUNT(3, 5)}
        ${2}      | ${OrderSide.SELL} | ${Errors.BENEATH_MINIMAL_AMOUNT(4, 5)}
        ${4}      | ${OrderSide.BUY}  | ${Errors.BENEATH_MINIMAL_AMOUNT(4, 5)}
        ${11}     | ${OrderSide.BUY}  | ${Errors.EXCEED_MAXIMAL_AMOUNT(11, 10)}
        ${5.5}    | ${OrderSide.SELL} | ${Errors.EXCEED_MAXIMAL_AMOUNT(11, 10)}
        ${21_000} | ${OrderSide.BUY}  | ${Errors.EXCEED_MAXIMAL_AMOUNT(21_000, 10)}
      `(
        'should throw when reverse amount is out of bounds',
        async ({ amount, side, error }) => {
          await expect(
            verifyAmount(
              pair,
              rate,
              amount,
              side,
              SwapVersion.Legacy,
              SwapType.ReverseSubmarine,
            ),
          ).rejects.toEqual(error);
        },
      );
    });

    describe('submarine', () => {
      test.each`
        amount
        ${1}
        ${21_00}
        ${500_000}
        ${1_000_000}
      `('should not throw when amount is in bounds', ({ amount }) => {
        verifyAmount(
          'BTC/BTC',
          1,
          amount,
          OrderSide.BUY,
          SwapVersion.Taproot,
          SwapType.Submarine,
        );
      });

      test.each`
        amount                     | error
        ${-1}                      | ${Errors.BENEATH_MINIMAL_AMOUNT(-1, 1)}
        ${0}                       | ${Errors.BENEATH_MINIMAL_AMOUNT(0, 1)}
        ${1_000_001}               | ${Errors.EXCEED_MAXIMAL_AMOUNT(1_000_001, 1_000_000)}
        ${Number.MAX_SAFE_INTEGER} | ${Errors.EXCEED_MAXIMAL_AMOUNT(Number.MAX_SAFE_INTEGER, 1_000_000)}
      `(
        'should throw when amount is out of bounds',
        async ({ amount, side, error }) => {
          await expect(
            verifyAmount(
              'BTC/BTC',
              1,
              amount,
              side,
              SwapVersion.Taproot,
              SwapType.Submarine,
            ),
          ).rejects.toEqual(error);
        },
      );
    });

    describe('reverse', () => {
      test.each`
        amount
        ${2}
        ${21_00}
        ${500_000}
        ${2_000_000}
      `('should not throw when amount is in bounds', ({ amount }) => {
        verifyAmount(
          'BTC/BTC',
          1,
          amount,
          OrderSide.BUY,
          SwapVersion.Taproot,
          SwapType.ReverseSubmarine,
        );
      });

      test.each`
        amount                     | error
        ${-1}                      | ${Errors.BENEATH_MINIMAL_AMOUNT(-1, 2)}
        ${0}                       | ${Errors.BENEATH_MINIMAL_AMOUNT(0, 2)}
        ${1}                       | ${Errors.BENEATH_MINIMAL_AMOUNT(1, 2)}
        ${2_000_001}               | ${Errors.EXCEED_MAXIMAL_AMOUNT(2_000_001, 2_000_000)}
        ${Number.MAX_SAFE_INTEGER} | ${Errors.EXCEED_MAXIMAL_AMOUNT(Number.MAX_SAFE_INTEGER, 2_000_000)}
      `(
        'should throw when amount is out of bounds',
        async ({ amount, side, error }) => {
          await expect(
            verifyAmount(
              'BTC/BTC',
              1,
              amount,
              side,
              SwapVersion.Taproot,
              SwapType.ReverseSubmarine,
            ),
          ).rejects.toEqual(error);
        },
      );
    });

    describe('chain', () => {
      test.each`
        amount
        ${50_000}
        ${210_000}
        ${500_000}
        ${5_000_000}
      `('should not throw when amount is in bounds', ({ amount }) => {
        verifyAmount(
          'BTC/BTC',
          1,
          amount,
          OrderSide.BUY,
          SwapVersion.Taproot,
          SwapType.Chain,
        );
      });

      test.each`
        amount                     | error
        ${-1}                      | ${Errors.BENEATH_MINIMAL_AMOUNT(-1, 50_000)}
        ${0}                       | ${Errors.BENEATH_MINIMAL_AMOUNT(0, 50_000)}
        ${1}                       | ${Errors.BENEATH_MINIMAL_AMOUNT(1, 50_000)}
        ${49_999}                  | ${Errors.BENEATH_MINIMAL_AMOUNT(49_999, 50_000)}
        ${5_000_001}               | ${Errors.EXCEED_MAXIMAL_AMOUNT(5_000_001, 5_000_000)}
        ${Number.MAX_SAFE_INTEGER} | ${Errors.EXCEED_MAXIMAL_AMOUNT(Number.MAX_SAFE_INTEGER, 5_000_000)}
      `(
        'should throw when amount is out of bounds',
        async ({ amount, side, error }) => {
          await expect(
            verifyAmount(
              'BTC/BTC',
              1,
              amount,
              side,
              SwapVersion.Taproot,
              SwapType.Chain,
            ),
          ).rejects.toEqual(error);
        },
      );
    });

    test('should throw when pair cannot be found', async () => {
      const notFound = 'notFound';

      await expect(
        verifyAmount(
          notFound,
          0,
          0,
          OrderSide.BUY,
          SwapVersion.Legacy,
          SwapType.Submarine,
        ),
      ).rejects.toEqual(Errors.PAIR_NOT_FOUND(notFound));
    });
  });

  describe('addWebHook', () => {
    test('should add webhook', async () => {
      sidecar.createWebHook = jest.fn();

      const id = 'asdf';
      const data: WebHookData = {
        url: 'http',
        hashSwapId: true,
        status: [SwapUpdateEvent.SwapCreated],
      };
      const callback = jest.fn();

      await service['addWebHook'](id, data, callback);

      expect(sidecar.createWebHook).toHaveBeenCalledTimes(1);
      expect(sidecar.createWebHook).toHaveBeenCalledWith(
        id,
        data.url,
        data.hashSwapId,
        data.status,
      );

      expect(callback).not.toHaveBeenCalled();
    });

    test('should call swap deletion function when adding webhook fails', async () => {
      const id = 'asdf';
      const data: WebHookData = {
        url: 'http',
        hashSwapId: true,
      };
      const callback = jest.fn();

      sidecar.createWebHook = jest.fn().mockImplementation(async () => {
        throw 'fail';
      });
      await expect(service['addWebHook'](id, data, callback)).rejects.toEqual(
        'setting Webhook failed: fail',
      );

      expect(sidecar.createWebHook).toHaveBeenCalledTimes(1);
      expect(sidecar.createWebHook).toHaveBeenCalledWith(
        id,
        data.url,
        data.hashSwapId,
        undefined,
      );

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  test('should calculate invoice amounts', () => {
    const calculateInvoiceAmount = service['calculateInvoiceAmount'];

    expect(
      calculateInvoiceAmount(OrderSide.BUY, 1, 1000000, 210, 0.02),
    ).toEqual(980186);
    expect(
      calculateInvoiceAmount(OrderSide.SELL, 1, 1000000, 210, 0.02),
    ).toEqual(980186);

    expect(
      calculateInvoiceAmount(OrderSide.BUY, 0.005, 1000000, 120, 0.05),
    ).toEqual(190453333);
    expect(
      calculateInvoiceAmount(OrderSide.SELL, 0.005, 1000000, 120, 0.05),
    ).toEqual(4761);
  });

  describe('getPair', () => {
    const getPair = service['getPair'];

    test.each`
      side              | type
      ${OrderSide.BUY}  | ${SwapType.Submarine}
      ${OrderSide.BUY}  | ${SwapType.ReverseSubmarine}
      ${OrderSide.BUY}  | ${SwapType.Chain}
      ${OrderSide.SELL} | ${SwapType.Submarine}
      ${OrderSide.SELL} | ${SwapType.ReverseSubmarine}
      ${OrderSide.SELL} | ${SwapType.Chain}
    `('should get legacy pair', async ({ side, type }) => {
      await expect(
        getPair('BTC/BTC', side, SwapVersion.Legacy, type),
      ).resolves.toEqual({
        base: 'BTC',
        quote: 'BTC',
        referral: null,
        ...pairs.get('BTC/BTC'),
      });
    });

    test.each`
      side              | type                         | expected
      ${OrderSide.BUY}  | ${SwapType.Submarine}        | ${pairsTaprootSubmarine.get('BTC')!.get('BTC')}
      ${OrderSide.BUY}  | ${SwapType.ReverseSubmarine} | ${pairsTaprootReverse.get('BTC')!.get('BTC')}
      ${OrderSide.BUY}  | ${SwapType.Chain}            | ${pairsTaprootChain.get('BTC')!.get('BTC')}
      ${OrderSide.SELL} | ${SwapType.Submarine}        | ${pairsTaprootSubmarine.get('BTC')!.get('BTC')}
      ${OrderSide.SELL} | ${SwapType.ReverseSubmarine} | ${pairsTaprootReverse.get('BTC')!.get('BTC')}
      ${OrderSide.SELL} | ${SwapType.Chain}            | ${pairsTaprootChain.get('BTC')!.get('BTC')}
    `('should get taproot pair', async ({ side, type, expected }) => {
      await expect(
        getPair('BTC/BTC', side, SwapVersion.Taproot, type),
      ).resolves.toEqual({
        base: 'BTC',
        quote: 'BTC',
        referral: null,
        ...expected,
      });
    });

    test('should throw when pair cannot be found', async () => {
      const notFound = 'notFound';

      await expect(
        getPair(
          notFound,
          OrderSide.BUY,
          SwapVersion.Legacy,
          SwapType.Submarine,
        ),
      ).rejects.toEqual(Errors.PAIR_NOT_FOUND(notFound));
    });
  });

  test('should get order side', () => {
    const getOrderSide = service['getOrderSide'];

    expect(getOrderSide('buy')).toEqual(OrderSide.BUY);
    expect(getOrderSide('sell')).toEqual(OrderSide.SELL);

    // Throw if order side cannot be found
    expect(() => getOrderSide('')).toThrow(
      Errors.ORDER_SIDE_NOT_FOUND('').message,
    );
  });

  describe('setSwapStatus', () => {
    const setSwapStatus = service['setSwapStatus'];
    const swapId = '1';

    test('should throw for non-whitelisted eventName', async () => {
      expect.assertions(1);
      const eventName = SwapUpdateEvent.TransactionFailed;
      await expect(setSwapStatus('1', eventName)).rejects.toEqual(
        Errors.SET_SWAP_UPDATE_EVENT_NOT_ALLOWED(eventName),
      );
    });

    test('should throw for a non-existent swapId', async () => {
      expect.assertions(1);
      const eventName = SwapUpdateEvent.InvoicePending;
      mockGetSwapResult = undefined;
      const nonExistentSwapId = 'nonExistentSwapId';
      await expect(setSwapStatus(nonExistentSwapId, eventName)).rejects.toEqual(
        Errors.SWAP_NOT_FOUND(nonExistentSwapId),
      );
    });

    test('should successfully update swap status', async () => {
      expect.assertions(3);
      const eventName = SwapUpdateEvent.InvoiceFailedToPay;
      mockGetSwapResult = { id: swapId };
      await expect(setSwapStatus(swapId, eventName)).resolves.toBeUndefined();
      expect(SwapRepository.setSwapStatus).toHaveBeenCalledWith(
        mockGetSwapResult,
        eventName,
        cancelledViaCliFailureReason,
      );
      expect(service.swapManager.nursery.emit).toHaveBeenCalledWith(
        eventName,
        mockGetSwapResult,
      );
    });
  });

  describe('getLockedFunds', () => {
    test('should return an empty map', async () => {
      ReverseSwapRepository.getReverseSwaps = jest.fn().mockResolvedValue([]);
      ChainSwapRepository.getChainSwaps = jest.fn().mockResolvedValue([]);

      expect.assertions(2);

      const lockedFunds = await service.getLockedFunds();
      expect(lockedFunds.size).toEqual(0);
      expect(ReverseSwapRepository.getReverseSwaps).toHaveBeenCalledTimes(1);
    });

    test('should return BTC and L-BTC locked funds', async () => {
      ChainSwapRepository.getChainSwaps = jest.fn().mockResolvedValue([
        {
          sendingData: {
            symbol: 'BTC',
          },
        },
      ]);
      ReverseSwapRepository.getReverseSwaps = jest.fn().mockResolvedValue([
        {
          id: 'r654321',
          onchainAmount: 1000000,
          pair: 'L-BTC/BTC',
          orderSide: 0,
        },
        {
          id: 'r654322',
          onchainAmount: 2000000,
          pair: 'L-BTC/BTC',
          orderSide: 0,
        },
        {
          id: 'r654323',
          onchainAmount: 3000000,
          pair: 'L-BTC/BTC',
          orderSide: 1,
        },
      ]);
      expect.assertions(5);

      const lockedFunds = await service.getLockedFunds();
      expect(lockedFunds.size).toEqual(2);
      expect(lockedFunds.get('L-BTC')!.reverseSwaps.length).toEqual(2);
      expect(lockedFunds.get('L-BTC')!.chainSwaps.length).toEqual(0);
      expect(lockedFunds.get('BTC')!.reverseSwaps.length).toEqual(1);
      expect(lockedFunds.get('BTC')!.chainSwaps.length).toEqual(1);
    });
  });
});
