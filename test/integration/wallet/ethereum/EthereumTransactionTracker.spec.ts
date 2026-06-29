import Logger from '../../../../lib/Logger';
import PendingEthereumTransactionRepository from '../../../../lib/db/repositories/PendingEthereumTransactionRepository';
import EthereumTransactionTracker from '../../../../lib/wallet/ethereum/EthereumTransactionTracker';
import { networks } from '../../../../lib/wallet/ethereum/EvmNetworks';
import InjectedProvider from '../../../../lib/wallet/ethereum/InjectedProvider';
import type { EthereumSetup } from '../EthereumTools';
import {
  fundSignerWallet,
  getSigner,
  providerEndpoint,
} from '../EthereumTools';

const mockAddTransaction = jest.fn().mockImplementation(async () => {});

const mockGetTransactionsResult: any[] = [
  {
    destroy: jest.fn().mockImplementation(async () => {}),
  },
];
const mockGetTransactions = jest.fn().mockImplementation(async () => {
  return mockGetTransactionsResult;
});

jest.mock(
  '../../../../lib/db/repositories/PendingEthereumTransactionRepository',
);

describe('EthereumTransactionTracker', () => {
  let setup: EthereumSetup;
  let injectedProvider: InjectedProvider;
  let transactionTracker: EthereumTransactionTracker;

  beforeAll(async () => {
    setup = await getSigner();
    injectedProvider = new InjectedProvider(
      Logger.disabledLogger,
      networks.Ethereum,
      {
        providerEndpoint,
      },
    );
    await injectedProvider.init();

    transactionTracker = new EthereumTransactionTracker(
      Logger.disabledLogger,
      networks.Ethereum,
      injectedProvider,
      setup.signer,
    );
    await fundSignerWallet(setup.signer, setup.etherBase);

    PendingEthereumTransactionRepository.getTransactions = mockGetTransactions;
    PendingEthereumTransactionRepository.addTransaction = mockAddTransaction;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await injectedProvider.destroy();
    setup.provider.destroy();
  });

  test('should init', async () => {
    const realScanBlock = transactionTracker.scanPendingTransactions;
    transactionTracker.scanPendingTransactions = jest.fn().mockImplementation();

    await transactionTracker.init();

    expect(transactionTracker.scanPendingTransactions).toHaveBeenCalledTimes(1);

    transactionTracker.scanPendingTransactions = realScanBlock;
  });

  test('should not remove pending transactions', async () => {
    mockGetTransactionsResult[0].hash =
      '0x0000000000000000000000000000000000000000000000000000000000000001';

    await transactionTracker.scanPendingTransactions();

    expect(mockGetTransactions).toHaveBeenCalledTimes(1);
    expect(mockGetTransactionsResult[0].destroy).not.toHaveBeenCalled();
  });

  test('should scan new blocks', async () => {
    const transaction = await setup.signer.sendTransaction({
      to: await setup.signer.getAddress(),
    });
    mockGetTransactionsResult[0].hash = transaction.hash;

    await transaction.wait(1);

    await transactionTracker.scanPendingTransactions();

    expect(mockGetTransactions).toHaveBeenCalledTimes(1);
    expect(mockGetTransactionsResult[0].destroy).toHaveBeenCalledTimes(1);
  });
});
