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

  public static getTotalSent = async (): Promise<bigint> => {
    return BigInt(
      (await PendingEthereumTransaction.sum<number, PendingEthereumTransaction>(
        'etherAmount',
      )) ?? 0,
    );
  };

  public static addTransaction = (
    hash: string,
    nonce: number,
    etherAmount: bigint,
    hex: string,
  ): Promise<PendingEthereumTransaction> => {
    return PendingEthereumTransaction.create({
      hash,
      nonce,
      etherAmount,
      hex,
    });
  };
}

export default PendingEthereumTransactionRepository;
