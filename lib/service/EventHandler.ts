import type { Transaction as ScureTransaction } from '@scure/btc-signer';
import type { Transaction as LiquidTransaction } from 'liquidjs-lib';
import type Logger from '../Logger';
import { TxView } from '../TxView';
import { saneStringify } from '../Utils';
import {
  SwapType,
  SwapUpdateEvent,
  swapTypeToPrettyString,
} from '../consts/Enums';
import TypedEventEmitter from '../consts/TypedEventEmitter';
import type { AnySwap, IncorrectAmountDetails } from '../consts/Types';
import type ReverseSwap from '../db/models/ReverseSwap';
import SwapNursery from '../swap/SwapNursery';

type TransactionInfo = {
  confirmed?: boolean;
  eta?: number;

  id: string;
  hex?: string;
};

type SwapUpdate = {
  status: SwapUpdateEvent;

  zeroConfRejected?: boolean;
  transaction?: TransactionInfo;

  failureReason?: string;
  failureDetails?: IncorrectAmountDetails;
};

class EventHandler extends TypedEventEmitter<{
  'swap.update': {
    id: string;
    status: SwapUpdate;
    skipCache?: boolean;
  };
  'swap.success': {
    swap: AnySwap;
  };
  'swap.failure': {
    swap: AnySwap;
    reason: string;
  };
  'claim.failure': {
    swap: AnySwap;
    symbol: string;
    error: string;
  };
  'channel.backup': {
    currency: string;
    channelBackup: string;
  };
}> {
  constructor(
    private logger: Logger,
    public nursery: SwapNursery,
  ) {
    super();

    this.on('swap.update', ({ id, status }) => {
      this.logger.debug(`Swap ${id} update: ${saneStringify(status)}`);
    });

    this.subscribeInvoices();
    this.subscribeSwapEvents();
    this.subscribeTransactions();
  }

  public static formatTransaction = (
    transaction: string | LiquidTransaction | ScureTransaction,
  ) => {
    if (typeof transaction === 'string') {
      return { id: transaction };
    }

    const view = TxView.of(transaction);
    return { id: view.id, hex: view.hex };
  };

  public emitSwapCreation = (id: string): void => {
    this.emit('swap.update', {
      id,
      status: {
        status: SwapUpdateEvent.SwapCreated,
      },
    });
  };

  public emitSwapInvoiceSet = (id: string): void => {
    this.emit('swap.update', {
      id,
      status: { status: SwapUpdateEvent.InvoiceSet },
    });
  };

  /**
   * Subscribes transaction related swap events
   */
  private subscribeTransactions = () => {
    this.nursery.on('transaction', ({ swap, transaction, confirmed }) => {
      if (swap.type === SwapType.Submarine) {
        this.emit('swap.update', {
          id: swap.id,
          status: {
            status: confirmed
              ? SwapUpdateEvent.TransactionConfirmed
              : SwapUpdateEvent.TransactionMempool,
            transaction: EventHandler.formatTransaction(transaction),
          },
        });
      } else {
        // Reverse Swaps only emit the "transaction.confirmed" event
        // "transaction.mempool" is handled by the event "coins.sent"
        this.emitTransaction(swap, transaction, confirmed);
      }
    });
  };

  /**
   * Subscribes to invoice related Swap events
   */
  private subscribeInvoices = () => {
    this.nursery.on('invoice.settled', (swap) => {
      this.logger.verbose(`Reverse swap ${swap.id} succeeded`);

      this.emit('swap.update', {
        id: swap.id,
        status: {
          status: SwapUpdateEvent.InvoiceSettled,
        },
      });
      this.emit('swap.success', { swap });
    });

    this.nursery.on('invoice.pending', (swap) => {
      this.emit('swap.update', {
        id: swap.id,
        status: {
          status: SwapUpdateEvent.InvoicePending,
        },
      });
    });

    this.nursery.on('invoice.failedToPay', (swap) => {
      this.handleFailedSwap(
        swap,
        SwapUpdateEvent.InvoiceFailedToPay,
        swap.failureReason!,
      );
    });

    this.nursery.on('invoice.paid', (swap) => {
      this.emit('swap.update', {
        id: swap.id,
        status: {
          status: SwapUpdateEvent.InvoicePaid,
        },
      });
    });

    this.nursery.on('invoice.expired', (reverseSwap: ReverseSwap) => {
      this.emit('swap.update', {
        id: reverseSwap.id,
        status: {
          status: SwapUpdateEvent.InvoiceExpired,
        },
      });
    });
  };

  /**
   * Subscribes Swap events
   */
  private subscribeSwapEvents = () => {
    this.nursery.on('zeroconf.rejected', ({ swap, transaction }) => {
      this.emit('swap.update', {
        id: swap.id,
        status: {
          status: SwapUpdateEvent.TransactionMempool,
          zeroConfRejected: true,
          transaction: EventHandler.formatTransaction(transaction),
        },
      });
    });

    this.nursery.on('claim', ({ swap }) => {
      this.logger.verbose(
        `${swapTypeToPrettyString(swap.type)} Swap ${swap.id} succeeded`,
      );

      this.emit('swap.update', {
        id: swap.id,
        status: {
          status: SwapUpdateEvent.TransactionClaimed,
        },
      });
      this.emit('swap.success', {
        swap,
      });
    });

    this.nursery.on('claim.pending', (swap) => {
      this.emit('swap.update', {
        id: swap.id,
        status: {
          status: SwapUpdateEvent.TransactionClaimPending,
        },
      });
    });

    this.nursery.on('claim.failure', ({ swap, symbol, error }) => {
      this.emit('claim.failure', {
        swap,
        symbol,
        error,
      });
    });

    this.nursery.on('expiration', (swap) => {
      this.handleFailedSwap(
        swap,
        SwapUpdateEvent.SwapExpired,
        swap.failureReason!,
      );
    });

    this.nursery.on('minerfee.paid', (reverseSwap) => {
      this.emit('swap.update', {
        id: reverseSwap.id,
        status: {
          status: SwapUpdateEvent.MinerFeePaid,
        },
      });
    });

    this.nursery.on('coins.sent', ({ swap, transaction }) => {
      this.emitTransaction(swap, transaction, false);
    });

    this.nursery.on('coins.failedToSend', (swap) => {
      this.handleFailedSwap(
        swap as ReverseSwap,
        SwapUpdateEvent.TransactionFailed,
        swap.failureReason!,
      );
    });

    this.nursery.on(
      'refund',
      ({ swap, refundTransaction, confirmed, emitFailure }) => {
        this.emitRefundUpdate(swap, refundTransaction, confirmed, emitFailure);
      },
    );

    this.nursery.on('lockup.failed', (swap) => {
      this.emit('swap.update', {
        id: swap.id,
        status: {
          status: SwapUpdateEvent.TransactionLockupFailed,
          failureReason: swap.failureReason,
          failureDetails: swap.failureDetails,
        },
      });
    });
  };

  private handleFailedSwap = (
    swap: AnySwap,
    status: SwapUpdateEvent,
    failureReason: string,
  ) => {
    this.logger.warn(
      `${swapTypeToPrettyString(swap.type)} swap ${swap.id} failed: ${failureReason}`,
    );

    this.emit('swap.update', {
      id: swap.id,
      status: {
        status,
        failureReason,
        failureDetails: swap.failureDetails,
      },
    });
    this.emit('swap.failure', {
      swap,
      reason: failureReason,
    });
  };

  private emitTransaction = (
    swap: AnySwap,
    transaction: string | LiquidTransaction | ScureTransaction,
    confirmed: boolean,
  ) => {
    this.emit('swap.update', {
      id: swap.id,
      status: {
        status: swap.status as SwapUpdateEvent,
        transaction: {
          ...EventHandler.formatTransaction(transaction),
          eta: confirmed ? undefined : SwapNursery.reverseSwapMempoolEta,
        },
      },
    });
  };

  private emitRefundUpdate = (
    swap: AnySwap,
    refundTransaction: string | LiquidTransaction | ScureTransaction,
    confirmed: boolean,
    emitFailure: boolean,
  ) => {
    const failureReason = swap.failureReason!;

    if (emitFailure) {
      this.logger.warn(
        `${swapTypeToPrettyString(swap.type)} swap ${swap.id} failed: ${failureReason}`,
      );
    }

    this.emit('swap.update', {
      id: swap.id,
      status: {
        status: SwapUpdateEvent.TransactionRefunded,
        failureReason,
        transaction: {
          ...EventHandler.formatTransaction(refundTransaction),
          confirmed,
        },
      },
    });

    if (emitFailure) {
      this.emit('swap.failure', {
        swap,
        reason: failureReason,
      });
    }
  };
}

export default EventHandler;
export { SwapUpdate };
