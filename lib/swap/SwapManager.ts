import { OutputType, Scripts, pkRefundSwap } from 'boltz-core';
import Errors from './Errors';
import Logger from '../Logger';
import { OrderSide } from '../proto/boltzrpc_pb';
import WalletManager, { Currency } from '../wallet/WalletManager';
import { getHexBuffer, getHexString, getScriptHashEncodeFunction } from '../Utils';
import SwapNursery, { SwapMaps, SwapDetails, ReverseSwapDetails } from './SwapNursery';

const { p2wshOutput } = Scripts;

class SwapManager {
  public currencies = new Map<string, Currency & SwapMaps>();

  public nursery: SwapNursery;

  constructor(private logger: Logger, private walletManager: WalletManager, currencies: Currency[]) {
    this.nursery = new SwapNursery(this.logger, this.walletManager);

    currencies.forEach((currency) => {
      if (!this.currencies.get(currency.symbol)) {
        const swapMaps = {
          swaps: new Map<string, SwapDetails>(),
          reverseSwaps: new Map<number, ReverseSwapDetails[]>(),
        };

        this.currencies.set(currency.symbol, {
          ...currency,
          ...swapMaps,
        });

        this.nursery.bindCurrency(currency, swapMaps);
      }
    });
  }

  /**
   * Creates a new Swap from the chain to Lightning
   *
   * @param baseCurrency base currency ticker symbol
   * @param quoteCurrency quote currency ticker symbol
   * @param orderSide whether the order is a buy or sell one
   * @param rate conversion rate of base and quote currency
   * @param fee additional amount that the user has to pay
   * @param invoice the invoice that should be paid
   * @param refundPublicKey public key of the keypair needed for claiming
   * @param outputType what kind of adress should be returned
   * @param timeoutBlockNumber after how many blocks the onchain script should time out
   *
   * @returns an onchain address
   */
  public createSwap = async (baseCurrency: string, quoteCurrency: string, orderSide: OrderSide, rate: number,
    fee: number, invoice: string, refundPublicKey: Buffer, outputType: OutputType, timeoutBlockNumber: number) => {

    const { sendingCurrency, receivingCurrency } = this.getCurrencies(baseCurrency, quoteCurrency, orderSide);

    this.logger.silly(`Sending ${sendingCurrency.symbol} on Lightning and receiving ${receivingCurrency.symbol} on the chain`);

    const bestBlock = await receivingCurrency.chainClient.getBestBlock();
    const { paymentHash, numSatoshis } = await sendingCurrency.lndClient.decodePayReq(invoice);

    this.logger.verbose(`Creating new Swap from ${receivingCurrency.symbol} to ${sendingCurrency.symbol} with preimage hash: ${paymentHash}`);

    const { keys } = receivingCurrency.wallet.getNewKeys();

    const timeoutBlockHeight = bestBlock.height + timeoutBlockNumber;
    const redeemScript = pkRefundSwap(
      getHexBuffer(paymentHash),
      keys.publicKey,
      refundPublicKey,
      timeoutBlockHeight,
    );

    const encodeFunction = getScriptHashEncodeFunction(outputType);
    const outputScript = encodeFunction(redeemScript);

    const address = receivingCurrency.wallet.encodeAddress(outputScript);
    const expectedAmount = this.calculateExpectedAmount(numSatoshis + fee, this.getRate(rate, orderSide));

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
    };
  }

  /**
   * Creates a new reverse Swap from Lightning to the chain
   *
   * @param baseCurrency base currency ticker symbol
   * @param quoteCurrency quote currency ticker symbol
   * @param orderSide whether the order is a buy or sell one
   * @param rate conversion rate of base and quote currency
   * @param fee additional amount that the user has to pay
   * @param claimPublicKey public key of the keypair needed for claiming
   * @param amount amount of the invoice
   * @param timeoutBlockNumber after how many blocks the onchain script should time out
   *
   * @returns a Lightning invoice, the lockup transaction and its hash
   */
  public createReverseSwap = async (baseCurrency: string, quoteCurrency: string, orderSide: OrderSide, rate: number,
    fee: number, claimPublicKey: Buffer, amount: number, timeoutBlockNumber: number) => {

    const { sendingCurrency, receivingCurrency } = this.getCurrencies(baseCurrency, quoteCurrency, orderSide);

    this.logger.silly(`Sending ${sendingCurrency.symbol} on the chain and receiving ${receivingCurrency.symbol} on Lightning`);
    this.logger.verbose(`Creating new reverse Swap from ${receivingCurrency.symbol} to ${sendingCurrency.symbol} ` +
      `for public key: ${getHexString(claimPublicKey)}`);

    const { rHash, paymentRequest } = await receivingCurrency.lndClient.addInvoice(amount);
    const { keys } = sendingCurrency.wallet.getNewKeys();

    const bestBlock = await sendingCurrency.chainClient.getBestBlock();
    const timeoutBlockHeight = bestBlock.height + timeoutBlockNumber;

    const redeemScript = pkRefundSwap(
      Buffer.from(rHash as string, 'base64'),
      claimPublicKey,
      keys.publicKey,
      timeoutBlockHeight,
    );

    const outputScript = p2wshOutput(redeemScript);
    const address = sendingCurrency.wallet.encodeAddress(outputScript);

    const sendingAmount = this.calculateExpectedAmount(amount - fee, 1 / this.getRate(rate, orderSide));

    const { vout, transaction } = await sendingCurrency.wallet.sendToAddress(address, OutputType.Bech32, true, sendingAmount);
    this.logger.debug(`Sending ${sendingAmount} on ${sendingCurrency.symbol} to swap address ${address}: ${transaction.getId()}:${vout}`);

    const rawTx = transaction.toHex();

    await sendingCurrency.chainClient.sendRawTransaction(rawTx);

    // Get the array of swaps that time out at the same block
    const pendingReverseSwaps = sendingCurrency.reverseSwaps.get(timeoutBlockHeight);

    const reverseSwapDetails = {
      redeemScript,
      refundKeys: keys,
      output: {
        vout,
        txHash: transaction.getHash(),
        type: OutputType.Bech32,
        script: outputScript,
        value: sendingAmount,
      },
    };

    // Push the new swap to the array or create a new array if it doesn't exist yet
    if (pendingReverseSwaps) {
      pendingReverseSwaps.push(reverseSwapDetails);
    } else {
      sendingCurrency.reverseSwaps.set(timeoutBlockHeight, [reverseSwapDetails]);
    }

    return {
      invoice: paymentRequest,
      redeemScript: getHexString(redeemScript),
      lockupAddress: address,
      lockupTransaction: rawTx,
      lockupTransactionHash: transaction.getId(),
    };
  }

  private getCurrencies = (baseCurrency: string, quoteCurrency: string, orderSide: OrderSide) => {
    const base = this.getCurrency(baseCurrency);
    const quote = this.getCurrency(quoteCurrency);

    const isBuy = orderSide === OrderSide.BUY;

    const sending = isBuy ? base : quote;
    const receiving = isBuy ? quote : base;

    return {
      sendingCurrency: {
        ...sending,
        wallet: this.walletManager.wallets.get(sending.symbol)!,
      },
      receivingCurrency: {
        ...receiving,
        wallet: this.walletManager.wallets.get(receiving.symbol)!,
      },
    };
  }

  private getCurrency = (currencySymbol: string) => {
    const currency = this.currencies.get(currencySymbol);

    if (!currency) {
      throw Errors.CURRENCY_NOT_FOUND(currencySymbol);
    }

    return currency;
  }

  private calculateExpectedAmount = (amount: number, rate: number) => {
    return Math.ceil(amount * rate);
  }

  private getRate = (rate: number, orderSide: OrderSide) => {
    return orderSide === OrderSide.BUY ? rate : 1 / rate;
  }
}

export default SwapManager;
export { SwapMaps, SwapDetails, ReverseSwapDetails };
