import { Op } from 'sequelize';
import { OutputType, swapScript, reverseSwapScript } from 'boltz-core';
import Errors from './Errors';
import Logger from '../Logger';
import Swap from '../db/models/Swap';
import SwapNursery from './SwapNursery';
import LndClient from '../lightning/LndClient';
import SwapRepository from '../db/SwapRepository';
import ReverseSwap from '../db/models/ReverseSwap';
import { OrderSide, SwapUpdateEvent } from '../consts/Enums';
import ReverseSwapRepository from '../db/ReverseSwapRepository';
import WalletManager, { Currency } from '../wallet/WalletManager';
import {
  getPairId,
  generateId,
  getSwapMemo,
  splitPairId,
  getHexBuffer,
  getHexString,
  reverseBuffer,
  getChainCurrency,
  getSwapOutputType,
  getLightningCurrency,
  getScriptHashFunction,
  getInvoicePreimageHash,
  getSendingReceivingCurrency,
} from '../Utils';

class SwapManager {
  public currencies = new Map<string, Currency>();

  public nursery: SwapNursery;

  public swapRepository: SwapRepository;
  public reverseSwapRepository: ReverseSwapRepository;

  constructor(private logger: Logger, private walletManager: WalletManager) {
    this.swapRepository = new SwapRepository();
    this.reverseSwapRepository = new ReverseSwapRepository();

    this.nursery = new SwapNursery(
      this.logger,
      this.walletManager,
      this.swapRepository,
      this.reverseSwapRepository,
    );
  }

  public init = async (currencies: Currency[]) => {
    currencies.forEach((currency) => {
      if (!this.currencies.get(currency.symbol)) {
        this.currencies.set(currency.symbol, currency);
        this.nursery.bindCurrency(currency);
      }
    });

    const recreateFilters = (swaps: Swap[] | ReverseSwap[], isReverse: boolean) => {
      // TODO: add reverse swap input and output filter
      swaps.forEach((swap: Swap | ReverseSwap) => {
        if (swap.status === SwapUpdateEvent.SwapCreated && isReverse) {
          const invoice = (swap as ReverseSwap).invoice;
          const preimageHash = getHexBuffer(getInvoicePreimageHash(invoice));

          const { base, quote } = splitPairId(swap.pair);
          const lightningCurrency = getLightningCurrency(base, quote, swap.orderSide, true);

          const { lndClient } = this.currencies.get(lightningCurrency)!;
          lndClient!.subscribeSingleInvoice(preimageHash);

        } else if ((swap.status === SwapUpdateEvent.TransactionMempool || swap.status === SwapUpdateEvent.TransactionConfirmed) && isReverse) {
          const { base, quote } = splitPairId(swap.pair);
          const chainCurrency = getChainCurrency(base, quote, swap.orderSide, false);

          const { chainClient } = this.currencies.get(chainCurrency)!;

          const transactionId = reverseBuffer(getHexBuffer((swap as ReverseSwap).transactionId!));
          chainClient.addInputFilter(transactionId);

          if (swap.status === SwapUpdateEvent.TransactionMempool) {
            const wallet = this.walletManager.wallets.get(chainCurrency)!;
            chainClient.addOutputFilter(wallet.decodeAddress(swap.lockupAddress!));
          }

        } else {
          const encodeFunction = getScriptHashFunction(getSwapOutputType(isReverse));
          const outputScript = encodeFunction(getHexBuffer(swap.redeemScript));

          const { base, quote } = splitPairId(swap.pair);
          const chainCurrency = getChainCurrency(base, quote, swap.orderSide, false);

          const { chainClient } = this.currencies.get(chainCurrency)!;
          chainClient.addOutputFilter(outputScript);
        }
      });
    };

    // TODO: rescan chains
    const [pendingSwaps, pendingReverseSwaps] = await Promise.all([
      this.swapRepository.getSwaps({
        status: {
          [Op.not]: [
            SwapUpdateEvent.SwapExpired,
            SwapUpdateEvent.InvoiceFailedToPay,
            SwapUpdateEvent.TransactionClaimed,
          ],
        },
      }),
      this.reverseSwapRepository.getReverseSwaps({
        status: {
          [Op.or]: [
            SwapUpdateEvent.SwapCreated,
            SwapUpdateEvent.TransactionMempool,
            SwapUpdateEvent.TransactionConfirmed,
          ],
        },
      }),
    ]);

    recreateFilters(pendingSwaps, false);
    recreateFilters(pendingReverseSwaps, true);

    this.logger.info('Recreated input and output filters and invoice subscriptions');
  }

  /**
   * Creates a new Submarine Swap from the chain to Lightning with a preimage hash
   *
   * @param baseCurrency base currency ticker symbol
   * @param quoteCurrency quote currency ticker symbol
   * @param orderSide whether the order is a buy or sell one
   * @param preimageHash hash of the preimage of the invoice the swap should pay
   * @param refundPublicKey public key of the keypair needed for claiming
   * @param timeoutBlockDelta after how many blocks the onchain script should time out
   */
  public createSwap = async (
    baseCurrency: string,
    quoteCurrency: string,
    orderSide: OrderSide,
    preimageHash: Buffer,
    refundPublicKey: Buffer,
    timeoutBlockDelta: number,
  ) => {
    const { sendingCurrency, receivingCurrency } = this.getCurrencies(baseCurrency, quoteCurrency, orderSide);

    if (!sendingCurrency.lndClient) {
      throw Errors.NO_LND_CLIENT(sendingCurrency.symbol);
    }

    this.logger.verbose(`Creating new Swap from ${receivingCurrency.symbol} to ${sendingCurrency.symbol} with preimage hash: ${getHexString(preimageHash)}`);

    const { blocks } = await receivingCurrency.chainClient.getBlockchainInfo();
    const timeoutBlockHeight = blocks + timeoutBlockDelta;

    const { keys, index } = receivingCurrency.wallet.getNewKeys();

    const redeemScript = swapScript(
      preimageHash,
      keys.publicKey,
      refundPublicKey,
      timeoutBlockHeight,
    );

    const encodeFunction = getScriptHashFunction(getSwapOutputType(false));
    const outputScript = encodeFunction(redeemScript);

    const id = generateId();
    const address = receivingCurrency.wallet.encodeAddress(outputScript);

    await this.swapRepository.addSwap({
      id,
      orderSide,
      timeoutBlockHeight,

      keyIndex: index,
      lockupAddress: address,
      status: SwapUpdateEvent.SwapCreated,
      preimageHash: getHexString(preimageHash),
      redeemScript: getHexString(redeemScript),
      pair: getPairId({ base: baseCurrency, quote: quoteCurrency }),
    });

    return {
      id,
      address,
      timeoutBlockHeight,

      redeemScript: getHexString(redeemScript),
    };
  }

  /**
   * Sets the invoice of a Submarine Swap
   *
   * @param swap database object of the swap
   * @param invoice invoice of the Swap
   * @param expectedAmount amount that is expected onchain
   * @param percentageFee fee Boltz charges for the Swap
   * @param acceptZeroConf whether 0-conf transactions should be accepted
   */
  public setSwapInvoice = async (swap: Swap, invoice: string, expectedAmount: number, percentageFee: number, acceptZeroConf: boolean) => {
    const { base, quote } = splitPairId(swap.pair);
    const { sendingCurrency, receivingCurrency } = this.getCurrencies(base, quote, swap.orderSide);

    // TODO: use bolt11 library to decode invoices
    const { paymentHash, numSatoshis, destination, routeHintsList } = await sendingCurrency.lndClient!.decodePayReq(invoice);

    if (paymentHash !== swap.preimageHash) {
      throw Errors.INVOICE_INVALID_PREIMAGE_HASH(swap.preimageHash);
    }

    // If there are route hints the routability check could fail although LND could pay the invoice
    if (routeHintsList.length === 0) {
      const routable = await this.checkRoutability(sendingCurrency.lndClient!, destination, numSatoshis);

      if (!routable) {
        throw Errors.NO_ROUTE_FOUND();
      }
    }

    this.logger.debug(`Setting invoice of Swap ${swap.id}: ${invoice}`);

    await this.swapRepository.setInvoice(swap, invoice, expectedAmount, percentageFee, acceptZeroConf);

    const encodeFunction = getScriptHashFunction(getSwapOutputType(false));
    const outputScript = encodeFunction(getHexBuffer(swap.redeemScript));

    receivingCurrency.chainClient.addOutputFilter(outputScript);
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
   * @param onchainTimeoutBlockDelta after how many blocks the onchain script should time out
   * @param lightningTimeoutBlockDelta timeout delta of the last hop
   * @param percentageFee the fee Boltz charges for the Swap
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
    onchainTimeoutBlockDelta: number,
    lightningTimeoutBlockDelta: number,
    percentageFee: number,
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
      lightningTimeoutBlockDelta,
      getSwapMemo(sendingCurrency.symbol, true),
    );
    receivingCurrency.lndClient.subscribeSingleInvoice(preimageHash);

    const { keys, index } = sendingCurrency.wallet.getNewKeys();
    const { blocks } = await sendingCurrency.chainClient.getBlockchainInfo();
    const timeoutBlockHeight = blocks + onchainTimeoutBlockDelta;

    const redeemScript = reverseSwapScript(
      preimageHash,
      claimPublicKey,
      keys.publicKey,
      timeoutBlockHeight,
    );

    const outputScript = getScriptHashFunction(outputType)(redeemScript);
    const lockupAddress = sendingCurrency.wallet.encodeAddress(outputScript);

    const id = generateId();

    await this.reverseSwapRepository.addReverseSwap({
      id,
      orderSide,
      lockupAddress,
      onchainAmount,
      timeoutBlockHeight,

      keyIndex: index,
      fee: percentageFee,
      invoice: paymentRequest,
      status: SwapUpdateEvent.SwapCreated,
      redeemScript: getHexString(redeemScript),
      pair: getPairId({ base: baseCurrency, quote: quoteCurrency }),
    });

    return {
      id,
      lockupAddress,
      timeoutBlockHeight,
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
