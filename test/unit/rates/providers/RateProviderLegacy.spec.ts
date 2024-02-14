import { getPairId, hashString } from '../../../../lib/Utils';
import { SwapVersion } from '../../../../lib/consts/Enums';
import FeeProvider from '../../../../lib/rates/FeeProvider';
import RateProviderLegacy from '../../../../lib/rates/providers/RateProviderLegacy';
import Errors from '../../../../lib/service/Errors';

jest.mock('../../../../lib/rates/FeeProvider', () => {
  return jest.fn().mockImplementation(() => {
    return {
      minerFees: new Map<string, any>([
        [
          'BTC',
          {
            [SwapVersion.Legacy]: {
              normal: 170,
              reverse: {
                lockup: 153,
                claim: 138,
              },
            },
          },
        ],
        [
          'L-BTC',
          {
            [SwapVersion.Legacy]: {
              normal: 1333,
              reverse: {
                lockup: 2503,
                claim: 1378,
              },
            },
          },
        ],
      ]),
      getPercentageFees: jest.fn().mockReturnValue({
        percentage: 0.5,
        percentageSwapIn: 0.1,
      }),
      getBaseFee: jest.fn().mockImplementation((currency: string) => {
        switch (currency) {
          case 'BTC':
            return 12123;

          default:
            return 252;
        }
      }),
    };
  });
});

const mockedFeeProvider = (<jest.Mock<FeeProvider>>(<any>FeeProvider))();

describe('RateProviderLegacy', () => {
  const pairConfigs = [
    {
      base: 'L-BTC',
      quote: 'BTC',
      rate: 1,
      minSwapAmount: 1_000,
      maxSwapAmount: 1_000_000,
    },
  ];

  const provider = new RateProviderLegacy(
    new Map<string, any>([
      ['BTC', { chainClient: {}, lndClient: {} }],
      [
        'L-BTC',
        {
          chainClient: {},
          lndClient: {},
        },
      ],
    ]),
    mockedFeeProvider,
    new Map<string, any>(pairConfigs.map((pair) => [getPairId(pair), pair])),
    new Map<string, number>([
      ['BTC', 0],
      ['L-BTC', 100_000],
    ]),
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should update pairs', () => {
    provider.setHardcodedPair(pairConfigs[0]);

    expect(provider.pairs.size).toEqual(1);
    expect(provider.pairs.get('L-BTC/BTC')).toEqual({
      rate: pairConfigs[0].rate,
      hash: provider['hashPair'](provider.pairs.get('L-BTC/BTC')!),
      limits: provider['getLimits']('L-BTC/BTC', pairConfigs[0].rate),
      fees: {
        ...mockedFeeProvider.getPercentageFees('L-BTC/BTC'),
        minerFees: {
          baseAsset: {
            normal: 0,
            reverse: {
              claim: 0,
              lockup: 0,
            },
          },
          quoteAsset: {
            normal: 0,
            reverse: {
              claim: 0,
              lockup: 0,
            },
          },
        },
      },
    });
  });

  test('should set hardcoded pair', () => {
    provider.updatePair('L-BTC/BTC', 1);

    expect(provider.pairs.size).toEqual(1);
    expect(provider.pairs.get('L-BTC/BTC')).toEqual({
      rate: pairConfigs[0].rate,
      hash: provider['hashPair'](provider.pairs.get('L-BTC/BTC')!),
      limits: provider['getLimits']('L-BTC/BTC', pairConfigs[0].rate),
      fees: {
        ...mockedFeeProvider.getPercentageFees('L-BTC/BTC'),
        minerFees: {
          baseAsset: {
            normal: 1333,
            reverse: {
              claim: 1378,
              lockup: 2503,
            },
          },
          quoteAsset: {
            normal: 170,
            reverse: {
              claim: 138,
              lockup: 153,
            },
          },
        },
      },
    });
  });

  test('should update hardcoded pairs', () => {
    provider.pairs.get('L-BTC/BTC')!.rate = 2;

    provider.updateHardcodedPair('L-BTC/BTC');
    expect(provider.pairs.get('L-BTC/BTC')).toEqual({
      rate: 2,
      hash: provider['hashPair'](provider.pairs.get('L-BTC/BTC')!),
      limits: provider['getLimits']('L-BTC/BTC', pairConfigs[0].rate),
      fees: {
        ...mockedFeeProvider.getPercentageFees('L-BTC/BTC'),
        minerFees: {
          baseAsset: {
            normal: 1333,
            reverse: {
              claim: 1378,
              lockup: 2503,
            },
          },
          quoteAsset: {
            normal: 170,
            reverse: {
              claim: 138,
              lockup: 153,
            },
          },
        },
      },
    });
  });

  test('should validate pair hash', () => {
    const pair = 'pair';
    const hash = 'hashToVerify';

    provider.pairs.set(pair, {
      hash,
    } as any);
    provider['validatePairHash'](hash, pair);
  });

  test('should throw when validating incorrect pair hash', () => {
    expect(() => provider['validatePairHash']('smthg', 'L-BTC/BTC')).toThrow(
      Errors.INVALID_PAIR_HASH().message,
    );
    expect(() => provider['validatePairHash']('smthg', 'NOT/FOUND')).toThrow(
      Errors.INVALID_PAIR_HASH().message,
    );
  });

  test('should hash pairs', () => {
    const pair = {
      hash: 'abcd',
      rate: 21,
      fees: {
        percentage: 1,
        minerFees: 321,
      },
      limits: {
        minimal: 98,
        maximal: 890,
      },
    } as any;

    expect(provider['hashPair'](pair)).toEqual(
      hashString(
        JSON.stringify({
          rate: pair.rate,
          fees: pair.fees,
          limits: pair.limits,
        }),
      ),
    );
    expect(provider['hashPair'](pair)).toMatchSnapshot();

    expect(provider['hashPair']({ ...pair, other: 'data' })).toEqual(
      provider['hashPair'](pair),
    );
  });

  test('should get limits', () => {
    expect(provider['getLimits']('L-BTC/BTC', 1)).toEqual({
      minimal: 12123 * 2,
      maximal: 1_000_000,
      maximalZeroConf: {
        baseAsset: 100_000,
        quoteAsset: 0,
      },
    });
  });

  test('should throw when getting limits for pair that does not exist', () => {
    const pair = 'NON/EXISTENT';
    expect(() => provider['getLimits'](pair, 1)).toThrow(
      `Could not get limits for pair: ${pair}`,
    );
  });
});
