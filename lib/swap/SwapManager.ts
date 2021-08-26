import { Op } from 'sequelize';
import { randomBytes } from 'crypto';
import { crypto } from 'bitcoinjs-lib';
import { OutputType, reverseSwapScript, swapScript } from 'boltz-core';
import Errors from './Errors';
import Logger from '../Logger';
import Swap from '../db/models/Swap';
import SwapNursery from './SwapNursery';
import LndClient from '../lightning/LndClient';
import RateProvider from '../rates/RateProvider';
import ReverseSwap from '../db/models/ReverseSwap';
import { ReverseSwapOutputType } from '../consts/Consts';
import RoutingHintsProvider from './RoutingHintsProvider';
import SwapRepository from '../db/repositories/SwapRepository';
import InvoiceExpiryHelper from '../service/InvoiceExpiryHelper';
import WalletManager, { Currency } from '../wallet/WalletManager';
import TimeoutDeltaProvider from '../service/TimeoutDeltaProvider';
import ReverseSwapRepository from '../db/repositories/ReverseSwapRepository';
import ChannelCreationRepository from '../db/repositories/ChannelCreationRepository';
import { ChannelCreationType, CurrencyType, OrderSide, SwapUpdateEvent } from '../consts/Enums';
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

  public routingHints!: RoutingHintsProvider;

  constructor(
    private logger: Logger,
    private walletManager: WalletManager,
    rateProvider: RateProvider,
    private invoiceExpiryHelper: InvoiceExpiryHelper,
    private swapOutputType: OutputType,
    retryInterval: number,
  ) {
    this.channelCreationRepository = new ChannelCreationRepository();

    this.swapRepository = new SwapRepository();
    this.reverseSwapRepository = new ReverseSwapRepository();
    this.nursery = new SwapNursery(
      this.logger,
      rateProvider,
      this.walletManager,
      this.swapRepository,
      this.reverseSwapRepository,
      this.channelCreationRepository,
      this.swapOutputType,
      retryInterval,
    );
  }

  public init = async (currencies: Currency[]): Promise<void>=> {
    currencies.forEach((currency) => {
      this.currencies.set(currency.symbol, currency);
    });

    await this.nursery.init(currencies);

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

    const lndClients: LndClient[] = [];

    for (const currency of currencies) {
      if (currency.lndClient) {
        lndClients.push(currency.lndClient);
      }
    }

    this.routingHints = new RoutingHintsProvider(
      this.logger,
      lndClients,
    );
    await this.routingHints.start();
  }

  /**
   * Creates a new Submarine Swap from the chain to Lightning with a preimage hash
   */
  public createSwap = async (args: {
    baseCurrency: string,
    quoteCurrency: string,
    orderSide: OrderSide,
    preimageHash: Buffer,
    timeoutBlockDelta: number,

    channel?: ChannelCreationInfo,

    // Referral ID for the swap
    referralId?: string,

    // Only required for UTXO based chains
    refundPublicKey?: Buffer,
  }): Promise<{
    id: string,
    timeoutBlockHeight: number,

    // This is either the generated address for Bitcoin like chains, or the address of the contract
    // to which the user should send the lockup transaction for Ether and ERC20 tokens
    address: string,

    // Only set for Bitcoin like, UTXO based, chains
    redeemScript?: string,

    // Specified when either Ether or ERC20 tokens or swapped to Lightning
    // So that the user can specify the claim address (Boltz) in the lockup transaction to the contract
    claimAddress?: string,
  }> => {
    const { sendingCurrency, receivingCurrency } = this.getCurrencies(args.baseCurrency, args.quoteCurrency, args.orderSide);

    if (!sendingCurrency.lndClient) {
      throw Errors.NO_LND_CLIENT(sendingCurrency.symbol);
    }

    const id = generateId();

    this.logger.verbose(`Creating new Swap from ${receivingCurrency.symbol} to ${sendingCurrency.symbol}: ${id}`);

    if (args.referralId) {
      this.logger.silly(`Using referral ID ${args.referralId} for Swap ${id}`);
    }

    const pair = getPairId({ base: args.baseCurrency, quote: args.quoteCurrency });

    let address: string;
    let timeoutBlockHeight: number;

    let redeemScript: Buffer | undefined;

    let claimAddress: string | undefined;

    if (receivingCurrency.type === CurrencyType.BitcoinLike) {
      const { blocks } = await receivingCurrency.chainClient!.getBlockchainInfo();
      timeoutBlockHeight = blocks + args.timeoutBlockDelta;

      const { keys, index } = receivingCurrency.wallet.getNewKeys();

      redeemScript = swapScript(
        args.preimageHash,
        keys.publicKey,
        args.refundPublicKey!,
        timeoutBlockHeight,
      );

      const encodeFunction = getScriptHashFunction(this.swapOutputType);
      const outputScript = encodeFunction(redeemScript);

      address = receivingCurrency.wallet.encodeAddress(outputScript);

      receivingCurrency.chainClient!.addOutputFilter(outputScript);

      await this.swapRepository.addSwap({
        id,
        pair,
        timeoutBlockHeight,

        keyIndex: index,
        lockupAddress: address,
        referral: args.referralId,
        orderSide: args.orderSide,
        status: SwapUpdateEvent.SwapCreated,
        preimageHash: getHexString(args.preimageHash),
        redeemScript: getHexString(redeemScript),
      });
    } else {
      address = this.getLockupContractAddress(receivingCurrency.type);

      const blockNumber = await receivingCurrency.provider!.getBlockNumber();
      timeoutBlockHeight = blockNumber + args.timeoutBlockDelta;

      claimAddress = await receivingCurrency.wallet.getAddress();

      await this.swapRepository.addSwap({
        id,
        pair,
        timeoutBlockHeight,

        lockupAddress: address,
        referral: args.referralId,
        orderSide: args.orderSide,
        status: SwapUpdateEvent.SwapCreated,
        preimageHash: getHexString(args.preimageHash),
      });
    }

    if (args.channel !== undefined) {
      this.logger.verbose(`Adding Channel Creation for Swap: ${id}`);

      await this.channelCreationRepository.addChannelCreation({
        swapId: id,
        private: args.channel.private,
        type: args.channel.auto ? ChannelCreationType.Auto : ChannelCreationType.Create,
        inboundLiquidity: args.channel.inboundLiquidity,
      });
    }

    return {
      id,
      address,
      claimAddress,
      timeoutBlockHeight,

      redeemScript: redeemScript ? getHexString(redeemScript) : undefined,
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

    const invoiceExpiry = InvoiceExpiryHelper.getInvoiceExpiry(decodedInvoice.timestamp, decodedInvoice.timeExpireDate);

    if (getUnixTime() >= invoiceExpiry) {
      throw Errors.INVOICE_EXPIRED_ALREADY();
    }

    const channelCreation = await this.channelCreationRepository.getChannelCreation({
      swapId: {
        [Op.eq]: swap.id,
      },
    });

    if (channelCreation) {
      const getChainInfo = async (currency: Currency): Promise<{ blocks: number, blockTime: number }> => {
        if (currency.type === CurrencyType.BitcoinLike) {
          const { blocks } = await currency.chainClient!.getBlockchainInfo();

          return {
            blocks,
            blockTime: TimeoutDeltaProvider.blockTimes.get(currency.symbol)!,
          };

        // All currencies that are not Bitcoin-like are either Ether or an ERC20 token on the Ethereum chain
        } else {
          return {
            blocks: await currency.provider!.getBlockNumber(),
            blockTime: TimeoutDeltaProvider.blockTimes.get('ETH')!,
          };
        }
      };

      const { blocks, blockTime } = await getChainInfo(receivingCurrency);
      const blocksUntilExpiry = swap.timeoutBlockHeight - blocks;

      const timeoutTimestamp = getUnixTime() + (blocksUntilExpiry * blockTime * 60);

      const invoiceError = Errors.INVOICE_EXPIRES_TOO_EARLY(invoiceExpiry, timeoutTimestamp);

      if (timeoutTimestamp > invoiceExpiry) {
        // In the auto Channel Creation mode, which is used by the frontend, the invoice check can fail but the Swap should
        // still be attempted without Channel Creation
        if (channelCreation.type === ChannelCreationType.Auto) {
          this.logger.info(`Disabling Channel Creation for Swap ${swap.id}: ${invoiceError.message}`);
          response.channelCreationError = invoiceError.message;

          await channelCreation.destroy();

          if (!await this.checkRoutability(sendingCurrency.lndClient!, invoice)) {
            throw Errors.NO_ROUTE_FOUND();
          }

          // In other modes (only manual right now), a failing invoice Check should result in a failed request
        } else {
          throw invoiceError;
        }
      }

      await this.channelCreationRepository.setNodePublicKey(channelCreation, decodedInvoice.payeeNodeKey!);

    // If there are route hints the routability check could fail although LND could pay the invoice
    } else if (!decodedInvoice.routingInfo || (decodedInvoice.routingInfo && decodedInvoice.routingInfo.length === 0)) {
      if (!await this.checkRoutability(sendingCurrency.lndClient!, invoice)) {
        throw Errors.NO_ROUTE_FOUND();
      }
    }

    const previousStatus = swap.status;

    this.logger.debug(`Setting invoice of Swap ${swap.id}: ${invoice}`);
    const updatedSwap = await this.swapRepository.setInvoice(swap, invoice, expectedAmount, percentageFee, acceptZeroConf);

    // Not the most elegant way to emit this event but the only option
    // to emit it before trying to claim the swap
    emitSwapInvoiceSet(updatedSwap.id);

    // If the onchain coins were sent already and 0-conf can be accepted or
    // the lockup transaction is confirmed the swap should be settled directly
    if (swap.lockupTransactionId && previousStatus !== SwapUpdateEvent.TransactionZeroConfRejected) {
      try {
        await this.nursery.attemptSettleSwap(
          receivingCurrency,
          updatedSwap,
        );
      } catch (error) {
        this.logger.warn(`Could not settle Swap ${swap.id}: ${formatError(error)}`);
      }
    }

    return response;
  }

  /**
   * Creates a new reverse Swap from Lightning to the chain
   */
  public createReverseSwap = async (args: {
    baseCurrency: string,
    quoteCurrency: string,
    orderSide: OrderSide,
    preimageHash: Buffer,
    holdInvoiceAmount: number,
    onchainAmount: number,
    onchainTimeoutBlockDelta: number,
    lightningTimeoutBlockDelta: number,
    percentageFee: number,

    prepayMinerFeeInvoiceAmount?: number,
    prepayMinerFeeOnchainAmount?: number,

    // Public key of the node for which routing hints should be included in the invoice(s)
    routingNode?: string,

    // Referral ID for the reverse swap
    referralId?: string,

    // Only required for Swaps to UTXO based chains
    claimPublicKey?: Buffer,

    // Only required for Swaps to Ether and ERC20 tokens
    // Address of the user to which the coins will be sent after a successful claim transaction
    claimAddress?: string,
  }): Promise<{
    id: string,
    timeoutBlockHeight: number,

    invoice: string,
    minerFeeInvoice: string | undefined,

    // Only set for Bitcoin like, UTXO based, chains
    redeemScript: string | undefined,

    // Only set for Ethereum like chains
    refundAddress: string | undefined,

    // This is either the generated address for Bitcoin like chains, or the address of the contract
    // to which Boltz will send the lockup transaction for Ether and ERC20 tokens
    lockupAddress: string,
  }> => {
    const { sendingCurrency, receivingCurrency } = this.getCurrencies(args.baseCurrency, args.quoteCurrency, args.orderSide);

    if (!receivingCurrency.lndClient) {
      throw Errors.NO_LND_CLIENT(receivingCurrency.symbol);
    }

    const id = generateId();

    this.logger.verbose(`Creating new Reverse Swap from ${receivingCurrency.symbol} to ${sendingCurrency.symbol}: ${id}`);

    if (args.referralId) {
      this.logger.silly(`Using referral ID ${args.referralId} for Reverse Swap ${id}`);
    }

    const routingHints = args.routingNode !== undefined ?
      this.routingHints.getRoutingHints(receivingCurrency.symbol, args.routingNode) :
      undefined;

    const { paymentRequest } = await receivingCurrency.lndClient.addHoldInvoice(
      args.holdInvoiceAmount,
      args.preimageHash,
      args.lightningTimeoutBlockDelta,
      this.invoiceExpiryHelper.getExpiry(receivingCurrency.symbol),
      getSwapMemo(sendingCurrency.symbol, true),
      routingHints,
    );

    receivingCurrency.lndClient.subscribeSingleInvoice(args.preimageHash);

    let minerFeeInvoice: string | undefined = undefined;
    let minerFeeInvoicePreimage: string | undefined = undefined;

    if (args.prepayMinerFeeInvoiceAmount) {
      const preimage = randomBytes(32);
      minerFeeInvoicePreimage = getHexString(preimage);

      const minerFeeInvoicePreimageHash = crypto.sha256(preimage);

      const prepayInvoice = await receivingCurrency.lndClient.addHoldInvoice(
        args.prepayMinerFeeInvoiceAmount,
        minerFeeInvoicePreimageHash,
        undefined,
        this.invoiceExpiryHelper.getExpiry(receivingCurrency.symbol),
        getPrepayMinerFeeInvoiceMemo(sendingCurrency.symbol),
        routingHints,
      );
      minerFeeInvoice = prepayInvoice.paymentRequest;

      receivingCurrency.lndClient.subscribeSingleInvoice(minerFeeInvoicePreimageHash);

      if (args.prepayMinerFeeOnchainAmount) {
        this.logger.debug(`Sending ${args.prepayMinerFeeOnchainAmount} Ether as prepay miner fee for Reverse Swap: ${id}`);
      }
    }

    const pair = getPairId({ base: args.baseCurrency, quote: args.quoteCurrency });

    let lockupAddress: string;
    let timeoutBlockHeight: number;

    let redeemScript: Buffer | undefined;

    let refundAddress: string | undefined;

    if (sendingCurrency.type === CurrencyType.BitcoinLike) {
      const { keys, index } = sendingCurrency.wallet.getNewKeys();
      const { blocks } = await sendingCurrency.chainClient!.getBlockchainInfo();
      timeoutBlockHeight = blocks + args.onchainTimeoutBlockDelta;

      redeemScript = reverseSwapScript(
        args.preimageHash,
        args.claimPublicKey!,
        keys.publicKey,
        timeoutBlockHeight,
      );

      const outputScript = getScriptHashFunction(ReverseSwapOutputType)(redeemScript);
      lockupAddress = sendingCurrency.wallet.encodeAddress(outputScript);

      await this.reverseSwapRepository.addReverseSwap({
        id,
        pair,
        lockupAddress,
        minerFeeInvoice,
        timeoutBlockHeight,

        keyIndex: index,
        fee: args.percentageFee,
        invoice: paymentRequest,
        referral: args.referralId,
        orderSide: args.orderSide,
        onchainAmount: args.onchainAmount,
        status: SwapUpdateEvent.SwapCreated,
        redeemScript: getHexString(redeemScript),
        preimageHash: getHexString(args.preimageHash),
        minerFeeInvoicePreimage: minerFeeInvoicePreimage,
        minerFeeOnchainAmount: args.prepayMinerFeeOnchainAmount,
      });

    } else {
      const blockNumber = await sendingCurrency.provider!.getBlockNumber();
      timeoutBlockHeight = blockNumber + args.onchainTimeoutBlockDelta;

      lockupAddress = this.getLockupContractAddress(sendingCurrency.type);

      refundAddress = await this.walletManager.wallets.get(sendingCurrency.symbol)!.getAddress();

      await this.reverseSwapRepository.addReverseSwap({
        id,
        pair,
        lockupAddress,
        minerFeeInvoice,
        timeoutBlockHeight,

        fee: args.percentageFee,
        invoice: paymentRequest,
        orderSide: args.orderSide,
        referral: args.referralId,
        claimAddress: args.claimAddress!,
        onchainAmount: args.onchainAmount,
        status: SwapUpdateEvent.SwapCreated,
        preimageHash: getHexString(args.preimageHash),
        minerFeeInvoicePreimage: minerFeeInvoicePreimage,
        minerFeeOnchainAmount: args.prepayMinerFeeOnchainAmount,
      });
    }

    return {
      id,
      lockupAddress,
      refundAddress,
      minerFeeInvoice,
      timeoutBlockHeight,
      invoice: paymentRequest,
      redeemScript: redeemScript ? getHexString(redeemScript) : undefined,
    };
  }

  // TODO: check current status of invoices or do the streams handle that already?
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

        if (chainClient) {
          const transactionId = reverseBuffer(getHexBuffer((swap as ReverseSwap).transactionId!));
          chainClient.addInputFilter(transactionId);

          // To detect when the transaction confirms
          if (swap.status === SwapUpdateEvent.TransactionMempool) {
            const wallet = this.walletManager.wallets.get(chainCurrency)!;
            chainClient.addOutputFilter(wallet.decodeAddress(swap.lockupAddress));
          }
        }
      } else {
        const { chainClient } = this.currencies.get(chainCurrency)!;

        if (chainClient) {
          const wallet = this.walletManager.wallets.get(chainCurrency)!;
          const outputScript = wallet.decodeAddress(swap.lockupAddress);

          chainClient.addOutputFilter(outputScript);
        }
      }
    });
  }

  /**
   * @returns whether the payment can be routed
   */
  private checkRoutability = async (lnd: LndClient, invoice: string) => {
    try {
      // TODO: do MPP probing once it is available
      const decodedInvoice = await lnd.decodePayReq(invoice);

      // Check whether the the receiving side supports MPP and if so,
      // query a route for the number of sats of the invoice divided
      // by the max payment parts we tell to LND to use
      const amountToQuery = decodedInvoice.featuresMap['17']?.is_known ?
        Math.round(decodedInvoice.numSatoshis / LndClient.paymentMaxParts) :
        decodedInvoice.numSatoshis;

      const routes = await lnd.queryRoutes(decodedInvoice.destination, amountToQuery);

      // TODO: "routes.routesList.length >= LndClient.paymentParts" when receiver supports MPP?
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

  private getLockupContractAddress = (type: CurrencyType): string => {
    const ethereumManager = this.walletManager.ethereumManager!;
    return type === CurrencyType.Ether ? ethereumManager.etherSwap.address: ethereumManager.erc20Swap.address;
  }
}

export default SwapManager;
export { ChannelCreationInfo };
