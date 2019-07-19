import Logger from '../../../lib/Logger';
import { OrderSide } from '../../../lib/consts/Enums';
import FeeProvider from '../../../lib/rates/FeeProvider';

const btcFee = 36;
const ltcFee = 3;

const getFeeEstimation = () => Promise.resolve(
  new Map([
    ['BTC', btcFee],
    ['LTC', ltcFee],
  ]),
);

describe('FeeProvider', () => {
  const feeProvider = new FeeProvider(Logger.disabledLogger, getFeeEstimation);

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
      feeProvider.getBaseFee('BTC', false),
      feeProvider.getBaseFee('BTC', true),

      feeProvider.getBaseFee('LTC', false),
      feeProvider.getBaseFee('LTC', true),
    ]);

    const expected = [
      5040,
      5508,

      420,
      459,
    ];

    results.forEach((result, index) => {
      expect(result).toEqual(expected[index]);
    });
  });

  test('should calculate percentage fees', async () => {
    const amount = 100000000;

    const results = await Promise.all([
      feeProvider.getFees('LTC/BTC', 2, OrderSide.BUY, amount, true),
      feeProvider.getFees('LTC/BTC', 0.5, OrderSide.SELL, amount, true),

      feeProvider.getFees('BTC/BTC', 1, OrderSide.BUY, amount, false),
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
