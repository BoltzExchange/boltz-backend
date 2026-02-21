import type Logger from '../../../../lib/Logger';
import ConsolidatedEventHandler from '../../../../lib/wallet/ethereum/ConsolidatedEventHandler';
import type { Events } from '../../../../lib/wallet/ethereum/contracts/ContractEventHandler';
import type ContractEventHandler from '../../../../lib/wallet/ethereum/contracts/ContractEventHandler';

describe('ConsolidatedEventHandler', () => {
  type EventName = keyof Events;
  type BlockListener = (block: {
    number: number;
    l1BlockNumber?: number;
  }) => void;

  const flushAsync = async () => {
    await new Promise<void>((resolve) => {
      setImmediate(() => resolve());
    });
  };

  const createProvider = (latestBlock = 100) => {
    let onBlockListener: BlockListener | undefined;
    const provider = {
      getBlockNumber: jest.fn().mockResolvedValue(latestBlock),
      getTransactionReceipt: jest.fn().mockResolvedValue(null),
      onBlock: jest.fn().mockImplementation(async (listener: BlockListener) => {
        onBlockListener = listener;
        return provider;
      }),
    };

    return {
      provider,
      emitBlock: async (number: number) => {
        onBlockListener?.({ number });
        await flushAsync();
      },
    };
  };

  const createContractEventHandler = () => {
    const emitters: Partial<Record<EventName, (payload: any) => void>> = {};
    const handler = {
      destroy: jest.fn(),
      rescan: jest.fn(),
      checkTransaction: jest.fn(),
      on: jest.fn().mockImplementation((event: EventName, callback: any) => {
        emitters[event] = callback;
      }),
    } as unknown as ContractEventHandler;

    return {
      emitters,
      handler,
      destroy: (handler as any).destroy as jest.Mock,
      rescan: (handler as any).rescan as jest.Mock,
      checkTransaction: (handler as any).checkTransaction as jest.Mock,
      on: (handler as any).on as jest.Mock,
    };
  };

  const ethLockup = (hash: string, blockNumber: number): Events['eth.lockup'] =>
    ({
      version: 4n,
      transaction: {
        hash,
        blockNumber,
      },
      etherSwapValues: {} as any,
    }) as Events['eth.lockup'];

  const ethLockupWithoutBlock = (hash: string): Events['eth.lockup'] =>
    ({
      version: 4n,
      transaction: {
        hash,
      },
      etherSwapValues: {} as any,
    }) as Events['eth.lockup'];

  const ethLockupNullHash = (): Events['eth.lockup'] =>
    ({
      version: 4n,
      transaction: {
        hash: null,
      },
      etherSwapValues: {} as any,
    }) as Events['eth.lockup'];

  const erc20Lockup = (
    hash: string,
    blockNumber: number,
  ): Events['erc20.lockup'] =>
    ({
      version: 4n,
      transaction: {
        hash,
        blockNumber,
      },
      erc20SwapValues: {} as any,
    }) as Events['erc20.lockup'];

  const erc20LockupNullHash = (): Events['erc20.lockup'] =>
    ({
      version: 4n,
      transaction: {
        hash: null,
      },
      erc20SwapValues: {} as any,
    }) as Events['erc20.lockup'];

  const ethClaim = (hash: string): Events['eth.claim'] => ({
    version: 4n,
    transactionHash: hash,
    preimageHash: Buffer.alloc(32),
    preimage: Buffer.alloc(32),
  });

  const erc20Claim = (hash: string): Events['erc20.claim'] => ({
    version: 4n,
    transactionHash: hash,
    preimageHash: Buffer.alloc(32),
    preimage: Buffer.alloc(32),
  });

  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const mockNetworkDetails = {
    name: 'Ethereum',
  } as any;

  const createConsolidated = (provider: any, confirmations: number) =>
    new ConsolidatedEventHandler(
      mockLogger,
      mockNetworkDetails,
      provider,
      confirmations,
    );

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('confirmations configuration', () => {
    test('forwards immediately when required confirmations is 1', async () => {
      const { provider } = createProvider();
      const v3 = createContractEventHandler();
      const v4 = createContractEventHandler();
      const consolidated = createConsolidated(provider, 1);
      consolidated.register(v3.handler);
      consolidated.register(v4.handler);

      const emitted: string[] = [];
      consolidated.on('eth.lockup', ({ transaction }) => {
        emitted.push(transaction.hash!);
      });

      v3.emitters['eth.lockup']!(ethLockup('0xv3', 10));
      v4.emitters['eth.lockup']!(ethLockup('0xv4', 11));

      expect(emitted).toEqual(['0xv3', '0xv4']);
      expect(provider.onBlock).toHaveBeenCalledTimes(1);
    });

    test.each([0, -1, -100])(
      'uses default of 1 confirmation for invalid value %d',
      (value) => {
        const { provider } = createProvider();
        const v3 = createContractEventHandler();
        const consolidated = createConsolidated(provider, value);
        consolidated.register(v3.handler);

        const emitted: string[] = [];
        consolidated.on('eth.lockup', ({ transaction }) => {
          emitted.push(transaction.hash!);
        });

        v3.emitters['eth.lockup']!(ethLockup('0ximmediate', 10));

        expect(emitted).toEqual(['0ximmediate']);
      },
    );

    test('rounds up fractional confirmations', async () => {
      const { provider, emitBlock } = createProvider(100);
      provider.getTransactionReceipt.mockResolvedValue({
        blockNumber: 100,
      });

      const v3 = createContractEventHandler();
      const consolidated = createConsolidated(provider, 1.5);
      consolidated.register(v3.handler);
      await flushAsync();

      const emitted = jest.fn();
      consolidated.on('eth.lockup', emitted);

      v3.emitters['eth.lockup']!(ethLockup('0xfractional', 100));
      await flushAsync();

      expect(emitted).not.toHaveBeenCalled();

      await emitBlock(101);
      expect(emitted).toHaveBeenCalledTimes(1);
    });
  });

  describe('event forwarding', () => {
    test('forwards claim events immediately even when confirmations are greater than 1', async () => {
      const { provider, emitBlock } = createProvider(100);
      const v3 = createContractEventHandler();
      const consolidated = createConsolidated(provider, 2);
      consolidated.register(v3.handler);
      await flushAsync();

      const emitted = jest.fn();
      consolidated.on('eth.claim', emitted);

      v3.emitters['eth.claim']!(ethClaim('0xclaim'));
      await flushAsync();

      expect(emitted).toHaveBeenCalledTimes(1);
      expect(provider.getTransactionReceipt).not.toHaveBeenCalled();
      await emitBlock(101);
      expect(emitted).toHaveBeenCalledTimes(1);
    });

    test('forwards erc20.claim events immediately', async () => {
      const { provider } = createProvider(100);
      const v3 = createContractEventHandler();
      const consolidated = createConsolidated(provider, 3);
      consolidated.register(v3.handler);
      await flushAsync();

      const emitted = jest.fn();
      consolidated.on('erc20.claim', emitted);

      v3.emitters['erc20.claim']!(erc20Claim('0xerc20claim'));
      await flushAsync();

      expect(emitted).toHaveBeenCalledTimes(1);
      expect(provider.getTransactionReceipt).not.toHaveBeenCalled();
    });
  });

  describe('event classification', () => {
    test('drops eth.lockup event with null transaction hash', async () => {
      const { provider, emitBlock } = createProvider(100);
      const v3 = createContractEventHandler();
      const consolidated = createConsolidated(provider, 2);
      consolidated.register(v3.handler);
      await flushAsync();

      const emitted = jest.fn();
      consolidated.on('eth.lockup', emitted);

      v3.emitters['eth.lockup']!(ethLockupNullHash());
      await flushAsync();
      await emitBlock(101);

      expect(emitted).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('dropping eth.lockup event'),
      );
    });

    test('drops erc20.lockup event with null transaction hash', async () => {
      const { provider, emitBlock } = createProvider(100);
      const v3 = createContractEventHandler();
      const consolidated = createConsolidated(provider, 2);
      consolidated.register(v3.handler);
      await flushAsync();

      const emitted = jest.fn();
      consolidated.on('erc20.lockup', emitted);

      v3.emitters['erc20.lockup']!(erc20LockupNullHash());
      await flushAsync();
      await emitBlock(101);

      expect(emitted).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('dropping erc20.lockup event'),
      );
    });
  });

  describe('pending event processing', () => {
    test('waits for additional blocks when confirmations are greater than 1', async () => {
      const { provider, emitBlock } = createProvider(100);
      provider.getTransactionReceipt.mockResolvedValue({
        blockNumber: 100,
      });
      const v3 = createContractEventHandler();
      const consolidated = createConsolidated(provider, 3);
      consolidated.register(v3.handler);

      await flushAsync();

      const emitted = jest.fn();
      consolidated.on('eth.lockup', emitted);

      v3.emitters['eth.lockup']!(ethLockup('0xlockup', 100));
      await flushAsync();

      expect(emitted).not.toHaveBeenCalled();

      await emitBlock(101);
      expect(emitted).not.toHaveBeenCalled();

      await emitBlock(102);
      expect(emitted).toHaveBeenCalledTimes(1);
      expect(provider.getTransactionReceipt).toHaveBeenCalledWith('0xlockup');
    });

    test('uses transaction receipt lookup for lockup events without block number', async () => {
      const { provider, emitBlock } = createProvider(100);
      provider.getTransactionReceipt.mockResolvedValue({
        blockNumber: 100,
      });

      const v3 = createContractEventHandler();
      const consolidated = createConsolidated(provider, 2);
      consolidated.register(v3.handler);
      await flushAsync();

      const emitted = jest.fn();
      consolidated.on('eth.lockup', emitted);

      v3.emitters['eth.lockup']!(ethLockupWithoutBlock('0xlookup-lockup'));
      await flushAsync();

      expect(emitted).not.toHaveBeenCalled();
      expect(provider.getTransactionReceipt).not.toHaveBeenCalled();

      await emitBlock(101);
      expect(provider.getTransactionReceipt).toHaveBeenCalledWith(
        '0xlookup-lockup',
      );
      expect(emitted).toHaveBeenCalledTimes(1);
    });

    test('defers lockup forwarding until receipt exists and target block is reached', async () => {
      const { provider, emitBlock } = createProvider(104);
      provider.getTransactionReceipt
        .mockResolvedValueOnce(null)
        .mockResolvedValue({
          blockNumber: 105,
        });

      const v3 = createContractEventHandler();
      const consolidated = createConsolidated(provider, 2);
      consolidated.register(v3.handler);
      await flushAsync();

      const emitted = jest.fn();
      consolidated.on('eth.lockup', emitted);

      v3.emitters['eth.lockup']!(ethLockupWithoutBlock('0xdeferred-lockup'));
      await flushAsync();

      expect(emitted).not.toHaveBeenCalled();

      await emitBlock(105);
      expect(emitted).not.toHaveBeenCalled();

      await emitBlock(106);
      expect(emitted).toHaveBeenCalledTimes(1);
    });

    test('does not emit the same queued lockup event multiple times', async () => {
      const { provider, emitBlock } = createProvider(100);
      provider.getTransactionReceipt.mockResolvedValue({
        blockNumber: 100,
      });

      const v3 = createContractEventHandler();
      const consolidated = createConsolidated(provider, 2);
      consolidated.register(v3.handler);
      await flushAsync();

      const emitted = jest.fn();
      consolidated.on('eth.lockup', emitted);

      v3.emitters['eth.lockup']!(ethLockupWithoutBlock('0xlockup-once'));
      await flushAsync();
      await emitBlock(101);
      await emitBlock(102);

      expect(emitted).toHaveBeenCalledTimes(1);
    });

    test('queues and confirms erc20.lockup events', async () => {
      const { provider, emitBlock } = createProvider(100);
      provider.getTransactionReceipt.mockResolvedValue({
        blockNumber: 100,
      });

      const v3 = createContractEventHandler();
      const consolidated = createConsolidated(provider, 2);
      consolidated.register(v3.handler);
      await flushAsync();

      const emitted = jest.fn();
      consolidated.on('erc20.lockup', emitted);

      v3.emitters['erc20.lockup']!(erc20Lockup('0xerc20', 100));
      await flushAsync();

      expect(emitted).not.toHaveBeenCalled();

      await emitBlock(101);
      expect(emitted).toHaveBeenCalledTimes(1);
    });

    test('retains pending event when getTransactionReceipt throws', async () => {
      const { provider, emitBlock } = createProvider(100);
      provider.getTransactionReceipt
        .mockRejectedValueOnce(new Error('RPC error'))
        .mockResolvedValue({ blockNumber: 100 });

      const v3 = createContractEventHandler();
      const consolidated = createConsolidated(provider, 2);
      consolidated.register(v3.handler);
      await flushAsync();

      const emitted = jest.fn();
      consolidated.on('eth.lockup', emitted);

      v3.emitters['eth.lockup']!(ethLockup('0xretry', 100));
      await flushAsync();

      await emitBlock(100);
      expect(emitted).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          'failed to get transaction receipt for 0xretry',
        ),
      );

      await emitBlock(101);
      expect(emitted).toHaveBeenCalledTimes(1);
    });

    test('drops pending event after 1 hour without receipt', async () => {
      const { provider, emitBlock } = createProvider(100);
      provider.getTransactionReceipt.mockResolvedValue(null);

      const v3 = createContractEventHandler();
      const consolidated = createConsolidated(provider, 2);
      consolidated.register(v3.handler);
      await flushAsync();

      const emitted = jest.fn();
      consolidated.on('eth.lockup', emitted);

      const realDateNow = Date.now;
      const baseTime = realDateNow.call(Date);
      let currentTime = baseTime;
      jest.spyOn(Date, 'now').mockImplementation(() => currentTime);

      v3.emitters['eth.lockup']!(ethLockup('0xexpired', 100));
      await flushAsync();

      await emitBlock(101);
      expect(emitted).not.toHaveBeenCalled();
      expect(mockLogger.warn).not.toHaveBeenCalledWith(
        expect.stringContaining('dropping pending event'),
      );

      currentTime = baseTime + 60 * 60 * 1000 + 1;
      await emitBlock(102);

      expect(emitted).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          'dropping pending event for 0xexpired after 1 hour without receipt',
        ),
      );

      jest.spyOn(Date, 'now').mockRestore();
    });

    test('confirms some events while retaining others in the same flush', async () => {
      const { provider, emitBlock } = createProvider(100);
      provider.getTransactionReceipt.mockImplementation(
        async (hash: string) => {
          if (hash === '0xconfirmed') return { blockNumber: 100 };
          return null;
        },
      );

      const v3 = createContractEventHandler();
      const consolidated = createConsolidated(provider, 2);
      consolidated.register(v3.handler);
      await flushAsync();

      const ethEmitted = jest.fn();
      consolidated.on('eth.lockup', ethEmitted);

      v3.emitters['eth.lockup']!(ethLockup('0xconfirmed', 100));
      v3.emitters['eth.lockup']!(ethLockup('0xpending', 100));
      await flushAsync();

      await emitBlock(101);
      expect(ethEmitted).toHaveBeenCalledTimes(1);
      expect(ethEmitted).toHaveBeenCalledWith(
        expect.objectContaining({
          transaction: expect.objectContaining({ hash: '0xconfirmed' }),
        }),
      );

      provider.getTransactionReceipt.mockResolvedValue({ blockNumber: 101 });
      await emitBlock(102);
      expect(ethEmitted).toHaveBeenCalledTimes(2);
      expect(ethEmitted).toHaveBeenCalledWith(
        expect.objectContaining({
          transaction: expect.objectContaining({ hash: '0xpending' }),
        }),
      );
    });
  });

  describe('rescan', () => {
    test('rescans all event handlers', async () => {
      const { provider } = createProvider();
      const v3 = createContractEventHandler();
      const v4 = createContractEventHandler();
      const consolidated = createConsolidated(provider, 1);
      consolidated.register(v3.handler);
      consolidated.register(v4.handler);

      await consolidated.rescan(21);

      expect(v3.rescan).toHaveBeenCalledWith(19);
      expect(v4.rescan).toHaveBeenCalledWith(19);
    });

    test('clamps start height to 0', async () => {
      const { provider } = createProvider();
      const v3 = createContractEventHandler();
      const consolidated = createConsolidated(provider, 10);
      consolidated.register(v3.handler);

      await consolidated.rescan(5);

      expect(v3.rescan).toHaveBeenCalledWith(0);
    });
  });

  describe('checkTransaction', () => {
    test('checks transactions on all event handlers', async () => {
      const { provider } = createProvider();
      const v3 = createContractEventHandler();
      const v4 = createContractEventHandler();
      const consolidated = createConsolidated(provider, 1);
      consolidated.register(v3.handler);
      consolidated.register(v4.handler);

      await consolidated.checkTransaction('0xtesttxid');

      expect(v3.checkTransaction).toHaveBeenCalledWith('0xtesttxid');
      expect(v4.checkTransaction).toHaveBeenCalledWith('0xtesttxid');
    });
  });

  describe('destroy', () => {
    test('destroys all underlying handlers', () => {
      const { provider } = createProvider();
      const v3 = createContractEventHandler();
      const v4 = createContractEventHandler();
      const consolidated = createConsolidated(provider, 1);
      consolidated.register(v3.handler);
      consolidated.register(v4.handler);

      consolidated.destroy();

      expect(v3.destroy).toHaveBeenCalledTimes(1);
      expect(v4.destroy).toHaveBeenCalledTimes(1);
    });

    test('ignores events after destroy', async () => {
      const { provider, emitBlock } = createProvider(100);
      const v3 = createContractEventHandler();
      const consolidated = createConsolidated(provider, 2);
      consolidated.register(v3.handler);
      await flushAsync();

      const emitted = jest.fn();
      consolidated.on('eth.lockup', emitted);

      consolidated.destroy();

      v3.emitters['eth.lockup']!(ethLockup('0xpost-destroy', 100));
      await flushAsync();
      await emitBlock(101);

      expect(emitted).not.toHaveBeenCalled();
    });

    test('does not flush pending events after destroy', async () => {
      const { provider, emitBlock } = createProvider(100);
      provider.getTransactionReceipt.mockResolvedValue({
        blockNumber: 100,
      });

      const v3 = createContractEventHandler();
      const consolidated = createConsolidated(provider, 2);
      consolidated.register(v3.handler);
      await flushAsync();

      const emitted = jest.fn();
      consolidated.on('eth.lockup', emitted);

      v3.emitters['eth.lockup']!(ethLockup('0xqueued', 100));
      await flushAsync();

      consolidated.destroy();

      await emitBlock(101);
      expect(emitted).not.toHaveBeenCalled();
      expect(provider.getTransactionReceipt).not.toHaveBeenCalled();
    });
  });
});
