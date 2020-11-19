import Logger from '../../../lib/Logger';
import FeeProvider from '../../../lib/rates/FeeProvider';
import { OrderSide } from '../../../lib/consts/Enums';

const btcFee = 36;
const ltcFee = 3;

const getFeeEstimation = async () => {
  return new Map([
    ['BTC', btcFee],
    ['LTC', ltcFee],
  ]);
};

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

    expect(feeProvider.minerFees.size).toEqual(2);
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
    })
  });

  test('should get fees of a Swap', () => {
    const amount = 100000000;

    expect(feeProvider.getFees('LTC/BTC', 2, OrderSide.BUY, amount, true)).toEqual({
      baseFee: 459,
      percentageFee: 4000000,
    });

    expect(feeProvider.getFees('LTC/BTC', 2, OrderSide.BUY, amount, false)).toEqual({
      baseFee: 6120,
      percentageFee: 4000000,
    });
  });
});
