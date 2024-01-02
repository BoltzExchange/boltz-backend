import { crypto } from 'bitcoinjs-lib';
import {
  Scripts,
  SwapTreeSerializer,
  Types,
  reverseSwapScript,
  reverseSwapTree,
  swapScript,
  swapTree,
} from 'boltz-core';
import { randomBytes } from 'crypto';
import { Op } from 'sequelize';
import { createMusig, tweakMusig } from '../Core';
import Logger from '../Logger';
import {
  decodeInvoice,
  formatError,
  generateSwapId,
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
import { ReverseSwapOutputType } from '../consts/Consts';
import {
  ChannelCreationType,
  CurrencyType,
  OrderSide,
  SwapUpdateEvent,
  SwapVersion,
  swapVersionToString,
} from '../consts/Enums';
import { PairConfig } from '../consts/Types';
import ReverseSwap, { NodeType } from '../db/models/ReverseSwap';
import Swap from '../db/models/Swap';
import ChannelCreationRepository from '../db/repositories/ChannelCreationRepository';
import ReverseSwapRepository from '../db/repositories/ReverseSwapRepository';
import SwapRepository from '../db/repositories/SwapRepository';
import RateProvider from '../rates/RateProvider';
import InvoiceExpiryHelper from '../service/InvoiceExpiryHelper';
import TimeoutDeltaProvider from '../service/TimeoutDeltaProvider';
import WalletLiquid from '../wallet/WalletLiquid';
import WalletManager, { Currency } from '../wallet/WalletManager';
import Errors from './Errors';
import NodeFallback from './NodeFallback';
import NodeSwitch from './NodeSwitch';
import SwapNursery from './SwapNursery';
import SwapOutputType from './SwapOutputType';
import RoutingHints from './routing/RoutingHints';

type ChannelCreationInfo = {
  auto: boolean;
  private: boolean;
  inboundLiquidity: number;
};

type SetSwapInvoiceResponse = {
  channelCreationError?: string;
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

type CreatedReverseSwap = {
  id: string;
  timeoutBlockHeight: number;

  invoice: string;
  minerFeeInvoice: string | undefined;

  // Only set for Bitcoin like, UTXO based, chains
  redeemScript: string | undefined;

  // Only set for Taproot swaps
  refundPublicKey?: string;
  swapTree?: SwapTreeSerializer.SerializedTree;

  // Only set for Ethereum like chains
  refundAddress: string | undefined;

  // This is either the generated address for Bitcoin like chains, or the address of the contract
  // to which Boltz will send the lockup transaction for Ether and ERC20 tokens
  lockupAddress: string;

  // For blinded Liquid reverse swaps
  blindingKey?: string;
};

class SwapManager {
  public currencies = new Map<string, Currency>();

  public nursery: SwapNursery;
  public routingHints!: RoutingHints;

  private nodeFallback!: NodeFallback;
  private invoiceExpiryHelper!: InvoiceExpiryHelper;

  constructor(
    private readonly logger: Logger,
    private readonly walletManager: WalletManager,
    private readonly nodeSwitch: NodeSwitch,
    rateProvider: RateProvider,
    private readonly timeoutDeltaProvider: TimeoutDeltaProvider,
    private readonly swapOutputType: SwapOutputType,
    retryInterval: number,
  ) {
    this.nursery = new SwapNursery(
      this.logger,
      this.nodeSwitch,
      rateProvider,
      timeoutDeltaProvider,
      this.walletManager,
      this.swapOutputType,
      retryInterval,
    );
  }

  public init = async (
    currencies: Currency[],
    pairs: PairConfig[],
  ): Promise<void> => {
    currencies.forEach((currency) => {
      this.currencies.set(currency.symbol, currency);
    });

    await this.nursery.init(currencies);

    const [pendingSwaps, pendingReverseSwaps] = await Promise.all([
      SwapRepository.getSwaps({
        status: {
          [Op.notIn]: [
            SwapUpdateEvent.SwapExpired,
            SwapUpdateEvent.InvoicePending,
            SwapUpdateEvent.InvoiceFailedToPay,
            SwapUpdateEvent.TransactionClaimed,
          ],
        },
      }),
      ReverseSwapRepository.getReverseSwaps({
        status: {
          [Op.notIn]: [
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

    this.logger.info(
      'Recreated input and output filters and invoice subscriptions',
    );

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

      const { keys, index } = receivingCurrency.wallet.getNewKeys();

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
      receivingCurrency.chainClient!.addOutputFilter(outputScript);

      if (receivingCurrency.type === CurrencyType.Liquid) {
        result.blindingKey = getHexString(
          (
            receivingCurrency.wallet as WalletLiquid
          ).deriveBlindingKeyFromScript(outputScript).privateKey!,
        );
      }

      await SwapRepository.addSwap({
        id,
        pair,

        keyIndex: index,
        version: args.version,
        orderSide: args.orderSide,
        referral: args.referralId,
        lockupAddress: result.address,
        status: SwapUpdateEvent.SwapCreated,
        timeoutBlockHeight: result.timeoutBlockHeight,
        preimageHash: getHexString(args.preimageHash),
        redeemScript:
          args.version === SwapVersion.Legacy
            ? result.redeemScript
            : JSON.stringify(SwapTreeSerializer.serializeSwapTree(tree!)),
      });
    } else {
      result.address = await this.getLockupContractAddress(
        receivingCurrency.symbol,
        receivingCurrency.type,
      );

      const blockNumber = await receivingCurrency.provider!.getBlockNumber();
      result.timeoutBlockHeight = blockNumber + args.timeoutBlockDelta;

      result.claimAddress = await receivingCurrency.wallet.getAddress();

      await SwapRepository.addSwap({
        id,
        pair,

        lockupAddress: result.address,
        referral: args.referralId,
        orderSide: args.orderSide,
        version: SwapVersion.Legacy,
        status: SwapUpdateEvent.SwapCreated,
        preimageHash: getHexString(args.preimageHash),
        timeoutBlockHeight: result.timeoutBlockHeight,
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
   * @param invoiceAmount amount of the invoice in satoshis
   * @param expectedAmount amount that is expected onchain
   * @param percentageFee fee Boltz charges for the Swap
   * @param acceptZeroConf whether 0-conf transactions should be accepted
   * @param canBeRouted whether the invoice for the swap
   * @param emitSwapInvoiceSet method to emit an event after the invoice has been set
   */
  public setSwapInvoice = async (
    swap: Swap,
    invoice: string,
    invoiceAmount: number,
    expectedAmount: number,
    percentageFee: number,
    acceptZeroConf: boolean,
    canBeRouted: boolean,
    emitSwapInvoiceSet: (id: string) => void,
  ): Promise<SetSwapInvoiceResponse> => {
    const response: SetSwapInvoiceResponse = {};

    const { base, quote } = splitPairId(swap.pair);
    const { receivingCurrency } = this.getCurrencies(
      base,
      quote,
      swap.orderSide,
    );

    const decodedInvoice = decodeInvoice(invoice);

    if (decodedInvoice.paymentHash !== swap.preimageHash) {
      throw Errors.INVOICE_INVALID_PREIMAGE_HASH(swap.preimageHash);
    }

    const invoiceExpiry = InvoiceExpiryHelper.getInvoiceExpiry(
      decodedInvoice.timestamp,
      decodedInvoice.timeExpireDate,
    );

    if (getUnixTime() >= invoiceExpiry) {
      throw Errors.INVOICE_EXPIRED_ALREADY();
    }

    const channelCreation = await ChannelCreationRepository.getChannelCreation({
      swapId: swap.id,
    });

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

      if (timeoutTimestamp > invoiceExpiry) {
        const invoiceError = Errors.INVOICE_EXPIRES_TOO_EARLY(
          invoiceExpiry,
          timeoutTimestamp,
        );

        // In the auto Channel Creation mode, which is used by the frontend, the invoice check can fail but the Swap should
        // still be attempted without Channel Creation
        if (channelCreation.type === ChannelCreationType.Auto) {
          this.logger.info(
            `Disabling Channel Creation for Swap ${swap.id}: ${invoiceError.message}`,
          );
          response.channelCreationError = invoiceError.message;

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
        decodedInvoice.payeeNodeKey!,
      );
    } else if (
      !decodedInvoice.routingInfo ||
      (decodedInvoice.routingInfo && decodedInvoice.routingInfo.length === 0)
    ) {
      if (!canBeRouted) {
        throw Errors.NO_ROUTE_FOUND();
      }
    }

    this.logger.debug(`Setting invoice of Swap ${swap.id}: ${invoice}`);

    await this.nursery.lock.acquire(SwapNursery.swapLock, async () => {
      // Fetch the status again to make sure it is latest from the database
      const previousStatus = (await swap.reload()).status;

      await SwapRepository.setInvoice(
        swap,
        invoice,
        invoiceAmount,
        expectedAmount,
        percentageFee,
        acceptZeroConf,
      );

      // Fetch the swap
      const updatedSwap = (await SwapRepository.getSwap({ id: swap.id }))!;

      // Not the most elegant way to emit this event but the only option
      // to emit it before trying to claim the swap
      emitSwapInvoiceSet(updatedSwap.id);

      // If the onchain coins were sent already and 0-conf can be accepted or
      // the lockup transaction is confirmed the swap should be settled directly
      if (
        swap.lockupTransactionId &&
        previousStatus !== SwapUpdateEvent.TransactionZeroConfRejected
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

    return response;
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

    // Public key of the node for which routing hints should be included in the invoice(s)
    routingNode?: string;

    // Referral ID for the reverse swap
    referralId?: string;

    // Only required for Swaps to UTXO based chains
    claimPublicKey?: Buffer;

    // Only required for Swaps to Ether and ERC20 tokens
    // Address of the user to which the coins will be sent after a successful claim transaction
    claimAddress?: string;
  }): Promise<CreatedReverseSwap> => {
    const { sendingCurrency, receivingCurrency } = this.getCurrencies(
      args.baseCurrency,
      args.quoteCurrency,
      args.orderSide,
    );

    if (!NodeSwitch.hasClient(receivingCurrency)) {
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

    const pair = getPairId({
      base: args.baseCurrency,
      quote: args.quoteCurrency,
    });

    const { nodeType, lightningClient, paymentRequest, routingHints } =
      await this.nodeFallback.getReverseSwapInvoice(
        id,
        args.referralId,
        args.routingNode,
        receivingCurrency,
        args.holdInvoiceAmount,
        args.preimageHash,
        args.lightningTimeoutBlockDelta,
        this.invoiceExpiryHelper.getExpiry(pair),
        getSwapMemo(sendingCurrency.symbol, true),
      );

    lightningClient.subscribeSingleInvoice(args.preimageHash);

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

    if (
      sendingCurrency.type === CurrencyType.BitcoinLike ||
      sendingCurrency.type === CurrencyType.Liquid
    ) {
      const { keys, index } = sendingCurrency.wallet.getNewKeys();
      const { blocks } = await sendingCurrency.chainClient!.getBlockchainInfo();
      result.timeoutBlockHeight = blocks + args.onchainTimeoutBlockDelta;

      let outputScript: Buffer;
      let tree: Types.SwapTree | undefined;

      switch (args.version) {
        case SwapVersion.Taproot: {
          result.refundPublicKey = getHexString(keys.publicKey);

          tree = reverseSwapTree(
            sendingCurrency.type === CurrencyType.Liquid,
            args.preimageHash,
            args.claimPublicKey!,
            keys.publicKey,
            result.timeoutBlockHeight,
          );
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

          outputScript = getScriptHashFunction(ReverseSwapOutputType)(
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
        minerFeeOnchainAmount: args.prepayMinerFeeOnchainAmount,
        redeemScript:
          args.version === SwapVersion.Legacy
            ? result.redeemScript
            : JSON.stringify(SwapTreeSerializer.serializeSwapTree(tree!)),
      });
    } else {
      const blockNumber = await sendingCurrency.provider!.getBlockNumber();
      result.timeoutBlockHeight = blockNumber + args.onchainTimeoutBlockDelta;

      result.lockupAddress = await this.getLockupContractAddress(
        sendingCurrency.symbol,
        sendingCurrency.type,
      );
      result.refundAddress = await this.walletManager.wallets
        .get(sendingCurrency.symbol)!
        .getAddress();

      await ReverseSwapRepository.addReverseSwap({
        id,
        pair,
        minerFeeInvoice,
        node: nodeType,
        fee: args.percentageFee,

        invoice: paymentRequest,
        orderSide: args.orderSide,
        referral: args.referralId,
        version: SwapVersion.Legacy,
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

  // TODO: check current status of invoices or do the streams handle that already?
  private recreateFilters = (
    swaps: Swap[] | ReverseSwap[],
    isReverse: boolean,
  ) => {
    swaps.forEach((swap: Swap | ReverseSwap) => {
      const { base, quote } = splitPairId(swap.pair);
      const chainCurrency = getChainCurrency(
        base,
        quote,
        swap.orderSide,
        isReverse,
      );
      const lightningCurrency = getLightningCurrency(
        base,
        quote,
        swap.orderSide,
        isReverse,
      );

      if (
        (swap.status === SwapUpdateEvent.SwapCreated ||
          swap.status === SwapUpdateEvent.MinerFeePaid) &&
        isReverse
      ) {
        const reverseSwap = swap as ReverseSwap;

        const { lndClient } = this.currencies.get(lightningCurrency)!;

        if (
          reverseSwap.node === NodeType.LND &&
          reverseSwap.minerFeeInvoice &&
          swap.status !== SwapUpdateEvent.MinerFeePaid
        ) {
          lndClient?.subscribeSingleInvoice(
            getHexBuffer(
              decodeInvoice(reverseSwap.minerFeeInvoice).paymentHash!,
            ),
          );
        }

        lndClient?.subscribeSingleInvoice(
          getHexBuffer(decodeInvoice(reverseSwap.invoice).paymentHash!),
        );
      } else if (
        (swap.status === SwapUpdateEvent.TransactionMempool ||
          swap.status === SwapUpdateEvent.TransactionConfirmed) &&
        isReverse
      ) {
        const { chainClient } = this.currencies.get(chainCurrency)!;

        if (chainClient) {
          const transactionId = reverseBuffer(
            getHexBuffer((swap as ReverseSwap).transactionId!),
          );
          chainClient.addInputFilter(transactionId);

          // To detect when the transaction confirms
          if (swap.status === SwapUpdateEvent.TransactionMempool) {
            const wallet = this.walletManager.wallets.get(chainCurrency)!;
            chainClient.addOutputFilter(
              wallet.decodeAddress(swap.lockupAddress),
            );
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

    return type === CurrencyType.Ether
      ? ethereumManager.etherSwap.getAddress()
      : ethereumManager.erc20Swap.getAddress();
  };
}

export default SwapManager;
export { ChannelCreationInfo };
