import Logger from '../../../lib/Logger';
import Database from '../../../lib/db/Database';
import { Network } from '../../../lib/consts/Enums';
import FeeProvider from '../../../lib/rates/FeeProvider';
import RateProvider from '../../../lib/rates/RateProvider';
import { Currency } from '../../../lib/wallet/WalletManager';
import PairRepository from '../../../lib/service/PairRepository';
import DataProvider from '../../../lib/rates/data/DataProvider';

FeeProvider.transactionSizes = {
  normalClaim: 140,

  reverseLockup: 153,
  reverseClaim: 138,
};

const rates = {
  LTC: 0.015,
  BTC: 1,
};

const percentageFees = new Map<string, number>([
  ['LTC/BTC', 0.01],
  ['BTC/BTC', 0.005],
]);

const minerFees = {
  BTC: {
    normal: FeeProvider.transactionSizes.normalClaim * 2,
    reverse: {
      lockup: FeeProvider.transactionSizes.reverseLockup * 2,
      claim: FeeProvider.transactionSizes.reverseClaim * 2,
    },
  },
  LTC: {
    normal: FeeProvider.transactionSizes.normalClaim ,
    reverse: {
      lockup: FeeProvider.transactionSizes.reverseLockup,
      claim: FeeProvider.transactionSizes.reverseClaim,
    },
  },
};

jest.mock('../../../lib/rates/FeeProvider', () => {
  return jest.fn().mockImplementation(() => {
    return {
      percentageFees,
      getBaseFee: (chainCurrency: string, isReverse: boolean) => {
        const minerFeesCurrency = chainCurrency === 'BTC' ? minerFees.BTC : minerFees.LTC;

        return isReverse ? minerFeesCurrency.reverse.lockup : minerFeesCurrency.normal;
      },
    };
  });
});

const mockedFeeProvider = <jest.Mock<FeeProvider>><any>FeeProvider;

jest.mock('../../../lib/rates/data/DataProvider', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getPrice: (baseAsset: string) => {
        return new Promise((resolve) => {
          if (baseAsset === 'BTC') {
            resolve(rates.BTC);
          } else {
            resolve(rates.LTC);
          }
        });
      },
    };
  });
});

const mockedDataProvider = <jest.Mock<DataProvider>><any>DataProvider;

describe('RateProvider', () => {
  const btcCurrency = {
    symbol: 'BTC',
    config: {
      symbol: 'BTC',
      network: Network.Regtest,

      maxSwapAmount: 100000000000,
      minSwapAmount: 1,

      maxZeroConfAmount: 10000000,
    },
  } as any as Currency;

  const ltcCurreny = {
    symbol: 'LTC',
    config: {
      symbol: 'LTC',
      network: Network.Regtest,

      maxSwapAmount: 1000000000,
      minSwapAmount: 100000,

      maxZeroConfAmount: 1000000,
    },
  } as any as Currency;

  const rateProvider = new RateProvider(Logger.disabledLogger, mockedFeeProvider(), 0.1, [
    btcCurrency,
    ltcCurreny,
  ]);

  rateProvider['dataProvider'] = mockedDataProvider();

  const db = new Database(Logger.disabledLogger, ':memory:');
  const pairRepository = new PairRepository();

  beforeAll(async () => {
    await db.init();

    await Promise.all([
      pairRepository.addPair({
        id: 'LTC/BTC',
        base: 'LTC',
        quote: 'BTC',
      }),
      pairRepository.addPair({
        id: 'BTC/BTC',
        base: 'BTC',
        quote: 'BTC',
      }),
    ]);
  });

  test('should init', async () => {
    const dbPairs = await pairRepository.getPairs();
    await rateProvider.init(dbPairs);
  });

  test('should get rates', () => {
    const { pairs } = rateProvider;

    expect(pairs.get('BTC/BTC')!.rate).toEqual(rates.BTC);
    expect(pairs.get('LTC/BTC')!.rate).toEqual(rates.LTC);
  });

  test('should get limits', () => {
    const { pairs } = rateProvider;

    expect(pairs.get('BTC/BTC')!.limits).toEqual({
      maximal: btcCurrency.config.maxSwapAmount,
      minimal: btcCurrency.config.minSwapAmount,

      maximalZeroConf: {
        baseAsset: btcCurrency.config.maxZeroConfAmount,
        quoteAsset: btcCurrency.config.maxZeroConfAmount,
      },
    });
    expect(pairs.get('LTC/BTC')!.limits).toEqual({
      maximal: Math.min(btcCurrency.config.maxSwapAmount, ltcCurreny.config.maxSwapAmount * rates.LTC),
      minimal: Math.max(btcCurrency.config.minSwapAmount, ltcCurreny.config.minSwapAmount * rates.LTC),

      maximalZeroConf: {
        baseAsset: ltcCurreny.config.maxZeroConfAmount,
        quoteAsset: btcCurrency.config.maxZeroConfAmount,
      },
    });
  });

  test('should get percentage fees', () => {
    const { pairs } = rateProvider;

    percentageFees.forEach((_, pairId) => {
      expect(pairs.get(pairId)!.fees.percentage).toEqual(percentageFees.get(pairId)! * 100);
    });
  });

  test('should get miner fees', () => {
    const { pairs } = rateProvider;

    expect(pairs.get('BTC/BTC')!.fees.minerFees).toEqual({ baseAsset: minerFees.BTC, quoteAsset: minerFees.BTC });
    expect(pairs.get('LTC/BTC')!.fees.minerFees).toEqual({ baseAsset: minerFees.LTC, quoteAsset: minerFees.BTC });
  });

  test('should accept 0-conf for amounts lower than threshold', () => {
    // Should return false for undefined maximal allowed amounts
    expect(rateProvider.acceptZeroConf('ETH', 0)).toEqual(false);

    expect(rateProvider.acceptZeroConf('BTC', btcCurrency.config.maxZeroConfAmount + 1)).toEqual(false);

    expect(rateProvider.acceptZeroConf('BTC', btcCurrency.config.maxZeroConfAmount)).toEqual(true);
    expect(rateProvider.acceptZeroConf('BTC', btcCurrency.config.maxZeroConfAmount - 1)).toEqual(true);
  });

  afterAll(async () => {
    rateProvider.disconnect();
  });
});
