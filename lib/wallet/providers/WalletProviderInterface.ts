import { Transaction } from 'bitcoinjs-lib';

type WalletBalance = {
  totalBalance: number;
  confirmedBalance: number;
  unconfirmedBalance: number;
};

type SentTransaction = {
  fee: number;

  vout: number;

  transactionId: string;
  transaction: Transaction;
};

interface WalletProviderInterface {
  readonly symbol: string;

  getBalance: () => Promise<WalletBalance>;

  newAddress: () => Promise<string>;

  sendToAddress: (address: string, amount: number, satPerVbyte?: number) => Promise<SentTransaction>;
  sweepWallet: (address: string, satPerVbyte?: number) => Promise<SentTransaction>;
}

export default WalletProviderInterface;
export { WalletBalance, SentTransaction };
