import { BIP32Interface } from 'bip32';
import { EventEmitter } from 'events';
import { Transaction, address, TxOutput } from 'bitcoinjs-lib';
import { constructClaimTransaction, OutputType, TransactionOutput, constructRefundTransaction } from 'boltz-core';
import Logger from '../Logger';
import LndClient from '../lightning/LndClient';
import { getHexString, transactionHashToId } from '../Utils';
import WalletManager, { Currency } from '../wallet/WalletManager';

type BaseSwapDetails = {
  redeemScript: Buffer;
};

type SwapDetails = BaseSwapDetails & {
  lndClient: LndClient;
  expectedAmount: number;
  invoice: string;
  claimKeys: BIP32Interface;
  outputType: OutputType;
};

type ReverseSwapDetails = BaseSwapDetails & {
  refundKeys: BIP32Interface;
  output: TransactionOutput;
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
  on(event: 'claim', listener: (lockupTransactionHash: string, lockupVout: number, minerFee: number) => void): this;
  emit(event: 'claim', lockupTransactionHash: string, lockupVout: number, minerFee: number): boolean;

  on(event: 'abort', listener: (invoice: string) => void): this;
  emit(event: 'abort', invoice: string): boolean;

  on(event: 'invoice.failedToPay', listener: (invoice: string) => void): this;
  emit(event: 'invoice.failedToPay', invoice: string): boolean;

  // Reverse swap related events
  on(event: 'refund', listener: (lockupTransactionHash: string, lockupVout: number, minerFee: number) => void): this;
  emit(event: 'refund', lockupTransactionHash: string, lockupVout: number, minerFee: number): boolean;
}

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
    currency.chainClient.on('transaction.relevant.block', async (transaction: Transaction) => {
      let vout = 0;

      for (const openOutput of transaction.outs) {
        const output = openOutput as TxOutput;

        const hexScript = getHexString(output.script);
        const swapDetails = maps.swaps.get(hexScript);

        if (swapDetails) {
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

        vout += 1;
      }
    });

    currency.chainClient.on('block', async (height: number) => {
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
      this.logger.warn(`Value ${outputValue} ${currency.symbol} of ${swapOutput} is less than expected ${details.expectedAmount}: ` +
        'aborting swap');
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
      const minerFee = this.getTransactionFee(outputValue, claimTx);

      this.logger.silly(`Broadcasting ${currency.symbol} claim transaction: ${claimTx.getId()}`);

      await currency.chainClient.sendRawTransaction(claimTx.toHex());
      this.emit('claim', transactionId, vout, minerFee);
    }
  }

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
      const minerFee = this.getTransactionFee(details.output.value, refundTx);

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

  private getTransactionFee = (inputValue: number, transaction: Transaction) => {
    let fee = inputValue;

    transaction.outs.forEach((out) => {
      const output = out as TxOutput;
      fee -= output.value;
    });

    return fee;
  }
}

export default SwapNursery;
export { SwapMaps, SwapDetails, ReverseSwapDetails };
