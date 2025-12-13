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
import { bitcoinClient } from '../Nodes';
import { fundSignerWallet, getSigner } from '../wallet/EthereumTools';

jest.mock('../../../lib/db/repositories/ChainTipRepository');

RefundTransactionRepository.setStatus = jest.fn();
RefundTransactionRepository.getPendingTransactions = jest
  .fn()
  .mockResolvedValue([]);

describe('RefundWatcher', () => {
  const mockSidecar = new EventEmitter() as any as Sidecar;
  const watcher = new RefundWatcher(Logger.disabledLogger, mockSidecar);
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
        [
          ArkClient.symbol,
          {
            symbol: ArkClient.symbol,
            type: CurrencyType.Ark,
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

    test('should check pending transactions on block events', async () => {
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
            watcher.removeAllListeners('refund.confirmed');
          });
        },
      );

      await bitcoinClient.generate(1);
      mockSidecar.emit('block', {
        symbol: 'BTC',
        height: 1,
        hash: Buffer.alloc(32),
      });

      const swap = await emitPromise;
      expect(swap.id).toEqual(swapId);

      expect(RefundTransactionRepository.setStatus).toHaveBeenCalledWith(
        swapId,
        RefundStatus.Confirmed,
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
            watcher.removeAllListeners('refund.confirmed');
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

    test('should always return required confirmations + 1 for ARK', async () => {
      await expect(
        getConfirmations(watcher['currencies'].get(ArkClient.symbol)!, 'txId'),
      ).resolves.toEqual(2);
    });
  });
});
