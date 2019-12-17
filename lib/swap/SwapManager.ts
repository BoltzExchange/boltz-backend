import { OutputType, swapScript } from 'boltz-core';
import Errors from './Errors';
import Logger from '../Logger';
import { OrderSide } from '../consts/Enums';
import LndClient from '../lightning/LndClient';
import WalletManager, { Currency } from '../wallet/WalletManager';
import SwapNursery, { SwapMaps, SwapDetails, ReverseSwapDetails } from './SwapNursery';
import { getHexBuffer, getHexString, getScriptHashFunction, getSwapMemo, getSendingReceivingCurrency } from '../Utils';

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

          reverseSwaps: new Map<string, ReverseSwapDetails>(),
          reverseSwapTransactions: new Map<string, string>(),
          reverseSwapTimeouts: new Map<number, string[]>(),
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

    if (!sendingCurrency.lndClient) {
      throw Errors.NO_LND_CLIENT(sendingCurrency.symbol);
    }

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
   * @param preimageHash hash of the preimage of the invoice that should be generated
   * @param invoiceAmount amount of the invoice that should be generated
   * @param onchainAmount amount of coins that should be sent onchain
   * @param claimPublicKey public key of the keypair needed for claiming
   * @param outputType type of the lockup address
   * @param timeoutBlockDelta after how many blocks the onchain script should time out
   */
  public createReverseSwap = async (
    baseCurrency: string,
    quoteCurrency: string,
    orderSide: OrderSide,
    preimageHash: Buffer,
    invoiceAmount: number,
    onchainAmount: number,
    claimPublicKey: Buffer,
    outputType: OutputType,
    timeoutBlockDelta: number,
  ) => {
    const { sendingCurrency, receivingCurrency } = this.getCurrencies(baseCurrency, quoteCurrency, orderSide);

    if (!receivingCurrency.lndClient) {
      throw Errors.NO_LND_CLIENT(receivingCurrency.symbol);
    }

    this.logger.silly(`Sending ${sendingCurrency.symbol} on the chain and receiving ${receivingCurrency.symbol} on Lightning`);
    this.logger.verbose(`Creating new reverse Swap from ${receivingCurrency.symbol} to ${sendingCurrency.symbol} ` +
      `with preimage hash: ${getHexString(preimageHash)}`);

    const { paymentRequest } = await receivingCurrency.lndClient.addHoldInvoice(
      invoiceAmount,
      preimageHash,
      getSwapMemo(sendingCurrency.symbol, true),
    );

    const { keys, index } = sendingCurrency.wallet.getNewKeys();
    const { blocks } = await sendingCurrency.chainClient.getBlockchainInfo();
    const timeoutBlockHeight = blocks + timeoutBlockDelta;

    const redeemScript = swapScript(
      preimageHash,
      claimPublicKey,
      keys.publicKey,
      timeoutBlockHeight,
    );

    const outputScript = getScriptHashFunction(outputType)(redeemScript);
    const address = sendingCurrency.wallet.encodeAddress(outputScript);

    sendingCurrency.chainClient.updateOutputFilter([outputScript]);

    this.nursery.addReverseSwap(
      receivingCurrency,
      {
        outputType,
        redeemScript,
        refundKeys: keys,
        sendingDetails: {
          address,
          amount: onchainAmount,
          sendingCurrency: sendingCurrency.symbol,
        },
      },
      paymentRequest,
      timeoutBlockHeight,
    );

    return {
      timeoutBlockHeight,

      keyIndex: index,
      lockupAddress: address,
      invoice: paymentRequest,
      redeemScript: getHexString(redeemScript),
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
    const { sending, receiving } = getSendingReceivingCurrency(baseCurrency, quoteCurrency, orderSide);

    return {
      sendingCurrency: {
        ...this.getCurrency(sending),
        wallet: this.walletManager.wallets.get(sending)!,
      },
      receivingCurrency: {
        ...this.getCurrency(receiving),
        wallet: this.walletManager.wallets.get(receiving)!,
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
