import { BigNumber } from 'ethers';
import GasNow from '../../../../lib/wallet/ethereum/GasNow';

describe('GasNow', () => {
  const gasNow = new GasNow();

  test('should fetch the gas price when initialized', async () => {
    await gasNow.init();

    expect(GasNow.latestGasPrice).toBeInstanceOf(BigNumber);
    expect(GasNow.latestGasPrice.gt(BigNumber.from(0))).toEqual(true);
  });

  test('should stop the update interval', () => {
    gasNow.stop();

    expect(gasNow['interval']).toEqual(undefined);
  });

  test('should update the latest gas price', async () => {
    GasNow.latestGasPrice = BigNumber.from(0);

    await gasNow['updateGasPrice']();

    expect(GasNow.latestGasPrice).not.toEqual(BigNumber.from(0));
  });
});
