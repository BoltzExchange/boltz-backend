import { ECPair } from 'bitcoinjs-lib';
import { Networks, OutputType } from 'boltz-core';
import Logger from '../../../lib/Logger';
import Errors from '../../../lib/swap/Errors';
import Wallet from '../../../lib/wallet/Wallet';
import { getHexBuffer } from '../../../lib/Utils';
import { OrderSide } from '../../../lib/consts/Enums';
import SwapManager, { SwapDetails, ReverseSwapDetails } from '../../../lib/swap/SwapManager';
import LndClient from '../../../lib/lightning/LndClient';
import ChainClient from '../../../lib/chain/ChainClient';
import WalletManager from '../../../lib/wallet/WalletManager';

const mockAddSwap = jest.fn().mockImplementation();
const mockBindCurrency = jest.fn().mockImplementation();

jest.mock('../../../lib/swap/SwapNursery', () => {
  return jest.fn().mockImplementation(() => ({
    addSwap: mockAddSwap,
    bindCurrency: mockBindCurrency,
  }));
});

const blockchainInfo = {
  blocks: 123,
};
const mockGetBlockchainInfo = jest.fn().mockResolvedValue(blockchainInfo);

const mockUpdateOutputFilter = jest.fn().mockImplementation();

const mockSendRawTransaction = jest.fn().mockImplementation();

jest.mock('../../../lib/chain/ChainClient', () => {
  return jest.fn().mockImplementation(() => ({
    getBlockchainInfo: mockGetBlockchainInfo,
    updateOutputFilter: mockUpdateOutputFilter,
    sendRawTransaction: mockSendRawTransaction,
  }));
});

const mockedChainClient = <jest.Mock<ChainClient>><any>ChainClient;

const addedInvoice = {
  paymentRequest: 'lnbcrt1',
  rHash: 'lHnyKGRo1CGqZmbFa4JVnhAoy3jasXZc/QxBdmJaSCg=',
};
const mockAddInvoice = jest.fn().mockResolvedValue(addedInvoice);

const decodedPayReq = {
  numSatoshis: 10000,
  routeHintsList: [],
  destination: '03605d88f1e91df6803a55f167d7e13f3dfa07254e9dd59840e3b818d91a9fe7ad',
  paymentHash: 'ddcdf979c7fde5c6fc775f38f1ff1b7dadf67deeddd9a7f4d77e5ef1af7af787b6ddc779d3cdf6e7bf1b77471a75c71b',
};
const mockDecodePayReq = jest.fn().mockImplementation(async (invoice: string) => {
  switch (invoice) {
    case 'noRoutes':
      return {
        ...decodedPayReq,
        destination: 'noRoutes',
      };

    case 'routeHints':
      return {
        ...decodedPayReq,
        destination: 'noRoutes',
        routeHintsList: [
          0,
        ],
      };

    default:
      return decodedPayReq;
  }
});

const mockQueryRoutes = jest.fn().mockImplementation(async (destination: string) => {
  switch (destination) {
    case 'noRoutes':
    case 'routeHints':
      return {
        routesList: [],
      };

    default:
      return {
        routesList: [
          0,
        ],
      };
  }
});

jest.mock('../../../lib/lightning/LndClient', () => {
  return jest.fn().mockImplementation(() => ({
    addInvoice: mockAddInvoice,
    queryRoutes: mockQueryRoutes,
    decodePayReq: mockDecodePayReq,
  }));
});

const mockedLndClient = <jest.Mock<LndClient>><any>LndClient;

const newKeys = {
  index: 42,
  keys: ECPair.fromWIF('cPWHfRKmx1JYxXxokET9rkQZxuMs3xTCqx9Vk9XDAgKZNVpFbTur', Networks.bitcoinRegtest),
};
const mockGetNewKeys = jest.fn().mockReturnValue(newKeys);

const encodedAddress = 'bcrt1';
const mockEncodeAddress = jest.fn().mockReturnValue(encodedAddress);

const transactionSent = {
  vout: 1,
  fee: 123,
  transaction: {
    getId: () => 'id',
    toHex: () => 'hex',
    getHash: () => getHexBuffer('0xfff'),
  },
};
const mockSendToAddress = jest.fn().mockResolvedValue(transactionSent);

jest.mock('../../../lib/wallet/Wallet', () => {
  return jest.fn().mockImplementation(() => ({
    getNewKeys: mockGetNewKeys,
    encodeAddress: mockEncodeAddress,
    sendToAddress: mockSendToAddress,
  }));
});

const mockedWallet = <jest.Mock<Wallet>><any>Wallet;

jest.mock('../../../lib/wallet/WalletManager', () => {
  return jest.fn().mockImplementation(() => ({
    wallets: new Map<string, Wallet>([
      ['BTC', mockedWallet()],
      ['LTC', mockedWallet()],
    ]),
  }));
});

const mockedWalletManager = <jest.Mock<WalletManager>><any>WalletManager;

describe('SwapManager', () => {
  const currencies = [
    {
      symbol: 'BTC',
      network: Networks.bitcoinRegtest,
      config: {
        timeoutBlockDelta: 1,
      } as any,
      lndClient: mockedLndClient(),
      chainClient: mockedChainClient(),
    },
    {
      symbol: 'LTC',
      network: Networks.litecoinRegtest,
      config: {
        timeoutBlockDelta: 4,
      } as any,
      lndClient: mockedLndClient(),
      chainClient: mockedChainClient(),
    },
  ];

  const manager = new SwapManager(
    Logger.disabledLogger,
    mockedWalletManager(),
    currencies,
  );

  beforeEach(() => {
    mockGetNewKeys.mockClear();
    mockEncodeAddress.mockClear();
    mockGetBlockchainInfo.mockClear();
    mockUpdateOutputFilter.mockClear();
  });

  test('should create swaps', async () => {
    const invoice = 'lnbcrt1';
    const expectedAmount = 123;
    const baseCurrency = 'LTC';
    const quoteCurrency = 'BTC';
    const acceptZeroConf = true;
    const timeoutBlockDelta = 2;
    const orderSide = OrderSide.BUY;
    const outputType = OutputType.Compatibility;
    const refundPublicKey = getHexBuffer('0xfff');

    const expectedOutputScript = getHexBuffer('a914205d5fb9e785f0df21c9fac5594496e90135058387');
    const expectedTimeoutBlockHeight = blockchainInfo.blocks + timeoutBlockDelta;

    const response = await manager.createSwap(
      baseCurrency,
      quoteCurrency,
      orderSide,
      invoice,
      expectedAmount,
      refundPublicKey,
      outputType,
      timeoutBlockDelta,
      acceptZeroConf,
    );

    expect(response).toEqual({
      address: encodedAddress,
      keyIndex: newKeys.index,
      timeoutBlockHeight: expectedTimeoutBlockHeight,

      // tslint:disable-next-line: max-line-length
      redeemScript: 'a914c7a349a62d13115097a38475d4002b67084e0b0f876321023d9e44575cd6f03dbc851cc9a6e037339302d0faad6a8d86284745146850633e67017db1750068ac',
    });

    expect(mockGetBlockchainInfo).toHaveBeenCalledTimes(1);

    expect(mockDecodePayReq).toHaveBeenCalledTimes(1);
    expect(mockDecodePayReq).toHaveBeenCalledWith(invoice);

    expect(mockQueryRoutes).toHaveBeenCalledTimes(1);
    expect(mockQueryRoutes).toHaveBeenCalledWith(
      decodedPayReq.destination,
      decodedPayReq.numSatoshis,
    );

    expect(mockGetNewKeys).toHaveBeenCalledTimes(1);

    expect(mockAddSwap).toHaveBeenCalledTimes(1);
    expect(mockAddSwap).toHaveBeenCalledWith(
      {
        ...currencies[0],
        wallet: expect.anything(),

        swaps: expect.anything(),
        swapTimeouts: expect.anything(),
        reverseSwaps: expect.anything(),
      },
      {
        invoice,
        outputType,
        expectedAmount,
        acceptZeroConf,
        claimKeys: newKeys.keys,
        lndClient: expect.anything(),
        redeemScript: getHexBuffer(response.redeemScript),
      },
      getHexBuffer('a914205d5fb9e785f0df21c9fac5594496e90135058387'),
      expectedTimeoutBlockHeight,
    );

    expect(mockUpdateOutputFilter).toHaveBeenCalledTimes(1);
    expect(mockUpdateOutputFilter).toHaveBeenCalledWith([
      expectedOutputScript,
    ]);

    expect(mockEncodeAddress).toHaveBeenCalledTimes(1);
    expect(mockEncodeAddress).toHaveBeenCalledWith(expectedOutputScript);

    // Should not perform a route check if the invoice has route hints
    await expect(manager.createSwap(
      baseCurrency,
      quoteCurrency,
      orderSide,
      'routeHints',
      expectedAmount,
      refundPublicKey,
      outputType,
      timeoutBlockDelta,
      acceptZeroConf,
    )).resolves.toEqual(response);

    // Check that no routes were queried
    expect(mockQueryRoutes).toHaveBeenCalledTimes(1);

    // Throw if no route can be found
    await expect(manager.createSwap(
      baseCurrency,
      quoteCurrency,
      orderSide,
      'noRoutes',
      expectedAmount,
      refundPublicKey,
      outputType,
      timeoutBlockDelta,
      acceptZeroConf,
    )).rejects.toEqual(Errors.NO_ROUTE_FOUND());
  });

  test('should create reverse swaps', async () => {
    const invoiceAmont = 246;
    const onchainAmount = 123;
    const baseCurrency = 'LTC';
    const quoteCurrency = 'BTC';
    const timeoutBlockDelta = 2;
    const orderSide = OrderSide.BUY;
    const claimPublicKey = getHexBuffer('0xfff');

    // tslint:disable-next-line: max-line-length
    const expectedRedeemScript = 'a9149213f2c84e856d554c52bae6580284d1115b4e9287630067017db17521023d9e44575cd6f03dbc851cc9a6e037339302d0faad6a8d86284745146850633e68ac';
    const expectedOutputScript = getHexBuffer('0020193b0d2145878a5dd45f6d43188fcd29df7dee7cbb57706541d7b246d0f40074');

    const response = await manager.createReverseSwap(
      baseCurrency,
      quoteCurrency,
      orderSide,
      invoiceAmont,
      onchainAmount,
      claimPublicKey,
      timeoutBlockDelta,
    );

    expect(response).toEqual({
      keyIndex: newKeys.index,
      minerFee: transactionSent.fee,
      lockupAddress: encodedAddress,
      redeemScript: expectedRedeemScript,
      invoice: addedInvoice.paymentRequest,
      lockupTransaction: transactionSent.transaction.toHex(),
      lockupTransactionId: transactionSent.transaction.getId(),
      timeoutBlockHeight: timeoutBlockDelta + blockchainInfo.blocks,
    });

    expect(mockAddInvoice).toHaveBeenCalledTimes(1);
    expect(mockAddInvoice).toHaveBeenCalledWith(invoiceAmont);

    expect(mockGetNewKeys).toHaveBeenCalledTimes(1);

    expect(mockGetBlockchainInfo).toHaveBeenCalledTimes(1);

    expect(mockEncodeAddress).toHaveBeenCalledTimes(1);
    expect(mockEncodeAddress).toHaveBeenCalledWith(expectedOutputScript);

    expect(mockUpdateOutputFilter).toHaveBeenCalledTimes(1);
    expect(mockUpdateOutputFilter).toHaveBeenCalledWith([expectedOutputScript]);

    expect(mockSendToAddress).toHaveBeenCalledTimes(1);
    expect(mockSendToAddress).toHaveBeenCalledWith(
      encodedAddress,
      OutputType.Bech32,
      true,
      onchainAmount,
    );

    expect(mockSendRawTransaction).toHaveBeenCalledTimes(1);
    expect(mockSendRawTransaction).toHaveBeenCalledWith(transactionSent.transaction.toHex());

    const reverseSwapDetails = {
      refundKeys: newKeys.keys,
      redeemScript: getHexBuffer(expectedRedeemScript),
      output: {
        value: onchainAmount,
        type: OutputType.Bech32,
        vout: transactionSent.vout,
        script: expectedOutputScript,
        txHash: transactionSent.transaction.getHash(),
      },
    };

    expect(manager['currencies'].get('LTC')!.reverseSwaps.get(125)).toEqual([reverseSwapDetails]);

    await expect(manager.createReverseSwap(
      baseCurrency,
      quoteCurrency,
      orderSide,
      invoiceAmont,
      onchainAmount,
      claimPublicKey,
      timeoutBlockDelta,
    )).resolves.toEqual(response);

    expect(manager['currencies'].get('LTC')!.reverseSwaps.get(125)).toEqual([
      reverseSwapDetails,
      reverseSwapDetails,
    ]);
  });

  test('should check routability', async () => {
    const checkRoutability = manager['checkRoutability'];

    const lndClient = mockedLndClient();

    await expect(checkRoutability(lndClient, '', 1)).resolves.toBeTruthy();
    await expect(checkRoutability(lndClient, 'noRoutes', 1)).resolves.toBeFalsy();

    // Return false if "queryRoutes" throws
    lndClient['queryRoutes'] = async () => {
      throw 'whatever';
    };

    await expect(checkRoutability(lndClient, '', 1)).resolves.toBeFalsy();
  });

  test('should get currencies', () => {
    const getCurrencies = manager['getCurrencies'];

    expect(getCurrencies('LTC', 'BTC', OrderSide.BUY)).toEqual({
      sendingCurrency: {
        ...manager['currencies'].get('LTC'),
        wallet: manager['walletManager'].wallets.get('LTC'),
      },
      receivingCurrency: {
        ...manager['currencies'].get('BTC'),
        wallet: manager['walletManager'].wallets.get('BTC'),
      },
    });

    expect(getCurrencies('LTC', 'BTC', OrderSide.SELL)).toEqual({
      sendingCurrency: {
        ...manager['currencies'].get('BTC'),
        wallet: manager['walletManager'].wallets.get('BTC'),
      },
      receivingCurrency: {
        ...manager['currencies'].get('LTC'),
        wallet: manager['walletManager'].wallets.get('LTC'),
      },
    });

  });

  test('should get currency', () => {
    const getCurrency = manager['getCurrency'];

    expect(getCurrency('BTC')).toEqual({
      ...currencies[0],

      swaps: new Map<string, SwapDetails>(),
      swapTimeouts: new Map<number, string[]>(),

      reverseSwaps: new Map<number, ReverseSwapDetails[]>(),
    });

    // Throw if currency cannot be found
    const notFound = 'notFound';

    expect(() => getCurrency(notFound)).toThrow(
      Errors.CURRENCY_NOT_FOUND(notFound).message ,
    );
  });
});
