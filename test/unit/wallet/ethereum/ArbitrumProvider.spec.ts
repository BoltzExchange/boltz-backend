import Logger from '../../../../lib/Logger';
import ArbitrumProvider from '../../../../lib/wallet/ethereum/ArbitrumProvider';
import { networks } from '../../../../lib/wallet/ethereum/EvmNetworks';

jest.mock('../../../../lib/ExitHandler', () => ({
  shutdownSignal: { aborted: false },
}));

jest.mock(
  '../../../../lib/db/repositories/PendingEthereumTransactionRepository',
  () => ({
    addTransaction: jest.fn().mockResolvedValue(null),
    getHighestNonce: jest.fn().mockResolvedValue(undefined),
  }),
);

type L2Mock = {
  send: jest.Mock;
  destroy: jest.Mock;
};

type L1Mock = {
  getBlockNumber: jest.Mock;
  destroy: jest.Mock;
};

const hexBlock = (l2: number, l1?: number) => ({
  number: `0x${l2.toString(16)}`,
  ...(l1 !== undefined ? { l1BlockNumber: `0x${l1.toString(16)}` } : {}),
});

const makeL2 = (
  payload: { number: string; l1BlockNumber?: string } | Error,
): L2Mock => ({
  send: jest.fn().mockImplementation(() => {
    if (payload instanceof Error) {
      return Promise.reject(payload);
    }
    return Promise.resolve(payload);
  }),
  destroy: jest.fn().mockResolvedValue(undefined),
});

const makeL1 = (height: number): L1Mock => ({
  getBlockNumber: jest.fn().mockResolvedValue(height),
  destroy: jest.fn().mockResolvedValue(undefined),
});

const buildProvider = (
  l2Payload: { number: string; l1BlockNumber?: string } | Error,
  l1Height = 0,
): { provider: ArbitrumProvider; l2: L2Mock; l1: L1Mock } => {
  const provider = new ArbitrumProvider(
    Logger.disabledLogger,
    networks.Arbitrum,
    {
      providerEndpoint: 'http://127.0.0.1:0',
      l1Providers: [{ name: 'mainnet', endpoint: 'http://127.0.0.1:0' }],
    } as never,
  );

  // Tear down the real JsonRpcProviders before replacing the maps so their
  // internal polling timers don't outlive the test.
  for (const real of provider['providers'].values()) {
    void real.destroy();
  }
  for (const real of provider['l1Provider']['providers'].values()) {
    void real.destroy();
  }

  const l2 = makeL2(l2Payload);
  const l1 = makeL1(l1Height);

  provider['providers'] = new Map([['l2', l2 as any]]);
  provider['network'] = { chainId: 42161n, name: 'arbitrum' } as never;

  const l1Provider = provider['l1Provider'];
  l1Provider['providers'] = new Map([['l1', l1 as any]]);
  l1Provider['network'] = { chainId: 1n, name: 'mainnet' } as never;

  return { provider, l2, l1 };
};

describe('ArbitrumProvider', () => {
  describe('getLatestBlock', () => {
    test('parses number and l1BlockNumber from the raw L2 block', async () => {
      const { provider, l2, l1 } = buildProvider(hexBlock(2_000, 123));

      await expect(provider['getLatestBlock']()).resolves.toEqual({
        number: 2_000,
        l1BlockNumber: 123,
      });

      expect(l2.send).toHaveBeenCalledTimes(1);
      expect(l2.send).toHaveBeenCalledWith('eth_getBlockByNumber', [
        'latest',
        false,
      ]);
      expect(l1.getBlockNumber).not.toHaveBeenCalled();

      await provider.destroy();
    });

    test('returns l1BlockNumber undefined when the raw payload omits it', async () => {
      const { provider } = buildProvider(hexBlock(2_000));

      await expect(provider['getLatestBlock']()).resolves.toEqual({
        number: 2_000,
        l1BlockNumber: undefined,
      });

      await provider.destroy();
    });

    test('rejects when the underlying send fails', async () => {
      const { provider } = buildProvider(new Error('L2 down'));

      let caught: unknown;
      try {
        await provider['getLatestBlock']();
      } catch (e) {
        caught = e;
      }
      expect(caught).toBeDefined();
      expect((caught as { message: string }).message).toMatch(/L2 down/);

      await provider.destroy();
    });
  });

  describe('poller integration', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('emits BlockEvents that carry l1BlockNumber to listeners', async () => {
      const { provider, l2, l1 } = buildProvider(hexBlock(2_000, 123));

      const listener = jest.fn();
      await provider.onBlock(listener);

      await jest.advanceTimersByTimeAsync(0);

      expect(listener).toHaveBeenCalledWith({
        number: 2_000,
        l1BlockNumber: 123,
      });
      expect(l2.send).toHaveBeenCalledTimes(1);
      expect(l1.getBlockNumber).not.toHaveBeenCalled();

      await provider.destroy();
    });

    test('listener receives the latest l1BlockNumber as the L2 block advances', async () => {
      const { provider, l2 } = buildProvider(hexBlock(2_000, 123));
      l2.send
        .mockReset()
        .mockResolvedValueOnce(hexBlock(2_000, 123))
        .mockResolvedValueOnce(hexBlock(2_001, 124))
        .mockResolvedValueOnce(hexBlock(2_002, 125));

      const listener = jest.fn();
      await provider.onBlock(listener);

      await jest.advanceTimersByTimeAsync(0);
      await jest.advanceTimersByTimeAsync(2_500);
      await jest.advanceTimersByTimeAsync(2_500);

      expect(listener).toHaveBeenNthCalledWith(1, {
        number: 2_000,
        l1BlockNumber: 123,
      });
      expect(listener).toHaveBeenNthCalledWith(2, {
        number: 2_001,
        l1BlockNumber: 124,
      });
      expect(listener).toHaveBeenNthCalledWith(3, {
        number: 2_002,
        l1BlockNumber: 125,
      });

      await provider.destroy();
    });
  });

  describe('getLocktimeHeight', () => {
    test('returns the live L1 tip from the L1 provider', async () => {
      const { provider, l1 } = buildProvider(hexBlock(2_000, 123), 999);

      await expect(provider.getLocktimeHeight()).resolves.toEqual(999);
      expect(l1.getBlockNumber).toHaveBeenCalledTimes(1);

      await provider.destroy();
    });
  });

  describe('destroy', () => {
    test('tears down the L1 provider in addition to the L2 one', async () => {
      const { provider, l2, l1 } = buildProvider(hexBlock(2_000, 123));

      await provider.destroy();

      expect(l2.destroy).toHaveBeenCalledTimes(1);
      expect(l1.destroy).toHaveBeenCalledTimes(1);
    });
  });
});
