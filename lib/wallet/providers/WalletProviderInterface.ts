import { Transaction } from 'bitcoinjs-lib';
import { Transaction as LiquidTransaction } from 'liquidjs-lib';

type WalletBalance = {
  confirmedBalance: number;
  unconfirmedBalance: number;
};

type SentTransaction = {
  fee?: number;

  vout?: number;
  transactionId: string;

  transaction?: Transaction | LiquidTransaction;
};

interface BalancerFetcher {
  serviceName(): string;
  getBalance(): Promise<WalletBalance>;
}

interface WalletProviderInterface extends BalancerFetcher {
  readonly symbol: string;

  getAddress: () => Promise<string>;

  /**
   * Sends coins from the wallet
   *
   * @param address
   * @param amount
   * @param relativeFee
   */
  sendToAddress: (
    address: string,
    amount: number,
    relativeFee?: number,
  ) => Promise<SentTransaction>;

  /**
   * Sweeps the wallet
   *
   * @param address
   * @param relativeFee
   */
  sweepWallet: (
    address: string,
    relativeFee?: number,
  ) => Promise<SentTransaction>;
}

export default WalletProviderInterface;
export { SentTransaction, WalletBalance, BalancerFetcher };
