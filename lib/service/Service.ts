import bolt11 from 'bolt11';
import { getAddress } from 'ethers';
import { OutputType } from 'boltz-core';
import Errors from './Errors';
import Logger from '../Logger';
import NodeInfo from './NodeInfo';
import Swap from '../db/models/Swap';
import ApiErrors from '../api/Errors';
import { ConfigType } from '../Config';
import ErrorsSwap from '../swap/Errors';
import EventHandler from './EventHandler';
import { parseTransaction } from '../Core';
import NodeSwitch from '../swap/NodeSwitch';
import { PairConfig } from '../consts/Types';
import ClnClient from '../lightning/ClnClient';
import LndClient from '../lightning/LndClient';
import ElementsService from './ElementsService';
import SwapOutputType from '../swap/SwapOutputType';
import ElementsClient from '../chain/ElementsClient';
import InvoiceExpiryHelper from './InvoiceExpiryHelper';
import PaymentRequestUtils from './PaymentRequestUtils';
import PairRepository from '../db/repositories/PairRepository';
import SwapRepository from '../db/repositories/SwapRepository';
import RateProvider, { PairType } from '../rates/RateProvider';
import WalletManager, { Currency } from '../wallet/WalletManager';
import ReferralRepository from '../db/repositories/ReferralRepository';
import SwapManager, { ChannelCreationInfo } from '../swap/SwapManager';
import ChannelCreationRepository from '../db/repositories/ChannelCreationRepository';
import TimeoutDeltaProvider, {
  PairTimeoutBlocksDelta,
} from './TimeoutDeltaProvider';
import {
  HopHint,
  InvoiceFeature,
  PaymentResponse,
} from '../lightning/LightningClient';
import {
  gweiDecimals,
  etherDecimals,
  ethereumPrepayMinerFeeGasLimit,
} from '../consts/Consts';
import {
  OrderSide,
  ServiceInfo,
  BaseFeeType,
  CurrencyType,
  ServiceWarning,
} from '../consts/Enums';
import {
  Balances,
  ChainInfo,
  CurrencyInfo,
  LightningInfo,
  GetInfoResponse,
  DeriveKeysResponse,
  GetBalanceResponse,
} from '../proto/boltzrpc_pb';
import {
  getRate,
  stringify,
  getPairId,
  getVersion,
  formatError,
  getSwapMemo,
  getUnixTime,
  splitPairId,
  getHexBuffer,
  getHexString,
  decodeInvoice,
  reverseBuffer,
  getChainCurrency,
  createApiCredential,
  getLightningCurrency,
  getSendingReceivingCurrency,
} from '../Utils';

class Service {
  public allowReverseSwaps = true;

  private nodeInfo: NodeInfo;
  public swapManager: SwapManager;
  public eventHandler: EventHandler;
  public elementsService: ElementsService;

  private prepayMinerFee: boolean;

  private readonly rateProvider: RateProvider;
  private readonly paymentRequestUtils: PaymentRequestUtils;
  private readonly timeoutDeltaProvider: TimeoutDeltaProvider;

  private static MinInboundLiquidity = 10;
  private static MaxInboundLiquidity = 50;

  constructor(
    private logger: Logger,
    config: ConfigType,
    private walletManager: WalletManager,
    private nodeSwitch: NodeSwitch,
    public currencies: Map<string, Currency>,
  ) {
    this.prepayMinerFee = config.prepayminerfee;
    this.logger.debug(
      `Prepay miner fee for Reverse Swaps is ${
        this.prepayMinerFee ? 'enabled' : 'disabled'
      }`,
    );

    this.paymentRequestUtils = new PaymentRequestUtils(
      this.currencies.get(ElementsClient.symbol),
    );
    this.timeoutDeltaProvider = new TimeoutDeltaProvider(
      this.logger,
      config,
      currencies,
      this.walletManager.ethereumManager!,
    );
    this.rateProvider = new RateProvider(
      this.logger,
      config.rates.interval,
      currencies,
      this.getFeeEstimation,
    );

    this.logger.debug(
      `Using ${
        config.swapwitnessaddress ? 'P2WSH' : 'P2SH nested P2WSH'
      } addresses for Submarine Swaps`,
    );

    this.swapManager = new SwapManager(
      this.logger,
      this.walletManager,
      this.nodeSwitch,
      this.rateProvider,
      this.timeoutDeltaProvider,
      new InvoiceExpiryHelper(config.currencies),
      new SwapOutputType(
        config.swapwitnessaddress
          ? OutputType.Bech32
          : OutputType.Compatibility,
      ),
      config.retryInterval,
    );

    this.eventHandler = new EventHandler(
      this.logger,
      this.currencies,
      this.swapManager.nursery,
    );

    this.nodeInfo = new NodeInfo(this.logger, this.currencies);
    this.elementsService = new ElementsService(
      this.currencies,
      this.walletManager,
    );
  }

  public init = async (configPairs: PairConfig[]): Promise<void> => {
    const dbPairSet = new Set<string>();
    const dbPairs = await PairRepository.getPairs();

    dbPairs.forEach((dbPair) => {
      dbPairSet.add(dbPair.id);
    });

    const checkCurrency = (symbol: string) => {
      if (!this.currencies.has(symbol)) {
        throw Errors.CURRENCY_NOT_FOUND(symbol);
      }
    };

    for (const configPair of configPairs) {
      const id = getPairId(configPair);

      checkCurrency(configPair.base);
      checkCurrency(configPair.quote);

      if (!dbPairSet.has(id)) {
        await PairRepository.addPair({
          id,
          ...configPair,
        });
        this.logger.silly(`Added pair to database: ${id}`);
      }
    }

    this.logger.verbose('Updated pairs in the database');

    this.timeoutDeltaProvider.init(configPairs);

    this.rateProvider.feeProvider.init(configPairs);
    await this.rateProvider.init(configPairs);

    await this.nodeInfo.init();
  };

  /**
   * Gets general information about this Boltz instance and the nodes it is connected to
   */
  public getInfo = async (): Promise<GetInfoResponse> => {
    const response = new GetInfoResponse();
    const map = response.getChainsMap();

    response.setVersion(getVersion());

    for (const [symbol, currency] of this.currencies) {
      const chain = new ChainInfo();

      if (currency.chainClient) {
        try {
          const [networkInfo, blockchainInfo] = await Promise.all([
            currency.chainClient.getNetworkInfo(),
            currency.chainClient.getBlockchainInfo(),
          ]);

          chain.setVersion(networkInfo.version);
          chain.setConnections(networkInfo.connections);

          chain.setBlocks(blockchainInfo.blocks);
          chain.setScannedBlocks(blockchainInfo.scannedBlocks);
        } catch (error) {
          chain.setError(formatError(error));
        }
      } else if (currency.provider) {
        try {
          const blockNumber = await currency.provider.getBlockNumber();

          chain.setBlocks(blockNumber);
          chain.setScannedBlocks(blockNumber);
        } catch (error) {
          chain.setError(formatError(error));
        }
      }

      const currencyInfo = new CurrencyInfo();
      currencyInfo.setChain(chain);

      await Promise.all(
        [currency.lndClient, currency.clnClient]
          .filter(
            (client): client is LndClient | ClnClient => client !== undefined,
          )
          .map(async (client) => {
            const info = new LightningInfo();

            try {
              const infoRes = await client.getInfo();

              const channels = new LightningInfo.Channels();

              channels.setActive(infoRes.channels.active);
              channels.setInactive(infoRes.channels.inactive);
              channels.setPending(infoRes.channels.pending);

              info.setChannels(channels);

              info.setVersion(infoRes.version);
              info.setBlockHeight(infoRes.blockHeight);
            } catch (error) {
              info.setError(
                typeof error === 'object' ? (error as any).details : error,
              );
            }

            currencyInfo.getLightningMap().set(client.serviceName(), info);
          }),
      );

      map.set(symbol, currencyInfo);
    }

    return response;
  };

  /**
   * Gets the balance for either all wallets or just a single one if specified
   */
  public getBalance = async (): Promise<GetBalanceResponse> => {
    const response = new GetBalanceResponse();
    const map = response.getBalancesMap();

    for (const [symbol, wallet] of this.walletManager.wallets) {
      const balances = new Balances();

      const currency = this.currencies.get(symbol);

      const lightningClients = currency
        ? [currency.lndClient, currency.clnClient].filter(
            (client): client is LndClient | ClnClient => client !== undefined,
          )
        : [];

      await Promise.all(
        [wallet, ...lightningClients].map(async (bf) => {
          const res = await bf.getBalance();

          const walletBal = new Balances.WalletBalance();

          walletBal.setConfirmed(res.confirmedBalance);
          walletBal.setUnconfirmed(res.unconfirmedBalance);

          balances.getWalletsMap().set(bf.serviceName(), walletBal);
        }),
      );

      await Promise.all(
        lightningClients.map(async (client) => {
          const lightningBalance = new Balances.LightningBalance();

          const channelsList = await client.listChannels();

          let localBalance = 0n;
          let remoteBalance = 0n;

          channelsList.forEach((channel) => {
            localBalance += BigInt(channel.localBalance);
            remoteBalance += BigInt(channel.remoteBalance);
          });

          lightningBalance.setLocal(Number(localBalance));
          lightningBalance.setRemote(Number(remoteBalance));

          balances
            .getLightningMap()
            .set(client.serviceName(), lightningBalance);
        }),
      );

      map.set(symbol, balances);
    }

    return response;
  };

  /**
   * Gets all supported pairs and their conversion rates
   */
  public getPairs = (): {
    info: ServiceInfo[];
    warnings: ServiceWarning[];
    pairs: Map<string, PairType>;
  } => {
    const info: ServiceInfo[] = [];
    const warnings: ServiceWarning[] = [];

    if (this.prepayMinerFee) {
      info.push(ServiceInfo.PrepayMinerFee);
    }

    if (!this.allowReverseSwaps) {
      warnings.push(ServiceWarning.ReverseSwapsDisabled);
    }

    return {
      info,
      warnings,
      pairs: this.rateProvider.pairs,
    };
  };

  /**
   * Gets a map between the LND node keys and URIs and the symbol of the chains they are running on
   */
  public getNodes = () => {
    return this.nodeInfo.getUris();
  };

  public getNodeStats = () => {
    return this.nodeInfo.getStats();
  };

  public getRoutingHints = (
    symbol: string,
    routingNode: string,
  ): Promise<HopHint[][]> => {
    return this.swapManager.routingHints.getRoutingHints(symbol, routingNode);
  };

  public getTimeouts = () => {
    return this.timeoutDeltaProvider.timeoutDeltas;
  };

  /**
   * Gets the contract address used by the Boltz instance
   */
  public getContracts = async (): Promise<{
    ethereum: {
      network: {
        chainId: number;
        name?: string;
      };
      swapContracts: Map<string, string>;
      tokens: Map<string, string>;
    };
  }> => {
    if (this.walletManager.ethereumManager === undefined) {
      throw Errors.ETHEREUM_NOT_ENABLED();
    }

    return {
      ethereum: {
        network: {
          chainId: Number(this.walletManager.ethereumManager.network.chainId),
          name: this.walletManager.ethereumManager.network.name,
        },
        tokens: this.walletManager.ethereumManager.tokenAddresses,
        swapContracts: new Map<string, string>([
          [
            'EtherSwap',
            await this.walletManager.ethereumManager.etherSwap.getAddress(),
          ],
          [
            'ERC20Swap',
            await this.walletManager.ethereumManager.erc20Swap.getAddress(),
          ],
        ]),
      },
    };
  };

  /**
   * Gets a hex encoded transaction from a transaction hash on the specified network
   */
  public getTransaction = async (
    symbol: string,
    transactionHash: string,
  ): Promise<string> => {
    const currency = this.getCurrency(symbol);

    if (currency.chainClient === undefined) {
      throw Errors.NOT_SUPPORTED_BY_SYMBOL(symbol);
    }

    return await currency.chainClient.getRawTransaction(transactionHash);
  };

  /**
   * Gets the hex encoded lockup transaction of a Submarine Swap, the block height
   * at which it will timeout and the expected ETA for that block
   */
  public getSwapTransaction = async (
    id: string,
  ): Promise<{
    transactionHex: string;
    timeoutBlockHeight: number;
  }> => {
    const swap = await SwapRepository.getSwap({
      id,
    });

    if (!swap) {
      throw Errors.SWAP_NOT_FOUND(id);
    }

    if (!swap.lockupTransactionId) {
      throw Errors.SWAP_NO_LOCKUP();
    }

    const { base, quote } = splitPairId(swap.pair);
    const chainCurrency = getChainCurrency(base, quote, swap.orderSide, false);

    const currency = this.getCurrency(chainCurrency);

    if (currency.chainClient === undefined) {
      throw Errors.NOT_SUPPORTED_BY_SYMBOL(currency.symbol);
    }

    const { blocks } = await currency.chainClient.getBlockchainInfo();
    const transactionHex = await currency.chainClient.getRawTransaction(
      swap.lockupTransactionId,
    );

    const response: any = {
      transactionHex,
    };

    response.timeoutBlockHeight = swap.timeoutBlockHeight;

    if (blocks < swap.timeoutBlockHeight) {
      response.timeoutEta = this.calculateTimeoutDate(
        chainCurrency,
        swap.timeoutBlockHeight - blocks,
      );
    }

    return response;
  };

  public deriveKeys = (symbol: string, index: number): DeriveKeysResponse => {
    const wallet = this.walletManager.wallets.get(symbol.toUpperCase());

    if (wallet === undefined) {
      throw Errors.CURRENCY_NOT_FOUND(symbol);
    }

    const keys = wallet.getKeysByIndex(index);

    const response = new DeriveKeysResponse();

    response.setPublicKey(getHexString(keys.publicKey));
    response.setPrivateKey(getHexString(keys.privateKey!));

    return response;
  };

  /**
   * Gets an address of a specified wallet
   */
  public getAddress = async (symbol: string): Promise<string> => {
    const wallet = this.walletManager.wallets.get(symbol);

    if (wallet !== undefined) {
      return wallet.getAddress();
    }

    throw Errors.CURRENCY_NOT_FOUND(symbol);
  };

  /**
   * Gets a fee estimation in satoshis per vbyte or GWEI for either all currencies or just a single one if specified
   */
  public getFeeEstimation = async (
    symbol?: string,
    blocks?: number,
  ): Promise<Map<string, number>> => {
    const map = new Map<string, number>();

    const numBlocks = blocks === undefined ? 2 : blocks;

    const estimateFee = async (currency: Currency): Promise<number> => {
      if (currency.chainClient) {
        return currency.chainClient.estimateFee(numBlocks);
      } else if (currency.provider) {
        return Number((await this.getGasPrice(currency)) / gweiDecimals);
      } else {
        throw Errors.NOT_SUPPORTED_BY_SYMBOL(currency.symbol);
      }
    };

    if (symbol !== undefined) {
      const currency = this.getCurrency(symbol);
      const isERC20 = currency.type === CurrencyType.ERC20;

      map.set(isERC20 ? 'ETH' : symbol, await estimateFee(currency));
    } else {
      for (const [symbol, currency] of this.currencies) {
        if (currency.type === CurrencyType.ERC20) {
          if (!map.has('ETH')) {
            map.set('ETH', await estimateFee(currency));
          }

          continue;
        }

        map.set(symbol, await estimateFee(currency));
      }
    }

    return map;
  };

  /**
   * Broadcast a hex encoded transaction on the specified network
   */
  public broadcastTransaction = async (
    symbol: string,
    transactionHex: string,
  ): Promise<string> => {
    const currency = this.getCurrency(symbol);

    if (currency.chainClient === undefined) {
      throw Errors.NOT_SUPPORTED_BY_SYMBOL(symbol);
    }

    try {
      return await currency.chainClient.sendRawTransaction(transactionHex);
    } catch (error) {
      // This special error is thrown when a Submarine Swap that has not timed out yet is refunded
      // To improve the UX we will throw not only the error but also some additional information
      // regarding when the Submarine Swap can be refunded
      if (
        (error as any).code === -26 &&
        (error as any).message.startsWith(
          'non-mandatory-script-verify-flag (Locktime requirement not satisfied)',
        )
      ) {
        const refundTransaction = parseTransaction(
          currency.type,
          transactionHex,
        );

        let swap: Swap | null | undefined;

        for (const input of refundTransaction.ins) {
          swap = await SwapRepository.getSwap({
            lockupTransactionId: getHexString(reverseBuffer(input.hash)),
          });

          if (swap) {
            break;
          }
        }

        if (!swap) {
          throw error;
        }

        const { blocks } = await currency.chainClient.getBlockchainInfo();

        throw {
          error: (error as any).message,
          timeoutBlockHeight: swap.timeoutBlockHeight,
          // Here we don't need to check whether the Swap has timed out yet because
          // if the error above has been thrown, we can be sure that this is not the case
          timeoutEta: this.calculateTimeoutDate(
            symbol,
            swap.timeoutBlockHeight - blocks,
          ),
        };
      } else {
        throw error;
      }
    }
  };

  /**
   * Updates the timeout block delta of a pair
   */
  public updateTimeoutBlockDelta = (
    pairId: string,
    newDeltas: PairTimeoutBlocksDelta,
  ): void => {
    this.timeoutDeltaProvider.setTimeout(pairId, newDeltas);

    this.logger.info(
      `Updated timeout block delta of ${pairId} to ${stringify(newDeltas)}`,
    );
  };

  public addReferral = async (referral: {
    id: string;
    feeShare: number;
    routingNode?: string;
  }): Promise<{
    apiKey: string;
    apiSecret: string;
  }> => {
    if (referral.id === '') {
      throw new Error('referral IDs cannot be empty');
    }

    if (referral.feeShare > 100 || referral.feeShare < 0) {
      throw new Error('referral fee share must be between 0 and 100');
    }

    const apiKey = createApiCredential();
    const apiSecret = createApiCredential();

    await ReferralRepository.addReferral({
      ...referral,
      apiKey,
      apiSecret,
    });

    this.logger.info(
      `Added referral ${referral.id} with ${
        referral.routingNode !== undefined
          ? `routing node ${referral.routingNode} and `
          : ''
      }fee share ${referral.feeShare}%`,
    );

    return {
      apiKey,
      apiSecret,
    };
  };

  /**
   * Creates a new Swap from the chain to Lightning
   */
  public createSwap = async (args: {
    pairId: string;
    orderSide: string;
    preimageHash: Buffer;
    channel?: ChannelCreationInfo;

    // Referral ID for the swap
    referralId?: string;

    // Only required for UTXO based chains
    refundPublicKey?: Buffer;

    // Invoice, if available, to adjust the timeout block height
    invoice?: string;
  }): Promise<{
    id: string;
    address: string;
    canBeRouted: boolean;
    timeoutBlockHeight: number;

    // Is undefined when Ether or ERC20 tokens are swapped to Lightning
    redeemScript?: string;

    // Is undefined when Bitcoin or Litecoin is swapped to Lightning
    claimAddress?: string;

    blindingKey?: string;
  }> => {
    const swap = await SwapRepository.getSwap({
      preimageHash: getHexString(args.preimageHash),
    });

    if (swap) {
      throw Errors.SWAP_WITH_PREIMAGE_EXISTS();
    }

    const { base, quote } = this.getPair(args.pairId);
    const orderSide = this.getOrderSide(args.orderSide);

    switch (
      this.getCurrency(getChainCurrency(base, quote, orderSide, false)).type
    ) {
      case CurrencyType.BitcoinLike:
        if (args.refundPublicKey === undefined) {
          throw ApiErrors.UNDEFINED_PARAMETER('refundPublicKey');
        }
        break;
    }

    const lightningCurrency = getLightningCurrency(
      base,
      quote,
      orderSide,
      false,
    );

    if (!NodeSwitch.hasClient(this.getCurrency(lightningCurrency))) {
      throw ErrorsSwap.NO_LIGHTNING_SUPPORT(lightningCurrency);
    }

    if (args.channel) {
      if (args.channel.inboundLiquidity > Service.MaxInboundLiquidity) {
        throw Errors.EXCEEDS_MAX_INBOUND_LIQUIDITY(
          args.channel.inboundLiquidity,
          Service.MaxInboundLiquidity,
        );
      }

      if (args.channel.inboundLiquidity < Service.MinInboundLiquidity) {
        throw Errors.BENEATH_MIN_INBOUND_LIQUIDITY(
          args.channel.inboundLiquidity,
          Service.MinInboundLiquidity,
        );
      }
    }

    const [timeoutBlockDelta, canBeRouted] =
      await this.timeoutDeltaProvider.getTimeout(
        args.pairId,
        orderSide,
        false,
        args.invoice,
      );

    if (!canBeRouted) {
      this.logger.warn(
        `Could not query ${lightningCurrency} routes for: ${args.invoice}`,
      );
    }

    const referralId = await this.getReferralId(args.referralId);

    const {
      id,
      address,
      redeemScript,
      claimAddress,
      timeoutBlockHeight,
      blindingKey,
    } = await this.swapManager.createSwap({
      orderSide,
      referralId,
      timeoutBlockDelta,

      baseCurrency: base,
      quoteCurrency: quote,
      channel: args.channel,
      preimageHash: args.preimageHash,
      refundPublicKey: args.refundPublicKey,
    });

    this.eventHandler.emitSwapCreation(id);

    return {
      id,
      address,
      canBeRouted,
      blindingKey,
      redeemScript,
      claimAddress,
      timeoutBlockHeight,
    };
  };

  /**
   * Gets the rates for a Submarine Swap that has coins in its lockup address but no invoice yet
   */
  public getSwapRates = async (
    id: string,
  ): Promise<{
    onchainAmount: number;
    submarineSwap: {
      invoiceAmount: number;
    };
  }> => {
    const swap = await SwapRepository.getSwap({
      id,
    });

    if (!swap) {
      throw Errors.SWAP_NOT_FOUND(id);
    }

    if (!swap.onchainAmount) {
      throw Errors.SWAP_NO_LOCKUP();
    }

    const { base, quote } = splitPairId(swap.pair);
    const onchainCurrency = getChainCurrency(
      base,
      quote,
      swap.orderSide,
      false,
    );

    const rate = getRate(swap.rate!, swap.orderSide, false);

    const percentageFee = this.rateProvider.feeProvider.getPercentageFee(
      swap.pair,
      false,
    );
    const baseFee = this.rateProvider.feeProvider.getBaseFee(
      onchainCurrency,
      BaseFeeType.NormalClaim,
    );

    const invoiceAmount = this.calculateInvoiceAmount(
      swap.orderSide,
      rate,
      swap.onchainAmount,
      baseFee,
      percentageFee,
    );

    this.verifyAmount(swap.pair, rate, invoiceAmount, swap.orderSide, false);

    return {
      onchainAmount: swap.onchainAmount,
      submarineSwap: {
        invoiceAmount,
      },
    };
  };

  public setInvoice = async (
    id: string,
    invoice: string,
    pairHash?: string,
  ) => {
    const swap = await SwapRepository.getSwap({
      id,
    });

    if (!swap) {
      throw Errors.SWAP_NOT_FOUND(id);
    }

    if (swap.invoice) {
      throw Errors.SWAP_HAS_INVOICE_ALREADY(id);
    }

    const { base, quote } = splitPairId(swap.pair);
    const lightningCurrency = getLightningCurrency(
      base,
      quote,
      swap.orderSide,
      false,
    );

    swap.invoiceAmount = bolt11.decode(invoice).satoshis || 0;
    const lightningClient = this.nodeSwitch.getSwapNode(
      this.currencies.get(lightningCurrency)!,
      swap,
    );

    const [cltvLimit, decodedInvoice] = await Promise.all([
      this.timeoutDeltaProvider.getCltvLimit(swap),
      lightningClient.decodeInvoice(invoice),
    ]);

    const requiredTimeout = await this.timeoutDeltaProvider.checkRoutability(
      lightningClient,
      decodedInvoice,
      cltvLimit,
    );

    if (requiredTimeout == TimeoutDeltaProvider.noRoutes) {
      throw ErrorsSwap.NO_ROUTE_FOUND();
    }

    return this.setSwapInvoice(swap, invoice, false, pairHash);
  };

  /**
   * Sets the invoice for Submarine Swap
   */
  private setSwapInvoice = async (
    swap: Swap,
    invoice: string,
    canBeRouted: boolean,
    pairHash?: string,
  ): Promise<
    | {
        bip21: string;
        expectedAmount: number;
        acceptZeroConf: boolean;
      }
    | Record<string, any>
  > => {
    const { base, quote, rate: pairRate } = this.getPair(swap.pair);

    if (pairHash !== undefined) {
      this.validatePairHash(swap.pair, pairHash);
    }

    const chainCurrency = getChainCurrency(base, quote, swap.orderSide, false);
    const lightningCurrency = getLightningCurrency(
      base,
      quote,
      swap.orderSide,
      false,
    );

    swap.invoiceAmount = decodeInvoice(invoice).satoshis || 0;

    const decodedInvoice = await this.nodeSwitch
      .getSwapNode(this.getCurrency(lightningCurrency)!, swap)
      .decodeInvoice(invoice);
    if (decodedInvoice.features.has(InvoiceFeature.AMP)) {
      throw Errors.AMP_INVOICES_NOT_SUPPORTED();
    }

    const rate = swap.rate || getRate(pairRate, swap.orderSide, false);
    this.verifyAmount(
      swap.pair,
      rate,
      swap.invoiceAmount,
      swap.orderSide,
      false,
    );

    const { baseFee, percentageFee } = this.rateProvider.feeProvider.getFees(
      swap.pair,
      rate,
      swap.orderSide,
      swap.invoiceAmount,
      BaseFeeType.NormalClaim,
    );

    const expectedAmount =
      Math.floor(swap.invoiceAmount * rate) + baseFee + percentageFee;

    if (swap.onchainAmount && expectedAmount > swap.onchainAmount) {
      const maxInvoiceAmount = this.calculateInvoiceAmount(
        swap.orderSide,
        rate,
        swap.onchainAmount,
        baseFee,
        this.rateProvider.feeProvider.getPercentageFee(swap.pair, false),
      );

      throw Errors.INVALID_INVOICE_AMOUNT(maxInvoiceAmount);
    }

    const acceptZeroConf = this.rateProvider.acceptZeroConf(
      chainCurrency,
      expectedAmount,
    );

    await this.swapManager.setSwapInvoice(
      swap,
      invoice,
      swap.invoiceAmount,
      expectedAmount,
      percentageFee,
      acceptZeroConf,
      canBeRouted,
      this.eventHandler.emitSwapInvoiceSet,
    );

    // The expected amount doesn't have to be returned if the onchain coins were sent already
    if (swap.lockupTransactionId) {
      return {};
    }

    return {
      expectedAmount,
      acceptZeroConf,
      bip21: this.paymentRequestUtils.encodeBip21(
        chainCurrency,
        swap.lockupAddress,
        expectedAmount,
        getSwapMemo(lightningCurrency, false),
      ),
    };
  };

  /**
   * Creates a Submarine Swap with an invoice
   *
   * This method combines "createSwap" and "setSwapInvoice"
   */
  public createSwapWithInvoice = async (
    pairId: string,
    orderSide: string,
    refundPublicKey: Buffer,
    invoice: string,
    pairHash?: string,
    referralId?: string,
    channel?: ChannelCreationInfo,
  ): Promise<{
    id: string;
    bip21: string;
    address: string;
    expectedAmount: number;
    acceptZeroConf: boolean;
    timeoutBlockHeight: number;

    // Is undefined when Ether or ERC20 tokens are swapped to Lightning
    redeemScript?: string;

    // Is undefined when Bitcoin or Litecoin is swapped to Lightning
    claimAddress?: string;

    blindingKey?: string;
  }> => {
    let swap = await SwapRepository.getSwap({
      invoice,
    });

    if (swap) {
      throw Errors.SWAP_WITH_INVOICE_EXISTS();
    }

    const preimageHash = getHexBuffer(decodeInvoice(invoice).paymentHash!);

    const {
      id,
      address,
      canBeRouted,
      blindingKey,
      claimAddress,
      redeemScript,
      timeoutBlockHeight,
    } = await this.createSwap({
      pairId,
      channel,
      invoice,
      orderSide,
      referralId,
      preimageHash,
      refundPublicKey,
    });

    try {
      const { bip21, acceptZeroConf, expectedAmount } =
        await this.setSwapInvoice(
          (await SwapRepository.getSwap({
            id,
          }))!,
          invoice,
          canBeRouted,
          pairHash,
        );

      return {
        id,
        bip21,
        address,
        blindingKey,
        claimAddress,
        redeemScript,
        acceptZeroConf,
        expectedAmount,
        timeoutBlockHeight,
      };
    } catch (error) {
      const channelCreation =
        await ChannelCreationRepository.getChannelCreation({
          swapId: id,
        });
      await channelCreation?.destroy();

      swap = await SwapRepository.getSwap({
        id,
      });
      await swap?.destroy();

      throw error;
    }
  };

  /**
   * Creates a new Swap from Lightning to the chain
   */
  public createReverseSwap = async (args: {
    pairId: string;
    pairHash?: string;
    orderSide: string;
    preimageHash: Buffer;

    invoiceAmount?: number;
    onchainAmount?: number;

    // Public key of the node for which routing hints should be included in the invoice(s)
    routingNode?: string;

    // Referral ID for the reverse swap
    referralId?: string;

    // Required for UTXO based chains
    claimPublicKey?: Buffer;

    // Required for Reverse Swaps to Ether or ERC20 tokens
    claimAddress?: string;

    // Whether the Ethereum prepay miner fee should be enabled for the Reverse Swap
    prepayMinerFee?: boolean;
  }): Promise<{
    id: string;
    invoice: string;
    blindingKey?: string;
    lockupAddress: string;
    redeemScript?: string;
    refundAddress?: string;
    onchainAmount?: number;
    minerFeeInvoice?: string;
    timeoutBlockHeight: number;
    prepayMinerFeeAmount?: number;
  }> => {
    if (!this.allowReverseSwaps) {
      throw Errors.REVERSE_SWAPS_DISABLED();
    }

    const side = this.getOrderSide(args.orderSide);
    const { base, quote, rate: pairRate } = this.getPair(args.pairId);

    if (args.pairHash !== undefined) {
      this.validatePairHash(args.pairId, args.pairHash);
    }

    const { sending, receiving } = getSendingReceivingCurrency(
      base,
      quote,
      side,
    );
    const sendingCurrency = this.getCurrency(sending);

    // Not the pretties way and also not the right spot to do input validation but
    // only at this point in time the type of the sending currency is known
    switch (sendingCurrency.type) {
      case CurrencyType.BitcoinLike:
        if (args.claimPublicKey === undefined) {
          throw ApiErrors.UNDEFINED_PARAMETER('claimPublicKey');
        }

        if (args.prepayMinerFee === true) {
          throw ApiErrors.UNSUPPORTED_PARAMETER(sending, 'prepayMinerFee');
        }
        break;

      case CurrencyType.Ether:
      case CurrencyType.ERC20:
        if (args.claimAddress === undefined) {
          throw ApiErrors.UNDEFINED_PARAMETER('claimAddress');
        }

        try {
          // Get a checksum address and verify that the address is valid
          args.claimAddress = getAddress(args.claimAddress);
        } catch (error) {
          throw Errors.INVALID_ETHEREUM_ADDRESS();
        }

        break;
    }

    const [onchainTimeoutBlockDelta] =
      await this.timeoutDeltaProvider.getTimeout(args.pairId, side, true);

    let lightningTimeoutBlockDelta = TimeoutDeltaProvider.convertBlocks(
      sending,
      receiving,
      onchainTimeoutBlockDelta,
    );

    // Add 15 blocks to the delta for same currency swaps and 25% for cross chain ones as buffer
    lightningTimeoutBlockDelta +=
      sending === receiving ? 15 : Math.ceil(lightningTimeoutBlockDelta * 0.25);

    const rate = getRate(pairRate, side, true);
    const feePercent = this.rateProvider.feeProvider.getPercentageFee(
      args.pairId,
      true,
    );
    const baseFee = this.rateProvider.feeProvider.getBaseFee(
      sendingCurrency.symbol,
      BaseFeeType.ReverseLockup,
    );

    let onchainAmount: number;
    let holdInvoiceAmount: number;

    let percentageFee: number;

    // True when the invoice amount was set in the request, false when the onchain amount was set
    let invoiceAmountDefined: boolean;

    if (args.invoiceAmount !== undefined && args.onchainAmount !== undefined) {
      throw Errors.INVOICE_AND_ONCHAIN_AMOUNT_SPECIFIED();
    } else if (args.invoiceAmount !== undefined) {
      invoiceAmountDefined = true;

      this.checkWholeNumber(args.invoiceAmount);
      holdInvoiceAmount = args.invoiceAmount;

      onchainAmount = args.invoiceAmount * rate;

      percentageFee = Math.ceil(feePercent * onchainAmount);

      onchainAmount -= percentageFee + baseFee;
      onchainAmount = Math.floor(onchainAmount);
    } else if (args.onchainAmount !== undefined) {
      invoiceAmountDefined = false;

      this.checkWholeNumber(args.onchainAmount);
      onchainAmount = args.onchainAmount;

      holdInvoiceAmount = (args.onchainAmount + baseFee) / rate;
      holdInvoiceAmount = holdInvoiceAmount / (1 - feePercent);
      holdInvoiceAmount = Math.ceil(holdInvoiceAmount);

      percentageFee = Math.ceil(holdInvoiceAmount * rate * feePercent);
    } else {
      throw Errors.NO_AMOUNT_SPECIFIED();
    }

    this.verifyAmount(args.pairId, rate, holdInvoiceAmount, side, true);

    let prepayMinerFeeInvoiceAmount: number | undefined = undefined;
    let prepayMinerFeeOnchainAmount: number | undefined = undefined;

    const swapIsPrepayMinerFee =
      this.prepayMinerFee || args.prepayMinerFee === true;

    if (swapIsPrepayMinerFee) {
      if (
        sendingCurrency.type === CurrencyType.BitcoinLike ||
        sendingCurrency.type === CurrencyType.Liquid
      ) {
        prepayMinerFeeInvoiceAmount = Math.ceil(baseFee / rate);
        holdInvoiceAmount = Math.floor(
          holdInvoiceAmount - prepayMinerFeeInvoiceAmount,
        );
      } else {
        const gasPrice = await this.getGasPrice(sendingCurrency);
        prepayMinerFeeOnchainAmount = Number(
          (gasPrice * ethereumPrepayMinerFeeGasLimit) / etherDecimals,
        );

        const sendingAmountRate =
          sending === 'ETH'
            ? 1
            : this.rateProvider.rateCalculator.calculateRate('ETH', sending);

        const receivingAmountRate =
          receiving === 'ETH'
            ? 1
            : this.rateProvider.rateCalculator.calculateRate('ETH', receiving);
        prepayMinerFeeInvoiceAmount = Math.ceil(
          prepayMinerFeeOnchainAmount * receivingAmountRate,
        );

        // If the invoice amount was specified, the onchain and hold invoice amounts need to be adjusted
        if (invoiceAmountDefined) {
          onchainAmount -= Math.ceil(
            prepayMinerFeeOnchainAmount * sendingAmountRate,
          );
          holdInvoiceAmount = Math.floor(
            holdInvoiceAmount - prepayMinerFeeInvoiceAmount,
          );
        }
      }
    }

    if (onchainAmount < 1) {
      throw Errors.ONCHAIN_AMOUNT_TOO_LOW();
    }

    const referralId = await this.getReferralId(
      args.referralId,
      args.routingNode,
    );

    const {
      id,
      invoice,
      blindingKey,
      redeemScript,
      refundAddress,
      lockupAddress,
      minerFeeInvoice,
      timeoutBlockHeight,
    } = await this.swapManager.createReverseSwap({
      referralId,
      percentageFee,
      onchainAmount,
      holdInvoiceAmount,
      onchainTimeoutBlockDelta,
      lightningTimeoutBlockDelta,
      prepayMinerFeeInvoiceAmount,
      prepayMinerFeeOnchainAmount,

      orderSide: side,
      baseCurrency: base,
      quoteCurrency: quote,
      routingNode: args.routingNode,
      claimAddress: args.claimAddress,
      preimageHash: args.preimageHash,
      claimPublicKey: args.claimPublicKey,
    });

    this.eventHandler.emitSwapCreation(id);

    const response: any = {
      id,
      invoice,
      blindingKey,
      redeemScript,
      refundAddress,
      lockupAddress,
      timeoutBlockHeight,
    };

    if (swapIsPrepayMinerFee) {
      response.minerFeeInvoice = minerFeeInvoice;
      response.prepayMinerFeeAmount = prepayMinerFeeOnchainAmount;
    }

    if (invoiceAmountDefined) {
      response.onchainAmount = onchainAmount;
    }

    return response;
  };

  /**
   * Pays a lightning invoice
   */
  public payInvoice = async (
    symbol: string,
    invoice: string,
  ): Promise<PaymentResponse> => {
    const currency = this.getCurrency(symbol);
    const lightningClient = currency.lndClient || currency.clnClient;

    if (lightningClient === undefined) {
      throw ErrorsSwap.NO_LIGHTNING_SUPPORT(symbol);
    }

    return lightningClient.sendPayment(invoice);
  };

  /**
   * Sends coins to a specified address
   */
  public sendCoins = async (args: {
    symbol: string;
    address: string;
    amount: number;
    sendAll?: boolean;
    fee?: number;
  }): Promise<{
    vout: number;
    transactionId: string;
  }> => {
    const { fee, amount, symbol, sendAll, address } = args;

    const wallet = this.walletManager.wallets.get(symbol);

    if (wallet !== undefined) {
      const { transactionId, vout } = sendAll
        ? await wallet.sweepWallet(address, fee)
        : await wallet.sendToAddress(address, amount, fee);

      return {
        transactionId,
        vout: vout!,
      };
    }

    throw Errors.CURRENCY_NOT_FOUND(symbol);
  };

  private getGasPrice = async (currency: Currency) => {
    const feeData = await currency.provider!.getFeeData();
    return (feeData.gasPrice || feeData.maxFeePerGas)!;
  };

  private getReferralId = async (
    referralId?: string,
    routingNode?: string,
  ): Promise<string | undefined> => {
    // An explicitly set referral ID trumps the routing node
    if (referralId) {
      return referralId;
    }

    if (routingNode) {
      const referral =
        await ReferralRepository.getReferralByRoutingNode(routingNode);

      if (referral) {
        return referral.id;
      }
    }

    return;
  };

  /**
   * Verifies that the requested amount is neither above the maximal nor beneath the minimal
   */
  private verifyAmount = (
    pairId: string,
    rate: number,
    amount: number,
    orderSide: OrderSide,
    isReverse: boolean,
  ) => {
    if (
      (!isReverse && orderSide === OrderSide.BUY) ||
      (isReverse && orderSide === OrderSide.SELL)
    ) {
      amount = Math.floor(amount * rate);
    }

    const { limits } = this.getPair(pairId);

    if (limits) {
      if (Math.floor(amount) > limits.maximal)
        throw Errors.EXCEED_MAXIMAL_AMOUNT(amount, limits.maximal);
      if (Math.ceil(amount) < limits.minimal)
        throw Errors.BENEATH_MINIMAL_AMOUNT(amount, limits.minimal);
    } else {
      throw Errors.PAIR_NOT_FOUND(pairId);
    }
  };

  /**
   * Calculates the amount of an invoice for a Submarine Swap
   */
  private calculateInvoiceAmount = (
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

  private getPair = (pairId: string) => {
    const { base, quote } = splitPairId(pairId);

    const pair = this.rateProvider.pairs.get(pairId);

    if (!pair) {
      throw Errors.PAIR_NOT_FOUND(pairId);
    }

    return {
      base,
      quote,
      ...pair,
    };
  };

  private getCurrency = (symbol: string) => {
    const currency = this.currencies.get(symbol);

    if (!currency) {
      throw Errors.CURRENCY_NOT_FOUND(symbol);
    }

    return currency;
  };

  private getOrderSide = (side: string) => {
    switch (side.toLowerCase()) {
      case 'buy':
        return OrderSide.BUY;
      case 'sell':
        return OrderSide.SELL;

      default:
        throw Errors.ORDER_SIDE_NOT_FOUND(side);
    }
  };

  private calculateTimeoutDate = (chain: string, blocksMissing: number) => {
    return (
      getUnixTime() +
      blocksMissing * TimeoutDeltaProvider.blockTimes.get(chain)! * 60
    );
  };

  private validatePairHash = (pairId: string, pairHash: string) => {
    if (pairHash !== this.rateProvider.pairs.get(pairId)!.hash) {
      throw Errors.INVALID_PAIR_HASH();
    }
  };

  private checkWholeNumber = (input: number) => {
    if (input % 1 !== 0) {
      throw Errors.NOT_WHOLE_NUMBER(input);
    }
  };
}

export default Service;
