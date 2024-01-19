import { OrderSide } from '../../../../lib/consts/Enums';
import FeeProvider from '../../../../lib/rates/FeeProvider';
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
  constructor(currencies: Map<string, any>) {
    super(currencies, mockedFeeProvider);
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
          lndClient: {},
        },
      ],
      [
        'L-BTC',
        {
          chainClient: {},
        },
      ],
    ]),
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test.each`
    base       | quote    | rate | configured | orderSide         | isReverse | expected
    ${'BTC'}   | ${'BTC'} | ${1} | ${1_000}   | ${undefined}      | ${false}  | ${2_674}
    ${'BTC'}   | ${'BTC'} | ${2} | ${1_000}   | ${undefined}      | ${false}  | ${2_674 * 2}
    ${'BTC'}   | ${'BTC'} | ${1} | ${50_000}  | ${undefined}      | ${false}  | ${50_000}
    ${'L-BTC'} | ${'BTC'} | ${1} | ${1_000}   | ${OrderSide.BUY}  | ${false}  | ${1_000}
    ${'L-BTC'} | ${'BTC'} | ${1} | ${1_000}   | ${OrderSide.SELL} | ${false}  | ${2_674}
  `(
    'should calculate adjusted minima',
    ({ base, quote, rate, configured, orderSide, isReverse, expected }) => {
      expect(
        provider['adjustMinimaForFees'](
          base,
          quote,
          rate,
          configured,
          orderSide,
          isReverse,
        ),
      ).toEqual(expected);
    },
  );
});
