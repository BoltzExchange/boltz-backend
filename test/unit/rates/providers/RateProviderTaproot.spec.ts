import { getPairId, hashString } from '../../../../lib/Utils';
import { OrderSide, SwapType } from '../../../../lib/consts/Enums';
import FeeProvider from '../../../../lib/rates/FeeProvider';
import RateProviderTaproot from '../../../../lib/rates/providers/RateProviderTaproot';
import Errors from '../../../../lib/service/Errors';

jest.mock('../../../../lib/rates/FeeProvider', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getPercentageFees: jest.fn().mockReturnValue({
        [SwapType.Chain]: 0.25,
        [SwapType.Submarine]: 0.1,
        [SwapType.ReverseSubmarine]: 0.5,
      }),
      getBaseFee: jest.fn().mockImplementation((currency: string) => {
        switch (currency) {
          case 'BTC':
            return 12123;

          default:
            return 252;
        }
      }),
      getSwapBaseFees: jest.fn().mockImplementation(() => ({
        claim: 1297,
        lockup: 2503,
      })),
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

    provider.validatePairHash(
      hash,
      'L-BTC/BTC',
      OrderSide.BUY,
      SwapType.Submarine,
    );
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
      provider.validatePairHash(
        'hash',
        'L-BTC/BTC',
        OrderSide.BUY,
        SwapType.Submarine,
      ),
    ).toThrow(Errors.INVALID_PAIR_HASH().message);
  });

  test('should throw when validating pair hash of pair that does not exit', () => {
    const pair = 'not/found';
    expect(() =>
      provider.validatePairHash(
        'hash',
        pair,
        OrderSide.BUY,
        SwapType.Submarine,
      ),
    ).toThrow(Errors.PAIR_NOT_FOUND(pair).message);

    provider.submarinePairs.set('found', new Map());

    expect(() =>
      provider.validatePairHash(
        'hash',
        pair,
        OrderSide.BUY,
        SwapType.Submarine,
      ),
    ).toThrow(Errors.PAIR_NOT_FOUND(pair).message);
  });

  test('should getNested pair map', () => {
    const nested = provider['getToMap'](
      'not/found',
      OrderSide.BUY,
      SwapType.Submarine,
      true,
    )!;
    nested.toMap.set('yo', { test: 'data' } as any);

    expect(nested).toEqual({
      fromAsset: 'found',
      toAsset: 'not',
      toMap: expect.any(Map),
    });

    expect(
      provider['getToMap'](
        'not/found',
        OrderSide.BUY,
        SwapType.Submarine,
        false,
      ),
    ).toEqual({
      fromAsset: 'found',
      toAsset: 'not',
      toMap: nested.toMap,
    });

    expect(
      provider['getToMap'](
        'not/found',
        OrderSide.BUY,
        SwapType.ReverseSubmarine,
      ),
    ).toEqual(undefined);

    const netstedChain = provider['getToMap'](
      'RBTC/BTC',
      OrderSide.BUY,
      SwapType.Chain,
      true,
    )!;
    netstedChain.toMap.set('yo', { test: 'data' } as any);

    expect(netstedChain).toEqual({
      fromAsset: 'BTC',
      toAsset: 'RBTC',
      toMap: expect.any(Map),
    });
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
    provider['setPair'](
      'L-BTC/BTC',
      OrderSide.BUY,
      SwapType.ReverseSubmarine,
      1,
      {
        miner: 'fees',
      } as any,
    );

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
    provider['setPair'](
      'L-BTC/BTC',
      OrderSide.BUY,
      SwapType.ReverseSubmarine,
      1,
    );

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
    provider['setPair']('L-BTC/BTC', OrderSide.BUY, SwapType.ReverseSubmarine);

    expect(provider.reversePairs.size).toEqual(1);
    expect(provider.reversePairs.get('BTC')!.size).toEqual(0);
    expect(provider.submarinePairs.size).toEqual(0);
  });

  test('should not set pair when combination is not possible', () => {
    provider['setPair']('L-BTC/BTC', OrderSide.BUY, SwapType.Submarine);
    expect(provider.reversePairs.size).toEqual(0);
    expect(provider.submarinePairs.size).toEqual(1);
    expect(provider.submarinePairs.get('BTC')!.size).toEqual(0);
  });

  test('should get limits with maximal 0-conf amount for reverse swaps', () => {
    expect(
      provider['getLimits'](
        'L-BTC/BTC',
        OrderSide.BUY,
        SwapType.ReverseSubmarine,
        1,
      ),
    ).toEqual({
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
      expect(
        provider['getLimits']('L-BTC/BTC', side, SwapType.Submarine, 1),
      ).toEqual({
        maximalZeroConf,
        minimal: 1_000,
        maximal: 1_000_000,
      });
    },
  );

  test('should throw when getting limits for pair that does not exist', () => {
    const pair = 'not/found';
    expect(() =>
      provider['getLimits'](pair, OrderSide.BUY, SwapType.Submarine, 1),
    ).toThrow(`Could not get limits for pair: ${pair}`);
  });

  test.each`
    type                         | from       | to         | expected
    ${SwapType.ReverseSubmarine} | ${'BTC'}   | ${'BTC'}   | ${true}
    ${SwapType.Submarine}        | ${'BTC'}   | ${'BTC'}   | ${true}
    ${SwapType.ReverseSubmarine} | ${'BTC'}   | ${'L-BTC'} | ${true}
    ${SwapType.Submarine}        | ${'BTC'}   | ${'L-BTC'} | ${false}
    ${SwapType.ReverseSubmarine} | ${'L-BTC'} | ${'BTC'}   | ${false}
    ${SwapType.Submarine}        | ${'L-BTC'} | ${'BTC'}   | ${true}
    ${SwapType.Chain}            | ${'L-BTC'} | ${'BTC'}   | ${true}
    ${SwapType.Chain}            | ${'BTC'}   | ${'BTC'}   | ${false}
  `(
    'should check if is possible combination',
    ({ type, from, to, expected }) => {
      expect(provider['isPossibleCombination'](type, from, to)).toEqual(
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
