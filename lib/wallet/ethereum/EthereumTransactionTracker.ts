import type { Signer } from 'ethers';
import type Logger from '../../Logger';
import PendingEthereumTransactionRepository from '../../db/repositories/PendingEthereumTransactionRepository';
import type { NetworkDetails } from './EvmNetworks';
import type InjectedProvider from './InjectedProvider';

class EthereumTransactionTracker {
  constructor(
    private readonly logger: Logger,
    private readonly networkDetails: NetworkDetails,
    private readonly provider: InjectedProvider,
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
    const transactions =
      await PendingEthereumTransactionRepository.getTransactions(
        this.networkDetails.symbol,
      );
    if (transactions.length === 0) {
      return;
    }

    // A pending row below the confirmed nonce is orphaned: its own hash never
    // confirmed, so the nonce went to a different tx
    const confirmedNonce = await this.provider.getConfirmedTransactionCount(
      await this.wallet.getAddress(),
    );

    for (const transaction of transactions) {
      const receipt = await this.provider.getTransactionReceipt(
        transaction.hash,
      );

      if (receipt !== null) {
        this.logger.silly(
          `Removing confirmed ${this.networkDetails.name} transaction: ${transaction.hash}`,
        );
        await transaction.destroy();
      } else if (transaction.nonce < confirmedNonce) {
        this.logger.warn(
          `Pruning orphaned ${this.networkDetails.name} transaction ${transaction.hash} (nonce ${transaction.nonce} already settled on chain)`,
        );
        await transaction.destroy();
      }
    }
  };
}

export default EthereumTransactionTracker;
