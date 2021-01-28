import RateCalculator from '../../../lib/rates/RateCalculator';
import DataAggregator from '../../../lib/rates/data/DataAggregator';
import Errors from '../../../lib/rates/Errors';

const ethBtcRate = 0.04269969;
const ltcBtcRate = 0.00432060;

const aggregator = {
  latestRates: new Map<string, number>([
    [
      'ETH/BTC',
      ethBtcRate,
    ],
    [
      'LTC/BTC',
      ltcBtcRate,
    ],
  ]),
} as any as DataAggregator;

describe('RateCalculator', () => {
  const calculator = new RateCalculator(aggregator);

  test('should get rate if pair exists', () => {
    expect(calculator.calculateRate('ETH', 'BTC')).toEqual(ethBtcRate);
  });

  test('should get rate if the inverse pair exists', () => {
    expect(calculator.calculateRate('BTC', 'ETH')).toEqual(1 / ethBtcRate);
  });

  test('should route rate calculations via the BTC pairs', () => {
    expect(calculator.calculateRate('ETH', 'LTC')).toEqual(ethBtcRate / ltcBtcRate);
  });

  test('should throw when rate cannot be calculated', () => {
    const notFoundSymbol = 'NOT';

    expect(() => calculator.calculateRate(notFoundSymbol, 'ETH')).toThrow(
      Errors.COULD_NOT_FIND_RATE(`${notFoundSymbol}/ETH`).message,
    );

    expect(() => calculator.calculateRate('ETH', notFoundSymbol)).toThrow(
      Errors.COULD_NOT_FIND_RATE(`ETH/${notFoundSymbol}`).message,
    );
  });
});
