import Logger from '../../../lib/Logger';
import FeeProvider from '../../../lib/rates/FeeProvider';
import { BaseFeeType, OrderSide } from '../../../lib/consts/Enums';
import DataAggregator from '../../../lib/rates/data/DataAggregator';

const btcFee = 36;
const ltcFee = 3;
const ethFee = 11;

const getFeeEstimation = () => Promise.resolve(
  new Map([
    ['BTC', btcFee],
    ['LTC', ltcFee],
    ['ETH', ethFee],
  ]),
);

jest.mock('../../../lib/rates/data/DataAggregator', () => {
  return jest.fn().mockImplementation(() => ({
    latestRates: new Map<string, number>([
      ['ETH/USDT', 0.5],
    ]),
  }));
});

const MockedDataAggregator = <jest.Mock<DataAggregator>>DataAggregator;

describe('FeeProvider', () => {
  const feeProvider = new FeeProvider(Logger.disabledLogger, MockedDataAggregator(), getFeeEstimation);

  test('should init', () => {
    feeProvider.init([
      {
        base: 'LTC',
        quote: 'BTC',
        fee: 2,
      },
      {
        base: 'BTC',
        quote: 'BTC',
        fee: 0,
      },
      {
        base: 'LTC',
        quote: 'LTC',

        // The FeeProvider should set this to 1
        fee: undefined,
      },
    ]);

    const feeMap = feeProvider['percentageFees'];
    expect(feeMap.size).toEqual(3);

    expect(feeMap.get('LTC/BTC')).toEqual(0.02);
    expect(feeMap.get('BTC/BTC')).toEqual(0);
    expect(feeMap.get('LTC/LTC')).toEqual(0.01);
  });

  test('should estimate onchain fees', async () => {
    const results = await Promise.all([
      feeProvider.getBaseFee('BTC', BaseFeeType.NormalClaim),
      feeProvider.getBaseFee('BTC', BaseFeeType.ReverseLockup),
      feeProvider.getBaseFee('BTC', BaseFeeType.ReverseClaim),

      feeProvider.getBaseFee('LTC', BaseFeeType.NormalClaim),
      feeProvider.getBaseFee('LTC', BaseFeeType.ReverseLockup),
      feeProvider.getBaseFee('LTC', BaseFeeType.ReverseClaim),

      feeProvider.getBaseFee('ETH', BaseFeeType.NormalClaim),
      feeProvider.getBaseFee('ETH', BaseFeeType.ReverseLockup),
      feeProvider.getBaseFee('ETH', BaseFeeType.ReverseClaim),

      feeProvider.getBaseFee('USDT', BaseFeeType.NormalClaim),
      feeProvider.getBaseFee('USDT', BaseFeeType.ReverseLockup),
      feeProvider.getBaseFee('USDT', BaseFeeType.ReverseClaim),
    ]);

    const expected = [
      6120,
      5508,
      4968,

      510,
      459,
      414,

      27416,
      51106,
      27416,

      13487,
      47839,
      13487,
    ];

    expect(results).toEqual(expected);
  });

  test('should calculate percentage fees', async () => {
    const amount = 100000000;

    const results = await Promise.all([
      feeProvider.getFees('LTC/BTC', 2, OrderSide.BUY, amount, BaseFeeType.NormalClaim),
      feeProvider.getFees('LTC/BTC', 0.5, OrderSide.SELL, amount, BaseFeeType.ReverseLockup),

      feeProvider.getFees('BTC/BTC', 1, OrderSide.BUY, amount, BaseFeeType.NormalClaim),
    ]);

    const expected = [
      4000000,
      1000000,

      0,
    ];

    results.forEach((result, index) => {
      expect(result.percentageFee).toEqual(expected[index]);
    });
  });
});
