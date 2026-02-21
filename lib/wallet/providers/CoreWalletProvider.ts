import type { Network } from 'bitcoinjs-lib';
import { Transaction, address as addressLib } from 'bitcoinjs-lib';
import type Logger from '../../Logger';
import { isTxConfirmed } from '../../Utils';
import type { IChainClient } from '../../chain/ChainClient';
import ChainClient, { AddressType } from '../../chain/ChainClient';
import type NotificationClient from '../../notifications/NotificationClient';
import type { SentTransaction, WalletBalance } from './WalletProviderInterface';
import type WalletProviderInterface from './WalletProviderInterface';
import { checkMempoolAndSaveRebroadcast } from './WalletProviderInterface';

class CoreWalletProvider implements WalletProviderInterface {
  public readonly symbol: string;

  constructor(
    public logger: Logger,
    public chainClient: IChainClient,
    private readonly network: Network,
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
    const transactionId = await this.chainClient.sendToAddress(
      address,
      amount,
      await this.getFeePerVbyte(satPerVbyte),
      false,
      label,
    );
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

    const rawTransaction = Transaction.fromHex(walletTransaction.hex);
    const targetScriptPubKey = addressLib.toOutputScript(address, this.network);

    const vout = rawTransaction.outs.findIndex((output) =>
      output.script.equals(targetScriptPubKey),
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
