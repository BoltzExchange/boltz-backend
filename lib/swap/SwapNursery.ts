import { EventEmitter } from 'events';
import { BIP32Interface } from 'bip32';
import { Transaction, address, TxOutput } from 'bitcoinjs-lib';
import {
  OutputType,
  detectPreimage,
  TransactionOutput,
  constructClaimTransaction,
  constructRefundTransaction,
 } from 'boltz-core';
import Logger from '../Logger';
import LndClient from '../lightning/LndClient';
import ChainClient from '../chain/ChainClient';
import WalletManager, { Currency } from '../wallet/WalletManager';
import { getHexString, transactionHashToId, transactionSignalsRbfExplicitly, reverseBuffer } from '../Utils';

type BaseSwapDetails = {
  redeemScript: Buffer;
};

type SwapDetails = BaseSwapDetails & {
  invoice: string;
  outputType: OutputType;
  expectedAmount: number;
  acceptZeroConf: boolean;
  claimKeys: BIP32Interface;
};

type SendingDetails = {
  amount: number;
  address: string;
};

type ReverseSwapDetails = BaseSwapDetails & {
  sendingSymbol: string;
  receivingSymbol: string;

  preimageHash: Buffer;
  outputType: OutputType;
  output?: TransactionOutput;
  refundKeys: BIP32Interface;
  sendingDetails: SendingDetails;
};

type MinimalReverseSwapDetails = {
  invoice: string;
  receivingSymbol: string;
};

type SwapMaps = {
  // A map between the output scripts and the swaps details
  swaps: Map<string, SwapDetails>;

  // A map between the timeout block heights and the output scripts of the normal swaps
  swapTimeouts: Map<number, string[]>;

  // A map between the invoices and the reverse swaps details
  reverseSwaps: Map<string, ReverseSwapDetails>;

  // A map between the lock up transaction id of a reverse swap and its invoice and the symbol of the reiceiving currency
  reverseSwapTransactions: Map<string, MinimalReverseSwapDetails>;

  // A map betwee the timeout block heights and the invoices of the reverse swaps
  reverseSwapTimeouts: Map<number, MinimalReverseSwapDetails[]>;
};

interface SwapNursery {
  on(event: 'expiration', listener: (invoice: string, isReverse: boolean) => void): this;
  emit(event: 'expiration', invoice: string, isReverse: boolean): boolean;

  // Swap related events
  on(event: 'claim', listener: (lockupTransactionId: string, lockupVout: number, minerFee: number) => void): this;
  emit(event: 'claim', lockupTransactionId: string, lockupVout: number, minerFee: number): boolean;

  on(event: 'invoice.paid', listener: (invoice: string, routingFee: number) => void): this;
  emit(event: 'invoice.paid', invoice: string, routingFee: number): boolean;

  on(event: 'invoice.failedToPay', listener: (invoice: string) => void): this;
  emit(event: 'invoice.failedToPay', invoice: string): boolean;

  on(event: 'zeroconf.rejected', listener: (invoice: string, reason: string) => void): this;
  emit(event: 'zeroconf.rejected', invoice: string, reason: string): boolean;

  // Reverse swap related events
  on(event: 'coins.sent', listener: (invoice: string, lockupTransactionId: string, minerFee: number) => void): this;
  emit(event: 'coins.sent', invoice: string, lockupTransactionId: string, minerFee: number): boolean;

  on(event: 'refund', listener: (lockupTransactionId: string, lockupVout: number, minerFee: number) => void): this;
  emit(event: 'refund', lockupTransactionId: string, lockupVout: number, minerFee: number): boolean;
}

// TODO: make sure swaps work after restarts (save to and read from database)
class SwapNursery extends EventEmitter {
  private maps = new Map<string, SwapMaps>();
  private lndClients = new Map<string, LndClient>();
  private chainClients = new Map<string, ChainClient>();

  constructor(private logger: Logger, private walletManager: WalletManager) {
    super();
  }

  public addSwap = (
    maps: SwapMaps,
    details: SwapDetails,
    rawOutputScript: Buffer,
    timeoutBlockHeight: number,
  ) => {
    const outputScript = getHexString(rawOutputScript);
    maps.swaps.set(outputScript, details);

    const swapTimeouts = maps.swapTimeouts.get(timeoutBlockHeight);

    if (swapTimeouts) {
      swapTimeouts.push(outputScript);
    } else {
      maps.swapTimeouts.set(timeoutBlockHeight, [outputScript]);
    }
  }

  public addReverseSwap = (
    details: ReverseSwapDetails,
    invoice: string,
    timeoutBlockHeight: number,
  ) => {
    const sendingMaps = this.maps.get(details.sendingSymbol)!;
    const receivingMaps = this.maps.get(details.receivingSymbol)!;

    receivingMaps.reverseSwaps.set(invoice, details);

    const minimalDetails = { invoice, receivingSymbol: details.receivingSymbol };
    const pendingReverseSwaps = sendingMaps.reverseSwapTimeouts.get(timeoutBlockHeight);

    if (pendingReverseSwaps) {
      pendingReverseSwaps.push(minimalDetails);
    } else {
      sendingMaps.reverseSwapTimeouts.set(timeoutBlockHeight, [minimalDetails]);
    }
  }

  public bindCurrency = (currency: Currency, maps: SwapMaps) => {
    const { chainClient, lndClient } = currency;
    const { symbol } = chainClient;

    this.maps.set(symbol, maps);
    this.chainClients.set(symbol, chainClient);

    if (lndClient) {
      this.lndClients.set(symbol, lndClient);
    }

    chainClient.on('transaction', async (transaction: Transaction, confirmed: boolean) => {
      let zeroConfRejectedReason: string | undefined = undefined;

      // Boltz does some extra checks on transactions that are not confirmed yet to make sure they are not malicious
      if (!confirmed) {
        // Check if the transaction signals RBF
        const signalsRbf = await this.transactionSignalsRbf(chainClient, transaction);

        if (signalsRbf) {
          zeroConfRejectedReason = 'transaction or one of its unconfirmed ancestors signals RBF';
        } else {
          // Check if the transaction has a high enough fee to be confirmed in a timely manner
          const estimationFeePerVbyte = await chainClient.estimateFee();

          const transactionFee = await this.calculateTransactionFee(transaction, chainClient);
          const transactionFeePerVbyte = transactionFee / transaction.virtualSize();

          // If the transaction fee is less than 80% of the estimation, Boltz will wait for a confirmation
          //
          // Special case: if the fee estimator is returning the lowest possible fee, 2 sat/vbyte, every fee
          // paid by the transaction will be accepted
          if (
            transactionFeePerVbyte / estimationFeePerVbyte < 0.8 &&
            estimationFeePerVbyte !== 2
          ) {
            zeroConfRejectedReason = 'transaction fee is too low';
          }
        }
      }

      let vout = 0;

      for (const openOutput of transaction.outs) {
        const output = openOutput as TxOutput;

        const hexScript = getHexString(output.script);
        const swapDetails = maps.swaps.get(hexScript);

        if (swapDetails) {
          if (zeroConfRejectedReason !== undefined) {
            this.logger.warn(`Rejected 0-conf ${chainClient.symbol} transaction ${transaction.getId()}: ${zeroConfRejectedReason}`);
            this.emit('zeroconf.rejected', swapDetails.invoice, zeroConfRejectedReason);

          } else if (confirmed || swapDetails.acceptZeroConf) {
            if (!confirmed) {
              this.logger.silly(`Accepted 0-conf ${chainClient.symbol} swap: ${transaction.getId()}:${vout}`);
            }

            maps.swaps.delete(hexScript);

            await this.claimSwap(
              currency,
              transaction.getHash(),
              output.script,
              output.value,
              vout,
              swapDetails,
            );
          }

        }

        vout += 1;
      }

      for (let i = 0; i < transaction.ins.length; i += 1) {
        const input = transaction.ins[i];

        const inputTransactionId = transactionHashToId(input.hash);
        const reverseSwapSentInfo = maps.reverseSwapTransactions.get(inputTransactionId);

        if (reverseSwapSentInfo !== undefined) {
          await this.settleReverseSwap(
            transaction,
            i,
            reverseSwapSentInfo.receivingSymbol,
          );

          maps.reverseSwapTransactions.delete(inputTransactionId);

          const receivingMaps = this.maps.get(reverseSwapSentInfo.receivingSymbol)!;
          receivingMaps.reverseSwaps.delete(reverseSwapSentInfo.invoice);
        }
      }
    });

    chainClient.on('block', async (height: number) => {
      const swapTimeouts = maps.swapTimeouts.get(height);

      if (swapTimeouts) {
        swapTimeouts.forEach((outputScript) => {
          const swap = maps.swaps.get(outputScript);

          if (swap) {
            this.logger.verbose(`Aborting swap: ${swap.invoice}`);
            this.emit('expiration', swap.invoice, false);

            maps.swaps.delete(outputScript);
          }
        });

        maps.swapTimeouts.delete(height);
      }

      const reverseSwapInvoices = maps.reverseSwapTimeouts.get(height);

      if (reverseSwapInvoices) {
        await this.handleExpiredReverseSwaps(currency, maps, reverseSwapInvoices, height);
        maps.reverseSwapTimeouts.delete(height);
      }
    });

    if (lndClient !== undefined) {
      lndClient.on('htlc.accepted', async (invoice: string) => {
        const reverseSwapDetails = maps.reverseSwaps.get(invoice);

        if (reverseSwapDetails) {
          await this.sendReverseSwapCoins(
            invoice,
            reverseSwapDetails,
            maps,
          );
        }
      });
    }
  }

  private claimSwap = async (
    currency: Currency,
    transactionHash: Buffer,
    outputScript: Buffer,
    outputValue: number,
    vout: number,
    details: SwapDetails,
  ) => {
    const transactionId = transactionHashToId(transactionHash);
    const swapOutput = `${transactionId}:${vout}`;

    if (outputValue < details.expectedAmount) {
      this.logger.error(`Aborting ${currency.symbol} swap: value ${outputValue} of ${swapOutput} is less than expected ${details.expectedAmount}`);
      return;
    }

    this.logger.verbose(`Claiming ${currency.symbol} swap output: ${swapOutput}`);

    const preimage = await this.payInvoice(currency.lndClient!, details.invoice);

    if (preimage) {
      this.logger.silly(`Got ${currency.symbol} preimage: ${getHexString(preimage)}`);

      const destinationAddress = await this.getNewAddress(currency.symbol);

      const claimTx = constructClaimTransaction(
        [{
          vout,
          preimage,
          value: outputValue,
          script: outputScript,
          txHash: transactionHash,
          keys: details.claimKeys,
          type: details.outputType,
          redeemScript: details.redeemScript,
        }],
        address.toOutputScript(destinationAddress, currency.network),
        await currency.chainClient.estimateFee(),
        true,
      );
      const minerFee = await this.calculateTransactionFee(claimTx, currency.chainClient, outputValue);

      this.logger.silly(`Broadcasting ${currency.symbol} claim transaction: ${claimTx.getId()}`);

      await currency.chainClient.sendRawTransaction(claimTx.toHex());
      this.emit('claim', transactionId, vout, minerFee);
    }
  }

  private sendReverseSwapCoins = async (
    invoice: string,
    details: ReverseSwapDetails,
    receivingMaps: SwapMaps,
  ) => {
    const { sendingSymbol } = details;
    const { address, amount } = details.sendingDetails;

    const chainClient = this.chainClients.get(sendingSymbol)!;

    const wallet = this.walletManager.wallets.get(sendingSymbol)!;

    // TODO: handle errors
    const { fee, vout, transaction, transactionId } = await wallet.sendToAddress(address, amount);
    this.logger.verbose(`Locked up ${sendingSymbol} to reverse swap in transaction: ${transactionId}`);

    chainClient.updateInputFilter([transaction.getHash()]);

    details.output = {
      vout,
      value: amount,
      type: details.outputType,
      txHash: transaction.getHash(),
      script: wallet.decodeAddress(address),
    };
    receivingMaps.reverseSwaps.set(invoice, details);

    const sendingMaps = this.maps.get(sendingSymbol)!;
    sendingMaps.reverseSwapTransactions.set(transactionId, { invoice, receivingSymbol: details.receivingSymbol });

    this.emit('coins.sent', invoice, transactionId, fee);
  }

  private settleReverseSwap = async (
    transaction: Transaction,
    vin: number,
    receivingSymbol: string,
  ) => {
    const preimage = detectPreimage(vin, transaction);
    this.logger.verbose(`Got preimage of reverse swap: ${getHexString(preimage)}`);

    await this.lndClients.get(receivingSymbol)!.settleInvoice(preimage);
  }

  private handleExpiredReverseSwaps = async (
    currency: Currency,
    sendingMaps: SwapMaps,
    reverseSwapInvoices: MinimalReverseSwapDetails[],
    timeoutBlockHeight: number,
  ) => {
    for (const { invoice, receivingSymbol } of reverseSwapInvoices) {
      const reiceivingMaps = this.maps.get(receivingSymbol)!;
      const details = reiceivingMaps.reverseSwaps.get(invoice);

      if (details !== undefined) {
        if (details.output !== undefined) {
          const transactionId = transactionHashToId(details.output.txHash);
          this.logger.info(`Refunding ${currency.symbol} reverse swap output: ${transactionId}:${details.output.vout}`);

          const destinationAddress = await this.getNewAddress(currency.symbol);

          const refundTx = constructRefundTransaction(
            [{
              ...details.output,
              keys: details.refundKeys,
              redeemScript: details.redeemScript,
            }],
            address.toOutputScript(destinationAddress, currency.network),
            timeoutBlockHeight,
            await currency.chainClient.estimateFee(),
          );
          const minerFee = await this.calculateTransactionFee(refundTx, currency.chainClient, details.output.value);

          sendingMaps.reverseSwapTransactions.delete(transactionId);
          reiceivingMaps.reverseSwaps.delete(invoice);

          this.logger.verbose(`Broadcasting ${currency.symbol} refund transaction: ${refundTx.getId()}`);

          try {
            await currency.chainClient.sendRawTransaction(refundTx.toHex());
            this.emit('refund', transactionId, details.output.vout, minerFee);
          } catch (error) {
            this.logger.warn(`Could not broadcast ${currency.symbol} refund transaction: ${error.message}`);
          }

          await this.cancelInvoice(this.lndClients.get(receivingSymbol)!, details.preimageHash);
        } else {
          reiceivingMaps.reverseSwaps.delete(invoice);

          this.logger.verbose(`Aborting reverse swap: ${invoice}`);
          this.emit('expiration', invoice, true);
        }
      }
    }
  }

  private cancelInvoice = (lndClient: LndClient, preimageHash: Buffer) => {
    this.logger.verbose(`Cancelling hold invoice with preimage hash: ${getHexString(preimageHash)}`);

    return lndClient.cancelInvoice(preimageHash);

  }

  private payInvoice = async (lndClient: LndClient, invoice: string) => {
    try {
      const response = await lndClient.sendPayment(invoice);

      this.emit('invoice.paid', invoice, response.paymentRoute.totalFeesMsat);

      return response.paymentPreimage;
    } catch (error) {
      this.logger.warn(`Could not pay ${lndClient.symbol} invoice ${invoice}: ${error}`);

      this.emit('invoice.failedToPay', invoice);
    }

    return;
  }

  /**
   * Gets the miner fee for a transaction
   * If `inputSum` is not set, the chainClient will be queried to get the sum of all inputs
   *
   * @param transaction the transaction that spends the inputs
   * @param chainClient the client for the chain of the transaction
   * @param inputSum the sum of all inputs of the transaction
   */
  private calculateTransactionFee = async (transaction: Transaction, chainClient: ChainClient, inputSum?: number) => {
    const queryInputSum = async () => {
      let queriedInputSum = 0;

      for (const input of transaction.ins) {
        const inputId = getHexString(reverseBuffer(input.hash));
        const rawInputTransaction = await chainClient.getRawTransaction(inputId);
        const inputTransaction = Transaction.fromHex(rawInputTransaction);

        const relevantOutput = inputTransaction.outs[input.index] as TxOutput;

        queriedInputSum += relevantOutput.value;
      }

      return queriedInputSum;
    };

    let fee = inputSum || await queryInputSum();

    transaction.outs.forEach((out) => {
      const output = out as TxOutput;
      fee -= output.value;
    });

    return fee;
  }

  /**
   * Detects whether the transaction signals RBF explicitly or inherently
   */
  private transactionSignalsRbf = async (chainClient: ChainClient, transaction: Transaction) => {
    // Check for explicit signalling
    const signalsExplicitly = transactionSignalsRbfExplicitly(transaction);

    if (signalsExplicitly) {
      return true;
    }

    // Check for inherited signalling from unconfirmed inputs
    for (const input of transaction.ins) {
      const inputId = getHexString(reverseBuffer(input.hash));
      const inputTransaction = await chainClient.getRawTransactionVerbose(inputId);

      if (!inputTransaction.confirmations) {
        const inputSingalsRbf = await this.transactionSignalsRbf(
          chainClient,
          Transaction.fromHex(inputTransaction.hex),
        );

        if (inputSingalsRbf) {
          return true;
        }
      }
    }

    return false;
  }

  private getNewAddress = (symbol: string) => {
    const wallet = this.walletManager.wallets.get(symbol)!;

    return wallet.newAddress();
  }
}

export default SwapNursery;
export {
  SwapMaps,
  SwapDetails,
  ReverseSwapDetails,
  MinimalReverseSwapDetails,
};
