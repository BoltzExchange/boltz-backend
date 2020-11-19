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
    latestRates: new Map<string, number>([
      ['ETH/USDT', 2],
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
  });

  test('should get percentage fees', () => {
    expect(feeProvider.getPercentageFee('LTC/BTC')).toEqual(0.02);
    expect(feeProvider.getPercentageFee('BTC/BTC')).toEqual(0);

    // Should set undefined fees to 1%
    expect(feeProvider.getPercentageFee('LTC/LTC')).toEqual(0.01);
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

    expect(feeProvider.getFees('LTC/BTC', 2, OrderSide.BUY, amount, BaseFeeType.NormalClaim)).toEqual({
      baseFee: 6120,
      percentageFee: 4000000,
    });

    expect(feeProvider.getFees('LTC/BTC', 2, OrderSide.BUY, amount, BaseFeeType.ReverseLockup)).toEqual({
      baseFee: 459,
      percentageFee: 4000000,
    });
  });
});
