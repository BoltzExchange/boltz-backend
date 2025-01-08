import { getPairId, hashString } from '../../../../lib/Utils';
import { OrderSide, SwapType } from '../../../../lib/consts/Enums';
import Referral from '../../../../lib/db/models/Referral';
import FeeProvider from '../../../../lib/rates/FeeProvider';
import RateProviderTaproot from '../../../../lib/rates/providers/RateProviderTaproot';
import Errors from '../../../../lib/service/Errors';

jest.mock('../../../../lib/rates/FeeProvider', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getPercentageFee: jest
        .fn()
        .mockImplementation(
          (_pair: string, _orderSide: OrderSide, type: SwapType) => {
            switch (type) {
              case SwapType.Submarine:
                return 0.1;
              case SwapType.ReverseSubmarine:
                return 0.5;
              case SwapType.Chain:
                return 0.25;
            }
          },
        ),
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

FeeProvider.addPremium = jest
  .fn()
  .mockImplementation((fee, premium) =>
    parseFloat((fee + premium / 100).toFixed(2)),
  );

describe('RateProviderTaproot', () => {
  const pairConfigs = [
    {
      base: 'L-BTC',
      quote: 'BTC',
      rate: 1,
      minSwapAmount: 1_000,
      maxSwapAmount: 1_000_000,

      chainSwap: {
        minSwapAmount: 100_000,
        maxSwapAmount: 1_000_000,
      },
    },
  ];

  const provider = new RateProviderTaproot(
    new Map<string, any>([
      [
        'BTC',
        {
          chainClient: {},
          lndClient: {
            maxPaymentFeeRatio: 0.021,
          },
        },
      ],
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
    {
      [SwapType.Chain]: 6,
      [SwapType.Submarine]: 2,
      [SwapType.ReverseSubmarine]: 2,
    },
    new Map<string, any>(pairConfigs.map((pair) => [getPairId(pair), pair])),
    new Map<string, number>([
      ['BTC', 0],
      ['L-BTC', 100_000],
    ]),
  );

  beforeEach(() => {
    provider['submarinePairs'].clear();
    provider['reversePairs'].clear();
    provider['chainPairs'].clear();

    jest.clearAllMocks();
  });

  describe('deepCloneWithReferral', () => {
    beforeEach(() => {
      provider.setHardcodedPair(
        {
          base: 'L-BTC',
          quote: 'BTC',
          rate: 1,
        } as any,
        [SwapType.Submarine, SwapType.ReverseSubmarine, SwapType.Chain],
      );
    });

    test.each`
      type                         | initialFee | premium | expectedFee | getPairs                      | pairPath
      ${SwapType.Submarine}        | ${0.1}     | ${10}   | ${0.2}      | ${provider.getSubmarinePairs} | ${'L-BTC->BTC'}
      ${SwapType.ReverseSubmarine} | ${0.5}     | ${15}   | ${0.65}     | ${provider.getReversePairs}   | ${'BTC->L-BTC'}
      ${SwapType.Chain}            | ${0.25}    | ${-10}  | ${0.15}     | ${provider.getChainPairs}     | ${'BTC->L-BTC'}
    `(
      'should calculate $type pairs with fee premium',
      ({ type, initialFee, premium, expectedFee, getPairs, pairPath }) => {
        const [from, to] = pairPath.split('->');

        expect(
          getPairs.call(provider).get(from)!.get(to)!.fees.percentage,
        ).toEqual(initialFee);

        const referral = {
          premiumForPairs: jest.fn().mockReturnValue(premium),
          limitsForPairs: jest.fn().mockReturnValue(undefined),
          maxRoutingFeeRatioForPairs: jest.fn().mockReturnValue(undefined),
        } as any as Referral;

        expect(
          getPairs.call(provider, referral).get(from)!.get(to)!.fees.percentage,
        ).toEqual(expectedFee);

        expect(referral.premiumForPairs).toHaveBeenCalledWith(
          expect.arrayContaining(['L-BTC/BTC', 'BTC/L-BTC']),
          type,
        );

        expect(
          getPairs.call(provider).get(from)!.get(to)!.fees.percentage,
        ).toEqual(initialFee);
      },
    );

    test.each`
      type                         | initialMin | initialMax   | limitMin   | limitMax | expectedMin | expectedMax | getPairs                      | pairPath
      ${SwapType.Submarine}        | ${1_000}   | ${1_000_000} | ${200_000} | ${800}   | ${200_000}  | ${800}      | ${provider.getSubmarinePairs} | ${'L-BTC->BTC'}
      ${SwapType.ReverseSubmarine} | ${1_000}   | ${1_000_000} | ${750_000} | ${1_500} | ${750_000}  | ${1_500}    | ${provider.getReversePairs}   | ${'BTC->L-BTC'}
      ${SwapType.Chain}            | ${100_000} | ${1_000_000} | ${300_000} | ${4_000} | ${300_000}  | ${4_000}    | ${provider.getChainPairs}     | ${'BTC->L-BTC'}
    `(
      'should calculate $type pairs with limit overrides',
      ({
        type,
        initialMin,
        initialMax,
        limitMin,
        limitMax,
        expectedMin,
        expectedMax,
        getPairs,
        pairPath,
      }) => {
        const [from, to] = pairPath.split('->');

        const pair = getPairs.call(provider).get(from)!.get(to)!;
        expect(pair.limits.minimal).toEqual(initialMin);
        expect(pair.limits.maximal).toEqual(initialMax);

        const referral = {
          premiumForPairs: jest.fn().mockReturnValue(undefined),
          maxRoutingFeeRatioForPairs: jest.fn().mockReturnValue(undefined),
          limitsForPairs: jest.fn().mockReturnValue({
            minimal: limitMin,
            maximal: limitMax,
          }),
        } as any as Referral;

        const pairWithReferral = getPairs
          .call(provider, referral)
          .get(from)!
          .get(to)!;
        expect(pairWithReferral.limits.minimal).toEqual(expectedMin);
        expect(pairWithReferral.limits.maximal).toEqual(expectedMax);

        expect(referral.limitsForPairs).toHaveBeenCalledWith(
          expect.arrayContaining(['L-BTC/BTC', 'BTC/L-BTC']),
          type,
        );

        const originalPair = getPairs.call(provider).get(from)!.get(to)!;
        expect(originalPair.limits.minimal).toEqual(initialMin);
        expect(originalPair.limits.maximal).toEqual(initialMax);
      },
    );

    test('should use maxRoutingFeeRatioForPairs when provided', () => {
      const referral = {
        limitsForPairs: jest.fn().mockReturnValue(undefined),
        premiumForPairs: jest.fn().mockReturnValue(undefined),
        maxRoutingFeeRatioForPairs: jest.fn().mockReturnValue(0.01),
      } as any as Referral;

      const pairWithReferral = provider
        .getSubmarinePairs(referral)
        .get('L-BTC')!
        .get('BTC')!;
      expect(pairWithReferral.fees.maximalRoutingFee).toEqual(1);
    });

    test('should coalesce max routing fee from lightning clients when not provided in referral', () => {
      const pairWithReferral = provider
        .getSubmarinePairs({
          limitsForPairs: jest.fn().mockReturnValue(undefined),
          premiumForPairs: jest.fn().mockReturnValue(undefined),
          maxRoutingFeeRatioForPairs: jest.fn().mockReturnValue(undefined),
        } as any as Referral)
        .get('L-BTC')!
        .get('BTC')!;
      expect(pairWithReferral.fees.maximalRoutingFee).toEqual(2.1);
    });
  });

  test('should serialize pairs', () => {
    provider['submarinePairs'].set(
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
    provider['submarinePairs'].set('deleted', new Map());

    const obj = RateProviderTaproot.serializePairs(
      provider.getSubmarinePairs(),
    );
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

    provider.setHardcodedPair(
      {
        rate,
        base: 'L-BTC',
        quote: 'BTC',
      } as any,
      [SwapType.Submarine, SwapType.ReverseSubmarine],
    );

    expect(provider.getSubmarinePairs().get('L-BTC')!.get('BTC')!.rate).toEqual(
      1 / rate,
    );
    expect(provider.getReversePairs().get('BTC')!.get('L-BTC')!.rate).toEqual(
      rate,
    );
    expect(provider.getChainPairs().get('BTC')).toBeUndefined();
  });

  test('should update pair', () => {
    const rate = 21;

    provider.updatePair('L-BTC/BTC', rate, [
      SwapType.Submarine,
      SwapType.ReverseSubmarine,
    ]);

    expect(provider.getSubmarinePairs().get('L-BTC')!.get('BTC')!.rate).toEqual(
      1 / rate,
    );
    expect(provider.getReversePairs().get('BTC')!.get('L-BTC')!.rate).toEqual(
      rate,
    );
  });

  test('should update hardcoded pairs', () => {
    provider.setHardcodedPair(
      {
        rate: 1,
        base: 'L-BTC',
        quote: 'BTC',
      } as any,
      [SwapType.Submarine, SwapType.ReverseSubmarine],
    );

    const wrongHash = 'wrongHash';

    provider.getSubmarinePairs().get('L-BTC')!.get('BTC')!.hash = wrongHash;
    provider.getReversePairs().get('BTC')!.get('L-BTC')!.hash = wrongHash;

    provider.updateHardcodedPair('L-BTC/BTC', [
      SwapType.Submarine,
      SwapType.ReverseSubmarine,
    ]);

    expect(
      provider.getSubmarinePairs().get('L-BTC')!.get('BTC')!.hash,
    ).not.toEqual(wrongHash);
    expect(
      provider.getReversePairs().get('BTC')!.get('L-BTC')!.hash,
    ).not.toEqual(wrongHash);
  });

  test('should validate pair hash', () => {
    const hash = 'hash';

    provider['submarinePairs'].set(
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
    provider['submarinePairs'].set(
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

    provider['submarinePairs'].set('found', new Map());

    expect(() =>
      provider.validatePairHash(
        'hash',
        pair,
        OrderSide.BUY,
        SwapType.Submarine,
      ),
    ).toThrow(Errors.PAIR_NOT_FOUND(pair).message);
  });

  describe('getRate', () => {
    test('should return rate', () => {
      provider.setHardcodedPair(
        {
          rate: 1,
          base: 'L-BTC',
          quote: 'BTC',
        } as any,
        [SwapType.Submarine, SwapType.ReverseSubmarine],
      );

      expect(provider.getRate('L-BTC/BTC', SwapType.Submarine)).toEqual(1);
    });

    test('should return undefined when pair is not set', () => {
      expect(provider.getRate('not/defined', SwapType.Submarine)).toEqual(
        undefined,
      );
    });
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
      [SwapType.Submarine, SwapType.ReverseSubmarine],
      'L-BTC/BTC',
      OrderSide.BUY,
      SwapType.ReverseSubmarine,
      1,
      {
        miner: 'fees',
      } as any,
    );

    expect(provider.getReversePairs().size).toEqual(1);
    expect(provider.getReversePairs().get('BTC')!.size).toEqual(1);
    expect(provider.getReversePairs().get('BTC')!.get('L-BTC')).toEqual({
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

    expect(provider.getSubmarinePairs().size).toEqual(0);
  });

  test('should set pair and get miner fees when not provided', () => {
    provider['setPair'](
      [SwapType.Submarine, SwapType.ReverseSubmarine],
      'L-BTC/BTC',
      OrderSide.BUY,
      SwapType.ReverseSubmarine,
      1,
    );

    expect(provider.getReversePairs().size).toEqual(1);
    expect(provider.getReversePairs().get('BTC')!.size).toEqual(1);
    expect(provider.getReversePairs().get('BTC')!.get('L-BTC')).toEqual({
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

    expect(provider.getSubmarinePairs().size).toEqual(0);
  });

  test('should not set pair no rate is provided and none was set prior', () => {
    provider['setPair'](
      [SwapType.Submarine, SwapType.ReverseSubmarine],
      'L-BTC/BTC',
      OrderSide.BUY,
      SwapType.ReverseSubmarine,
    );

    expect(provider.getReversePairs().size).toEqual(1);
    expect(provider.getReversePairs().get('BTC')!.size).toEqual(0);
    expect(provider.getSubmarinePairs().size).toEqual(0);
  });

  test('should not set pair when combination is not possible', () => {
    provider['setPair'](
      [SwapType.Submarine, SwapType.ReverseSubmarine],
      'L-BTC/BTC',
      OrderSide.BUY,
      SwapType.Submarine,
    );
    expect(provider.getReversePairs().size).toEqual(0);
    expect(provider.getSubmarinePairs().size).toEqual(1);
    expect(provider.getSubmarinePairs().get('BTC')!.size).toEqual(0);
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

  test('should get chain swap limits', () => {
    expect(
      provider['getLimits']('L-BTC/BTC', OrderSide.BUY, SwapType.Chain, 1),
    ).toEqual({
      minimal: 100_000,
      maximal: 1_000_000,
      maximalZeroConf: 0,
    });
  });

  test('should throw when getting limits for pair that does not exist', () => {
    const pair = 'not/found';
    expect(() =>
      provider['getLimits'](pair, OrderSide.BUY, SwapType.Submarine, 1),
    ).toThrow(`Could not get limits for pair: ${pair}`);
  });

  describe('getPairLimit', () => {
    test.each`
      type
      ${SwapType.Submarine}
      ${SwapType.ReverseSubmarine}
    `('should use standard config for type $type', ({ type }) => {
      const value = 100_000;

      expect(
        provider['getPairLimit'](
          'maxSwapAmount',
          {
            maxSwapAmount: value,
            chainSwap: {
              maxSwapAmount: value,
            },
          } as any,
          type,
        ),
      ).toEqual(value);
    });

    test('should coalesce from standard config when chain swap config is undefined', () => {
      const value = 100_000;

      expect(
        provider['getPairLimit'](
          'maxSwapAmount',
          {
            maxSwapAmount: value,
          } as any,
          SwapType.Chain,
        ),
      ).toEqual(value);
    });

    test('should coalesce from standard config when value in chain swap config is undefined', () => {
      const value = 100_000;

      expect(
        provider['getPairLimit'](
          'maxSwapAmount',
          {
            maxSwapAmount: value,
            chainSwap: {},
          } as any,
          SwapType.Chain,
        ),
      ).toEqual(value);
    });

    test('should use value from chain swap config when defined and type is chain swap', () => {
      const value = 100_000;

      expect(
        provider['getPairLimit'](
          'maxSwapAmount',
          {
            maxSwapAmount: 123,
            chainSwap: {
              maxSwapAmount: value,
            },
          } as any,
          SwapType.Chain,
        ),
      ).toEqual(value);
    });
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

  test.each`
    compFunc    | original | override     | expected
    ${Math.max} | ${100}   | ${200}       | ${200}
    ${Math.max} | ${200}   | ${100}       | ${200}
    ${Math.min} | ${100}   | ${200}       | ${100}
    ${Math.min} | ${200}   | ${100}       | ${100}
    ${Math.max} | ${100}   | ${undefined} | ${100}
    ${Math.min} | ${100}   | ${undefined} | ${100}
  `(
    'should apply override correctly',
    ({ compFunc, original, override, expected }) => {
      expect(provider['applyOverride'](compFunc, original, override)).toEqual(
        expected,
      );
    },
  );
});
