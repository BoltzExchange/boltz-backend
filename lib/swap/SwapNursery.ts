import { BIP32 } from 'bip32';
import { Transaction, address } from 'bitcoinjs-lib';
import { constructClaimTransaction, OutputType, TransactionOutput, constructRefundTransaction } from 'boltz-core';
import Logger from '../Logger';
import LndClient from '../lightning/LndClient';
import { getHexString, reverseString } from '../Utils';
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

class SwapNursery {
  constructor(private logger: Logger, private walletManager: WalletManager) {}

  public bindCurrency = (currency: Currency, maps: SwapMaps) => {
    currency.chainClient.on('transaction.relevant.block', async (transactionHex: string) => {
      const transaction = Transaction.fromHex(transactionHex);

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

    currency.chainClient.on('block.connected', async (height: number) => {
      const reverseSwaps = maps.reverseSwaps.get(height);

      if (reverseSwaps) {
        await this.refundSwap(currency, reverseSwaps, height);
      }
    });
  }

  private claimSwap = async (currency: Currency, lndClient: LndClient, txHash: Buffer,
    outputScript: Buffer, outputValue: number, vout: number, details: SwapDetails) => {

    const swapOutput = `${this.getTransactionId(txHash)}:${vout}`;

    if (outputValue < details.expectedAmount) {
      this.logger.warn(`Value ${outputValue} of ${swapOutput} is less than expected ${details.expectedAmount}. Aborting swap`);
      return;
    }

    this.logger.info(`Claiming ${currency.symbol} swap output: ${swapOutput}`);

    const payInvoice = await lndClient.payInvoice(details.invoice);

    if (payInvoice.paymentError !== '') {
      this.logger.warn(`Could not pay invoice ${details.invoice}: ${payInvoice.paymentError}`);
      return;
    }

    const preimage = payInvoice.paymentPreimage as string;
    this.logger.debug(`Got preimage: ${preimage}`);

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
      1,
      true,
    );

    this.logger.verbose(`Broadcasting claim transaction: ${claimTx.getId()}`);
    await currency.chainClient.sendRawTransaction(claimTx.toHex());
  }

  private refundSwap = async (currency: Currency, reverseSwapDetails: ReverseSwapDetails[], timeoutBlockHeight: number) => {
    for (const details of reverseSwapDetails) {
      this.logger.info(`Refunding ${currency.symbol} swap output: ` +
      `${this.getTransactionId(details.output.txHash)}:${details.output.vout}`);

      const destinationAddress = await this.walletManager.wallets.get(currency.symbol)!.getNewAddress(OutputType.Bech32);

      const refundTx = constructRefundTransaction(
        [{
          ...details.output,
          keys: details.refundKeys,
          redeemScript: details.redeemScript,
        }],
        address.toOutputScript(destinationAddress, currency.network),
        timeoutBlockHeight,
        1,
      );

      this.logger.verbose(`Broadcasting refund transaction: ${refundTx.getId()}`);

      try {
        await currency.chainClient.sendRawTransaction(refundTx.toHex());
      } catch (error) {
        this.logger.warn(`Could not broadcast refund transaction: ${error}`);
      }
    }
  }

  private getTransactionId = (hash: Buffer) => {
    return reverseString(getHexString(hash));
  }
}

export default SwapNursery;
export { SwapMaps, SwapDetails, ReverseSwapDetails };
