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
    const roundId = await this.node.sendOffchain(address, amount, label);
    return {
      fee: 0,
      transactionId: roundId,
    };
  };

  public sweepWallet = async (
    address: string,
    _satPerVbyte: number | undefined,
    label: string,
  ): Promise<SentTransaction> => {
    const balance = await this.getBalance();
    const txId = await this.node.sendOffchain(
      address,
      Number(
        BigInt(balance.confirmedBalance) + BigInt(balance.unconfirmedBalance),
      ),
      label,
    );
    return {
      fee: 0,
      transactionId: txId,
    };
  };
}

export default ArkWallet;
