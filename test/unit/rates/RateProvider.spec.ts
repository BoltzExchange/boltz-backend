import Logger from '../../../lib/Logger';
import { getPairId, hashString } from '../../../lib/Utils';
import { Network } from '../../../lib/consts/Enums';
import { PairConfig } from '../../../lib/consts/Types';
import FeeProvider, { MinerFees } from '../../../lib/rates/FeeProvider';
import RateProvider from '../../../lib/rates/RateProvider';
import DataAggregator from '../../../lib/rates/data/DataAggregator';
import { Currency } from '../../../lib/wallet/WalletManager';

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
  ['LTC/LTC', 0.015],
]);

const percentageSwapInFees = new Map<string, number>([
  ['LTC/BTC', 0.01],
  ['BTC/BTC', -0.01],
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
      normal: FeeProvider.transactionSizes.normalClaim,
      reverse: {
        lockup: FeeProvider.transactionSizes.reverseLockup,
        claim: FeeProvider.transactionSizes.reverseClaim,
      },
    },
  ],
]);

let mockGetBaseFeeResult = 0;
const mockGetBaseFee = jest.fn().mockImplementation((symbol) => {
  if (symbol === 'L-BTC') {
    return 0;
  }

  return mockGetBaseFeeResult;
});

const mockUpdateMinerFees = jest.fn().mockImplementation(async () => {});

const mockGetPercentageFees = jest.fn().mockImplementation((pair) => {
  return {
    percentage: percentageFees.get(pair)! * 100,
    percentageSwapIn:
      (percentageSwapInFees.get(pair) || percentageFees.get(pair))! * 100,
  };
});

const btcFee = 36;
const ltcFee = 3;

const getFeeEstimation = () =>
  Promise.resolve(
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
      percentageSwapInFees,
      getBaseFee: mockGetBaseFee,
      updateMinerFees: mockUpdateMinerFees,
      getPercentageFees: mockGetPercentageFees,
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
        latestRates.set('LTC/LTC', rates.BTC);
        latestRates.set('L-BTC/LTC', rates.BTC);
        return latestRates;
      },
    };
  });
});

const mockedDataProvider = <jest.Mock<DataAggregator>>(<any>DataAggregator);

describe('RateProvider', () => {
  const btcCurrency = {
    symbol: 'BTC',
    network: Network.Regtest,
    lndClient: {},
    chainClient: {},
    limits: {
      maxZeroConfAmount: 10000000,
    },
  } as any as Currency;

  const lbtcCurrency = {
    symbol: 'L-BTC',
    network: Network.Regtest,
    chainClient: {},
    limits: {},
  } as any as Currency;

  const ltcCurrency = {
    symbol: 'LTC',
    network: Network.Regtest,
    lndClient: {},
    chainClient: {},
    limits: {
      maxZeroConfAmount: 1000000,
    },
  } as any as Currency;

  const pairs: PairConfig[] = [
    {
      base: 'BTC',
      quote: 'BTC',
      minSwapAmount: 1,
      maxSwapAmount: 100000000000,
    },
    {
      base: 'L-BTC',
      quote: 'BTC',
      rate: 1,
      minSwapAmount: 10_000,
      maxSwapAmount: 10_000_000,
    },
    {
      base: 'LTC',
      quote: 'BTC',
      minSwapAmount: 10000,
      maxSwapAmount: 1000000000,
    },
    {
      base: 'LTC',
      quote: 'LTC',
      minSwapAmount: 100000000,
      maxSwapAmount: 100000000000,
    },
  ];

  const rateProvider = new RateProvider(
    Logger.disabledLogger,
    0.1,
    new Map<string, Currency>([
      ['BTC', btcCurrency],
      ['LTC', ltcCurrency],
      ['L-BTC', lbtcCurrency],
    ]),
    {} as any,
    getFeeEstimation,
  );

  rateProvider['dataProvider'] = mockedDataProvider();

  test('should init', async () => {
    await rateProvider.init(pairs);
  });

  test('should get rates', () => {
    const { pairs } = rateProvider;

    expect(pairs.get('BTC/BTC')!.rate).toEqual(rates.BTC);
    expect(pairs.get('LTC/BTC')!.rate).toEqual(rates.LTC);
  });

  test('should get limits', () => {
    const btcLimits = pairs.find((pair) => getPairId(pair) === 'BTC/BTC')!;
    expect(rateProvider.pairs.get('BTC/BTC')!.limits).toEqual({
      maximal: btcLimits.maxSwapAmount,
      minimal: btcLimits.minSwapAmount,

      maximalZeroConf: {
        baseAsset: btcCurrency.limits.maxZeroConfAmount,
        quoteAsset: btcCurrency.limits.maxZeroConfAmount,
      },
    });

    const ltcLimits = pairs.find((pair) => getPairId(pair) === 'LTC/BTC')!;
    expect(rateProvider.pairs.get('LTC/BTC')!.limits).toEqual({
      maximal: ltcLimits.maxSwapAmount,
      minimal: ltcLimits.minSwapAmount,

      maximalZeroConf: {
        baseAsset: ltcCurrency.limits.maxZeroConfAmount,
        quoteAsset: btcCurrency.limits.maxZeroConfAmount,
      },
    });
  });

  test('should throw when getting limits for non existent pair', () => {
    const pair = 'non/existent';
    expect(() => rateProvider['getLimits'](pair, 1)).toThrow(
      `Could not get limits for pair ${pair}`,
    );
  });

  test('should get percentage fees', () => {
    const { pairs } = rateProvider;

    percentageFees.forEach((_, pairId) => {
      expect(pairs.get(pairId)!.fees.percentage).toEqual(
        percentageFees.get(pairId)! * 100,
      );
    });
  });

  test('should get percentage fees for normal swaps', () => {
    const { pairs } = rateProvider;

    percentageSwapInFees.forEach((_, pairId) => {
      expect(pairs.get(pairId)!.fees.percentageSwapIn).toEqual(
        percentageSwapInFees.get(pairId)! * 100,
      );
    });

    const ltcPair = 'LTC/LTC';
    expect(percentageSwapInFees.has(ltcPair)).toBeFalsy();
    expect(pairs.get(ltcPair)!.fees.percentageSwapIn).toEqual(
      percentageFees.get(ltcPair)! * 100,
    );
  });

  test('should get miner fees', () => {
    const { pairs } = rateProvider;

    expect(pairs.get('BTC/BTC')!.fees.minerFees).toEqual({
      baseAsset: minerFees.get('BTC'),
      quoteAsset: minerFees.get('BTC'),
    });
    expect(pairs.get('LTC/BTC')!.fees.minerFees).toEqual({
      baseAsset: minerFees.get('LTC'),
      quoteAsset: minerFees.get('BTC'),
    });
  });

  test('should calculate hashes', () => {
    const { pairs } = rateProvider;

    expect(pairs.get('BTC/BTC')!.hash).toEqual(
      hashString(
        JSON.stringify({
          rate: pairs.get('BTC/BTC')!.rate,
          fees: pairs.get('BTC/BTC')!.fees,
          limits: pairs.get('BTC/BTC')!.limits,
        }),
      ),
    );

    expect(pairs.get('LTC/BTC')!.hash).toEqual(
      hashString(
        JSON.stringify({
          rate: pairs.get('LTC/BTC')!.rate,
          fees: pairs.get('LTC/BTC')!.fees,
          limits: pairs.get('LTC/BTC')!.limits,
        }),
      ),
    );
  });

  test('should accept 0-conf for amounts lower than threshold', () => {
    // Should return false for undefined maximal allowed amounts
    expect(rateProvider.acceptZeroConf('ETH', 0)).toEqual(false);

    expect(
      rateProvider.acceptZeroConf(
        'BTC',
        btcCurrency.limits.maxZeroConfAmount! + 1,
      ),
    ).toEqual(false);

    expect(
      rateProvider.acceptZeroConf('BTC', btcCurrency.limits.maxZeroConfAmount!),
    ).toEqual(true);
    expect(
      rateProvider.acceptZeroConf(
        'BTC',
        btcCurrency.limits.maxZeroConfAmount! - 1,
      ),
    ).toEqual(true);
  });

  test('should adjust minimal limits based on current miner fees', async () => {
    mockGetBaseFeeResult = 13430;

    await rateProvider['updateRates']();

    expect(rateProvider.pairs.get('BTC/BTC')!.limits.minimal).toEqual(
      mockGetBaseFeeResult * RateProvider['minLimitFactor'],
    );
    expect(rateProvider.pairs.get('LTC/BTC')!.limits.minimal).toEqual(
      mockGetBaseFeeResult * RateProvider['minLimitFactor'],
    );
    expect(rateProvider.pairs.get('L-BTC/BTC')!.limits.minimal).toEqual(
      pairs.find((pair) => getPairId(pair) === 'L-BTC/BTC')?.minSwapAmount,
    );
  });

  afterAll(async () => {
    rateProvider.disconnect();
  });
});
