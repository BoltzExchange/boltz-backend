import { Signer } from 'ethers';
import Logger from '../../Logger';
import { etherDecimals } from '../../consts/Consts';
import { getGasPrices } from '../ethereum/EthereumUtils';
import WalletProviderInterface, { SentTransaction, WalletBalance } from './WalletProviderInterface';

class EtherWalletProvider implements WalletProviderInterface {
  public readonly symbol: string;

  // The gas needed for sending Ether is 21000
  private readonly ethTransferGas = BigInt(21000);

  constructor(private logger: Logger, private signer: Signer) {
    this.symbol = 'ETH';
    this.logger.info('Initialized Ether wallet');
  }

  public getAddress = (): Promise<string> => {
    return this.signer.getAddress();
  };

  public getBalance = async (): Promise<WalletBalance> => {
    const balance = Number((
      await this.signer.provider!.getBalance(await this.getAddress())
    ) / etherDecimals);

    return {
      totalBalance: balance,
      confirmedBalance: balance,
      unconfirmedBalance: 0,
    };
  };

  public sendToAddress = async (address: string, amount: number): Promise<SentTransaction> => {
    const transaction = await this.signer.sendTransaction({
      to: address,
      value: BigInt(amount) * etherDecimals,
      ...await getGasPrices(this.signer.provider!),
    });

    return {
      transactionId: transaction.hash,
    };
  };

  public sweepWallet = async (address: string): Promise<SentTransaction> => {
    const balance = await this.signer.provider!.getBalance(await this.getAddress());

    const { type, maxPriorityFeePerGas, maxFeePerGas } = await getGasPrices(this.signer.provider!);
    const gasCost = this.ethTransferGas * BigInt(maxFeePerGas!);

    const value = balance - gasCost;

    const transaction = await this.signer.sendTransaction({
      type,
      maxFeePerGas,
      maxPriorityFeePerGas,
      value,
      to: address,
      gasLimit: this.ethTransferGas,
    });

    return {
      transactionId: transaction.hash,
    };
  };
}

export default EtherWalletProvider;
