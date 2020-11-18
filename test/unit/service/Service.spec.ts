import { Op } from 'sequelize';
import { randomBytes } from 'crypto';
import { Networks } from 'boltz-core';
import Logger from '../../../lib/Logger';
import Swap from '../../../lib/db/models/Swap';
import packageJson from '../../../package.json';
import Wallet from '../../../lib/wallet/Wallet';
import Errors from '../../../lib/service/Errors';
import { ConfigType } from '../../../lib/Config';
import Service from '../../../lib/service/Service';
import SwapManager from '../../../lib/swap/SwapManager';
import LndClient from '../../../lib/lightning/LndClient';
import ChainClient from '../../../lib/chain/ChainClient';
import SwapRepository from '../../../lib/db/SwapRepository';
import { CurrencyInfo } from '../../../lib/proto/boltzrpc_pb';
import ReverseSwapRepository from '../../../lib/db/ReverseSwapRepository';
import WalletManager, { Currency } from '../../../lib/wallet/WalletManager';
import { getHexBuffer, getHexString, decodeInvoice } from '../../../lib/Utils';
import ChannelCreationRepository from '../../../lib/db/ChannelCreationRepository';
import { ServiceWarning, OrderSide, SwapUpdateEvent, ServiceInfo } from '../../../lib/consts/Enums';

const mockGetPairs = jest.fn().mockResolvedValue([]);
const mockAddPair = jest.fn().mockReturnValue(Promise.resolve());

jest.mock('../../../lib/db/PairRepository', () => {
  return jest.fn().mockImplementation(() => ({
    addPair: mockAddPair,
    getPairs: mockGetPairs,
  }));
});

let mockGetSwapResult: any = undefined;
const mockGetSwap = jest.fn().mockImplementation(async () => {
  return mockGetSwapResult;
});

const mockAddSwap = jest.fn().mockResolvedValue(undefined);

jest.mock('../../../lib/db/SwapRepository', () => {
  return jest.fn().mockImplementation(() => ({
    getSwap: mockGetSwap,
    addSwap: mockAddSwap,
  }));
});

const mockedSwapRepository = <jest.Mock<SwapRepository>><any>SwapRepository;

const mockAddReverseSwap = jest.fn().mockResolvedValue(undefined);

jest.mock('../../../lib/db/ReverseSwapRepository', () => {
  return jest.fn().mockImplementation(() => ({
    addReverseSwap: mockAddReverseSwap,
  }));
});

const mockedReverseSwapRepository = <jest.Mock<ReverseSwapRepository>><any>ReverseSwapRepository;

let mockGetChannelCreationResult: any = undefined;
const mockGetChannelCreation = jest.fn().mockImplementation(() => {
  return mockGetChannelCreationResult;
});

jest.mock('../../../lib/db/ChannelCreationRepository', () => {
  return jest.fn().mockImplementation(() => ({
    getChannelCreation: mockGetChannelCreation,
  }));
});

const mockedChannelCreationRepository = <jest.Mock<ChannelCreationRepository>><any>ChannelCreationRepository;

const mockedSwap = {
  id: 'swapId',
  keyIndex: 42,
  address: 'bcrt1',
  redeemScript: '0x',
  timeoutBlockHeight: 123,
};
const mockCreateSwap = jest.fn().mockResolvedValue(mockedSwap);

const mockSetSwapInvoice = jest.fn().mockImplementation(async (
  swap: Swap,
  _invoice: string,
  _expectedAmount: number,
  _percentageFee: number,
  _acceptZeroConf: boolean,
  emitSwapInvoiceSet: (id: string) => void,
) => {
  emitSwapInvoiceSet(swap.id);
});

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

jest.mock('../../../lib/swap/SwapManager', () => {
  return jest.fn().mockImplementation(() => ({
    nursery: {
      on: () => {},
      channelNursery: {
        on: () => {},
      },
    },
    swapRepository: mockedSwapRepository(),
    reverseSwapRepository: mockedReverseSwapRepository(),
    channelCreationRepository: mockedChannelCreationRepository(),
    createSwap: mockCreateSwap,
    setSwapInvoice: mockSetSwapInvoice,
    createReverseSwap: mockCreateReverseSwap,
  }));
});

const mockedSwapManager = <jest.Mock<SwapManager>><any>SwapManager;

const mockGetBalance = jest.fn().mockResolvedValue({
  totalBalance: 1,
  confirmedBalance: 2,
  unconfirmedBalance: 3,
});

const newAddress = 'bcrt1';
const mockNewAddress = jest.fn().mockResolvedValue(newAddress);

const mockTransaction = {
  vout: 1,
  transaction: {
    getId: () => 'id',
    toHex: () => 'hex',
  },
};
const mockSendToAddress = jest.fn().mockResolvedValue(mockTransaction);
const mockSweepWallet = jest.fn().mockResolvedValue(mockTransaction);

const ethereumAddress = '0xc3b03f52ed641e59a40e1425481a8f3655b7edd5';

const ethereumBalance = {
  ether: 239874,
  tokens: new Map<string, number>([['TRC', 120210]]),
};
const mockEthereumGetBalance = jest.fn().mockResolvedValue(ethereumBalance);

const etherTransaction = {
  transactionHash: '0x90a060627f9a489cf816e2dae8babdf94a0f866982c6f489fb57c4ed218329f8',
};

const mockSendEther = jest.fn().mockResolvedValue(etherTransaction);
const mockSweepEther = jest.fn().mockResolvedValue(etherTransaction);

const tokenTransaction = {
  transactionHash: '0x1d5c0fdc8d1816b730d37373510e7054f6e09fbbbfae1e6ad1067b3f13406cfe',
};

const mockSendToken = jest.fn().mockResolvedValue(tokenTransaction);
const mockSweepToken = jest.fn().mockResolvedValue(tokenTransaction);

jest.mock('../../../lib/wallet/WalletManager', () => {
  return jest.fn().mockImplementation(() => ({
    ethereumWallet: {
      address: ethereumAddress,
      sendEther: mockSendEther,
      sendToken: mockSendToken,
      sweepEther: mockSweepEther,
      sweepToken: mockSweepToken,
      getBalance: mockEthereumGetBalance,
      supportsToken: (symbol: string) => symbol === 'TRC',
    },
    wallets: new Map<string, Wallet>([
      ['BTC', {
        getBalance: mockGetBalance,
        newAddress: mockNewAddress,
        sendToAddress: mockSendToAddress,
        sweepWallet: mockSweepWallet,
      } as any as Wallet],
      ['LTC', {
        getBalance: () => ({
          totalBalance: 0,
          confirmedBalance: 0,
          unconfirmedBalance: 0,
        }),
      } as any as Wallet],
    ]),
  }));
});

const mockedWalletManager = <jest.Mock<WalletManager>><any>WalletManager;

const mockInitFeeProvider = jest.fn().mockReturnValue(undefined);

const mockGetFees = jest.fn().mockReturnValue({
  baseFee: 1,
  percentageFee: 1,
});

const mockGetPercentageFee = jest.fn().mockReturnValue(0.01);

jest.mock('../../../lib/rates/FeeProvider', () => {
  return jest.fn().mockImplementation(() => ({
    init: mockInitFeeProvider,
    getFees: mockGetFees,
    getPercentageFee: mockGetPercentageFee,
  }));
});

const pairs = new Map<string, any>([
  ['BTC/BTC', {
    rate: 1,
    limits: {
      minimal: 1,
      maximal: Number.MAX_SAFE_INTEGER,
    },
    hash: 'hashOfBtcBtcPair',
  }],
  ['LTC/BTC', {
    rate: 0.004,
    limits: {
      minimal: 1,
      maximal: Number.MAX_SAFE_INTEGER,
    },
    hash: 'hashOfLtcBtcPair',
  }],
  ['test', {
    limits: {
      minimal: 5,
      maximal: 10,
    },
    hash: 'hashOfTestPair',
  }],
]);

const mockInitRateProvider = jest.fn().mockReturnValue(Promise.resolve());

const mockAcceptZeroConf = jest.fn().mockReturnValue(true);

jest.mock('../../../lib/rates/RateProvider', () => {
  return jest.fn().mockImplementation(() => ({
    pairs,
    init: mockInitRateProvider,
    acceptZeroConf: mockAcceptZeroConf,
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

jest.mock('../../../lib/chain/ChainClient', () => {
  return jest.fn().mockImplementation(() => ({
    on: () => {},
    estimateFee: mockEstimateFee,
    getNetworkInfo: mockGetNetworkInfo,
    getBlockchainInfo: mockGetBlockchainInfo,
    getRawTransaction: mockGetRawTransaction,
    sendRawTransaction: mockSendRawTransaction,
  }));
});

const mockedChainClient = <jest.Mock<ChainClient>><any>ChainClient;

const lndInfo = {
  blockHeight: 123,
  version: '0.7.1-beta commit=v0.7.1-beta',

  numActiveChannels: 3,
  numInactiveChannels: 2,
  numPendingChannels: 1,

  identityPubkey: '321',
  urisList: ['321@127.0.0.1:9735', '321@hidden.onion:9735'],
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

const mockListChannels = jest.fn().mockResolvedValue({
  channelsList: [
    {
      localBalance: channelBalance.localBalance / 2,
      remoteBalance: channelBalance.remoteBalance / 2,
    },
    {
      localBalance: channelBalance.localBalance / 2,
      remoteBalance: channelBalance.remoteBalance / 2,
    },
  ],
});

jest.mock('../../../lib/lightning/LndClient', () => {
  return jest.fn().mockImplementation(() => ({
    on: () => {},
    getInfo: mockGetInfo,
    sendPayment: mockSendPayment,
    listChannels: mockListChannels,
  }));
});

const mockedLndClient = <jest.Mock<LndClient>><any>LndClient;

describe('Service', () => {
  const configPairs = [
    {
      base: 'BTC',
      quote: 'BTC',
      fee: 1,
      timeoutDelta: 10,
    },
    {
      base: 'LTC',
      quote: 'BTC',
      fee: 5,
      timeoutDelta: 400,
    },
  ];

  const currencies = new Map<string, Currency>([
    ['BTC', {
      symbol: 'BTC',
      network: Networks.bitcoinRegtest,
      config: {} as any,
      lndClient: mockedLndClient(),
      chainClient: mockedChainClient(),
    }],
    ['LTC', {
      symbol: 'LTC',
      network: Networks.litecoinRegtest,
      config: {} as any,
      lndClient: mockedLndClient(),
      chainClient: mockedChainClient(),
    }],
  ]);

  const service = new Service(
    Logger.disabledLogger,
    {
      rates: {
        interval: Number.MAX_SAFE_INTEGER,
      },
    } as ConfigType,
    mockedWalletManager(),
    currencies,
  );

  // Inject a mocked SwapManager
  service.swapManager = mockedSwapManager();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should not init if a currency of a pair cannot be found', async () => {
    await expect(service.init([
      {
        base: 'not',
        quote: 'BTC',
        fee: 0,
        timeoutDelta: 0,
      },
    ])).rejects.toEqual(Errors.CURRENCY_NOT_FOUND('not'));
  });

  test('should init', async () => {
    await service.init(configPairs);

    expect(mockGetPairs).toHaveBeenCalledTimes(1);

    expect(mockAddPair).toHaveBeenCalledTimes(2);
    expect(mockAddPair).toHaveBeenCalledWith({
      id: 'BTC/BTC',
      ...configPairs[0],
    });
    expect(mockAddPair).toHaveBeenCalledWith({
      id: 'LTC/BTC',
      ...configPairs[1],
    });

    expect(mockInitFeeProvider).toHaveBeenCalledTimes(1);
    expect(mockInitFeeProvider).toHaveBeenCalledWith(configPairs);

    expect(mockInitRateProvider).toHaveBeenCalledTimes(1);
    expect(mockInitRateProvider).toHaveBeenCalledWith(configPairs);
  });

  test('should get info', async () => {
    const info = (await service.getInfo()).toObject();

    expect(mockGetInfo).toHaveBeenCalledTimes(2);
    expect(mockGetNetworkInfo).toHaveBeenCalledTimes(2);
    expect(mockGetBlockchainInfo).toHaveBeenCalledTimes(2);

    expect(info.version.startsWith(packageJson.version)).toBeTruthy();

    const currency = info.chainsMap[0] as CurrencyInfo.AsObject;

    expect(currency[0]).toEqual('BTC');

    expect(currency[1].chain).toEqual({
      ...(await mockGetNetworkInfo()),
      ...(await mockGetBlockchainInfo()),
      error: '',
    });

    const lndInfo = await mockGetInfo();

    expect(currency[1].lnd).toEqual({
      error: '',
      version: lndInfo.version,
      blockHeight: lndInfo.blockHeight,

      lndChannels: {
        active: lndInfo.numActiveChannels,
        inactive: lndInfo.numInactiveChannels,
        pending: lndInfo.numPendingChannels,
      },
    });
  });

  test('should get balance', async () => {
    const response = await service.getBalance();
    const balances = response.getBalancesMap();

    expect(balances.get('LTC')).toBeDefined();
    expect(balances.get('BTC').toObject()).toEqual({
      walletBalance: await mockGetBalance(),
      lightningBalance: channelBalance,
    });

    expect(balances.get('ETH').toObject()).toEqual({
      walletBalance: {
        unconfirmedBalance: 0,
        totalBalance: ethereumBalance.ether,
        confirmedBalance: ethereumBalance.ether,
      },
    });
    expect(balances.get('TRC').toObject()).toEqual({
      walletBalance: {
        unconfirmedBalance: 0,
        totalBalance: ethereumBalance.tokens.get('TRC'),
        confirmedBalance: ethereumBalance.tokens.get('TRC'),
      },
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
      warnings: [
        ServiceWarning.ReverseSwapsDisabled,
      ],
    });

    service.allowReverseSwaps = true;

    service['prepayMinerFee'] = true;

    expect(service.getPairs()).toEqual({
      pairs,
      info: [
        ServiceInfo.PrepayMinerFee,
      ],
      warnings: [],
    });

    service['prepayMinerFee'] = false;
  });

  test('should get nodes', async () => {
    expect(await service.getNodes()).toEqual(new Map<string, { nodeKey: string, uris: string[] }>([
      ['BTC', {
        nodeKey: lndInfo.identityPubkey,
        uris: lndInfo.urisList,
      }],
      ['LTC', {
        nodeKey: lndInfo.identityPubkey,
        uris: lndInfo.urisList,
      }],
    ]));
  });

  test('should get transactions', async () => {
    await expect(service.getTransaction('BTC', ''))
      .resolves.toEqual(rawTransaction);

    // Throw if currency cannot be found
    const notFound = 'notFound';

    await expect(service.getTransaction(notFound, ''))
      .rejects.toEqual(Errors.CURRENCY_NOT_FOUND(notFound));
  });

  test('should get lockup transactions of swaps', async () => {
    const blockDelta = 10;

    mockGetSwapResult = {
      id: '123asd',
      pair: 'LTC/BTC',
      orderSide: OrderSide.BUY,
      timeoutBlockHeight: blockchainInfo.blocks + blockDelta,
      lockupTransactionId: 'eb63a8b1511f83c8d649fdaca26c4bc0dee4313689f62fd0f4ff8f71b963900d',
    };

    let response = await service.getSwapTransaction(mockGetSwapResult.id);

    expect(response).toEqual({
      transactionHex: rawTransaction,
      timeoutBlockHeight: mockGetSwapResult.timeoutBlockHeight,
      timeoutEta: Math.round(new Date().getTime() / 1000) + blockDelta * 10 * 60,
    });

    expect(mockGetSwap).toHaveBeenCalledTimes(1);
    expect(mockGetSwap).toHaveBeenCalledWith({
      id: {
        [Op.eq]: mockGetSwapResult.id,
      },
    });

    expect(mockGetBlockchainInfo).toHaveBeenCalledTimes(1);

    expect(mockGetRawTransaction).toHaveBeenCalledTimes(1);
    expect(mockGetRawTransaction).toHaveBeenCalledWith(mockGetSwapResult.lockupTransactionId);

    // Should not return an ETA if the Submarine Swap has timed out already
    mockGetSwapResult.timeoutBlockHeight = blockchainInfo.blocks;

    response = await service.getSwapTransaction(mockGetSwapResult.id);

    expect(response).toEqual({
      transactionHex: rawTransaction,
      timeoutBlockHeight: mockGetSwapResult.timeoutBlockHeight,
    });

    expect(mockGetBlockchainInfo).toHaveBeenCalledTimes(2);
    expect(mockGetRawTransaction).toHaveBeenCalledTimes(2);

    // Throw if Swap has no lockup transaction
    mockGetSwapResult.lockupTransactionId = undefined;

    await expect(service.getSwapTransaction(mockGetSwapResult.id))
      .rejects.toEqual(Errors.SWAP_NO_LOCKUP());

    // Throw if Swap cannot be found
    const id = mockGetSwapResult.id;
    mockGetSwapResult = undefined;

    await expect(service.getSwapTransaction(id))
      .rejects.toEqual(Errors.SWAP_NOT_FOUND(id));
  });

  test('should get new addresses', async () => {
    expect(await service.getAddress('BTC')).toEqual(newAddress);

    expect(mockNewAddress).toHaveBeenCalledTimes(1);

    expect(await service.getAddress('ETH')).toEqual(ethereumAddress);
    expect(await service.getAddress('TRC')).toEqual(ethereumAddress);

    // Throw if currency cannot be found
    const notFound = 'notFound';

    await expect(service.getAddress(notFound))
      .rejects.toEqual(Errors.CURRENCY_NOT_FOUND(notFound));
  });

  test('should get fee estimation', async () => {
    // Get fee estimation of all currencies
    const feeEstimation = await service.getFeeEstimation();

    expect(feeEstimation).toEqual(new Map<string, number>([
      ['BTC', 2],
      ['LTC', 2],
    ]));

    expect(mockEstimateFee).toHaveBeenCalledTimes(2);
    expect(mockEstimateFee).toHaveBeenNthCalledWith(1, 2);

    // Get fee estimation for a single currency
    expect(await service.getFeeEstimation('BTC')).toEqual(new Map<string, number>([
      ['BTC', 2],
    ]));

    expect(mockEstimateFee).toHaveBeenCalledTimes(3);
    expect(mockEstimateFee).toHaveBeenNthCalledWith(3, 2);

    // Get fee estimation for a single currency for a specified amount of blocks
    expect(await service.getFeeEstimation('BTC', 5)).toEqual(new Map<string, number>([
      ['BTC', 2],
    ]));

    expect(mockEstimateFee).toHaveBeenCalledTimes(4);
    expect(mockEstimateFee).toHaveBeenNthCalledWith(4, 5);

    // Get fee estimation for a single currency that cannot be found
    const notFound = 'notFound';

    await expect(service.getFeeEstimation(notFound))
      .rejects.toEqual(Errors.CURRENCY_NOT_FOUND(notFound));
  });

  test('should broadcast transactions', async () => {
    // Should broadcast normal transactions
    let transactionHex = 'hex';

    await expect(service.broadcastTransaction('BTC', transactionHex))
      .resolves.toEqual(sendRawTransaction);

    expect(mockSendRawTransaction).toHaveBeenCalledTimes(1);
    expect(mockSendRawTransaction).toHaveBeenCalledWith(transactionHex);

    // Throw special error in case a Swap is refunded before timelock requirement is met
    sendRawTransaction = {
      code: -26,
      message: 'non-mandatory-script-verify-flag (Locktime requirement not satisfied) (code 64)',
    };
    transactionHex = '0100000000010154b6a506a69b5a2e7e8de20fe9aedbe9aa04e3249fc2ca75106a06942c5c84e60000000023220020bcf9f822194145acea0f3235f4107b5bf1a91b6b9f8489f63bf79ec29b360913ffffffff023b622d000000000017a91430897cc6c9d69f6a2c2f1c651d51f22219f1a4f6873ecb2a000000000017a9146ee55aa1c39b0c66acf287ac39721feef49114d6870400483045022100a3269ba08373ed541e91eb9698c4f570c7a8a0fde7dbff503d8c759c59639845022008abe66b6550ffb6484cda8a87140759aa5ee9c4bb2aaa09883d2afab9e6927501483045022100d29199cd9799363fd5869c4e22836c28bf48b2fe1b82bf21fcc23f28abc9921502204b1066a49c2c8d70c876ce28bd9f81aace47c4079b3bae4dfb63173c2f3be21201695221026c8f72b9e63db63907115e65d4da86eaae595b22fdc85ec75301bb4adbf203582103806535be3e3920e5eedee92de5714188fd6a784f2bf7b04f87de0b9c3ae1ecdb21024b23bfdce2afcae7e28c42f7f79aa100f22931712c52d7414a526ba494d44a2553ae00000000';

    const blockDelta = 1;
    mockGetSwapResult = {
      timeoutBlockHeight: blockchainInfo.blocks + blockDelta,
    };

    await expect(service.broadcastTransaction('BTC', transactionHex))
      .rejects.toEqual({
        error: sendRawTransaction.message,
        timeoutBlockHeight: mockGetSwapResult.timeoutBlockHeight,
        timeoutEta: Math.round(new Date().getTime() / 1000) + blockDelta * 10 * 60,
      });

    // Throw Bitcoin Core error in case Swap cannot be found
    mockGetSwapResult = undefined;

    await expect(service.broadcastTransaction('BTC', transactionHex))
      .rejects.toEqual(sendRawTransaction);

    // Throw other Bitcoin Core errors
    sendRawTransaction = {
      code: 1,
      message: 'test',
    };

    await expect(service.broadcastTransaction('BTC', transactionHex))
      .rejects.toEqual(sendRawTransaction);

    // Throw if currency cannot be found
    const notFound = 'notFound';

    await expect(service.broadcastTransaction(notFound, transactionHex))
      .rejects.toEqual(Errors.CURRENCY_NOT_FOUND(notFound));

    sendRawTransaction = 'rawTx';
  });

  // TODO: add channel creations
  test('should create swaps', async () => {
    mockGetSwapResult = undefined;

    const pair = 'BTC/BTC';
    const orderSide = 'buy';
    const refundPublicKey = getHexBuffer('0xfff');
    const preimageHash = getHexBuffer('ac3703b99248a0a2d948c6021fdd70debb90ab37233e62531c7f900fe3852c89');

    // Create a new swap
    let emittedId = '';

    service.eventHandler.once('swap.update', (id, message) => {
      expect(message).toEqual({ status: SwapUpdateEvent.SwapCreated });
      emittedId = id;
    });

    const response = await service.createSwap(pair, orderSide, refundPublicKey, preimageHash);

    expect(emittedId).toEqual(response.id);
    expect(response).toEqual({
      id: mockedSwap.id,
      address: mockedSwap.address,
      redeemScript: mockedSwap.redeemScript,
      timeoutBlockHeight: mockedSwap.timeoutBlockHeight,
    });

    expect(mockGetSwap).toHaveBeenCalledTimes(1);
    expect(mockGetSwap).toHaveBeenCalledWith({
      preimageHash: {
        [Op.eq]: getHexString(preimageHash),
      },
    });

    expect(mockCreateSwap).toHaveBeenCalledTimes(1);
    expect(mockCreateSwap).toHaveBeenCalledWith(
      'BTC',
      'BTC',
      OrderSide.BUY,
      preimageHash,
      refundPublicKey,
      1,
      undefined,
    );

    // Throw if swap with preimage exists already
    mockGetSwapResult = {};
    await expect(service.createSwap('', '', Buffer.alloc(0), Buffer.alloc(0)))
      .rejects.toEqual(Errors.SWAP_WITH_PREIMAGE_EXISTS());
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
        invoiceAmount: 990098,
      },
    });

    // Throw if onchain amount is not set
    mockGetSwapResult = {};
    await expect(service.getSwapRates(id)).rejects.toEqual(Errors.SWAP_NO_LOCKUP());

    // Throw if the Swap cannot be found
    mockGetSwapResult = undefined;
    await expect(service.getSwapRates(id)).rejects.toEqual(Errors.SWAP_NOT_FOUND(id));
  });

  test('should set invoices of swaps', async () => {
    mockGetSwapResult = {
      id: 'invoiceId',
      pair: 'BTC/BTC',
      orderSide: 0,
      lockupAddress: 'bcrt1qae5nuz2cv7gu2dpps8rwrhsfv6tjkyvpd8hqsu',
    };

    const invoiceAmount = 100000;
    const invoice = 'lnbcrt1m1pw5qjj2pp5fzncpqa5hycqppwvelygawz2jarnxnngry945mm3uv6janpjfvgqdqqcqzpg35dc9zwwu3jhww7q087fc8h6tjs2he6w0yulc3nz262waznvp2s5t9xlwgau2lzjl8zxjlt5jxtgkamrz2e4ct3d70azmkh2hhgddkgpg38yqt';

    let emittedId = '';

    service.eventHandler.once('swap.update', (id, message) => {
      expect(message).toEqual({ status: SwapUpdateEvent.InvoiceSet });
      emittedId = id;
    });

    const response = await service.setSwapInvoice(mockGetSwapResult.id, invoice);

    expect(emittedId).toEqual(mockGetSwapResult.id);
    expect(response).toEqual({
      acceptZeroConf: true,
      expectedAmount: 100002,
      bip21: 'bitcoin:bcrt1qae5nuz2cv7gu2dpps8rwrhsfv6tjkyvpd8hqsu?amount=0.00100002&label=Send%20to%20BTC%20lightning',
    });

    expect(mockGetSwap).toHaveBeenCalledTimes(1);
    expect(mockGetSwap).toHaveBeenCalledWith({
      id: {
        [Op.eq]: mockGetSwapResult.id,
      },
    });

    expect(mockGetFees).toHaveBeenCalledTimes(1);
    expect(mockGetFees).toHaveBeenCalledWith(mockGetSwapResult.pair, 1, mockGetSwapResult.orderSide, invoiceAmount, false);

    expect(mockAcceptZeroConf).toHaveBeenCalledTimes(1);
    expect(mockAcceptZeroConf).toHaveBeenCalledWith('BTC', invoiceAmount + 2);

    expect(mockSetSwapInvoice).toHaveBeenCalledTimes(1);
    expect(mockSetSwapInvoice).toHaveBeenCalledWith(mockGetSwapResult, invoice, invoiceAmount + 2, 1, true, expect.anything());

    // Should execute with valid pair hash (it should just not throw)
    await service.setSwapInvoice(mockGetSwapResult.id, invoice, pairs.get('BTC/BTC')!.hash);

    // Throw when an invalid pair hash is provided
    await expect(service.setSwapInvoice(mockGetSwapResult.id, invoice, 'wrongHash'))
      .rejects.toEqual(Errors.INVALID_PAIR_HASH());
    await expect(service.setSwapInvoice(mockGetSwapResult.id, invoice, ''))
      .rejects.toEqual(Errors.INVALID_PAIR_HASH());

    // Throw if a swap doesn't respect the limits
    const invoiceLimit = 'lnbcrt1p0xdz2epp59nrc7lqcnw37suzed83e8s33sxl9p0hk4xu6gya9rcxfmnzd8jfsdqqcqzpgsp5228z07nxfghfzf3p2lu7vc03zss8cgklql845yjr990zsa3nj2hq9qy9qsqqpw8n4s5v3w7t9rryccz46f5v0542td098dun4yzfru4saxhd5apcxl5clxn8a70afn7j3e6avvk3s9gn3ypt2revyuh47aftft3kpcpek9lma';
    const invoiceLimitAmount = 0;

    await expect(service.setSwapInvoice(mockGetSwapResult.id, invoiceLimit))
      .rejects.toEqual(Errors.BENEATH_MINIMAL_AMOUNT(invoiceLimitAmount, 1));

    // Throw if swap with id does not exist
    mockGetSwapResult = undefined;
    const notFoundId = 'asdfasdf';

    await expect(service.setSwapInvoice(notFoundId, ''))
      .rejects.toEqual(Errors.SWAP_NOT_FOUND(notFoundId));

    // Throw if invoice is already set
    mockGetSwapResult = {
      invoice: 'invoice',
    };

    await expect(service.setSwapInvoice(mockGetSwapResult.id, ''))
      .rejects.toEqual(Errors.SWAP_HAS_INVOICE_ALREADY(mockGetSwapResult.id));
  });

  // TODO: channel creation logic
  test('should create swaps with invoices', async () => {
    const createSwapResult = {
      id: 'swapInvoice',
      address: 'bcrt1qundqmnml8644l23g7cr3fjnksks4nc6mxf4gk9',
      redeemScript: getHexBuffer('a914e3be605a911034ca6fc38ae3a027bf374d37be708763210288ff09ee16a91183fd42afa8329a7b4387e5e61e5c66c6eb43058008c95136c56702fc00b1752103e25b3f3bb7f9978410d52b4c763e3c8fe6d43cf462e91138c5b0f61b92c93d7068ac'),
      timeoutBlockHeight: 504893,
    };

    const setSwapInvoiceResult = {
      acceptZeroConf: true,
      expectedAmount: 100002,
      bip21: 'bitcoin:bcrt1qundqmnml8644l23g7cr3fjnksks4nc6mxf4gk9?amount=0.00100002&label=Send%20to%20BTC%20lightning',
    };

    // Inject mocks into the service
    service.createSwap = jest.fn().mockResolvedValue(createSwapResult);
    service.setSwapInvoice = jest.fn().mockResolvedValue(setSwapInvoiceResult);

    mockGetSwapResult = undefined;

    const pair = 'BTC/BTC';
    const orderSide = 'sell';
    const refundPublicKey = getHexBuffer('02d3727f1c2017adf58295378d02ace4c514666b8d75d4751940b940718ceb34ed');
    const invoice = 'lnbcrt1m1p0xdry7pp5jadnlr9y5qs5nl93u06v9w2azqr8rf5n09u2wk0c6jktyfxwfpwqdqqcqzpgsp5svss08dmgw9q6emmwfzp74hcs2rq2fu3u78qge5l942al5glzjmq9qy9qsq4v5x0qlfp3fvpm9mrzmmdrptwdrd7gxyaypz4y0g8l8apmzfjgvqtxg9z89y0kg2lh6ykd8czt5ven6nlvr407vdm0mp9l9tvhg33gspv3yr0j';

    const response = await service.createSwapWithInvoice(pair, orderSide, refundPublicKey, invoice);

    expect(response).toEqual({
      ...createSwapResult,
      ...setSwapInvoiceResult,
    });

    expect(service.createSwap).toHaveBeenCalledTimes(1);
    expect(service.createSwap).toHaveBeenCalledWith(
      pair,
      orderSide,
      refundPublicKey,
      getHexBuffer(decodeInvoice(invoice).paymentHash!),
      undefined,
    );

    expect(service.setSwapInvoice).toHaveBeenCalledTimes(1);
    expect(service.setSwapInvoice).toHaveBeenCalledWith(
      response.id,
      invoice,
      undefined,
    );

    // Throw and remove the database entry if "setSwapInvoice" fails
    const error = {
      message: 'error thrown by Service',
    };

    const mockDestroySwap = jest.fn().mockResolvedValue({});
    const mockDestroyChannelCreation = jest.fn().mockResolvedValue({});
    service.setSwapInvoice = jest.fn().mockImplementation(async () => {
      mockGetSwapResult = {
        destroy: mockDestroySwap,
      };
      mockGetChannelCreationResult = {
        destroy: mockDestroyChannelCreation,
      };

      throw error;
    });

    await expect(service.createSwapWithInvoice(pair, orderSide, refundPublicKey, invoice))
      .rejects.toEqual(error);

    expect(mockDestroySwap).toHaveBeenCalledTimes(1);
    expect(mockDestroyChannelCreation).toHaveBeenCalledTimes(1);

    // Throw if swap with invoice exists already
    mockGetSwapResult = {};

    await expect(service.createSwapWithInvoice('', '', Buffer.alloc(0), ''))
      .rejects.toEqual(Errors.SWAP_WITH_INVOICE_EXISTS());
  });

  test('should create reverse swaps', async () => {
    let pair = 'BTC/BTC';
    const orderSide = 'buy';
    const onchainAmount = 99998;
    const invoiceAmount = 100000;
    const preimageHash = randomBytes(32);
    const claimPublicKey = getHexBuffer('0xfff');

    service.allowReverseSwaps = true;

    let emittedId = '';

    service.eventHandler.once('swap.update', (id, message) => {
      expect(message).toEqual({ status: SwapUpdateEvent.SwapCreated });
      emittedId = id;
    });

    const response = await service.createReverseSwap(
      pair,
      orderSide,
      preimageHash,
      invoiceAmount,
      claimPublicKey,
    );

    expect(emittedId).toEqual(response.id);
    expect(response).toEqual({
      onchainAmount,
      id: mockedReverseSwap.id,
      invoice: mockedReverseSwap.invoice,
      redeemScript: mockedReverseSwap.redeemScript,
      lockupAddress: mockedReverseSwap.lockupAddress,
      timeoutBlockHeight: mockedReverseSwap.timeoutBlockHeight,
    });

    expect(mockGetFees).toHaveBeenCalledTimes(1);
    expect(mockGetFees).toHaveBeenCalledWith(pair, 1, OrderSide.BUY, invoiceAmount, true);

    expect(mockCreateReverseSwap).toHaveBeenCalledTimes(1);
    expect(mockCreateReverseSwap).toHaveBeenCalledWith(
      'BTC',
      'BTC',
      OrderSide.BUY,
      preimageHash,
      invoiceAmount,
      99998,
      claimPublicKey,
      1,
      4,
      1,
      undefined,
    );

    // Should add a 10% buffer to the lightning timeout block delta for cross chain swaps
    pair = 'LTC/BTC';

    await service.createReverseSwap(
      pair,
      orderSide,
      preimageHash,
      invoiceAmount,
      claimPublicKey,
    );

    expect(mockCreateReverseSwap).toHaveBeenCalledTimes(2);
    expect(mockCreateReverseSwap).toHaveBeenNthCalledWith(2,
      'LTC',
      'BTC',
      OrderSide.BUY,
      preimageHash,
      invoiceAmount,
      24999998,
      claimPublicKey,
      160,
      44,
      1,
      undefined,
    );

    pair = 'BTC/BTC';

    // Should execute with valid pair hash (it should just not throw)
    await service.createReverseSwap(
      pair,
      orderSide,
      preimageHash,
      invoiceAmount,
      claimPublicKey,
      pairs.get(pair)!.hash,
    );

    // Throw when an invalid pair hash is provided
    await expect(service.createReverseSwap(
      pair,
      orderSide,
      preimageHash,
      invoiceAmount,
      claimPublicKey,
      'wrongHash',
    )).rejects.toEqual(Errors.INVALID_PAIR_HASH());
    await expect(service.createReverseSwap(
      pair,
      orderSide,
      preimageHash,
      invoiceAmount,
      claimPublicKey,
      '',
    )).rejects.toEqual(Errors.INVALID_PAIR_HASH());

    // Throw if the onchain amount is less than 1
    await expect(service.createReverseSwap(
      pair,
      orderSide,
      preimageHash,
      1,
      claimPublicKey,
    )).rejects.toEqual(Errors.ONCHAIN_AMOUNT_TOO_LOW());

    // Throw if a reverse swaps doesn't respect the limits
    const invoiceAmountLimit = 0;

    await expect(service.createReverseSwap(
      pair,
      orderSide,
      preimageHash,
      invoiceAmountLimit,
      claimPublicKey,
    )).rejects.toEqual(Errors.BENEATH_MINIMAL_AMOUNT(invoiceAmountLimit, 1));

    // Throw if reverse swaps are disabled
    service.allowReverseSwaps = false;

    await expect(service.createReverseSwap(
      pair,
      orderSide,
      preimageHash,
      invoiceAmount,
      claimPublicKey,
    )).rejects.toEqual(Errors.REVERSE_SWAPS_DISABLED());

    service.allowReverseSwaps = true;
  });

  test('should create prepay miner fee reverse swaps', async () => {
    service['prepayMinerFee'] = true;

    const pair = 'BTC/BTC';
    const orderSide = 'buy';
    const onchainAmount = 99998;
    const invoiceAmount = 100000;
    const preimageHash = randomBytes(32);
    const claimPublicKey = getHexBuffer('0xfff');

    const response = await service.createReverseSwap(
      pair,
      orderSide,
      preimageHash,
      invoiceAmount,
      claimPublicKey,
    );

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
    expect(mockCreateReverseSwap).toHaveBeenCalledWith(
      'BTC',
      'BTC',
      OrderSide.BUY,
      preimageHash,
      99999,
      99998,
      claimPublicKey,
      1,
      4,
      1,
      1,
    );

    service['prepayMinerFee'] = false;
  });

  test('should pay invoices', async () => {
    const symbol = 'BTC';
    const invoice = 'invoice';

    const response = await service.payInvoice(symbol, invoice);

    expect(mockSendPayment).toBeCalledTimes(1);
    expect(mockSendPayment).toBeCalledWith(invoice);

    expect(response).toEqual(await mockSendPayment());
  });

  test('should send BTC', async () => {
    const fee = 3;
    const amount = 1;
    const symbol = 'BTC';
    const address = 'bcrt1qmv7axanlc090h2j79ufg530eaw88w8rfglnjl3';

    let sendAll = false;

    const response = await service.sendCoins({
      fee,
      amount,
      symbol,
      address,
      sendAll,
    });

    expect(response).toEqual({
      vout: mockTransaction.vout,
      transactionId: mockTransaction.transaction.getId(),
    });

    expect(mockSendToAddress).toHaveBeenCalledTimes(1);
    expect(mockSendToAddress).toHaveBeenCalledWith(
      address,
      amount,
      fee,
    );

    // Should sweep the wallet
    sendAll = true;

    const sweepResponse = await service.sendCoins({
      fee,
      amount,
      symbol,
      address,
      sendAll,
    });

    expect(sweepResponse).toEqual({
      vout: mockTransaction.vout,
      transactionId: mockTransaction.transaction.getId(),
    });

    expect(mockSweepWallet).toHaveBeenCalledTimes(1);
    expect(mockSweepWallet).toHaveBeenCalledWith(
      address,
      fee,
    );
  });

  test('should send Ether', async () => {
    const fee = 3;
    const amount = 2;
    const symbol = 'ETH';
    const address = '0x0000000000000000000000000000000000000000';

    let sendAll = false;

    const response = await service.sendCoins({
      fee,
      amount,
      symbol,
      address,
      sendAll,
    });

    expect(response).toEqual({
      vout: 0,
      transactionId: etherTransaction.transactionHash,
    });

    expect(mockSendEther).toHaveBeenCalledTimes(1);
    expect(mockSendEther).toHaveBeenCalledWith(address, amount, fee);

    // Should sweep wallet
    sendAll = true;

    const sweepResponse = await service.sendCoins({
      fee,
      amount,
      symbol,
      address,
      sendAll,
    });

    expect(sweepResponse).toEqual({
      vout: 0,
      transactionId: etherTransaction.transactionHash,
    });

    expect(mockSweepEther).toHaveBeenCalledTimes(1);
    expect(mockSweepEther).toHaveBeenCalledWith(address, fee);
  });

  test('should send ERC20 tokens', async () => {
    const fee = 3;
    const amount = 2;
    const symbol = 'TRC';
    const address = '0x0000000000000000000000000000000000000000';

    let sendAll = false;

    const response = await service.sendCoins({
      fee,
      amount,
      symbol,
      address,
      sendAll,
    });

    expect(response).toEqual({
      vout: 0,
      transactionId: tokenTransaction.transactionHash,
    });

    expect(mockSendToken).toHaveBeenCalledTimes(1);
    expect(mockSendToken).toHaveBeenCalledWith(symbol, address, amount, fee);

    // Should sweep wallet
    sendAll = true;

    const sweepResponse = await service.sendCoins({
      fee,
      amount,
      symbol,
      address,
      sendAll,
    });

    expect(sweepResponse).toEqual({
      vout: 0,
      transactionId: tokenTransaction.transactionHash,
    });

    expect(mockSweepToken).toHaveBeenCalledTimes(1);
    expect(mockSweepToken).toHaveBeenCalledWith(symbol, address, fee);
  });

  test('should throw of currency to send cannot be found', async () => {
    const notFound = 'notFound';

    await expect(service.sendCoins({
      fee: 0,
      amount: 0,
      address: '',
      sendAll: false,
      symbol: notFound,
    })).rejects.toEqual(Errors.CURRENCY_NOT_FOUND(notFound));
  });

  test('should verify amounts', () => {
    const rate = 2;
    const verifyAmount = service['verifyAmount'];

    // Normal swaps
    verifyAmount('test', rate, 5, OrderSide.BUY, false);
    verifyAmount('test', rate, 10, OrderSide.SELL, false);

    expect(() => verifyAmount('test', rate, 1.5, OrderSide.BUY, false)).toThrow(
      Errors.BENEATH_MINIMAL_AMOUNT(3, 5).message,
    );
    expect(() => verifyAmount('test', rate, 12, OrderSide.SELL, false)).toThrow(
      Errors.EXCEED_MAXIMAL_AMOUNT(12, 10).message,
    );

    // Reverse swaps
    verifyAmount('test', rate, 10, OrderSide.BUY, true);
    verifyAmount('test', rate, 5, OrderSide.SELL, true);

    expect(() => verifyAmount('test', rate, 1.5, OrderSide.BUY, true)).toThrow(
      Errors.BENEATH_MINIMAL_AMOUNT(1.5, 5).message,
    );
    expect(() => verifyAmount('test', rate, 12, OrderSide.SELL, true)).toThrow(
      Errors.EXCEED_MAXIMAL_AMOUNT(24, 10).message,
    );

    // Throw if limits of pair cannot be found
    const notFound = 'notFound';

    expect(() => verifyAmount(notFound, 0, 0, OrderSide.BUY, false)).toThrow(
      Errors.PAIR_NOT_FOUND(notFound).message,
    );
  });

  test('should calculate invoice amounts', () => {
    const calculateInvoiceAmount = service['calculateInvoiceAmount'];

    expect(calculateInvoiceAmount(OrderSide.BUY, 1, 1000000, 210, 0.02)).toEqual(980186);
    expect(calculateInvoiceAmount(OrderSide.SELL, 1, 1000000, 210, 0.02)).toEqual(980186);

    expect(calculateInvoiceAmount(OrderSide.BUY, 0.005, 1000000, 120, 0.05)).toEqual(190453333);
    expect(calculateInvoiceAmount(OrderSide.SELL, 0.005, 1000000, 120, 0.05)).toEqual(4761);
  });

  test('should get pair', () => {
    const getPair = service['getPair'];

    expect(getPair('BTC/BTC')).toEqual({
      base: 'BTC',
      quote: 'BTC',
      ...pairs.get('BTC/BTC'),
    });

    // Throw if pair cannot be found
    const notFound = 'notFound';

    expect(() => getPair(notFound)).toThrow(
      Errors.PAIR_NOT_FOUND(notFound).message,
    );
  });

  test('should get currency', () => {
    const getCurrency = service['getCurrency'];

    expect(getCurrency('BTC')).toEqual(
      currencies.get('BTC'),
    );

    // Throw if currency cannot be found
    const notFound = 'notFound';

    expect(() => getCurrency(notFound)).toThrow(
      Errors.CURRENCY_NOT_FOUND(notFound).message ,
    );
  });

  test('should get order side', () => {
    const getOrderSide = service['getOrderSide'];

    expect(getOrderSide('buy')).toEqual(OrderSide.BUY);
    expect(getOrderSide('sell')).toEqual(OrderSide.SELL);

    // Throw if order side cannot be found
    expect(() => getOrderSide('')).toThrow(Errors.ORDER_SIDE_NOT_FOUND('').message);
  });

  test('should calculate timeout date', () => {
    const calculateTimeoutDate = service['calculateTimeoutDate'];

    expect(calculateTimeoutDate('BTC', 3)).toEqual(Math.round(new Date().getTime() / 1000) + 3 * 10 * 60);
    expect(calculateTimeoutDate('LTC', 7)).toEqual(Math.round(new Date().getTime() / 1000) + 7 * 2.5 * 60);
  });
});
