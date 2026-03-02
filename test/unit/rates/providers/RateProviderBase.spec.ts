import { OrderSide, SwapType } from '../../../../lib/consts/Enums';
import FeeProvider from '../../../../lib/rates/FeeProvider';
import type { MinSwapSizeMultipliers } from '../../../../lib/rates/providers/RateProviderBase';
import RateProviderBase from '../../../../lib/rates/providers/RateProviderBase';

jest.mock('../../../../lib/rates/FeeProvider', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getBaseFee: jest.fn().mockReturnValue(1337),
    };
  });
});

const mockedFeeProvider = (<jest.Mock<FeeProvider>>(<any>FeeProvider))();

class TestRateProvider extends RateProviderBase<any> {
  constructor(
    currencies: Map<string, any>,
    minSwapSizeMultipliers: MinSwapSizeMultipliers,
  ) {
    super(currencies, mockedFeeProvider, minSwapSizeMultipliers);
  }

  public getRate(): number | undefined {
    throw new Error('stub');
  }

  public setHardcodedPair = () => {
    throw new Error('stub');
  };

  public updatePair = () => {
    throw new Error('stub');
  };

  public updateHardcodedPair = () => {
    throw new Error('stub');
  };

  public validatePairHash = () => {
    throw new Error('stub');
  };

  protected hashPair = () => {
    throw new Error('stub');
  };
}

describe('RateProviderBase', () => {
  const provider = new TestRateProvider(
    new Map<string, any>([
      [
        'BTC',
        {
          chainClient: {},
          lndClients: new Map([['lnd-1', {}]]),
        },
      ],
      [
        'L-BTC',
        {
          chainClient: {},
          lndClients: new Map(),
        },
      ],
    ]),
    {
      [SwapType.Chain]: 6,
      [SwapType.Submarine]: 2,
      [SwapType.ReverseSubmarine]: 2,
    },
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test.each`
    base       | quote    | rate | configured | orderSide         | type                         | expected
    ${'BTC'}   | ${'BTC'} | ${1} | ${1_000}   | ${undefined}      | ${undefined}                 | ${2_674}
    ${'BTC'}   | ${'BTC'} | ${2} | ${1_000}   | ${undefined}      | ${SwapType.Submarine}        | ${2_674 * 2}
    ${'BTC'}   | ${'BTC'} | ${1} | ${50_000}  | ${undefined}      | ${SwapType.Submarine}        | ${50_000}
    ${'L-BTC'} | ${'BTC'} | ${1} | ${1_000}   | ${OrderSide.BUY}  | ${undefined}                 | ${1_000}
    ${'L-BTC'} | ${'BTC'} | ${1} | ${1_000}   | ${OrderSide.SELL} | ${SwapType.Submarine}        | ${1_000}
    ${'L-BTC'} | ${'BTC'} | ${1} | ${1_000}   | ${OrderSide.BUY}  | ${SwapType.ReverseSubmarine} | ${1_000}
    ${'L-BTC'} | ${'BTC'} | ${1} | ${1_000}   | ${OrderSide.SELL} | ${SwapType.ReverseSubmarine} | ${1_000}
    ${'L-BTC'} | ${'BTC'} | ${1} | ${1_000}   | ${OrderSide.BUY}  | ${SwapType.Chain}            | ${2_674 * 3}
    ${'L-BTC'} | ${'BTC'} | ${1} | ${1_000}   | ${OrderSide.SELL} | ${SwapType.Chain}            | ${2_674 * 3}
  `(
    'should calculate adjusted minima',
    ({ base, quote, rate, configured, orderSide, type, expected }) => {
      expect(
        provider['adjustMinimaForFees'](
          base,
          quote,
          rate,
          configured,
          orderSide,
          type,
        ),
      ).toEqual(expected);
    },
  );
});
