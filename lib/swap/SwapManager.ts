import { Op } from 'sequelize';
import { Transaction } from 'bitcoinjs-lib';
import { OutputType, reverseSwapScript, swapScript } from 'boltz-core';
import Errors from './Errors';
import Logger from '../Logger';
import Swap from '../db/models/Swap';
import SwapNursery from './SwapNursery';
import LndClient from '../lightning/LndClient';
import RateProvider from '../rates/RateProvider';
import SwapRepository from '../db/SwapRepository';
import ReverseSwap from '../db/models/ReverseSwap';
import ReverseSwapRepository from '../db/ReverseSwapRepository';
import WalletManager, { Currency } from '../wallet/WalletManager';
import TimeoutDeltaProvider from '../service/TimeoutDeltaProvider';
import ChannelCreationRepository from '../db/ChannelCreationRepository';
import { ChannelCreationType, OrderSide, SwapUpdateEvent } from '../consts/Enums';
import {
  getPairId,
  generateId,
  splitPairId,
  getSwapMemo,
  getHexBuffer,
  getHexString,
  decodeInvoice,
  reverseBuffer,
  getChainCurrency,
  getSwapOutputType,
  getLightningCurrency,
  getScriptHashFunction,
  getSendingReceivingCurrency, formatError, getUnixTime,
} from '../Utils';

type ChannelCreationInfo = {
  auto: boolean,
  private: boolean,
  inboundLiquidity: number,
};

class SwapManager {
  public currencies = new Map<string, Currency>();

  public nursery: SwapNursery;

  public swapRepository: SwapRepository;
  public reverseSwapRepository: ReverseSwapRepository;
  public channelCreationRepository: ChannelCreationRepository;

  constructor(
    private logger: Logger,
    retryInterval: number,
    private walletManager: WalletManager,
    rateProvider: RateProvider,
  ) {
    this.swapRepository = new SwapRepository();
    this.reverseSwapRepository = new ReverseSwapRepository();
    this.channelCreationRepository = new ChannelCreationRepository();

    this.nursery = new SwapNursery(
      this.logger,
      retryInterval,
      rateProvider,
      this.walletManager,
      this.swapRepository,
      this.reverseSwapRepository,
      this.channelCreationRepository,
    );
  }

  public init = async (currencies: Currency[]) => {
    currencies.forEach((currency) => {
      this.currencies.set(currency.symbol, currency);
    });

    await this.nursery.init(currencies);

    // TODO: write tests
    const recreateFilters = (swaps: Swap[] | ReverseSwap[], isReverse: boolean) => {
      // TODO: add reverse swap input and output filter
      swaps.forEach((swap: Swap | ReverseSwap) => {
        if (swap.status === SwapUpdateEvent.SwapCreated && isReverse) {
          const invoice = (swap as ReverseSwap).invoice;
          const preimageHash = getHexBuffer(decodeInvoice(invoice).paymentHash!);

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
   * @param channel information about channel creation in case it is needed
   */
  public createSwap = async (
    baseCurrency: string,
    quoteCurrency: string,
    orderSide: OrderSide,
    preimageHash: Buffer,
    refundPublicKey: Buffer,
    timeoutBlockDelta: number,
    channel?: ChannelCreationInfo,
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

    receivingCurrency.chainClient.addOutputFilter(outputScript);

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

    if (channel !== undefined) {
      this.logger.verbose(`Adding Channel Creation for Swap: ${id}`);

      await this.channelCreationRepository.addChannelCreation({
        swapId: id,
        private: channel.private,
        type: channel.auto ? ChannelCreationType.Auto : ChannelCreationType.Create,
        inboundLiquidity: channel.inboundLiquidity,
      });
    }

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
   * @param emitSwapInvoiceSet method to emit an event after the invoice has been set
   */
  public setSwapInvoice = async (
    swap: Swap,
    invoice: string,
    expectedAmount: number,
    percentageFee: number,
    acceptZeroConf: boolean,
    emitSwapInvoiceSet: (id: string) => void,
  ) => {
    const { base, quote } = splitPairId(swap.pair);
    const { sendingCurrency, receivingCurrency } = this.getCurrencies(base, quote, swap.orderSide);

    const { paymentHash, satoshis, payeeNodeKey, routingInfo, timeExpireDate } = decodeInvoice(invoice);

    if (paymentHash !== swap.preimageHash) {
      throw Errors.INVOICE_INVALID_PREIMAGE_HASH(swap.preimageHash);
    }

    const channelCreation = await this.channelCreationRepository.getChannelCreation({
      swapId: {
        [Op.eq]: swap.id,
      },
    });

    if (channelCreation) {
      if (timeExpireDate) {
        const { blocks } = await receivingCurrency.chainClient.getBlockchainInfo();

        const blocksUntilExpiry = swap.timeoutBlockHeight - blocks;
        const timeoutTimestamp = getUnixTime() + (blocksUntilExpiry * TimeoutDeltaProvider.blockTimes.get(receivingCurrency.symbol)! * 60);

        if (timeoutTimestamp > timeExpireDate) {
          throw Errors.INVOICE_EXPIRES_TOO_EARLY(timeExpireDate, timeoutTimestamp);
        }
      }

      await this.channelCreationRepository.setNodePublicKey(channelCreation, payeeNodeKey!);

    // If there are route hints the routability check could fail although LND could pay the invoice
    } else if (routingInfo && routingInfo.length === 0) {
      const routable = await this.checkRoutability(sendingCurrency.lndClient!, payeeNodeKey!, satoshis);
      if (!routable) {
        throw Errors.NO_ROUTE_FOUND();
      }
    }

    this.logger.debug(`Setting invoice of Swap ${swap.id}: ${invoice}`);

    const updatedSwap = await this.swapRepository.setInvoice(swap, invoice, expectedAmount, percentageFee, acceptZeroConf);

    // Not the most elegant way to emit this event but the only option
    // to emit it before trying to claim the swap
    emitSwapInvoiceSet(swap.id);

    // If the onchain coins were sent already and 0-conf can be accepted or
    // the lockup transaction is confirmed the swap should be settled directly
    if (swap.lockupTransactionId) {
      const rawTransaction = await receivingCurrency.chainClient.getRawTransaction(swap.lockupTransactionId);

      try {
        await this.nursery.attemptSettleSwap(
          receivingCurrency,
          receivingCurrency.wallet,
          updatedSwap,
          Transaction.fromHex(rawTransaction),
          swap.status === SwapUpdateEvent.TransactionConfirmed,
        );
      } catch (error) {
        this.logger.warn(`Could not settle Swap ${swap!.id}: ${formatError(error)}`);
      }
    }
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
export { ChannelCreationInfo };
