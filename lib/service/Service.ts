import type { Transaction } from 'bitcoinjs-lib';
import type { SwapTreeSerializer } from 'boltz-core';
import { OutputType } from 'boltz-core';
import type { Provider } from 'ethers';
import type { Transaction as LiquidTransaction } from 'liquidjs-lib';
import type { Order } from 'sequelize';
import { Op } from 'sequelize';
import type { ConfigType } from '../Config';
import { parseTransaction } from '../Core';
import type { LogLevel } from '../Logger';
import type Logger from '../Logger';
import {
  calculateEthereumTransactionFeeWithReceipt,
  calculateLiquidTransactionFee,
  calculateUtxoTransactionFee,
  checkEvmAddress,
  createApiCredential,
  formatError,
  getChainCurrency,
  getHexString,
  getLightningCurrency,
  getPairId,
  getRate,
  getSendingReceivingCurrency,
  getSwapMemo,
  getUnixTime,
  getVersion,
  splitPairId,
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
import type { AnySwap, PairConfig } from '../consts/Types';
import type Referral from '../db/models/Referral';
import type ReverseSwap from '../db/models/ReverseSwap';
import type Swap from '../db/models/Swap';
import type { ChainSwapInfo } from '../db/repositories/ChainSwapRepository';
import ChainSwapRepository from '../db/repositories/ChainSwapRepository';
import ChannelCreationRepository from '../db/repositories/ChannelCreationRepository';
import ExtraFeeRepository from '../db/repositories/ExtraFeeRepository';
import PairRepository from '../db/repositories/PairRepository';
import ReferralRepository from '../db/repositories/ReferralRepository';
import ReverseRoutingHintRepository from '../db/repositories/ReverseRoutingHintRepository';
import ReverseSwapRepository from '../db/repositories/ReverseSwapRepository';
import SwapRepository from '../db/repositories/SwapRepository';
import { msatToSat } from '../lightning/ChannelUtils';
import LightningErrors from '../lightning/Errors';
import type { HopHint } from '../lightning/LightningClient';
import { InvoiceFeature } from '../lightning/LightningClient';
import type LndClient from '../lightning/LndClient';
import type ClnClient from '../lightning/cln/ClnClient';
import type NotificationClient from '../notifications/NotificationClient';
import {
  Balances,
  ChainInfo,
  CurrencyInfo,
  DeriveKeysResponse,
  GetBalanceResponse,
  GetInfoResponse,
  LightningInfo,
} from '../proto/boltzrpc_pb';
import FeeProvider from '../rates/FeeProvider';
import LockupTransactionTracker from '../rates/LockupTransactionTracker';
import RateProvider from '../rates/RateProvider';
import type { PairTypeLegacy } from '../rates/providers/RateProviderLegacy';
import type {
  ChainPairTypeTaproot,
  ReversePairTypeTaproot,
  SubmarinePairTypeTaproot,
} from '../rates/providers/RateProviderTaproot';
import type DecodedInvoice from '../sidecar/DecodedInvoice';
import { InvoiceType } from '../sidecar/DecodedInvoice';
import type Sidecar from '../sidecar/Sidecar';
import SwapErrors from '../swap/Errors';
import NodeSwitch from '../swap/NodeSwitch';
import type { SwapNurseryEvents } from '../swap/PaymentHandler';
import type { ChannelCreationInfo } from '../swap/SwapManager';
import SwapManager from '../swap/SwapManager';
import SwapOutputType from '../swap/SwapOutputType';
import type { Currency } from '../wallet/WalletManager';
import type WalletManager from '../wallet/WalletManager';
import BalanceCheck from './BalanceCheck';
import ElementsService from './ElementsService';
import Errors from './Errors';
import EventHandler from './EventHandler';
import NodeInfo from './NodeInfo';
import PaymentRequestUtils from './PaymentRequestUtils';
import TimeoutDeltaProvider from './TimeoutDeltaProvider';
import TransactionFetcher from './TransactionFetcher';
import { calculateTimeoutDate, getCurrency } from './Utils';
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

type WebHookData = {
  url: string;
  hashSwapId?: boolean;
  status?: string[];
};

type ExtraFees = {
  id: string;
  percentage: number;
};

type SomePair =
  | PairTypeLegacy
  | SubmarinePairTypeTaproot
  | ReversePairTypeTaproot
  | ChainPairTypeTaproot;

class Service {
  public allowReverseSwaps = true;

  private nodeInfo: NodeInfo;
  public swapManager: SwapManager;
  public eventHandler: EventHandler;
  public elementsService: ElementsService;

  public readonly transactionFetcher: TransactionFetcher;

  public readonly musigSigner: MusigSigner;
  public readonly rateProvider: RateProvider;
  public readonly lockupTransactionTracker: LockupTransactionTracker;

  private prepayMinerFee: boolean;

  private balanceCheck: BalanceCheck;
  private readonly paymentRequestUtils: PaymentRequestUtils;
  private readonly timeoutDeltaProvider: TimeoutDeltaProvider;

  private static MinInboundLiquidity = 10;
  private static MaxInboundLiquidity = 50;

  constructor(
    private logger: Logger,
    notifications: NotificationClient | undefined,
    config: ConfigType,
    public walletManager: WalletManager,
    private nodeSwitch: NodeSwitch,
    public currencies: Map<string, Currency>,
    public readonly sidecar: Sidecar,
  ) {
    this.prepayMinerFee = config.prepayminerfee;
    this.logger.debug(
      `Prepay miner fee for Reverse Swaps is ${
        this.prepayMinerFee ? 'enabled' : 'disabled'
      }`,
    );

    this.paymentRequestUtils = new PaymentRequestUtils(
      this.sidecar,
      this.currencies.get(ElementsClient.symbol),
    );
    this.timeoutDeltaProvider = new TimeoutDeltaProvider(
      this.logger,
      config,
      this.sidecar,
      currencies,
      this.nodeSwitch,
    );
    this.rateProvider = new RateProvider(
      this.logger,
      config.rates.interval,
      config.swap.minSwapSizeMultipliers,
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
      config,
      this.currencies,
      this.rateProvider,
    );

    this.balanceCheck = new BalanceCheck(this.walletManager);
    this.swapManager = new SwapManager(
      this.logger,
      notifications,
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
      config.swap,
      this.lockupTransactionTracker,
      this.sidecar,
      this.balanceCheck,
    );

    this.eventHandler = new EventHandler(this.logger, this.swapManager.nursery);

    this.nodeInfo = new NodeInfo(
      this.logger,
      this.currencies,
      config.currencies,
    );
    this.elementsService = new ElementsService(
      this.currencies,
      this.walletManager,
    );
    this.transactionFetcher = new TransactionFetcher(this.currencies);
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
    await this.lockupTransactionTracker.init();
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

  public setLogLevel = async (level: LogLevel) => {
    this.logger.info(`Setting log level to: ${level}`);

    this.logger.setLevel(level);
    await this.sidecar.setLogLevel(level);
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

  public listSwaps = async (
    status?: string,
    limit?: number,
  ): Promise<{
    submarine: string[];
    reverse: string[];
    chain: string[];
  }> => {
    const statusOptions =
      status !== undefined
        ? {
            status,
          }
        : {};
    const order: Order = [['createdAt', 'DESC']];

    const [submarine, reverse, chain] = await Promise.all([
      SwapRepository.getSwaps(statusOptions, order, limit),
      ReverseSwapRepository.getReverseSwaps(statusOptions, order, limit),
      ChainSwapRepository.getChainSwaps(statusOptions, order, limit),
    ]);

    return {
      submarine: submarine.map((s) => s.id),
      reverse: reverse.map((s) => s.id),
      chain: chain.map((s) => s.id),
    };
  };

  public rescan = async (
    symbol: string,
    startHeight: number,
    includeMempool?: boolean,
  ): Promise<number> => {
    this.logger.info(
      `Rescanning ${symbol} starting from height ${startHeight}`,
    );
    const currency = getCurrency(this.currencies, symbol);

    let endHeight: number;

    if (currency.chainClient) {
      endHeight = (await currency.chainClient.getBlockchainInfo()).blocks;
      await currency.chainClient.rescanChain(startHeight);

      if (includeMempool) {
        await this.sidecar.rescanMempool([symbol]);
      }
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

    this.logger.info(
      `Finished rescanning ${symbol} from height ${startHeight} to ${endHeight}${includeMempool ? ' including mempool' : ''}`,
    );

    return endHeight;
  };

  public calculateTransactionFee = async (
    symbol: string,
    transactionId: string,
  ): Promise<{
    absolute: number;
    gwei?: number;
    satPerVbyte?: number;
  }> => {
    const currency = getCurrency(this.currencies, symbol);
    switch (currency.type) {
      case CurrencyType.BitcoinLike: {
        const tx = parseTransaction(
          currency.type,
          await currency.chainClient!.getRawTransaction(transactionId),
        );
        const absolute = await calculateUtxoTransactionFee(
          currency.chainClient!,
          tx as Transaction,
        );

        return {
          absolute,
          satPerVbyte: absolute / tx.virtualSize(),
        };
      }

      case CurrencyType.Liquid: {
        const tx = parseTransaction(
          currency.type,
          await currency.chainClient!.getRawTransaction(transactionId),
        ) as LiquidTransaction;
        const absolute = calculateLiquidTransactionFee(tx);

        return {
          absolute,
          satPerVbyte: absolute / tx.virtualSize(true),
        };
      }

      case CurrencyType.Ether:
      case CurrencyType.ERC20: {
        const receipt =
          await currency.provider!.getTransactionReceipt(transactionId);
        if (receipt === null) {
          throw Errors.NO_TRANSACTION(transactionId);
        }
        return {
          gwei: Number(receipt.gasPrice) / Number(gweiDecimals),
          absolute: calculateEthereumTransactionFeeWithReceipt(receipt),
        };
      }
    }
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
    await Promise.all(
      this.walletManager.ethereumManagers.map(async (manager) => {
        result[manager.networkDetails.name.toLowerCase()] =
          await manager.getContractDetails();
      }),
    );

    return result;
  };

  /**
   * Gets a hex encoded transaction from a transaction hash on the specified network
   */
  public getTransaction = async (
    symbol: string,
    transactionHash: string,
  ): Promise<{ hex: string; confirmations?: number }> => {
    const currency = getCurrency(this.currencies, symbol);
    if (currency.chainClient === undefined) {
      throw Errors.NOT_SUPPORTED_BY_SYMBOL(symbol);
    }
    const res =
      await currency.chainClient.getRawTransactionVerbose(transactionHash);

    return { hex: res.hex, confirmations: res.confirmations };
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

  public getSubmarinePreimage = async (id: string): Promise<string> => {
    const swap = await SwapRepository.getSwap({
      id,
    });
    if (swap === null || swap === undefined) {
      throw Errors.SWAP_NOT_FOUND(id);
    }

    if (swap.preimage === null || swap.preimage === undefined) {
      throw Errors.PREIMAGE_NOT_AVAILABLE();
    }

    return swap.preimage;
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
  public getAddress = async (
    symbol: string,
    label: string,
  ): Promise<string> => {
    const wallet = this.walletManager.wallets.get(symbol);

    if (wallet === undefined) {
      throw Errors.CURRENCY_NOT_FOUND(symbol);
    }

    return wallet.getAddress(label);
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

    // Only allow lowball for swap related transactions
    const isSwapRelated = swapsFunded.length > 0 || swapsSpent.length > 0;
    const needsLowball =
      currency.type === CurrencyType.Liquid &&
      ElementsClient.needsLowball(transaction as LiquidTransaction);

    const relevantSwapIds = swapsSpent.concat(swapsFunded).map((r) => r.id);

    if (isSwapRelated) {
      // Disable 0-conf for all swaps that are being funded when the transaction
      // is being broadcast through the lowball node
      if (swapsFunded.length > 0) {
        if (needsLowball) {
          this.logger.debug(
            `Disabling 0-conf for Swaps: ${swapsFunded.map((s) => s.id).join(', ')}`,
          );

          await Promise.all([
            SwapRepository.disableZeroConf(funded.swapLockups),
            ChainSwapRepository.disableZeroConf(funded.chainSwapLockups),
          ]);
        } else {
          this.logger.debug(
            `Not disabling 0-conf for Swaps (${relevantSwapIds.join(', ')}) because the lockup transaction is not lowball`,
          );
        }
      }

      this.logger.debug(
        `Broadcasting ${symbol} transaction related to Swaps (${relevantSwapIds.join(
          ', ',
        )}): ${transaction.getId()}`,
      );
    }

    try {
      return await currency.chainClient.sendRawTransaction(
        transactionHex,
        isSwapRelated && needsLowball,
      );
    } catch (error) {
      if (isSwapRelated) {
        this.logger.warn(
          `Broadcast of ${symbol} transaction related to Swaps (${relevantSwapIds.join(', ')}) failed ${formatError(error)}: ${transactionHex}`,
        );
      }

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

  public allowRefund = async (id: string) => {
    await this.musigSigner.allowRefund(id);
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

  public getPendingSweeps = () => {
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
    webHook?: WebHookData;
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

    const { base, quote } = splitPairId(args.pairId);
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

    if (args.webHook) {
      await this.addWebHook(id, args.webHook, async () => {
        await (
          await ChannelCreationRepository.getChannelCreation({
            swapId: id,
          })
        )?.destroy();
        await (await SwapRepository.getSwap({ id }))?.destroy();
      });
    }

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
      swap.referral !== undefined && swap.referral !== null
        ? await ReferralRepository.getReferralById(swap.referral)
        : null,
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

    await this.verifyAmount(
      swap.pair,
      rate,
      invoiceAmount,
      swap.orderSide,
      swap.version,
      SwapType.Submarine,
      swap.referral,
    );

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
    extraFees?: ExtraFees,
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

    const [cltvLimit, decodedInvoice] = await Promise.all([
      this.timeoutDeltaProvider.getCltvLimit(swap),
      this.sidecar.decodeInvoiceOrOffer(invoice),
    ]);
    swap.invoiceAmount = msatToSat(decodedInvoice.amountMsat);

    const lightningClient = await this.nodeSwitch.getSwapNode(
      this.currencies.get(lightningCurrency)!,
      decodedInvoice,
      swap,
    );

    // TODO: fix this for bolt12
    const requiredTimeout =
      decodedInvoice.type === InvoiceType.Bolt12Invoice
        ? 144
        : await this.timeoutDeltaProvider.checkRoutability(
            lightningClient,
            decodedInvoice,
            cltvLimit,
          );

    if (requiredTimeout == TimeoutDeltaProvider.noRoutes) {
      throw SwapErrors.NO_ROUTE_FOUND();
    }

    return this.setSwapInvoice(swap, invoice, true, pairHash, extraFees);
  };

  /**
   * Sets the invoice for Submarine Swap
   */
  private setSwapInvoice = async (
    swap: Swap,
    invoice: string,
    canBeRouted: boolean,
    pairHash?: string,
    extraFees?: ExtraFees,
  ): Promise<{
    bip21: string;
    expectedAmount: number;
    acceptZeroConf: boolean;
  }> => {
    const {
      base,
      quote,
      referral,
      rate: pairRate,
    } = await this.getPair(
      swap.pair,
      swap.orderSide,
      swap.version,
      SwapType.Submarine,
      swap.referral,
    );

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

    const decodedInvoice = await this.sidecar.decodeInvoiceOrOffer(invoice);

    if (decodedInvoice.type === InvoiceType.Offer) {
      throw SwapErrors.NO_OFFERS_ALLOWED();
    }

    swap.invoiceAmount = msatToSat(decodedInvoice.amountMsat);

    const lightningClient = await this.nodeSwitch.getSwapNode(
      getCurrency(this.currencies, lightningCurrency)!,
      decodedInvoice,
      swap,
    );

    const { destination, features } =
      await lightningClient.decodeInvoice(invoice);

    if (this.nodeInfo.isOurNode(destination)) {
      throw Errors.DESTINATION_BOLTZ_NODE();
    }

    if (this.nodeInfo.isNoRoute(lightningCurrency, destination)) {
      throw LightningErrors.NO_ROUTE();
    }

    // TODO: check this still works
    if (features.has(InvoiceFeature.AMP)) {
      throw Errors.AMP_INVOICES_NOT_SUPPORTED();
    }

    const rate = swap.rate || getRate(pairRate, swap.orderSide, false);
    await this.verifyAmount(
      swap.pair,
      rate,
      swap.invoiceAmount,
      swap.orderSide,
      swap.version,
      SwapType.Submarine,
      swap.referral,
    );

    const { baseFee, percentageFee, extraFee } =
      this.rateProvider.feeProvider.getFees(
        swap.pair,
        swap.version,
        rate,
        swap.orderSide,
        swap.invoiceAmount,
        SwapType.Submarine,
        BaseFeeType.NormalClaim,
        referral,
        extraFees,
      );

    const expectedAmount =
      Math.floor(swap.invoiceAmount * rate) +
      baseFee +
      percentageFee +
      (extraFee || 0);

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
          referral,
        ),
      );

      throw Errors.INVALID_INVOICE_AMOUNT(maxInvoiceAmount);
    }

    const acceptZeroConf = this.rateProvider.acceptZeroConf(
      chainCurrency,
      expectedAmount,
    );

    const minutesUntilExpiry =
      (decodedInvoice.expiryTimestamp - getUnixTime()) / 60;

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

    await this.createExtraFees(swap.id, extraFee, extraFees);

    return {
      expectedAmount,
      acceptZeroConf,
      bip21: (await this.paymentRequestUtils.encodeBip21(
        chainCurrency,
        swap.lockupAddress,
        expectedAmount,
        getSwapMemo(lightningCurrency, SwapType.Submarine),
      ))!,
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
    webHook?: WebHookData,
    extraFees?: ExtraFees,
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

    const decodedInvoice = await this.sidecar.decodeInvoiceOrOffer(invoice);
    if (decodedInvoice.type === InvoiceType.Offer) {
      throw SwapErrors.NO_OFFERS_ALLOWED();
    }

    checkPreimageHashLength(decodedInvoice.paymentHash!);

    const createdSwap = await this.createSwap({
      pairId,
      channel,
      version,
      invoice,
      webHook,
      orderSide,
      referralId,
      refundPublicKey,
      preimageHash: decodedInvoice.paymentHash!,
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
          extraFees,
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
    preimageHash?: Buffer;

    // BOLT12 invoice that can be used instead of the preimage hash and invoice amount
    invoice?: string;

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

    // Description for the invoice and magic routing hint
    description?: string;
    descriptionHash?: Buffer;

    webHook?: WebHookData;
    extraFees?: ExtraFees;

    invoiceExpiry?: number;
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

    if (args.invoice !== undefined && args.preimageHash !== undefined) {
      throw Errors.INVOICE_AND_PREIMAGE_HASH_SPECIFIED();
    }

    let preimageHash: Buffer;
    let decodedInvoice: DecodedInvoice | undefined;

    if (args.invoice !== undefined) {
      decodedInvoice = await this.sidecar.decodeInvoiceOrOffer(args.invoice);
      if (decodedInvoice.type !== InvoiceType.Bolt12Invoice) {
        throw Errors.INVOICE_NOT_BOLT12();
      }
      preimageHash = decodedInvoice.paymentHash!;

      if (
        args.invoiceAmount !== undefined ||
        args.onchainAmount !== undefined
      ) {
        throw Errors.BOLT12_INVOICE_AMOUNT_CONFLICT();
      }

      args.invoiceAmount = msatToSat(decodedInvoice.amountMsat);
    } else if (args.preimageHash !== undefined) {
      preimageHash = args.preimageHash!;
    } else {
      throw Errors.PREIMAGE_HASH_OR_INVOICE_MUST_BE_SPECIFIED();
    }

    checkPreimageHashLength(preimageHash);
    await this.checkSwapWithPreimageExists(preimageHash);

    const side = this.getOrderSide(args.orderSide);
    const referralId = await this.getReferralId(
      args.referralId,
      args.routingNode,
    );
    const {
      base,
      quote,
      referral,
      rate: pairRate,
    } = await this.getPair(
      args.pairId,
      side,
      args.version,
      SwapType.ReverseSubmarine,
      referralId,
    );

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
      referral,
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

    let extraFee: number | undefined = undefined;

    if (args.extraFees !== undefined) {
      extraFee = FeeProvider.calculateExtraFee(
        args.extraFees.percentage,
        holdInvoiceAmount,
        rate,
      );

      if (invoiceAmountDefined) {
        onchainAmount = Math.floor(onchainAmount - extraFee);
      } else {
        holdInvoiceAmount = Math.ceil(holdInvoiceAmount + extraFee);
      }
    }

    await this.verifyAmount(
      args.pairId,
      rate,
      holdInvoiceAmount,
      side,
      args.version,
      SwapType.ReverseSubmarine,
      referralId,
    );
    await this.balanceCheck.checkBalance(sendingCurrency.symbol, onchainAmount);

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
      memo: args.description,
      preimageHash: preimageHash,
      routingNode: args.routingNode,
      userAddress: args.userAddress,
      claimAddress: args.claimAddress,
      invoiceExpiry: args.invoiceExpiry,
      claimPublicKey: args.claimPublicKey,
      descriptionHash: args.descriptionHash,
      claimCovenant: args.claimCovenant || false,
      userAddressSignature: args.userAddressSignature,
      invoice:
        args.invoice !== undefined && decodedInvoice !== undefined
          ? { invoice: args.invoice, decoded: decodedInvoice }
          : undefined,
    });

    this.eventHandler.emitSwapCreation(id);

    if (args.webHook) {
      await this.addWebHook(id, args.webHook, async () => {
        await (await ReverseRoutingHintRepository.getHint(id))?.destroy();
        await (await ReverseSwapRepository.getReverseSwap({ id }))?.destroy();
      });
    }

    await this.createExtraFees(id, extraFee, args.extraFees);

    const response: any = {
      id,
      swapTree,
      referralId,
      blindingKey,
      redeemScript,
      refundAddress,
      lockupAddress,
      refundPublicKey,
      timeoutBlockHeight,
    };

    if (args.invoice === undefined) {
      response.invoice = invoice;
    }

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

    webHook?: WebHookData;
    extraFees?: ExtraFees;
  }) => {
    await this.checkSwapWithPreimageExists(args.preimageHash);

    const side = this.getOrderSide(args.orderSide);
    const referralId = await this.getReferralId(args.referralId);
    const {
      base,
      quote,
      referral,
      rate: pairRate,
    } = await this.getPair(
      args.pairId,
      side,
      SwapVersion.Taproot,
      SwapType.Chain,
      referralId,
    );

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
      sendingTimeoutBlockDelta * 1.5,
    );

    const rate = getRate(pairRate, side, true);

    const { feePercent, baseFee } = this.swapManager.renegotiator.getFees(
      args.pairId,
      side,
      referral,
    );
    let percentageFee: number;

    const isZeroAmount =
      args.userLockAmount === undefined && args.serverLockAmount === undefined;
    let userLockAmountDefined: boolean = false;

    if (
      args.userLockAmount !== undefined &&
      args.serverLockAmount !== undefined
    ) {
      throw Errors.USER_AND_SERVER_AMOUNT_SPECIFIED();
    } else if (args.userLockAmount !== undefined) {
      userLockAmountDefined = true;

      this.checkWholeNumber(args.userLockAmount);

      const calcRes = this.swapManager.renegotiator.calculateServerLockAmount(
        rate,
        args.userLockAmount,
        feePercent,
        baseFee,
      );

      percentageFee = calcRes.percentageFee;
      args.serverLockAmount = calcRes.serverLockAmount;
    } else if (args.serverLockAmount !== undefined) {
      userLockAmountDefined = false;

      this.checkWholeNumber(args.serverLockAmount);

      args.userLockAmount = (args.serverLockAmount + baseFee) / rate;
      args.userLockAmount = args.userLockAmount / (1 - feePercent);
      args.userLockAmount = Math.ceil(args.userLockAmount);

      percentageFee = Math.ceil(args.userLockAmount * rate * feePercent);
    } else if (isZeroAmount) {
      percentageFee = 0;
      args.userLockAmount = 0;
      args.serverLockAmount = 0;
    } else {
      throw Errors.NO_AMOUNT_SPECIFIED();
    }

    let extraFee: number | undefined = undefined;

    if (!isZeroAmount) {
      if (args.extraFees !== undefined) {
        extraFee = FeeProvider.calculateExtraFee(
          args.extraFees.percentage,
          args.userLockAmount,
          rate,
        );

        if (userLockAmountDefined) {
          args.serverLockAmount = Math.floor(args.serverLockAmount - extraFee);
        } else {
          args.userLockAmount = Math.ceil(args.userLockAmount + extraFee);
        }
      }

      await this.verifyAmount(
        args.pairId,
        rate,
        args.userLockAmount,
        side,
        SwapVersion.Taproot,
        SwapType.Chain,
        referralId,
      );
      if (args.serverLockAmount < 1) {
        throw Errors.ONCHAIN_AMOUNT_TOO_LOW();
      }

      await this.balanceCheck.checkBalance(
        sendingCurrency.symbol,
        args.serverLockAmount,
      );
    }

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

    if (args.webHook) {
      await this.addWebHook(res.id, args.webHook, async () => {
        await ChainSwapRepository.destroy(res.id);
      });
    }

    await this.createExtraFees(res.id, extraFee, args.extraFees);

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
   * Sends coins to a specified address
   */
  public sendCoins = (args: {
    symbol: string;
    address: string;
    amount: number;
    label: string;
    sendAll?: boolean;
    fee?: number;
  }): Promise<{
    vout?: number;
    transactionId: string;
  }> => {
    const wallet = this.walletManager.wallets.get(args.symbol);
    if (wallet === undefined) {
      throw Errors.CURRENCY_NOT_FOUND(args.symbol);
    }

    return args.sendAll
      ? wallet.sweepWallet(args.address, args.fee, args.label)
      : wallet.sendToAddress(args.address, args.amount, args.fee, args.label);
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
  private verifyAmount = async (
    pairId: string,
    rate: number,
    amount: number,
    orderSide: OrderSide,
    version: SwapVersion,
    type: SwapType,
    referralId?: string,
  ) => {
    if (
      (type === SwapType.Submarine && orderSide === OrderSide.BUY) ||
      (type !== SwapType.Submarine && orderSide === OrderSide.SELL)
    ) {
      amount = Math.floor(amount * rate);
    }

    const { limits } = await this.getPair(
      pairId,
      orderSide,
      version,
      type,
      referralId,
    );

    if (limits) {
      const minimal =
        (limits as SubmarinePairTypeTaproot['limits']).minimalBatched ||
        limits.minimal;

      if (Math.floor(amount) > limits.maximal) {
        throw Errors.EXCEED_MAXIMAL_AMOUNT(amount, limits.maximal);
      } else if (Math.ceil(amount) < minimal) {
        throw Errors.BENEATH_MINIMAL_AMOUNT(amount, minimal);
      }
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

  private addWebHook = async (
    swapId: string,
    data: WebHookData,
    // To delete the swap in case the WebHook cannot be set
    swapDeleteFn: () => Promise<void>,
  ) => {
    try {
      await this.sidecar.createWebHook(
        swapId,
        data.url,
        data.hashSwapId,
        data.status,
      );
    } catch (e) {
      await swapDeleteFn();
      throw `setting Webhook failed: ${formatError(e)}`;
    }
  };

  private createExtraFees = async (
    id: string,
    fee?: number,
    extraFees?: ExtraFees,
  ) => {
    if (extraFees !== undefined) {
      this.logger.debug(
        `Adding extra fee for swap ${id}: ${fee || '0 amount swap'} (${extraFees.percentage}%)`,
      );
      await ExtraFeeRepository.create({
        fee,
        swapId: id,
        id: extraFees.id,
        percentage: extraFees.percentage,
      });
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

  private getPair = async (
    pairId: string,
    orderSide: OrderSide,
    version: SwapVersion,
    type: SwapType,
    referralId?: string,
  ): Promise<
    { base: string; quote: string; referral: Referral | null } & SomePair
  > => {
    const { base, quote } = splitPairId(pairId);

    let pair: SomePair | undefined;
    let referral: Referral | null = null;

    switch (version) {
      case SwapVersion.Taproot: {
        const provider = this.rateProvider.providers[SwapVersion.Taproot];
        const { sending, receiving } = getSendingReceivingCurrency(
          base,
          quote,
          orderSide,
        );

        referral =
          referralId !== undefined && referralId !== null
            ? await ReferralRepository.getReferralById(referralId)
            : null;

        let pairMap: Map<string, Map<string, SomePair>> | undefined;
        switch (type) {
          case SwapType.Submarine:
            pairMap = provider.getSubmarinePairs(referral);
            break;

          case SwapType.ReverseSubmarine:
            pairMap = provider.getReversePairs(referral);
            break;

          case SwapType.Chain:
            pairMap = provider.getChainPairs(referral);
            break;
        }

        pair = pairMap?.get(receiving)?.get(sending);
        break;
      }

      default:
        pair =
          this.rateProvider.providers[SwapVersion.Legacy].pairs.get(pairId);
        break;
    }

    if (!pair) {
      throw Errors.PAIR_NOT_FOUND(pairId);
    }

    return {
      base,
      quote,
      referral,
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
export { WebHookData, Contracts, NetworkContracts, ExtraFees };
