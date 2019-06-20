import { SwapUtils } from 'boltz-core';
import { address } from 'bitcoinjs-lib';
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
  ChannelBalance,
  GetInfoResponse,
  LightningBalance,
  GetBalanceResponse,
  GetFeeEstimationResponse,
} from '../proto/boltzrpc_pb';
import EventHandler from './EventHandler';

const packageJson = require('../../package.json');

type ServiceComponents = {
  logger: Logger;
  currencies: Map<string, Currency>;
  walletManager: WalletManager;
  swapManager: SwapManager;
};

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
  VALID_TIMEOUT_BLOCK_DELTA: ({ timeoutBlockDelta }: { timeoutBlockDelta: number }) => {
    if (timeoutBlockDelta < 0 || timeoutBlockDelta % 1 !== 0) {
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
    if (!(amount >= 0) || amount % 1 !== 0) throw Errors.INVALID_ARGUMENT('amount must a positive integer');
  },
  VALID_FEE_PER_VBYTE: ({ satPerVbyte }: { satPerVbyte: number }) => {
    if (!(satPerVbyte > 0) || satPerVbyte % 1 !== 0) throw Errors.INVALID_ARGUMENT('sat per vbyte fee must be positive integer');
  },
  VALID_FEE: ({ fee }: { fee: number }) => {
    if (fee < 0 || fee % 1 !== 0) throw Errors.INVALID_ARGUMENT('fee must be a positive integer');
  },
};

class Service {
  public eventHandler: EventHandler;

  constructor(private serviceComponents: ServiceComponents) {
    this.eventHandler = new EventHandler(
      serviceComponents.currencies,
      serviceComponents.swapManager.nursery,
    );
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
        const networkInfo = await currency.chainClient.getNetworkInfo();
        const blockchainInfo = await currency.chainClient.getBlockchainInfo();

        chain.setVersion(networkInfo.version);
        chain.setProtocolversion(networkInfo.protocolversion);
        chain.setBlocks(blockchainInfo.blocks);
        chain.setConnections(networkInfo.connections);
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

    const getBalance = async (symbol: string, wallet: Wallet) => {
      const balance = new Balance();
      const walletObject = new WalletBalance();

      const walletBalance = await wallet.getBalance();

      walletObject.setTotalBalance(walletBalance.totalBalance);
      walletObject.setConfirmedBalance(walletBalance.confirmedBalance);
      walletObject.setUnconfirmedBalance(walletBalance.unconfirmedBalance);

      balance.setWalletBalance(walletObject);

      const currencyInfo = this.serviceComponents.currencies.get(symbol);

      if (currencyInfo) {
        const lightningBalance = new LightningBalance();

        const channelBalance = new ChannelBalance();
        const lightningWalletBalance = new WalletBalance();

        const { totalBalance, confirmedBalance, unconfirmedBalance } = await currencyInfo.lndClient.getWalletBalance();
        const { channelsList } = await currencyInfo.lndClient.listChannels();

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

    if (emptyCurrency) {
      for (const [symbol, wallet] of walletManager.wallets) {
        map.set(symbol, await getBalance(symbol, wallet));
      }
    } else {
      const wallet = walletManager.wallets.get(args.currency);

      if (!wallet) {
        throw Errors.CURRENCY_NOT_FOUND(args.currency);
      }

      map.set(args.currency, await getBalance(args.currency, wallet));
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
    const transaction = await currency.chainClient.getRawTransaction(args.transactionHash);

    return transaction;
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
  public listenOnAddress = (args: { currency: string, address: string }) => {
    argChecks.VALID_CURRENCY(args);
    argChecks.HAS_ADDRESS(args);

    const currency = this.getCurrency(args.currency);

    const script = address.toOutputScript(args.address, currency.network);

    this.eventHandler.listenScripts.set(getHexString(script), args.address);
    currency.chainClient.updateOutputFilter([script]);
  }

  /**
   * Creates a new Swap from the chain to Lightning
   */
  public createSwap = async (args: {
    baseCurrency: string,
    quoteCurrency: string,
    orderSide: number,
    invoice: string,
    expectedAmount: number,
    refundPublicKey: string,
    outputType: number,
    timeoutBlockDelta: number,
    acceptZeroConf: boolean,
  }) => {
    argChecks.HAS_INVOICE(args);
    argChecks.HAS_REFUNDPUBKEY(args);

    argChecks.VALID_OUTPUTTYPE(args);
    argChecks.VALID_TIMEOUT_BLOCK_DELTA(args);
    argChecks.VALID_AMOUNT({ amount: args.expectedAmount });
    argChecks.VALID_CURRENCY({ currency: args.baseCurrency });
    argChecks.VALID_CURRENCY({ currency: args.quoteCurrency });

    const orderSide = this.getOrderSide(args.orderSide);
    const outputType = getOutputType(args.outputType);

    const refundPublicKey = getHexBuffer(args.refundPublicKey);

    const { swapManager } = this.serviceComponents;

    return await swapManager.createSwap(
      args.baseCurrency,
      args.quoteCurrency,
      orderSide,
      args.invoice,
      args.expectedAmount,
      refundPublicKey,
      outputType,
      args.timeoutBlockDelta,
      args.acceptZeroConf,
    );
  }

  /**
   * Creates a new Swap from Lightning to the chain
   */
  public createReverseSwap = async (args: {
    baseCurrency: string,
    quoteCurrency: string,
    orderSide: number,
    invoiceAmount: number,
    onchainAmount: number,
    claimPublicKey: string,
    timeoutBlockDelta: number,
  }) => {
    argChecks.HAS_CLAIMPUBKEY(args);

    argChecks.VALID_TIMEOUT_BLOCK_DELTA(args);
    argChecks.VALID_AMOUNT({ amount: args.invoiceAmount });
    argChecks.VALID_AMOUNT({ amount: args.onchainAmount });
    argChecks.VALID_CURRENCY({ currency: args.baseCurrency });
    argChecks.VALID_CURRENCY({ currency: args.quoteCurrency });

    const orderSide = this.getOrderSide(args.orderSide);
    const claimPublicKey = getHexBuffer(args.claimPublicKey);

    const { swapManager } = this.serviceComponents;

    return await swapManager.createReverseSwap(
      args.baseCurrency,
      args.quoteCurrency,
      orderSide,
      args.invoiceAmount,
      args.onchainAmount,
      claimPublicKey,
      args.timeoutBlockDelta,
    );
  }

  /**
   * Sends coins to a specified address
   */
  public sendCoins = async (args: { currency: string, address: string, amount: number, satPerVbyte: number, sendAll: boolean }) => {
    argChecks.HAS_ADDRESS(args);
    argChecks.VALID_CURRENCY(args);
    argChecks.VALID_AMOUNT(args);
    argChecks.VALID_FEE_PER_VBYTE(args);

    const currency = this.getCurrency(args.currency);
    const wallet = this.serviceComponents.walletManager.wallets.get(args.currency)!;

    const fee = args.satPerVbyte === 0 ? await currency.chainClient.estimateFee() : args.satPerVbyte;

    const output = SwapUtils.getOutputScriptType(address.toOutputScript(args.address, currency.network))!;

    const { transaction, vout } = await wallet.sendToAddress(args.address, output.type, output.isSh!, args.amount, fee, args.sendAll);
    await currency.chainClient.sendRawTransaction(transaction.toHex());

    return {
      vout,
      transactionHash: transaction.getId(),
    };
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
