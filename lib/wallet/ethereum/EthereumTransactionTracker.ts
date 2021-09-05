import { BigNumber, providers, Signer } from 'ethers';
import Logger from '../../Logger';
import PendingEthereumTransactionRepository from '../../db/repositories/PendingEthereumTransactionRepository';

class EthereumTransactionTracker {
  private pendingEthereumTransactionRepository = new PendingEthereumTransactionRepository();

  private walletAddress!: string;

  constructor(
    private logger: Logger,
    private provider: providers.Provider,
    private wallet: Signer,
  ) {}

  public init = async (): Promise<void> => {
    this.walletAddress = (await this.wallet.getAddress()).toLowerCase();
    this.logger.info(`Starting Ethereum transaction tracker for address: ${this.walletAddress}`);

    await this.scanBlock(await this.provider.getBlockNumber());
  }

  /**
   * Scans a block and removes pending transactions from the database in case they were confirmed
   * This method is public and gets called from "EthereumManager" because there is a block subscription
   * in that class already
   */
  public scanBlock = async (blockNumber: number): Promise<void> => {
    const block = await this.provider.getBlockWithTransactions(blockNumber);

    for (const transaction of block.transactions) {
      if (transaction.from.toLowerCase() === this.walletAddress) {
        const confirmedTransactions = await this.pendingEthereumTransactionRepository.findByNonce(
          BigNumber.from(transaction.nonce).toNumber(),
        );

        if (confirmedTransactions.length > 0) {
          this.logger.debug(`Removing ${confirmedTransactions.length} confirmed Ethereum transactions`);

          for (const confirmedTransaction of confirmedTransactions) {
            this.logger.silly(`Removing confirmed Ethereum transaction: ${confirmedTransaction.hash}`);
            await confirmedTransaction.destroy();
          }
        }
      }
    }
  }
}

export default EthereumTransactionTracker;
