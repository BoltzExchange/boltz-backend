import { address } from 'bitcoinjs-lib';
import { SwapUtils, OutputType } from 'boltz-core';
import { Output } from 'boltz-core/dist/FeeCalculator';
import Errors from './Errors';
import Logger from '../Logger';
import Wallet from '../wallet/Wallet';
import EventHandler from './EventHandler';
import { PairConfig } from '../consts/Types';
import SwapManager from '../swap/SwapManager';
import SwapRepository from './SwapRepository';
import PairRepository from './PairRepository';
import FeeProvider from '../rates/FeeProvider';
import RateProvider from '../rates/RateProvider';
import { encodeBip21 } from './PaymentRequestUtils';
import ReverseSwapRepository from './ReverseSwapRepository';
import { OrderSide, ServiceWarning } from '../consts/Enums';
import WalletManager, { Currency } from '../wallet/WalletManager';
import {
  getRate,
  getPairId,
  generateId,
  splitPairId,
  getOutputType,
  getInvoiceAmt,
  getChainCurrency,
  getLightningCurrency,
} from '../Utils';
import {
  Balance,
  LndInfo,
  ChainInfo,
  LndChannels,
  CurrencyInfo,
  WalletBalance,
  ChannelBalance,
  GetInfoResponse,
  LightningBalance,
  GetBalanceResponse,
} from '../proto/boltzrpc_pb';

const packageJson = require('../../package.json');

class Service {
  public allowReverseSwaps = true;

  public eventHandler: EventHandler;

  public swapRepository: SwapRepository;
  public reverseSwapRepository: ReverseSwapRepository;

  private feeProvider: FeeProvider;
  private rateProvider: RateProvider;

  private pairRepository: PairRepository;

  constructor(
    private logger: Logger,
    private swapManager: SwapManager,
    private walletManager: WalletManager,
    private currencies: Map<string, Currency>,
    rateUpdateInterval: number,
  ) {
    this.pairRepository = new PairRepository();

    this.swapRepository = new SwapRepository();
    this.reverseSwapRepository = new ReverseSwapRepository();

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

    this.feeProvider.init(configPairs);
    await this.rateProvider.init(configPairs);
  }

  /**
   * Gets general information about this Boltz instance and the nodes it is connected to
   */
  public getInfo = async () => {
    const response = new GetInfoResponse();
    const map = response.getChainsMap();

    response.setVersion(packageJson.version);

    for (const [, currency] of this.currencies) {
      const chain = new ChainInfo();
      const lnd = new LndInfo();

      try {
        const networkInfo = await currency.chainClient.getNetworkInfo();
        const blockchainInfo = await currency.chainClient.getBlockchainInfo();

        chain.setVersion(networkInfo.version);
        chain.setConnections(networkInfo.connections);

        chain.setBlocks(blockchainInfo.blocks);
      } catch (error) {
        chain.setError(error);
      }

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
  public getBalance = async (symbol?: string) => {
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

      if (currencyInfo) {
        const lightningBalance = new LightningBalance();

        const channelBalance = new ChannelBalance();
        const lightningWalletBalance = new WalletBalance();

        const { channelsList } = await currencyInfo.lndClient.listChannels();
        const { totalBalance, confirmedBalance, unconfirmedBalance } = await currencyInfo.lndClient.getWalletBalance();

        let localBalance = 0;
        let remoteBalance = 0;

        channelsList.forEach((channel) => {
          localBalance += channel.localBalance;
          remoteBalance += channel.remoteBalance;
        });

        lightningWalletBalance.setTotalBalance(totalBalance);
        lightningWalletBalance.setConfirmedBalance(confirmedBalance);
        lightningWalletBalance.setUnconfirmedBalance(unconfirmedBalance);

        channelBalance.setLocalBalance(localBalance);
        channelBalance.setRemoteBalance(remoteBalance);

        lightningBalance.setWalletBalance(lightningWalletBalance);
        lightningBalance.setChannelBalance(channelBalance);

        balance.setLightningBalance(lightningBalance);
      }

      return balance;
    };

    if (symbol) {
      const wallet = this.walletManager.wallets.get(symbol);

      if (!wallet) {
        throw Errors.CURRENCY_NOT_FOUND(symbol);
      }

      map.set(symbol, await getBalance(symbol, wallet));
    } else {
      for (const [symbol, wallet] of this.walletManager.wallets) {
        map.set(symbol, await getBalance(symbol, wallet));
      }
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

  /**
   * Gets a hex encoded transaction from a transaction hash on the specified network
   */
  public getTransaction = async (symbol: string, transactionHash: string) => {
    const currency = this.getCurrency(symbol);
    const transaction = await currency.chainClient.getRawTransaction(transactionHash);

    return transaction;
  }

  /**
   * Gets a new address of a specified wallet. The "type" parameter is optional and defaults to "OutputType.LEGACY"
   */
  public newAddress = async (symbol: string, type?: number) => {
    const wallet = this.walletManager.wallets.get(symbol);

    if (!wallet) {
      throw Errors.CURRENCY_NOT_FOUND(symbol);
    }

    return wallet.getNewAddress(getOutputType(type));
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
   * Creates a new Swap from the chain to Lightning
   */
  public createSwap = async (
    pairId: string,
    orderSide: string,
    invoice: string,
    refundPublicKey: Buffer,
  ) => {
    const swap = await this.swapRepository.getSwapByInvoice(invoice);

    if (swap !== undefined) {
      throw Errors.SWAP_WITH_INVOICE_EXISTS();
    }

    const { base, quote, rate: pairRate } = this.getPair(pairId);
    const side = this.getOrderSide(orderSide);

    const chainCurrency = getChainCurrency(base, quote, side, false);
    const lightningCurrency = getLightningCurrency(base, quote, side, false);

    const { timeoutBlockDelta } = this.getChainConfig(chainCurrency);
    const invoiceAmount = getInvoiceAmt(invoice);

    const rate = getRate(pairRate, side, false);

    this.verifyAmount(pairId, rate, invoiceAmount, side);

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
      OutputType.Compatibility,
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
      pair: pairId,
      orderSide: side,
      fee: percentageFee,
      lockupAddress: address,
    });

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
        `Submarine Swap to ${lightningCurrency}`,
      ),
    };
  }

  /**
   * Creates a new Swap from Lightning to the chain
   */
  public createReverseSwap = async (
    pairId: string,
    orderSide: string,
    invoiceAmount: number,
    claimPublicKey: Buffer,
  ) => {
    if (!this.allowReverseSwaps) {
      throw Errors.REVERSE_SWAPS_DISABLED();
    }

    const { base, quote, rate: pairRate } = this.getPair(pairId);

    const side = this.getOrderSide(orderSide);
    const chainCurrency = getChainCurrency(base, quote, side, true);

    const { timeoutBlockDelta } = this.getChainConfig(chainCurrency);

    const rate = getRate(pairRate, side, true);

    this.verifyAmount(pairId, rate, invoiceAmount, side);

    const { baseFee, percentageFee } = await this.feeProvider.getFees(pairId, rate, side, invoiceAmount, true);

    const onchainAmount = Math.floor(invoiceAmount * rate) - (baseFee + percentageFee);

    if (onchainAmount < 1) {
      throw Errors.ONCHAIN_AMOUNT_TOO_LOW();
    }

    const {
      invoice,
      minerFee,
      keyIndex,
      redeemScript,
      lockupTransaction,
      lockupTransactionId,
    } = await this.swapManager.createReverseSwap(
      base,
      quote,
      side,
      invoiceAmount,
      onchainAmount,
      claimPublicKey,
      timeoutBlockDelta,
    );

    const id = generateId();

    await this.reverseSwapRepository.addReverseSwap({
      id,
      invoice,
      minerFee,
      keyIndex,
      redeemScript,
      onchainAmount,
      pair: pairId,
      orderSide: side,
      fee: percentageFee,
      transactionId: lockupTransactionId,
    });

    return {
      id,
      invoice,
      redeemScript,
      lockupTransaction,
      lockupTransactionId,
    };
  }

  /**
   * Sends coins to a specified address
   */
  public sendCoins = async (args: {
    symbol: string,
    address: string,
    amount: number,
    sendAll?: boolean,
    satPerVbyte?: number,
  }) => {
    const currency = this.getCurrency(args.symbol);
    const wallet = this.walletManager.wallets.get(args.symbol);

    if (wallet === undefined) {
      throw Errors.CURRENCY_NOT_FOUND(args.symbol);
    }

    const fee = args.satPerVbyte === 0 || args.satPerVbyte === undefined ? await currency.chainClient.estimateFee() : args.satPerVbyte;

    let output: Output | undefined = undefined;

    try {
      output = SwapUtils.getOutputScriptType(address.toOutputScript(args.address, currency.network));
    } catch (error) {}

    if (output === undefined) {
      throw Errors.SCRIPT_TYPE_NOT_FOUND(args.address);
    }

    const { transaction, vout } = await wallet.sendToAddress(args.address, output.type, output.isSh!, args.amount, fee, args.sendAll);
    await currency.chainClient.sendRawTransaction(transaction.toHex());

    return {
      vout,
      transactionId: transaction.getId(),
    };
  }

  /**
   * Verfies that the requested amount is neither above the maximal nor beneath the minimal
   */
  private verifyAmount = (pairId: string, rate: number, amount: number, orderSide: OrderSide) => {
    if (orderSide === OrderSide.SELL) {
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

  private getChainConfig = (symbol: string) => {
    const currency = this.getCurrency(symbol);

    return currency.config;
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
}

export default Service;
