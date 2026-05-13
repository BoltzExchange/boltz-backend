import EventEmitter from 'events';
import Logger from '../../../../lib/Logger';
import Errors from '../../../../lib/wallet/ethereum/Errors';
import { networks } from '../../../../lib/wallet/ethereum/EvmNetworks';
import InjectedProvider from '../../../../lib/wallet/ethereum/InjectedProvider';
import WebSocketProvider, {
  type BlockEvent,
} from '../../../../lib/wallet/ethereum/WebSocketProvider';

jest.mock('../../../../lib/ExitHandler', () => ({
  shutdownSignal: { aborted: false },
}));
const mockedExitHandler = jest.requireMock('../../../../lib/ExitHandler') as {
  shutdownSignal: { aborted: boolean };
};

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

const buildProvider = (
  overrides?: Partial<UnderlyingMock>,
): { provider: InjectedProvider; mockUnder: UnderlyingMock } => {
  const provider = new InjectedProvider(
    Logger.disabledLogger,
    networks.Ethereum,
    { providerEndpoint: 'http://127.0.0.1:0' } as never,
  );

  for (const real of provider['providers'].values()) {
    void real.destroy();
  }

  const mockUnder: UnderlyingMock = {
    getBlockNumber: jest.fn().mockResolvedValue(100),
    destroy: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };

  provider['providers'] = new Map([['mock', mockUnder as any]]);
  provider['network'] = { chainId: 1n, name: 'mainnet' } as never;
  return { provider, mockUnder };
};

describe('InjectedProvider', () => {
  beforeEach(() => {
    mockedExitHandler.shutdownSignal.aborted = false;
  });

  describe('constructor', () => {
    test('throws when no providers are configured', () => {
      expect(
        () =>
          new InjectedProvider(Logger.disabledLogger, networks.Ethereum, {
            providers: [],
          } as never),
      ).toThrow(Errors.NO_PROVIDER_SPECIFIED().message);
    });

    test('accepts an HTTP-only endpoint (NEED_WEBSOCKET_PROVIDER no longer enforced)', () => {
      const provider = new InjectedProvider(
        Logger.disabledLogger,
        networks.Ethereum,
        { providerEndpoint: 'http://127.0.0.1:0' } as never,
      );

      expect(provider['providers'].size).toEqual(1);
    });

    test('skips blank-endpoint providers and throws if none remain', () => {
      expect(
        () =>
          new InjectedProvider(Logger.disabledLogger, networks.Ethereum, {
            providers: [{ endpoint: '' }],
          } as never),
      ).toThrow(Errors.NO_PROVIDER_SPECIFIED().message);
    });
  });

  describe('onBlock polling', () => {
    let provider: InjectedProvider;
    let mockUnder: UnderlyingMock;

    beforeEach(() => {
      jest.useFakeTimers();
      ({ provider, mockUnder } = buildProvider());
    });

    afterEach(async () => {
      jest.useRealTimers();
      await provider.destroy();
    });

    test('does not start polling until the first listener is added', () => {
      expect(provider['blockPollTimer']).toBeUndefined();
    });

    test('starts polling and fires the listener on the immediate first tick', async () => {
      const listener = jest.fn();
      await provider.onBlock(listener);

      expect(provider['blockPollTimer']).toBeDefined();

      await jest.advanceTimersByTimeAsync(0);

      expect(mockUnder.getBlockNumber).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith({ number: 100 });

      await jest.advanceTimersByTimeAsync(2_500);

      expect(mockUnder.getBlockNumber).toHaveBeenCalledTimes(2);
      expect(listener).toHaveBeenCalledTimes(2);
    });

    test('fires the listener on every tick (no internal height dedup)', async () => {
      const listener = jest.fn();
      await provider.onBlock(listener);

      await jest.advanceTimersByTimeAsync(0); // immediate
      await jest.advanceTimersByTimeAsync(2_500);
      await jest.advanceTimersByTimeAsync(2_500);

      expect(listener).toHaveBeenCalledTimes(3);
      expect(listener).toHaveBeenNthCalledWith(1, { number: 100 });
      expect(listener).toHaveBeenNthCalledWith(2, { number: 100 });
      expect(listener).toHaveBeenNthCalledWith(3, { number: 100 });
    });

    test('multiple onBlock calls share a single poll timer', async () => {
      const l1 = jest.fn();
      const l2 = jest.fn();

      await provider.onBlock(l1);
      const timerBefore = provider['blockPollTimer'];

      await jest.advanceTimersByTimeAsync(0);

      await provider.onBlock(l2);
      const timerAfter = provider['blockPollTimer'];

      expect(timerBefore).toBe(timerAfter);

      expect(l1).toHaveBeenCalledTimes(1);
      expect(l2).not.toHaveBeenCalled();

      await jest.advanceTimersByTimeAsync(2_500);

      expect(l1).toHaveBeenCalledTimes(2);
      expect(l2).toHaveBeenCalledTimes(1);
      expect(mockUnder.getBlockNumber).toHaveBeenCalledTimes(2);
    });

    test('continues firing other listeners when one throws', async () => {
      const broken = jest.fn(() => {
        throw new Error('boom');
      });
      const ok = jest.fn();

      await provider.onBlock(broken);
      await jest.advanceTimersByTimeAsync(0);
      await provider.onBlock(ok);

      await jest.advanceTimersByTimeAsync(2_500);

      expect(broken).toHaveBeenCalledTimes(2);
      expect(ok).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(2_500);

      expect(broken).toHaveBeenCalledTimes(3);
      expect(ok).toHaveBeenCalledTimes(2);
    });

    test('keeps polling after an RPC failure', async () => {
      mockUnder.getBlockNumber
        .mockRejectedValueOnce(new Error('rpc down'))
        .mockResolvedValueOnce(101)
        .mockResolvedValueOnce(102);

      const listener = jest.fn();
      await provider.onBlock(listener);

      await jest.advanceTimersByTimeAsync(0);
      expect(listener).not.toHaveBeenCalled();

      await jest.advanceTimersByTimeAsync(2_500);
      expect(listener).toHaveBeenLastCalledWith({ number: 101 });

      await jest.advanceTimersByTimeAsync(2_500);
      expect(listener).toHaveBeenLastCalledWith({ number: 102 });
    });

    test('skips scheduled ticks while a previous tick is still in flight', async () => {
      let resolveFirst: (block: BlockEvent) => void = () => {};
      const firstCall = new Promise<BlockEvent>((resolve) => {
        resolveFirst = resolve;
      });
      const getLatest = jest
        .fn()
        .mockImplementationOnce(() => firstCall)
        .mockResolvedValue({ number: 200 });
      (provider as any).getLatestBlock = getLatest;

      const listener = jest.fn();
      await provider.onBlock(listener);

      await jest.advanceTimersByTimeAsync(0);
      expect(getLatest).toHaveBeenCalledTimes(1);
      expect(listener).not.toHaveBeenCalled();

      await jest.advanceTimersByTimeAsync(2_500);
      await jest.advanceTimersByTimeAsync(2_500);
      await jest.advanceTimersByTimeAsync(2_500);
      expect(getLatest).toHaveBeenCalledTimes(1);

      resolveFirst({ number: 100 });
      await jest.advanceTimersByTimeAsync(0);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenLastCalledWith({ number: 100 });

      await jest.advanceTimersByTimeAsync(2_500);
      expect(getLatest).toHaveBeenCalledTimes(2);
      expect(listener).toHaveBeenLastCalledWith({ number: 200 });
    });

    test('does not fire listeners after destroy', async () => {
      const listener = jest.fn();
      await provider.onBlock(listener);

      await jest.advanceTimersByTimeAsync(0);
      const callsBeforeDestroy = listener.mock.calls.length;

      await provider.destroy();
      await jest.advanceTimersByTimeAsync(10_000);

      expect(listener).toHaveBeenCalledTimes(callsBeforeDestroy);
    });

    test('does not fire listeners while shutdown signal is aborted', async () => {
      const listener = jest.fn();
      mockedExitHandler.shutdownSignal.aborted = true;

      await provider.onBlock(listener);
      await jest.advanceTimersByTimeAsync(2_500);

      expect(listener).not.toHaveBeenCalled();
    });

    test('destroy clears the poll timer and listener set', async () => {
      await provider.onBlock(jest.fn());
      expect(provider['blockPollTimer']).toBeDefined();
      expect(provider['blockListeners'].size).toEqual(1);

      await provider.destroy();

      expect(provider['blockPollTimer']).toBeUndefined();
      expect(provider['blockListeners'].size).toEqual(0);
    });

    test('startBlockPoll is idempotent once a timer is active', async () => {
      await provider.onBlock(jest.fn());
      const timerBefore = provider['blockPollTimer'];

      provider['startBlockPoll']();

      expect(provider['blockPollTimer']).toBe(timerBefore);
    });

    test('startBlockPoll is a no-op after destroy', async () => {
      await provider.destroy();

      provider['startBlockPoll']();

      expect(provider['blockPollTimer']).toBeUndefined();
    });
  });

  describe('getLatestBlock', () => {
    test('returns { number } sourced from getBlockNumber', async () => {
      const { provider, mockUnder } = buildProvider();
      mockUnder.getBlockNumber.mockResolvedValue(42);

      await expect(provider['getLatestBlock']()).resolves.toEqual({
        number: 42,
      });

      await provider.destroy();
    });
  });

  describe('onReconnect', () => {
    const buildWithFakeProviders = (
      providers: Array<{ name: string; impl: any }>,
    ): InjectedProvider => {
      const provider = new InjectedProvider(
        Logger.disabledLogger,
        networks.Ethereum,
        { providerEndpoint: 'http://127.0.0.1:0' } as never,
      );
      for (const real of provider['providers'].values()) {
        void real.destroy();
      }
      provider['providers'] = new Map(
        providers.map(({ name, impl }) => [name, impl as any]),
      );
      return provider;
    };

    test('registers the callback on every WebSocket provider', async () => {
      const ws1 = new EventEmitter();
      const ws2 = new EventEmitter();
      const fake1: any = {
        ws: ws1,
        destroy: jest.fn().mockResolvedValue(undefined),
      };
      const fake2: any = {
        ws: ws2,
        destroy: jest.fn().mockResolvedValue(undefined),
      };
      // Make the duck-typed mocks pass `instanceof WebSocketProvider`.
      Object.setPrototypeOf(fake1, WebSocketProvider.prototype);
      Object.setPrototypeOf(fake2, WebSocketProvider.prototype);

      const provider = buildWithFakeProviders([
        { name: 'a', impl: fake1 },
        { name: 'b', impl: fake2 },
      ]);

      const callback = jest.fn();
      provider.onReconnect(callback);

      ws1.emit('reconnected');
      expect(callback).toHaveBeenCalledTimes(1);

      ws2.emit('reconnected');
      expect(callback).toHaveBeenCalledTimes(2);

      await provider.destroy();
    });

    test('skips providers that are not WebSocketProvider instances', async () => {
      const plain: any = {
        destroy: jest.fn().mockResolvedValue(undefined),
        ws: new EventEmitter(),
      };
      // Deliberately do NOT set WebSocketProvider.prototype.

      const provider = buildWithFakeProviders([{ name: 'plain', impl: plain }]);

      const callback = jest.fn();
      expect(() => provider.onReconnect(callback)).not.toThrow();

      plain.ws.emit('reconnected');
      expect(callback).not.toHaveBeenCalled();

      await provider.destroy();
    });

    test('destroy unregisters callbacks so subsequent reconnects do not fire them', async () => {
      const ws1 = new EventEmitter();
      const fake1: any = {
        ws: ws1,
        destroy: jest.fn().mockResolvedValue(undefined),
      };
      Object.setPrototypeOf(fake1, WebSocketProvider.prototype);

      const provider = buildWithFakeProviders([{ name: 'a', impl: fake1 }]);

      const callback = jest.fn();
      provider.onReconnect(callback);
      expect(provider['reconnectCallbacks'].size).toEqual(1);

      await provider.destroy();

      expect(provider['reconnectCallbacks'].size).toEqual(0);

      ws1.emit('reconnected');
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('integration of poller and listener fan-out', () => {
    test('emits the BlockEvent shape produced by an overridden getLatestBlock', async () => {
      jest.useFakeTimers();

      const { provider, mockUnder } = buildProvider();
      const augmented: BlockEvent = { number: 50, l1BlockNumber: 12 };
      (provider as any).getLatestBlock = jest.fn().mockResolvedValue(augmented);

      const listener = jest.fn();
      await provider.onBlock(listener);

      // Immediate first tick.
      await jest.advanceTimersByTimeAsync(0);

      expect(listener).toHaveBeenCalledWith(augmented);
      expect(mockUnder.getBlockNumber).not.toHaveBeenCalled();

      jest.useRealTimers();
      await provider.destroy();
    });
  });
});
