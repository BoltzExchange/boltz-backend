import { EventEmitter } from 'events';
import { BIP32Interface } from 'bip32';
import { Output } from 'bitcoinjs-lib/types/transaction';
import { Transaction, address, TxOutput } from 'bitcoinjs-lib';
import {
  OutputType,
  detectPreimage,
  TransactionOutput,
  constructClaimTransaction,
  constructRefundTransaction,
 } from 'boltz-core';
import Logger from '../Logger';
import { SwapType } from '../consts/Enums';
import LndClient from '../lightning/LndClient';
import ChainClient from '../chain/ChainClient';
import WalletManager, { Currency } from '../wallet/WalletManager';
import { getHexString, reverseBuffer, transactionHashToId, transactionSignalsRbfExplicitly, getSwapName } from '../Utils';

type BaseSwapDetails = {
  redeemScript: Buffer;
};

type SwapDetails = BaseSwapDetails & {
  id: string;

  invoice: string;
  lndClient: LndClient;
  outputType: OutputType;
  expectedAmount: number;
  acceptZeroConf: boolean;
  claimKeys: BIP32Interface;
};

type ReverseSwapDetails = BaseSwapDetails & {
  output: TransactionOutput;
  refundKeys: BIP32Interface;
};

type RefundDetails = ReverseSwapDetails;

type ChainToChainSwapDetails = BaseSwapDetails & {
  id: string;

  outputScript: Buffer,
  outputType: OutputType;
  expectedAmount: number;
  acceptZeroConf: boolean;
  claimKeys: BIP32Interface;
  timeoutBlockHeight: number;
  currency: Currency & SwapMaps;

  lockupVout?: number;
  lockupTransaction?: Transaction;

  sendingDetails: BaseSwapDetails & {
    amountToSend: number;
    lockupAddress: string;
    outputType: OutputType;
    currency: Currency & SwapMaps;

    refundKeys: BIP32Interface;
    timeoutBlockHeight: number;

    lockupOutput?: TransactionOutput;
  },
};

type SwapMaps = {
  // A map between the output scripts and the swaps details
  swaps: Map<string, SwapDetails>;

  // A map between the timeout block heights and the output scripts of the normal swaps
  swapTimeouts: Map<number, string[]>;

  // A map between the timeout block heights and the reverse swaps details
  reverseSwaps: Map<number, ReverseSwapDetails[]>;

  // A map between the output scripts and the chain to chain swap details
  chainToChainSwaps: Map<string, ChainToChainSwapDetails>;

  // A map between the transaction IDs sent to chain to chain lockup addresses
  // and the corresponding chain to chain swap details
  chainToChainTransactionSent: Map<string, ChainToChainSwapDetails>;

  // A map between the timeout block height and the output scripts of chain to chain swaps
  chainToChainTimeouts: Map<number, string[]>;

  // A map between the timeout block height and the refund details of chain to chain swaps
  chainToChainRefunds: Map<number, RefundDetails[]>;
};

interface SwapNursery {
  // General events
  on(event: 'transaction.lockup.found', listener: (
    id: string, transaction: Transaction, vout: number, confirmed: boolean, zeroConfAccepted: boolean,
  ) => void): this;
  emit(event: 'transaction.lockup.found', id: string, transaction: Transaction, vout: number, confirmed: boolean, zeroConfAccepted: boolean): boolean;

  on(event: 'abort', listener: (id: string, error: string) => void): this;
  emit(event: 'abort', id: string, error: string): boolean;

  on(event: 'expiration', listener: (id: string) => void): this;
  emit(event: 'expiration', id: string): boolean;

  // Leave the preimage blank if it is a submarine swap (can be queried from LND)
  on(event: 'claim', listener: (id: string, minerFee: number, preimage?: string) => void): this;
  emit(event: 'claim', id: string, minerFee: number, preimage?: string): boolean;

  on(event: 'refund', listener: (lockupTransactionId: string, minerFee: number) => void): this;
  emit(event: 'refund', lockupTransactionId: string, minerFee: number): boolean;

  // Submarine swap related events
  on(event: 'invoice.paid', listener: (invoice: string, routingFee: number) => void): this;
  emit(event: 'invoice.paid', invoice: string, routingFee: number): boolean;

  on(event: 'invoice.failedToPay', listener: (invoice: string) => void): this;
  emit(event: 'invoice.failedToPay', invoice: string): boolean;

  // Chain to chain swap related events
  on(event: 'transaction.lockup.sent', listener: (id: string, transactionId: string, minerFee: number) => void): this;
  emit(event: 'transaction.lockup.sent', id: string, transactionId: string, minerFee: number): boolean;
}

// TODO: abort chain to chain swaps even if no coins were sent
// TODO: make sure swaps work after restarts
class SwapNursery extends EventEmitter {
  private swapMaps = new Map<string, SwapMaps>();

  constructor(
    private logger: Logger,
    private walletManager: WalletManager,
  ) {
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
    maps: SwapMaps,
    details: ReverseSwapDetails,
    timeoutBlockHeight: number,
  ) => {
    const pendingReverseSwaps = maps.reverseSwaps.get(timeoutBlockHeight);

    if (pendingReverseSwaps) {
      pendingReverseSwaps.push(details);
    } else {
      maps.reverseSwaps.set(timeoutBlockHeight, [details]);
    }
  }

  public addChainToChainSwap = (
    sendingCurrency: SwapMaps,
    receivingCurrency: SwapMaps,
    details: ChainToChainSwapDetails,
  ) => {
    const outputScript = getHexString(details.outputScript);
    receivingCurrency.chainToChainSwaps.set(outputScript, details);

    const addTimeoutBlockHeight = (maps: SwapMaps, timeoutBlockHeight: number) => {
      const chainToChainSwapTimeouts = maps.chainToChainTimeouts.get(timeoutBlockHeight);

      if (chainToChainSwapTimeouts) {
        chainToChainSwapTimeouts.push(outputScript);
      } else {
        maps.chainToChainTimeouts.set(timeoutBlockHeight, [outputScript]);
      }
    };

    addTimeoutBlockHeight(receivingCurrency, details.timeoutBlockHeight);
    addTimeoutBlockHeight(sendingCurrency, details.sendingDetails.timeoutBlockHeight);
  }

  public bindCurrency = (currency: Currency, maps: SwapMaps) => {
    this.swapMaps.set(currency.symbol, maps);

    const { chainClient } = currency;

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

      for (let vout = 0; vout < transaction.outs.length; vout += 1) {
        const output = transaction.outs[vout] as TxOutput;
        const hexScript = getHexString(output.script);

        const swapDetails = maps.swaps.get(hexScript);

        if (swapDetails) {
          const zeroConfAccepted = zeroConfRejectedReason === undefined && swapDetails.acceptZeroConf;
          this.emit('transaction.lockup.found', swapDetails.id, transaction, vout, confirmed, zeroConfAccepted);

          if (!zeroConfAccepted) {
            this.logZeroConfRejected(SwapType.Submarine, chainClient.symbol, transaction, vout, zeroConfRejectedReason as string);
          } else if (confirmed || swapDetails.acceptZeroConf) {
            if (!confirmed) {
              this.logZeroConfAccepted(SwapType.Submarine, chainClient.symbol, transaction, vout);
            }

            maps.swaps.delete(hexScript);

            await this.claimSubmarineSwap(
              swapDetails.id,
              currency,
              swapDetails.lndClient,
              transaction.getHash(),
              output.script,
              output.value,
              vout,
              swapDetails,
            );
          }
        }

        const chainToChainSwapDetails = maps.chainToChainSwaps.get(hexScript);

        if (chainToChainSwapDetails) {
          const zeroConfAccepted = zeroConfRejectedReason === undefined && chainToChainSwapDetails.acceptZeroConf;
          this.emit('transaction.lockup.found', chainToChainSwapDetails.id, transaction, vout, confirmed, zeroConfAccepted);

          if (zeroConfRejectedReason !== undefined && chainToChainSwapDetails.acceptZeroConf) {
            this.logZeroConfRejected(SwapType.ChainToChain, chainClient.symbol, transaction, vout, zeroConfRejectedReason);
          } else if (confirmed || chainToChainSwapDetails.acceptZeroConf) {
            if (!confirmed) {
              this.logZeroConfAccepted(SwapType.ChainToChain, chainClient.symbol, transaction, vout);
            }

            chainToChainSwapDetails.lockupVout = vout;
            chainToChainSwapDetails.lockupTransaction = transaction;

            await this.sendChainToChainTransaction(chainToChainSwapDetails, transaction, vout);
          }
        }
      }

      for (let vin = 0; vin < transaction.ins.length; vin += 1) {
        const inputId = getHexString(reverseBuffer(transaction.ins[vin].hash));

        const chainToChainSwapDetails = maps.chainToChainTransactionSent.get(inputId);

        if (chainToChainSwapDetails) {
          const lockupOuput = chainToChainSwapDetails.sendingDetails.lockupOutput;

          if (lockupOuput && vin === lockupOuput.vout) {
            const preimage = detectPreimage(vin, transaction);
            const preimageString = getHexString(preimage);

            this.logger.debug(`Found preimage of chain to chain swap ${chainToChainSwapDetails.id} in ${transaction.getId()}:${vin}: ` +
              `${preimageString}`);

            maps.chainToChainTransactionSent.delete(inputId);
            maps.chainToChainSwaps.delete(getHexString(chainToChainSwapDetails.outputScript));

            await this.claimChainToChainOutput(chainToChainSwapDetails, preimage);
          }
        }
      }
    });

    chainClient.on('block', async (height: number) => {
      const swapTimeouts = maps.swapTimeouts.get(height);

      if (swapTimeouts) {
        swapTimeouts.forEach((outputScript) => {
          const swap = maps.swaps.get(outputScript);

          if (swap) {
            this.emit('expiration', swap.id);

            maps.swaps.delete(outputScript);
          }
        });

        maps.swapTimeouts.delete(height);
      }

      const reverseSwaps = maps.reverseSwaps.get(height);

      if (reverseSwaps) {
        await this.refundSwap(currency, reverseSwaps, height);
      }

      const chainToChainSwapTimeouts = maps.chainToChainTimeouts.get(height);

      if (chainToChainSwapTimeouts) {
        for (const outputScript of chainToChainSwapTimeouts) {
          const chainToChainSwap = maps.chainToChainSwaps.get(outputScript);

          if (chainToChainSwap) {
            maps.chainToChainSwaps.delete(outputScript);

            if (chainToChainSwap.sendingDetails.lockupOutput !== undefined) {
              const { chainToChainRefunds, chainToChainTransactionSent } = chainToChainSwap.sendingDetails.currency;
              chainToChainTransactionSent.delete(transactionHashToId(chainToChainSwap.sendingDetails.lockupOutput.txHash));

              const { blocks } = await chainToChainSwap.sendingDetails.currency.chainClient.getBlockchainInfo();

              const refundDetails: RefundDetails = {
                ...chainToChainSwap.sendingDetails,
                output: chainToChainSwap.sendingDetails.lockupOutput,
              };

              // Refund directly if the timeout has expired
              if (blocks >= chainToChainSwap.sendingDetails.timeoutBlockHeight) {
                await this.refundSwap(chainToChainSwap.sendingDetails.currency, [refundDetails], chainToChainSwap.sendingDetails.timeoutBlockHeight);
              } else {
                const existingRefunds = chainToChainRefunds.get(chainToChainSwap.sendingDetails.timeoutBlockHeight);

                if (existingRefunds) {
                  existingRefunds.push(refundDetails);
                } else {
                  chainToChainRefunds.set(chainToChainSwap.sendingDetails.timeoutBlockHeight, [refundDetails]);
                }

                this.logger.verbose(`Chain to chain swap ${chainToChainSwap.id} expired. ` +
                `Refunding sent ${chainToChainSwap.sendingDetails.currency.symbol} coins at block: ${chainToChainSwap.sendingDetails.timeoutBlockHeight}`);
              }
            } else {
              this.emit('expiration', chainToChainSwap.id);
            }
          }

        }

        maps.chainToChainTimeouts.delete(height);
      }

      const chainToChainRefunds = maps.chainToChainRefunds.get(height);

      if (chainToChainRefunds) {
        await this.refundSwap(currency, chainToChainRefunds, height);
      }
    });
  }

  private claimSubmarineSwap = async (
    id: string,
    currency: Currency,
    lndClient: LndClient,
    txHash: Buffer,
    outputScript: Buffer,
    outputValue: number,
    vout: number,
    details: SwapDetails,
  ) => {
    const transactionId = transactionHashToId(txHash);
    const swapOutput = `${transactionId}:${vout}`;

    if (outputValue < details.expectedAmount) {
      this.abortSwap(SwapType.ChainToChain, id, `value ${outputValue} of ${swapOutput} is less than expected ${details.expectedAmount}`);
      return;
    }

    this.logger.verbose(`Claiming ${currency.symbol} swap output: ${swapOutput}`);

    const preimage = await this.payInvoice(lndClient, details.invoice);

    if (preimage) {
      this.logger.silly(`Got ${currency.symbol} preimage: ${getHexString(preimage)}`);

      const destinationAddress = await this.getNewAddress(currency.symbol);

      const claimTx = constructClaimTransaction(
        [{
          vout,
          txHash,
          preimage,
          value: outputValue,
          script: outputScript,
          keys: details.claimKeys,
          type: details.outputType,
          redeemScript: details.redeemScript,
        }],
        address.toOutputScript(destinationAddress, currency.network),
        await currency.chainClient.estimateFee(),
        true,
      );
      const minerFee = await this.calculateTransactionFee(claimTx, currency.chainClient, outputValue);

      this.logger.debug(`Broadcasting ${currency.symbol} claim transaction: ${claimTx.getId()}`);

      await currency.chainClient.sendRawTransaction(claimTx.toHex());
      this.emit('claim', id, minerFee);
    }
  }

  // TODO: refund all swaps at once
  // TODO: remove reverse swaps of which the invoice got paid
  private refundSwap = async (currency: Currency, refundDetails: RefundDetails[], timeoutBlockHeight: number) => {
    for (const details of refundDetails) {
      const transactionId = transactionHashToId(details.output.txHash);

      this.logger.info(`Refunding ${currency.symbol} swap output: ${transactionId}:${details.output.vout}`);

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

      this.logger.verbose(`Broadcasting ${currency.symbol} refund transaction: ${refundTx.getId()}`);

      try {
        await currency.chainClient.sendRawTransaction(refundTx.toHex());
        this.emit('refund', transactionId, minerFee);
      } catch (error) {
        this.logger.warn(`Could not broadcast ${currency.symbol} refund transaction: ${error.message}`);
      }
    }
  }

  private sendChainToChainTransaction = async (
    chainToChainSwapDetails: ChainToChainSwapDetails,
    lockupTransaction: Transaction,
    lockupVout: number,
  ) => {
    const output = lockupTransaction.outs[lockupVout] as TxOutput;

    if (output.value < chainToChainSwapDetails.expectedAmount) {
      this.abortSwap(
        SwapType.ChainToChain,
        chainToChainSwapDetails.id,
        `value ${output.value} of ${lockupTransaction.getId()}:${lockupVout} is less than expected ${chainToChainSwapDetails.expectedAmount}`,
      );

      return;
    }

    const {
      currency,
      outputType,
      amountToSend: amoutToSend,
      lockupAddress,
    } = chainToChainSwapDetails.sendingDetails;

    const wallet = this.walletManager.wallets.get(currency.symbol)!;

    const { fee, vout, transaction } = await wallet.sendToAddress(lockupAddress, outputType, true, amoutToSend);
    const transactionId = transaction.getId();

    currency.chainClient.updateInputFilter([transaction.getHash()]);

    chainToChainSwapDetails.sendingDetails.lockupOutput = {
      ...transaction.outs[vout] as Output,
      vout,
      type: outputType,
      txHash: transaction.getHash(),
    };

    const { chainToChainTransactionSent } = this.swapMaps.get(currency.symbol)!;
    chainToChainTransactionSent.set(transactionId, chainToChainSwapDetails);

    await currency.chainClient.sendRawTransaction(transaction.toHex());

    this.logger.debug(`Sent ${amoutToSend} ${currency.symbol} to chain to chain swap address ${lockupAddress}: ${transactionId}:${vout}`);

    this.emit('transaction.lockup.sent', chainToChainSwapDetails.id, transaction.getId(), fee);
  }

  private claimChainToChainOutput = async (chainToChainSwapDetails: ChainToChainSwapDetails, preimage: Buffer) => {
    const {
      currency,
      claimKeys,
      lockupVout,
      outputType,
      redeemScript,
      lockupTransaction,
    } = chainToChainSwapDetails;

    const wallet = this.walletManager.wallets.get(currency.symbol)!;
    const destinationAddress = await wallet.getNewAddress(wallet.supportsSegwit ? OutputType.Bech32 : OutputType.Legacy);

    const lockupOutput = lockupTransaction!.outs[lockupVout!] as TxOutput;

    const claimTransaction = constructClaimTransaction(
      [{
        preimage,
        redeemScript,
        keys: claimKeys,
        type: outputType,
        vout: lockupVout!,
        value: lockupOutput.value,
        script: lockupOutput.script,
        txHash: lockupTransaction!.getHash(),
      }],
      address.toOutputScript(destinationAddress, currency.network),
      await currency.chainClient.estimateFee(),
      true,
    );

    const minerFee = await this.calculateTransactionFee(claimTransaction, currency.chainClient, lockupOutput.value);

    this.logger.debug(`Broadcasting ${currency.symbol} claim transaction: ${claimTransaction.getId()}`);
    await currency.chainClient.sendRawTransaction(claimTransaction.toHex());

    this.emit('claim', chainToChainSwapDetails.id, minerFee, getHexString(preimage));
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
    const outputType = wallet.supportsSegwit ? OutputType.Bech32 : OutputType.Legacy;

    return wallet.getNewAddress(outputType);
  }

  private abortSwap = (type: SwapType, id: string, reason: string) => {
    this.logger.verbose(`Aborting ${getSwapName(type)} swap ${id}: ${reason}`);

    this.emit('abort', id, reason);
  }

  private logZeroConfRejected = (type: SwapType, symbol: string, transaction: Transaction, vout: number, reason: string) => {
    this.logger.warn(`Rejected 0-conf ${symbol} ${getSwapName(type)} swap transaction ${transaction.getId()}:${vout}: ${reason}`);
  }

  private logZeroConfAccepted = (type: SwapType, symbol: string, transaction: Transaction, vout: number) => {
    this.logger.verbose(`Accepted 0-conf ${symbol} ${getSwapName(type)} swap transaction: ${transaction.getId()}:${vout}`);
  }
}

export default SwapNursery;
export { SwapMaps, SwapDetails, ReverseSwapDetails, RefundDetails, ChainToChainSwapDetails };
