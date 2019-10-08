import { Networks, OutputType } from 'boltz-core';
import Logger from '../../../lib/Logger';
import Wallet from '../../../lib/wallet/Wallet';
import Errors from '../../../lib/service/Errors';
import Service from '../../../lib/service/Service';
import SwapManager from '../../../lib/swap/SwapManager';
import LndClient from '../../../lib/lightning/LndClient';
import ChainClient from '../../../lib/chain/ChainClient';
import { CurrencyInfo } from '../../../lib/proto/boltzrpc_pb';
import { getOutputType, getHexBuffer } from '../../../lib/Utils';
import { ServiceWarning, OrderSide } from '../../../lib/consts/Enums';
import WalletManager, { Currency } from '../../../lib/wallet/WalletManager';
import { ConfigType } from '../../../lib/Config';

const packageJson = require('../../../package.json');

const mockGetPairs = jest.fn().mockResolvedValue([]);
const mockAddPair = jest.fn().mockReturnValue(Promise.resolve());

jest.mock('../../../lib/service/PairRepository', () => {
  return jest.fn().mockImplementation(() => ({
    addPair: mockAddPair,
    getPairs: mockGetPairs,
  }));
});

const mockGetSwapByInvoice = jest.fn().mockImplementation((invoice: string) => {
  return invoice === 'exists' ? {} : undefined;
});

const mockAddSwap = jest.fn().mockResolvedValue(undefined);

jest.mock('../../../lib/service/SwapRepository', () => {
  return jest.fn().mockImplementation(() => ({
    addSwap: mockAddSwap,
    getSwapByInvoice: mockGetSwapByInvoice,
  }));
});

const mockAddReverseSwap = jest.fn().mockResolvedValue(undefined);

jest.mock('../../../lib/service/ReverseSwapRepository', () => {
  return jest.fn().mockImplementation(() => ({
    addReverseSwap: mockAddReverseSwap,
  }));
});

const mockedSwap = {
  keyIndex: 42,
  address: 'bcrt1',
  redeemScript: '0x',
  timeoutBlockHeight: 123,
};
const mockCreateSwap = jest.fn().mockResolvedValue(mockedSwap);

const mockedReverseSwap = {
  minerFee: 1,
  keyIndex: 43,
  redeemScript: '0x',
  invoice: 'lnbcrt1',
  lockupTransaction: {},
  lockupTransactionId: 'id',
};
const mockCreateReverseSwap = jest.fn().mockResolvedValue(mockedReverseSwap);

jest.mock('../../../lib/swap/SwapManager', () => {
  return jest.fn().mockImplementation(() => ({
    nursery: {
      on: () => {},
    },
    createSwap: mockCreateSwap,
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
const mockGetNewAddress = jest.fn().mockResolvedValue(newAddress);

const mockTransaction = {
  vout: 1,
  transaction: {
    getId: () => 'id',
    toHex: () => 'hex',
  },
};
const mockSendToAddress = jest.fn().mockResolvedValue(mockTransaction);

jest.mock('../../../lib/wallet/WalletManager', () => {
  return jest.fn().mockImplementation(() => ({
    wallets: new Map<string, Wallet>([
      ['BTC', {
        supportsSegwit: true,
        getBalance: mockGetBalance,
        getNewAddress: mockGetNewAddress,
        sendToAddress: mockSendToAddress,
      } as any as Wallet],
      ['DOGE', {
        supportsSegwit: false,
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

jest.mock('../../../lib/rates/FeeProvider', () => {
  return jest.fn().mockImplementation(() => ({
    init: mockInitFeeProvider,
    getFees: mockGetFees,
  }));
});

const pairs = new Map<string, any>([
  ['BTC/BTC', {
    rate: 1,
    limits: {
      minimal: 1,
      maximal: Number.MAX_SAFE_INTEGER,
    },
  }],
  ['test', {
    limits: {
      minimal: 5,
      maximal: 10,
    },
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

const mockGetBlockchainInfo = jest.fn().mockResolvedValue({
  blocks: 123,
});

const rawTransaction = 'rawTransaction';
const mockGetRawTransaction = jest.fn().mockResolvedValue(rawTransaction);

const sendRawTransaction = 'id';
const mockSendRawTransaction = jest.fn().mockResolvedValue(sendRawTransaction);

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

const mockGetInfo = jest.fn().mockResolvedValue({
  blockHeight: 123,
  version: '0.7.1-beta commit=v0.7.1-beta',

  numActiveChannels: 3,
  numInactiveChannels: 2,
  numPendingChannels: 1,
});

const mockSendPayment = jest.fn().mockResolvedValue({
  paymentHash: '',
  paymentRoute: {},
  paymentPreimage: Buffer.alloc(0),
});

const totalBalance = {
  localBalance: 2,
  remoteBalance: 4,
};

const mockListChannels = jest.fn().mockResolvedValue({
  channelsList: [
    {
      localBalance: totalBalance.localBalance / 2,
      remoteBalance: totalBalance.remoteBalance / 2,
    },
    {
      localBalance: totalBalance.localBalance / 2,
      remoteBalance: totalBalance.remoteBalance / 2,
    },
  ],
});

const mockGetWalletBalance = jest.fn().mockResolvedValue({
  totalBalance: 1,
  confirmedBalance: 2,
  unconfirmedBalance: 3,
});

jest.mock('../../../lib/lightning/LndClient', () => {
  return jest.fn().mockImplementation(() => ({
    on: () => {},
    getInfo: mockGetInfo,
    sendPayment: mockSendPayment,
    listChannels: mockListChannels,
    getWalletBalance: mockGetWalletBalance,
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
  ];

  const currencies = new Map<string, Currency>([
    ['BTC', {
      symbol: 'BTC',
      network: Networks.bitcoinRegtest,
      config: {
        timeoutBlockDelta: 1,
      } as any,
      lndClient: mockedLndClient(),
      chainClient: mockedChainClient(),
    }],
  ]);

  const service = new Service(
    Logger.disabledLogger,
    {} as ConfigType,
    mockedSwapManager(),
    mockedWalletManager(),
    currencies,
    Number.MAX_SAFE_INTEGER,
  );

  beforeEach(() => {
    mockGetFees.mockClear();
    mockGetPairs.mockClear();
    mockEstimateFee.mockClear();
    mockSendRawTransaction.mockClear();
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

    expect(mockAddPair).toHaveBeenCalledTimes(1);
    expect(mockAddPair).toHaveBeenCalledWith({
      id: 'BTC/BTC',
      ...configPairs[0],
    });

    expect(mockInitFeeProvider).toHaveBeenCalledTimes(1);
    expect(mockInitFeeProvider).toHaveBeenCalledWith(configPairs);

    expect(mockInitRateProvider).toHaveBeenCalledTimes(1);
    expect(mockInitRateProvider).toHaveBeenCalledWith(configPairs);
  });

  test('should get info', async () => {
    const info = (await service.getInfo()).toObject();

    expect(mockGetInfo).toHaveBeenCalledTimes(1);
    expect(mockGetNetworkInfo).toHaveBeenCalledTimes(1);
    expect(mockGetBlockchainInfo).toHaveBeenCalledTimes(1);

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
    const response = (await service.getBalance()).toObject();
    const balance = response.balancesMap[0];

    expect(balance[0]).toEqual('BTC');
    expect(balance[1]).toEqual({
      walletBalance: {
        ...(await mockGetBalance()),
      },
      lightningBalance: {
        channelBalance: {
          ...totalBalance,
        },
        walletBalance: {
          ...(await mockGetWalletBalance()),
        },
      },
    });

    const singleResponse = (await service.getBalance('BTC')).toObject();

    response.balancesMap.pop();
    expect(response).toEqual(singleResponse);

    // Throw if currency cannot be found
    const notFound = 'notFound';

    await expect(service.getBalance(notFound))
      .rejects.toEqual(Errors.CURRENCY_NOT_FOUND(notFound));
  });

  test('should get pairs', () => {
    expect(service.getPairs()).toEqual({
      pairs,
      warnings: [],
    });

    service.allowReverseSwaps = false;

    expect(service.getPairs()).toEqual({
      pairs,
      warnings: [
        ServiceWarning.ReverseSwapsDisabled,
      ],
    });

    service.allowReverseSwaps = true;
  });

  test('should get transactions', async () => {
    await expect(service.getTransaction('BTC', ''))
      .resolves.toEqual(rawTransaction);

    // Throw if currency cannot be found
    const notFound = 'notFound';

    await expect(service.getTransaction(notFound, ''))
      .rejects.toEqual(Errors.CURRENCY_NOT_FOUND(notFound));
  });

  test('should get new addresses', async () => {
    const type = 2;

    await expect(service.newAddress('BTC', type))
      .resolves.toEqual(newAddress);

    expect(mockGetNewAddress).toHaveBeenCalledTimes(1);
    expect(mockGetNewAddress).toHaveBeenCalledWith(getOutputType(type));

    // Throw if currency cannot be found
    const notFound = 'notFound';

    await expect(service.newAddress(notFound))
      .rejects.toEqual(Errors.CURRENCY_NOT_FOUND(notFound));
  });

  test('should get fee estimation', async () => {
    // Get fee estimation of all currencies
    const feeEstimation = await service.getFeeEstimation();

    expect(feeEstimation).toEqual(new Map<string, number>([
      ['BTC', 2],
    ]));

    expect(mockEstimateFee).toHaveBeenCalledTimes(1);
    expect(mockEstimateFee).toHaveBeenNthCalledWith(1, 2);

    // Get fee estimation for a single currency
    expect(await service.getFeeEstimation('BTC')).toEqual(feeEstimation);

    expect(mockEstimateFee).toHaveBeenCalledTimes(2);
    expect(mockEstimateFee).toHaveBeenNthCalledWith(2, 2);

    // Get fee estimation for a single currency for a specified amount of blocks
    expect(await service.getFeeEstimation('BTC', 5)).toEqual(feeEstimation);

    expect(mockEstimateFee).toHaveBeenCalledTimes(3);
    expect(mockEstimateFee).toHaveBeenNthCalledWith(3, 5);

    // Get fee estimation for a single currency that cannot be found
    const notFound = 'notFound';

    await expect(service.getFeeEstimation('notFound'))
      .rejects.toEqual(Errors.CURRENCY_NOT_FOUND(notFound));
  });

  test('should broadcast transactions', async () => {
    const transactionHex = 'hex';

    await expect(service.broadcastTransaction('BTC', transactionHex))
      .resolves.toEqual(sendRawTransaction);

    expect(mockSendRawTransaction).toHaveBeenCalledTimes(1);
    expect(mockSendRawTransaction).toHaveBeenCalledWith(transactionHex);

    // Throw if currency cannot be found
    const notFound = 'notFound';

    await expect(service.broadcastTransaction(notFound, transactionHex))
      .rejects.toEqual(Errors.CURRENCY_NOT_FOUND(notFound));
  });

  test('should create swaps', async () => {
    const pair = 'BTC/BTC';
    const orderSide = 'buy';
    const invoiceAmount = 100000;
    const expectedAmount = 100002;
    const refundPublicKey = getHexBuffer('0xfff');

    // tslint:disable-next-line: max-line-length
    const invoice = 'lnbcrt1m1pw5qjj2pp5fzncpqa5hycqppwvelygawz2jarnxnngry945mm3uv6janpjfvgqdqqcqzpg35dc9zwwu3jhww7q087fc8h6tjs2he6w0yulc3nz262waznvp2s5t9xlwgau2lzjl8zxjlt5jxtgkamrz2e4ct3d70azmkh2hhgddkgpg38yqt';

    // Create a new swap
    const response = await service.createSwap(pair, orderSide, invoice, refundPublicKey);

    expect(response).toEqual({
      expectedAmount,
      id: expect.anything(),
      acceptZeroConf: true,
      address: mockedSwap.address,
      redeemScript: mockedSwap.redeemScript,
      timeoutBlockHeight: mockedSwap.timeoutBlockHeight,
      bip21: 'bitcoin:bcrt1?amount=0.00100002&label=Swap%20to%20BTC',
    });

    expect(expectedAmount).toBeGreaterThan(invoiceAmount);

    expect(mockGetSwapByInvoice).toHaveBeenCalledTimes(1);
    expect(mockGetSwapByInvoice).toHaveBeenNthCalledWith(1, invoice);

    expect(mockGetFees).toHaveBeenCalledTimes(1);
    expect(mockGetFees).toHaveBeenCalledWith(pair, 1, OrderSide.BUY, invoiceAmount, false);

    expect(mockAcceptZeroConf).toHaveBeenCalledTimes(1);
    expect(mockAcceptZeroConf).toHaveBeenCalledWith('BTC', expectedAmount);

    expect(mockCreateSwap).toHaveBeenCalledTimes(1);
    expect(mockCreateSwap).toHaveBeenCalledWith(
      'BTC',
      'BTC',
      OrderSide.BUY,
      invoice,
      expectedAmount,
      refundPublicKey,
      OutputType.Compatibility,
      1,
      true,
    );

    expect(mockAddSwap).toHaveBeenCalledTimes(1);
    expect(mockAddSwap).toHaveBeenCalledWith({
      pair,
      invoice,
      fee: 1,
      id: response.id,
      acceptZeroConf: true,
      orderSide: OrderSide.BUY,
      keyIndex: mockedSwap.keyIndex,
      lockupAddress: mockedSwap.address,
      redeemScript: mockedSwap.redeemScript,
      timeoutBlockHeight: mockedSwap.timeoutBlockHeight,
    });

    // Throw if a swap with that invoice exists already
    const swapExists = 'exists';

    await expect(service.createSwap(pair, orderSide, swapExists, refundPublicKey))
      .rejects.toEqual(Errors.SWAP_WITH_INVOICE_EXISTS());

    expect(mockGetSwapByInvoice).toHaveBeenCalledTimes(2);
    expect(mockGetSwapByInvoice).toHaveBeenNthCalledWith(2, swapExists);

    // Throw if a swap doesn't respect the limits
    const invoiceLimitAmount = 0;
    // tslint:disable-next-line: max-line-length
    const invoiceLimit = 'lnbcrt1pw5ghsppp5vh0xfjh0qfslm40pvderlcvznj6rc4k7q88xn8r2k2ru0mkhnw9sdqqcqzpgryem4eex4xnftdr3fprhrpckd7mm5ckcqf5w5tns8lltu45jl9jp69s9du9nngltm2mxcce4d3lv5uuczn0p6xfyhw6w73090fq034spl7qm26';

    await expect(service.createSwap(pair, orderSide, invoiceLimit, refundPublicKey))
      .rejects.toEqual(Errors.BENEATH_MINIMAL_AMOUNT(invoiceLimitAmount, 1));
  });

  test('should create reverse swaps', async () => {
    const pair = 'BTC/BTC';
    const orderSide = 'buy';
    const onchainAmount = 99998;
    const invoiceAmount = 100000;
    const claimPublicKey = getHexBuffer('0xfff');

    service.allowReverseSwaps = true;

    const response = await service.createReverseSwap(pair, orderSide, invoiceAmount, claimPublicKey);

    expect(response).toEqual({
      onchainAmount,
      id: expect.anything(),
      invoice: mockedReverseSwap.invoice,
      redeemScript: mockedReverseSwap.redeemScript,
      lockupTransaction: mockedReverseSwap.lockupTransaction,
      lockupTransactionId: mockedReverseSwap.lockupTransactionId,
    });

    expect(mockGetFees).toHaveBeenCalledTimes(1);
    expect(mockGetFees).toHaveBeenCalledWith(pair, 1, OrderSide.BUY, invoiceAmount, true);

    expect(mockCreateReverseSwap).toHaveBeenCalledTimes(1);
    expect(mockCreateReverseSwap).toHaveBeenCalledWith(
      'BTC',
      'BTC',
      OrderSide.BUY,
      invoiceAmount,
      99998,
      claimPublicKey,
      OutputType.Bech32,
      1,
    );

    expect(mockAddReverseSwap).toHaveBeenCalledTimes(1);
    expect(mockAddReverseSwap).toHaveBeenCalledWith({
      pair,
      onchainAmount,
      fee: 1,
      id: response.id,
      orderSide: OrderSide.BUY,
      invoice: response.invoice,
      keyIndex: mockedReverseSwap.keyIndex,
      minerFee: mockedReverseSwap.minerFee,
      redeemScript: mockedReverseSwap.redeemScript,
      transactionId: mockedReverseSwap.lockupTransactionId,
    });

    // Throw if the onchain amount is less than 1
    await expect(service.createReverseSwap(pair, orderSide, 1, claimPublicKey))
      .rejects.toEqual(Errors.ONCHAIN_AMOUNT_TOO_LOW());

    // Throw if a reverse swaps doesn't respect the limits
    const invoiceAmountLimit = 0;

    await expect(service.createReverseSwap(pair, orderSide, invoiceAmountLimit, claimPublicKey))
      .rejects.toEqual(Errors.BENEATH_MINIMAL_AMOUNT(invoiceAmountLimit, 1));

    // Throw if reverse swaps are disabled
    service.allowReverseSwaps = false;

    await expect(service.createReverseSwap(pair, orderSide, invoiceAmount, claimPublicKey))
      .rejects.toEqual(Errors.REVERSE_SWAPS_DISABLED());

    service.allowReverseSwaps = true;
  });

  test('should pay invoices', async () => {
    const symbol = 'BTC';
    const invoice = 'invoice';

    const response = await service.payInvoice(symbol, invoice);

    expect(mockSendPayment).toBeCalledTimes(1);
    expect(mockSendPayment).toBeCalledWith(invoice);

    expect(response).toEqual(await mockSendPayment());
  });

  test('should send coins', async () => {
    const amount = 1;
    const symbol = 'BTC';
    const sendAll = true;
    const satPerVbyte = 3;
    const address = 'bcrt1qmv7axanlc090h2j79ufg530eaw88w8rfglnjl3';

    const response = await service.sendCoins({
      amount,
      symbol,
      address,
      sendAll,
      satPerVbyte,
    });

    expect(response).toEqual({
      vout: mockTransaction.vout,
      transactionId: mockTransaction.transaction.getId(),
    });

    expect(mockSendToAddress).toHaveBeenCalledTimes(1);
    expect(mockSendToAddress).toHaveBeenCalledWith(
      address,
      OutputType.Bech32,
      false,
      amount,
      satPerVbyte,
      sendAll,
    );

    expect(mockSendRawTransaction).toHaveBeenCalledTimes(1);
    expect(mockSendRawTransaction).toHaveBeenCalledWith(
      mockTransaction.transaction.toHex(),
    );

    // Should get fee from chain client if not specified
    await service.sendCoins({
      amount,
      symbol,
      sendAll,
      address,
      satPerVbyte: 0,
    });

    expect(mockEstimateFee).toHaveBeenCalledTimes(1);
    expect(mockEstimateFee).toHaveBeenCalledWith();

    expect(mockSendToAddress).toHaveBeenCalledTimes(2);
    expect(mockSendToAddress).toHaveBeenNthCalledWith(2,
      address,
      OutputType.Bech32,
      false,
      amount,
      2,
      sendAll,
    );

    await service.sendCoins({
      amount,
      symbol,
      sendAll,
      address,
    });

    expect(mockEstimateFee).toHaveBeenCalledTimes(2);
    expect(mockEstimateFee).toHaveBeenCalledWith();

    expect(mockSendToAddress).toHaveBeenCalledTimes(3);
    expect(mockSendToAddress).toHaveBeenNthCalledWith(3,
      address,
      OutputType.Bech32,
      false,
      amount,
      2,
      sendAll,
    );

    // Throw if currency cannot be found
    const notFound = 'notFound';

    await expect(service.sendCoins({
      amount,
      address,
      sendAll,
      satPerVbyte,
      symbol: notFound,
    })).rejects.toEqual(Errors.CURRENCY_NOT_FOUND(notFound));

    // Throw if output type cannot be found
    const noOutputType = 'asdf';

    await expect(service.sendCoins({
      amount,
      symbol,
      sendAll,
      satPerVbyte,
      address: noOutputType,
    })).rejects.toEqual(Errors.SCRIPT_TYPE_NOT_FOUND(noOutputType));
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

  test('should get swap output type', () => {
    const getSwapOutputType = service['getSwapOutputType'];

    expect(getSwapOutputType('BTC', true)).toEqual(OutputType.Bech32);
    expect(getSwapOutputType('BTC', false)).toEqual(OutputType.Compatibility);

    expect(getSwapOutputType('DOGE', true)).toEqual(OutputType.Legacy);
    expect(getSwapOutputType('DOGE', false)).toEqual(OutputType.Legacy);
  });
});
