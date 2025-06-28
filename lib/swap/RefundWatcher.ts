import type Logger from '../Logger';
import { formatError, getHexBuffer, reverseBuffer } from '../Utils';
import {
  CurrencyType,
  SwapType,
  swapTypeToPrettyString,
} from '../consts/Enums';
import TypedEventEmitter from '../consts/TypedEventEmitter';
import type RefundTransaction from '../db/models/RefundTransaction';
import { RefundStatus } from '../db/models/RefundTransaction';
import type ReverseSwap from '../db/models/ReverseSwap';
import { type ChainSwapInfo } from '../db/repositories/ChainSwapRepository';
import RefundTransactionRepository from '../db/repositories/RefundTransactionRepository';
import { type Currency } from '../wallet/WalletManager';

// TODO: check replacements

class RefundWatcher extends TypedEventEmitter<{
  'refund.confirmed': ReverseSwap | ChainSwapInfo;
}> {
  private readonly requiredConfirmations = 1;
  private currencies!: Map<string, Currency>;

  constructor(private readonly logger: Logger) {
    super();
  }

  public init = (currencies: Map<string, Currency>) => {
    this.currencies = currencies;

    for (const { chainClient, provider } of this.currencies.values()) {
      if (chainClient) {
        chainClient.on('block', this.checkPendingTransactions);
      }

      if (provider) {
        provider.on('block', this.checkPendingTransactions);
      }
    }
  };

  private checkPendingTransactions = async () => {
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
  };

  private checkRefund = async (
    tx: RefundTransaction,
    swap: ReverseSwap | ChainSwapInfo,
  ) => {
    const refundCurrency = this.getRefundCurrency(swap);
    const confirmations = await this.getConfirmations(refundCurrency, tx.id);

    if (confirmations < this.requiredConfirmations) {
      return;
    }

    this.logger.debug(
      `Refund transaction of ${swapTypeToPrettyString(swap.type)} ${swap.id} confirmed: ${tx.id}`,
    );

    if (
      refundCurrency.type === CurrencyType.BitcoinLike ||
      refundCurrency.type === CurrencyType.Liquid
    ) {
      refundCurrency.chainClient?.removeInputFilter(
        reverseBuffer(getHexBuffer(this.getLockupTransactionId(swap)!)),
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
          return 0;
        }

        return await receipt.confirmations();
      }
    }
  };

  private getRefundCurrency = (swap: ReverseSwap | ChainSwapInfo) => {
    switch (swap.type) {
      case SwapType.ReverseSubmarine:
        return this.currencies.get((swap as ReverseSwap).chainCurrency)!;

      case SwapType.Chain:
        return this.currencies.get((swap as ChainSwapInfo).sendingData.symbol)!;

      default:
        throw new Error('Invalid swap type');
    }
  };

  private getLockupTransactionId = (swap: ReverseSwap | ChainSwapInfo) => {
    switch (swap.type) {
      case SwapType.ReverseSubmarine:
        return (swap as ReverseSwap).transactionId;

      case SwapType.Chain:
        return (swap as ChainSwapInfo).sendingData.transactionId;

      default:
        throw new Error('Invalid swap type');
    }
  };
}

export default RefundWatcher;
