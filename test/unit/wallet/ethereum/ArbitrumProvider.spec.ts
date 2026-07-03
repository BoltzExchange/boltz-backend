import ArbitrumProvider from '../../../../lib/wallet/ethereum/ArbitrumProvider';
import { networks } from '../../../../lib/wallet/ethereum/EvmNetworks';
import InjectedProvider from '../../../../lib/wallet/ethereum/InjectedProvider';

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

type LoggerMock = {
  error: jest.Mock;
  warn: jest.Mock;
  info: jest.Mock;
  verbose: jest.Mock;
  debug: jest.Mock;
  silly: jest.Mock;
};

const makeLogger = (): LoggerMock => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  verbose: jest.fn(),
  debug: jest.fn(),
  silly: jest.fn(),
});

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

const buildProvider = (
  l2Payload: { number: string; l1BlockNumber?: string } | Error,
  regtest = false,
): { provider: ArbitrumProvider; l2: L2Mock; logger: LoggerMock } => {
  const logger = makeLogger();
  const provider = new ArbitrumProvider(logger as never, networks.Arbitrum, {
    providerEndpoint: 'http://127.0.0.1:0',
    regtest,
  } as never);

  // Tear down the real JsonRpcProviders so their timers don't outlive the test
  for (const real of provider['providers'].values()) {
    void real.destroy();
  }

  const l2 = makeL2(l2Payload);

  provider['providers'] = new Map([['l2', l2 as any]]);
  provider['network'] = { chainId: 42161n, name: 'arbitrum' } as never;

  return { provider, l2, logger };
};

describe('ArbitrumProvider', () => {
  describe('getLatestBlock', () => {
    test('parses hex number and hex l1BlockNumber from the raw L2 block', async () => {
      const { provider, l2 } = buildProvider(hexBlock(2_000, 123));

      await expect(provider['getLatestBlock']()).resolves.toEqual({
        number: 2_000,
        l1BlockNumber: 123,
      });

      expect(l2.send).toHaveBeenCalledTimes(1);
      expect(l2.send).toHaveBeenCalledWith('eth_getBlockByNumber', [
        'latest',
        false,
      ]);

      await provider.destroy();
    });

    test('parses a decimal JSON-number l1BlockNumber (as anvil returns for mined blocks)', async () => {
      const { provider } = buildProvider({
        number: '0x1bc07ff8',
        l1BlockNumber: 465_600_504,
      } as never);

      await expect(provider['getLatestBlock']()).resolves.toEqual({
        number: 465_600_504,
        l1BlockNumber: 465_600_504,
      });

      await provider.destroy();
    });

    test('parses a decimal string l1BlockNumber (base-10, not base-16)', async () => {
      const { provider } = buildProvider({
        number: '0x1bc07ff8',
        l1BlockNumber: '465600504',
      } as never);

      await expect(provider['getLatestBlock']()).resolves.toEqual({
        number: 465_600_504,
        l1BlockNumber: 465_600_504,
      });

      await provider.destroy();
    });

    test('parses an uppercase 0X hex l1BlockNumber', async () => {
      const { provider } = buildProvider({
        number: '0x1bc07ff8',
        l1BlockNumber: '0X1BC07FF8',
      });

      await expect(provider['getLatestBlock']()).resolves.toEqual({
        number: 465_600_504,
        l1BlockNumber: 465_600_504,
      });

      await provider.destroy();
    });

    test('rejects a garbage l1BlockNumber instead of producing NaN', async () => {
      const { provider } = buildProvider({
        number: '0x1bc07ff8',
        l1BlockNumber: 'abc',
      });

      await expect(provider['getLatestBlock']()).rejects.toThrow(
        /invalid numeric/,
      );

      await provider.destroy();
    });

    test('logs an error and throws (no silent fallback) when l1BlockNumber is missing outside regtest', async () => {
      const { provider, logger } = buildProvider(hexBlock(2_000));

      await expect(provider['getLatestBlock']()).rejects.toThrow(
        /l1BlockNumber/,
      );
      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('l1BlockNumber'),
      );

      await provider.destroy();
    });

    test('falls back to the L2 number and does not log when l1BlockNumber is missing in regtest', async () => {
      const { provider, logger } = buildProvider(hexBlock(2_000), true);

      await expect(provider['getLatestBlock']()).resolves.toEqual({
        number: 2_000,
        l1BlockNumber: undefined,
      });
      expect(logger.error).not.toHaveBeenCalled();

      await provider.destroy();
    });

    test('treats a null l1BlockNumber like a missing one and throws outside regtest', async () => {
      const { provider, logger } = buildProvider({
        number: '0x7d0',
        l1BlockNumber: null,
      } as never);

      await expect(provider['getLatestBlock']()).rejects.toThrow(
        /l1BlockNumber/,
      );
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('l1BlockNumber'),
      );

      await provider.destroy();
    });

    test('treats a null l1BlockNumber like a missing one and falls back in regtest', async () => {
      const { provider, logger } = buildProvider(
        {
          number: '0x7d0',
          l1BlockNumber: null,
        } as never,
        true,
      );

      await expect(provider['getLatestBlock']()).resolves.toEqual({
        number: 2_000,
        l1BlockNumber: undefined,
      });
      expect(logger.error).not.toHaveBeenCalled();

      await provider.destroy();
    });

    test('does not log an error when l1BlockNumber is present outside regtest', async () => {
      const { provider, logger } = buildProvider(hexBlock(2_000, 123));

      await provider['getLatestBlock']();
      expect(logger.error).not.toHaveBeenCalled();

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
      const { provider, l2 } = buildProvider(hexBlock(2_000, 123));

      const listener = jest.fn();
      await provider.onBlock(listener);

      await jest.advanceTimersByTimeAsync(0);

      expect(listener).toHaveBeenCalledWith({
        number: 2_000,
        l1BlockNumber: 123,
      });
      expect(l2.send).toHaveBeenCalledTimes(1);

      await provider.destroy();
    });

    test('delivers a decimal l1BlockNumber through the poller without misparsing it', async () => {
      const { provider } = buildProvider({
        number: '0x1bc07ff8',
        l1BlockNumber: 465_600_504,
      } as never);

      const listener = jest.fn();
      await provider.onBlock(listener);

      await jest.advanceTimersByTimeAsync(0);

      expect(listener).toHaveBeenCalledWith({
        number: 465_600_504,
        l1BlockNumber: 465_600_504,
      });

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

  describe('init', () => {
    let superInit: jest.SpyInstance;

    beforeEach(() => {
      superInit = jest
        .spyOn(InjectedProvider.prototype, 'init')
        .mockResolvedValue(undefined);
    });

    afterEach(() => {
      superInit.mockRestore();
    });

    test('fails startup when the RPC does not report l1BlockNumber outside regtest', async () => {
      const { provider } = buildProvider(hexBlock(2_000));

      await expect(provider.init()).rejects.toThrow(/l1BlockNumber/);
      expect(superInit).toHaveBeenCalledTimes(1);

      await provider.destroy();
    });

    test('succeeds when the RPC reports l1BlockNumber', async () => {
      const { provider, l2 } = buildProvider(hexBlock(2_000, 123));

      await expect(provider.init()).resolves.toBeUndefined();
      expect(l2.send).toHaveBeenCalledWith('eth_getBlockByNumber', [
        'latest',
        false,
      ]);

      await provider.destroy();
    });

    test('succeeds in regtest when l1BlockNumber is missing', async () => {
      const { provider } = buildProvider(hexBlock(2_000), true);

      await expect(provider.init()).resolves.toBeUndefined();

      await provider.destroy();
    });
  });

  describe('getLocktimeHeight', () => {
    test('returns the Arbitrum block l1BlockNumber, not the L2 number', async () => {
      const { provider, l2 } = buildProvider(hexBlock(2_000, 123));

      await expect(provider.getLocktimeHeight()).resolves.toEqual(123);
      expect(l2.send).toHaveBeenCalledWith('eth_getBlockByNumber', [
        'latest',
        false,
      ]);

      await provider.destroy();
    });

    test('falls back to the L2 block number when l1BlockNumber is absent in regtest', async () => {
      const { provider } = buildProvider(hexBlock(2_000), true);

      await expect(provider.getLocktimeHeight()).resolves.toEqual(2_000);

      await provider.destroy();
    });

    test('throws (and logs) outside regtest when l1BlockNumber is absent', async () => {
      const { provider, logger } = buildProvider(hexBlock(2_000));

      await expect(provider.getLocktimeHeight()).rejects.toThrow(
        /l1BlockNumber/,
      );
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('l1BlockNumber'),
      );

      await provider.destroy();
    });

    test('matches getLatestBlock, the height expiry is judged against', async () => {
      const { provider } = buildProvider(hexBlock(2_000, 123));

      const block = await provider['getLatestBlock']();
      await expect(provider.getLocktimeHeight()).resolves.toEqual(
        block.l1BlockNumber ?? block.number,
      );

      await provider.destroy();
    });
  });

  describe('destroy', () => {
    test('tears down the provider', async () => {
      const { provider, l2 } = buildProvider(hexBlock(2_000, 123));

      await provider.destroy();

      expect(l2.destroy).toHaveBeenCalledTimes(1);
    });
  });
});
