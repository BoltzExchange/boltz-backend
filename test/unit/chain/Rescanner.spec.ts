import Rescanner from '../../../lib/chain/Rescanner';

describe('Rescanner', () => {
  const symbol = 'BTC';
  const blockHeight = 123;

  let logger: any;
  let chainClient: any;
  let sidecar: any;

  beforeEach(() => {
    logger = {
      debug: jest.fn(),
      info: jest.fn(),
    } as any;

    chainClient = {
      symbol,
      scannedHeight: blockHeight,
      rescanChain: jest.fn().mockResolvedValue(undefined),
    } as any;

    sidecar = {
      rescanMempool: jest.fn().mockResolvedValue(undefined),
    } as any;

    jest.clearAllMocks();
  });

  test('should rescan chain from current height and rescan mempool', async () => {
    const rescanner = new Rescanner(logger, chainClient, sidecar);

    await rescanner.rescan();

    expect(logger.info).toHaveBeenCalledWith(
      `Rescanning ${symbol} chain from height ${blockHeight}`,
    );

    expect(chainClient.rescanChain).toHaveBeenCalledTimes(1);
    expect(chainClient.rescanChain).toHaveBeenCalledWith(blockHeight);

    expect(sidecar.rescanMempool).toHaveBeenCalledTimes(1);
    expect(sidecar.rescanMempool).toHaveBeenCalledWith([symbol]);
  });

  test('should not start a new rescan if one is already in progress', async () => {
    let resolveRescan: () => void;
    const rescanPromise = new Promise<void>((resolve) => {
      resolveRescan = resolve;
    });

    chainClient.rescanChain = jest.fn().mockImplementation(() => rescanPromise);

    const rescanner = new Rescanner(logger, chainClient, sidecar);

    const firstCall = rescanner.rescan();

    await Promise.resolve();

    await rescanner.rescan();

    expect(logger.debug).toHaveBeenCalledWith(
      `Rescanning ${symbol} is already in progress`,
    );

    expect(chainClient.rescanChain).toHaveBeenCalledTimes(1);
    expect(sidecar.rescanMempool).toHaveBeenCalledTimes(0);

    resolveRescan!();
    await firstCall;

    expect(sidecar.rescanMempool).toHaveBeenCalledTimes(1);
  });
});
