import type { Transaction } from 'bitcoinjs-lib';
import type { Transaction as LiquidTransaction } from 'liquidjs-lib';

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

  getAddress: (label: string) => Promise<string>;

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
    relativeFee: number | undefined,
    label: string,
  ) => Promise<SentTransaction>;

  /**
   * Sweeps the wallet
   *
   * @param address
   * @param relativeFee
   */
  sweepWallet: (
    address: string,
    relativeFee: number | undefined,
    label: string,
  ) => Promise<SentTransaction>;
}

export default WalletProviderInterface;
export { SentTransaction, WalletBalance, BalancerFetcher };
