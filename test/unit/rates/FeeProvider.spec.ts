import Logger from '../../../lib/Logger';
import FeeProvider from '../../../lib/rates/FeeProvider';
import { SwapType, OrderSide } from '../../../lib/consts/Enums';

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
    const getBaseFee = feeProvider['getBaseFee'];

    const results = await Promise.all([
      getBaseFee('BTC', false),
      getBaseFee('BTC', true),

      getBaseFee('LTC', false),
      getBaseFee('LTC', true),
    ]);

    const expected = [
      6120,
      5508,

      510,
      459,
    ];

    results.forEach((result, index) => {
      expect(result).toEqual(expected[index]);
    });
  });

  test('should calculate percentage fees', async () => {
    const getPercentageFee = feeProvider['getPercentageFee'];

    const amount = 100000000;

    const results = await Promise.all([
      getPercentageFee('LTC/BTC', amount, 2),
      getPercentageFee('LTC/BTC', amount, 0.5),

      getPercentageFee('BTC/BTC', amount, 1),
    ]);

    const expected = [
      4000000,
      1000000,

      0,
    ];

    results.forEach((result, index) => {
      expect(result).toEqual(expected[index]);
    });
  });

  test('should get fees for swaps', async () => {
    const amount = 100000000;

    const checkFees = async (
      type: SwapType,
      orderSide: OrderSide,
      expectedAmounts: { baseFee: number, percentageFee: number },
    ) => {
      const fees = await feeProvider.getFees('LTC/BTC', 2, orderSide, amount, type);
      expect(fees).toEqual(expectedAmounts);
    };

    await Promise.all([
      checkFees(SwapType.Submarine, OrderSide.BUY, { baseFee: 6120, percentageFee: 4000000 }),
      checkFees(SwapType.Submarine, OrderSide.SELL, { baseFee: 510, percentageFee: 4000000 }),

      checkFees(SwapType.ReverseSubmarine, OrderSide.BUY, { baseFee: 459, percentageFee: 4000000 }),
      checkFees(SwapType.ReverseSubmarine, OrderSide.SELL, { baseFee: 5508, percentageFee: 4000000 }),

      checkFees(SwapType.ChainToChain, OrderSide.BUY, { baseFee: 7038, percentageFee: 4000000 }),
      checkFees(SwapType.ChainToChain, OrderSide.SELL, { baseFee: 11526, percentageFee: 4000000 }),
    ]);
  });
});
