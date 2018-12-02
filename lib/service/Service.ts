import Logger from '../Logger';
import { Info as ChainInfo } from '../chain/ChainClientInterface';
import { Info as LndInfo } from '../lightning/LndClient';
import SwapManager from '../swap/SwapManager';
import WalletManager, { Currency } from '../wallet/WalletManager';
import { WalletBalance } from '../wallet/Wallet';
import Errors from './Errors';
import { getHexBuffer, getOutputType } from '../Utils';
import { OrderSide } from '../proto/boltzrpc_pb';

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

// TODO: "invalid argument" errors
class Service {

  constructor(private serviceComponents: ServiceComponents) {}

  // TODO: error handling if a service is offline
  /**
   * Gets general information about this Boltz instance and the nodes it is connected to
   */
  public getInfo = async (): Promise<BoltzInfo> => {
    const { currencies } = this.serviceComponents;
    const version = packageJson.version;

    const currencyInfos: CurrencyInfo[] = [];

    const getCurrencyInfo = async (currency: Currency) => {
      const chainInfo = await currency.chainClient.getInfo();
      const lndInfo = await currency.lndClient.getLndInfo();

      currencyInfos.push({
        chainInfo,
        lndInfo,
        symbol: currency.symbol,
      });
    };

    const currenciesPromises: Promise<void>[] = [];

    currencies.forEach((currency) => {
      currenciesPromises.push(getCurrencyInfo(currency));
    });

    await Promise.all(currenciesPromises);

    return {
      version,
      currencies: currencyInfos,
    };
  }

  /**
   * Gets the balance for either all wallets or just a single one if specified
   */
  public getBalance = async (args: { currency: string }) => {
    const { walletManager } = this.serviceComponents;

    const result = new Map<string, WalletBalance>();

    if (args.currency !== '') {
      const wallet = walletManager.wallets.get(args.currency);

      if (!wallet) {
        throw Errors.CURRENCY_NOT_FOUND(args.currency);
      }

      result.set(args.currency, await wallet.getBalance());
    } else {
      for (const entry of walletManager.wallets) {
        const currency = entry[0];
        const wallet = entry[1];

        result.set(currency, await wallet.getBalance());
      }
    }

    return result;
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
   * Creates a new Swap from the chain to Lightning
   */
  public createSwap = async (args: { pairId: string, orderSide: number, invoice: string, refundPublicKey: string, outputType: number }) => {
    const { swapManager } = this.serviceComponents;

    const orderSide = this.getOrderSide(args.orderSide);
    const outputType = getOutputType(args.outputType);

    const refundPublicKey = getHexBuffer(args.refundPublicKey);

    return await swapManager.createSwap(args.pairId, orderSide, args.invoice, refundPublicKey, outputType);
  }

  /**
   * Creates a new Swap from Lightning to the chain
   */
  public createReverseSwap = async (args: { pairId: string, orderSide: number, claimPublicKey: string, amount: number }) => {
    const { swapManager } = this.serviceComponents;

    const orderSide = this.getOrderSide(args.orderSide);

    const claimPublicKey = getHexBuffer(args.claimPublicKey);

    return await swapManager.createReverseSwap(args.pairId, orderSide, claimPublicKey, args.amount);
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
