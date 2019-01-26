import { EventEmitter } from 'events';
import { Transaction, address } from 'bitcoinjs-lib';
import Errors from './Errors';
import Logger from '../Logger';
import Wallet from '../wallet/Wallet';
import SwapManager from '../swap/SwapManager';
import { Info as LndInfo } from '../lightning/LndClient';
import { Info as ChainInfo } from '../chain/ChainClientInterface';
import WalletManager, { Currency } from '../wallet/WalletManager';
import { getHexBuffer, getOutputType, getHexString } from '../Utils';
import { OrderSide, Balance, WalletBalance, GetBalanceResponse } from '../proto/boltzrpc_pb';

const packageJson = require('../../package.json');

type ServiceComponents = {
  logger: Logger;
  currencies: Map<string, Currency>;
  walletManager: WalletManager;
  swapManager: SwapManager;
};

type CurrencyInfo = {
  symbol: string;
  chainInfo: ChainInfo;
  lndInfo: LndInfo;
};

type BoltzInfo = {
  version: string;
  currencies: CurrencyInfo[];
};

interface Service {
  on(event: 'transaction.confirmed', listener: (transactionHash: string, outputAddress: string) => void): this;
  emit(event: 'transaction.confirmed', transactionHash: string, outputAddress: string): boolean;

  on(even: 'invoice.paid', listener: (invoice: string) => void): this;
  emit(event: 'invoice.paid', invoice: string): boolean;

  on(event: 'invoice.settled', listener: (invoice: string, preimage: string) => void): this;
  emit(event: 'invoice.settled', string: string, preimage: string): boolean;
}

class Service extends EventEmitter {
  // A map between the hex strings of the scripts of the addresses and the addresses to which Boltz should listen to
  private listenScriptsSet = new Map<string, string>();

  constructor(private serviceComponents: ServiceComponents) {
    super();

    this.subscribeTransactions();
    this.subscribeInvoices();
  }

  /**
   * Gets general information about this Boltz instance and the nodes it is connected to
   */
  public getInfo = async (): Promise<BoltzInfo> => {
    const currencyInfos: CurrencyInfo[] = [];

    for (const [, currency] of this.serviceComponents.currencies) {
      const chainInfo = await currency.chainClient.getInfo();
      const lndInfo = await currency.lndClient.getLndInfo();

      currencyInfos.push({
        chainInfo,
        lndInfo,
        symbol: currency.symbol,
      });
    }

    return {
      version: packageJson.version,
      currencies: currencyInfos,
    };
  }

  /**
   * Gets the balance for either all wallets or just a single one if specified
   */
  public getBalance = async (args: { currency: string }) => {
    const { walletManager } = this.serviceComponents;

    const response = new GetBalanceResponse();
    const map = response.getBalancesMap();

    const getBalance = async (wallet: Wallet, symbol: string) => {
      const balance = new Balance();
      const walletObject = new WalletBalance();

      const walletBalance = await wallet.getBalance();

      walletObject.setTotalBalance(walletBalance.totalBalance);
      walletObject.setConfirmedBalance(walletBalance.confirmedBalance);
      walletObject.setUnconfirmedBalance(walletBalance.unconfirmedBalance);

      balance.setWalletBalance(walletObject);

      const currencyInfo = this.serviceComponents.currencies.get(symbol)!;
      const channelBalance = await currencyInfo.lndClient.channelBalance();

      balance.setChannelBalance(channelBalance.balance);

      return balance;
    };

    if (args.currency !== '') {
      const wallet = walletManager.wallets.get(args.currency);

      if (!wallet) {
        throw Errors.CURRENCY_NOT_FOUND(args.currency);
      }

      map.set(args.currency, await getBalance(wallet, args.currency));
    } else {
      for (const entry of walletManager.wallets) {
        const currency = entry[0];
        const wallet = entry[1];

        map.set(currency, await getBalance(wallet, currency));
      }
    }

    return response;
  }

  /**
   * Gets a new address of a specified wallet. The "type" parameter is optional and defaults to "OutputType.LEGACY"
   */
  public newAddress = async (args: { currency: string, type: number }) => {
    const { walletManager } = this.serviceComponents;

    const wallet = walletManager.wallets.get(args.currency);

    if (!wallet) {
      throw Errors.CURRENCY_NOT_FOUND(args.currency);
    }

    return wallet.getNewAddress(getOutputType(args.type));
  }

  /**
   * Gets a hex encoded transaction from a transaction hash on the specified network
   */
  public getTransaction = async (args: { currency: string, transactionHash: string }) => {
    const currency = this.getCurrency(args.currency);

    return currency.chainClient.getRawTransaction(args.transactionHash);
  }

  /**
   * Broadcast a hex encoded transaction on the specified network
   */
  public broadcastTransaction = async (args: { currency: string, transactionHex: string }) => {
    const currency = this.getCurrency(args.currency);

    return currency.chainClient.sendRawTransaction(args.transactionHex);
  }

  /**
   * Adds an entry to the list of addresses SubscribeTransactions listens to
   */
  public listenOnAddress = async (args: { currency: string, address: string }) => {
    const currency = this.getCurrency(args.currency);

    const script = address.toOutputScript(args.address, currency.network);

    this.listenScriptsSet.set(getHexString(script), args.address);
    await currency.chainClient.loadTxFiler(false, [args.address], []);
  }

  /**
   * Creates a new Swap from the chain to Lightning
   */
  public createSwap = async (args: { baseCurrency: string, quoteCurrency: string, orderSide: number, rate: number
    invoice: string, refundPublicKey: string, outputType: number }) => {

    const { swapManager } = this.serviceComponents;

    const orderSide = this.getOrderSide(args.orderSide);
    const outputType = getOutputType(args.outputType);

    const refundPublicKey = getHexBuffer(args.refundPublicKey);

    return await swapManager.createSwap(args.baseCurrency, args.quoteCurrency, orderSide, args.rate, args.invoice, refundPublicKey, outputType);
  }

  /**
   * Creates a new Swap from Lightning to the chain
   */
  public createReverseSwap = async (args: { baseCurrency: string, quoteCurrency: string, orderSide: number, rate: number,
    claimPublicKey: string, amount: number }) => {

    const { swapManager } = this.serviceComponents;

    const orderSide = this.getOrderSide(args.orderSide);
    const claimPublicKey = getHexBuffer(args.claimPublicKey);

    return await swapManager.createReverseSwap(args.baseCurrency, args.quoteCurrency, orderSide, args.rate, claimPublicKey, args.amount);
  }

  /**
   * Subscribes to a stream of confirmed transactions to addresses that were specified with "ListenOnAddress"
   */
  private subscribeTransactions = () => {
    this.serviceComponents.currencies.forEach((currency) => {
      currency.chainClient.on('transaction.relevant.block', (transactionHex) => {
        const transaction = Transaction.fromHex(transactionHex);

        transaction.outs.forEach((out) => {
          const listenAddress = this.listenScriptsSet.get(getHexString(out.script));

          if (listenAddress) {
            this.emit('transaction.confirmed', transaction.getId(), listenAddress);
          }
        });
      });
    });
  }

  /**
   * Subscribes to a stream of invoices paid by Boltz
   */
  private subscribeInvoices = () => {
    this.serviceComponents.currencies.forEach((currency) => {
      currency.lndClient.on('invoice.paid', (invoice) => {
        this.emit('invoice.paid', invoice);
      });

      currency.lndClient.on('invoice.settled', (invoice, preimage) => {
        this.emit('invoice.settled', invoice, preimage);
      });
    });
  }

  private getCurrency = (currencySymbol: string) => {
    const { swapManager } = this.serviceComponents;

    const currency = swapManager.currencies.get(currencySymbol);

    if (!currency) {
      throw Errors.CURRENCY_NOT_FOUND(currencySymbol);
    }

    return currency;
  }

  private getOrderSide = (side: number) => {
    switch (side) {
      case 0: return OrderSide.BUY;
      case 1: return OrderSide.SELL;

      default: throw Errors.ORDER_SIDE_NOT_FOUND(side);
    }
  }
}

export default Service;
