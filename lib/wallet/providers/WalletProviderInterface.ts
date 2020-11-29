import { Transaction } from 'bitcoinjs-lib';

type WalletBalance = {
  totalBalance: number;
  confirmedBalance: number;
  unconfirmedBalance: number;
};

type SentTransaction = {
  fee?: number;

  vout?: number;
  transactionId: string;

  transaction?: Transaction;
};

interface WalletProviderInterface {
  readonly symbol: string;

  getBalance: () => Promise<WalletBalance>;

  getAddress: () => Promise<string>;

  /**
   * Sends coins from the wallet
   *
   * @param address
   * @param amount
   * @param relativeFee
   */
  sendToAddress: (address: string, amount: number, relativeFee?: number) => Promise<SentTransaction>;

  /**
   * Sweeps the wallet
   *
   * @param address
   * @param relativeFee
   */
  sweepWallet: (address: string, relativeFee?: number) => Promise<SentTransaction>;
}

export default WalletProviderInterface;
export { WalletBalance, SentTransaction };
