import Logger from '../../../lib/Logger';
import { CurrencyType, SwapType } from '../../../lib/consts/Enums';
import type RefundTransaction from '../../../lib/db/models/RefundTransaction';
import { RefundStatus } from '../../../lib/db/models/RefundTransaction';
import type ReverseSwap from '../../../lib/db/models/ReverseSwap';
import type { ChainSwapInfo } from '../../../lib/db/repositories/ChainSwapRepository';
import RefundTransactionRepository from '../../../lib/db/repositories/RefundTransactionRepository';
import { TransactionType } from '../../../lib/proto/boltzr_pb';
import type Sidecar from '../../../lib/sidecar/Sidecar';
import type { FeeBumpSuggestion } from '../../../lib/sidecar/Sidecar';
import RefundWatcher from '../../../lib/swap/RefundWatcher';
import type { Currency } from '../../../lib/wallet/WalletManager';
import { bitcoinClient } from '../Nodes';
import { fundSignerWallet, getSigner } from '../wallet/EthereumTools';

jest.mock('../../../lib/db/repositories/ChainTipRepository');

RefundTransactionRepository.setStatus = jest.fn();
RefundTransactionRepository.getPendingTransactions = jest
  .fn()
  .mockResolvedValue([]);

describe('RefundWatcher', () => {
  const sidecar = {
    on: jest.fn(),
  } as unknown as Sidecar;
  const refundSwap = jest.fn();

  const watcher = new RefundWatcher(Logger.disabledLogger, sidecar, refundSwap);
  let setup: Awaited<ReturnType<typeof getSigner>>;

  beforeAll(async () => {
    await bitcoinClient.connect();
    setup = await getSigner();
    await fundSignerWallet(setup.signer, setup.etherBase);

    watcher.init(
      new Map([
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
            provider: setup.provider,
          } as unknown as Currency,
        ],
      ]),
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    bitcoinClient.disconnect();
    setup.provider.destroy();
  });

  describe('init', () => {
    afterAll(() => {
      RefundTransactionRepository.getPendingTransactions = jest
        .fn()
        .mockResolvedValue([]);
    });

    test('should add block listeners to currencies', async () => {
      const swapId = '1';

      const txId = await bitcoinClient.sendToAddress(
        await bitcoinClient.getNewAddress('test'),
        10_000,
        undefined,
        undefined,
        'test',
      );

      RefundTransactionRepository.getPendingTransactions = jest
        .fn()
        .mockResolvedValue([
          {
            tx: {
              id: txId,
              status: RefundStatus.Pending,
            } as unknown as RefundTransaction,
            swap: {
              id: swapId,
              refundCurrency: 'BTC',
              type: SwapType.ReverseSubmarine,
              serverLockupTransactionId: txId,
            } as unknown as ReverseSwap,
          },
        ]);

      const emitPromise = new Promise<ReverseSwap | ChainSwapInfo>(
        (resolve) => {
          watcher.on('refund.confirmed', (swap) => {
            resolve(swap);
          });
        },
      );

      await bitcoinClient.generate(1);

      const swap = await emitPromise;
      expect(swap.id).toEqual(swapId);

      expect(RefundTransactionRepository.setStatus).toHaveBeenCalledWith(
        swapId,
        RefundStatus.Confirmed,
      );
    });
  });

  describe('handleFeeBumpSuggestion', () => {
    const handleFeeBumpSuggestion = watcher['handleFeeBumpSuggestion'];

    test('should ignore suggestions that are not refund type', async () => {
      RefundTransactionRepository.getTransaction = jest.fn();

      await handleFeeBumpSuggestion({
        type: 21,
      } as unknown as FeeBumpSuggestion);

      expect(RefundTransactionRepository.getTransaction).not.toHaveBeenCalled();
    });

    test('should ignore suggestions that cannot be found in database', async () => {
      RefundTransactionRepository.getTransaction = jest
        .fn()
        .mockResolvedValue(null);

      const suggestion = {
        type: TransactionType.REFUND,
        transactionId: 'test',
      } as unknown as FeeBumpSuggestion;
      await handleFeeBumpSuggestion(suggestion);

      expect(RefundTransactionRepository.getTransaction).toHaveBeenCalledTimes(
        1,
      );
      expect(RefundTransactionRepository.getTransaction).toHaveBeenCalledWith(
        suggestion.transactionId,
      );
      expect(refundSwap).not.toHaveBeenCalled();
    });

    test('should fee bump after getting suggestion', async () => {
      RefundTransactionRepository.getTransaction = jest.fn().mockResolvedValue({
        swapId: 'swapId',
        id: 'test',
      });

      const swap = { refundCurrency: 'BTC' } as unknown as any;
      RefundTransactionRepository.getSwapForTransaction = jest
        .fn()
        .mockResolvedValue(swap);

      const suggestion = {
        type: TransactionType.REFUND,
        transactionId: 'test',
        feeTarget: 21,
      } as unknown as FeeBumpSuggestion;
      await handleFeeBumpSuggestion(suggestion);

      expect(RefundTransactionRepository.getTransaction).toHaveBeenCalledTimes(
        1,
      );
      expect(RefundTransactionRepository.getTransaction).toHaveBeenCalledWith(
        suggestion.transactionId,
      );

      expect(
        RefundTransactionRepository.getSwapForTransaction,
      ).toHaveBeenCalledTimes(1);
      expect(
        RefundTransactionRepository.getSwapForTransaction,
      ).toHaveBeenCalledWith('swapId');

      expect(refundSwap).toHaveBeenCalledTimes(1);
      expect(refundSwap).toHaveBeenCalledWith(
        watcher['currencies'].get('BTC')!,
        swap,
        suggestion.feeTarget,
      );
    });
  });

  describe('checkRefund', () => {
    const checkRefund = watcher['checkRefund'];

    let txId: string;

    beforeAll(async () => {
      txId = await bitcoinClient.sendToAddress(
        await bitcoinClient.getNewAddress('test'),
        10_000,
        undefined,
        undefined,
        'test',
      );
    });

    test('should ignore refund with less than required confirmations', async () => {
      await checkRefund(
        {
          id: txId,
          status: RefundStatus.Pending,
        } as unknown as RefundTransaction,
        {
          type: SwapType.ReverseSubmarine,
          refundCurrency: 'BTC',
        } as unknown as ReverseSwap,
      );

      expect(RefundTransactionRepository.setStatus).not.toHaveBeenCalled();
    });

    test('should handle confirmed refund transactions', async () => {
      await bitcoinClient.generate(1);

      const emitPromise = new Promise<ReverseSwap | ChainSwapInfo>(
        (resolve) => {
          watcher.on('refund.confirmed', (swap) => {
            resolve(swap);
          });
        },
      );

      const swapId = '1';
      await checkRefund(
        {
          id: txId,
          status: RefundStatus.Pending,
        } as unknown as RefundTransaction,
        {
          id: swapId,
          type: SwapType.ReverseSubmarine,
          refundCurrency: 'BTC',
          serverLockupTransactionId: txId,
        } as unknown as ReverseSwap,
      );

      const swap = await emitPromise;
      expect(swap.id).toEqual(swapId);

      expect(RefundTransactionRepository.setStatus).toHaveBeenCalledWith(
        swapId,
        RefundStatus.Confirmed,
      );
    });
  });

  describe('getConfirmations', () => {
    const getConfirmations = watcher['getConfirmations'];

    test('should get confirmation for bitcoin like currencies', async () => {
      const txId = await bitcoinClient.sendToAddress(
        await bitcoinClient.getNewAddress('test'),
        10_000,
        undefined,
        undefined,
        'test',
      );
      await expect(
        getConfirmations(watcher['currencies'].get('BTC')!, txId),
      ).resolves.toEqual(0);

      await bitcoinClient.generate(1);
      await expect(
        getConfirmations(watcher['currencies'].get('BTC')!, txId),
      ).resolves.toEqual(1);

      await bitcoinClient.generate(1);
      await expect(
        getConfirmations(watcher['currencies'].get('BTC')!, txId),
      ).resolves.toEqual(2);
    });

    test('should get confirmations for EVM currencies', async () => {
      const tx = await setup.signer.sendTransaction({});
      await tx.wait(1);

      await expect(
        getConfirmations(watcher['currencies'].get('RBTC')!, tx.hash),
      ).resolves.toEqual(1);
    });
  });
});
