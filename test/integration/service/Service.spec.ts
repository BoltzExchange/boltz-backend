import Logger from '../../../lib/Logger';
import { CurrencyType } from '../../../lib/consts/Enums';
import RoutingFee from '../../../lib/lightning/RoutingFee';
import Errors from '../../../lib/service/Errors';
import Service from '../../../lib/service/Service';
import OverpaymentProtector from '../../../lib/swap/OverpaymentProtector';
import type { Currency } from '../../../lib/wallet/WalletManager';
import { bitcoinClient, elementsClient } from '../Nodes';

jest.mock('../../../lib/service/BalanceCheck', () => {
  return jest.fn().mockImplementation(() => ({}));
});
jest.mock('../../../lib/service/ElementsService', () => {
  return jest.fn().mockImplementation(() => ({}));
});
jest.mock('../../../lib/service/EventHandler', () => {
  return jest.fn().mockImplementation(() => ({}));
});
jest.mock('../../../lib/service/NodeInfo', () => {
  return jest.fn().mockImplementation(() => ({}));
});
jest.mock('../../../lib/service/PaymentRequestUtils', () => {
  return jest.fn().mockImplementation(() => ({}));
});
jest.mock('../../../lib/service/TimeoutDeltaProvider', () => {
  return jest.fn().mockImplementation(() => ({}));
});
jest.mock('../../../lib/service/TransactionFetcher', () => {
  return jest.fn().mockImplementation(() => ({}));
});
jest.mock('../../../lib/service/cooperative/MusigSigner', () => {
  return jest.fn().mockImplementation(() => ({}));
});
jest.mock('../../../lib/rates/LockupTransactionTracker', () => {
  return jest.fn().mockImplementation(() => ({}));
});
jest.mock('../../../lib/rates/RateProvider', () => {
  return jest.fn().mockImplementation(() => ({
    feeProvider: {},
  }));
});
jest.mock('../../../lib/swap/SwapManager', () => {
  return jest.fn().mockImplementation(() => ({
    eipSigner: {
      refundSignatureLock: jest.fn(),
    },
    nursery: {},
  }));
});
jest.mock('../../../lib/db/repositories/ChainTipRepository');

describe('Service', () => {
  const missingTransactionId =
    '277014b6ff0b872dbd6dbfe506b1bfc7b5467a4096a0a27a06b0924423541e33';

  const currencies = new Map<string, Currency>([
    [
      'BTC',
      {
        symbol: 'BTC',
        type: CurrencyType.BitcoinLike,
        limits: {},
        lndClients: new Map(),
        chainClient: bitcoinClient,
      },
    ],
    [
      'L-BTC',
      {
        symbol: 'L-BTC',
        type: CurrencyType.Liquid,
        limits: {},
        lndClients: new Map(),
        chainClient: elementsClient,
      },
    ],
  ]);
  const service = new Service(
    Logger.disabledLogger,
    undefined,
    {
      currencies: [],
      pairs: [],
      prepayminerfee: false,
      rates: {
        interval: Number.MAX_SAFE_INTEGER,
      },
      retryInterval: 1,
      swap: {
        minSwapSizeMultipliers: {},
      },
      swapwitnessaddress: false,
    } as any,
    {
      ethereumManagers: [],
      wallets: new Map(),
    } as any,
    {} as any,
    currencies,
    {} as any,
    {
      cltvDelta: 20,
    },
    new RoutingFee(Logger.disabledLogger),
    new OverpaymentProtector(Logger.disabledLogger),
  );

  beforeAll(async () => {
    await Promise.all([bitcoinClient.generate(1), elementsClient.generate(1)]);
  });

  afterAll(() => {
    bitcoinClient.disconnect();
    elementsClient.disconnect();
  });

  test.each`
    symbol
    ${'BTC'}
    ${'L-BTC'}
  `(
    'should normalize missing transaction errors for $symbol',
    async ({ symbol }) => {
      await expect(
        service.getTransaction(symbol, missingTransactionId),
      ).rejects.toEqual(Errors.NO_TRANSACTION(missingTransactionId));
    },
  );
});
