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

const argChecks = {
  VALID_CURRENCY: ({ currency }: { currency: string }) => {
    if (!(currency.length >= 3 && currency.length <= 5) || !currency.match(/^[A-Z]+$/))  {
      throw Errors.INVALID_ARGUMENT('currency must consist of 2 to 5 upper case English letters');
    }
  },
  VALID_OUTPUTTYPE: ({ outputType }: { outputType: number }) => {
    if (!(outputType % 1 === 0 && outputType >= 0 && outputType <= 2)) {
      throw Errors.INVALID_ARGUMENT('outputType must be: 0 for Bech32 | 1 for Compatibility | 2 for Legacy');
    }
  },
  VALID_TIMEOUT: ({ timeoutBlockNumber }: { timeoutBlockNumber: number }) => {
    if (timeoutBlockNumber < 0 || timeoutBlockNumber % 1 !== 0) {
      throw Errors.INVALID_ARGUMENT('timeout block number must be a positive integer');
    }
  },
  HAS_TXHASH: ({ transactionHash }: {transactionHash: string}) => {
    if (transactionHash === '') throw Errors.INVALID_ARGUMENT('transactionHash must be specified');
  },
  HAS_TXHEX: ({ transactionHex }: {transactionHex: string}) => {
    if (transactionHex === '') throw Errors.INVALID_ARGUMENT('transactionHex must be specified');
  },
  HAS_ADDRESS: ({ address }: {address: string}) => {
    if (address === '') throw Errors.INVALID_ARGUMENT('address must be specified');
  },
  HAS_INVOICE: ({ invoice }: { invoice: string }) => {
    if (invoice === '') throw Errors.INVALID_ARGUMENT('invoice must be specified');
    if (invoice.slice(0, 2) !== 'ln') throw Errors.INVALID_ARGUMENT('invoice is not valid');
  },
  HAS_CLAIMPUBKEY: ({ claimPublicKey }: { claimPublicKey: string }) => {
    if (claimPublicKey === '') throw Errors.INVALID_ARGUMENT('claim public key must be specified');
  },
  HAS_REFUNDPUBKEY: ({ refundPublicKey }: { refundPublicKey: string }) => {
    if (refundPublicKey === '') throw Errors.INVALID_ARGUMENT('refund public key must be specified');
  },
  VALID_RATE: ({ rate }: {rate: number}) => {
    if (rate < 0) throw Errors.INVALID_ARGUMENT('rate cannot be negative');
    if (rate === 0) throw Errors.INVALID_ARGUMENT('rate cannot be zero');
  },
};

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
    if (args.currency !== '') {
      argChecks.VALID_CURRENCY(args);
    }

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
    argChecks.VALID_CURRENCY(args);
    argChecks.VALID_OUTPUTTYPE({ outputType: args.type });

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
    argChecks.VALID_CURRENCY(args);
    argChecks.HAS_TXHASH(args);

    const currency = this.getCurrency(args.currency);

    return currency.chainClient.getRawTransaction(args.transactionHash);
  }

  /**
   * Broadcast a hex encoded transaction on the specified network
   */
  public broadcastTransaction = async (args: { currency: string, transactionHex: string }) => {
    argChecks.VALID_CURRENCY(args);
    argChecks.HAS_TXHEX(args);

    const currency = this.getCurrency(args.currency);

    return currency.chainClient.sendRawTransaction(args.transactionHex);
  }

  /**
   * Adds an entry to the list of addresses SubscribeTransactions listens to
   */
  public listenOnAddress = async (args: { currency: string, address: string }) => {
    argChecks.VALID_CURRENCY(args);
    argChecks.HAS_ADDRESS(args);

    const currency = this.getCurrency(args.currency);

    const script = address.toOutputScript(args.address, currency.network);

    this.listenScriptsSet.set(getHexString(script), args.address);
    await currency.chainClient.loadTxFiler(false, [args.address], []);
  }

  /**
   * Creates a new Swap from the chain to Lightning
   */
  public createSwap = async (args: { baseCurrency: string, quoteCurrency: string, orderSide: number, rate: number
    invoice: string, refundPublicKey: string, outputType: number, timeoutBlockNumber: number}) => {
    argChecks.VALID_CURRENCY({ currency: args.baseCurrency });
    argChecks.VALID_CURRENCY({ currency: args.quoteCurrency });
    argChecks.VALID_OUTPUTTYPE(args);
    argChecks.HAS_INVOICE(args);
    argChecks.HAS_REFUNDPUBKEY(args);
    argChecks.VALID_RATE(args);
    argChecks.VALID_TIMEOUT(args);

    const { swapManager } = this.serviceComponents;

    const orderSide = this.getOrderSide(args.orderSide);
    const outputType = getOutputType(args.outputType);

    const refundPublicKey = getHexBuffer(args.refundPublicKey);

    return await swapManager.createSwap(args.baseCurrency, args.quoteCurrency, orderSide,
      args.rate, args.invoice, refundPublicKey, outputType, args.timeoutBlockNumber);
  }

  /**
   * Creates a new Swap from Lightning to the chain
   */
  public createReverseSwap = async (args: { baseCurrency: string, quoteCurrency: string, orderSide: number, rate: number,
    claimPublicKey: string, amount: number, timeoutBlockNumber: number}) => {
    argChecks.VALID_CURRENCY({ currency: args.baseCurrency });
    argChecks.VALID_CURRENCY({ currency: args.quoteCurrency });
    argChecks.HAS_CLAIMPUBKEY(args);
    argChecks.VALID_RATE(args);
    argChecks.VALID_TIMEOUT(args);

    const { swapManager } = this.serviceComponents;

    const orderSide = this.getOrderSide(args.orderSide);
    const claimPublicKey = getHexBuffer(args.claimPublicKey);

    return await swapManager.createReverseSwap(args.baseCurrency, args.quoteCurrency, orderSide, args.rate,
    claimPublicKey, args.amount, args.timeoutBlockNumber);
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
