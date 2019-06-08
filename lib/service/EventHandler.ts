import { EventEmitter } from 'events';
import { TxOutput } from 'bitcoinjs-lib';
import { getHexString } from '../Utils';
import SwapNursery from '../swap/SwapNursery';
import { Currency } from '../wallet/WalletManager';

interface EventHandler {
  on(event: 'transaction', listener: (outputAddress: string, transactionHash: string, amountReceived: number, confirmed: boolean) => void): this;
  emit(event: 'transaction', outputAddress: string, transactionHash: string, amountReceived: number, confirmed: boolean): boolean;

  on(even: 'invoice.paid', listener: (invoice: string, routingFee: number) => void): this;
  emit(event: 'invoice.paid', invoice: string, routingFee: number): boolean;

  on(event: 'invoice.failedToPay', listener: (invoice: string) => void): this;
  emit(event: 'invoice.failedToPay', invoice: string): boolean;

  on(event: 'invoice.settled', listener: (invoice: string, preimage: string) => void): this;
  emit(event: 'invoice.settled', string: string, preimage: string): boolean;

  on(event: 'claim', listener: (lockupTransactionHash: string, lockupVout: number, minerFee: number) => void): this;
  emit(event: 'claim', lockupTransactionHash: string, lockupVout: number, minerFee: number): boolean;

  on(event: 'abort', listener: (invoice: string) => void): this;
  emit(event: 'abort', invoice: string): boolean;

  on(event: 'zeroconf.rejected', listener: (invoice: string, reason: string) => void): this;
  emit(evetn: 'zeroconf.rejected', invoice: string, reason: string): boolean;

  on(event: 'refund', listener: (lockupTransactionHash: string, lockupVout: number, minerFee: number) => void): this;
  emit(event: 'refund', lockupTransactionHash: string, lockupVout: number, minerFee: number): boolean;

  on(event: 'channel.backup', listener: (currency: string, channelBackup: string) => void): this;
  emit(event: 'channel.backup', currency: string, channelbackup: string): boolean;
}

class EventHandler extends EventEmitter {
  // A map betwwen the hex strings of the scripts of the addresses and
  // the addresses themselves to which Boltz should listen
  public listenScripts = new Map<string, string>();

  constructor(private currencies: Map<string, Currency>, private nursery: SwapNursery) {
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
        transaction.outs.forEach((out) => {
          const output = out as TxOutput;
          const listenAddress = this.listenScripts.get(getHexString(output.script));

          if (listenAddress) {
            this.emit('transaction', listenAddress, transaction.getId(), output.value, confirmed);
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
      currency.lndClient.on('invoice.paid', (invoice, routingFee) => {
        this.emit('invoice.paid', invoice, routingFee);
      });

      currency.lndClient.on('invoice.settled', (invoice, preimage) => {
        this.emit('invoice.settled', invoice, preimage);
      });
    });

    this.nursery.on('invoice.failedToPay', (invoice) => {
      this.emit('invoice.failedToPay', invoice);
    });
  }

  /**
   * Subscribes to a stream of swap events
   */
  private subscribeSwapEvents = () => {
    this.nursery.on('claim', (lockupTransactionHash, vout, minerFee) => {
      this.emit('claim', lockupTransactionHash, vout, minerFee);
    });

    this.nursery.on('abort', (invoice) => {
      this.emit('abort', invoice);
    });

    this.nursery.on('refund', (lockupTransactionHash, vout, minerFee) => {
      this.emit('refund', lockupTransactionHash, vout, minerFee);
    });

    this.nursery.on('zeroconf.rejected', (invoice, reason) => {
      this.emit('zeroconf.rejected', invoice, reason);
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
