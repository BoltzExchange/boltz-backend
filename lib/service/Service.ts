import { OutputType, SwapTreeSerializer } from 'boltz-core';
import { Provider } from 'ethers';
import { Op } from 'sequelize';
import { ConfigType } from '../Config';
import { parseTransaction } from '../Core';
import Logger from '../Logger';
import {
  checkEvmAddress,
  createApiCredential,
  decodeInvoice,
  decodeInvoiceAmount,
  formatError,
  getChainCurrency,
  getHexBuffer,
  getHexString,
  getLightningCurrency,
  getPairId,
  getRate,
  getSendingReceivingCurrency,
  getSwapMemo,
  getUnixTime,
  getVersion,
  splitPairId,
  stringify,
} from '../Utils';
import ApiErrors from '../api/Errors';
import { checkPreimageHashLength } from '../api/Utils';
import ElementsClient from '../chain/ElementsClient';
import {
  etherDecimals,
  ethereumPrepayMinerFeeGasLimit,
  gweiDecimals,
} from '../consts/Consts';
import DefaultMap from '../consts/DefaultMap';
import {
  BaseFeeType,
  CurrencyType,
  OrderSide,
  PercentageFeeType,
  ServiceInfo,
  ServiceWarning,
  SwapType,
  SwapUpdateEvent,
  SwapVersion,
} from '../consts/Enums';
import { AnySwap, PairConfig } from '../consts/Types';
import ReverseSwap from '../db/models/ReverseSwap';
import Swap from '../db/models/Swap';
import ChainSwapRepository, {
  ChainSwapInfo,
} from '../db/repositories/ChainSwapRepository';
import ChannelCreationRepository from '../db/repositories/ChannelCreationRepository';
import PairRepository from '../db/repositories/PairRepository';
import ReferralRepository from '../db/repositories/ReferralRepository';
import ReverseRoutingHintRepository from '../db/repositories/ReverseRoutingHintRepository';
import ReverseSwapRepository from '../db/repositories/ReverseSwapRepository';
import SwapRepository from '../db/repositories/SwapRepository';
import {
  HopHint,
  InvoiceFeature,
  PaymentResponse,
} from '../lightning/LightningClient';
import LndClient from '../lightning/LndClient';
import ClnClient from '../lightning/cln/ClnClient';
import {
  Balances,
  ChainInfo,
  CurrencyInfo,
  DeriveKeysResponse,
  GetBalanceResponse,
  GetInfoResponse,
  LightningInfo,
} from '../proto/boltzrpc_pb';
import { ChainSwapMinerFees } from '../rates/FeeProvider';
import LockupTransactionTracker from '../rates/LockupTransactionTracker';
import RateProvider from '../rates/RateProvider';
import { PairTypeLegacy } from '../rates/providers/RateProviderLegacy';
import SwapErrors from '../swap/Errors';
import NodeSwitch from '../swap/NodeSwitch';
import { SwapNurseryEvents } from '../swap/PaymentHandler';
import SwapManager, { ChannelCreationInfo } from '../swap/SwapManager';
import SwapOutputType from '../swap/SwapOutputType';
import WalletManager, { Currency } from '../wallet/WalletManager';
import EthereumManager from '../wallet/ethereum/EthereumManager';
import Blocks from './Blocks';
import ElementsService from './ElementsService';
import Errors from './Errors';
import EventHandler from './EventHandler';
import NodeInfo from './NodeInfo';
import PaymentRequestUtils from './PaymentRequestUtils';
import TimeoutDeltaProvider, {
  PairTimeoutBlocksDelta,
} from './TimeoutDeltaProvider';
import TransactionFetcher from './TransactionFetcher';
import { calculateTimeoutDate, getCurrency } from './Utils';
import { SwapToClaimPreimage } from './cooperative/DeferredClaimer';
import EipSigner from './cooperative/EipSigner';
import MusigSigner from './cooperative/MusigSigner';

type NetworkContracts = {
  network: {
    chainId: number;
    name?: string;
  };
  swapContracts: Map<string, string>;
  tokens: Map<string, string>;
};

type Contracts = {
  ethereum?: NetworkContracts;
  rsk?: NetworkContracts;
};

class Service {
  public allowReverseSwaps = true;

  private nodeInfo: NodeInfo;
  public swapManager: SwapManager;
  public eventHandler: EventHandler;
  public elementsService: ElementsService;

  public readonly transactionFetcher: TransactionFetcher;

  public readonly eipSigner: EipSigner;
  public readonly musigSigner: MusigSigner;
  public readonly rateProvider: RateProvider;
  public readonly lockupTransactionTracker: LockupTransactionTracker;

  private prepayMinerFee: boolean;

  private readonly paymentRequestUtils: PaymentRequestUtils;
  private readonly timeoutDeltaProvider: TimeoutDeltaProvider;

  private static MinInboundLiquidity = 10;
  private static MaxInboundLiquidity = 50;

  constructor(
    private logger: Logger,
    config: ConfigType,
    public walletManager: WalletManager,
    private nodeSwitch: NodeSwitch,
    public currencies: Map<string, Currency>,
    blocks: Blocks,
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
      this.nodeSwitch,
    );
    this.rateProvider = new RateProvider(
      this.logger,
      config.rates.interval,
      currencies,
      this.walletManager,
      this.getFeeEstimation,
    );

    this.logger.debug(
      `Using ${
        config.swapwitnessaddress ? 'P2WSH' : 'P2SH nested P2WSH'
      } addresses for legacy Bitcoin Submarine Swaps`,
    );

    this.lockupTransactionTracker = new LockupTransactionTracker(
      this.logger,
      this.currencies,
      this.rateProvider,
    );

    this.swapManager = new SwapManager(
      this.logger,
      this.walletManager,
      this.nodeSwitch,
      this.rateProvider,
      this.timeoutDeltaProvider,
      this.paymentRequestUtils,
      new SwapOutputType(
        config.swapwitnessaddress
          ? OutputType.Bech32
          : OutputType.Compatibility,
      ),
      config.retryInterval,
      blocks,
      config.swap,
      this.lockupTransactionTracker,
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
    this.transactionFetcher = new TransactionFetcher(this.currencies);
    this.eipSigner = new EipSigner(
      this.logger,
      this.currencies,
      this.walletManager,
    );
    this.musigSigner = new MusigSigner(
      this.logger,
      this.currencies,
      this.walletManager,
      this.swapManager.nursery,
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

    this.timeoutDeltaProvider.init(
      configPairs,
      this.walletManager.ethereumManagers,
    );

    this.rateProvider.feeProvider.init(configPairs);
    await this.rateProvider.init(configPairs);

    await this.nodeInfo.init();
  };

  public convertToPairAndSide = (
    from: string,
    to: string,
  ): { pairId: string; orderSide: string } => {
    const pair = (
      [
        [getPairId({ base: from, quote: to }), false],
        [getPairId({ base: to, quote: from }), true],
      ] as [string, boolean][]
    ).find(([val]) => this.rateProvider.has(val));

    if (pair === undefined) {
      throw Errors.PAIR_NOT_FOUND(getPairId({ base: from, quote: to }));
    }

    return {
      pairId: pair[0],
      orderSide: pair[1] ? 'buy' : 'sell',
    };
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

  public rescan = async (
    symbol: string,
    startHeight: number,
  ): Promise<number> => {
    const currency = getCurrency(this.currencies, symbol);

    let endHeight: number;

    if (currency.chainClient) {
      endHeight = (await currency.chainClient.getBlockchainInfo()).blocks;
      await currency.chainClient.rescanChain(startHeight);
    } else if (currency.provider) {
      const manager = this.walletManager.ethereumManagers.find((manager) =>
        manager.hasSymbol(symbol),
      );
      if (manager === undefined) {
        throw Errors.NO_CHAIN_FOR_SYMBOL();
      }

      endHeight = await manager.provider.getBlockNumber();
      await manager.contractEventHandler.rescan(startHeight);
    } else {
      throw Errors.NO_CHAIN_FOR_SYMBOL();
    }

    return endHeight;
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
    pairs: Map<string, PairTypeLegacy>;
  } => {
    return {
      info: this.getInfos(),
      warnings: this.getWarnings(),
      pairs: this.rateProvider.providers[SwapVersion.Legacy].pairs,
    };
  };

  public getInfos = (): ServiceInfo[] => {
    const infos: ServiceInfo[] = [];

    if (this.prepayMinerFee) {
      infos.push(ServiceInfo.PrepayMinerFee);
    }

    return infos;
  };

  public getWarnings = (): ServiceWarning[] => {
    const warnings: ServiceWarning[] = [];

    if (!this.allowReverseSwaps) {
      warnings.push(ServiceWarning.ReverseSwapsDisabled);
    }

    return warnings;
  };

  public getNodes = () => this.nodeInfo.uris;

  public getNodeStats = () => this.nodeInfo.stats;

  public getRoutingHints = async (
    symbol: string,
    routingNode: string,
  ): Promise<{ hopHintsList: HopHint[] }[]> => {
    const hints = await this.swapManager.routingHints.getRoutingHints(
      symbol,
      routingNode,
    );
    return hints.map((hop) => ({
      hopHintsList: hop,
    }));
  };

  public getTimeouts = () => {
    return this.timeoutDeltaProvider.timeoutDeltas;
  };

  /**
   * Gets the contract address used by the Boltz instance
   */
  public getContracts = async (): Promise<Contracts> => {
    if (this.walletManager.ethereumManagers.length === 0) {
      throw Errors.ETHEREUM_NOT_ENABLED();
    }

    const result: Contracts = {};

    const transformManager = async (manager: EthereumManager) => {
      result[manager.networkDetails.name.toLowerCase()] =
        await manager.getContractDetails();
    };

    await Promise.all(
      this.walletManager.ethereumManagers.map((manager) =>
        transformManager(manager),
      ),
    );

    return result;
  };

  /**
   * Gets a hex encoded transaction from a transaction hash on the specified network
   */
  public getTransaction = async (
    symbol: string,
    transactionHash: string,
  ): Promise<string> => {
    const currency = getCurrency(this.currencies, symbol);

    if (currency.chainClient === undefined) {
      throw Errors.NOT_SUPPORTED_BY_SYMBOL(symbol);
    }

    return await currency.chainClient.getRawTransaction(transactionHash);
  };

  public getReverseBip21 = async (invoice: string) => {
    const reverseSwap = await ReverseSwapRepository.getReverseSwap({
      invoice,
    });
    if (!reverseSwap) {
      return undefined;
    }

    const hint = await ReverseRoutingHintRepository.getHint(reverseSwap.id);
    if (!hint) {
      return undefined;
    }

    return {
      bip21: hint.bip21,
      signature: hint.signature,
    };
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

  public getBlockHeights = async (
    symbol?: string,
  ): Promise<Map<string, number>> => {
    const currencies = symbol
      ? [getCurrency(this.currencies, symbol)]
      : Array.from(this.currencies.values());

    return new Map<string, number>(
      (await Promise.all(
        currencies.map(async (currency) => {
          if (currency.chainClient) {
            return [
              currency.symbol,
              (await currency.chainClient.getBlockchainInfo()).blocks,
            ];
          } else {
            return [
              currency.symbol,
              (await currency.provider?.getBlockNumber()) || 0,
            ];
          }
        }),
      )) as [string, number][],
    );
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

    const estimateFeeForProvider = async (provider: Provider) =>
      Number(await this.getGasPrice(provider)) / Number(gweiDecimals);

    const estimateFee = async (currency: Currency): Promise<number> => {
      if (currency.chainClient) {
        return currency.chainClient.estimateFee(numBlocks);
      } else if (currency.provider) {
        return estimateFeeForProvider(currency.provider);
      } else {
        throw Errors.NOT_SUPPORTED_BY_SYMBOL(currency.symbol);
      }
    };

    if (symbol !== undefined) {
      const currency = getCurrency(this.currencies, symbol);
      if (currency.type !== CurrencyType.ERC20) {
        map.set(symbol, await estimateFee(currency));
      } else {
        const manager = this.walletManager.ethereumManagers.find((manager) =>
          manager.hasSymbol(currency.symbol),
        )!;
        map.set(manager.networkDetails.symbol, await estimateFee(currency));
      }
    } else {
      await Promise.all(
        this.walletManager.ethereumManagers.map(async (manager) => {
          map.set(
            manager.networkDetails.symbol,
            await estimateFeeForProvider(manager.provider),
          );
        }),
      );

      for (const [symbol, currency] of this.currencies) {
        if (currency.type === CurrencyType.ERC20) {
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
    const currency = getCurrency(this.currencies, symbol);

    if (currency.chainClient === undefined) {
      throw Errors.NOT_SUPPORTED_BY_SYMBOL(symbol);
    }

    const wallet = this.walletManager.wallets.get(symbol);
    const transaction = parseTransaction(currency.type, transactionHex);

    const [spent, funded] = await Promise.all([
      this.transactionFetcher.getSwapsSpentInInputs(transaction),
      this.transactionFetcher.getSwapsFundedInOutputs(wallet, transaction),
    ]);

    const swapsSpent = (spent.swapsRefunded as AnySwap[])
      .concat(spent.reverseSwapsClaimed)
      .concat(spent.chainSwapsSpent);
    const swapsFunded = (funded.swapLockups as (Swap | ChainSwapInfo)[]).concat(
      funded.chainSwapLockups,
    );

    // Only allow lowball when Reverse Swaps are being claimed or Submarine Swaps being refunded
    // and no Submarine Swap lockup happens
    // That prevents transactions that we could accept 0-conf for from being broadcast through our API
    const isSwapRelated = swapsFunded.length === 0 && swapsSpent.length > 0;

    if (isSwapRelated) {
      this.logger.debug(
        `Broadcasting ${symbol} transaction related to Swaps (${swapsSpent.map((r) => r.id).join(', ')}): ${transaction.getId()}`,
      );
    }

    try {
      return await currency.chainClient.sendRawTransaction(
        transactionHex,
        isSwapRelated,
      );
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
        if (spent.swapsRefunded.length === 0) {
          throw error;
        }

        const { blocks } = await currency.chainClient.getBlockchainInfo();

        throw {
          error: (error as any).message,
          timeoutBlockHeight: spent.swapsRefunded[0].timeoutBlockHeight,
          // Here we don't need to check whether the Swap has timed out yet because
          // if the error above has been thrown, we can be sure that this is not the case
          timeoutEta: calculateTimeoutDate(
            symbol,
            spent.swapsRefunded[0].timeoutBlockHeight - blocks,
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

  public setSwapStatus = async (id: string, status: string) => {
    if (
      ![
        SwapUpdateEvent.InvoiceFailedToPay,
        SwapUpdateEvent.InvoicePending,
      ].includes(status as unknown as SwapUpdateEvent)
    ) {
      throw Errors.SET_SWAP_UPDATE_EVENT_NOT_ALLOWED(status);
    }

    const swap = await SwapRepository.getSwap({ id });
    if (!swap) {
      throw Errors.SWAP_NOT_FOUND(id);
    }
    await SwapRepository.setSwapStatus(
      swap,
      status,
      status === SwapUpdateEvent.InvoiceFailedToPay
        ? cancelledViaCliFailureReason
        : undefined,
    );
    // Not the nicest way to do it, but works for the 2 whitelisted events
    this.swapManager.nursery.emit(
      status as unknown as keyof SwapNurseryEvents,
      swap,
    );
  };

  public getLockedFunds = async (): Promise<
    Map<string, { reverseSwaps: ReverseSwap[]; chainSwaps: ChainSwapInfo[] }>
  > => {
    const [pendingReverseSwaps, pendingChainSwaps] = await Promise.all([
      ReverseSwapRepository.getReverseSwaps({
        status: {
          [Op.in]: [
            SwapUpdateEvent.TransactionMempool,
            SwapUpdateEvent.TransactionConfirmed,
          ],
        },
      }),
      ChainSwapRepository.getChainSwaps({
        status: {
          [Op.in]: [
            SwapUpdateEvent.TransactionServerMempool,
            SwapUpdateEvent.TransactionServerConfirmed,
          ],
        },
      }),
    ]);

    const res = new DefaultMap<
      string,
      { reverseSwaps: ReverseSwap[]; chainSwaps: ChainSwapInfo[] }
    >(() => ({
      chainSwaps: [],
      reverseSwaps: [],
    }));

    pendingReverseSwaps.forEach((pending) => {
      const pair = splitPairId(pending.pair);
      res
        .get(getChainCurrency(pair.base, pair.quote, pending.orderSide, true))
        .reverseSwaps.push(pending);
    });
    pendingChainSwaps.forEach((pending) => {
      res.get(pending.sendingData.symbol).chainSwaps.push(pending);
    });

    return res;
  };

  public getPendingSweeps = (): Map<string, SwapToClaimPreimage[]> => {
    return this.swapManager.deferredClaimer.pendingSweepsValues();
  };

  /**
   * Creates a new Swap from the chain to Lightning
   */
  public createSwap = async (args: {
    pairId: string;
    orderSide: string;
    preimageHash: Buffer;
    version: SwapVersion;
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

    // Only set for Taproot swaps
    claimPublicKey?: string;
    swapTree?: SwapTreeSerializer.SerializedTree;

    // Is undefined when Bitcoin or Litecoin is swapped to Lightning
    claimAddress?: string;

    blindingKey?: string;

    referralId?: string;
  }> => {
    await this.checkSwapWithPreimageExists(args.preimageHash);

    const { base, quote } = this.getPair(args.pairId);
    const orderSide = this.getOrderSide(args.orderSide);

    switch (
      getCurrency(
        this.currencies,
        getChainCurrency(base, quote, orderSide, false),
      ).type
    ) {
      case CurrencyType.BitcoinLike:
      case CurrencyType.Liquid:
        if (args.refundPublicKey === undefined) {
          throw ApiErrors.UNDEFINED_PARAMETER('refundPublicKey');
        }
        break;

      case CurrencyType.Ether:
      case CurrencyType.ERC20:
        break;

      default:
        if (args.version !== SwapVersion.Legacy) {
          throw Errors.UNSUPPORTED_SWAP_VERSION();
        }
    }

    const lightningCurrency = getLightningCurrency(
      base,
      quote,
      orderSide,
      false,
    );

    if (
      !NodeSwitch.hasClient(getCurrency(this.currencies, lightningCurrency))
    ) {
      throw SwapErrors.NO_LIGHTNING_SUPPORT(lightningCurrency);
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
        SwapType.Submarine,
        args.version,
        args.invoice,
        args.referralId,
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
      swapTree,
      timeoutBlockHeight,
      blindingKey,
      redeemScript,
      claimAddress,
      claimPublicKey,
    } = await this.swapManager.createSwap({
      orderSide,
      referralId,
      timeoutBlockDelta,

      baseCurrency: base,
      quoteCurrency: quote,
      version: args.version,
      channel: args.channel,
      preimageHash: args.preimageHash,
      refundPublicKey: args.refundPublicKey,
    });

    this.eventHandler.emitSwapCreation(id);

    return {
      id,
      address,
      swapTree,
      referralId,
      canBeRouted,
      blindingKey,
      redeemScript,
      claimAddress,
      claimPublicKey,
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
      swap.orderSide,
      SwapType.Submarine,
      PercentageFeeType.Calculation,
    );
    const baseFee = this.rateProvider.feeProvider.getBaseFee(
      onchainCurrency,
      swap.version,
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

    swap.invoiceAmount = decodeInvoiceAmount(invoice);
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
      throw SwapErrors.NO_ROUTE_FOUND();
    }

    return this.setSwapInvoice(swap, invoice, true, pairHash);
  };

  /**
   * Sets the invoice for Submarine Swap
   */
  private setSwapInvoice = async (
    swap: Swap,
    invoice: string,
    canBeRouted: boolean,
    pairHash?: string,
  ): Promise<{
    bip21: string;
    expectedAmount: number;
    acceptZeroConf: boolean;
  }> => {
    const { base, quote, rate: pairRate } = this.getPair(swap.pair);

    if (pairHash !== undefined) {
      this.rateProvider.providers[swap.version].validatePairHash(
        pairHash,
        swap.pair,
        swap.orderSide,
        SwapType.Submarine,
      );
    }

    const chainCurrency = getChainCurrency(base, quote, swap.orderSide, false);
    const lightningCurrency = getLightningCurrency(
      base,
      quote,
      swap.orderSide,
      false,
    );

    const decodedInvoice = decodeInvoice(invoice);
    swap.invoiceAmount = decodedInvoice.satoshis;

    const { destination, features } = await this.nodeSwitch
      .getSwapNode(getCurrency(this.currencies, lightningCurrency)!, swap)
      .decodeInvoice(invoice);

    if (this.nodeInfo.isOurNode(destination)) {
      throw Errors.DESTINATION_BOLTZ_NODE();
    }

    if (features.has(InvoiceFeature.AMP)) {
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
      swap.version,
      rate,
      swap.orderSide,
      swap.invoiceAmount,
      SwapType.Submarine,
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
        this.rateProvider.feeProvider.getPercentageFee(
          swap.pair,
          swap.orderSide,
          SwapType.Submarine,
          PercentageFeeType.Calculation,
        ),
      );

      throw Errors.INVALID_INVOICE_AMOUNT(maxInvoiceAmount);
    }

    const acceptZeroConf = this.rateProvider.acceptZeroConf(
      chainCurrency,
      expectedAmount,
    );

    const minutesUntilExpiry =
      (decodedInvoice.timeExpireDate - getUnixTime()) / 60;

    if (minutesUntilExpiry < 0) {
      throw SwapErrors.INVOICE_EXPIRED_ALREADY();
    }

    // When we do not accept 0-conf, we make sure there is enough time for a lockup transaction to confirm
    if (!acceptZeroConf) {
      if (
        (TimeoutDeltaProvider.blockTimes.get(chainCurrency) || 0) * 2 >
        minutesUntilExpiry
      ) {
        throw Errors.INVOICE_EXPIRY_TOO_SHORT();
      }
    }

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

    return {
      expectedAmount,
      acceptZeroConf,
      bip21: this.paymentRequestUtils.encodeBip21(
        chainCurrency,
        swap.lockupAddress,
        expectedAmount,
        getSwapMemo(lightningCurrency, SwapType.Submarine),
      )!,
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
    version: SwapVersion = SwapVersion.Legacy,
  ): Promise<{
    id: string;
    bip21: string;
    address: string;
    expectedAmount: number;
    acceptZeroConf: boolean;
    timeoutBlockHeight: number;

    // Is undefined when Ether or ERC20 tokens are swapped to Lightning
    redeemScript?: string;

    // Only set for Taproot swaps
    claimPublicKey?: string;
    swapTree?: SwapTreeSerializer.SerializedTree;

    // Is undefined when Bitcoin or Litecoin is swapped to Lightning
    claimAddress?: string;

    blindingKey?: string;

    referralId?: string;
  }> => {
    let swap = await SwapRepository.getSwap({
      invoice,
    });

    if (swap) {
      throw Errors.SWAP_WITH_INVOICE_EXISTS();
    }

    const preimageHash = getHexBuffer(decodeInvoice(invoice).paymentHash!);
    checkPreimageHashLength(preimageHash);

    const createdSwap = await this.createSwap({
      pairId,
      channel,
      version,
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
            id: createdSwap.id,
          }))!,
          invoice,
          createdSwap.canBeRouted,
          pairHash,
        );

      return {
        bip21,
        acceptZeroConf,
        expectedAmount,
        id: createdSwap.id,
        address: createdSwap.address,
        swapTree: createdSwap.swapTree,
        referralId: createdSwap.referralId,
        blindingKey: createdSwap.blindingKey,
        claimAddress: createdSwap.claimAddress,
        redeemScript: createdSwap.redeemScript,
        claimPublicKey: createdSwap.claimPublicKey,
        timeoutBlockHeight: createdSwap.timeoutBlockHeight,
      };
    } catch (error) {
      const channelCreation =
        await ChannelCreationRepository.getChannelCreation({
          swapId: createdSwap.id,
        });
      await channelCreation?.destroy();

      swap = await SwapRepository.getSwap({
        id: createdSwap.id,
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
    version: SwapVersion;
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

    // Address of the user to encode in the invoice memo
    userAddress?: string;
    userAddressSignature?: Buffer;

    claimCovenant?: boolean;
  }): Promise<{
    id: string;
    invoice: string;

    blindingKey?: string;
    lockupAddress: string;

    redeemScript?: string;

    // Only set for Taproot swaps
    refundPublicKey?: string;
    swapTree?: SwapTreeSerializer.SerializedTree;

    refundAddress?: string;

    onchainAmount?: number;
    minerFeeInvoice?: string;

    timeoutBlockHeight: number;

    prepayMinerFeeAmount?: number;

    referralId?: string;
  }> => {
    if (!this.allowReverseSwaps) {
      throw Errors.REVERSE_SWAPS_DISABLED();
    }

    await this.checkSwapWithPreimageExists(args.preimageHash);

    const side = this.getOrderSide(args.orderSide);
    const { base, quote, rate: pairRate } = this.getPair(args.pairId);

    if (args.pairHash !== undefined) {
      this.rateProvider.providers[args.version].validatePairHash(
        args.pairHash,
        args.pairId,
        side,
        SwapType.ReverseSubmarine,
      );
    }

    const { sending, receiving } = getSendingReceivingCurrency(
      base,
      quote,
      side,
    );
    const sendingCurrency = getCurrency(this.currencies, sending);

    // Not the pretties way and also not the right spot to do input validation but
    // only at this point in time the type of the sending currency is known
    switch (sendingCurrency.type) {
      case CurrencyType.Liquid:
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

        args.claimAddress = checkEvmAddress(args.claimAddress);

        break;
    }

    const [onchainTimeoutBlockDelta] =
      await this.timeoutDeltaProvider.getTimeout(
        args.pairId,
        side,
        SwapType.ReverseSubmarine,
        args.version,
      );

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
      side,
      SwapType.ReverseSubmarine,
      PercentageFeeType.Calculation,
    );
    const baseFee = this.rateProvider.feeProvider.getBaseFee(
      sendingCurrency.symbol,
      args.version,
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
        const gasPrice = await this.getGasPrice(sendingCurrency.provider!);
        prepayMinerFeeOnchainAmount = Number(
          (gasPrice * ethereumPrepayMinerFeeGasLimit) / etherDecimals,
        );

        const chainFeeSymbol = this.walletManager.ethereumManagers.find(
          (manager) => manager.hasSymbol(sendingCurrency.symbol),
        )!.networkDetails.symbol;

        const sendingAmountRate =
          sending === chainFeeSymbol
            ? 1
            : this.rateProvider.rateCalculator.calculateRate(
                chainFeeSymbol,
                sending,
              );

        const receivingAmountRate =
          receiving === chainFeeSymbol
            ? 1
            : this.rateProvider.rateCalculator.calculateRate(
                chainFeeSymbol,
                receiving,
              );
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
      swapTree,
      blindingKey,
      redeemScript,
      refundAddress,
      lockupAddress,
      refundPublicKey,
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
      version: args.version,
      routingNode: args.routingNode,
      userAddress: args.userAddress,
      claimAddress: args.claimAddress,
      preimageHash: args.preimageHash,
      claimPublicKey: args.claimPublicKey,
      claimCovenant: args.claimCovenant || false,
      userAddressSignature: args.userAddressSignature,
    });

    this.eventHandler.emitSwapCreation(id);

    const response: any = {
      id,
      invoice,
      swapTree,
      referralId,
      blindingKey,
      redeemScript,
      refundAddress,
      lockupAddress,
      refundPublicKey,
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

  // TODO: test
  public createChainSwap = async (args: {
    pairId: string;
    orderSide: string;

    pairHash?: string;
    referralId?: string;

    preimageHash: Buffer;

    claimPublicKey?: Buffer;
    refundPublicKey?: Buffer;

    claimAddress?: string;

    userLockAmount?: number;
    serverLockAmount?: number;
  }) => {
    await this.checkSwapWithPreimageExists(args.preimageHash);

    const side = this.getOrderSide(args.orderSide);
    const { base, quote, rate: pairRate } = this.getPair(args.pairId);

    if (base === quote) {
      throw Errors.PAIR_NOT_FOUND(args.pairId);
    }

    if (args.pairHash !== undefined) {
      this.rateProvider.providers[SwapVersion.Taproot].validatePairHash(
        args.pairHash,
        args.pairId,
        side,
        SwapType.Chain,
      );
    }

    const { sending, receiving } = getSendingReceivingCurrency(
      base,
      quote,
      side,
    );
    const [sendingCurrency, receivingCurrency] = [
      getCurrency(this.currencies, sending),
      getCurrency(this.currencies, receiving),
    ];

    switch (sendingCurrency.type) {
      case CurrencyType.Liquid:
      case CurrencyType.BitcoinLike:
        if (args.claimPublicKey === undefined) {
          throw ApiErrors.UNDEFINED_PARAMETER('claimPublicKey');
        }

        break;

      case CurrencyType.Ether:
      case CurrencyType.ERC20:
        if (args.claimAddress === undefined) {
          throw ApiErrors.UNDEFINED_PARAMETER('claimAddress');
        }

        args.claimAddress = checkEvmAddress(args.claimAddress);

        break;
    }

    if (
      receivingCurrency.type === CurrencyType.Liquid ||
      receivingCurrency.type === CurrencyType.BitcoinLike
    ) {
      if (args.refundPublicKey === undefined) {
        throw ApiErrors.UNDEFINED_PARAMETER('refundPublicKey');
      }
    }

    const sendingTimeoutBlockDelta = (
      await this.timeoutDeltaProvider.getTimeout(
        args.pairId,
        side,
        SwapType.Chain,
        SwapVersion.Taproot,
      )
    )[0];
    const receivingTimeoutBlockDelta = TimeoutDeltaProvider.convertBlocks(
      sending,
      receiving,
      sendingTimeoutBlockDelta * 1.25,
    );

    const rate = getRate(pairRate, side, true);
    const feePercent = this.rateProvider.feeProvider.getPercentageFee(
      args.pairId,
      side,
      SwapType.Chain,
      PercentageFeeType.Calculation,
    );
    const baseFee =
      this.rateProvider.feeProvider.getSwapBaseFees<ChainSwapMinerFees>(
        args.pairId,
        side,
        SwapType.Chain,
        SwapVersion.Taproot,
      ).server;

    let percentageFee: number;

    if (
      args.userLockAmount !== undefined &&
      args.serverLockAmount !== undefined
    ) {
      throw Errors.USER_AND_SERVER_AMOUNT_SPECIFIED();
    } else if (args.userLockAmount !== undefined) {
      this.checkWholeNumber(args.userLockAmount);

      args.serverLockAmount = args.userLockAmount * rate;

      percentageFee = Math.ceil(feePercent * args.serverLockAmount);

      args.serverLockAmount -= percentageFee + baseFee;
      args.serverLockAmount = Math.floor(args.serverLockAmount);
    } else if (args.serverLockAmount !== undefined) {
      this.checkWholeNumber(args.serverLockAmount);

      args.userLockAmount = (args.serverLockAmount + baseFee) / rate;
      args.userLockAmount = args.userLockAmount / (1 - feePercent);
      args.userLockAmount = Math.ceil(args.userLockAmount);

      percentageFee = Math.ceil(args.userLockAmount * rate * feePercent);
    } else {
      throw Errors.NO_AMOUNT_SPECIFIED();
    }

    this.verifyAmount(args.pairId, rate, args.userLockAmount, side, true);
    if (args.serverLockAmount < 1) {
      throw Errors.ONCHAIN_AMOUNT_TOO_LOW();
    }

    const referralId = await this.getReferralId(args.referralId);
    const res = await this.swapManager.createChainSwap({
      referralId,
      percentageFee,
      sendingTimeoutBlockDelta,
      receivingTimeoutBlockDelta,
      orderSide: side,
      baseCurrency: base,
      quoteCurrency: quote,
      claimAddress: args.claimAddress,
      preimageHash: args.preimageHash,
      userLockAmount: args.userLockAmount,
      claimPublicKey: args.claimPublicKey,
      refundPublicKey: args.refundPublicKey,
      serverLockAmount: args.serverLockAmount,
      acceptZeroConf: this.rateProvider.acceptZeroConf(
        receivingCurrency.symbol,
        args.userLockAmount,
      ),
    });

    this.eventHandler.emitSwapCreation(res.id);
    return {
      referralId,
      id: res.id,
      claimDetails: res.claimDetails,
      lockupDetails: {
        ...res.lockupDetails,
        bip21: this.paymentRequestUtils.encodeBip21(
          receivingCurrency.symbol,
          res.lockupDetails.lockupAddress,
          res.lockupDetails.amount,
          getSwapMemo(sendingCurrency.symbol, SwapType.Chain),
        ),
      },
    };
  };

  /**
   * Pays a lightning invoice
   */
  public payInvoice = async (
    symbol: string,
    invoice: string,
  ): Promise<PaymentResponse> => {
    const currency = getCurrency(this.currencies, symbol);
    const lightningClient = currency.lndClient || currency.clnClient;

    if (lightningClient === undefined) {
      throw SwapErrors.NO_LIGHTNING_SUPPORT(symbol);
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

  private getGasPrice = async (provider: Provider) => {
    const feeData = await provider.getFeeData();
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

  private checkSwapWithPreimageExists = async (preimageHash: Buffer) => {
    const hashHex = getHexString(preimageHash);

    const swaps = await Promise.all([
      SwapRepository.getSwap({
        preimageHash: hashHex,
      }),
      ReverseSwapRepository.getReverseSwap({
        preimageHash: hashHex,
      }),
      ChainSwapRepository.getChainSwap({
        preimageHash: hashHex,
      }),
    ]);

    if (swaps.some((s) => s !== null)) {
      throw Errors.SWAP_WITH_PREIMAGE_EXISTS();
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

    const pair =
      this.rateProvider.providers[SwapVersion.Legacy].pairs.get(pairId);

    if (!pair) {
      throw Errors.PAIR_NOT_FOUND(pairId);
    }

    return {
      base,
      quote,
      ...pair,
    };
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

  private checkWholeNumber = (input: number) => {
    if (input % 1 !== 0) {
      throw Errors.NOT_WHOLE_NUMBER(input);
    }
  };
}

export const cancelledViaCliFailureReason = 'payment has been cancelled';

export default Service;
export { Contracts, NetworkContracts };
