import { ECPair, Network } from 'bitcoinjs-lib';
import { Networks, OutputType } from 'boltz-core';
import Logger from '../../../lib/Logger';
import Errors from '../../../lib/swap/Errors';
import Wallet from '../../../lib/wallet/Wallet';
import { getHexBuffer } from '../../../lib/Utils';
import { OrderSide } from '../../../lib/consts/Enums';
import LndClient from '../../../lib/lightning/LndClient';
import ChainClient from '../../../lib/chain/ChainClient';
import WalletManager from '../../../lib/wallet/WalletManager';
import { MinimalReverseSwapDetails } from '../../../lib/swap/SwapNursery';
import SwapManager, { SwapDetails, ReverseSwapDetails } from '../../../lib/swap/SwapManager';

const mockBindCurrency = jest.fn().mockImplementation();

const mockAddSwap = jest.fn().mockImplementation();
const mockAddReverseSwap = jest.fn().mockImplementation();

jest.mock('../../../lib/swap/SwapNursery', () => {
  return jest.fn().mockImplementation(() => ({
    addSwap: mockAddSwap,
    bindCurrency: mockBindCurrency,
    addReverseSwap: mockAddReverseSwap,
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

const addedHoldInvoice = {
  paymentRequest: 'lnbcrt1hold',
};
const mockAddHoldInvoice = jest.fn().mockResolvedValue(addedHoldInvoice);

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
    queryRoutes: mockQueryRoutes,
    decodePayReq: mockDecodePayReq,
    addHoldInvoice: mockAddHoldInvoice,
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
      config: {} as any,
      lndClient: mockedLndClient(),
      chainClient: mockedChainClient(),
    },
    {
      symbol: 'LTC',
      network: Networks.litecoinRegtest,
      config: {} as any,
      lndClient: mockedLndClient(),
      chainClient: mockedChainClient(),
    },
    {
      symbol: 'DOGE',
      network: Networks.dogecoinRegtest as Network,
      config: {} as any,
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
        reverseSwapTimeouts: expect.anything(),
        reverseSwapTransactions: expect.anything(),
      },
      {
        invoice,
        outputType,
        expectedAmount,
        acceptZeroConf,
        claimKeys: newKeys.keys,
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

    // Throw if the lightning currency doesn't have a LND client
    await expect(manager.createSwap(
      'DOGE',
      quoteCurrency,
      orderSide,
      '',
      expectedAmount,
      refundPublicKey,
      outputType,
      timeoutBlockDelta,
      acceptZeroConf,
    )).rejects.toEqual(Errors.NO_LND_CLIENT('DOGE'));
  });

  test('should create reverse swaps', async () => {
    const invoiceAmont = 246;
    const onchainAmount = 123;
    const baseCurrency = 'LTC';
    const quoteCurrency = 'BTC';
    const timeoutBlockDelta = 2;
    const orderSide = OrderSide.BUY;
    const outputType = OutputType.Bech32;
    const claimPublicKey = getHexBuffer('0xfff');
    const preimageHash = getHexBuffer('083236df9ca7cffc49a5164167595ae3f77f17b3fc81ed6530134816a29f9a14');

    // tslint:disable-next-line: max-line-length
    const expectedRedeemScript = '8201208763a9145c44e40d43303607cabd1dd1fd00384ac41c6d5d88006775017db17521023d9e44575cd6f03dbc851cc9a6e037339302d0faad6a8d86284745146850633e68ac';
    const expectedOutputScript = getHexBuffer('00204ad5075f8a83a2736ebca13fc319702e5bc3e274a9cd579da2da0dba183175b5');

    const response = await manager.createReverseSwap(
      baseCurrency,
      quoteCurrency,
      orderSide,
      preimageHash,
      invoiceAmont,
      onchainAmount,
      claimPublicKey,
      outputType,
      timeoutBlockDelta,
    );

    expect(response).toEqual({
      keyIndex: newKeys.index,
      lockupAddress: encodedAddress,
      redeemScript: expectedRedeemScript,
      invoice: addedHoldInvoice.paymentRequest,
      timeoutBlockHeight: timeoutBlockDelta + blockchainInfo.blocks,
    });

    expect(mockAddHoldInvoice).toHaveBeenCalledTimes(1);
    expect(mockAddHoldInvoice).toHaveBeenCalledWith(invoiceAmont, preimageHash, 'Reverse Swap to LTC');

    expect(mockGetNewKeys).toHaveBeenCalledTimes(1);

    expect(mockGetBlockchainInfo).toHaveBeenCalledTimes(1);

    expect(mockEncodeAddress).toHaveBeenCalledTimes(1);
    expect(mockEncodeAddress).toHaveBeenCalledWith(expectedOutputScript);

    expect(mockUpdateOutputFilter).toHaveBeenCalledTimes(1);
    expect(mockUpdateOutputFilter).toHaveBeenCalledWith([expectedOutputScript]);

    expect(mockAddReverseSwap).toHaveBeenCalledTimes(1);
    expect(mockAddReverseSwap).toHaveBeenCalledWith(
      {
        outputType,
        preimageHash,
        refundKeys: newKeys.keys,
        sendingSymbol: baseCurrency,
        receivingSymbol: quoteCurrency,
        redeemScript: getHexBuffer(expectedRedeemScript),

        sendingDetails: {
          amount: onchainAmount,
          address: encodedAddress,
        },
      },
      addedHoldInvoice.paymentRequest,
      response.timeoutBlockHeight,
    );
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

      reverseSwaps: new Map<string, ReverseSwapDetails>(),
      reverseSwapTransactions: new Map<string, MinimalReverseSwapDetails>(),
      reverseSwapTimeouts: new Map<number, MinimalReverseSwapDetails[]>(),
    });

    // Throw if currency cannot be found
    const notFound = 'notFound';

    expect(() => getCurrency(notFound)).toThrow(
      Errors.CURRENCY_NOT_FOUND(notFound).message ,
    );
  });
});
