import { Provider, Signer } from 'ethers';
import Logger from '../../Logger';
import PendingEthereumTransactionRepository from '../../db/repositories/PendingEthereumTransactionRepository';
import { NetworkDetails } from './EvmNetworks';

class EthereumTransactionTracker {
  constructor(
    private readonly logger: Logger,
    private readonly networkDetails: NetworkDetails,
    private readonly provider: Provider,
    private readonly wallet: Signer,
  ) {}

  public init = async (): Promise<void> => {
    this.logger.info(
      `Starting ${
        this.networkDetails.name
      } transaction tracker for address: ${await this.wallet.getAddress()}`,
    );

    await this.scanPendingTransactions();
  };

  /**
   * Scans a block and removes pending transactions from the database in case they were confirmed
   * This method is public and gets called from "EthereumManager" because there is a block subscription
   * in that class already
   */
  public scanPendingTransactions = async (): Promise<void> => {
    for (const transaction of await PendingEthereumTransactionRepository.getTransactions()) {
      const receipt = await this.provider.getTransactionReceipt(
        transaction.hash,
      );

      if (receipt && (await receipt.confirmations()) > 0) {
        this.logger.silly(
          `Removing confirmed ${this.networkDetails.name} transaction: ${transaction.hash}`,
        );
        await transaction.destroy();
      }
    }
  };
}

export default EthereumTransactionTracker;
