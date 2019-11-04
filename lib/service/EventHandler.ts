import { Op } from 'sequelize';
import AsyncLock from 'async-lock';
import { EventEmitter } from 'events';
import { TxOutput, Transaction } from 'bitcoinjs-lib';
import Errors from './Errors';
import Logger from '../Logger';
import Swap from '../db/models/Swap';
import { getSwapName, transactionHashToId } from '../Utils';
import SwapRepository from './SwapRepository';
import SwapNursery from '../swap/SwapNursery';
import ReverseSwap from '../db/models/ReverseSwap';
import { Currency } from '../wallet/WalletManager';
import { SwapUpdateEvent, SwapType } from '../consts/Enums';
import ReverseSwapRepository from './ReverseSwapRepository';
import ChainToChainSwap from '../db/models/ChainToChainSwap';
import ChainToChainSwapRepository from './ChainToChainSwapRepository';

type SwapUpdate = {
  status: SwapUpdateEvent;

  preimage?: string;
  zeroConfAccepted?: boolean;
  lockupTransactionId?: string;
};

type GenericSwap = Swap | ReverseSwap | ChainToChainSwap;

interface EventHandler {
  on(event: 'swap.update', listener: (id: string, message: SwapUpdate) => void): this;
  emit(event: 'swap.update', id: string, message: SwapUpdate): boolean;

  on(event: 'swap.success', listener: (swap: GenericSwap, type: SwapType) => void): this;
  emit(event: 'swap.success', swap: GenericSwap, type: SwapType): boolean;

  on(event: 'swap.failure', listener: (swap: GenericSwap, type: SwapType, reason: string) => void): this;
  emit(event: 'swap.failure', swap: GenericSwap, type: SwapType, reason: string): boolean;

  on(event: 'channel.backup', listener: (currency: string, channelBackup: string) => void): this;
  emit(event: 'channel.backup', currency: string, channelbackup: string): boolean;
}

class EventHandler extends EventEmitter {
  private lock = new AsyncLock();

  private static swapLock = 'swap';
  private static reverseSwapLock = 'reverseSwap';
  private static chainToChainSwapLock = 'chainToChainSwap';

  constructor(
    private logger: Logger,
    private currencies: Map<string, Currency>,
    private nursery: SwapNursery,
    private swapRepository: SwapRepository,
    private reverseSwapRepository: ReverseSwapRepository,
    private chainToChainSwapRepository: ChainToChainSwapRepository,
  ) {
    super();

    this.subscribeInvoices();
    this.subscribeSwapEvents();
    this.subscribeTransactions();
    this.subscribeChannelBackups();
  }

  /**
   * Subscribes to a stream of confirmed transactions to addresses that were specified with "ListenOnAddress"
   */
  private subscribeTransactions = () => {
    const handleSwapTransaction = async (swap: ReverseSwap | ChainToChainSwap | undefined, type: SwapType) => {
      if (swap) {
        if (
          swap.status === SwapUpdateEvent.TransactionMempool ||
          swap.status === SwapUpdateEvent.BoltzTransactionMempool
        ) {
          const isReverseSwap = type === SwapType.ReverseSubmarine;
          const newStatus = isReverseSwap ? SwapUpdateEvent.TransactionConfirmed : SwapUpdateEvent.BoltzTransactioConfirmed;

          if (isReverseSwap) {
            await this.reverseSwapRepository.setReverseSwapStatus(swap as ReverseSwap, newStatus);
          } else {
            await this.chainToChainSwapRepository.setChainToChainSwapStatus(swap as ChainToChainSwap, newStatus);
          }

          this.emit('swap.update', swap.id, {
            status: newStatus,

            // Will be set to 'undefined' if it is a reverse swap or to the sending transaction id if it is a chain to chain one
            lockupTransactionId: swap['sendingTransactionId'],
          });
        }
      }
    };

    this.currencies.forEach((currency) => {
      currency.chainClient.on('transaction', async (transaction, confirmed) => {
        const transactionId = transaction.getId();

        if (!confirmed) {
          return;
        }

        await Promise.all([
          this.lock.acquire(EventHandler.reverseSwapLock, async () => {
            await handleSwapTransaction(await this.reverseSwapRepository.getReverseSwap({
              transactionId: {
                [Op.eq]: transactionId,
              },
            }), SwapType.ReverseSubmarine);
          }),
          this.lock.acquire(EventHandler.chainToChainSwapLock, async () => {
            await handleSwapTransaction(await this.chainToChainSwapRepository.getChainToChainSwap({
              sendingTransactionId: {
                [Op.eq]: transactionId,
              },
            }), SwapType.ChainToChain);
          }),
        ]);
      });
    });
  }

  /**
   * Subscribes to a stream of settled invoices and those paid by Boltz
   */
  private subscribeInvoices = () => {
    this.currencies.forEach((currency) => {
      if (!currency.lndClient) {
        return;
      }

      currency.lndClient.on('invoice.settled', async (invoice, preimage) => {
        await this.lock.acquire(EventHandler.reverseSwapLock, async () => {
          let reverseSwap = await this.reverseSwapRepository.getReverseSwap({
            invoice: {
              [Op.eq]: invoice,
            },
          });

          if (reverseSwap) {
            reverseSwap = await this.reverseSwapRepository.setInvoiceSettled(reverseSwap, preimage) as ReverseSwap;

            this.logSwapSucceeded(reverseSwap.id, SwapType.ReverseSubmarine);

            this.emit('swap.update', reverseSwap.id, { preimage, status: SwapUpdateEvent.InvoiceSettled });
            this.emit('swap.success', reverseSwap, SwapType.ReverseSubmarine);
          }
        });
      });
    });

    this.nursery.on('invoice.paid', async (invoice, routingFee) => {
      await this.lock.acquire(EventHandler.swapLock, async () => {
        const swap = await this.swapRepository.getSwap({
          invoice: {
            [Op.eq]: invoice,
          },
        });

        if (swap) {
          await this.swapRepository.setInvoicePaid(swap, routingFee);
          this.emit('swap.update', swap.id, { status: SwapUpdateEvent.InvoicePaid });
        }
      });
    });

    this.nursery.on('invoice.failedToPay', async (invoice) => {
      await this.lock.acquire(EventHandler.swapLock, async () => {
        let swap = await this.swapRepository.getSwap({
          invoice: {
            [Op.eq]: invoice,
          },
        });

        if (swap) {
          const error = Errors.INVOICE_COULD_NOT_BE_PAID();

          swap = await this.swapRepository.setSwapStatus(swap, SwapUpdateEvent.InvoiceFailedToPay);

          this.logSwapFailed(swap.id, SwapType.Submarine, error.message);

          this.emit('swap.update', swap.id, { status: SwapUpdateEvent.InvoiceFailedToPay });
          this.emit('swap.failure', swap, SwapType.Submarine, error.message);
        }
      });
    });
  }

  /**
   * Subscribes to a stream of swap events
   */
  private subscribeSwapEvents = () => {
    const handleLockupTransaction = async (
      swap: Swap | ChainToChainSwap | undefined,
      transaction: Transaction,
      vout: number,
      confirmed: boolean,
      zeroConfAccepted: boolean,
    ) => {
      if (swap) {
        const output = transaction.outs[vout] as TxOutput;
        const message = {
          zeroConfAccepted,
          status: confirmed ? SwapUpdateEvent.TransactionConfirmed : SwapUpdateEvent.TransactionMempool,
        };

        if (
          !swap.status ||
          swap.status === SwapUpdateEvent.TransactionMempool ||
          swap.status === SwapUpdateEvent.TransactionWaiting
        ) {
          // Normal submarine swaps don't have a "preimageHash" field
          if (swap['preimageHash'] === undefined) {
            await this.swapRepository.setLockupTransactionId(swap as Swap, transaction.getId(), output.value, confirmed);
          } else {
            await this.chainToChainSwapRepository.setReceivingTransaction(swap as ChainToChainSwap, transaction.getId(), output.value, confirmed);
          }

          this.emit('swap.update', swap.id, message);
        }
      }
    };

    this.nursery.on('transaction.lockup.found', async (id, transaction, vout, confirmed, zeroConfAccepted) => {
      await Promise.all([
        this.lock.acquire(EventHandler.swapLock, async () => {
          await handleLockupTransaction(await this.swapRepository.getSwap({
            id: {
              [Op.eq]: id,
            },
          }), transaction, vout, confirmed, zeroConfAccepted);
        }),
        this.lock.acquire(EventHandler.chainToChainSwapLock, async () => {
          await handleLockupTransaction(await this.chainToChainSwapRepository.getChainToChainSwap({
            id: {
              [Op.eq]: id,
            },
          }), transaction, vout, confirmed, zeroConfAccepted);
        }),
      ]);
    });

    this.nursery.on('transaction.lockup.sent', async (id, transactionId, minerFee) => {
      await this.lock.acquire(EventHandler.chainToChainSwapLock, async () => {
        const chainToChainSwap = await this.chainToChainSwapRepository.getChainToChainSwap({
          id: {
            [Op.eq]: id,
          },
        });

        if (chainToChainSwap) {
          await this.chainToChainSwapRepository.setSendingTransaction(chainToChainSwap, transactionId, minerFee);

          this.emit('swap.update', chainToChainSwap.id, {
            status: SwapUpdateEvent.BoltzTransactionMempool,
            lockupTransactionId: transactionId,
          });
        }
      });
    });

    this.nursery.on('claim', async (id, minerFee, preimage) => {
      // If the preimage is undefined it is a submarine swap
      // (doesn't have to be set in the database because it can be queried from the LND)
      if (preimage === undefined) {
        await this.lock.acquire(EventHandler.swapLock, async () => {
          let swap = await this.swapRepository.getSwap({
            id: {
              [Op.eq]: id,
            },
          });

          if (swap) {
            swap = await this.swapRepository.setMinerFee(swap, minerFee) as Swap;

            this.emit('swap.update', swap.id, { status: SwapUpdateEvent.TransactionClaimed });
            this.emit('swap.success', swap, SwapType.Submarine);
          }
        });
      } else {
        await this.lock.acquire(EventHandler.chainToChainSwapLock, async () => {
          let chainToChainSwap = await this.chainToChainSwapRepository.getChainToChainSwap({
            id: {
              [Op.eq]: id,
            },
          });

          if (chainToChainSwap) {
            chainToChainSwap = await this.chainToChainSwapRepository.setClaimDetails(chainToChainSwap, preimage, minerFee);

            this.emit('swap.update', chainToChainSwap.id, { status: SwapUpdateEvent.TransactionClaimed });
            this.emit('swap.success', chainToChainSwap, SwapType.ChainToChain);
          }
        });
      }
    });

    const handleAbortedSwap = async (swap: Swap | ChainToChainSwap | undefined, error: string) => {
      if (swap) {
        let type: SwapType;

        // Normal submarine swaps don't have a "preimageHash" field
        if (swap['preimageHash'] === undefined) {
          type = SwapType.Submarine;

          await this.swapRepository.setSwapStatus(swap as Swap, SwapUpdateEvent.SwapAborted);
        } else {
          type = SwapType.ChainToChain;

          await this.chainToChainSwapRepository.setChainToChainSwapStatus(swap as ChainToChainSwap, SwapUpdateEvent.SwapAborted);
        }

        this.logSwapFailed(swap.id, type, error);

        this.emit('swap.update', swap.id, { status: SwapUpdateEvent.SwapAborted });
        this.emit('swap.failure', swap, type, error);
      }
    };

    this.nursery.on('abort', async (id, error) => {
      await Promise.all([
        await this.lock.acquire(EventHandler.swapLock, async () => {
          await handleAbortedSwap(await this.swapRepository.getSwap({
            id: {
              [Op.eq]: id,
            },
          }), error);
        }),
        await this.lock.acquire(EventHandler.chainToChainSwapLock, async () => {
          await handleAbortedSwap(await this.chainToChainSwapRepository.getChainToChainSwap({
            id: {
              [Op.eq]: id,
            },
          }), error);
        }),
      ]);
    });

    const handleExpiration = async (swap: Swap | ChainToChainSwap | undefined) => {
      if (swap) {
        const newStatus = SwapUpdateEvent.SwapExpired;
        const error = Errors.ONCHAIN_HTLC_TIMED_OUT();

        let toReturn: Swap | ChainToChainSwap;

        // Normal submarine swaps don't have a "preimageHash" field
        const isSubmarineSwap = swap['preimageHash'] === undefined;

        if (isSubmarineSwap) {
          toReturn = await this.swapRepository.setSwapStatus(swap as Swap, newStatus);
        } else {
          toReturn = await this.chainToChainSwapRepository.setChainToChainSwapStatus(swap as ChainToChainSwap, newStatus);
        }

        const swapType = isSubmarineSwap ? SwapType.Submarine : SwapType.ChainToChain;

        this.logSwapFailed(toReturn.id, swapType, error.message);

        this.emit('swap.update', toReturn.id, { status: newStatus });
        this.emit('swap.failure', toReturn, swapType, error.message);
      }
    };

    this.nursery.on('expiration', async (id) => {
      await Promise.all([
        this.lock.acquire(EventHandler.swapLock, async () => {
          await handleExpiration(await this.swapRepository.getSwap({
            id: {
              [Op.eq]: id,
            },
          }));
        }),
        this.lock.acquire(EventHandler.chainToChainSwapLock, async () => {
          await handleExpiration(await this.chainToChainSwapRepository.getChainToChainSwap({
            id: {
              [Op.eq]: id,
            },
          }));
        }),
      ]);
    });

    const handleRefund = async (swap: ReverseSwap | ChainToChainSwap | undefined, minerFee: number) => {
      if (swap) {
        const error = Errors.ONCHAIN_HTLC_TIMED_OUT();

        // Reverse submarine swaps don't have a "preimageHash" field
        const swapType = swap['preimageHash'] === undefined ? SwapType.ReverseSubmarine : SwapType.ChainToChain;
        const isReverse = swapType === SwapType.ReverseSubmarine;

        const newStatus = isReverse ? SwapUpdateEvent.TransactionRefunded : SwapUpdateEvent.BoltzTransactionRefunded;

        let toReturn: ReverseSwap | ChainToChainSwap;

        if (isReverse) {
          toReturn = await this.reverseSwapRepository.setTransactionRefunded(swap as ReverseSwap, minerFee);
        } else {
          toReturn = await this.chainToChainSwapRepository.setSendingTransactionRefunded(
            swap as ChainToChainSwap,
            minerFee,
          );
        }

        this.logSwapFailed(toReturn.id, swapType, error.message);

        this.emit('swap.update', toReturn.id, { status: newStatus });
        this.emit('swap.failure', toReturn, swapType, error.message);
      }
    };

    this.nursery.on('refund', async (lockupTransactionId, minerFee) => {
      await Promise.all([
        this.lock.acquire(EventHandler.reverseSwapLock, async () => {
          await handleRefund(await this.reverseSwapRepository.getReverseSwap({
            transactionId: {
              [Op.eq]: lockupTransactionId,
            },
          }), minerFee);
        }),
        this.lock.acquire(EventHandler.chainToChainSwapLock, async () => {
          await handleRefund(await this.chainToChainSwapRepository.getChainToChainSwap({
            sendingTransactionId: {
              [Op.eq]: lockupTransactionId,
            },
          }), minerFee);
        }),
      ]);
    });
  }

  /**
   * Subscribes to a a stream of channel backups
   */
  private subscribeChannelBackups = () => {
    this.currencies.forEach((currency) => {
      if (currency.lndClient) {
        const { symbol, lndClient } = currency;

        lndClient.on('channel.backup', (channelBackup: string) => {
          this.emit('channel.backup', symbol, channelBackup);
        });
      }
    });
  }

  private logSwapSucceeded = (id: string, type: SwapType) => {
    this.logger.info(`${getSwapName(type, true)} swap ${id} succeeded`);
  }

  private logSwapFailed = (id: string, type: SwapType, message: string) => {
    this.logger.warn(`${getSwapName(type, true)} swap ${id} failed: ${message}`);
  }
}

export default EventHandler;
export { GenericSwap };
