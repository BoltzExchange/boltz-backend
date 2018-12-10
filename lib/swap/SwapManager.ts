import { BIP32 } from 'bip32';
import { Transaction, crypto } from 'bitcoinjs-lib';
import { OutputType, TransactionOutput, Scripts, pkRefundSwap, constructClaimTransaction } from 'boltz-core';
import Logger from '../Logger';
import { getHexBuffer, getPairId, getHexString, getScriptHashEncodeFunction, reverseString } from '../Utils';
import Errors from './Errors';
import WalletManager, { Currency } from '../wallet/WalletManager';
import { OrderSide } from '../proto/boltzrpc_pb';
import LndClient from '../lightning/LndClient';
import { encodeBip21, getBip21Prefix } from './PaymentRequestUtils';

const { p2wpkhOutput, p2shP2wshOutput } = Scripts;

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

type Pair = {
  quote: Currency;
  base: Currency;
};

type SwapMaps = {
  // A map between an output script and the SwapDetails
  swaps: Map<string, SwapDetails>;

  // A map between an invoice and the ReverseSwapDetails
  reverseSwaps: Map<string, ReverseSwapDetails>;
};

// TODO: catch errors here not in GrpcServer
// TODO: custom rates
// TODO: configurable timeouts
// TODO: verify values and amounts
// TODO: fees for the Boltz to collect
// TODO: automatically refund failed swaps
class SwapManager {
  public currencies = new Map<string, Currency & SwapMaps>();

  private pairMap = new Map<string, { quote: string, base: string }>();

  private rates = new Map([['LTC/BTC', 0.008]]);

  constructor(private logger: Logger, private walletManager: WalletManager, private pairs: Pair[]) {
    this.pairs.forEach((pair) => {
      const entry = {
        quote: pair.quote.symbol,
        base: pair.base.symbol,
      };

      this.pairMap.set(getPairId(pair.quote.symbol, pair.base.symbol), entry);

      this.addToCurrencies(pair.base);
      this.addToCurrencies(pair.quote);
    });
  }

  /**
   * Creates a new Swap from the chain to Lightning
   *
   * @param pairId pair of the Swap
   * @param orderSide whether the order is a buy or sell one
   * @param invoice the invoice that should be paid
   * @param refundPublicKey public key of the keypair needed for claiming
   * @param outputType what kind of adress should be returned
   *
   * @returns an onchain address
   */
  public createSwap = async (pairId: string, orderSide: OrderSide, invoice: string, refundPublicKey: Buffer, outputType: OutputType) => {
    const { sendingCurrency, receivingCurrency } = this.getCurrencies(pairId, orderSide);

    this.logger.silly(`Sending ${sendingCurrency.symbol} on Lightning and receiving ${receivingCurrency.symbol} on the chain`);

    const bestBlock = await receivingCurrency.chainClient.getBestBlock();
    const { paymentHash, numSatoshis } = await sendingCurrency.lndClient.decodePayReq(invoice);

    this.logger.verbose(`Creating new Swap on ${pairId} with preimage hash: ${paymentHash}`);

    const { keys, index } = receivingCurrency.wallet.getNewKeys();

    // Listen to the address to which the swap output will be claimed
    await receivingCurrency.wallet.listenToOutput(p2wpkhOutput(crypto.hash160(keys.publicKey)), index, OutputType.Bech32);

    const timeoutBlockHeight = bestBlock.height + 10;
    const redeemScript = pkRefundSwap(
      getHexBuffer(paymentHash),
      keys.publicKey,
      refundPublicKey,
      timeoutBlockHeight,
    );

    const encodeFunction = getScriptHashEncodeFunction(outputType);
    const outputScript = encodeFunction(redeemScript);

    const address = receivingCurrency.wallet.encodeAddress(outputScript);
    const expectedAmount = numSatoshis * (1 / this.getRate(pairId, orderSide));

    receivingCurrency.swaps.set(getHexString(outputScript), {
      invoice,
      outputType,
      redeemScript,
      expectedAmount,
      claimKeys: keys,
      lndClient: sendingCurrency.lndClient,
    });

    await receivingCurrency.chainClient.loadTxFiler(false, [address], []);

    return {
      address,
      expectedAmount,
      timeoutBlockHeight,
      redeemScript: getHexString(redeemScript),
      bip21: encodeBip21(getBip21Prefix(receivingCurrency), address, expectedAmount, `Submarine Swap to ${sendingCurrency.symbol}`),
    };
  }

  /**
   * Creates a new reverse Swap from Lightning to the chain
   *
   * @param pairId pair of the Swap
   * @param orderSide whether the order is a buy or sell one
   * @param claimPublicKey public key of the keypair needed for claiming
   * @param amount the amount of the invoice
   *
   * @returns a Lightning invoice, the lockup transaction and its hash
   */
  public createReverseSwap = async (pairId: string, orderSide: OrderSide, claimPublicKey: Buffer, amount: number) => {
    const { sendingCurrency, receivingCurrency } = this.getCurrencies(pairId, orderSide);

    this.logger.silly(`Sending ${sendingCurrency.symbol} on the chain and receiving ${receivingCurrency.symbol} on Lightning`);
    this.logger.verbose(`Creating new reverse Swap on ${pairId} for public key: ${getHexString(claimPublicKey)}`);

    const { blocks } = await sendingCurrency.chainClient.getInfo();
    const { rHash, paymentRequest } = await receivingCurrency.lndClient.addInvoice(amount);

    const { keys } = sendingCurrency.wallet.getNewKeys();
    const redeemScript = pkRefundSwap(
      Buffer.from(rHash as string, 'base64'),
      claimPublicKey,
      keys.publicKey,
      blocks + 10,
    );

    const outputScript = p2shP2wshOutput(redeemScript);
    const address = sendingCurrency.wallet.encodeAddress(outputScript);

    const sendingAmount = amount * this.getRate(pairId, orderSide);

    this.logger.debug(`Sending ${sendingAmount} on ${sendingCurrency.symbol} to swap address: ${address}`);
    const { tx, vout } = await sendingCurrency.wallet.sendToAddress(address, OutputType.Compatibility, true, sendingAmount);
    const txHex = tx.toHex();

    await sendingCurrency.chainClient.sendRawTransaction(txHex);

    sendingCurrency.reverseSwaps.set(paymentRequest, {
      redeemScript,
      refundKeys: keys,
      output: {
        vout,
        txHash: tx.getHash(),
        type: OutputType.Compatibility,
        script: outputScript,
        value: sendingAmount,
      },
    });

    return {
      invoice: paymentRequest,
      redeemScript: getHexString(redeemScript),
      transaction: txHex,
      transactionHash: tx.getId(),
    };
  }

  private bindCurrency = (currency: Currency, maps: SwapMaps) => {
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
  }

  private claimSwap = async (currency: Currency, lndClient: LndClient,
    txHash: Buffer, outpuScript: Buffer, outputValue: number, vout: number, details: SwapDetails) => {

    const swapOutput = `${reverseString(getHexString(txHash))}:${vout}`;

    if (outputValue < details.expectedAmount) {
      this.logger.warn(`Value ${outputValue} of ${swapOutput} is less than expected ${details.expectedAmount}. Aborting swap`);
      return;
    }

    const { symbol, chainClient } = currency;

    // The ID of the transaction is used by wallets, block explorers and node software and is the reversed hash of the transaction
    this.logger.info(`Claiming swap output of ${symbol} transaction ${swapOutput}`);

    const payInvoice = await lndClient.payInvoice(details.invoice);

    if (payInvoice.paymentError !== '') {
      // TODO: retry and show error to the user
      this.logger.warn(`Could not pay invoice ${details.invoice}: ${payInvoice.paymentError}`);
      return;
    }

    const preimage = payInvoice.paymentPreimage as string;
    this.logger.verbose(`Got preimage: ${preimage}`);

    const destinationScript = p2wpkhOutput(crypto.hash160(details.claimKeys.publicKey));
    const feePerByte = await currency.chainClient.estimateFee(1);

    const claimTx = constructClaimTransaction(
      {
        preimage: Buffer.from(preimage, 'base64'),
        keys: details.claimKeys,
        redeemScript: details.redeemScript,
      },
      {
        txHash,
        vout,
        type: details.outputType,
        script: outpuScript,
        value: outputValue,
      },
      destinationScript,
      feePerByte,
    );

    this.logger.silly(`Broadcasting claim transaction: ${claimTx.getId()}`);

    await chainClient.sendRawTransaction(claimTx.toHex());
  }

  private getRate = (pairId: string, orderSide: OrderSide) => {
    const rate = this.rates.get(pairId);

    if (!rate) {
      throw Errors.PAIR_NOT_FOUND(pairId);
    }

    return orderSide === OrderSide.BUY ? rate : 1 / rate;
  }

  private getCurrencies = (pairId: string, orderSide: OrderSide) => {
    const pair = this.pairMap.get(pairId);

    if (!pair) {
      throw Errors.PAIR_NOT_FOUND(pairId);
    }

    const isBuy = orderSide === OrderSide.BUY;

    const sendingSymbol = isBuy ? pair.base : pair.quote;
    const receivingSymbol = isBuy ? pair.quote : pair.base;

    return {
      sendingCurrency: {
        ...this.currencies.get(sendingSymbol)!,
        wallet: this.walletManager.wallets.get(sendingSymbol)!,
      },
      receivingCurrency: {
        ...this.currencies.get(receivingSymbol)!,
        wallet: this.walletManager.wallets.get(receivingSymbol)!,
      },
    };
  }

  private addToCurrencies = (currency: Currency) => {
    if (!this.currencies.get(currency.symbol)) {
      const swapMaps = this.initCurrencyMap();

      this.currencies.set(currency.symbol, {
        ...currency,
        ...swapMaps,
      });

      this.bindCurrency(currency, swapMaps);
    }
  }

  private initCurrencyMap = (): SwapMaps => {
    return {
      swaps: new Map<string, SwapDetails>(),
      reverseSwaps: new Map<string, ReverseSwapDetails>(),
    };
  }
}

export default SwapManager;
export { Pair };
