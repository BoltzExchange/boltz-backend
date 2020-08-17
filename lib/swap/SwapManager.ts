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
import { ReverseSwapOutputType } from '../consts/Consts';
import ReverseSwapRepository from '../db/ReverseSwapRepository';
import WalletManager, { Currency } from '../wallet/WalletManager';
import TimeoutDeltaProvider from '../service/TimeoutDeltaProvider';
import ChannelCreationRepository from '../db/ChannelCreationRepository';
import { ChannelCreationType, OrderSide, SwapUpdateEvent } from '../consts/Enums';
import {
  decodeInvoice,
  formatError,
  generateId,
  getChainCurrency,
  getHexBuffer,
  getHexString,
  getLightningCurrency,
  getPairId,
  getPrepayMinerFeeInvoiceMemo,
  getScriptHashFunction,
  getSendingReceivingCurrency,
  getSwapMemo,
  getUnixTime,
  reverseBuffer,
  splitPairId,
} from '../Utils';

type ChannelCreationInfo = {
  auto: boolean,
  private: boolean,
  inboundLiquidity: number,
};

type SetSwapInvoiceResponse = {
  channelCreationError?: string;
};

class SwapManager {
  public currencies = new Map<string, Currency>();

  public nursery: SwapNursery;

  public swapRepository: SwapRepository;
  public reverseSwapRepository: ReverseSwapRepository;
  public channelCreationRepository: ChannelCreationRepository;

  constructor(
    private logger: Logger,
    private walletManager: WalletManager,
    rateProvider: RateProvider,
    private swapOutputType: OutputType,
    private prepayMinerFee: boolean,
    retryInterval: number,
  ) {
    this.swapRepository = new SwapRepository();
    this.reverseSwapRepository = new ReverseSwapRepository();
    this.channelCreationRepository = new ChannelCreationRepository();

    this.nursery = new SwapNursery(
      this.logger,
      rateProvider,
      this.walletManager,
      this.swapRepository,
      this.reverseSwapRepository,
      this.channelCreationRepository,
      prepayMinerFee,
      this.swapOutputType,
      retryInterval,
    );
  }

  public init = async (currencies: Currency[]): Promise<void>=> {
    currencies.forEach((currency) => {
      this.currencies.set(currency.symbol, currency);
    });

    await this.nursery.init(currencies);

    // TODO: rescan chains
    const [pendingSwaps, pendingReverseSwaps] = await Promise.all([
      this.swapRepository.getSwaps({
        status: {
          [Op.not]: [
            SwapUpdateEvent.SwapExpired,
            SwapUpdateEvent.InvoicePending,
            SwapUpdateEvent.InvoiceFailedToPay,
            SwapUpdateEvent.TransactionClaimed,
          ],
        },
      }),
      this.reverseSwapRepository.getReverseSwaps({
        status: {
          [Op.not]: [
            SwapUpdateEvent.SwapExpired,
            SwapUpdateEvent.InvoiceSettled,
            SwapUpdateEvent.TransactionFailed,
            SwapUpdateEvent.TransactionRefunded,
          ],
        },
      }),
    ]);

    this.recreateFilters(pendingSwaps, false);
    this.recreateFilters(pendingReverseSwaps, true);

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
  ): Promise<{
    id: string,
    address: string,
    redeemScript: string,
    timeoutBlockHeight: number,
  }> => {
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

    const encodeFunction = getScriptHashFunction(this.swapOutputType);
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
  ): Promise<SetSwapInvoiceResponse> => {
    const response: SetSwapInvoiceResponse = {};

    const { base, quote } = splitPairId(swap.pair);
    const { sendingCurrency, receivingCurrency } = this.getCurrencies(base, quote, swap.orderSide);

    const decodedInvoice = decodeInvoice(invoice);

    if (decodedInvoice.paymentHash !== swap.preimageHash) {
      throw Errors.INVOICE_INVALID_PREIMAGE_HASH(swap.preimageHash);
    }

    const channelCreation = await this.channelCreationRepository.getChannelCreation({
      swapId: {
        [Op.eq]: swap.id,
      },
    });

    if (channelCreation) {
      let invoiceExpiry = decodedInvoice.timestamp || 0;

      if (decodedInvoice.timeExpireDate) {
        invoiceExpiry = decodedInvoice.timeExpireDate;
      } else {
        // Default invoice timeout
        // Reference: https://github.com/lightningnetwork/lightning-rfc/blob/master/11-payment-encoding.md#tagged-fields
        invoiceExpiry += 3600;
      }

      if (invoiceExpiry) {
        const { blocks } = await receivingCurrency.chainClient.getBlockchainInfo();
        const blocksUntilExpiry = swap.timeoutBlockHeight - blocks;

        const timeoutTimestamp = getUnixTime() + (blocksUntilExpiry * TimeoutDeltaProvider.blockTimes.get(receivingCurrency.symbol)! * 60);

        const invoiceError = Errors.INVOICE_EXPIRES_TOO_EARLY(invoiceExpiry, timeoutTimestamp);

        if (timeoutTimestamp > invoiceExpiry) {
          // In the auto Channel Creation mode, which is used by the frontend, the invoice check can fail but the Swap should
          // still be attempted without Channel Creation
          if (channelCreation.type === ChannelCreationType.Auto) {
            this.logger.info(`Disabling Channel Creation for Swap ${swap.id}: ${invoiceError.message}`)
            response.channelCreationError = invoiceError.message;

            await channelCreation.destroy();

            // In other modes (only manual right now), a failing invoice Check should result in a failed request
          } else {
            throw invoiceError;
          }
        }
      }

      await this.channelCreationRepository.setNodePublicKey(channelCreation, decodedInvoice.payeeNodeKey!);

    // If there are route hints the routability check could fail although LND could pay the invoice
    } else if (!decodedInvoice.routingInfo || (decodedInvoice.routingInfo && decodedInvoice.routingInfo.length === 0)) {
      const routable = await this.checkRoutability(sendingCurrency.lndClient!, decodedInvoice.payeeNodeKey!, decodedInvoice.satoshis);
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

    return response;
  }

  /**
   * Creates a new reverse Swap from Lightning to the chain
   *
   * @param baseCurrency base currency ticker symbol
   * @param quoteCurrency quote currency ticker symbol
   * @param orderSide whether the order is a buy or sell one
   * @param preimageHash hash of the preimage of the hold invoice
   * @param holdInvoiceAmount amount of the hold invoice
   * @param onchainAmount amount of coins that should be sent onchain
   * @param claimPublicKey public key of the keypair needed for claiming
   * @param onchainTimeoutBlockDelta after how many blocks the onchain script should time out
   * @param lightningTimeoutBlockDelta timeout delta of the last hop
   * @param percentageFee the fee Boltz charges for the Swap
   * @param prepayMinerFee only set if prepaying miner fees is enabled; amount of the prepay invoice
   */
  public createReverseSwap = async (
    baseCurrency: string,
    quoteCurrency: string,
    orderSide: OrderSide,
    preimageHash: Buffer,
    holdInvoiceAmount: number,
    onchainAmount: number,
    claimPublicKey: Buffer,
    onchainTimeoutBlockDelta: number,
    lightningTimeoutBlockDelta: number,
    percentageFee: number,
    prepayMinerFee?: number,
  ): Promise<{
    id: string,
    timeoutBlockHeight: number,

    invoice: string,
    minerFeeInvoice: string | undefined,

    lockupAddress: string,
    redeemScript: string,
  }> => {
    const { sendingCurrency, receivingCurrency } = this.getCurrencies(baseCurrency, quoteCurrency, orderSide);

    if (!receivingCurrency.lndClient) {
      throw Errors.NO_LND_CLIENT(receivingCurrency.symbol);
    }

    this.logger.silly(`Sending ${sendingCurrency.symbol} on the chain and receiving ${receivingCurrency.symbol} on Lightning`);
    this.logger.verbose(`Creating new Reverse Swap from ${receivingCurrency.symbol} to ${sendingCurrency.symbol} ` +
      `with preimage hash: ${getHexString(preimageHash)}`);

    const { paymentRequest } = await receivingCurrency.lndClient.addHoldInvoice(
      holdInvoiceAmount,
      preimageHash,
      lightningTimeoutBlockDelta,
      getSwapMemo(sendingCurrency.symbol, true),
    );

    receivingCurrency.lndClient.subscribeSingleInvoice(preimageHash);

    let minerFeeInvoice: string | undefined = undefined;

    if (prepayMinerFee) {
      const prepayInvoice = await receivingCurrency.lndClient.addInvoice(prepayMinerFee, getPrepayMinerFeeInvoiceMemo(sendingCurrency.symbol));
      minerFeeInvoice = prepayInvoice.paymentRequest;

      receivingCurrency.lndClient.subscribeSingleInvoice(Buffer.from(prepayInvoice.rHash as string, 'base64'));
    }

    const { keys, index } = sendingCurrency.wallet.getNewKeys();
    const { blocks } = await sendingCurrency.chainClient.getBlockchainInfo();
    const timeoutBlockHeight = blocks + onchainTimeoutBlockDelta;

    const redeemScript = reverseSwapScript(
      preimageHash,
      claimPublicKey,
      keys.publicKey,
      timeoutBlockHeight,
    );

    const outputScript = getScriptHashFunction(ReverseSwapOutputType)(redeemScript);
    const lockupAddress = sendingCurrency.wallet.encodeAddress(outputScript);

    const id = generateId();

    await this.reverseSwapRepository.addReverseSwap({
      id,
      orderSide,
      lockupAddress,
      onchainAmount,
      minerFeeInvoice,
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
      minerFeeInvoice,
      timeoutBlockHeight,
      invoice: paymentRequest,
      redeemScript: getHexString(redeemScript),
    };
  }

  private recreateFilters = (swaps: Swap[] | ReverseSwap[], isReverse: boolean) => {
    swaps.forEach((swap: Swap | ReverseSwap) => {
      const { base, quote } = splitPairId(swap.pair);
      const chainCurrency = getChainCurrency(base, quote, swap.orderSide, isReverse);
      const lightningCurrency = getLightningCurrency(base, quote, swap.orderSide, isReverse);

      if ((swap.status === SwapUpdateEvent.SwapCreated || swap.status === SwapUpdateEvent.MinerFeePaid) && isReverse) {
        const reverseSwap = swap as ReverseSwap;

        const { lndClient } = this.currencies.get(lightningCurrency)!;

        if (reverseSwap.minerFeeInvoice && swap.status !== SwapUpdateEvent.MinerFeePaid) {
          lndClient!.subscribeSingleInvoice(getHexBuffer(decodeInvoice(reverseSwap.minerFeeInvoice).paymentHash!));
        }

        lndClient!.subscribeSingleInvoice(getHexBuffer(decodeInvoice(reverseSwap.invoice).paymentHash!));

      } else if ((swap.status === SwapUpdateEvent.TransactionMempool || swap.status === SwapUpdateEvent.TransactionConfirmed) && isReverse) {
        const { chainClient } = this.currencies.get(chainCurrency)!;

        const transactionId = reverseBuffer(getHexBuffer((swap as ReverseSwap).transactionId!));
        chainClient.addInputFilter(transactionId);

        // To detect when the transaction confirms
        if (swap.status === SwapUpdateEvent.TransactionMempool) {
          const wallet = this.walletManager.wallets.get(chainCurrency)!;
          chainClient.addOutputFilter(wallet.decodeAddress(swap.lockupAddress));
        }

      } else {
        const wallet = this.walletManager.wallets.get(chainCurrency)!;
        const outputScript = wallet.decodeAddress(swap.lockupAddress);

        const { chainClient } = this.currencies.get(chainCurrency)!;
        chainClient.addOutputFilter(outputScript);
      }
    });
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
      throw Errors.CURRENCY_NOT_FOUND(currencySymbol).message;
    }

    return currency;
  }
}

export default SwapManager;
export { ChannelCreationInfo };
