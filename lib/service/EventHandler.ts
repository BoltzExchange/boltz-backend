import { Transaction } from 'bitcoinjs-lib';
import { Transaction as LiquidTransaction } from 'liquidjs-lib';
import Logger from '../Logger';
import { SwapUpdateEvent } from '../consts/Enums';
import TypedEventEmitter from '../consts/TypedEventEmitter';
import ChannelCreation from '../db/models/ChannelCreation';
import ReverseSwap from '../db/models/ReverseSwap';
import Swap from '../db/models/Swap';
import SwapNursery from '../swap/SwapNursery';
import { Currency } from '../wallet/WalletManager';

type TransactionInfo = {
  eta?: number;

  id: string;
  hex?: string;
};

type SwapUpdate = {
  status: SwapUpdateEvent;
  failureReason?: string;

  zeroConfRejected?: boolean;
  transaction?: TransactionInfo;

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
    swap: Swap | ReverseSwap;
    isReverse: boolean;
    channelCreation?: ChannelCreation;
  };
  'swap.failure': {
    swap: Swap | ReverseSwap;
    isReverse: boolean;
    reason: string;
  };
  'channel.backup': {
    currency: string;
    channelBackup: string;
  };
}> {
  constructor(
    private logger: Logger,
    private currencies: Map<string, Currency>,
    private nursery: SwapNursery,
  ) {
    super();

    this.subscribeInvoices();
    this.subscribeSwapEvents();
    this.subscribeTransactions();
    this.subscribeChannelBackups();
  }

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
    this.nursery.on(
      'transaction',
      ({ swap, transaction, confirmed, isReverse }) => {
        if (!isReverse) {
          this.emit('swap.update', {
            id: swap.id,
            status: {
              status: confirmed
                ? SwapUpdateEvent.TransactionConfirmed
                : SwapUpdateEvent.TransactionMempool,
            },
          });
        } else {
          // Reverse Swaps only emit the "transaction.confirmed" event
          // "transaction.mempool" is handled by the event "coins.sent"
          if (
            transaction instanceof Transaction ||
            transaction instanceof LiquidTransaction
          ) {
            this.emit('swap.update', {
              id: swap.id,
              status: {
                status: SwapUpdateEvent.TransactionConfirmed,
                transaction: {
                  id: transaction.getId(),
                  hex: transaction.toHex(),
                },
              },
            });
          } else {
            this.emit('swap.update', {
              id: swap.id,
              status: {
                status: SwapUpdateEvent.TransactionConfirmed,
                transaction: {
                  id: transaction,
                },
              },
            });
          }
        }
      },
    );
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
      this.emit('swap.success', { swap, isReverse: true });
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
    this.nursery.on('zeroconf.rejected', (swap) => {
      this.emit('swap.update', {
        id: swap.id,
        status: {
          status: SwapUpdateEvent.TransactionMempool,
          zeroConfRejected: true,
        },
      });
    });

    this.nursery.on('claim', ({ swap, channelCreation }) => {
      this.logger.verbose(`Swap ${swap.id} succeeded`);

      this.emit('swap.update', {
        id: swap.id,
        status: {
          status: SwapUpdateEvent.TransactionClaimed,
        },
      });
      this.emit('swap.success', {
        swap,
        channelCreation,
        isReverse: false,
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

    this.nursery.on('expiration', ({ swap, isReverse }) => {
      const newStatus = SwapUpdateEvent.SwapExpired;

      if (isReverse) {
        this.handleFailedReverseSwap(
          swap as ReverseSwap,
          newStatus,
          swap.failureReason!,
        );
      } else {
        this.handleFailedSwap(swap as Swap, newStatus, swap.failureReason!);
      }
    });

    this.nursery.on('minerfee.paid', (reverseSwap) => {
      this.emit('swap.update', {
        id: reverseSwap.id,
        status: {
          status: SwapUpdateEvent.MinerFeePaid,
        },
      });
    });

    this.nursery.on('coins.sent', ({ reverseSwap, transaction }) => {
      if (
        transaction instanceof Transaction ||
        transaction instanceof LiquidTransaction
      ) {
        this.emit('swap.update', {
          id: reverseSwap.id,
          status: {
            status: SwapUpdateEvent.TransactionMempool,
            transaction: {
              id: transaction.getId(),
              hex: transaction.toHex(),
              eta: SwapNursery.reverseSwapMempoolEta,
            },
          },
        });
      } else {
        this.emit('swap.update', {
          id: reverseSwap.id,
          status: {
            status: SwapUpdateEvent.TransactionMempool,
            transaction: {
              id: transaction,
            },
          },
        });
      }
    });

    this.nursery.on('coins.failedToSend', (reverseSwap) => {
      this.handleFailedReverseSwap(
        reverseSwap,
        SwapUpdateEvent.TransactionFailed,
        reverseSwap.failureReason!,
      );
    });

    this.nursery.on('refund', ({ reverseSwap }) => {
      this.handleFailedReverseSwap(
        reverseSwap,
        SwapUpdateEvent.TransactionRefunded,
        reverseSwap.failureReason!,
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

    this.nursery.on('lockup.failed', (swap: Swap) => {
      this.emit('swap.update', {
        id: swap.id,
        status: {
          status: SwapUpdateEvent.TransactionLockupFailed,
          failureReason: swap.failureReason,
        },
      });
    });
  };

  /**
   * Subscribes to a stream of channel backups
   */
  private subscribeChannelBackups = () => {
    this.currencies.forEach((currency) => {
      // TODO: also do backups for CLN here?
      if (currency.lndClient) {
        const { symbol, lndClient } = currency;

        lndClient.on('channel.backup', (channelBackup: string) => {
          this.emit('channel.backup', { channelBackup, currency: symbol });
        });
      }
    });
  };

  private handleFailedSwap = (
    swap: Swap,
    status: SwapUpdateEvent,
    failureReason: string,
  ) => {
    this.logger.warn(`Swap ${swap.id} failed: ${failureReason}`);

    this.emit('swap.update', {
      id: swap.id,
      status: {
        status,
        failureReason,
      },
    });
    this.emit('swap.failure', {
      swap,
      isReverse: false,
      reason: failureReason,
    });
  };

  private handleFailedReverseSwap = (
    reverseSwap: ReverseSwap,
    status: SwapUpdateEvent,
    failureReason: string,
  ) => {
    this.logger.warn(`Reverse swap ${reverseSwap.id} failed: ${failureReason}`);

    this.emit('swap.update', {
      id: reverseSwap.id,
      status: { status, failureReason },
    });
    this.emit('swap.failure', {
      swap: reverseSwap,
      isReverse: true,
      reason: failureReason,
    });
  };
}

export default EventHandler;
export { SwapUpdate };
