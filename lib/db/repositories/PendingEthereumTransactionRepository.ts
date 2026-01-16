import type { WhereOptions } from 'sequelize';
import PendingEthereumTransaction from '../models/PendingEthereumTransaction';

class PendingEthereumTransactionRepository {
  public static getTransactions = (
    chain?: string,
  ): Promise<PendingEthereumTransaction[]> => {
    const where: WhereOptions<PendingEthereumTransaction> = {};

    if (chain !== undefined && chain !== null) {
      where.chain = chain;
    }

    return PendingEthereumTransaction.findAll({
      where,
    });
  };

  public static getHighestNonce = async (
    chain: string,
  ): Promise<number | undefined> => {
    const nonce = await PendingEthereumTransaction.max<
      number,
      PendingEthereumTransaction
    >('nonce', {
      where: {
        chain,
      },
    });
    if (nonce === null || nonce === undefined) {
      return undefined;
    }

    return nonce + 1;
  };

  public static getTotalSent = async (chain: string): Promise<bigint> => {
    return BigInt(
      (await PendingEthereumTransaction.sum<number, PendingEthereumTransaction>(
        'etherAmount',
        {
          where: {
            chain,
          },
        },
      )) ?? 0,
    );
  };

  public static addTransaction = (
    hash: string,
    chain: string,
    nonce: number,
    etherAmount: bigint,
    hex: string,
  ): Promise<PendingEthereumTransaction> => {
    return PendingEthereumTransaction.create({
      hash,
      chain,
      nonce,
      etherAmount,
      hex,
    });
  };
}

export default PendingEthereumTransactionRepository;
