import type Logger from '../../Logger';
import ArkClient from '../../chain/ArkClient';
import type { SentTransaction, WalletBalance } from './WalletProviderInterface';
import type WalletProviderInterface from './WalletProviderInterface';

class ArkWallet implements WalletProviderInterface {
  public readonly symbol: string = ArkClient.symbol;

  constructor(
    private readonly logger: Logger,
    private readonly node: ArkClient,
  ) {
    this.logger.info(`Initialized ${this.serviceName()} ${this.symbol} wallet`);
  }

  public serviceName = (): string => this.node.serviceName();

  public getBalance = async (): Promise<WalletBalance> => {
    return await this.node.getBalance();
  };

  public getAddress = async (): Promise<string> => {
    return (await this.node.getAddress()).address;
  };

  public sendToAddress = async (
    address: string,
    amount: number,
    _satPerVbyte: number | undefined,
    label: string,
  ): Promise<SentTransaction> => {
    const transactionId = await this.node.sendOffchain(address, amount, label);
    return await this.handleTransaction(transactionId, address, BigInt(amount));
  };

  public sweepWallet = async (
    address: string,
    _satPerVbyte: number | undefined,
    label: string,
  ): Promise<SentTransaction> => {
    const balance = await this.getBalance();
    const amount =
      BigInt(balance.confirmedBalance) + BigInt(balance.unconfirmedBalance);

    const txId = await this.node.sendOffchain(address, Number(amount), label);
    return await this.handleTransaction(txId, address, amount);
  };

  private handleTransaction = async (
    transactionId: string,
    address: string,
    amount: bigint,
  ): Promise<SentTransaction> => {
    const tx = await this.node.getTx(transactionId);

    const addressPubkey = ArkClient.decodeAddress(address).tweakedPubKey;
    const vout = ArkClient.mapOutputs(tx).findIndex(
      (output) =>
        output.amount === amount &&
        Buffer.from(output.script!).subarray(2).equals(addressPubkey),
    );
    if (vout === -1) {
      throw new Error('output not found in transaction');
    }

    return {
      fee: 0,
      vout,
      transactionId,
    };
  };
}

export default ArkWallet;
