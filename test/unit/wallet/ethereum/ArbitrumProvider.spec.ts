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

type UnderlyingMock = {
  getBlockNumber: jest.Mock;
  destroy: jest.Mock;
};

const makeUnder = (height: number): UnderlyingMock => ({
  getBlockNumber: jest.fn().mockResolvedValue(height),
  destroy: jest.fn().mockResolvedValue(undefined),
});

const buildProvider = (
  l2Height: number,
  l1Height: number,
): { provider: ArbitrumProvider; l2: UnderlyingMock; l1: UnderlyingMock } => {
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

  const l2 = makeUnder(l2Height);
  const l1 = makeUnder(l1Height);

  // Swap the real underlying providers (both L2 and L1) for controllable mocks.
  provider['providers'] = new Map([['l2', l2 as any]]);
  provider['network'] = { chainId: 42161n, name: 'arbitrum' } as never;

  const l1Provider = provider['l1Provider'];
  l1Provider['providers'] = new Map([['l1', l1 as any]]);
  l1Provider['network'] = { chainId: 1n, name: 'mainnet' } as never;

  return { provider, l2, l1 };
};

describe('ArbitrumProvider', () => {
  describe('getLatestBlock', () => {
    test('combines L2 height and L1 height into one BlockEvent', async () => {
      const { provider, l2, l1 } = buildProvider(2_000, 123);

      await expect(provider['getLatestBlock']()).resolves.toEqual({
        number: 2_000,
        l1BlockNumber: 123,
      });

      expect(l2.getBlockNumber).toHaveBeenCalledTimes(1);
      expect(l1.getBlockNumber).toHaveBeenCalledTimes(1);

      await provider.destroy();
    });

    test('rejects when the L1 fetch fails', async () => {
      const { provider, l1 } = buildProvider(2_000, 123);
      l1.getBlockNumber.mockReset().mockRejectedValue(new Error('L1 down'));

      let caught: unknown;
      try {
        await provider['getLatestBlock']();
      } catch (e) {
        caught = e;
      }
      expect(caught).toBeDefined();
      expect((caught as { message: string }).message).toMatch(/L1 down/);

      await provider.destroy();
    });

    test('rejects when the L2 fetch fails', async () => {
      const { provider, l2 } = buildProvider(2_000, 123);
      l2.getBlockNumber.mockReset().mockRejectedValue(new Error('L2 down'));

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
      const { provider, l2, l1 } = buildProvider(2_000, 123);

      const listener = jest.fn();
      await provider.onBlock(listener);

      await jest.advanceTimersByTimeAsync(0);

      expect(listener).toHaveBeenCalledWith({
        number: 2_000,
        l1BlockNumber: 123,
      });
      expect(l2.getBlockNumber).toHaveBeenCalledTimes(1);
      expect(l1.getBlockNumber).toHaveBeenCalledTimes(1);

      await provider.destroy();
    });

    test('listener receives the latest L1 height as it advances', async () => {
      const { provider, l1 } = buildProvider(2_000, 123);
      l1.getBlockNumber
        .mockReset()
        .mockResolvedValueOnce(123)
        .mockResolvedValueOnce(124)
        .mockResolvedValueOnce(125);

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
        number: 2_000,
        l1BlockNumber: 124,
      });
      expect(listener).toHaveBeenNthCalledWith(3, {
        number: 2_000,
        l1BlockNumber: 125,
      });

      await provider.destroy();
    });
  });

  describe('destroy', () => {
    test('tears down the L1 provider in addition to the L2 one', async () => {
      const { provider, l2, l1 } = buildProvider(2_000, 123);

      await provider.destroy();

      expect(l2.destroy).toHaveBeenCalledTimes(1);
      expect(l1.destroy).toHaveBeenCalledTimes(1);
    });
  });
});
