import { EventEmitter } from 'events';
import { SwapUtils } from 'boltz-core';
import { Transaction, address } from 'bitcoinjs-lib';
import Errors from './Errors';
import Logger from '../Logger';
import Wallet from '../wallet/Wallet';
import SwapManager from '../swap/SwapManager';
import WalletManager, { Currency } from '../wallet/WalletManager';
import { getHexBuffer, getOutputType, getHexString } from '../Utils';
import {
  Balance,
  LndInfo,
  OrderSide,
  ChainInfo,
  LndChannels,
  CurrencyInfo,
  WalletBalance,
  GetInfoResponse,
  GetBalanceResponse,
  GetFeeEstimationResponse,
} from '../proto/boltzrpc_pb';

const packageJson = require('../../package.json');

type ServiceComponents = {
  logger: Logger;
  currencies: Map<string, Currency>;
  walletManager: WalletManager;
  swapManager: SwapManager;
};

interface Service {
  on(event: 'transaction.confirmed', listener: (transactionHash: string, outputAddress: string) => void): this;
  emit(event: 'transaction.confirmed', transactionHash: string, outputAddress: string): boolean;

  on(even: 'invoice.paid', listener: (invoice: string) => void): this;
  emit(event: 'invoice.paid', invoice: string): boolean;

  on(event: 'invoice.settled', listener: (invoice: string, preimage: string) => void): this;
  emit(event: 'invoice.settled', string: string, preimage: string): boolean;

  on(event: 'refund', listener: (lockupTransactionHash: string) => void): this;
  emit(event: 'refund', lockupTransactionHash: string): boolean;
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
  VALID_RATE: ({ rate }: { rate: number }) => {
    if (!(rate > 0)) throw Errors.INVALID_ARGUMENT('rate must a positive number');
  },
  VALID_AMOUNT: ({ amount }: { amount: number }) => {
    if (!(amount > 0) || amount % 1 !== 0) throw Errors.INVALID_ARGUMENT('amount must a positive integer');
  },
  VALID_FEE_PER_VBYTE: ({ satPerVbyte }: { satPerVbyte: number }) => {
    if (!(satPerVbyte > 0) || satPerVbyte % 1 !== 0) throw Errors.INVALID_ARGUMENT('sat per vbyte fee must be positive integer');
  },
  VALID_FEE: ({ fee }: { fee: number }) => {
    if (fee < 0 || fee % 1 !== 0) throw Errors.INVALID_ARGUMENT('fee must be a positive integer');
  },
};

class Service extends EventEmitter {
  // A map between the hex strings of the scripts of the addresses and the addresses to which Boltz should listen to
  private listenScriptsSet = new Map<string, string>();

  constructor(private serviceComponents: ServiceComponents) {
    super();

    this.subscribeTransactions();
    this.subscribeInvoices();
    this.subscribeRefunds();
  }

  /**
   * Gets general information about this Boltz instance and the nodes it is connected to
   */
  public getInfo = async (): Promise<GetInfoResponse> => {
    const response = new GetInfoResponse();
    const map = response.getChainsMap();

    response.setVersion(packageJson.version);

    for (const [, currency] of this.serviceComponents.currencies) {
      const chain = new ChainInfo();
      const lnd = new LndInfo();

      try {
        const info = await currency.chainClient.getInfo();

        chain.setVersion(info.version);
        chain.setProtocolversion(info.protocolversion);
        chain.setBlocks(info.blocks);
        chain.setConnections(info.connections);
      } catch (error) {
        chain.setError(error);
      }

      try {
        const lndInfo = await currency.lndClient.getInfo();

        const channels = new LndChannels();

        channels.setActive(lndInfo.numActiveChannels);
        channels.setInactive(lndInfo.numInactiveChannels);
        channels.setPending(lndInfo.numPendingChannels);

        lnd.setVersion(lndInfo.version);
        lnd.setBlockHeight(lndInfo.blockHeight);
        lnd.setLndChannels(channels);
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
  public getBalance = async (args: { currency: string }) => {
    const emptyCurrency = args.currency === '';

    if (!emptyCurrency) {
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

    if (!emptyCurrency) {
      const wallet = walletManager.wallets.get(args.currency);

      if (!wallet) {
        throw Errors.CURRENCY_NOT_FOUND(args.currency);
      }

      map.set(args.currency, await getBalance(wallet, args.currency));
    } else {
      for (const [symbol, wallet] of walletManager.wallets) {
        map.set(symbol, await getBalance(wallet, symbol));
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
   * Gets a fee estimation in satoshis per vbyte for either all currencies or just a single one if specified
   */
  public getFeeEstimation = async (args: { currency: string, blocks: number }) => {
    const emptyCurrency = args.currency === '';

    if (!emptyCurrency) {
      argChecks.VALID_CURRENCY(args);
    }

    const { currencies } = this.serviceComponents;

    const response = new GetFeeEstimationResponse();
    const map = response.getFeesMap();

    const numBlocks = args.blocks === 0 ? 1 : args.blocks;

    if (!emptyCurrency) {
      const currency = currencies.get(args.currency);

      if (!currency) {
        throw Errors.CURRENCY_NOT_FOUND(args.currency);
      }

      map.set(args.currency, await currency.chainClient.estimateFee(numBlocks));
    } else {
      for (const [symbol, currency] of currencies) {
        map.set(symbol, await currency.chainClient.estimateFee(numBlocks));
      }
    }

    return response;
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
    fee: number, invoice: string, refundPublicKey: string, outputType: number, timeoutBlockNumber: number}) => {
    argChecks.VALID_CURRENCY({ currency: args.baseCurrency });
    argChecks.VALID_CURRENCY({ currency: args.quoteCurrency });
    argChecks.VALID_OUTPUTTYPE(args);
    argChecks.HAS_INVOICE(args);
    argChecks.HAS_REFUNDPUBKEY(args);
    argChecks.VALID_FEE(args);
    argChecks.VALID_RATE(args);
    argChecks.VALID_TIMEOUT(args);
    argChecks.VALID_TIMEOUT(args);

    const { swapManager } = this.serviceComponents;

    const orderSide = this.getOrderSide(args.orderSide);
    const outputType = getOutputType(args.outputType);

    const refundPublicKey = getHexBuffer(args.refundPublicKey);

    return await swapManager.createSwap(args.baseCurrency, args.quoteCurrency, orderSide,
      args.rate, args.fee, args.invoice, refundPublicKey, outputType, args.timeoutBlockNumber);
  }

  /**
   * Creates a new Swap from Lightning to the chain
   */
  public createReverseSwap = async (args: { baseCurrency: string, quoteCurrency: string, orderSide: number, rate: number,
    fee: number, claimPublicKey: string, amount: number, timeoutBlockNumber: number}) => {
    argChecks.VALID_CURRENCY({ currency: args.baseCurrency });
    argChecks.VALID_CURRENCY({ currency: args.quoteCurrency });
    argChecks.HAS_CLAIMPUBKEY(args);
    argChecks.VALID_RATE(args);
    argChecks.VALID_FEE(args);
    argChecks.VALID_TIMEOUT(args);

    const { swapManager } = this.serviceComponents;

    const orderSide = this.getOrderSide(args.orderSide);
    const claimPublicKey = getHexBuffer(args.claimPublicKey);

    return await swapManager.createReverseSwap(args.baseCurrency, args.quoteCurrency, orderSide, args.rate,
    args.fee, claimPublicKey, args.amount, args.timeoutBlockNumber);
  }

  /**
   * Sends coins to a specified address
   */
  public sendCoins = async (args: { currency: string, address: string, amount: number, satPerVbyte: number }) => {
    argChecks.HAS_ADDRESS(args);
    argChecks.VALID_CURRENCY(args);
    argChecks.VALID_AMOUNT(args);
    argChecks.VALID_FEE_PER_VBYTE(args);

    const currency = this.getCurrency(args.currency);
    const wallet = this.serviceComponents.walletManager.wallets.get(args.currency)!;

    const fee = args.satPerVbyte === 0 ? 1 : args.satPerVbyte;

    const output = SwapUtils.getOutputScriptType(address.toOutputScript(args.address, currency.network))!;

    const { transaction, vout } = await wallet.sendToAddress(args.address, output.type, output.isSh!, args.amount, fee);
    await currency.chainClient.sendRawTransaction(transaction.toHex());

    return {
      vout,
      transactionHash: transaction.getId(),
    };
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
   * Subscribes to a stream of settled invoices and those paid by Boltz
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

  /**
   * Subscribes to a stream of lockup transactions that Boltz refunds
   */
  private subscribeRefunds = () => {
    this.serviceComponents.swapManager.nursery.on('refund', (lockupTransactionHash) => {
      this.emit('refund', lockupTransactionHash);
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
