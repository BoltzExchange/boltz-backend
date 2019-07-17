import { Op } from 'sequelize';
import { EventEmitter } from 'events';
import { TxOutput } from 'bitcoinjs-lib';
import Errors from './Errors';
import Logger from '../Logger';
import Swap from '../db/models/Swap';
import { getHexString } from '../Utils';
import SwapRepository from './SwapRepository';
import SwapNursery from '../swap/SwapNursery';
import { SwapUpdateEvent } from '../consts/Enums';
import ReverseSwap from '../db/models/ReverseSwap';
import { Currency } from '../wallet/WalletManager';
import ReverseSwapRepository from './ReverseSwapRepository';

type SwapUpdate = {
  event: SwapUpdateEvent;

  preimage?: string;
};

interface EventHandler {
  on(event: 'swap.update', listener: (id: string, message: SwapUpdate) => void): this;
  emit(event: 'swap.update', id: string, message: SwapUpdate): boolean;

  on(event: 'swap.success', listener: (swap: Swap | ReverseSwap) => void): this;
  emit(event: 'swap.success', swap: Swap | ReverseSwap): boolean;

  on(event: 'swap.failure', listener: (reverseSwap: Swap | ReverseSwap, reason: string) => void): this;
  emit(event: 'swap.failure', reverseSwap: Swap | ReverseSwap, reason: string): boolean;

  on(event: 'channel.backup', listener: (currency: string, channelBackup: string) => void): this;
  emit(event: 'channel.backup', currency: string, channelbackup: string): boolean;
}

// TODO: write tests
class EventHandler extends EventEmitter {
  // A map between the hex strings of the scripts of the addresses and
  // the addresses themselves to which Boltz should listen
  public listenScripts = new Map<string, string>();

  constructor(
    private logger: Logger,
    private currencies: Map<string, Currency>,
    private nursery: SwapNursery,
    private swapRepository: SwapRepository,
    private reverseSwapRepository: ReverseSwapRepository,
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
    this.currencies.forEach((currency) => {
      currency.chainClient.on('transaction', (transaction, confirmed) => {
        transaction.outs.forEach(async (out) => {
          const output = out as TxOutput;
          const listenAddress = this.listenScripts.get(getHexString(output.script));

          if (listenAddress) {
            const swap = await this.swapRepository.getSwap({
              lockupAddress: {
                [Op.eq]: listenAddress,
              },
            });

            if (swap) {
              if (!swap.status || swap.status === SwapUpdateEvent.TransactionMempool) {
                await this.swapRepository.setLockupTransactionId(swap, transaction.getId(), output.value, confirmed);

                if (confirmed || swap.acceptZeroConf) {
                  this.emit('swap.update', swap.id, {
                    event: confirmed ? SwapUpdateEvent.TransactionConfirmed : SwapUpdateEvent.TransactionMempool,
                  });
                }
              }
            }

            const reverseSwap = await this.reverseSwapRepository.getReverseSwap({
              transactionId: {
                [Op.eq]: transaction.getId(),
              },
            });

            if (reverseSwap) {
              if (!reverseSwap.status || reverseSwap.status === SwapUpdateEvent.TransactionMempool) {
                const event = confirmed ? SwapUpdateEvent.TransactionConfirmed : SwapUpdateEvent.TransactionMempool;

                await this.reverseSwapRepository.setReverseSwapStatus(reverseSwap, event);

                this.emit('swap.update', reverseSwap.id, { event });
              }
            }
          }
        });
      });
    });
  }

  /**
   * Subscribes to a stream of settled invoices and those paid by Boltz
   */
  private subscribeInvoices = () => {
    this.currencies.forEach((currency) => {
      currency.lndClient.on('invoice.paid', async (invoice, routingFee) => {
        const swap = await this.swapRepository.getSwap({
          invoice: {
            [Op.eq]: invoice,
          },
        });

        if (swap) {
          await this.swapRepository.setInvoicePaid(swap, routingFee);
          this.emit('swap.update', swap!.id, { event: SwapUpdateEvent.InvoicePaid });
        }
      });

      currency.lndClient.on('invoice.settled', async (invoice, preimage) => {
        let reverseSwap = await this.reverseSwapRepository.getReverseSwap({
          invoice: {
            [Op.eq]: invoice,
          },
        });

        if (reverseSwap) {
          reverseSwap = await this.reverseSwapRepository.setInvoiceSettled(reverseSwap, preimage);

          this.logger.verbose(`Reverse swap ${reverseSwap.id} succeeded`);

          this.emit('swap.update', reverseSwap.id, { preimage, event: SwapUpdateEvent.InvoiceSettled });
          this.emit('swap.success', reverseSwap);
        }
      });
    });

    this.nursery.on('invoice.failedToPay', async (invoice) => {
      let swap = await this.swapRepository.getSwap({
        invoice: {
          [Op.eq]: invoice,
        },
      });

      if (swap) {
        const error = Errors.INVOICE_COULD_NOT_BE_PAID();

        swap = await this.swapRepository.setSwapStatus(swap, SwapUpdateEvent.InvoiceFailedToPay);

        this.logger.info(`Swap ${swap!.id} failed: ${error.message}`);

        this.emit('swap.update', swap!.id, { event: SwapUpdateEvent.InvoiceFailedToPay });
        this.emit('swap.failure', swap!, error.message);
      }
    });
  }

  /**
   * Subscribes to a stream of swap events
   */
  private subscribeSwapEvents = () => {
    this.nursery.on('claim', async (lockupTransactionId, _, minerFee) => {
      let swap = await this.swapRepository.getSwap({
        lockupTransactionId: {
          [Op.eq]: lockupTransactionId,
        },
      });

      if (swap) {
        swap = await this.swapRepository.setMinerFee(swap, minerFee);

        this.logger.verbose(`Swap ${swap!.id} succeeded`);
        this.emit('swap.success', swap!);
      }
    });

    this.nursery.on('abort', async (invoice) => {
      let swap = await this.swapRepository.getSwap({
        invoice: {
          [Op.eq]: invoice,
        },
      });

      if (swap) {
        swap = await this.swapRepository.setSwapStatus(swap, SwapUpdateEvent.SwapExpired);

        const error = Errors.ONCHAIN_HTLC_TIMED_OUT();

        this.logger.info(`Swap ${swap!.id} failed: ${error.message}`);

        this.emit('swap.update', swap!.id, { event: SwapUpdateEvent.SwapExpired });
        this.emit('swap.failure', swap!, error.message);
      }
    });

    this.nursery.on('refund', async (lockupTransactionId, _, minerFee) => {
      let reverseSwap = await this.reverseSwapRepository.getReverseSwap({
        transactionId: {
          [Op.eq]: lockupTransactionId,
        },
      });

      if (reverseSwap) {
        reverseSwap = await this.reverseSwapRepository.setTransactionRefunded(reverseSwap, minerFee);

        const error = Errors.ONCHAIN_HTLC_TIMED_OUT();

        this.logger.info(`Reverse swap ${reverseSwap.id} failed: ${error.message}`);

        this.emit('swap.update', reverseSwap.id, { event: SwapUpdateEvent.TransactionRefunded });
        this.emit('swap.failure', reverseSwap, error.message);
      }
    });
  }

  /**
   * Subscribes to a a stream of channel backups
   */
  private subscribeChannelBackups = () => {
    this.currencies.forEach((currency) => {
      const { symbol, lndClient } = currency;

      lndClient.on('channel.backup', (channelBackup: string) => {
        this.emit('channel.backup', symbol, channelBackup);
      });
    });
  }
}

export default EventHandler;
