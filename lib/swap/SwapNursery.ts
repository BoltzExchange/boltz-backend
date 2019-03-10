import { BIP32 } from 'bip32';
import { EventEmitter } from 'events';
import { Transaction, address } from 'bitcoinjs-lib';
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
  claimKeys: BIP32;
  outputType: OutputType;
};

type ReverseSwapDetails = BaseSwapDetails & {
  refundKeys: BIP32;
  output: TransactionOutput;
};

type SwapMaps = {
  // A map between the output scripts and the swaps details
  swaps: Map<string, SwapDetails>;

  // A map between the timeout block heights and the reverse swaps details
  reverseSwaps: Map<number, ReverseSwapDetails[]>;
};

interface SwapNursery {
  on(event: 'refund', listener: (lockupTransactionHash: string) => void): this;
  emit(event: 'refund', lockupTransactionHash: string): boolean;

  on(event: 'invoice.failedToPay', listener: (invoice: string) => void): this;
  emit(event: 'invoice.failedToPay', invoice: string): boolean;
}

class SwapNursery extends EventEmitter {
  constructor(private logger: Logger, private walletManager: WalletManager) {
    super();
  }

  public bindCurrency = (currency: Currency, maps: SwapMaps) => {
    currency.chainClient.on('transaction.relevant.block', async (transaction: Transaction) => {
      let vout = 0;

      for (const output of transaction.outs) {
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
      const reverseSwaps = maps.reverseSwaps.get(height);

      if (reverseSwaps) {
        await this.refundSwap(currency, reverseSwaps, height);
      }
    });
  }

  private claimSwap = async (currency: Currency, lndClient: LndClient, txHash: Buffer,
    outputScript: Buffer, outputValue: number, vout: number, details: SwapDetails) => {

    const swapOutput = `${transactionHashToId(txHash)}:${vout}`;

    if (outputValue < details.expectedAmount) {
      this.logger.warn(`Value ${outputValue} of ${swapOutput} is less than expected ${details.expectedAmount}. ` +
        `Aborting ${currency.symbol} swap`);
      return;
    }

    this.logger.info(`Claiming ${currency.symbol} swap output: ${swapOutput}`);

    const preimage = await this.payInvoice(lndClient, details.invoice);

    if (preimage) {
      this.logger.silly(`Got ${currency.symbol} preimage: ${preimage}`);

      const destinationAddress = await this.walletManager.wallets.get(currency.symbol)!.getNewAddress(OutputType.Bech32);

      const claimTx = constructClaimTransaction(
        [{
          vout,
          txHash,
          value: outputValue,
          script: outputScript,
          keys: details.claimKeys,
          type: details.outputType,
          redeemScript: details.redeemScript,
          preimage: Buffer.from(preimage, 'base64'),
        }],
        address.toOutputScript(destinationAddress, currency.network),
        await currency.chainClient.estimateFee(),
        true,
      );

      this.logger.verbose(`Broadcasting ${currency.symbol} claim transaction: ${claimTx.getId()}`);
      await currency.chainClient.sendRawTransaction(claimTx.toHex());
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

      this.logger.verbose(`Broadcasting ${currency.symbol} refund transaction: ${refundTx.getId()}`);

      try {
        await currency.chainClient.sendRawTransaction(refundTx.toHex());
        this.emit('refund', transactionId);
      } catch (error) {
        this.logger.warn(`Could not broadcast ${currency.symbol} refund transaction: ${error.message}`);
      }
    }
  }

  private payInvoice = async (lndClient: LndClient, invoice: string) => {
    try {
      const payRequest = await lndClient.payInvoice(invoice);

      if (payRequest.paymentError !== '') {
        throw payRequest.paymentError;
      }

      return payRequest.paymentPreimage as string;
    } catch (error) {
      this.logger.warn(`Could not pay ${lndClient.symbol} invoice ${invoice}: ${error}`);

      this.emit('invoice.failedToPay', invoice);
    }

    return;
  }
}

export default SwapNursery;
export { SwapMaps, SwapDetails, ReverseSwapDetails };
