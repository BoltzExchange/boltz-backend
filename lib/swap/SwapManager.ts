import { crypto } from 'bitcoinjs-lib';
import type { Types } from 'boltz-core';
import {
  Scripts,
  SwapTreeSerializer,
  reverseSwapScript,
  reverseSwapTree,
  swapScript,
  swapTree,
} from 'boltz-core';
import {
  Feature,
  reverseSwapTree as reverseSwapTreeLiquid,
} from 'boltz-core/dist/lib/liquid';
import { randomBytes } from 'crypto';
import type { Network as LiquidNetwork } from 'liquidjs-lib/src/networks';
import { Op, Transaction } from 'sequelize';
import type { SwapConfig } from '../Config';
import {
  createMusig,
  getBlindingKey,
  toOutputScript,
  tweakMusig,
} from '../Core';
import type Logger from '../Logger';
import {
  formatError,
  generateSwapId,
  getChainCurrency,
  getHexString,
  getLightningCurrency,
  getPairId,
  getPrepayMinerFeeInvoiceMemo,
  getScriptHashFunction,
  getSendingReceivingCurrency,
  getUnixTime,
  splitPairId,
} from '../Utils';
import { LegacyReverseSwapOutputType } from '../consts/Consts';
import {
  ChannelCreationType,
  CurrencyType,
  OrderSide,
  SwapType,
  SwapUpdateEvent,
  SwapVersion,
  swapVersionToString,
} from '../consts/Enums';
import type { PairConfig } from '../consts/Types';
import Database from '../db/Database';
import type ReverseSwap from '../db/models/ReverseSwap';
import { NodeType } from '../db/models/ReverseSwap';
import type Swap from '../db/models/Swap';
import type { ChainSwapDataTypeInsert } from '../db/repositories/ChainSwapRepository';
import ChainSwapRepository from '../db/repositories/ChainSwapRepository';
import ChannelCreationRepository from '../db/repositories/ChannelCreationRepository';
import ReverseRoutingHintRepository from '../db/repositories/ReverseRoutingHintRepository';
import ReverseSwapRepository from '../db/repositories/ReverseSwapRepository';
import ScriptPubKeyRepository from '../db/repositories/ScriptPubKeyRepository';
import SwapRepository from '../db/repositories/SwapRepository';
import TransactionLabelRepository from '../db/repositories/TransactionLabelRepository';
import { msatToSat } from '../lightning/ChannelUtils';
import type { HopHint, LightningClient } from '../lightning/LightningClient';
import type NotificationClient from '../notifications/NotificationClient';
import type { SwapFees } from '../rates/FeeProvider';
import type LockupTransactionTracker from '../rates/LockupTransactionTracker';
import type RateProvider from '../rates/RateProvider';
import type BalanceCheck from '../service/BalanceCheck';
import ServiceErrors from '../service/Errors';
import InvoiceExpiryHelper from '../service/InvoiceExpiryHelper';
import type PaymentRequestUtils from '../service/PaymentRequestUtils';
import Renegotiator from '../service/Renegotiator';
import TimeoutDeltaProvider from '../service/TimeoutDeltaProvider';
import ChainSwapSigner from '../service/cooperative/ChainSwapSigner';
import DeferredClaimer from '../service/cooperative/DeferredClaimer';
import EipSigner from '../service/cooperative/EipSigner';
import type DecodedInvoice from '../sidecar/DecodedInvoice';
import { InvoiceType } from '../sidecar/DecodedInvoice';
import type Sidecar from '../sidecar/Sidecar';
import type WalletLiquid from '../wallet/WalletLiquid';
import type { Currency } from '../wallet/WalletManager';
import type WalletManager from '../wallet/WalletManager';
import Errors from './Errors';
import NodeFallback from './NodeFallback';
import NodeSwitch from './NodeSwitch';
import ReverseRoutingHints from './ReverseRoutingHints';
import SwapNursery from './SwapNursery';
import type SwapOutputType from './SwapOutputType';
import CreationHook from './hooks/CreationHook';
import RoutingHints from './routing/RoutingHints';

export type InvoiceExpiryRange = {
  min: number;
  max: number;
};

type ChannelCreationInfo = {
  auto: boolean;
  private: boolean;
  inboundLiquidity: number;
};

type SetSwapInvoiceResponse = {
  channelCreationError?: string;
  expectedAmount: number;
  acceptZeroConf: boolean;
};

type CreatedSwap = {
  id: string;
  timeoutBlockHeight: number;

  // This is either the generated address for Bitcoin like chains, or the address of the contract
  // to which the user should send the lockup transaction for Ether and ERC20 tokens
  address: string;

  // Only set for Bitcoin like, UTXO based, chains
  redeemScript?: string;

  // Only set for Taproot swaps
  claimPublicKey?: string;
  swapTree?: SwapTreeSerializer.SerializedTree;

  // Specified when either Ether or ERC20 tokens or swapped to Lightning
  // So that the user can specify the claim address (Boltz) in the lockup transaction to the contract
  claimAddress?: string;

  // For blinded Liquid swaps
  blindingKey?: string;
};

type CreatedOnchainSwap = {
  timeoutBlockHeight: number;

  // Only set for Taproot swaps
  refundPublicKey?: string;
  swapTree?: SwapTreeSerializer.SerializedTree;

  // Only set for Ethereum like chains
  claimAddress?: string;
  refundAddress?: string;

  // This is either the generated address for Bitcoin like chains, or the address of the contract
  // to which Boltz will send the lockup transaction for Ether and ERC20 tokens
  lockupAddress: string;

  // For blinded Liquid reverse swaps
  blindingKey?: string;
};

type CreatedReverseSwap = {
  id: string;

  invoice: string;
  minerFeeInvoice: string | undefined;

  // Only set for Bitcoin like, UTXO based, chains
  redeemScript: string | undefined;
} & CreatedOnchainSwap;

type CreatedChainSwapDetails = Omit<CreatedOnchainSwap, 'refundPublicKey'> & {
  amount: number;
  serverPublicKey: string | undefined;
};

type CreatedChainSwap = {
  id: string;

  claimDetails: CreatedChainSwapDetails;
  lockupDetails: CreatedChainSwapDetails;
};

class SwapManager {
  public currencies = new Map<string, Currency>();

  public nursery: SwapNursery;
  public routingHints!: RoutingHints;
  public readonly creationHook: CreationHook;
  public readonly renegotiator: Renegotiator;
  public readonly deferredClaimer: DeferredClaimer;
  public readonly chainSwapSigner: ChainSwapSigner;
  public readonly eipSigner: EipSigner;

  private nodeFallback!: NodeFallback;
  private invoiceExpiryHelper!: InvoiceExpiryHelper;
  private readonly reverseRoutingHints: ReverseRoutingHints;

  constructor(
    private readonly logger: Logger,
    notifications: NotificationClient | undefined,
    private readonly walletManager: WalletManager,
    private readonly nodeSwitch: NodeSwitch,
    private readonly rateProvider: RateProvider,
    private readonly timeoutDeltaProvider: TimeoutDeltaProvider,
    paymentRequestUtils: PaymentRequestUtils,
    private readonly swapOutputType: SwapOutputType,
    retryInterval: number,
    swapConfig: SwapConfig,
    lockupTransactionTracker: LockupTransactionTracker,
    private readonly sidecar: Sidecar,
    balanceCheck: BalanceCheck,
  ) {
    this.deferredClaimer = new DeferredClaimer(
      this.logger,
      this.currencies,
      this.rateProvider,
      this.walletManager,
      this.swapOutputType,
      swapConfig,
    );

    this.chainSwapSigner = new ChainSwapSigner(
      this.logger,
      this.currencies,
      this.walletManager,
      this.swapOutputType,
    );
    this.eipSigner = new EipSigner(
      this.logger,
      this.currencies,
      this.walletManager,
      sidecar,
    );

    this.nursery = new SwapNursery(
      this.logger,
      sidecar,
      notifications,
      this.nodeSwitch,
      rateProvider,
      timeoutDeltaProvider,
      this.walletManager,
      this.swapOutputType,
      retryInterval,
      this.deferredClaimer,
      this.chainSwapSigner,
      lockupTransactionTracker,
      swapConfig.overpayment,
      swapConfig.paymentTimeoutMinutes,
    );

    this.renegotiator = new Renegotiator(
      this.logger,
      this.currencies,
      this.walletManager,
      this.nursery,
      this.chainSwapSigner,
      this.eipSigner,
      rateProvider,
      balanceCheck,
    );

    this.reverseRoutingHints = new ReverseRoutingHints(
      this.walletManager,
      this.rateProvider,
      paymentRequestUtils,
    );

    this.creationHook = new CreationHook(this.logger, notifications);
  }

  /**
   * Calculates the amount of an invoice for a Submarine Swap
   */
  public static calculateInvoiceAmount = (
    orderSide: number,
    rate: number,
    onchainAmount: number,
    baseFee: number,
    percentageFee: number,
  ) => {
    if (orderSide === OrderSide.BUY) {
      rate = 1 / rate;
    }

    return Math.floor(((onchainAmount - baseFee) * rate) / (1 + percentageFee));
  };

  public init = async (
    currencies: Currency[],
    pairs: PairConfig[],
  ): Promise<void> => {
    currencies.forEach((currency) => {
      this.currencies.set(currency.symbol, currency);
    });

    await this.nursery.init(currencies);

    const pendingReverseSwaps = await ReverseSwapRepository.getReverseSwaps({
      status: {
        [Op.in]: [SwapUpdateEvent.SwapCreated, SwapUpdateEvent.MinerFeePaid],
      },
    });
    await this.recreateInvoiceSubscriptions(pendingReverseSwaps);

    for (const currency of this.currencies.values()) {
      if (currency.clnClient === undefined) {
        continue;
      }

      currency.clnClient.subscribeTrackHoldInvoices();
    }

    await this.chainSwapSigner.init();

    this.logger.info('Recreated invoice subscriptions');

    this.routingHints = new RoutingHints(this.logger, currencies);
    await this.routingHints.start();

    this.nodeFallback = new NodeFallback(
      this.logger,
      this.nodeSwitch,
      this.routingHints,
    );

    this.invoiceExpiryHelper = new InvoiceExpiryHelper(
      pairs,
      this.timeoutDeltaProvider,
    );

    await this.deferredClaimer.init();
  };

  public getInvoiceExpiryRange = (pairId: string): InvoiceExpiryRange => {
    return {
      min: InvoiceExpiryHelper.minInvoiceExpiry,
      max: this.invoiceExpiryHelper.getExpiry(pairId),
    };
  };

  /**
   * Creates a new Submarine Swap from the chain to Lightning with a preimage hash
   */
  public createSwap = async (args: {
    version: SwapVersion;

    baseCurrency: string;
    quoteCurrency: string;
    orderSide: OrderSide;
    preimageHash: Buffer;
    timeoutBlockDelta: number;
    paymentTimeout?: number;
    channel?: ChannelCreationInfo;

    // Referral ID for the swap
    referralId?: string;

    // Only required for UTXO based chains
    refundPublicKey?: Buffer;
  }): Promise<CreatedSwap> => {
    const { sendingCurrency, receivingCurrency } = this.getCurrencies(
      args.baseCurrency,
      args.quoteCurrency,
      args.orderSide,
    );

    if (!NodeSwitch.hasClient(sendingCurrency)) {
      throw Errors.NO_LIGHTNING_SUPPORT(sendingCurrency.symbol);
    }

    const id = generateSwapId(args.version);

    this.logger.verbose(
      `Creating new ${swapVersionToString(args.version)} Swap from ${
        receivingCurrency.symbol
      } to ${sendingCurrency.symbol}: ${id}`,
    );

    if (args.referralId) {
      this.logger.silly(`Using referral ID ${args.referralId} for Swap ${id}`);
    }

    const pair = getPairId({
      base: args.baseCurrency,
      quote: args.quoteCurrency,
    });

    const result: Partial<CreatedSwap> = {
      id,
    };

    if (
      receivingCurrency.type === CurrencyType.BitcoinLike ||
      receivingCurrency.type === CurrencyType.Liquid
    ) {
      const { blocks } =
        await receivingCurrency.chainClient!.getBlockchainInfo();
      result.timeoutBlockHeight = blocks + args.timeoutBlockDelta;

      const { keys, index } = await receivingCurrency.wallet.getNewKeys();

      let outputScript: Buffer;
      let tree: Types.SwapTree | undefined;

      switch (args.version) {
        case SwapVersion.Taproot: {
          result.claimPublicKey = getHexString(keys.publicKey);

          tree = swapTree(
            receivingCurrency.type === CurrencyType.Liquid,
            args.preimageHash,
            keys.publicKey,
            args.refundPublicKey!,
            result.timeoutBlockHeight,
          );
          result.swapTree = SwapTreeSerializer.serializeSwapTree(tree);

          const musig = createMusig(keys, args.refundPublicKey!);
          const tweakedKey = tweakMusig(receivingCurrency.type, musig, tree);
          outputScript = Scripts.p2trOutput(tweakedKey);

          break;
        }

        default: {
          const redeemScript = swapScript(
            args.preimageHash,
            keys.publicKey,
            args.refundPublicKey!,
            result.timeoutBlockHeight,
          );
          result.redeemScript = getHexString(redeemScript);

          const encodeFunction = getScriptHashFunction(
            this.swapOutputType.get(receivingCurrency.type),
          );
          outputScript = encodeFunction(redeemScript);

          break;
        }
      }

      result.address = receivingCurrency.wallet.encodeAddress(outputScript);

      if (receivingCurrency.type === CurrencyType.Liquid) {
        result.blindingKey = getHexString(
          (
            receivingCurrency.wallet as WalletLiquid
          ).deriveBlindingKeyFromScript(outputScript).privateKey!,
        );
      }

      await Database.sequelize.transaction(
        { isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE },
        async (tx) => {
          await SwapRepository.addSwap(
            {
              id,
              pair,

              keyIndex: index,
              version: args.version,
              orderSide: args.orderSide,
              referral: args.referralId,
              lockupAddress: result.address!,
              paymentTimeout: args.paymentTimeout,
              status: SwapUpdateEvent.SwapCreated,
              timeoutBlockHeight: result.timeoutBlockHeight!,
              createdRefundSignature: false,
              preimageHash: getHexString(args.preimageHash),
              refundPublicKey: getHexString(args.refundPublicKey!),
              redeemScript:
                args.version === SwapVersion.Legacy
                  ? result.redeemScript
                  : JSON.stringify(SwapTreeSerializer.serializeSwapTree(tree!)),
            },
            { transaction: tx },
          );
          await ScriptPubKeyRepository.add(
            id,
            receivingCurrency.symbol,
            outputScript,
            { transaction: tx },
          );
        },
      );
    } else {
      result.address = await this.getLockupContractAddress(
        receivingCurrency.symbol,
        receivingCurrency.type,
      );

      const blockNumber = await receivingCurrency.provider!.getBlockNumber();
      result.timeoutBlockHeight = blockNumber + args.timeoutBlockDelta;

      result.claimAddress = await receivingCurrency.wallet.getAddress(
        TransactionLabelRepository.claimAddressLabel(SwapType.Submarine, id),
      );

      await SwapRepository.addSwap({
        id,
        pair,

        version: args.version,
        referral: args.referralId,
        orderSide: args.orderSide,
        lockupAddress: result.address,
        paymentTimeout: args.paymentTimeout,
        status: SwapUpdateEvent.SwapCreated,
        preimageHash: getHexString(args.preimageHash),
        timeoutBlockHeight: result.timeoutBlockHeight,
        createdRefundSignature: false,
      });
    }

    if (args.channel !== undefined) {
      this.logger.verbose(`Adding Channel Creation for Swap: ${id}`);

      await ChannelCreationRepository.addChannelCreation({
        swapId: id,
        private: args.channel.private,
        type: args.channel.auto
          ? ChannelCreationType.Auto
          : ChannelCreationType.Create,
        inboundLiquidity: args.channel.inboundLiquidity,
      });
    }

    return result as CreatedSwap;
  };

  /**
   * Sets the invoice for a Submarine Swap
   *
   * @param swap database object of the swap
   * @param invoice invoice of the Swap
   * @param rate exchange rate for the swap pair
   * @param fees fee structure including base, percentage, and extra fees
   * @param canBeRouted whether the invoice can be routed
   * @param emitSwapInvoiceSet method to emit an event after the invoice has been set
   */
  public setSwapInvoice = async (
    swap: Swap,
    invoice: string,
    rate: number,
    fees: SwapFees,
    canBeRouted: boolean,
    emitSwapInvoiceSet: (id: string) => void,
  ): Promise<SetSwapInvoiceResponse> => {
    const { base, quote } = splitPairId(swap.pair);
    const { receivingCurrency } = this.getCurrencies(
      base,
      quote,
      swap.orderSide,
    );

    const decodedInvoice = await this.sidecar.decodeInvoiceOrOffer(invoice);
    if (decodedInvoice.type === InvoiceType.Offer) {
      throw Errors.NO_OFFERS_ALLOWED();
    }
    const invoiceAmount = msatToSat(decodedInvoice.amountMsat);

    if (getHexString(decodedInvoice.paymentHash!) !== swap.preimageHash) {
      throw Errors.INVOICE_INVALID_PREIMAGE_HASH(swap.preimageHash);
    }

    if (decodedInvoice.isExpired) {
      throw Errors.INVOICE_EXPIRED_ALREADY();
    }

    const channelCreation = await ChannelCreationRepository.getChannelCreation({
      swapId: swap.id,
    });

    let channelCreationError: string | undefined;

    if (channelCreation) {
      const getChainInfo = async (
        currency: Currency,
      ): Promise<{ blocks: number; blockTime: number }> => {
        if (
          currency.type === CurrencyType.BitcoinLike ||
          currency.type === CurrencyType.Liquid
        ) {
          const { blocks } = await currency.chainClient!.getBlockchainInfo();

          return {
            blocks,
            blockTime: TimeoutDeltaProvider.blockTimes.get(currency.symbol)!,
          };

          // All currencies that are not Bitcoin-like are either Ether or an ERC20 token on the Ethereum chain
        } else {
          const networkInfo = this.walletManager.ethereumManagers.find(
            (manager) => manager.hasSymbol(currency.symbol),
          )!.networkDetails;

          return {
            blocks: await currency.provider!.getBlockNumber(),
            blockTime: TimeoutDeltaProvider.blockTimes.get(networkInfo.symbol)!,
          };
        }
      };

      const { blocks, blockTime } = await getChainInfo(receivingCurrency);
      const blocksUntilExpiry = swap.timeoutBlockHeight - blocks;

      const timeoutTimestamp =
        getUnixTime() + blocksUntilExpiry * blockTime * 60;

      if (timeoutTimestamp > decodedInvoice.expiryTimestamp) {
        const invoiceError = Errors.INVOICE_EXPIRES_TOO_EARLY(
          decodedInvoice.expiryTimestamp,
          timeoutTimestamp,
        );

        // In the auto Channel Creation mode, which is used by the frontend, the invoice check can fail but the Swap should
        // still be attempted without Channel Creation
        if (channelCreation.type === ChannelCreationType.Auto) {
          this.logger.info(
            `Disabling Channel Creation for Swap ${swap.id}: ${invoiceError.message}`,
          );
          channelCreationError = invoiceError.message;

          await channelCreation.destroy();

          if (!canBeRouted) {
            throw Errors.NO_ROUTE_FOUND();
          }

          // In other modes (only manual right now), a failing invoice Check should result in a failed request
        } else {
          throw invoiceError;
        }
      }

      await ChannelCreationRepository.setNodePublicKey(
        channelCreation,
        getHexString(decodedInvoice.payee!),
      );
    } else if (
      !decodedInvoice.routingHints ||
      (decodedInvoice.routingHints && decodedInvoice.routingHints.length === 0)
    ) {
      if (!canBeRouted) {
        throw Errors.NO_ROUTE_FOUND();
      }
    }

    this.logger.debug(
      `Setting ${decodedInvoice.typePretty} invoice of Swap ${swap.id}: ${invoice}`,
    );

    if (
      !(await this.creationHook.hook(swap.type, {
        invoice,
        invoiceAmount,
        id: swap.id,
        referral: swap.referral,
        symbolReceiving: swap.chainCurrency,
        symbolSending: swap.lightningCurrency,
      }))
    ) {
      throw Errors.HOOK_REJECTED();
    }

    await this.nursery.lock.acquire(SwapNursery.swapLock, async () => {
      // Fetch the swap
      const updatedSwap = (await SwapRepository.getSwap({ id: swap.id }))!;

      if (updatedSwap.createdRefundSignature) {
        throw Errors.SWAP_ALREADY_REFUNDED(updatedSwap.id);
      }
      swap = updatedSwap;

      const expectedAmount =
        Math.floor(invoiceAmount * rate) +
        fees.baseFee +
        fees.percentageFee +
        (fees.extraFee || 0);

      if (swap.onchainAmount && expectedAmount > swap.onchainAmount) {
        const maxInvoiceAmount = SwapManager.calculateInvoiceAmount(
          swap.orderSide,
          rate,
          swap.onchainAmount,
          fees.baseFee,
          fees.percentageFeeRate,
        );

        // that error was originally thrown in the `Service` class, so we keep backwards-compat
        // by not changing the error code
        throw ServiceErrors.INVALID_INVOICE_AMOUNT(
          Math.max(maxInvoiceAmount, 0),
        );
      }

      const chainCurrency = getChainCurrency(
        base,
        quote,
        swap.orderSide,
        false,
      );

      const acceptZeroConf = this.rateProvider.acceptZeroConf(
        chainCurrency,
        expectedAmount,
      );

      const minutesUntilExpiry =
        (decodedInvoice.expiryTimestamp - getUnixTime()) / 60;

      // When we do not accept 0-conf, we make sure there is enough time for a lockup transaction to confirm
      if (!acceptZeroConf) {
        if (
          (TimeoutDeltaProvider.blockTimes.get(chainCurrency) || 0) * 2 >
          minutesUntilExpiry
        ) {
          throw ServiceErrors.INVOICE_EXPIRY_TOO_SHORT();
        }
      }

      await SwapRepository.setInvoice(
        swap,
        invoice,
        invoiceAmount,
        expectedAmount,
        fees.percentageFee,
        acceptZeroConf,
      );

      // Not the most elegant way to emit this event, but the only option
      // to emit it before trying to claim the swap
      emitSwapInvoiceSet(updatedSwap.id);

      // If the onchain coins were sent already and 0-conf can be accepted or
      // the lockup transaction is confirmed the swap should be settled directly
      if (
        updatedSwap.lockupTransactionId &&
        updatedSwap.status === SwapUpdateEvent.TransactionConfirmed &&
        swap.expectedAmount === swap.onchainAmount &&
        updatedSwap.expectedAmount === updatedSwap.onchainAmount
      ) {
        try {
          await this.nursery.attemptSettleSwap(receivingCurrency, updatedSwap);
        } catch (error) {
          this.logger.warn(
            `Could not settle Swap ${swap.id}: ${formatError(error)}`,
          );
        }
      }
    });

    return {
      channelCreationError,
      acceptZeroConf: swap.acceptZeroConf!,
      expectedAmount: swap.expectedAmount!,
    };
  };

  /**
   * Creates a new reverse Swap from Lightning to the chain
   */
  public createReverseSwap = async (args: {
    version: number;

    baseCurrency: string;
    quoteCurrency: string;
    orderSide: OrderSide;
    preimageHash: Buffer;
    holdInvoiceAmount: number;
    onchainAmount: number;
    onchainTimeoutBlockDelta: number;
    lightningTimeoutBlockDelta: number;
    percentageFee: number;

    prepayMinerFeeInvoiceAmount?: number;
    prepayMinerFeeOnchainAmount?: number;

    invoice?: { invoice: string; decoded: DecodedInvoice };

    // Public key of the node for which routing hints should be included in the invoice(s)
    routingNode?: string;

    // Referral ID for the reverse swap
    referralId?: string;

    // Only required for Swaps to UTXO based chains
    claimPublicKey?: Buffer;

    // Only required for Swaps to Ether and ERC20 tokens
    // Address of the user to which the coins will be sent after a successful claim transaction
    claimAddress?: string;

    userAddress?: string;
    userAddressSignature?: Buffer;

    claimCovenant: boolean;

    memo?: string;
    descriptionHash?: Buffer;

    invoiceExpiry?: number;
  }): Promise<CreatedReverseSwap> => {
    const isInvoice = args.invoice !== undefined;
    const { sendingCurrency, receivingCurrency } = this.getCurrencies(
      args.baseCurrency,
      args.quoteCurrency,
      args.orderSide,
    );

    if (
      !NodeSwitch.hasClient(
        receivingCurrency,
        isInvoice ? NodeType.CLN : undefined,
      )
    ) {
      throw Errors.NO_LIGHTNING_SUPPORT(receivingCurrency.symbol);
    }

    const id = generateSwapId(args.version);

    this.logger.verbose(
      `Creating new ${swapVersionToString(args.version)} Reverse Swap from ${
        receivingCurrency.symbol
      } to ${sendingCurrency.symbol}: ${id}`,
    );
    if (args.referralId) {
      this.logger.silly(
        `Using referral ID ${args.referralId} for Reverse Swap ${id}`,
      );
    }

    if (
      !(await this.creationHook.hook(SwapType.ReverseSubmarine, {
        id,
        referral: args.referralId,
        invoiceAmount: args.holdInvoiceAmount,
        symbolSending: sendingCurrency.symbol,
        symbolReceiving: receivingCurrency.symbol,
      }))
    ) {
      throw Errors.HOOK_REJECTED();
    }

    const isBitcoinLike =
      sendingCurrency.type === CurrencyType.BitcoinLike ||
      sendingCurrency.type === CurrencyType.Liquid;

    const pair = getPairId({
      base: args.baseCurrency,
      quote: args.quoteCurrency,
    });

    const hints = this.reverseRoutingHints.getHints(sendingCurrency, args);

    let nodeType: NodeType;
    let lightningClient: LightningClient;
    let paymentRequest: string;
    let routingHints: HopHint[][] | undefined = undefined;

    if (isInvoice) {
      if (args.memo !== undefined || args.descriptionHash !== undefined) {
        throw 'not supported for BOLT12 invoices';
      }

      // We already asserted that CLN is available
      await receivingCurrency.clnClient!.injectHoldInvoice(
        args.invoice!.invoice,
        args.lightningTimeoutBlockDelta,
      );

      nodeType = NodeType.CLN;
      paymentRequest = args.invoice!.invoice;
      lightningClient = receivingCurrency.clnClient!;
    } else {
      const res = await this.nodeFallback.getReverseSwapInvoice(
        id,
        args.referralId,
        args.routingNode,
        receivingCurrency,
        args.holdInvoiceAmount,
        args.preimageHash,
        args.lightningTimeoutBlockDelta,
        this.invoiceExpiryHelper.getExpiry(pair, args.invoiceExpiry),
        hints.invoiceMemo,
        hints.invoiceDescriptionHash,
        hints.routingHint,
      );

      res.lightningClient.subscribeSingleInvoice(args.preimageHash);
      nodeType = res.nodeType;
      lightningClient = res.lightningClient;
      paymentRequest = res.paymentRequest;
      routingHints = res.routingHints;
    }

    let minerFeeInvoice: string | undefined = undefined;
    let minerFeeInvoicePreimage: string | undefined = undefined;

    if (args.prepayMinerFeeInvoiceAmount) {
      const preimage = randomBytes(32);
      minerFeeInvoicePreimage = getHexString(preimage);

      const minerFeeInvoicePreimageHash = crypto.sha256(preimage);

      minerFeeInvoice = await lightningClient.addHoldInvoice(
        args.prepayMinerFeeInvoiceAmount,
        minerFeeInvoicePreimageHash,
        undefined,
        this.invoiceExpiryHelper.getExpiry(pair),
        getPrepayMinerFeeInvoiceMemo(sendingCurrency.symbol),
        undefined,
        routingHints,
      );

      lightningClient.subscribeSingleInvoice(minerFeeInvoicePreimageHash);

      if (args.prepayMinerFeeOnchainAmount) {
        this.logger.debug(
          `Sending ${args.prepayMinerFeeOnchainAmount} ${
            this.walletManager.ethereumManagers.find((manager) =>
              manager.hasSymbol(sendingCurrency.symbol),
            )!.networkDetails.name
          } as prepay miner fee for Reverse Swap: ${id}`,
        );
      }
    }

    const result: Partial<CreatedReverseSwap> = {
      id,
      minerFeeInvoice,
      invoice: paymentRequest,
    };

    if (isBitcoinLike) {
      const { keys, index } = await sendingCurrency.wallet.getNewKeys();
      const { blocks } = await sendingCurrency.chainClient!.getBlockchainInfo();

      result.timeoutBlockHeight = blocks + args.onchainTimeoutBlockDelta;

      let outputScript: Buffer;
      let tree: Types.SwapTree | undefined;

      switch (args.version) {
        case SwapVersion.Taproot: {
          result.refundPublicKey = getHexString(keys.publicKey);

          if (args.claimCovenant) {
            if (sendingCurrency.type !== CurrencyType.Liquid) {
              throw 'claim covenant only supported on Liquid';
            }

            if (args.userAddress === undefined) {
              throw 'userAddress for covenant not specified';
            }

            try {
              sendingCurrency.wallet.decodeAddress(args.userAddress);
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (e) {
              throw Errors.INVALID_ADDRESS();
            }

            tree = reverseSwapTreeLiquid(
              args.preimageHash,
              args.claimPublicKey!,
              keys.publicKey,
              result.timeoutBlockHeight,
              [
                {
                  // Leave 1 sat in case the swap is covenant claimed which needs a blinded OP_RETURN with 1 sat
                  expectedAmount: hints.receivedAmount - 1,
                  type: Feature.ClaimCovenant,
                  assetHash: (
                    this.walletManager.wallets.get(sendingCurrency.symbol)!
                      .network as LiquidNetwork
                  ).assetHash,
                  outputScript: this.walletManager.wallets
                    .get(sendingCurrency.symbol)!
                    .decodeAddress(args.userAddress!),
                },
              ],
            );
          } else {
            tree = reverseSwapTree(
              sendingCurrency.type === CurrencyType.Liquid,
              args.preimageHash,
              args.claimPublicKey!,
              keys.publicKey,
              result.timeoutBlockHeight,
            );
          }

          result.swapTree = SwapTreeSerializer.serializeSwapTree(tree);

          const musig = createMusig(keys, args.claimPublicKey!);
          const tweakedKey = tweakMusig(sendingCurrency.type, musig, tree);
          outputScript = Scripts.p2trOutput(tweakedKey);

          break;
        }

        default: {
          const redeemScript = reverseSwapScript(
            args.preimageHash,
            args.claimPublicKey!,
            keys.publicKey,
            result.timeoutBlockHeight,
          );
          result.redeemScript = getHexString(redeemScript);

          outputScript = getScriptHashFunction(LegacyReverseSwapOutputType)(
            redeemScript,
          );

          break;
        }
      }

      result.lockupAddress = sendingCurrency.wallet.encodeAddress(outputScript);

      if (sendingCurrency.type === CurrencyType.Liquid) {
        result.blindingKey = getHexString(
          (sendingCurrency.wallet as WalletLiquid).deriveBlindingKeyFromScript(
            outputScript,
          ).privateKey!,
        );
      }

      await ReverseSwapRepository.addReverseSwap({
        id,
        pair,
        minerFeeInvoice,
        node: nodeType,
        keyIndex: index,
        version: args.version,
        fee: args.percentageFee,
        invoice: paymentRequest,
        referral: args.referralId,
        orderSide: args.orderSide,
        onchainAmount: args.onchainAmount,
        lockupAddress: result.lockupAddress,
        status: SwapUpdateEvent.SwapCreated,
        invoiceAmount: args.holdInvoiceAmount,
        timeoutBlockHeight: result.timeoutBlockHeight,
        preimageHash: getHexString(args.preimageHash),
        minerFeeInvoicePreimage: minerFeeInvoicePreimage,
        claimPublicKey: getHexString(args.claimPublicKey!),
        minerFeeOnchainAmount: args.prepayMinerFeeOnchainAmount,
        redeemScript:
          args.version === SwapVersion.Legacy
            ? result.redeemScript
            : JSON.stringify(SwapTreeSerializer.serializeSwapTree(tree!)),
      });

      if (
        hints.bip21Params !== undefined &&
        args.userAddress !== undefined &&
        args.userAddressSignature !== undefined
      ) {
        const scriptPubkey = toOutputScript(
          sendingCurrency.type,
          args.userAddress,
          sendingCurrency.network!,
        );

        await ReverseRoutingHintRepository.addHint({
          swapId: id,
          scriptPubkey,
          blindingPubkey: getBlindingKey(
            sendingCurrency.type,
            args.userAddress,
          ),
          symbol: sendingCurrency.symbol,
          params: hints.bip21Params,
          signature: args.userAddressSignature,
        });
      }
    } else {
      const blockNumber = await sendingCurrency.provider!.getBlockNumber();
      result.timeoutBlockHeight = blockNumber + args.onchainTimeoutBlockDelta;

      result.lockupAddress = await this.getLockupContractAddress(
        sendingCurrency.symbol,
        sendingCurrency.type,
      );
      result.refundAddress = await this.walletManager.wallets
        .get(sendingCurrency.symbol)!
        .getAddress(
          TransactionLabelRepository.refundAddressLabel(
            SwapType.ReverseSubmarine,
            id,
          ),
        );

      await ReverseSwapRepository.addReverseSwap({
        id,
        pair,
        minerFeeInvoice,
        node: nodeType,
        fee: args.percentageFee,

        invoice: paymentRequest,
        orderSide: args.orderSide,
        referral: args.referralId,
        version: SwapVersion.Taproot,
        claimAddress: args.claimAddress!,
        lockupAddress: result.lockupAddress,
        onchainAmount: args.onchainAmount,
        status: SwapUpdateEvent.SwapCreated,
        invoiceAmount: args.holdInvoiceAmount,
        timeoutBlockHeight: result.timeoutBlockHeight,
        preimageHash: getHexString(args.preimageHash),
        minerFeeInvoicePreimage: minerFeeInvoicePreimage,
        minerFeeOnchainAmount: args.prepayMinerFeeOnchainAmount,
      });
    }

    return result as CreatedReverseSwap;
  };

  // TODO: test
  public createChainSwap = async (args: {
    baseCurrency: string;
    quoteCurrency: string;
    orderSide: OrderSide;

    percentageFee: number;

    preimageHash: Buffer;
    claimAddress?: string;

    claimPublicKey?: Buffer;
    refundPublicKey?: Buffer;

    userLockAmount: number;
    serverLockAmount: number;
    acceptZeroConf: boolean;

    sendingTimeoutBlockDelta: number;
    receivingTimeoutBlockDelta: number;

    referralId?: string;
  }): Promise<CreatedChainSwap> => {
    const { sendingCurrency, receivingCurrency } = this.getCurrencies(
      args.baseCurrency,
      args.quoteCurrency,
      args.orderSide,
    );

    const id = generateSwapId(SwapVersion.Taproot);

    this.logger.verbose(
      `Creating new ${swapVersionToString(SwapVersion.Taproot)} Chain Swap from ${
        receivingCurrency.symbol
      } to ${sendingCurrency.symbol}: ${id}`,
    );
    if (args.referralId) {
      this.logger.silly(
        `Using referral ID ${args.referralId} for Chain Swap ${id}`,
      );
    }

    if (
      !(await this.creationHook.hook(SwapType.Chain, {
        id,
        referral: args.referralId,
        userLockAmount: args.userLockAmount,
        symbolSending: sendingCurrency.symbol,
        symbolReceiving: receivingCurrency.symbol,
      }))
    ) {
      throw Errors.HOOK_REJECTED();
    }

    const createChainData = async (
      isSending: boolean,
      currency: typeof sendingCurrency,
      amount: number,
      timeoutBlockDelta: number,
      theirPublicKey?: Buffer,
    ): Promise<{
      dbData: ChainSwapDataTypeInsert;
      serverKeys: string | undefined;
      blindingKey: string | undefined;
      claimAddress: string | undefined;
      refundAddress: string | undefined;
      tree: Types.SwapTree | Types.LiquidSwapTree | undefined;
    }> => {
      const res: Partial<ChainSwapDataTypeInsert> = {
        swapId: id,
        expectedAmount: amount,
        symbol: currency.symbol,
      };
      let serverKeys: string | undefined;
      let blindingKey: string | undefined;
      let claimAddress: string | undefined;
      let refundAddress: string | undefined;
      let tree: Types.SwapTree | Types.LiquidSwapTree | undefined;

      if (
        currency.type === CurrencyType.BitcoinLike ||
        currency.type === CurrencyType.Liquid
      ) {
        const { keys, index } = await currency.wallet.getNewKeys();
        res.keyIndex = index;
        serverKeys = getHexString(keys.publicKey);
        res.theirPublicKey = getHexString(theirPublicKey!);

        const { blocks } = await currency.chainClient!.getBlockchainInfo();
        res.timeoutBlockHeight = blocks + timeoutBlockDelta;

        tree = reverseSwapTree(
          currency.type === CurrencyType.Liquid,
          args.preimageHash,
          isSending ? theirPublicKey! : keys.publicKey,
          isSending ? keys.publicKey : theirPublicKey!,
          res.timeoutBlockHeight,
        );
        res.swapTree = JSON.stringify(
          SwapTreeSerializer.serializeSwapTree(tree),
        );

        const musig = createMusig(keys, theirPublicKey!);
        const tweakedKey = tweakMusig(currency.type, musig, tree);
        res.scriptPubKey = Scripts.p2trOutput(tweakedKey);
        res.lockupAddress = currency.wallet.encodeAddress(res.scriptPubKey);

        if (currency.type === CurrencyType.Liquid) {
          blindingKey = getHexString(
            (currency.wallet as WalletLiquid).deriveBlindingKeyFromScript(
              res.scriptPubKey,
            ).privateKey!,
          );
        }
      } else {
        const blockNumber = await currency.provider!.getBlockNumber();
        res.timeoutBlockHeight = blockNumber + timeoutBlockDelta;

        res.lockupAddress = await this.getLockupContractAddress(
          currency.symbol,
          currency.type,
        );
        res.claimAddress = isSending ? args.claimAddress : undefined;

        if (isSending) {
          refundAddress = await currency.wallet.getAddress(
            TransactionLabelRepository.refundAddressLabel(SwapType.Chain, id),
          );
        } else {
          claimAddress = await currency.wallet.getAddress(
            TransactionLabelRepository.claimAddressLabel(SwapType.Chain, id),
          );
        }
      }

      return {
        tree,
        serverKeys,
        blindingKey,
        claimAddress,
        refundAddress,
        dbData: res as ChainSwapDataTypeInsert,
      };
    };

    const sendingData = await createChainData(
      true,
      sendingCurrency,
      args.serverLockAmount,
      args.sendingTimeoutBlockDelta,
      args.claimPublicKey,
    );
    const receivingData = await createChainData(
      false,
      receivingCurrency,
      args.userLockAmount,
      args.receivingTimeoutBlockDelta,
      args.refundPublicKey,
    );

    await ChainSwapRepository.addChainSwap({
      sendingData: sendingData.dbData,
      receivingData: receivingData.dbData,
      chainSwap: {
        id,
        fee: args.percentageFee,
        orderSide: args.orderSide,
        referral: args.referralId,
        createdRefundSignature: false,
        acceptZeroConf: args.acceptZeroConf,
        status: SwapUpdateEvent.SwapCreated,
        pair: getPairId({
          base: args.baseCurrency,
          quote: args.quoteCurrency,
        }),
        preimageHash: getHexString(args.preimageHash),
      },
    });

    const serializeDetails = (
      receivingData: Awaited<ReturnType<typeof createChainData>>,
    ) => ({
      blindingKey: receivingData.blindingKey,
      claimAddress: receivingData.claimAddress,
      serverPublicKey: receivingData.serverKeys,
      refundAddress: receivingData.refundAddress,
      amount: receivingData.dbData.expectedAmount,
      lockupAddress: receivingData.dbData.lockupAddress,
      timeoutBlockHeight: receivingData.dbData.timeoutBlockHeight,
      swapTree: receivingData.tree
        ? SwapTreeSerializer.serializeSwapTree(receivingData.tree)
        : undefined,
    });

    return {
      id,
      claimDetails: serializeDetails(sendingData),
      lockupDetails: serializeDetails(receivingData),
    };
  };

  private recreateInvoiceSubscriptions = async (swaps: ReverseSwap[]) => {
    for (const swap of swaps) {
      if (
        swap.status === SwapUpdateEvent.SwapCreated ||
        swap.status === SwapUpdateEvent.MinerFeePaid
      ) {
        const { base, quote } = splitPairId(swap.pair);
        const lightningCurrency = getLightningCurrency(
          base,
          quote,
          swap.orderSide,
          true,
        );

        const lightningClient = NodeSwitch.getReverseSwapNode(
          this.currencies.get(lightningCurrency)!,
          swap,
        );

        if (
          swap.node === NodeType.LND &&
          swap.minerFeeInvoice &&
          swap.status !== SwapUpdateEvent.MinerFeePaid
        ) {
          const decoded = await this.sidecar.decodeInvoiceOrOffer(
            swap.minerFeeInvoice,
          );
          lightningClient.subscribeSingleInvoice(decoded.paymentHash!);
        }

        const decoded = await this.sidecar.decodeInvoiceOrOffer(swap.invoice);
        lightningClient.subscribeSingleInvoice(decoded.paymentHash!);
      }
    }
  };

  private getCurrencies = (
    baseCurrency: string,
    quoteCurrency: string,
    orderSide: OrderSide,
  ) => {
    const { sending, receiving } = getSendingReceivingCurrency(
      baseCurrency,
      quoteCurrency,
      orderSide,
    );

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
  };

  private getCurrency = (currencySymbol: string) => {
    const currency = this.currencies.get(currencySymbol);

    if (!currency) {
      throw Errors.CURRENCY_NOT_FOUND(currencySymbol).message;
    }

    return currency;
  };

  private getLockupContractAddress = (
    symbol: string,
    type: CurrencyType,
  ): Promise<string> => {
    const ethereumManager = this.walletManager.ethereumManagers.find(
      (manager) => manager.hasSymbol(symbol),
    )!;
    const contracts = ethereumManager.highestContractsVersion();

    return type === CurrencyType.Ether
      ? contracts.etherSwap.getAddress()
      : contracts.erc20Swap.getAddress();
  };
}

export default SwapManager;
export { ChannelCreationInfo };
