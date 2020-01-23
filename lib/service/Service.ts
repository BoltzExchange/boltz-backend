import { OutputType } from 'boltz-core';
import Errors from './Errors';
import Logger from '../Logger';
import Wallet from '../wallet/Wallet';
import { ConfigType } from '../Config';
import EventHandler from './EventHandler';
import { PairConfig } from '../consts/Types';
import SwapManager from '../swap/SwapManager';
import SwapRepository from './SwapRepository';
import PairRepository from './PairRepository';
import FeeProvider from '../rates/FeeProvider';
import RateProvider from '../rates/RateProvider';
import { encodeBip21 } from './PaymentRequestUtils';
import TimeoutDeltaProvider from './TimeoutDeltaProvider';
import ReverseSwapRepository from './ReverseSwapRepository';
import { OrderSide, ServiceWarning, SwapUpdateEvent } from '../consts/Enums';
import WalletManager, { Currency } from '../wallet/WalletManager';
import {
  getRate,
  getPairId,
  generateId,
  splitPairId,
  getChainCurrency,
  getLightningCurrency,
  getSwapMemo,
  getVersion,
  getInvoiceAmt,
} from '../Utils';
import {
  Balance,
  LndInfo,
  ChainInfo,
  LndChannels,
  CurrencyInfo,
  WalletBalance,
  GetInfoResponse,
  LightningBalance,
  GetBalanceResponse,
} from '../proto/boltzrpc_pb';

class Service {
  public allowReverseSwaps = true;

  public eventHandler: EventHandler;

  public swapRepository: SwapRepository;
  public reverseSwapRepository: ReverseSwapRepository;

  private pairRepository: PairRepository;

  private timeoutDeltaProvider: TimeoutDeltaProvider;

  private feeProvider: FeeProvider;
  private rateProvider: RateProvider;

  constructor(
    private logger: Logger,
    config: ConfigType,
    private swapManager: SwapManager,
    private walletManager: WalletManager,
    private currencies: Map<string, Currency>,
    rateUpdateInterval: number,
  ) {
    this.pairRepository = new PairRepository();

    this.swapRepository = new SwapRepository();
    this.reverseSwapRepository = new ReverseSwapRepository();

    this.timeoutDeltaProvider = new TimeoutDeltaProvider(this.logger, config);

    this.feeProvider = new FeeProvider(this.logger, this.getFeeEstimation);
    this.rateProvider = new RateProvider(
      this.logger,
      this.feeProvider,
      rateUpdateInterval,
      Array.from(currencies.values()),
    );

    this.eventHandler = new EventHandler(
      this.logger,
      this.currencies,
      this.swapManager.nursery,
      this.swapRepository,
      this.reverseSwapRepository,
    );
  }

  public init = async (configPairs: PairConfig[]) => {
    const dbPairSet = new Set<string>();
    const dbPairs = await this.pairRepository.getPairs();

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
        await this.pairRepository.addPair({
          id,
          ...configPair,
        });
        this.logger.silly(`Added pair to database: ${id}`);
      }
    }

    this.logger.verbose('Updated pairs in the database');

    this.timeoutDeltaProvider.init(configPairs);

    this.feeProvider.init(configPairs);
    await this.rateProvider.init(configPairs);
  }

  /**
   * Gets general information about this Boltz instance and the nodes it is connected to
   */
  public getInfo = async () => {
    const response = new GetInfoResponse();
    const map = response.getChainsMap();

    response.setVersion(getVersion());

    for (const [, currency] of this.currencies) {
      const chain = new ChainInfo();
      const lnd = new LndInfo();

      try {
        const networkInfo = await currency.chainClient.getNetworkInfo();
        const blockchainInfo = await currency.chainClient.getBlockchainInfo();

        chain.setVersion(networkInfo.version);
        chain.setConnections(networkInfo.connections);

        chain.setBlocks(blockchainInfo.blocks);
        chain.setScannedBlocks(blockchainInfo.scannedBlocks);
      } catch (error) {
        chain.setError(error);
      }

      if (currency.lndClient) {
        try {
          const lndInfo = await currency.lndClient.getInfo();

          const channels = new LndChannels();

          channels.setActive(lndInfo.numActiveChannels);
          channels.setInactive(lndInfo.numInactiveChannels);
          channels.setPending(lndInfo.numPendingChannels);

          lnd.setLndChannels(channels);

          lnd.setVersion(lndInfo.version);
          lnd.setBlockHeight(lndInfo.blockHeight);
        } catch (error) {
          lnd.setError(error.details);
        }
      }

      const currencyInfo = new CurrencyInfo();
      currencyInfo.setChain(chain);
      currencyInfo.setLnd(lnd);

      map.set(currency.symbol, currencyInfo);
    }

    return response;
  }

  /**
   * Gets the balance for either all wallets or just a single one if specified
   */
  public getBalance = async () => {
    const response = new GetBalanceResponse();
    const map = response.getBalancesMap();

    const getBalance = async (symbol: string, wallet: Wallet) => {
      const balance = new Balance();
      const walletObject = new WalletBalance();

      const walletBalance = await wallet.getBalance();

      walletObject.setTotalBalance(walletBalance.totalBalance);
      walletObject.setConfirmedBalance(walletBalance.confirmedBalance);
      walletObject.setUnconfirmedBalance(walletBalance.unconfirmedBalance);

      balance.setWalletBalance(walletObject);

      const currencyInfo = this.currencies.get(symbol);

      if (currencyInfo && currencyInfo.lndClient) {
        const lightningBalance = new LightningBalance();

        const { channelsList } = await currencyInfo.lndClient.listChannels();

        let localBalance = 0;
        let remoteBalance = 0;

        channelsList.forEach((channel) => {
          localBalance += channel.localBalance;
          remoteBalance += channel.remoteBalance;
        });

        lightningBalance.setLocalBalance(localBalance);
        lightningBalance.setRemoteBalance(remoteBalance);

        balance.setLightningBalance(lightningBalance);
      }

      return balance;
    };

    const addEthereumBalanceToMap = (symbol: string, balance: number) => {
      const balanceObject = new Balance();
      const walletObject = new WalletBalance();

      const balanceNumber = Number(balance);

      walletObject.setTotalBalance(balanceNumber);
      walletObject.setConfirmedBalance(balanceNumber);

      balanceObject.setWalletBalance(walletObject);

      map.set(symbol, balanceObject);
    };

    for (const [symbol, wallet] of this.walletManager.wallets) {
      map.set(symbol, await getBalance(symbol, wallet));
    }

    if (this.walletManager.ethereumWallet) {
      const ethereumBalances = await this.walletManager.ethereumWallet.getBalance();

      addEthereumBalanceToMap('ETH', ethereumBalances.ether);

      ethereumBalances.tokens.forEach((balance, symbol) => {
        addEthereumBalanceToMap(symbol, balance);
      });
    }

    return response;
  }

  /**
   * Gets all supported pairs and their conversion rates
   */
  public getPairs = () => {
    const warnings: ServiceWarning[] = [];

    if (!this.allowReverseSwaps) {
      warnings.push(ServiceWarning.ReverseSwapsDisabled);
    }

    return {
      warnings,
      pairs: this.rateProvider.pairs,
    };
  }

  // TODO: allow querying ethereum transactions?
  /**
   * Gets a hex encoded transaction from a transaction hash on the specified network
   */
  public getTransaction = async (symbol: string, transactionHash: string) => {
    const currency = this.getCurrency(symbol);
    const transaction = await currency.chainClient.getRawTransaction(transactionHash);

    return transaction;
  }

  /**
   * Gets an address of a specified wallet
   */
  public getAddress = async (symbol: string) => {
    const wallet = this.walletManager.wallets.get(symbol);

    if (wallet !== undefined) {
      return wallet.newAddress();
    } else if (this.walletManager.ethereumWallet !== undefined) {
      if (symbol === 'ETH' || this.walletManager.ethereumWallet.supportsToken(symbol)) {
        return this.walletManager.ethereumWallet.address;
      }
    }

    throw Errors.CURRENCY_NOT_FOUND(symbol);
  }

  /**
   * Gets a fee estimation in satoshis per vbyte for either all currencies or just a single one if specified
   */
  public getFeeEstimation = async (symbol?: string, blocks?: number) => {
    const map = new Map<string, number>();

    const numBlocks = blocks === undefined ? 2 : blocks;

    if (symbol !== undefined) {
      const currency = this.getCurrency(symbol);

      map.set(symbol, await currency.chainClient.estimateFee(numBlocks));
    } else {
      for (const [symbol, currency] of this.currencies) {
        map.set(symbol, await currency.chainClient.estimateFee(numBlocks));
      }
    }

    return map;
  }

  /**
   * Broadcast a hex encoded transaction on the specified network
   */
  public broadcastTransaction = async (symbol: string, transactionHex: string) => {
    const currency = this.getCurrency(symbol);

    return currency.chainClient.sendRawTransaction(transactionHex);
  }

  /**
   * Updates the timeout block delta of a pair
   */
  public updateTimeoutBlockDelta = (pairId: string, newDelta: number) => {
    this.timeoutDeltaProvider.setTimeout(pairId, newDelta);

    this.logger.info(`Updated timeout block delta of ${pairId} to ${newDelta} minutes`);
  }

  /**
   * Creates a new Swap from the chain to Lightning
   */
  public createSwap = async (
    pairId: string,
    orderSide: string,
    invoice: string,
    refundPublicKey: Buffer,
  ) => {
    const swap = await this.swapRepository.getSwapByInvoice(invoice);

    if (swap) {
      throw Errors.SWAP_WITH_INVOICE_EXISTS();
    }

    const { base, quote, rate: pairRate } = this.getPair(pairId);
    const side = this.getOrderSide(orderSide);

    const chainCurrency = getChainCurrency(base, quote, side, false);
    const lightningCurrency = getLightningCurrency(base, quote, side, false);

    const timeoutBlockDelta = this.timeoutDeltaProvider.getTimeout(pairId, side, false);

    const invoiceAmount = getInvoiceAmt(invoice);
    const rate = getRate(pairRate, side, false);

    this.verifyAmount(pairId, rate, invoiceAmount, side, false);

    const { baseFee, percentageFee } = await this.feeProvider.getFees(pairId, rate, side, invoiceAmount, false);
    const expectedAmount = Math.ceil(invoiceAmount * rate) + baseFee + percentageFee;

    const acceptZeroConf = this.rateProvider.acceptZeroConf(chainCurrency, expectedAmount);

    const {
      address,
      keyIndex,
      redeemScript,
      timeoutBlockHeight,
    } = await this.swapManager.createSwap(
      base,
      quote,
      side,
      invoice,
      expectedAmount,
      refundPublicKey,
      this.getSwapOutputType(false),
      timeoutBlockDelta,
      acceptZeroConf,
    );

    const id = generateId();

    await this.swapRepository.addSwap({
      id,
      invoice,
      keyIndex,
      redeemScript,
      acceptZeroConf,
      timeoutBlockHeight,
      pair: pairId,
      orderSide: side,
      fee: percentageFee,
      lockupAddress: address,
      status: SwapUpdateEvent.SwapCreated,
    });

    this.eventHandler.emitSwapCreation(id);

    return {
      id,
      address,
      redeemScript,
      expectedAmount,
      acceptZeroConf,
      timeoutBlockHeight,
      bip21: encodeBip21(
        chainCurrency,
        address,
        expectedAmount,
        getSwapMemo(lightningCurrency, false),
      ),
    };
  }

  /**
   * Creates a new Swap from Lightning to the chain
   */
  public createReverseSwap = async (
    pairId: string,
    orderSide: string,
    preimageHash: Buffer,
    invoiceAmount: number,
    claimPublicKey: Buffer,
  ) => {
    if (!this.allowReverseSwaps) {
      throw Errors.REVERSE_SWAPS_DISABLED();
    }

    const { base, quote, rate: pairRate } = this.getPair(pairId);

    const side = this.getOrderSide(orderSide);
    const rate = getRate(pairRate, side, true);
    const timeoutBlockDelta = this.timeoutDeltaProvider.getTimeout(pairId, side, true);

    this.verifyAmount(pairId, rate, invoiceAmount, side, true);

    const { baseFee, percentageFee } = await this.feeProvider.getFees(pairId, rate, side, invoiceAmount, true);

    const onchainAmount = Math.floor(invoiceAmount * rate) - (baseFee + percentageFee);

    if (onchainAmount < 1) {
      throw Errors.ONCHAIN_AMOUNT_TOO_LOW();
    }

    const {
      invoice,
      keyIndex,
      redeemScript,
      lockupAddress,
      timeoutBlockHeight,
    } = await this.swapManager.createReverseSwap(
      base,
      quote,
      side,
      preimageHash,
      invoiceAmount,
      onchainAmount,
      claimPublicKey,
      this.getSwapOutputType(
        true,
      ),
      timeoutBlockDelta,
    );

    const id = generateId();

    await this.reverseSwapRepository.addReverseSwap({
      id,
      invoice,
      keyIndex,
      redeemScript,
      onchainAmount,
      timeoutBlockHeight,
      pair: pairId,
      orderSide: side,
      fee: percentageFee,
      status: SwapUpdateEvent.SwapCreated,
    });

    this.eventHandler.emitSwapCreation(id);

    return {
      id,
      invoice,
      redeemScript,
      lockupAddress,
      onchainAmount,
      timeoutBlockHeight,
    };
  }

  /**
   * Pays a lightning invoice
   */
  public payInvoice = async (symbol: string, invoice: string) => {
    const { lndClient } = this.getCurrency(symbol);

    if (!lndClient) {
      throw Errors.NO_LND_CLIENT(symbol);
    }

    return lndClient.sendPayment(invoice);
  }

  /**
   * Sends coins to a specified address
   */
  public sendCoins = async (args: {
    symbol: string,
    address: string,
    amount: number,
    sendAll?: boolean,
    fee?: number,
  }) => {
    const {
      fee,
      amount,
      symbol,
      sendAll,
      address,
     } = args;

    const wallet = this.walletManager.wallets.get(symbol);

    if (wallet !== undefined) {
      const sendingPromise = sendAll ? wallet.sweepWallet(address, fee) : wallet.sendToAddress(address, amount, fee);

      const { transaction, vout } = await sendingPromise;

      return {
        vout,
        transactionId: transaction.getId(),
      };
    } else {
      const etherWallet = this.walletManager.ethereumWallet;

      if (etherWallet !== undefined) {
        if (symbol === 'ETH') {
          const promise = sendAll ? etherWallet.sweepEther(address, fee) : etherWallet.sendEther(address, amount, fee);
          const receipt = await promise;

          return {
            vout: 0,
            transactionId: receipt.transactionHash,
          };
        } else if (etherWallet.supportsToken(symbol)) {
          const promise = sendAll ? etherWallet.sweepToken(symbol, address, fee) : etherWallet.sendToken(symbol, address, amount, fee);
          const receipt = await promise;

          return {
            vout: 0,
            transactionId: receipt.transactionHash,
          };
        }
      }
    }

    throw Errors.CURRENCY_NOT_FOUND(symbol);
  }

  /**
   * Verfies that the requested amount is neither above the maximal nor beneath the minimal
   */
  private verifyAmount = (pairId: string, rate: number, amount: number, orderSide: OrderSide, isReverse: boolean) => {
    if (
        (!isReverse && orderSide === OrderSide.BUY) ||
        (isReverse && orderSide === OrderSide.SELL)
      ) {
      // tslint:disable-next-line:no-parameter-reassignment
      amount = Math.floor(amount * rate);
    }

    const { limits } = this.getPair(pairId);

    if (limits) {
      if (Math.floor(amount) > limits.maximal) throw Errors.EXCEED_MAXIMAL_AMOUNT(amount, limits.maximal);
      if (Math.ceil(amount) < limits.minimal) throw Errors.BENEATH_MINIMAL_AMOUNT(amount, limits.minimal);
    } else {
      throw Errors.PAIR_NOT_FOUND(pairId);
    }
  }

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
  }

  private getCurrency = (symbol: string) => {
    const currency = this.currencies.get(symbol);

    if (!currency) {
      throw Errors.CURRENCY_NOT_FOUND(symbol);
    }

    return currency;
  }

  private getOrderSide = (side: string) => {
    switch (side.toLowerCase()) {
      case 'buy': return OrderSide.BUY;
      case 'sell': return OrderSide.SELL;

      default: throw Errors.ORDER_SIDE_NOT_FOUND(side);
    }
  }

  private getSwapOutputType = (isReverse: boolean): OutputType => {
    return isReverse ? OutputType.Bech32 : OutputType.Compatibility;
  }
}

export default Service;
