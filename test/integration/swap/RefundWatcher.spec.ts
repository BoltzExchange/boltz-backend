import EventEmitter from 'events';
import Logger from '../../../lib/Logger';
import ArkClient from '../../../lib/chain/ArkClient';
import { CurrencyType, SwapType } from '../../../lib/consts/Enums';
import type RefundTransaction from '../../../lib/db/models/RefundTransaction';
import { RefundStatus } from '../../../lib/db/models/RefundTransaction';
import type ReverseSwap from '../../../lib/db/models/ReverseSwap';
import type { ChainSwapInfo } from '../../../lib/db/repositories/ChainSwapRepository';
import RefundTransactionRepository from '../../../lib/db/repositories/RefundTransactionRepository';
import type Sidecar from '../../../lib/sidecar/Sidecar';
import RefundWatcher from '../../../lib/swap/RefundWatcher';
import type { Currency } from '../../../lib/wallet/WalletManager';
import { networks } from '../../../lib/wallet/ethereum/EvmNetworks';
import InjectedProvider from '../../../lib/wallet/ethereum/InjectedProvider';
import { bitcoinClient } from '../Nodes';
import {
  fundSignerWallet,
  getSigner,
  providerEndpoint,
} from '../wallet/EthereumTools';

jest.mock('../../../lib/db/repositories/ChainTipRepository');

jest.mock('../../../lib/ExitHandler', () => ({
  shutdownSignal: { aborted: false },
}));
const mockedExitHandler = jest.requireMock('../../../lib/ExitHandler') as {
  shutdownSignal: { aborted: boolean };
};

RefundTransactionRepository.setStatusConfirmedIfPending = jest
  .fn()
  .mockResolvedValue(true);
RefundTransactionRepository.getPendingTransactions = jest
  .fn()
  .mockResolvedValue([]);

describe('RefundWatcher', () => {
  const mockSidecar = new EventEmitter() as any as Sidecar;
  const watcher = new RefundWatcher(Logger.disabledLogger, mockSidecar);
  const btcRefundTxId =
    '0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098';

  let currencies: Map<string, Currency>;
  let setup: Awaited<ReturnType<typeof getSigner>>;
  let evmProvider: InjectedProvider;

  beforeAll(async () => {
    setup = await getSigner();
    await fundSignerWallet(setup.signer, setup.etherBase);
    evmProvider = new InjectedProvider(
      Logger.disabledLogger,
      networks.Ethereum,
      {
        providerEndpoint,
      } as never,
    );
    await evmProvider.init();

    currencies = new Map([
      [
        'BTC',
        {
          symbol: 'BTC',
          chainClient: bitcoinClient,
          type: CurrencyType.BitcoinLike,
        } as unknown as Currency,
      ],
      [
        'RBTC',
        {
          symbol: 'RBTC',
          type: CurrencyType.Ether,
          provider: evmProvider,
        } as unknown as Currency,
      ],
      [
        ArkClient.symbol,
        {
          symbol: ArkClient.symbol,
          type: CurrencyType.Ark,
        } as unknown as Currency,
      ],
    ]);
    watcher.init(currencies);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (
      RefundTransactionRepository.setStatusConfirmedIfPending as jest.Mock
    ).mockResolvedValue(true);
    mockedExitHandler.shutdownSignal.aborted = false;
    bitcoinClient.getRawTransactionVerbose = jest.fn();
    currencies.get('RBTC')!.requiredConfirmations = undefined;
  });

  afterAll(async () => {
    bitcoinClient.disconnect();
    await evmProvider.destroy();
    setup.provider.destroy();
  });

  describe('init', () => {
    afterAll(() => {
      RefundTransactionRepository.getPendingTransactions = jest
        .fn()
        .mockResolvedValue([]);
    });

    test('should check pending transactions on block events', async () => {
      const swapId = '1';
      bitcoinClient.getRawTransactionVerbose = jest.fn().mockResolvedValue({
        confirmations: 1,
      });

      RefundTransactionRepository.getPendingTransactions = jest
        .fn()
        .mockResolvedValue([
          {
            tx: {
              id: btcRefundTxId,
              status: RefundStatus.Pending,
            } as unknown as RefundTransaction,
            swap: {
              id: swapId,
              refundCurrency: 'BTC',
              type: SwapType.ReverseSubmarine,
              serverLockupTransactionId: btcRefundTxId,
            } as unknown as ReverseSwap,
          },
        ]);

      const emitPromise = new Promise<{
        swap: ReverseSwap | ChainSwapInfo;
        refundTransaction: string;
      }>((resolve) => {
        watcher.on('refund.confirmed', (args) => {
          resolve(args);
          watcher.removeAllListeners('refund.confirmed');
        });
      });

      mockSidecar.emit('block', {
        symbol: 'BTC',
        height: 1,
        hash: Buffer.alloc(32),
      });

      const { swap, refundTransaction } = await emitPromise;
      expect(swap.id).toEqual(swapId);
      expect(refundTransaction).toEqual(btcRefundTxId);

      expect(
        RefundTransactionRepository.setStatusConfirmedIfPending,
      ).toHaveBeenCalledWith(swapId);
    });
  });

  describe('checkRefund', () => {
    const checkRefund = watcher['checkRefund'];

    test('should ignore refund with less than required confirmations', async () => {
      bitcoinClient.getRawTransactionVerbose = jest.fn().mockResolvedValue({
        confirmations: 0,
      });

      await checkRefund(
        {
          id: btcRefundTxId,
          status: RefundStatus.Pending,
        } as unknown as RefundTransaction,
        {
          type: SwapType.ReverseSubmarine,
          refundCurrency: 'BTC',
        } as unknown as ReverseSwap,
      );

      expect(
        RefundTransactionRepository.setStatusConfirmedIfPending,
      ).not.toHaveBeenCalled();
    });

    test('should handle confirmed refund transactions', async () => {
      bitcoinClient.getRawTransactionVerbose = jest.fn().mockResolvedValue({
        confirmations: 1,
      });

      const emitPromise = new Promise<{
        swap: ReverseSwap | ChainSwapInfo;
        refundTransaction: string;
      }>((resolve) => {
        watcher.on('refund.confirmed', (args) => {
          resolve(args);
          watcher.removeAllListeners('refund.confirmed');
        });
      });

      const swapId = '1';
      await checkRefund(
        {
          id: btcRefundTxId,
          status: RefundStatus.Pending,
        } as unknown as RefundTransaction,
        {
          id: swapId,
          type: SwapType.ReverseSubmarine,
          refundCurrency: 'BTC',
          serverLockupTransactionId: btcRefundTxId,
        } as unknown as ReverseSwap,
      );

      const { swap, refundTransaction } = await emitPromise;
      expect(swap.id).toEqual(swapId);
      expect(refundTransaction).toEqual(btcRefundTxId);

      expect(
        RefundTransactionRepository.setStatusConfirmedIfPending,
      ).toHaveBeenCalledWith(swapId);
    });

    test('should confirm ARK refunds on the first check', async () => {
      const swapId = 'ark-refund';
      const refundTxId = 'ark-refund-tx';

      const emitPromise = new Promise<{
        swap: ReverseSwap | ChainSwapInfo;
        refundTransaction: string;
      }>((resolve) => {
        watcher.on('refund.confirmed', (args) => {
          resolve(args);
          watcher.removeAllListeners('refund.confirmed');
        });
      });

      await watcher.checkTransaction(
        {
          id: refundTxId,
          status: RefundStatus.Pending,
        } as unknown as RefundTransaction,
        {
          id: swapId,
          type: SwapType.ReverseSubmarine,
          refundCurrency: ArkClient.symbol,
        } as unknown as ReverseSwap,
      );

      await expect(emitPromise).resolves.toMatchObject({
        swap: { id: swapId },
        refundTransaction: refundTxId,
      });
      expect(
        RefundTransactionRepository.setStatusConfirmedIfPending,
      ).toHaveBeenCalledWith(swapId);
      expect(
        RefundTransactionRepository.getPendingTransactions,
      ).not.toHaveBeenCalled();
    });

    test('should not emit confirmation when another check confirmed it first', async () => {
      (
        RefundTransactionRepository.setStatusConfirmedIfPending as jest.Mock
      ).mockResolvedValue(false);
      const confirmedListener = jest.fn();
      watcher.on('refund.confirmed', confirmedListener);

      await watcher.checkTransaction(
        {
          id: 'ark-refund-tx',
          status: RefundStatus.Pending,
        } as unknown as RefundTransaction,
        {
          id: 'ark-refund',
          type: SwapType.ReverseSubmarine,
          refundCurrency: ArkClient.symbol,
        } as unknown as ReverseSwap,
      );

      expect(confirmedListener).not.toHaveBeenCalled();
      watcher.removeListener('refund.confirmed', confirmedListener);
    });

    test('should not wait for an unrelated pending transaction check', async () => {
      const btcSwap = {
        id: 'slow-btc-refund',
        type: SwapType.ReverseSubmarine,
        refundCurrency: 'BTC',
      } as unknown as ReverseSwap;
      RefundTransactionRepository.getPendingTransactions = jest
        .fn()
        .mockResolvedValue([
          {
            tx: {
              id: btcRefundTxId,
              status: RefundStatus.Pending,
            } as unknown as RefundTransaction,
            swap: btcSwap,
          },
        ]);

      let resolveRpcStarted!: () => void;
      const rpcStarted = new Promise<void>((resolve) => {
        resolveRpcStarted = resolve;
      });
      let resolveRpc!: (result: { confirmations: number }) => void;
      bitcoinClient.getRawTransactionVerbose = jest.fn().mockImplementation(
        () =>
          new Promise<{ confirmations: number }>((resolve) => {
            resolveRpc = resolve;
            resolveRpcStarted();
          }),
      );

      const pendingCheck = watcher['checkPendingTransactions']();
      await rpcStarted;

      await watcher.checkTransaction(
        {
          id: 'ark-refund-tx',
          status: RefundStatus.Pending,
        } as unknown as RefundTransaction,
        {
          id: 'ark-refund',
          type: SwapType.ReverseSubmarine,
          refundCurrency: ArkClient.symbol,
        } as unknown as ReverseSwap,
      );

      expect(
        RefundTransactionRepository.setStatusConfirmedIfPending,
      ).toHaveBeenCalledWith('ark-refund');

      resolveRpc({ confirmations: 0 });
      await pendingCheck;
    });

    test('should use configured required confirmations for EVM refunds', async () => {
      currencies.get('RBTC')!.requiredConfirmations = 2;

      const getConfirmationsSpy = jest
        .spyOn(
          watcher as unknown as {
            getConfirmations: (
              currency: Currency,
              txId: string,
            ) => Promise<number>;
          },
          'getConfirmations',
        )
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(2);

      const refundTx = {
        id: 'evm-refund-tx',
        status: RefundStatus.Pending,
      } as unknown as RefundTransaction;
      const swap = {
        id: 'evm-refund',
        type: SwapType.ReverseSubmarine,
        refundCurrency: 'RBTC',
      } as unknown as ReverseSwap;

      await checkRefund(refundTx, swap);

      expect(
        RefundTransactionRepository.setStatusConfirmedIfPending,
      ).not.toHaveBeenCalled();

      const emitPromise = new Promise<{
        swap: ReverseSwap | ChainSwapInfo;
        refundTransaction: string;
      }>((resolve) => {
        watcher.on('refund.confirmed', (confirmedSwap) => {
          resolve(confirmedSwap);
          watcher.removeAllListeners('refund.confirmed');
        });
      });

      await checkRefund(refundTx, swap);

      await expect(emitPromise).resolves.toMatchObject({
        swap: { id: swap.id },
        refundTransaction: refundTx.id,
      });
      expect(
        RefundTransactionRepository.setStatusConfirmedIfPending,
      ).toHaveBeenCalledWith(swap.id);

      getConfirmationsSpy.mockRestore();
    });
  });

  describe('checkTransaction', () => {
    test('should swallow errors when checking a transaction', async () => {
      const errorLogger = jest.spyOn(watcher['logger'], 'error');

      await expect(
        watcher.checkTransaction(
          {
            id: 'unknown-currency-tx',
            status: RefundStatus.Pending,
          } as unknown as RefundTransaction,
          {
            id: 'unknown-currency-swap',
            type: SwapType.ReverseSubmarine,
            refundCurrency: 'NOT_A_CURRENCY',
          } as unknown as ReverseSwap,
        ),
      ).resolves.toBeUndefined();

      expect(errorLogger).toHaveBeenCalledTimes(1);
      expect(
        RefundTransactionRepository.setStatusConfirmedIfPending,
      ).not.toHaveBeenCalled();

      errorLogger.mockRestore();
    });

    test('should keep checking pending transactions when one check fails', async () => {
      const btcSwapId = 'btc-after-failure';
      bitcoinClient.getRawTransactionVerbose = jest.fn().mockResolvedValue({
        confirmations: 1,
      });
      RefundTransactionRepository.getPendingTransactions = jest
        .fn()
        .mockResolvedValue([
          {
            tx: {
              id: 'failing-tx',
              status: RefundStatus.Pending,
            } as unknown as RefundTransaction,
            swap: {
              id: 'failing-swap',
              type: SwapType.ReverseSubmarine,
              refundCurrency: 'NOT_A_CURRENCY',
            } as unknown as ReverseSwap,
          },
          {
            tx: {
              id: btcRefundTxId,
              status: RefundStatus.Pending,
            } as unknown as RefundTransaction,
            swap: {
              id: btcSwapId,
              type: SwapType.ReverseSubmarine,
              refundCurrency: 'BTC',
            } as unknown as ReverseSwap,
          },
        ]);

      await watcher['checkPendingTransactions']();

      expect(
        RefundTransactionRepository.setStatusConfirmedIfPending,
      ).toHaveBeenCalledTimes(1);
      expect(
        RefundTransactionRepository.setStatusConfirmedIfPending,
      ).toHaveBeenCalledWith(btcSwapId);

      RefundTransactionRepository.getPendingTransactions = jest
        .fn()
        .mockResolvedValue([]);
    });
  });

  describe('getConfirmations', () => {
    const getConfirmations = watcher['getConfirmations'];

    test('should get confirmation for bitcoin like currencies', async () => {
      bitcoinClient.getRawTransactionVerbose = jest
        .fn()
        .mockResolvedValueOnce({
          confirmations: 0,
        })
        .mockResolvedValueOnce({
          confirmations: 1,
        })
        .mockResolvedValueOnce({
          confirmations: 2,
        });

      await expect(
        getConfirmations(watcher['currencies'].get('BTC')!, btcRefundTxId),
      ).resolves.toEqual(0);

      await expect(
        getConfirmations(watcher['currencies'].get('BTC')!, btcRefundTxId),
      ).resolves.toEqual(1);

      await expect(
        getConfirmations(watcher['currencies'].get('BTC')!, btcRefundTxId),
      ).resolves.toEqual(2);
    });

    test('should get confirmations for EVM currencies', async () => {
      const tx = await setup.signer.sendTransaction({});
      await evmProvider.waitForTransaction(tx.hash, 1, 10_000);

      await expect(
        getConfirmations(watcher['currencies'].get('RBTC')!, tx.hash),
      ).resolves.toBeGreaterThanOrEqual(1);
    });

    test('should always return required confirmations + 1 for ARK', async () => {
      await expect(
        getConfirmations(watcher['currencies'].get(ArkClient.symbol)!, 'txId'),
      ).resolves.toEqual(2);
    });
  });
});
