import { Networks, Scripts, OutputType } from 'boltz-core';
import { ECPair, Network } from 'bitcoinjs-lib';
import Logger from '../../../lib/Logger';
import Errors from '../../../lib/swap/Errors';
import Swap from '../../../lib/db/models/Swap';
import Wallet from '../../../lib/wallet/Wallet';
import SwapManager from '../../../lib/swap/SwapManager';
import LndClient from '../../../lib/lightning/LndClient';
import ChainClient from '../../../lib/chain/ChainClient';
import RateProvider from '../../../lib/rates/RateProvider';
import WalletManager from '../../../lib/wallet/WalletManager';
import { getHexBuffer, getHexString } from '../../../lib/Utils';
import { OrderSide, SwapUpdateEvent } from '../../../lib/consts/Enums';

const mockAddSwap = jest.fn().mockResolvedValue(undefined);
const mockGetSwaps = jest.fn().mockResolvedValue([]);
const mockSetInvoice = jest.fn().mockResolvedValue(undefined);

jest.mock('../../../lib/db/SwapRepository', () => {
  return jest.fn().mockImplementation(() => ({
    addSwap: mockAddSwap,
    getSwaps: mockGetSwaps,
    setInvoice: mockSetInvoice,
  }));
});

const mockAddReverseSwap = jest.fn().mockResolvedValue(undefined);
const mockGetReverseSwaps = jest.fn().mockResolvedValue([]);

jest.mock('../../../lib/db/ReverseSwapRepository', () => {
  return jest.fn().mockImplementation(() => ({
    addReverseSwap: mockAddReverseSwap,
    getReverseSwaps: mockGetReverseSwaps,
  }));
});

const mockBindCurrency = jest.fn().mockImplementation();

jest.mock('../../../lib/swap/SwapNursery', () => {
  return jest.fn().mockImplementation(() => ({
    bindCurrency: mockBindCurrency,
  }));
});

const blockchainInfo = {
  blocks: 123,
};
const mockGetBlockchainInfo = jest.fn().mockResolvedValue(blockchainInfo);

const mockAddOutputFilter = jest.fn().mockImplementation();
const mockSendRawTransaction = jest.fn().mockImplementation();

jest.mock('../../../lib/chain/ChainClient', () => {
  return jest.fn().mockImplementation(() => ({
    addOutputFilter: mockAddOutputFilter,
    getBlockchainInfo: mockGetBlockchainInfo,
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
  paymentHash: '9f4b3552fbb1c82fbe1802e19dbc2f01615b2b455c8c76373457d6ee75bca143',
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

const mockSubscribeSingleInvoice = jest.fn().mockImplementation();

jest.mock('../../../lib/lightning/LndClient', () => {
  return jest.fn().mockImplementation(() => ({
    queryRoutes: mockQueryRoutes,
    decodePayReq: mockDecodePayReq,
    addHoldInvoice: mockAddHoldInvoice,
    subscribeSingleInvoice: mockSubscribeSingleInvoice,
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
    {} as RateProvider,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should init', async () => {
    await manager.init(currencies);

    // TODO: write tests
  });

  test('should create swaps', async () => {
    const baseCurrency = 'LTC';
    const quoteCurrency = 'BTC';
    const timeoutBlockDelta = 3;
    const orderSide = OrderSide.BUY;
    const preimageHash = getHexBuffer('9f4b3552fbb1c82fbe1802e19dbc2f01615b2b455c8c76373457d6ee75bca143');
    const refundPublicKey = getHexBuffer('0360ecf59b1bacc5787842a3b7094da57cf62e2fdb8cc63fbbf9c489aad782cbad');

    const expectedTimeoutBlockHeight = blockchainInfo.blocks + timeoutBlockDelta;
    const expectedRedeemScript = 'a914379299189c7558198e8116b3e1e81e8d627df093876321023d9e44575cd6f03dbc851cc9a6e037339302d0faad6a8d86284745146850633e67017eb175210360ecf59b1bacc5787842a3b7094da57cf62e2fdb8cc63fbbf9c489aad782cbad68ac';

    const response = await manager.createSwap(
      baseCurrency,
      quoteCurrency,
      orderSide,
      preimageHash,
      refundPublicKey,
      timeoutBlockDelta,
    );

    expect(response).toEqual({
      id: expect.anything(),
      address: encodedAddress,
      redeemScript: expectedRedeemScript,
      timeoutBlockHeight: expectedTimeoutBlockHeight,
    });

    expect(mockGetBlockchainInfo).toHaveBeenCalledTimes(1);
    expect(mockGetNewKeys).toHaveBeenCalledTimes(1);

    expect(mockEncodeAddress).toHaveBeenCalledTimes(1);
    expect(mockEncodeAddress).toHaveBeenCalledWith(Scripts.p2shP2wshOutput(getHexBuffer(expectedRedeemScript)));

    expect(mockAddSwap).toHaveBeenCalledTimes(1);
    expect(mockAddSwap).toHaveBeenCalledWith({
      id: response.id,
      keyIndex: newKeys.index,
      orderSide: OrderSide.BUY,
      lockupAddress: encodedAddress,
      redeemScript: expectedRedeemScript,
      status: SwapUpdateEvent.SwapCreated,
      pair: `${baseCurrency}/${quoteCurrency}`,
      preimageHash: getHexString(preimageHash),
      timeoutBlockHeight: expectedTimeoutBlockHeight,
    });

    // Throw if the lightning currency doesn't have a LND client
    await expect(manager.createSwap(
      'DOGE',
      quoteCurrency,
      orderSide,
      preimageHash,
      refundPublicKey,
      timeoutBlockDelta,
    )).rejects.toEqual(Errors.NO_LND_CLIENT('DOGE'));
  });

  test('should set invoices of swaps', async () => {
    const swap = {
      id: 'swapId',
      pair: 'LTC/BTC',
      preimageHash: '9f4b3552fbb1c82fbe1802e19dbc2f01615b2b455c8c76373457d6ee75bca143',
      redeemScript: 'a914379299189c7558198e8116b3e1e81e8d627df093876321023d9e44575cd6f03dbc851cc9a6e037339302d0faad6a8d86284745146850633e67017eb175210360ecf59b1bacc5787842a3b7094da57cf62e2fdb8cc63fbbf9c489aad782cbad68ac',
    } as any as Swap;

    const percentageFee = 2;
    const acceptZeroConf = true;
    const expectedAmount = 100002;
    const invoice = 'lnbcrt10n1p0xdf2kpp54njp3f00qvj0n64pnmkfxh08f0czev7tc5zhhj033ksesq9zxagsdqqcqzpgsp5ndcc6hxwqwza7kkyqepq9x2kjqr70x3h2nl6vuw5xk8lerakdxas9qy9qsq3arkzf9wlv5xlhclm0wkl4uvrqe6clps58klyx7v46wha8hlzk2qyl3hxf9m7pzywdc7nyv5w4phkjzqg6y4l20frcg54yqfnxspzwqqpru300';

    let invoiceSetEmitted = false;

    await manager.setSwapInvoice(swap, invoice, expectedAmount, percentageFee, acceptZeroConf, () => {
      invoiceSetEmitted = true;
    });

    expect(invoiceSetEmitted).toEqual(true);

    expect(mockDecodePayReq).toHaveBeenCalledTimes(1);
    expect(mockDecodePayReq).toHaveBeenCalledWith(invoice);

    expect(mockQueryRoutes).toHaveBeenCalledTimes(1);
    expect(mockQueryRoutes).toHaveBeenCalledWith(decodedPayReq.destination, decodedPayReq.numSatoshis);

    expect(mockSetInvoice).toHaveBeenCalledTimes(1);
    expect(mockSetInvoice).toHaveBeenCalledWith(
      swap,
      invoice,
      expectedAmount,
      percentageFee,
      acceptZeroConf,
    );

    // Should not perform a route check if the invoice has route hints
    await manager.setSwapInvoice(swap, 'routeHints', expectedAmount, percentageFee, acceptZeroConf, () => {});

    // Check that no routes were queried
    expect(mockQueryRoutes).toHaveBeenCalledTimes(1);

    // Throw if no route can be found
    await expect(manager.setSwapInvoice(
      swap,
      'noRoutes',
      expectedAmount,
      percentageFee,
      acceptZeroConf,
      () => {},
    )).rejects.toEqual(Errors.NO_ROUTE_FOUND());
  });

  test('should create reverse swaps', async () => {
    const percentageFee = 12;
    const invoiceAmount = 246;
    const onchainAmount = 123;
    const baseCurrency = 'LTC';
    const quoteCurrency = 'BTC';
    const orderSide = OrderSide.BUY;
    const onchainTimeoutBlockDelta = 2;
    const lightningTimeoutBlockDelta = 4;
    const outputType = OutputType.Bech32;
    const preimageHash = getHexBuffer('2dc03948838b38d695a73c6893d42a96ebc82a49b00dc060ae706ecea9f4af96');
    const claimPublicKey = getHexBuffer('0387a0ac0a186a6a10a403ba60b655bba98bbc701391feccda2716e54becab6dd3');

    const expectedTimeoutBlockHeight = blockchainInfo.blocks + onchainTimeoutBlockDelta;
    const expectedRedeemScript = '8201208763a914bde36c7dd2905b6270ff66764170de1a52e221e588210387a0ac0a186a6a10a403ba60b655bba98bbc701391feccda2716e54becab6dd36775017db17521023d9e44575cd6f03dbc851cc9a6e037339302d0faad6a8d86284745146850633e68ac';

    const response = await manager.createReverseSwap(
      baseCurrency,
      quoteCurrency,
      orderSide,
      preimageHash,
      invoiceAmount,
      onchainAmount,
      claimPublicKey,
      outputType,
      onchainTimeoutBlockDelta,
      lightningTimeoutBlockDelta,
      percentageFee,
    );

    expect(response).toEqual({
      id: expect.anything(),
      lockupAddress: encodedAddress,
      redeemScript: expectedRedeemScript,
      invoice: addedHoldInvoice.paymentRequest,
      timeoutBlockHeight: expectedTimeoutBlockHeight,
    });

    expect(mockAddHoldInvoice).toHaveBeenCalledTimes(1);
    expect(mockAddHoldInvoice).toHaveBeenCalledWith(invoiceAmount, preimageHash, lightningTimeoutBlockDelta, 'Send to LTC address');

    expect(mockSubscribeSingleInvoice).toHaveBeenCalledTimes(1);
    expect(mockSubscribeSingleInvoice).toHaveBeenCalledWith(preimageHash);

    expect(mockGetNewKeys).toHaveBeenCalledTimes(1);
    expect(mockGetBlockchainInfo).toHaveBeenCalledTimes(1);

    expect(mockEncodeAddress).toHaveBeenCalledTimes(1);
    expect(mockEncodeAddress).toHaveBeenCalledWith(Scripts.p2wshOutput(getHexBuffer(expectedRedeemScript)));

    expect(mockAddReverseSwap).toHaveBeenCalledTimes(1);
    expect(mockAddReverseSwap).toHaveBeenCalledWith({
      orderSide,
      onchainAmount,

      id: response.id,
      fee: percentageFee,
      keyIndex: newKeys.index,
      lockupAddress: encodedAddress,
      redeemScript: expectedRedeemScript,
      status: SwapUpdateEvent.SwapCreated,
      pair: `${baseCurrency}/${quoteCurrency}`,
      invoice: addedHoldInvoice.paymentRequest,
      timeoutBlockHeight: expectedTimeoutBlockHeight,
    });

    // Throw if the lightning currency doesn't have a LND client
    await expect(manager.createReverseSwap(
      baseCurrency,
      'DOGE',
      orderSide,
      preimageHash,
      invoiceAmount,
      onchainAmount,
      claimPublicKey,
      outputType,
      onchainTimeoutBlockDelta,
      lightningTimeoutBlockDelta,
      percentageFee,
    )).rejects.toEqual(Errors.NO_LND_CLIENT('DOGE'));
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
    });

    // Throw if currency cannot be found
    const notFound = 'notFound';

    expect(() => getCurrency(notFound)).toThrow(
      Errors.CURRENCY_NOT_FOUND(notFound).message ,
    );
  });
});
