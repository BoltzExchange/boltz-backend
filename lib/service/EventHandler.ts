import { Transaction } from 'bitcoinjs-lib';
import { Transaction as LiquidTransaction } from 'liquidjs-lib';
import Logger from '../Logger';
import { saneStringify } from '../Utils';
import {
  SwapType,
  SwapUpdateEvent,
  swapTypeToPrettyString,
} from '../consts/Enums';
import TypedEventEmitter from '../consts/TypedEventEmitter';
import { AnySwap, IncorrectAmountDetails } from '../consts/Types';
import ChannelCreation from '../db/models/ChannelCreation';
import ReverseSwap from '../db/models/ReverseSwap';
import SwapNursery from '../swap/SwapNursery';

type TransactionInfo = {
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

  channel?: {
    fundingTransactionId: string;
    fundingTransactionVout: number;
  };
};

class EventHandler extends TypedEventEmitter<{
  'swap.update': {
    id: string;
    status: SwapUpdate;
  };
  'swap.success': {
    swap: AnySwap;
    channelCreation?: ChannelCreation;
  };
  'swap.failure': {
    swap: AnySwap;
    reason: string;
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
    transaction: string | Transaction | LiquidTransaction,
  ) => {
    if (
      transaction instanceof Transaction ||
      transaction instanceof LiquidTransaction
    ) {
      return {
        id: transaction.getId(),
        hex: transaction.toHex(),
      };
    } else {
      return {
        id: transaction,
      };
    }
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

    this.nursery.on('claim', ({ swap, channelCreation }) => {
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
        channelCreation,
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

    this.nursery.on('refund', ({ swap }) => {
      this.handleFailedSwap(
        swap,
        SwapUpdateEvent.TransactionRefunded,
        swap.failureReason!,
      );
    });

    this.nursery.channelNursery.on(
      'channel.created',
      ({ swap, channelCreation }) => {
        this.emit('swap.update', {
          id: swap.id,
          status: {
            status: SwapUpdateEvent.ChannelCreated,
            channel: {
              fundingTransactionId: channelCreation.fundingTransactionId!,
              fundingTransactionVout: channelCreation.fundingTransactionVout!,
            },
          },
        });
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
    transaction: string | Transaction | LiquidTransaction,
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
}

export default EventHandler;
export { SwapUpdate };
