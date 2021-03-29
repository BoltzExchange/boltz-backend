import { BigNumber } from 'ethers';
import Logger from '../../../../lib/Logger';
import GasNow from '../../../../lib/wallet/ethereum/GasNow';
import { wait } from '../../../Utils';

describe('GasNow', () => {
  const gasNow = new GasNow(
    Logger.disabledLogger,
    {
      chainId: 1,
      name: 'mainnet'
    },
  );

  test('should not run when not on mainnet', async () => {
    const notMainnetGasNow = new GasNow(
      Logger.disabledLogger,
      {
        chainId: 2,
        name: 'notMainnet',
      },
    );
    await notMainnetGasNow.init();

    expect(notMainnetGasNow['webSocket']).toEqual(undefined);
  });

  test('should fetch the gas price when initialized', async () => {
    await gasNow.init();

    expect(gasNow['webSocket']).not.toEqual(undefined);

    expect(GasNow.latestGasPrice).toBeInstanceOf(BigNumber);
    expect(GasNow.latestGasPrice.gt(BigNumber.from(0))).toEqual(true);
  });

  test('should subscribe to the gas price WebSocket', async () => {
    GasNow.latestGasPrice = BigNumber.from(0);

    // Wait for the WebSocket to send a message
    for (let i = 0; i < 10; i++) {
      if (GasNow.latestGasPrice.gt(BigNumber.from(0))) {
        break;
      }

      await wait(1000);
    }
  });

  test('should stop the WebSocket', () => {
    gasNow.stop();

    expect(gasNow['webSocket']).toEqual(undefined);
  });
});
