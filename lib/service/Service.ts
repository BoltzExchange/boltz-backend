import { Op } from 'sequelize';
import { OutputType } from 'boltz-core';
import { Transaction } from 'bitcoinjs-lib';
import { TransactionReceipt } from 'web3-core';
import Errors from './Errors';
import Logger from '../Logger';
import Swap from '../db/models/Swap';
import Wallet from '../wallet/Wallet';
import { ConfigType } from '../Config';
import EventHandler from './EventHandler';
import { PairConfig } from '../consts/Types';
import FeeProvider from '../rates/FeeProvider';
import RateProvider from '../rates/RateProvider';
import PairRepository from '../db/PairRepository';
import { encodeBip21 } from './PaymentRequestUtils';
import TimeoutDeltaProvider from './TimeoutDeltaProvider';
import { OrderSide, ServiceInfo, ServiceWarning } from '../consts/Enums';
import WalletManager, { Currency } from '../wallet/WalletManager';
import SwapManager, { ChannelCreationInfo } from '../swap/SwapManager';
import {
  Balance,
  ChainInfo,
  CurrencyInfo,
  GetBalanceResponse,
  GetInfoResponse,
  LightningBalance,
  LndChannels,
  LndInfo,
  WalletBalance,
} from '../proto/boltzrpc_pb';
import {
  decodeInvoice,
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
  reverseBuffer,
  splitPairId,
} from '../Utils';

class Service {
  public allowReverseSwaps = true;

  public swapManager: SwapManager;
  public eventHandler: EventHandler;

  private readonly prepayMinerFee: boolean;

  private pairRepository: PairRepository;

  private timeoutDeltaProvider: TimeoutDeltaProvider;

  private readonly feeProvider: FeeProvider;
  private readonly rateProvider: RateProvider;

  private static MinInboundLiquidity = 10;
  private static MaxInboundLiquidity = 50;

  constructor(
    private logger: Logger,
    config: ConfigType,
    private walletManager: WalletManager,
    private currencies: Map<string, Currency>,
  ) {
    this.prepayMinerFee = config.prepayminerfee;
    this.logger.debug(`Prepay miner fee for Reverse Swaps is ${this.prepayMinerFee ? 'enabled' : 'disabled' }`);

    this.pairRepository = new PairRepository();
    this.timeoutDeltaProvider = new TimeoutDeltaProvider(this.logger, config);

    this.feeProvider = new FeeProvider(this.logger, this.getFeeEstimation);
    this.rateProvider = new RateProvider(
      this.logger,
      this.feeProvider,
      config.rates.interval,
      Array.from(currencies.values()),
    );

    this.logger.debug(`Using ${config.swapwitnessaddress ? 'P2WSH' : 'P2SH nested P2WSH'} addresses for Submarine Swaps`);

    this.swapManager = new SwapManager(
      this.logger,
      this.walletManager,
      this.rateProvider,
      config.swapwitnessaddress ? OutputType.Bech32 : OutputType.Compatibility,
      this.prepayMinerFee,
      config.retryInterval,
    );

    this.eventHandler = new EventHandler(
      this.logger,
      this.currencies,
      this.swapManager.nursery,
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
  }

  /**
   * Gets a map between the LND node keys and URIs and the symbol of the chains they are running on
   */
  public getNodes = async () => {
    const response = new Map<string, {
      nodeKey: string,
      uris: string[],
    }>();

    for (const [symbol, currency] of this.currencies) {
      if (currency.lndClient) {
        const lndInfo = await currency.lndClient.getInfo();
        response.set(symbol, {
          uris: lndInfo.urisList,
          nodeKey: lndInfo.identityPubkey,
        });
      }
    }

    return response;
  }

  // TODO: allow querying ethereum transactions?
  /**
   * Gets a hex encoded transaction from a transaction hash on the specified network
   */
  public getTransaction = async (symbol: string, transactionHash: string) => {
    const currency = this.getCurrency(symbol);
    return await currency.chainClient.getRawTransaction(transactionHash);
  }

  /**
   * Gets the hex encoded lockup transaction of a Submarine Swap, the block height
   * at which it will timeout and the expected ETA for that block
   */
  public getSwapTransaction = async (id: string) => {
    const swap = await this.swapManager.swapRepository.getSwap({
      id: {
        [Op.eq]: id,
      },
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
    const { blocks } = await currency.chainClient.getBlockchainInfo();
    const transactionHex = await currency.chainClient.getRawTransaction(swap.lockupTransactionId);

    const response: any = {
      transactionHex,
    };

    response.timeoutBlockHeight = swap.timeoutBlockHeight;

    if (blocks < swap.timeoutBlockHeight) {
      response.timeoutEta = this.calculateTimeoutDate(chainCurrency, swap.timeoutBlockHeight - blocks);
    }

    return response;
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

    try {
      return await currency.chainClient.sendRawTransaction(transactionHex);
    } catch (error) {
      // This special error is thrown when a Submarine Swap that has not timed out yet is refunded
      // To improve the UX we will throw not only the error but also some additional information
      // regarding when the Submarine Swap can be refunded
      if (error.code === -26 && error.message === 'non-mandatory-script-verify-flag (Locktime requirement not satisfied) (code 64)') {
        const refundTransaction = Transaction.fromHex(transactionHex);

        let swap: Swap | undefined;

        for (const input of refundTransaction.ins) {
          swap = await this.swapManager.swapRepository.getSwap({
            lockupTransactionId: {
              [Op.eq]: getHexString(reverseBuffer(input.hash)),
            },
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
          error: error.message,
          timeoutBlockHeight: swap.timeoutBlockHeight,
          // Here we don't need to check whether the Swap has timed out yet because
          // if the error above has been thrown, we can be sure that this is not the case
          timeoutEta: this.calculateTimeoutDate(symbol, swap.timeoutBlockHeight - blocks),
        };
      } else {
        throw error;
      }
    }
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
    refundPublicKey: Buffer,
    preimageHash: Buffer,
    channel?: ChannelCreationInfo,
  ) => {
    const swap = await this.swapManager.swapRepository.getSwap({
      preimageHash: {
        [Op.eq]: getHexString(preimageHash),
      },
    });

    if (swap) {
      throw Errors.SWAP_WITH_PREIMAGE_EXISTS();
    }

    if (channel) {
      if (channel.inboundLiquidity > Service.MaxInboundLiquidity) {
        throw Errors.EXCEEDS_MAX_INBOUND_LIQUIDITY(channel.inboundLiquidity, Service.MaxInboundLiquidity);
      }

      if (channel.inboundLiquidity < Service.MinInboundLiquidity) {
        throw Errors.BENEATH_MIN_INBOUND_LIQUIDITY(channel.inboundLiquidity, Service.MinInboundLiquidity);
      }
    }

    const { base, quote } = this.getPair(pairId);
    const side = this.getOrderSide(orderSide);

    const timeoutBlockDelta = this.timeoutDeltaProvider.getTimeout(pairId, side, false);

    const {
      id,
      address,
      redeemScript,
      timeoutBlockHeight,
    } = await this.swapManager.createSwap(
      base,
      quote,
      side,
      preimageHash,
      refundPublicKey,
      timeoutBlockDelta,
      channel,
    );

    this.eventHandler.emitSwapCreation(id);

    return {
      id,
      address,
      redeemScript,
      timeoutBlockHeight,
    };
  }

  /**
   * Gets the rates for a Submarine Swap that has coins in its lockup address but no invoice yet
   */
  public getSwapRates = async (id: string) => {
    const swap = await this.swapManager.swapRepository.getSwap({
      id: {
        [Op.eq]: id,
      },
    });

    if (!swap) {
      throw Errors.SWAP_NOT_FOUND(id);
    }

    if (!swap.onchainAmount) {
      throw Errors.SWAP_NO_LOCKUP();
    }

    const rate = getRate(swap.rate!, swap.orderSide, false);

    const percentageFee = this.feeProvider.getPercentageFee(swap.pair);
    const { baseFee } = await this.feeProvider.getFees(swap.pair, rate, swap.orderSide, swap.onchainAmount, false);

    const invoiceAmount = this.calculateInvoiceAmount(swap.orderSide, rate, swap.onchainAmount, baseFee, percentageFee);

    this.verifyAmount(swap.pair, rate, invoiceAmount, swap.orderSide, false);

    return {
      onchainAmount: swap.onchainAmount,
      submarineSwap: {
        invoiceAmount,
      },
    };
  }

  /**
   * Sets the invoice of Submarine Swap
   */
  public setSwapInvoice = async (id: string, invoice: string) => {
    const swap = await this.swapManager.swapRepository.getSwap({
      id: {
        [Op.eq]: id,
      },
    });

    if (!swap) {
      throw Errors.SWAP_NOT_FOUND(id);
    }

    if (swap.invoice) {
      throw Errors.SWAP_HAS_INVOICE_ALREADY(id);
    }

    const { base, quote, rate: pairRate } = this.getPair(swap.pair);

    const chainCurrency = getChainCurrency(base, quote, swap.orderSide, false);
    const lightningCurrency = getLightningCurrency(base, quote, swap.orderSide, false);

    const invoiceAmount = decodeInvoice(invoice).satoshis!;
    const rate = swap.rate || getRate(pairRate, swap.orderSide, false);

    this.verifyAmount(swap.pair, rate, invoiceAmount, swap.orderSide, false);

    const { baseFee, percentageFee } = await this.feeProvider.getFees(swap.pair, rate, swap.orderSide, invoiceAmount, false);
    const expectedAmount = Math.floor(invoiceAmount * rate) + baseFee + percentageFee;

    if (swap.onchainAmount && expectedAmount > swap.onchainAmount) {
      const maxInvoiceAmount = this.calculateInvoiceAmount(
        swap.orderSide,
        rate,
        swap.onchainAmount,
        baseFee,
        this.feeProvider.getPercentageFee(swap.pair),
      );

      throw Errors.INVALID_INVOICE_AMOUNT(maxInvoiceAmount);
    }

    const acceptZeroConf = this.rateProvider.acceptZeroConf(chainCurrency, expectedAmount);

    await this.swapManager.setSwapInvoice(
      swap,
      invoice,
      expectedAmount,
      percentageFee,
      acceptZeroConf,
      this.eventHandler.emitSwapInvoiceSet,
    );

    // The expected amount doesn't have to be returned if the onchain coins were sent already
    if (swap.lockupTransactionId) {
      return {};
    }

    return {
      expectedAmount,
      acceptZeroConf,
      bip21: encodeBip21(
        chainCurrency,
        swap.lockupAddress,
        expectedAmount,
        getSwapMemo(lightningCurrency, false),
      ),
    };
  }

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
    channel?: ChannelCreationInfo,
  ) => {
    let swap = await this.swapManager.swapRepository.getSwap({
      invoice: {
        [Op.eq]: invoice,
      },
    });

    if (swap) {
      throw Errors.SWAP_WITH_INVOICE_EXISTS();
    }

    const preimageHash = getHexBuffer(decodeInvoice(invoice).paymentHash!);

    const {
      id,
      address,
      redeemScript,
      timeoutBlockHeight,
    } = await this.createSwap(pairId, orderSide, refundPublicKey, preimageHash, channel);

    try {
      const {
        bip21,
        acceptZeroConf,
        expectedAmount,
      } = await this.setSwapInvoice(id, invoice);

      return {
        id,
        bip21,
        address,
        redeemScript,
        acceptZeroConf,
        expectedAmount,
        timeoutBlockHeight,
      };
    } catch (error) {
      const channelCreation = await this.swapManager.channelCreationRepository.getChannelCreation({
        swapId: {
          [Op.eq]: id,
        },
      });
      await channelCreation?.destroy();

      swap = await this.swapManager.swapRepository.getSwap({
        id: {
          [Op.eq]: id,
        },
      });
      await swap?.destroy();

      throw error;
    }
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

    const side = this.getOrderSide(orderSide);
    const { base, quote, rate: pairRate } = this.getPair(pairId);
    const { sending, receiving } = getSendingReceivingCurrency(base, quote, side);

    const rate = getRate(pairRate, side, true);
    const onchainTimeoutBlockDelta = this.timeoutDeltaProvider.getTimeout(pairId, side, true);
    const lightningTimeoutBlockDelta = TimeoutDeltaProvider.convertBlocks(sending, receiving, onchainTimeoutBlockDelta + 3);

    this.verifyAmount(pairId, rate, invoiceAmount, side, true);

    const { baseFee, percentageFee } = await this.feeProvider.getFees(pairId, rate, side, invoiceAmount, true);

    const onchainAmount = Math.floor(invoiceAmount * rate) - (baseFee + percentageFee);

    let holdInvoiceAmount = invoiceAmount;
    let prepayMinerFeeAmount: number | undefined = undefined;

    if (this.prepayMinerFee) {
      // TODO: double check this (divide by rate or multiply by rate)
      prepayMinerFeeAmount = Math.ceil(baseFee / rate);
      holdInvoiceAmount -= prepayMinerFeeAmount;
    }

    if (onchainAmount < 1) {
      throw Errors.ONCHAIN_AMOUNT_TOO_LOW();
    }

    const {
      id,
      invoice,
      redeemScript,
      lockupAddress,
      minerFeeInvoice,
      timeoutBlockHeight,
    } = await this.swapManager.createReverseSwap(
      base,
      quote,
      side,
      preimageHash,
      holdInvoiceAmount,
      onchainAmount,
      claimPublicKey,
      onchainTimeoutBlockDelta,
      lightningTimeoutBlockDelta,
      percentageFee,
      prepayMinerFeeAmount,
    );

    this.eventHandler.emitSwapCreation(id);

    const response: any = {
      id,
      invoice,
      redeemScript,
      lockupAddress,
      onchainAmount,
      timeoutBlockHeight,
    };

    if (this.prepayMinerFee) {
      response.minerFeeInvoice = minerFeeInvoice;
    }

    return response;
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
          const receipt = (await promise) as TransactionReceipt;

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
   * Verifies that the requested amount is neither above the maximal nor beneath the minimal
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

  /**
   * Calculates the amount of an invoice for a Submarine Swap
   */
  private calculateInvoiceAmount = (orderSide: number, rate: number, onchainAmount: number, baseFee: number, percentageFee: number) => {
    if (orderSide === OrderSide.BUY) {
      // tslint:disable-next-line:no-parameter-reassignment
      rate = 1 / rate;
    }

    return Math.floor(
      ((onchainAmount - baseFee) * rate) / (1 + (percentageFee / 100)),
    );
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

  private calculateTimeoutDate = (chain: string, blocksMissing: number) => {
    return getUnixTime() + (blocksMissing * TimeoutDeltaProvider.blockTimes.get(chain)! * 60);
  }
}

export default Service;
