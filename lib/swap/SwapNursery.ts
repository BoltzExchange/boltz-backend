import { BIP32Interface } from 'bip32';
import { EventEmitter } from 'events';
import { Transaction, address, TxOutput } from 'bitcoinjs-lib';
import { constructClaimTransaction, OutputType, TransactionOutput, constructRefundTransaction } from 'boltz-core';
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

type SwapMaps = {
  // A map between the output scripts and the swaps details
  swaps: Map<string, SwapDetails>;

  // A map between the timeout block heights and the output scripts of the normal swaps
  swapTimeouts: Map<number, string[]>;

  // A map between the timeout block heights and the reverse swaps details
  reverseSwaps: Map<number, ReverseSwapDetails[]>;
};

interface SwapNursery {
  // Swap related events
  on(event: 'claim', listener: (lockupTransactionId: string, lockupVout: number, minerFee: number) => void): this;
  emit(event: 'claim', lockupTransactionId: string, lockupVout: number, minerFee: number): boolean;

  on(event: 'abort', listener: (invoice: string) => void): this;
  emit(event: 'abort', invoice: string): boolean;

  on(event: 'invoice.failedToPay', listener: (invoice: string) => void): this;
  emit(event: 'invoice.failedToPay', invoice: string): boolean;

  on(event: 'zeroconf.rejected', listener: (invoice: string, reason: string) => void): this;
  emit(event: 'zeroconf.rejected', invoice: string, reason: string): boolean;

  // Reverse swap related events
  on(event: 'refund', listener: (lockupTransactionId: string, lockupVout: number, minerFee: number) => void): this;
  emit(event: 'refund', lockupTransactionId: string, lockupVout: number, minerFee: number): boolean;
}

// TODO: make sure swaps work after restarts
class SwapNursery extends EventEmitter {
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

  public bindCurrency = (currency: Currency, maps: SwapMaps) => {
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
              swapDetails.lndClient,
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
    });

    chainClient.on('block', async (height: number) => {
      const swapTimeouts = maps.swapTimeouts.get(height);

      if (swapTimeouts) {
        swapTimeouts.forEach((outputScript) => {
          const swap = maps.swaps.get(outputScript);

          if (swap) {
            this.logger.verbose(`Aborting swap: ${swap.invoice}`);
            this.emit('abort', swap.invoice);

            maps.swaps.delete(outputScript);
          }
        });

        maps.swapTimeouts.delete(height);
      }

      const reverseSwaps = maps.reverseSwaps.get(height);

      if (reverseSwaps) {
        await this.refundSwap(currency, reverseSwaps, height);
      }
    });
  }

  private claimSwap = async (
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
      this.logger.error(`Aborting ${currency.symbol} swap: value ${outputValue} of ${swapOutput} is less than expected ${details.expectedAmount}`);
      return;
    }

    this.logger.verbose(`Claiming ${currency.symbol} swap output: ${swapOutput}`);

    const preimage = await this.payInvoice(lndClient, details.invoice);

    if (preimage) {
      this.logger.silly(`Got ${currency.symbol} preimage: ${getHexString(preimage)}`);

      const destinationAddress = await this.walletManager.wallets.get(currency.symbol)!.getNewAddress(OutputType.Bech32);

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

      this.logger.silly(`Broadcasting ${currency.symbol} claim transaction: ${claimTx.getId()}`);

      await currency.chainClient.sendRawTransaction(claimTx.toHex());
      this.emit('claim', transactionId, vout, minerFee);
    }
  }

  // TODO: remove reverse swaps that succeeded
  private refundSwap = async (currency: Currency, reverseSwapDetails: ReverseSwapDetails[], timeoutBlockHeight: number) => {
    for (const details of reverseSwapDetails) {
      const transactionId = transactionHashToId(details.output.txHash);

      this.logger.info(`Refunding ${currency.symbol} swap output: ` +
      `${transactionId}:${details.output.vout}`);

      const destinationAddress = await this.walletManager.wallets.get(currency.symbol)!.getNewAddress(OutputType.Bech32);

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
        this.emit('refund', transactionId, details.output.vout, minerFee);
      } catch (error) {
        this.logger.warn(`Could not broadcast ${currency.symbol} refund transaction: ${error.message}`);
      }
    }
  }

  private payInvoice = async (lndClient: LndClient, invoice: string) => {
    try {
      const payRequest = await lndClient.sendPayment(invoice);

      if (payRequest.paymentError !== '') {
        throw payRequest.paymentError;
      }

      return Buffer.from(payRequest.paymentPreimage as string, 'base64');
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
}

export default SwapNursery;
export { SwapMaps, SwapDetails, ReverseSwapDetails };
