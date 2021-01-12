import { Transaction } from 'bitcoinjs-lib';
import Logger from '../../Logger';
import LndClient from '../../lightning/LndClient';
import ChainClient from '../../chain/ChainClient';
import { AddressType } from '../../proto/lnd/rpc_pb';
import WalletProviderInterface, { WalletBalance, SentTransaction } from './WalletProviderInterface';

class LndWalletProvider implements WalletProviderInterface {
  public readonly symbol: string;

  constructor(public logger: Logger, public lndClient: LndClient, public chainClient: ChainClient) {
    this.symbol = chainClient.symbol;

    this.logger.info(`Initialized ${this.symbol} LND wallet`);
  }

  public getBalance = (): Promise<WalletBalance> => {
    return this.lndClient.getWalletBalance();
  }

  public getAddress = async (): Promise<string> => {
    const response = await this.lndClient.newAddress(AddressType.WITNESS_PUBKEY_HASH);
    return response.address;
  }

  public sendToAddress = async (address: string, amount: number, satPerVbyte?: number): Promise<SentTransaction> => {
    // To avoid weird race conditions (insanely unlikely but still), the start height of the LND transaction list call
    // is queried *before* sending the onchain transaction
    const { blockHeight } = await this.lndClient.getInfo();
    const response = await this.lndClient.sendCoins(address, amount, await this.getFeePerVbyte(satPerVbyte));

    return this.handleLndTransaction(response.txid, address, blockHeight);
  }

  public sweepWallet = async (address: string, satPerVbyte?: number): Promise<SentTransaction> => {
    // See "sendToAddress"
    const { blockHeight } = await this.lndClient.getInfo();
    const response = await this.lndClient.sweepWallet(address, await this.getFeePerVbyte(satPerVbyte));

    return this.handleLndTransaction(response.txid, address, blockHeight);
  }

  private handleLndTransaction = async (transactionId: string, address: string, listStartHeight: number): Promise<SentTransaction> => {
    const rawTransaction = await this.chainClient.getRawTransactionVerbose(transactionId);

    let vout = 0;

    for (const output of rawTransaction.vout) {
      if (output.scriptPubKey.addresses.includes(address)) {
        vout = output.n;
      }
    }

    let fee = 0;

    // To limit the number of onchain transactions LND has to query, the start height is set
    const { transactionsList } = await this.lndClient.getOnchainTransactions(listStartHeight);

    for (let i = 0; i < transactionsList.length; i += 1) {
      const transaction = transactionsList[i];

      if (transaction.txHash === transactionId) {
        fee = transaction.totalFees;
        break;
      }
    }

    return {
      fee,
      vout,
      transactionId,

      transaction: Transaction.fromHex(rawTransaction.hex),
    };
  }

  private getFeePerVbyte = async (satPerVbyte?: number) => {
    return satPerVbyte || await this.chainClient.estimateFee();
  }
}

export default LndWalletProvider;
