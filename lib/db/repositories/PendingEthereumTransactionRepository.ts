import PendingEthereumTransaction from '../models/PendingEthereumTransaction';

class PendingEthereumTransactionRepository {
  public static getTransactions = (): Promise<PendingEthereumTransaction[]> => {
    return PendingEthereumTransaction.findAll();
  };

  public static getHighestNonce = async (): Promise<number | undefined> => {
    const nonce = await PendingEthereumTransaction.max<
      number,
      PendingEthereumTransaction
    >('nonce');
    if (nonce === null || nonce === undefined) {
      return undefined;
    }

    return nonce + 1;
  };

  public static addTransaction = (
    hash: string,
    nonce: number,
  ): Promise<PendingEthereumTransaction> => {
    return PendingEthereumTransaction.create({
      hash,
      nonce,
    });
  };
}

export default PendingEthereumTransactionRepository;
