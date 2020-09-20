import { BigNumber } from 'ethers';
import Logger from '../../../../lib/Logger';
import GasNow from '../../../../lib/wallet/ethereum/GasNow';

describe('GasNow', () => {
  const gasNow = new GasNow(Logger.disabledLogger);

  test('should not run when not on mainnet', async () => {
    const notMainnetGasNow = new GasNow(Logger.disabledLogger);
    await notMainnetGasNow.init({
      chainId: 2,
      name: 'notMainnet',
    });

    expect(notMainnetGasNow['interval']).toEqual(undefined);
  });

  test('should fetch the gas price when initialized', async () => {
    await gasNow.init({
      chainId: 1,
      name: 'mainnet'
    });

    expect(gasNow['interval']).not.toEqual(undefined);

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
