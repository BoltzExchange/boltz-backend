import { Transaction } from 'bitcoinjs-lib';
import { Transaction as LiquidTransaction } from 'liquidjs-lib';
import Logger from '../Logger';
import { SwapType, SwapUpdateEvent } from '../consts/Enums';
import TypedEventEmitter from '../consts/TypedEventEmitter';
import ChainSwap from '../db/models/ChainSwap';
import ChannelCreation from '../db/models/ChannelCreation';
import ReverseSwap from '../db/models/ReverseSwap';
import Swap from '../db/models/Swap';
import { ChainSwapInfo } from '../db/repositories/ChainSwapRepository';
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
    swap: Swap | ReverseSwap | ChainSwapInfo;
    channelCreation?: ChannelCreation;
  };
  'swap.failure': {
    swap: Swap | ReverseSwap | ChainSwapInfo;
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
    this.nursery.on('transaction', ({ swap, transaction, confirmed }) => {
      if (swap.type === SwapType.Submarine) {
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
              status: swap.status as SwapUpdateEvent,
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
              status: swap.status as SwapUpdateEvent,
              transaction: {
                id: transaction,
              },
            },
          });
        }
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
      if (swap.type === SwapType.Submarine) {
        const submarine = swap as Swap;
        this.logger.verbose(`Swap ${submarine.id} succeeded`);

        this.emit('swap.update', {
          id: submarine.id,
          status: {
            status: SwapUpdateEvent.TransactionClaimed,
          },
        });
        this.emit('swap.success', {
          channelCreation,
          swap: submarine,
        });
      } else {
        const chainSwap = swap as ChainSwapInfo;
        this.logger.verbose(`Chain Swap ${chainSwap.chainSwap.id} succeeded`);

        this.emit('swap.update', {
          id: chainSwap.chainSwap.id,
          status: {
            status: SwapUpdateEvent.TransactionClaimed,
          },
        });
        this.emit('swap.success', {
          swap: chainSwap,
        });
      }
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
      const newStatus = SwapUpdateEvent.SwapExpired;

      switch (swap.type) {
        case SwapType.Submarine:
          this.handleFailedSwap(swap as Swap, newStatus, swap.failureReason!);
          break;

        case SwapType.ReverseSubmarine:
          this.handleFailedReverseSwap(
            swap as ReverseSwap,
            newStatus,
            swap.failureReason!,
          );
          break;

        case SwapType.Chain:
          this.handleFailedChainSwap(
            swap as ChainSwapInfo,
            newStatus,
            swap.failureReason!,
          );
          break;
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

    this.nursery.on('coins.sent', ({ swap, transaction }) => {
      if (
        transaction instanceof Transaction ||
        transaction instanceof LiquidTransaction
      ) {
        this.emit('swap.update', {
          id: swap.id,
          status: {
            status: swap.status as SwapUpdateEvent,
            transaction: {
              id: transaction.getId(),
              hex: transaction.toHex(),
              eta: SwapNursery.reverseSwapMempoolEta,
            },
          },
        });
      } else {
        this.emit('swap.update', {
          id: swap.id,
          status: {
            status: swap.status as SwapUpdateEvent,
            transaction: {
              id: transaction,
            },
          },
        });
      }
    });

    this.nursery.on('coins.failedToSend', (swap) => {
      if (swap.type === SwapType.ReverseSubmarine) {
        this.handleFailedReverseSwap(
          swap as ReverseSwap,
          SwapUpdateEvent.TransactionFailed,
          (swap as ReverseSwap).failureReason!,
        );
      } else {
        this.handleFailedChainSwap(
          swap as ChainSwapInfo,
          SwapUpdateEvent.TransactionFailed,
          (swap as ChainSwapInfo).chainSwap.failureReason!,
        );
      }
    });

    this.nursery.on('refund', ({ swap }) => {
      if (swap.type === SwapType.ReverseSubmarine) {
        this.handleFailedReverseSwap(
          swap as ReverseSwap,
          SwapUpdateEvent.TransactionRefunded,
          swap.failureReason!,
        );
      } else {
        this.handleFailedChainSwap(
          swap as ChainSwapInfo,
          SwapUpdateEvent.TransactionRefunded,
          swap.failureReason!,
        );
      }
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

    this.nursery.on('lockup.failed', (swap: Swap | ChainSwap) => {
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
      reason: failureReason,
    });
  };

  private handleFailedChainSwap = (
    chainSwap: ChainSwapInfo,
    status: SwapUpdateEvent,
    failureReason: string,
  ) => {
    this.logger.warn(
      `Chain swap ${chainSwap.chainSwap.id} failed: ${failureReason}`,
    );

    this.emit('swap.update', {
      id: chainSwap.chainSwap.id,
      status: { status, failureReason },
    });
    this.emit('swap.failure', {
      swap: chainSwap,
      reason: failureReason,
    });
  };
}

export default EventHandler;
export { SwapUpdate };
