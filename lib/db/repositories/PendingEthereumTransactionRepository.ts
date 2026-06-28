import { UniqueConstraintError, type WhereOptions } from 'sequelize';
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

  // Idempotent on the hash: the signer writes the row under its lock, then
  // broadcastTransaction writes the same row again after broadcasting.
  public static addTransaction = async (
    hash: string,
    chain: string,
    nonce: number,
    etherAmount: bigint,
    hex: string,
  ): Promise<PendingEthereumTransaction> => {
    try {
      const [transaction] = await PendingEthereumTransaction.findOrCreate({
        where: { hash },
        defaults: {
          hash,
          chain,
          nonce,
          etherAmount,
          hex,
        },
      });
      return transaction;
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new Error(
          `nonce ${nonce} on ${chain} already used by another transaction`,
        );
      }
      throw error;
    }
  };
}

export default PendingEthereumTransactionRepository;
