import { Transaction, address as addressLib } from 'liquidjs-lib';
import type { Network } from 'liquidjs-lib/src/networks';
import type Logger from '../../Logger';
import { getHexBuffer } from '../../Utils';
import ChainClient from '../../chain/ChainClient';
import type { IElementsClient } from '../../chain/ElementsClient';
import type NotificationClient from '../../notifications/NotificationClient';
import type { SentTransaction, WalletBalance } from './WalletProviderInterface';
import type WalletProviderInterface from './WalletProviderInterface';
import { checkMempoolAndSaveRebroadcast } from './WalletProviderInterface';

class ElementsWalletProvider implements WalletProviderInterface {
  public static readonly assetLabel = 'bitcoin';

  public readonly symbol: string;

  constructor(
    public logger: Logger,
    public chainClient: IElementsClient,
    private readonly network: Network,
    private readonly notifications?: NotificationClient,
  ) {
    this.symbol = chainClient.symbol;

    this.logger.info(`Initialized ${this.symbol} Elements wallet`);
  }

  public serviceName = (): string => {
    return 'Elements';
  };

  public getBalance = async (): Promise<WalletBalance> => {
    const balances = await this.chainClient.getBalances();

    const confirmedBalance =
      balances.mine.trusted[ElementsWalletProvider.assetLabel];
    const unconfirmedBalance =
      balances.mine.untrusted_pending[ElementsWalletProvider.assetLabel];

    return {
      confirmedBalance,
      unconfirmedBalance,
    };
  };

  public getAddress = (label: string): Promise<string> =>
    this.chainClient.getNewAddress(label);

  public dumpBlindingKey = async (address: string): Promise<Buffer> => {
    return getHexBuffer(await this.chainClient.dumpBlindingKey(address));
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
    return this.handleLiquidTransaction(transactionId, address);
  };

  public sweepWallet = async (
    address: string,
    satPerVbyte: number | undefined,
    label: string,
  ): Promise<SentTransaction> => {
    const balance = await this.getBalance();
    const transactionId = await this.chainClient.sendToAddress(
      address,
      balance.confirmedBalance + balance.unconfirmedBalance,
      await this.getFeePerVbyte(satPerVbyte),
      true,
      label,
    );

    return this.handleLiquidTransaction(transactionId, address);
  };

  private handleLiquidTransaction = async (
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

export default ElementsWalletProvider;
