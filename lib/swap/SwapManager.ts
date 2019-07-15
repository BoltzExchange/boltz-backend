import { OutputType, Scripts, swapScript } from 'boltz-core';
import Errors from './Errors';
import Logger from '../Logger';
import { OrderSide } from '../consts/Enums';
import LndClient from '../lightning/LndClient';
import WalletManager, { Currency } from '../wallet/WalletManager';
import { getHexBuffer, getHexString, getScriptHashFunction } from '../Utils';
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
          swapTimeouts: new Map<number, string[]>(),

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
   * @param invoice the invoice that should be paid
   * @param expectedAmount amount that is expected onchain
   * @param refundPublicKey public key of the keypair needed for claiming
   * @param outputType what kind of address should be returned
   * @param timeoutBlockDelta after how many blocks the onchain script should time out
   * @param acceptZeroConf whether 0-conf transactions should be accepted
   */
  public createSwap = async (
    baseCurrency: string,
    quoteCurrency: string,
    orderSide: OrderSide,
    invoice: string,
    expectedAmount: number,
    refundPublicKey: Buffer,
    outputType: OutputType,
    timeoutBlockDelta: number,
    acceptZeroConf: boolean,
  ) => {
    const { sendingCurrency, receivingCurrency } = this.getCurrencies(baseCurrency, quoteCurrency, orderSide);

    this.logger.silly(`Sending ${sendingCurrency.symbol} on Lightning and receiving ${receivingCurrency.symbol} on the chain`);

    const { blocks } = await receivingCurrency.chainClient.getBlockchainInfo();
    const { paymentHash, numSatoshis, destination, routeHintsList } = await sendingCurrency.lndClient.decodePayReq(invoice);

    // If there are route hints the routability check could fail although the LND could pay the invoice
    if (routeHintsList.length === 0) {
      const routable = await this.checkRoutability(sendingCurrency.lndClient, destination, numSatoshis);

      if (!routable) {
        throw Errors.NO_ROUTE_FOUND();
      }
    }

    this.logger.verbose(`Creating new Swap from ${receivingCurrency.symbol} to ${sendingCurrency.symbol} with preimage hash: ${paymentHash}`);

    const { keys, index } = receivingCurrency.wallet.getNewKeys();

    const timeoutBlockHeight = blocks + timeoutBlockDelta;
    const redeemScript = swapScript(
      getHexBuffer(paymentHash),
      keys.publicKey,
      refundPublicKey,
      timeoutBlockHeight,
    );

    const encodeFunction = getScriptHashFunction(outputType);
    const outputScript = encodeFunction(redeemScript);

    this.nursery.addSwap(
      receivingCurrency,
      {
        invoice,
        outputType,
        redeemScript,
        acceptZeroConf,
        expectedAmount,
        claimKeys: keys,
        lndClient: sendingCurrency.lndClient,
      },
      outputScript,
      timeoutBlockHeight,
    );

    receivingCurrency.chainClient.updateOutputFilter([outputScript]);

    return {
      timeoutBlockHeight,
      keyIndex: index,
      redeemScript: getHexString(redeemScript),
      address: receivingCurrency.wallet.encodeAddress(outputScript),
    };
  }

  /**
   * Creates a new reverse Swap from Lightning to the chain
   *
   * @param baseCurrency base currency ticker symbol
   * @param quoteCurrency quote currency ticker symbol
   * @param orderSide whether the order is a buy or sell one
   * @param invoiceAmount amount of the invoice that should be generated
   * @param onchainAmount amount of coins that should be sent onchain
   * @param claimPublicKey public key of the keypair needed for claiming
   * @param timeoutBlockDelta after how many blocks the onchain script should time out
   */
  public createReverseSwap = async (
    baseCurrency: string,
    quoteCurrency: string,
    orderSide: OrderSide,
    invoiceAmount: number,
    onchainAmount: number,
    claimPublicKey: Buffer,
    timeoutBlockDelta: number,
  ) => {
    const { sendingCurrency, receivingCurrency } = this.getCurrencies(baseCurrency, quoteCurrency, orderSide);

    this.logger.silly(`Sending ${sendingCurrency.symbol} on the chain and receiving ${receivingCurrency.symbol} on Lightning`);
    this.logger.verbose(`Creating new reverse Swap from ${receivingCurrency.symbol} to ${sendingCurrency.symbol} ` +
      `for public key: ${getHexString(claimPublicKey)}`);

    const { rHash, paymentRequest } = await receivingCurrency.lndClient.addInvoice(invoiceAmount);
    const { keys, index } = sendingCurrency.wallet.getNewKeys();

    const { blocks } = await sendingCurrency.chainClient.getBlockchainInfo();
    const timeoutBlockHeight = blocks + timeoutBlockDelta;

    const redeemScript = swapScript(
      Buffer.from(rHash as string, 'base64'),
      claimPublicKey,
      keys.publicKey,
      timeoutBlockHeight,
    );

    const outputScript = p2wshOutput(redeemScript);
    const address = sendingCurrency.wallet.encodeAddress(outputScript);

    // TODO: listen for confirmation
    const { fee, vout, transaction } = await sendingCurrency.wallet.sendToAddress(address, OutputType.Bech32, true, onchainAmount);
    this.logger.debug(`Sending ${onchainAmount} on ${sendingCurrency.symbol} to swap address ${address}: ${transaction.getId()}:${vout}`);

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
        value: onchainAmount,
      },
    };

    // Push the new swap to the array or create a new array if it doesn't exist yet
    if (pendingReverseSwaps) {
      pendingReverseSwaps.push(reverseSwapDetails);
    } else {
      sendingCurrency.reverseSwaps.set(timeoutBlockHeight, [reverseSwapDetails]);
    }

    return {
      minerFee: fee,
      keyIndex: index,
      lockupAddress: address,
      invoice: paymentRequest,
      lockupTransaction: rawTx,
      redeemScript: getHexString(redeemScript),
      lockupTransactionId: transaction.getId(),
    };
  }

  /**
   * @returns whether the payment can be routed
   */
  private checkRoutability = async (lnd: LndClient, destination: string, satoshis: number) => {
    try {
      const routes = await lnd.queryRoutes(destination, satoshis);

      return routes.routesList.length > 0;
    } catch (error) {
      this.logger.debug(`Could not query routes: ${error}`);
      return false;
    }
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
}

export default SwapManager;
export { SwapMaps, SwapDetails, ReverseSwapDetails };
