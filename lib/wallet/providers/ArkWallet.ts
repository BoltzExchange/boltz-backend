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
    const balance = await this.node.getBalance();
    return {
      confirmedBalance: balance,
      unconfirmedBalance: 0,
    };
  };

  // TODO: label support
  public getAddress = async (): Promise<string> => {
    return (await this.node.getAddress()).address;
  };

  // TODO: label support
  public sendToAddress = async (
    address: string,
    amount: number,
  ): Promise<SentTransaction> => {
    const roundId = await this.node.sendOffchain(address, amount);
    return {
      fee: 0,
      transactionId: roundId,
    };
  };

  // TODO: label support
  public sweepWallet = async (address: string): Promise<SentTransaction> => {
    const txId = await this.node.sendOffchain(
      address,
      (await this.getBalance()).confirmedBalance,
    );
    return {
      fee: 0,
      transactionId: txId,
    };
  };
}

export default ArkWallet;
