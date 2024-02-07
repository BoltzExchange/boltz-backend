import { getPairId, hashString } from '../../../../lib/Utils';
import { OrderSide, SwapVersion } from '../../../../lib/consts/Enums';
import FeeProvider from '../../../../lib/rates/FeeProvider';
import RateProviderTaproot from '../../../../lib/rates/providers/RateProviderTaproot';
import Errors from '../../../../lib/service/Errors';

jest.mock('../../../../lib/rates/FeeProvider', () => {
  return jest.fn().mockImplementation(() => {
    return {
      minerFees: new Map<string, any>([
        [
          'BTC',
          {
            [SwapVersion.Taproot]: {
              normal: 151,
              reverse: {
                lockup: 154,
                claim: 111,
              },
            },
          },
        ],
        [
          'L-BTC',
          {
            [SwapVersion.Taproot]: {
              normal: 1337,
              reverse: {
                lockup: 2503,
                claim: 1297,
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

describe('RateProviderTaproot', () => {
  const pairConfigs = [
    {
      base: 'L-BTC',
      quote: 'BTC',
      rate: 1,
      minSwapAmount: 1_000,
      maxSwapAmount: 1_000_000,
    },
  ];

  const provider = new RateProviderTaproot(
    new Map<string, any>([
      ['BTC', { chainClient: {}, lndClient: {} }],
      [
        'L-BTC',
        {
          chainClient: {},
        },
      ],
      ['R-BTC', { provider: {} }],
      ['CASHU', {}],
    ]),
    mockedFeeProvider,
    new Map<string, any>(pairConfigs.map((pair) => [getPairId(pair), pair])),
    new Map<string, number>([
      ['BTC', 0],
      ['L-BTC', 100_000],
    ]),
  );

  beforeEach(() => {
    provider.reversePairs.clear();
    provider.submarinePairs.clear();

    jest.clearAllMocks();
  });

  test('should serialize pairs', () => {
    provider.submarinePairs.set(
      'BTC',
      new Map<string, any>([
        [
          'L-BTC',
          {
            hash: 'data',
          },
        ],
      ]),
    );
    provider.submarinePairs.set('deleted', new Map());

    const obj = RateProviderTaproot.serializePairs(provider.submarinePairs);
    expect(obj).toEqual({
      BTC: {
        'L-BTC': {
          hash: 'data',
        },
      },
    });
  });

  test('should set hardcoded pair', () => {
    const rate = 21;

    provider.setHardcodedPair({
      rate,
      base: 'L-BTC',
      quote: 'BTC',
    } as any);

    expect(provider.submarinePairs.get('L-BTC')!.get('BTC')!.rate).toEqual(
      1 / rate,
    );
    expect(provider.reversePairs.get('BTC')!.get('L-BTC')!.rate).toEqual(rate);
  });

  test('should update pair', () => {
    const rate = 21;

    provider.updatePair('L-BTC/BTC', rate);

    expect(provider.submarinePairs.get('L-BTC')!.get('BTC')!.rate).toEqual(
      1 / rate,
    );
    expect(provider.reversePairs.get('BTC')!.get('L-BTC')!.rate).toEqual(rate);
  });

  test('should update hardcoded pairs', () => {
    provider.setHardcodedPair({
      rate: 1,
      base: 'L-BTC',
      quote: 'BTC',
    } as any);

    const wrongHash = 'wrongHash';

    provider.submarinePairs.get('L-BTC')!.get('BTC')!.hash = wrongHash;
    provider.reversePairs.get('BTC')!.get('L-BTC')!.hash = wrongHash;

    provider.updateHardcodedPair('L-BTC/BTC');

    expect(provider.submarinePairs.get('L-BTC')!.get('BTC')!.hash).not.toEqual(
      wrongHash,
    );
    expect(provider.reversePairs.get('BTC')!.get('L-BTC')!.hash).not.toEqual(
      wrongHash,
    );
  });

  test('should validate pair hash', () => {
    const hash = 'hash';

    provider.submarinePairs.set(
      'BTC',
      new Map<string, any>([
        [
          'L-BTC',
          {
            hash,
          },
        ],
      ]),
    );

    provider.validatePairHash(hash, 'L-BTC/BTC', OrderSide.BUY, false);
  });

  test('should throw when validating pair hash when hash is invalid', () => {
    provider.submarinePairs.set(
      'BTC',
      new Map<string, any>([
        [
          'L-BTC',
          {
            hash: 'noMatch',
          },
        ],
      ]),
    );

    expect(() =>
      provider.validatePairHash('hash', 'L-BTC/BTC', OrderSide.BUY, false),
    ).toThrow(Errors.INVALID_PAIR_HASH().message);
  });

  test('should throw when validating pair hash of pair that does not exit', () => {
    const pair = 'not/found';
    expect(() =>
      provider.validatePairHash('hash', pair, OrderSide.BUY, false),
    ).toThrow(Errors.PAIR_NOT_FOUND(pair).message);

    provider.submarinePairs.set('found', new Map());

    expect(() =>
      provider.validatePairHash('hash', pair, OrderSide.BUY, false),
    ).toThrow(Errors.PAIR_NOT_FOUND(pair).message);
  });

  test('should getNested pair map', () => {
    const nested = provider['getToMap'](
      'not/found',
      OrderSide.BUY,
      false,
      true,
    )!;
    nested.toMap.set('yo', { test: 'data' } as any);

    expect(nested).toEqual({
      fromAsset: 'found',
      toAsset: 'not',
      toMap: expect.any(Map),
    });

    expect(
      provider['getToMap']('not/found', OrderSide.BUY, false, false),
    ).toEqual({
      fromAsset: 'found',
      toAsset: 'not',
      toMap: nested.toMap,
    });

    expect(provider['getToMap']('not/found', OrderSide.BUY, true)).toEqual(
      undefined,
    );
  });

  test('should hash pairs', () => {
    const pair = {
      hash: 'taproot',
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

  test('should set pair with rate', () => {
    provider['setPair']('L-BTC/BTC', OrderSide.BUY, true, 1, {
      miner: 'fees',
    } as any);

    expect(provider.reversePairs.size).toEqual(1);
    expect(provider.reversePairs.get('BTC')!.size).toEqual(1);
    expect(provider.reversePairs.get('BTC')!.get('L-BTC')).toEqual({
      hash: expect.anything(),
      rate: 1,
      limits: {
        maximal: 1_000_000,
        minimal: 1_000,
      },
      fees: {
        percentage: 0.5,
        minerFees: {
          miner: 'fees',
        },
      },
    });

    expect(provider.submarinePairs.size).toEqual(0);
  });

  test('should set pair and get miner fees when not provided', () => {
    provider['setPair']('L-BTC/BTC', OrderSide.BUY, true, 1);

    expect(provider.reversePairs.size).toEqual(1);
    expect(provider.reversePairs.get('BTC')!.size).toEqual(1);
    expect(provider.reversePairs.get('BTC')!.get('L-BTC')).toEqual({
      hash: expect.anything(),
      rate: 1,
      limits: {
        maximal: 1_000_000,
        minimal: 1_000,
      },
      fees: {
        percentage: 0.5,
        minerFees: {
          claim: 1297,
          lockup: 2503,
        },
      },
    });

    expect(provider.submarinePairs.size).toEqual(0);
  });

  test('should not set pair no rate is provided and none was set prior', () => {
    provider['setPair']('L-BTC/BTC', OrderSide.BUY, true);

    expect(provider.reversePairs.size).toEqual(1);
    expect(provider.reversePairs.get('BTC')!.size).toEqual(0);
    expect(provider.submarinePairs.size).toEqual(0);
  });

  test('should not set pair when combination is not possible', () => {
    provider['setPair']('L-BTC/BTC', OrderSide.BUY, false);
    expect(provider.reversePairs.size).toEqual(0);
    expect(provider.submarinePairs.size).toEqual(1);
    expect(provider.submarinePairs.get('BTC')!.size).toEqual(0);
  });

  test('should get limits with maximal 0-conf amount for reverse swaps', () => {
    expect(provider['getLimits']('L-BTC/BTC', OrderSide.BUY, true, 1)).toEqual({
      minimal: 1_000,
      maximal: 1_000_000,
    });
  });

  test.each`
    side              | maximalZeroConf
    ${OrderSide.BUY}  | ${0}
    ${OrderSide.SELL} | ${100_000}
  `(
    'should get limits with maximal 0-conf amount for submarine swaps',
    ({ side, maximalZeroConf }) => {
      expect(provider['getLimits']('L-BTC/BTC', side, false, 1)).toEqual({
        maximalZeroConf,
        minimal: 1_000,
        maximal: 1_000_000,
      });
    },
  );

  test('should throw when getting limits for pair that does not exist', () => {
    const pair = 'not/found';
    expect(() => provider['getLimits'](pair, OrderSide.BUY, false, 1)).toThrow(
      `Could not get limits for pair: ${pair}`,
    );
  });

  test.each`
    isReverse | from       | to         | expected
    ${true}   | ${'BTC'}   | ${'BTC'}   | ${true}
    ${false}  | ${'BTC'}   | ${'BTC'}   | ${true}
    ${true}   | ${'BTC'}   | ${'L-BTC'} | ${true}
    ${false}  | ${'BTC'}   | ${'L-BTC'} | ${false}
    ${true}   | ${'L-BTC'} | ${'BTC'}   | ${false}
    ${false}  | ${'L-BTC'} | ${'BTC'}   | ${true}
  `(
    'should check if is possible combination',
    ({ isReverse, from, to, expected }) => {
      expect(provider['isPossibleCombination'](isReverse, from, to)).toEqual(
        expected,
      );
    },
  );

  test.each`
    currency      | expected
    ${'BTC'}      | ${true}
    ${'L-BTC'}    | ${false}
    ${'notFound'} | ${false}
  `(
    'should check if $currency can be used on lightning',
    ({ currency, expected }) => {
      expect(provider['canLightning'](currency)).toEqual(expected);
    },
  );

  test.each`
    currency   | expected
    ${'BTC'}   | ${true}
    ${'L-BTC'} | ${true}
    ${'R-BTC'} | ${true}
    ${'CASHU'} | ${false}
  `(
    'should check if $currency can be used onchain',
    ({ currency, expected }) => {
      expect(provider['canOnchain'](currency)).toEqual(expected);
    },
  );
});
