import AsyncLock from 'async-lock';
import type Logger from '../Logger';
import { formatError, getHexBuffer, reverseBuffer } from '../Utils';
import { CurrencyType, swapTypeToPrettyString } from '../consts/Enums';
import TypedEventEmitter from '../consts/TypedEventEmitter';
import type RefundTransaction from '../db/models/RefundTransaction';
import { RefundStatus } from '../db/models/RefundTransaction';
import type ReverseSwap from '../db/models/ReverseSwap';
import { type ChainSwapInfo } from '../db/repositories/ChainSwapRepository';
import RefundTransactionRepository from '../db/repositories/RefundTransactionRepository';
import { TransactionType } from '../proto/boltzr_pb';
import type Sidecar from '../sidecar/Sidecar';
import type { FeeBumpSuggestion } from '../sidecar/Sidecar';
import type { Currency } from '../wallet/WalletManager';
import type SwapNursery from './SwapNursery';

// TODO: check replacements

class RefundWatcher extends TypedEventEmitter<{
  'refund.confirmed': ReverseSwap | ChainSwapInfo;
}> {
  private static readonly pendingTransactionsLock = 'pendingTransactions';

  private readonly lock = new AsyncLock();
  private readonly requiredConfirmations = 1;
  private currencies!: Map<string, Currency>;

  constructor(
    private readonly logger: Logger,
    private readonly sidecar: Sidecar,
    private readonly refundSwap: typeof SwapNursery.prototype.refundSwap,
  ) {
    super();
  }

  public init = (currencies: Map<string, Currency>) => {
    this.currencies = currencies;

    this.sidecar.on('fee.bump.suggestion', this.handleFeeBumpSuggestion);

    for (const { chainClient, provider } of this.currencies.values()) {
      if (chainClient) {
        chainClient.on('block', this.checkPendingTransactions);
      }

      if (provider) {
        provider.on('block', this.checkPendingTransactions);
      }
    }
  };

  private handleFeeBumpSuggestion = async (suggestion: FeeBumpSuggestion) => {
    if (suggestion.type !== TransactionType.REFUND) {
      return;
    }

    await this.lock.acquire(RefundWatcher.pendingTransactionsLock, async () => {
      const refundTx = await RefundTransactionRepository.getTransaction(
        suggestion.transactionId,
      );

      if (refundTx === null || refundTx === undefined) {
        this.logger.warn(
          `No refund transaction found for fee bump suggestion: ${suggestion.transactionId}`,
        );
        return;
      }

      this.logger.info(
        `Fee bump suggestion received for refund transaction ${refundTx.id}: ${suggestion.feeTarget} sat/vbyte`,
      );

      try {
        const swap = await RefundTransactionRepository.getSwapForTransaction(
          refundTx.swapId,
        );

        await this.refundSwap(
          this.currencies.get(swap.refundCurrency)!,
          swap,
          suggestion.feeTarget,
        );
      } catch (error) {
        this.logger.error(
          `Fee bumping refund ${suggestion.swapId} transaction ${suggestion.transactionId} failed: ${formatError(error)}`,
        );
      }
    });
  };

  private checkPendingTransactions = async () => {
    await this.lock.acquire(RefundWatcher.pendingTransactionsLock, async () => {
      const txs = await RefundTransactionRepository.getPendingTransactions();

      for (const { tx, swap } of txs) {
        try {
          await this.checkRefund(tx, swap);
        } catch (error) {
          this.logger.error(
            `Error checking refund transaction of ${swapTypeToPrettyString(swap.type)} ${swap.id}: ${formatError(error)}`,
          );
        }
      }
    });
  };

  private checkRefund = async (
    tx: RefundTransaction,
    swap: ReverseSwap | ChainSwapInfo,
  ) => {
    const refundCurrency = this.currencies.get(swap.refundCurrency);
    if (refundCurrency === undefined) {
      throw new Error(`unknown refund currency: ${swap.refundCurrency}`);
    }

    const confirmations = await this.getConfirmations(refundCurrency, tx.id);

    // TODO: what if it's getting awfully close to swap timeout and still not confirmed? maybe a check here and alert or bump the fee?
    if (confirmations < this.requiredConfirmations) {
      return;
    }

    this.logger.debug(
      `Refund transaction of ${swapTypeToPrettyString(swap.type)} swap ${swap.id} confirmed: ${tx.id}`,
    );

    if (
      refundCurrency.type === CurrencyType.BitcoinLike ||
      refundCurrency.type === CurrencyType.Liquid
    ) {
      refundCurrency.chainClient?.removeInputFilter(
        reverseBuffer(getHexBuffer(swap.serverLockupTransactionId!)),
      );
    }

    await RefundTransactionRepository.setStatus(
      swap.id,
      RefundStatus.Confirmed,
    );
    this.emit('refund.confirmed', swap);
  };

  private getConfirmations = async (currency: Currency, txId: string) => {
    switch (currency.type) {
      case CurrencyType.BitcoinLike:
      case CurrencyType.Liquid: {
        const info = await currency.chainClient!.getRawTransactionVerbose(txId);
        return info.confirmations || 0;
      }
      case CurrencyType.Ether:
      case CurrencyType.ERC20: {
        const receipt = await currency.provider!.getTransactionReceipt(txId);
        if (receipt === null) {
          return 0;
        }

        // TODO: gracefully handle failed txs
        if (receipt.status !== 1) {
          this.logger.warn(
            `${currency.symbol} EVM refund transaction ${txId} failed: ${receipt.status}`,
          );
          return 0;
        }

        return await receipt.confirmations();
      }

      case CurrencyType.Ark: {
        return this.requiredConfirmations + 1;
      }
    }
  };
}

export default RefundWatcher;
