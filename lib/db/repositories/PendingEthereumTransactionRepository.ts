import PendingEthereumTransaction from '../models/PendingEthereumTransaction';

class PendingEthereumTransactionRepository {
  public getTransactions = (): Promise<PendingEthereumTransaction[]> => {
    return PendingEthereumTransaction.findAll();
  };

  public addTransaction = (hash: string, nonce: number): Promise<PendingEthereumTransaction> => {
    return PendingEthereumTransaction.create({
      hash,
      nonce,
    });
  };
}

export default PendingEthereumTransactionRepository;
