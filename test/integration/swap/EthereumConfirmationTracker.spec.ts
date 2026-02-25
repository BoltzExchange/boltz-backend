import Logger from '../../../lib/Logger';
import { SwapUpdateEvent } from '../../../lib/consts/Enums';
import Database from '../../../lib/db/Database';
import ChainSwap from '../../../lib/db/models/ChainSwap';
import ChainSwapData from '../../../lib/db/models/ChainSwapData';
import Pair from '../../../lib/db/models/Pair';
import ReverseSwap from '../../../lib/db/models/ReverseSwap';
import ChainSwapRepository from '../../../lib/db/repositories/ChainSwapRepository';
import type { ChainSwapInfo } from '../../../lib/db/repositories/ChainSwapRepository';
import EthereumConfirmationTracker from '../../../lib/swap/EthereumConfirmationTracker';
import { networks } from '../../../lib/wallet/ethereum/EvmNetworks';
import {
  createChainSwap,
  createReverseSwap,
} from '../db/repositories/Fixtures';
import type { EthereumSetup } from '../wallet/EthereumTools';
import {
  fundSignerWallet,
  getContracts,
  getSigner,
} from '../wallet/EthereumTools';

jest.mock('../../../lib/ExitHandler', () => ({
  shutdownSignal: { aborted: false },
}));
const mockedExitHandler = jest.requireMock('../../../lib/ExitHandler') as {
  shutdownSignal: { aborted: boolean };
};

describe('EthereumConfirmationTracker', () => {
  let db: Database;
  let setup: EthereumSetup;
  let tracker: EthereumConfirmationTracker;

  beforeAll(async () => {
    setup = await getSigner();
    await fundSignerWallet(setup.signer, setup.etherBase);

    db = new Database(Logger.disabledLogger, Database.memoryDatabase);
    await db.init();
    await Pair.create({
      quote: 'BTC',
      base: 'L-BTC',
      id: 'L-BTC/BTC',
    });
  });

  beforeEach(async () => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    mockedExitHandler.shutdownSignal.aborted = false;

    await ReverseSwap.destroy({
      truncate: true,
    });
    await ChainSwapData.destroy({
      truncate: true,
    });
    await ChainSwap.destroy({
      truncate: true,
    });

    tracker = new EthereumConfirmationTracker(
      Logger.disabledLogger,
      networks.Ethereum,
      setup.provider,
    );
  });

  afterAll(async () => {
    await db.close();
    await setup.provider.destroy();
  });

  test('should confirm reverse swap transactions', async () => {
    const swap = await createReverseSwap(SwapUpdateEvent.TransactionMempool);
    const tx = await setup.signer.sendTransaction({
      to: await setup.signer.getAddress(),
    });
    await tx.wait(1);

    const emitPromise = new Promise<{
      swap: ReverseSwap | ChainSwapInfo;
      transactionHash: string;
    }>((resolve) => {
      tracker.once('confirmed', resolve);
    });

    tracker.trackTransaction(swap, tx.hash);
    await tracker.scanPendingTransactions();

    const emitted = await emitPromise;
    expect(emitted.transactionHash).toEqual(tx.hash);
    expect(emitted.swap.status).toEqual(SwapUpdateEvent.TransactionConfirmed);

    await swap.reload();
    expect(swap.status).toEqual(SwapUpdateEvent.TransactionConfirmed);
  });

  test('should confirm chain swap transactions', async () => {
    const created = await createChainSwap(
      SwapUpdateEvent.TransactionServerMempool,
    );
    const swap = (await ChainSwapRepository.getChainSwap({
      id: created.chainSwap.id,
    }))!;
    const tx = await setup.signer.sendTransaction({
      to: await setup.signer.getAddress(),
    });
    await tx.wait(1);

    const emitPromise = new Promise<{
      swap: ReverseSwap | ChainSwapInfo;
      transactionHash: string;
    }>((resolve) => {
      tracker.once('confirmed', resolve);
    });

    tracker.trackTransaction(swap, tx.hash);
    await tracker.scanPendingTransactions();

    const emitted = await emitPromise;
    expect(emitted.transactionHash).toEqual(tx.hash);
    expect(emitted.swap.status).toEqual(
      SwapUpdateEvent.TransactionServerConfirmed,
    );

    const updated = (await ChainSwapRepository.getChainSwap({
      id: created.chainSwap.id,
    }))!;
    expect(updated.status).toEqual(SwapUpdateEvent.TransactionServerConfirmed);
  });

  test('should fail tracked transactions when receipt status is not success', async () => {
    const swap = await createReverseSwap(SwapUpdateEvent.TransactionMempool);
    const contracts = await getContracts(setup.signer);
    const failedTx = await setup.signer.sendTransaction({
      to: await contracts.etherSwap.getAddress(),
      value: 1n,
      gasLimit: 100_000n,
    });
    await setup.provider.waitForTransaction(failedTx.hash, 1);

    const emitPromise = new Promise<{
      swap: ReverseSwap | ChainSwapInfo;
      reason: string;
    }>((resolve) => {
      tracker.once('failedToSend', resolve);
    });

    tracker.trackTransaction(swap, failedTx.hash);
    await tracker.scanPendingTransactions();

    const emitted = await emitPromise;
    expect(emitted.reason).toContain(failedTx.hash);
    expect(emitted.reason).toContain('failed: 0');
    expect(emitted.swap.status).toEqual(SwapUpdateEvent.TransactionFailed);

    await swap.reload();
    expect(swap.status).toEqual(SwapUpdateEvent.TransactionFailed);
  });

  test('should skip transaction scans when shutdown is in progress', async () => {
    const swap = await createReverseSwap(SwapUpdateEvent.TransactionMempool);
    const getReceiptSpy = jest.spyOn(setup.provider, 'getTransactionReceipt');
    mockedExitHandler.shutdownSignal.aborted = true;

    tracker.trackTransaction(
      swap,
      '0x0000000000000000000000000000000000000000000000000000000000000001',
    );
    await tracker.scanPendingTransactions();

    expect(getReceiptSpy).not.toHaveBeenCalled();
    await swap.reload();
    expect(swap.status).toEqual(SwapUpdateEvent.TransactionMempool);
  });
});
