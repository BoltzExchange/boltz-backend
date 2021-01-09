import { BigNumber } from 'ethers';
import { Transaction } from 'bitcoinjs-lib';
import Logger from '../../Logger';
import ChainClient from '../../chain/ChainClient';
import WalletProviderInterface, { SentTransaction, WalletBalance } from './WalletProviderInterface';
import { transactionHashToId } from '../../Utils';

class CoreWalletProvider implements WalletProviderInterface {
  public readonly symbol: string;

  constructor(public logger: Logger, public chainClient: ChainClient) {
    this.symbol = chainClient.symbol;

    this.logger.info(`Initialized ${this.symbol} Core wallet`);
  }

  public getAddress = (): Promise<string> => {
    return this.chainClient.getNewAddress();
  }

  public getBalance = async (): Promise<WalletBalance> => {
    // TODO: use "getbalances" call if available
    const walletInfo = await this.chainClient.getWalletInfo();

    return {
      totalBalance: walletInfo.balance + walletInfo.unconfirmed_balance,
      confirmedBalance: walletInfo.balance,
      unconfirmedBalance: walletInfo.unconfirmed_balance,
    };
  }

  public sendToAddress = async (address: string, amount: number): Promise<SentTransaction> => {
    const transactionId = await this.chainClient.sendToAddress(address, amount);
    return await this.handleCoreTransaction(transactionId, address);
  }

  public sweepWallet = async (address: string): Promise<SentTransaction> => {
    const { confirmedBalance } = await this.getBalance();
    const transactionId = await this.chainClient.sendToAddress(address, confirmedBalance, true);

    return await this.handleCoreTransaction(transactionId, address);
  }

  private handleCoreTransaction = async (transactionId: string, address: string): Promise<SentTransaction> => {
    const rawTransactionVerbose = await this.chainClient.getRawTransactionVerbose(transactionId);
    const rawTransaction = Transaction.fromHex(rawTransactionVerbose.hex);

    let vout = 0;
    let outputSum = BigNumber.from(0);

    for (let i = 0; i < rawTransaction.outs.length; i += 1) {
      outputSum = outputSum.add(rawTransaction.outs[i].value);

      if (rawTransactionVerbose.vout[i].scriptPubKey.addresses.includes(address)) {
        vout = i;
      }
    }

    // Fetch all input transactions before processing them to avoid fetching one twice
    const fetchedTransaction = new Map<string, string>();

    for (const input of rawTransactionVerbose.vin) {
      if (!fetchedTransaction.has(input.txid)) {
        fetchedTransaction.set(input.txid, await this.chainClient.getRawTransaction(input.txid));
      }
    }

    let inputSum = BigNumber.from(0);

    for (const input of rawTransaction.ins) {
      const inputTransactionId = transactionHashToId(input.hash);

      const inputTransaction = Transaction.fromHex(fetchedTransaction.get(inputTransactionId)!);
      const inputVout = inputTransaction.outs[input.index];

      inputSum = inputSum.add(inputVout.value);
    }

    return {
      vout,
      transactionId,

      fee: inputSum.sub(outputSum).toNumber(),
      transaction: rawTransaction,
    };
  }

  private
}

export default CoreWalletProvider;
