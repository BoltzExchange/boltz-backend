import Logger from '../../../lib/Logger';
import FeeProvider from '../../../lib/rates/FeeProvider';
import { BaseFeeType, OrderSide } from '../../../lib/consts/Enums';
import DataAggregator from '../../../lib/rates/data/DataAggregator';

const btcFee = 36;
const ltcFee = 3;
const ethFee = 11;

const getFeeEstimation = async () => {
  return new Map([
    ['BTC', btcFee],
    ['LTC', ltcFee],
    ['ETH', ethFee],
  ]);
};

jest.mock('../../../lib/rates/data/DataAggregator', () => {
  return jest.fn().mockImplementation(() => ({
    latestRates: new Map<string, number>([['ETH/USDT', 2]]),
  }));
});

const MockedDataAggregator = <jest.Mock<DataAggregator>>DataAggregator;

describe('FeeProvider', () => {
  const feeProvider = new FeeProvider(
    Logger.disabledLogger,
    MockedDataAggregator(),
    getFeeEstimation,
  );

  test('should init', () => {
    feeProvider.init([
      {
        base: 'LTC',
        quote: 'BTC',
        fee: 2,
        swapInFee: -1,
        minSwapAmount: 1,
        maxSwapAmount: 2,
      },
      {
        base: 'BTC',
        quote: 'BTC',
        fee: 0,
        swapInFee: -1,
        minSwapAmount: 1,
        maxSwapAmount: 2,
      },
      {
        base: 'LTC',
        quote: 'LTC',

        // The FeeProvider should set this to 1
        fee: undefined,
        swapInFee: undefined,

        minSwapAmount: 1,
        maxSwapAmount: 2,
      },
    ]);

    const feeMap = feeProvider['percentageFees'];
    expect(feeMap.size).toEqual(3);
  });

  test('should get percentage fees of a pair', () => {
    expect(feeProvider.getPercentageFees('LTC/BTC')).toEqual({
      percentage: 2,
      percentageSwapIn: -1,
    });
    expect(feeProvider.getPercentageFees('BTC/BTC')).toEqual({
      percentage: 0,
      percentageSwapIn: -1,
    });
    expect(feeProvider.getPercentageFees('LTC/LTC')).toEqual({
      percentage: 1,
      percentageSwapIn: 1,
    });
  });

  test('should get percentage fees of normal swaps', () => {
    expect(feeProvider.getPercentageFee('LTC/BTC', false)).toEqual(-0.01);
    expect(feeProvider.getPercentageFee('BTC/BTC', false)).toEqual(-0.01);

    // Should set undefined fees to 1%
    expect(feeProvider.getPercentageFee('LTC/LTC', false)).toEqual(0.01);
  });

  test('should get percentage fees of reverse swaps', () => {
    expect(feeProvider.getPercentageFee('LTC/BTC', true)).toEqual(0.02);
    expect(feeProvider.getPercentageFee('BTC/BTC', true)).toEqual(0);

    // Should set undefined fees to 1%
    expect(feeProvider.getPercentageFee('LTC/LTC', true)).toEqual(0.01);
  });

  test('should update miner fees', async () => {
    expect(feeProvider.minerFees.size).toEqual(0);

    await feeProvider.updateMinerFees('BTC');
    await feeProvider.updateMinerFees('LTC');
    await feeProvider.updateMinerFees('ETH');
    await feeProvider.updateMinerFees('USDT');

    expect(feeProvider.minerFees.size).toEqual(4);
  });

  test('should calculate miner fees', () => {
    expect(feeProvider.minerFees.get('BTC')).toEqual({
      normal: 6120,
      reverse: {
        claim: 4968,
        lockup: 5508,
      },
    });

    expect(feeProvider.minerFees.get('LTC')).toEqual({
      normal: 510,
      reverse: {
        claim: 414,
        lockup: 459,
      },
    });

    expect(feeProvider.minerFees.get('ETH')).toEqual({
      normal: 27416,
      reverse: {
        claim: 27416,
        lockup: 51106,
      },
    });

    expect(feeProvider.minerFees.get('USDT')).toEqual({
      normal: 53948,
      reverse: {
        claim: 53948,
        lockup: 191356,
      },
    });
  });

  test('should get fees of a Swap', () => {
    const amount = 100000000;

    expect(
      feeProvider.getFees(
        'LTC/BTC',
        2,
        OrderSide.BUY,
        amount,
        BaseFeeType.NormalClaim,
      ),
    ).toEqual({
      baseFee: 6120,
      percentageFee: -2000000,
    });

    expect(
      feeProvider.getFees(
        'LTC/BTC',
        2,
        OrderSide.BUY,
        amount,
        BaseFeeType.ReverseLockup,
      ),
    ).toEqual({
      baseFee: 459,
      percentageFee: 4000000,
    });
  });

  test('should get base fees', () => {
    expect(feeProvider.getBaseFee('BTC', BaseFeeType.NormalClaim)).toEqual(
      6120,
    );
    expect(feeProvider.getBaseFee('BTC', BaseFeeType.ReverseClaim)).toEqual(
      4968,
    );
    expect(feeProvider.getBaseFee('BTC', BaseFeeType.ReverseLockup)).toEqual(
      5508,
    );

    expect(feeProvider.getBaseFee('LTC', BaseFeeType.NormalClaim)).toEqual(510);
  });
});
