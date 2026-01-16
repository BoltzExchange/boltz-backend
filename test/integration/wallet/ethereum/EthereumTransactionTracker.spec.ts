import Logger from '../../../../lib/Logger';
import PendingEthereumTransactionRepository from '../../../../lib/db/repositories/PendingEthereumTransactionRepository';
import EthereumTransactionTracker from '../../../../lib/wallet/ethereum/EthereumTransactionTracker';
import { networks } from '../../../../lib/wallet/ethereum/EvmNetworks';
import type { EthereumSetup } from '../EthereumTools';
import { fundSignerWallet, getSigner } from '../EthereumTools';

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
  let transactionTracker: EthereumTransactionTracker;

  beforeAll(async () => {
    setup = await getSigner();
    transactionTracker = new EthereumTransactionTracker(
      Logger.disabledLogger,
      networks.Ethereum,
      setup.provider,
      setup.signer,
    );
    await fundSignerWallet(setup.signer, setup.etherBase);

    PendingEthereumTransactionRepository.getTransactions = mockGetTransactions;
    PendingEthereumTransactionRepository.addTransaction = mockAddTransaction;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should init', async () => {
    const realScanBlock = transactionTracker.scanPendingTransactions;
    transactionTracker.scanPendingTransactions = jest.fn().mockImplementation();

    await transactionTracker.init();

    expect(transactionTracker.scanPendingTransactions).toHaveBeenCalledTimes(1);

    transactionTracker.scanPendingTransactions = realScanBlock;
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

  afterAll(async () => {
    await setup.provider.destroy();
  });
});
