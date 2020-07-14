import { BigNumber, Signer } from 'ethers';
import Logger from '../../Logger';
import { getGasPrice } from '../ethereum/EthereumUtils';
import { etherDecimals } from '../../consts/Consts';
import WalletProviderInterface, { SentTransaction, WalletBalance } from './WalletProviderInterface';

class EtherWalletProvider implements WalletProviderInterface {
  public readonly symbol: string;

  // The gas needed for sending Ether is 21000
  private readonly ethTransferGas = BigNumber.from(21000);

  constructor(private logger: Logger, private signer: Signer) {
    this.symbol = 'ETH';
    this.logger.info('Initialized Ether wallet');
  }

  public getAddress = (): Promise<string> => {
    return this.signer.getAddress();
  }

  public getBalance = async (): Promise<WalletBalance> => {
    const balance = (await this.signer.getBalance()).div(etherDecimals).toNumber();

    return {
      totalBalance: balance,
      confirmedBalance: balance,
      unconfirmedBalance: 0,
    };
  }

  public sendToAddress = async (address: string, amount: number, gasPrice?: number): Promise<SentTransaction> => {
    const transaction = await this.signer.sendTransaction({
      to: address,
      value: BigNumber.from(amount).mul(etherDecimals),
      gasPrice: await getGasPrice(this.signer.provider!, gasPrice),
    });

    return {
      transactionId: transaction.hash,
    };
  }

  public sweepWallet = async (address: string, gasPrice?: number): Promise<SentTransaction> => {
    const balance = await this.signer.getBalance();

    const actualGasPrice = await getGasPrice(this.signer.provider!, gasPrice);
    const gasCost = this.ethTransferGas.mul(actualGasPrice);

    const value = balance.sub(gasCost);

    const transaction = await this.signer.sendTransaction({
      value,
      to: address,
      gasPrice: actualGasPrice,
      gasLimit: this.ethTransferGas,
    });

    return {
      transactionId: transaction.hash,
    };
  }
}

export default EtherWalletProvider;
