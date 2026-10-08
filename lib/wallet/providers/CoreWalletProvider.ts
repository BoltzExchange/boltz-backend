import { hexToBytes } from '@noble/hashes/utils.js';
import { Transaction } from '@scure/btc-signer';
import { equalBytes } from '@scure/btc-signer/utils.js';
import { outputScriptFromAddress } from '../../AddressUtils';
import type Logger from '../../Logger';
import { TxView } from '../../TxView';
import { isTxConfirmed } from '../../Utils';
import type { IChainClient } from '../../chain/ChainClient';
import ChainClient, { AddressType } from '../../chain/ChainClient';
import type { BitcoinNetwork } from '../../consts/BitcoinNetworks';
import { CurrencyType } from '../../consts/Enums';
import type NotificationClient from '../../notifications/NotificationClient';
import NotBroadcastError from './NotBroadcastError';
import type { SentTransaction, WalletBalance } from './WalletProviderInterface';
import type WalletProviderInterface from './WalletProviderInterface';
import { checkMempoolAndSaveRebroadcast } from './WalletProviderInterface';

// Entries per `listtransactions` page, and the most pages read before giving
// up on finding where `since` begins
const findSendPageSize = 100;
const findSendMaxPages = 50;

class CoreWalletProvider implements WalletProviderInterface {
  public readonly symbol: string;

  constructor(
    public logger: Logger,
    public chainClient: IChainClient,
    private readonly network: BitcoinNetwork,
    private readonly notifications?: NotificationClient,
  ) {
    this.symbol = chainClient.symbol;

    this.logger.info(`Initialized ${this.symbol} Core wallet`);
  }

  public serviceName = (): string => {
    return 'Core';
  };

  public getAddress = (
    label: string,
    type: AddressType = AddressType.Taproot,
  ): Promise<string> => this.chainClient.getNewAddress(label, type);

  public getBalance = async (): Promise<WalletBalance> => {
    const utxos = await this.chainClient.listUnspent(0);

    let confirmed = BigInt(0);
    let unconfirmed = BigInt(0);

    utxos.forEach((utxo) => {
      const amount = BigInt(Math.round(utxo.amount * ChainClient.decimals));

      // Core considers its change as safe to spend, so should we
      if (isTxConfirmed(utxo) || utxo.safe) {
        confirmed += amount;
      } else {
        unconfirmed += amount;
      }
    });

    return {
      confirmedBalance: Number(confirmed),
      unconfirmedBalance: Number(unconfirmed),
    };
  };

  public sendToAddress = async (
    address: string,
    amount: number,
    satPerVbyte: number | undefined,
    label: string,
  ): Promise<SentTransaction> => {
    const feePerVbyte = await this.getFeePerVbyte(satPerVbyte);

    let transactionId: string;
    try {
      transactionId = await this.chainClient.sendToAddress(
        address,
        amount,
        feePerVbyte,
        false,
        label,
      );
    } catch (error) {
      throw NotBroadcastError.isNodeRefusal(error)
        ? new NotBroadcastError(error)
        : error;
    }

    return await this.handleCoreTransaction(transactionId, address);
  };

  public sweepWallet = async (
    address: string,
    satPerVbyte: number | undefined,
    label: string,
  ): Promise<SentTransaction> => {
    const { confirmedBalance } = await this.getBalance();
    const transactionId = await this.chainClient.sendToAddress(
      address,
      confirmedBalance,
      await this.getFeePerVbyte(satPerVbyte),
      true,
      label,
    );

    return await this.handleCoreTransaction(transactionId, address);
  };

  public findSend = async (
    address: string,
    since: Date,
  ): Promise<SentTransaction | undefined> => {
    const sinceSeconds = Math.floor(since.getTime() / 1000);

    for (let page = 0; page < findSendMaxPages; page++) {
      const entries = await this.chainClient.listWalletTransactions(
        findSendPageSize,
        page * findSendPageSize,
      );

      const send = entries.find(
        (entry) =>
          entry.category === 'send' &&
          entry.address === address &&
          entry.abandoned !== true &&
          // Conflicted: the coins are back in the wallet
          entry.confirmations >= 0,
      );
      if (send !== undefined) {
        return await this.handleCoreTransaction(send.txid, address);
      }

      // A page is ordered oldest first; once it starts before `since`, the
      // pages after it are older still
      if (
        entries.length < findSendPageSize ||
        (entries.length > 0 && entries[0].timereceived < sinceSeconds)
      ) {
        return undefined;
      }
    }

    throw new Error(
      `more than ${findSendMaxPages * findSendPageSize} wallet transactions since ${since.toISOString()}`,
    );
  };

  private handleCoreTransaction = async (
    transactionId: string,
    address: string,
  ): Promise<SentTransaction> => {
    const walletTransaction =
      await this.chainClient.getWalletTransaction(transactionId);

    await checkMempoolAndSaveRebroadcast(
      this.logger,
      this.notifications,
      this.chainClient,
      transactionId,
      walletTransaction.hex,
    );

    const rawTransaction = Transaction.fromRaw(
      hexToBytes(walletTransaction.hex),
    );
    const targetScriptPubKey = outputScriptFromAddress(
      CurrencyType.BitcoinLike,
      address,
      this.network,
    );

    const vout = TxView.of(rawTransaction).outputs.findIndex((out) =>
      equalBytes(out.script, targetScriptPubKey),
    );
    if (vout === -1) {
      throw new Error('output not found in transaction');
    }

    return {
      vout,
      transactionId,
      transaction: rawTransaction,
      fee: Math.round(Math.abs(walletTransaction.fee * ChainClient.decimals)),
    };
  };

  private getFeePerVbyte = async (satPerVbyte?: number) => {
    return satPerVbyte || (await this.chainClient.estimateFee());
  };
}

export default CoreWalletProvider;
