import PendingEthereumTransaction from '../models/PendingEthereumTransaction';

class PendingEthereumTransactionRepository {
  public static getTransactions = (): Promise<PendingEthereumTransaction[]> => {
    return PendingEthereumTransaction.findAll();
  };

  public static addTransaction = (hash: string, nonce: number): Promise<PendingEthereumTransaction> => {
    return PendingEthereumTransaction.create({
      hash,
      nonce,
    });
  };
}

export default PendingEthereumTransactionRepository;
