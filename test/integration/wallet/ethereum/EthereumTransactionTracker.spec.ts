import Logger from '../../../../lib/Logger';
import { fundSignerWallet, getSigner } from '../EthereumTools';
import EthereumTransactionTracker from '../../../../lib/wallet/ethereum/EthereumTransactionTracker';

const mockAddTransaction = jest.fn().mockImplementation(async () => {});

const mockFindByNonceResult = [{
  destroy: jest.fn().mockImplementation(async () => {}),
}];
const mockFindByNonce = jest.fn().mockImplementation(async () => {
  return mockFindByNonceResult;
});

jest.mock('../../../../lib/db/PendingEthereumTransactionRepository', () => {
  return jest.fn().mockImplementation(() => ({
    findByNonce: mockFindByNonce,
    addTransaction: mockAddTransaction,
  }));
});

describe('EthereumTransactionTracker', () => {
  const { etherBase, provider, signer } = getSigner();

  const transactionTracker = new EthereumTransactionTracker(
    Logger.disabledLogger,
    provider,
    signer,
  );

  beforeAll(async () => {
    await fundSignerWallet(signer, etherBase);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should init', async () => {
    const realScanBlock = transactionTracker.scanBlock;
    transactionTracker.scanBlock = jest.fn().mockImplementation();

    await transactionTracker.init();

    expect(transactionTracker.scanBlock).toHaveBeenCalledTimes(1);
    expect(transactionTracker.scanBlock).toHaveBeenCalledWith(await provider.getBlockNumber());

    expect(transactionTracker['walletAddress']).toEqual((await signer.getAddress()).toLowerCase());

    transactionTracker.scanBlock = realScanBlock;
  });

  test('should scan new blocks', async () => {
    const transaction = await signer.sendTransaction({
      to: await signer.getAddress(),
    });
    const transactionReceipt = await transaction.wait(1);

    await transactionTracker.scanBlock(transactionReceipt.blockNumber);

    expect(mockFindByNonce).toHaveBeenCalledTimes(1);
    expect(mockFindByNonce).toHaveBeenCalledWith(transaction.nonce);

    expect(mockFindByNonceResult[0].destroy).toHaveBeenCalledTimes(1);
  });

  afterAll(async () => {
    await provider.destroy();
  });
});
