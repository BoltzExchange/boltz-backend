import type { EthereumConfig } from '../../../../lib/Config';
import Logger from '../../../../lib/Logger';
import OverpaymentProtector from '../../../../lib/swap/OverpaymentProtector';
import EthereumManager from '../../../../lib/wallet/ethereum/EthereumManager';
import { networks } from '../../../../lib/wallet/ethereum/EvmNetworks';

jest.mock('../../../../lib/wallet/ethereum/InjectedProvider', () => {
  return jest.fn().mockImplementation(() => ({
    init: jest.fn().mockResolvedValue(undefined),
    destroy: jest.fn().mockResolvedValue(undefined),
    removeAllListeners: jest.fn().mockResolvedValue(undefined),
    onBlock: jest.fn().mockResolvedValue(undefined),
    onReconnect: jest.fn(),
    on: jest.fn().mockResolvedValue(undefined),
    getNetwork: jest.fn().mockResolvedValue({ chainId: 1n, name: 'mainnet' }),
    getBlockNumber: jest.fn().mockResolvedValue(0),
  }));
});

jest.mock('../../../../lib/wallet/ethereum/contracts/Contracts', () => {
  return jest.fn().mockImplementation(() => ({
    init: jest.fn().mockResolvedValue(undefined),
    version: 6n,
    features: new Set(),
    contractEventHandler: {
      checkMissedEvents: jest.fn().mockResolvedValue(undefined),
    },
    etherSwap: {
      getAddress: jest.fn().mockResolvedValue('0xA'),
    },
    erc20Swap: {
      getAddress: jest.fn().mockResolvedValue('0xB'),
    },
  }));
});

jest.mock('../../../../lib/wallet/ethereum/EthereumTransactionTracker', () => {
  return jest.fn().mockImplementation(() => ({
    init: jest.fn().mockResolvedValue(undefined),
    scanPendingTransactions: jest.fn().mockResolvedValue(undefined),
  }));
});

jest.mock('../../../../lib/wallet/ethereum/ConsolidatedEventHandler', () => {
  return jest.fn().mockImplementation(() => ({
    destroy: jest.fn(),
  }));
});

jest.mock('../../../../lib/wallet/ethereum/contracts/Commitments', () => {
  return jest.fn().mockImplementation(() => ({
    init: jest.fn(),
  }));
});

jest.mock('../../../../lib/db/repositories/ChainTipRepository', () => ({
  findOrCreateTip: jest.fn().mockResolvedValue({}),
  updateTip: jest.fn().mockResolvedValue(undefined),
}));

jest.mock(
  '../../../../lib/db/repositories/PendingEthereumTransactionRepository',
  () => ({
    addTransaction: jest.fn().mockResolvedValue(null),
    getHighestNonce: jest.fn().mockResolvedValue(undefined),
  }),
);

describe('EthereumManager WebSocket reconnect wiring', () => {
  const mnemonic =
    'test test test test test test test test test test test junk';

  const overpaymentProtector = new OverpaymentProtector(Logger.disabledLogger);

  const createConfig = (): EthereumConfig => ({
    providerEndpoint: 'http://127.0.0.1:0',
    requiredConfirmations: 1,
    contracts: [
      {
        etherSwap: '0xA',
        erc20Swap: '0xB',
      },
    ],
    tokens: [
      {
        symbol: networks.Ethereum.symbol,
        minWalletBalance: 100_000,
      },
    ],
  });

  const buildAndInit = async () => {
    const manager = new EthereumManager(
      Logger.disabledLogger,
      networks.Ethereum,
      createConfig(),
      overpaymentProtector,
    );
    await manager.init(mnemonic);
    return manager;
  };

  test('registers an onReconnect handler during init', async () => {
    const manager = await buildAndInit();

    const onReconnect = (manager['provider'] as any).onReconnect as jest.Mock;
    expect(onReconnect).toHaveBeenCalledTimes(1);
    expect(typeof onReconnect.mock.calls[0][0]).toBe('function');

    await manager.destroy();
  });

  test('the registered handler triggers a missed-event rescan', async () => {
    const manager = await buildAndInit();

    const onReconnect = (manager['provider'] as any).onReconnect as jest.Mock;
    const handler = onReconnect.mock.calls[0][0] as () => void;

    const scheduleSpy = jest.fn();
    (manager as any).scheduleMissedEventChecks = scheduleSpy;

    handler();

    expect(scheduleSpy).toHaveBeenCalledTimes(1);

    await manager.destroy();
  });

  test('each back-to-back reconnect invokes scheduleMissedEventChecks', async () => {
    const manager = await buildAndInit();

    const onReconnect = (manager['provider'] as any).onReconnect as jest.Mock;
    const handler = onReconnect.mock.calls[0][0] as () => void;

    const scheduleSpy = jest.fn();
    (manager as any).scheduleMissedEventChecks = scheduleSpy;

    handler();
    handler();
    handler();

    expect(scheduleSpy).toHaveBeenCalledTimes(3);

    await manager.destroy();
  });

  test('onBlock callback no longer schedules a rescan based on a block gap', async () => {
    const manager = await buildAndInit();

    const onBlock = (manager['provider'] as any).onBlock as jest.Mock;
    expect(onBlock).toHaveBeenCalledTimes(1);

    const blockCallback = onBlock.mock.calls[0][0] as (block: {
      number: number;
    }) => Promise<void>;

    const scheduleSpy = jest.fn();
    (manager as any).scheduleMissedEventChecks = scheduleSpy;

    await blockCallback({ number: 1_000_000 });

    expect(scheduleSpy).not.toHaveBeenCalled();

    await manager.destroy();
  });
});
