import type Logger from '../../../../../lib/Logger';
import ContractEventHandler from '../../../../../lib/wallet/ethereum/contracts/ContractEventHandler';
import { createDeferred } from '../../../../Utils';

describe('ContractEventHandler missed event checks', () => {
  const createSwap = () => ({
    on: jest.fn().mockResolvedValue(undefined),
    queryFilter: jest.fn().mockResolvedValue([]),
    filters: {
      Claim: jest.fn(),
      Lockup: jest.fn(),
    },
  });

  test('serializes overlapping missed event rescans', async () => {
    const mockLogger = {
      debug: jest.fn(),
      verbose: jest.fn(),
    } as unknown as Logger;
    const provider = {
      getBlockNumber: jest
        .fn()
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(101)
        .mockResolvedValueOnce(105),
    };
    const etherSwap = createSwap();
    const erc20Swap = createSwap();
    const handler = new ContractEventHandler(mockLogger);

    await handler.init(
      6n,
      {
        name: 'Arbitrum',
      } as any,
      provider as any,
      etherSwap as any,
      erc20Swap as any,
    );

    const firstRescanStarted = createDeferred();
    const releaseFirstRescan = createDeferred();
    const rescan = jest
      .fn()
      .mockImplementationOnce(async () => {
        firstRescanStarted.resolve();
        await releaseFirstRescan.promise;
      })
      .mockResolvedValue(undefined);
    handler['rescan'] = rescan;

    const firstCheck = handler.checkMissedEvents();
    await firstRescanStarted.promise;

    const secondCheck = handler.checkMissedEvents();
    const thirdCheck = handler.checkMissedEvents();

    expect(rescan).toHaveBeenCalledTimes(1);

    releaseFirstRescan.resolve();
    await Promise.all([firstCheck, secondCheck, thirdCheck]);

    expect(rescan).toHaveBeenCalledTimes(2);
    expect(rescan).toHaveBeenNthCalledWith(1, 100, 101);
    expect(rescan).toHaveBeenNthCalledWith(2, 101, 105);
    expect(mockLogger.debug).toHaveBeenNthCalledWith(
      2,
      'Checking for missed events of Arbitrum contracts v6 from block 101',
    );

    handler.destroy();
  });
});
