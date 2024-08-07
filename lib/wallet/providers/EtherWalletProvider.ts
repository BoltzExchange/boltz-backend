import { Signer } from 'ethers';
import Logger from '../../Logger';
import TransactionLabelRepository from '../../db/repositories/TransactionLabelRepository';
import { getGasPrices } from '../ethereum/EthereumUtils';
import { NetworkDetails } from '../ethereum/EvmNetworks';
import WalletProviderInterface, {
  SentTransaction,
  WalletBalance,
} from './WalletProviderInterface';

class EtherWalletProvider implements WalletProviderInterface {
  // The gas needed for sending Ether is 21000
  private static readonly ethTransferGas = BigInt(21000);

  public readonly symbol: string;
  public readonly decimals: bigint;

  constructor(
    private logger: Logger,
    private signer: Signer,
    networkDetails: NetworkDetails,
  ) {
    this.symbol = networkDetails.symbol;
    this.decimals = networkDetails.decimals;
    this.logger.info(`Initialized ${this.symbol} wallet`);
  }

  public serviceName = (): string => {
    return 'Wallet';
  };

  public getAddress = (): Promise<string> => {
    return this.signer.getAddress();
  };

  public getBalance = async (): Promise<WalletBalance> => {
    const balance = Number(
      (await this.signer.provider!.getBalance(await this.getAddress())) /
        this.decimals,
    );

    return {
      confirmedBalance: balance,
      unconfirmedBalance: 0,
    };
  };

  public sendToAddress = async (
    address: string,
    amount: number,
    _: number | undefined,
    label: string,
  ): Promise<SentTransaction> => {
    const transaction = await this.signer.sendTransaction({
      to: address,
      value: BigInt(amount) * this.decimals,
      ...(await getGasPrices(this.signer.provider!)),
    });

    await TransactionLabelRepository.addLabel(
      transaction.hash,
      this.symbol,
      label,
    );

    return {
      transactionId: transaction.hash,
    };
  };

  public sweepWallet = async (
    address: string,
    _: number | undefined,
    label: string,
  ): Promise<SentTransaction> => {
    const balance = await this.signer.provider!.getBalance(
      await this.getAddress(),
    );

    const { type, maxPriorityFeePerGas, maxFeePerGas } = await getGasPrices(
      this.signer.provider!,
    );
    const gasCost = EtherWalletProvider.ethTransferGas * BigInt(maxFeePerGas!);

    const value = balance - gasCost;

    const transaction = await this.signer.sendTransaction({
      type,
      maxFeePerGas,
      maxPriorityFeePerGas,
      value,
      to: address,
      gasLimit: EtherWalletProvider.ethTransferGas,
    });

    await TransactionLabelRepository.addLabel(
      transaction.hash,
      this.symbol,
      label,
    );

    return {
      transactionId: transaction.hash,
    };
  };
}

export default EtherWalletProvider;
