import Logger from '../../../lib/Logger';
import Database from '../../../lib/db/Database';
import { hashString } from '../../../lib/Utils';
import { Network } from '../../../lib/consts/Enums';
import RateProvider from '../../../lib/rates/RateProvider';
import PairRepository from '../../../lib/db/repositories/PairRepository';
import { Currency } from '../../../lib/wallet/WalletManager';
import DataAggregator from '../../../lib/rates/data/DataAggregator';
import FeeProvider, { MinerFees } from '../../../lib/rates/FeeProvider';

FeeProvider.transactionSizes = {
  normalClaim: 170,

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

const minerFees = new Map<string, MinerFees>([
  [
    'BTC',
    {
      normal: FeeProvider.transactionSizes.normalClaim * 2,
      reverse: {
        lockup: FeeProvider.transactionSizes.reverseLockup * 2,
        claim: FeeProvider.transactionSizes.reverseClaim * 2,
      },
    },
  ],
  [
    'LTC',
    {
      normal: FeeProvider.transactionSizes.normalClaim ,
      reverse: {
        lockup: FeeProvider.transactionSizes.reverseLockup,
        claim: FeeProvider.transactionSizes.reverseClaim,
      },
    },
  ]
]);

let mockGetBaseFeeResult = 0;
const mockGetBaseFee = jest.fn().mockImplementation(() => {
  return mockGetBaseFeeResult;
});

const mockUpdateMinerFees = jest.fn().mockImplementation(async () => {});

const btcFee = 36;
const ltcFee = 3;

const getFeeEstimation = () => Promise.resolve(
  new Map([
    ['BTC', btcFee],
    ['LTC', ltcFee],
  ]),
);

jest.mock('../../../lib/rates/FeeProvider', () => {
  return jest.fn().mockImplementation(() => {
    return {
      minerFees,
      percentageFees,
      getBaseFee: mockGetBaseFee,
      updateMinerFees: mockUpdateMinerFees,
    };
  });
});

jest.mock('../../../lib/rates/data/DataAggregator', () => {
  const pairs = new Set<[string, string]>();
  const latestRates = new Map<string, number>();

  return jest.fn().mockImplementation(() => {
    return {
      pairs,
      latestRates,
      registerPair: (baseAsset: string, quoteAsset: string) => {
        pairs.add([baseAsset, quoteAsset]);
      },
      fetchPairs: async () => {
        latestRates.set('BTC/BTC', rates.BTC);
        latestRates.set('LTC/BTC', rates.LTC);
        return latestRates;
      },
    };
  });
});

const mockedDataProvider = <jest.Mock<DataAggregator>><any>DataAggregator;

describe('RateProvider', () => {
  const btcCurrency = {
    symbol: 'BTC',
    network: Network.Regtest,
    limits: {
      maxSwapAmount: 100000000000,
      minSwapAmount: 1,

      maxZeroConfAmount: 10000000,
    },
  } as any as Currency;

  const ltcCurrency = {
    symbol: 'LTC',
    network: Network.Regtest,
    limits: {
      maxSwapAmount: 1000000000,
      minSwapAmount: 100000,

      maxZeroConfAmount: 1000000,
    },
  } as any as Currency;

  const rateProvider = new RateProvider(
    Logger.disabledLogger,
    0.1,
    new Map<string, Currency>([
      ['BTC', btcCurrency],
      ['LTC', ltcCurrency],
    ]),
    getFeeEstimation,
  );

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
      maximal: btcCurrency.limits.maxSwapAmount,
      minimal: btcCurrency.limits.minSwapAmount,

      maximalZeroConf: {
        baseAsset: btcCurrency.limits.maxZeroConfAmount,
        quoteAsset: btcCurrency.limits.maxZeroConfAmount,
      },
    });
    expect(pairs.get('LTC/BTC')!.limits).toEqual({
      maximal: Math.min(btcCurrency.limits.maxSwapAmount, ltcCurrency.limits.maxSwapAmount * rates.LTC),
      minimal: Math.max(btcCurrency.limits.minSwapAmount, ltcCurrency.limits.minSwapAmount * rates.LTC),

      maximalZeroConf: {
        baseAsset: ltcCurrency.limits.maxZeroConfAmount,
        quoteAsset: btcCurrency.limits.maxZeroConfAmount,
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

    expect(pairs.get('BTC/BTC')!.fees.minerFees).toEqual({ baseAsset: minerFees.get('BTC'), quoteAsset: minerFees.get('BTC'), });
    expect(pairs.get('LTC/BTC')!.fees.minerFees).toEqual({ baseAsset: minerFees.get('LTC'), quoteAsset: minerFees.get('BTC'), });
  });

  test('should calculate hashes', () => {
    const { pairs } = rateProvider;

    expect(pairs.get('BTC/BTC')!.hash).toEqual(hashString(JSON.stringify({
      rate: pairs.get('BTC/BTC')!.rate,
      fees: pairs.get('BTC/BTC')!.fees,
      limits: pairs.get('BTC/BTC')!.limits,
    })));

    expect(pairs.get('LTC/BTC')!.hash).toEqual(hashString(JSON.stringify({
      rate: pairs.get('LTC/BTC')!.rate,
      fees: pairs.get('LTC/BTC')!.fees,
      limits: pairs.get('LTC/BTC')!.limits,
    })));
  });

  test('should accept 0-conf for amounts lower than threshold', () => {
    // Should return false for undefined maximal allowed amounts
    expect(rateProvider.acceptZeroConf('ETH', 0)).toEqual(false);

    expect(rateProvider.acceptZeroConf('BTC', btcCurrency.limits.maxZeroConfAmount! + 1)).toEqual(false);

    expect(rateProvider.acceptZeroConf('BTC', btcCurrency.limits.maxZeroConfAmount!)).toEqual(true);
    expect(rateProvider.acceptZeroConf('BTC', btcCurrency.limits.maxZeroConfAmount! - 1)).toEqual(true);
  });

  test('should adjust minimal limits based on current miner fees', async () => {
    mockGetBaseFeeResult = 13430;

    await rateProvider['updateRates']();

    expect(rateProvider.pairs.get('BTC/BTC')!.limits.minimal).toEqual(mockGetBaseFeeResult * 4);
    expect(rateProvider.pairs.get('LTC/BTC')!.limits.minimal).toEqual(mockGetBaseFeeResult * 4);
  });

  afterAll(async () => {
    rateProvider.disconnect();
  });
});
