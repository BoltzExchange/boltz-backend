import { Transaction } from 'sequelize';
import Database from '../Database';
import type { CommitmentType } from '../models/Commitment';
import Commitment from '../models/Commitment';

class CommitmentRepository {
  public static create = async (
    commitment: CommitmentType,
  ): Promise<Commitment> => {
    return await Database.sequelize.transaction(
      {
        isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
      },
      async (transaction) => {
        return await Commitment.create(commitment, { transaction });
      },
    );
  };

  public static getBySwapId = async (
    swapId: string,
  ): Promise<Commitment | null> => {
    return await Commitment.findOne({
      where: {
        swapId,
      },
    });
  };

  public static getByTransactionHashAndLogIndex = async (
    transactionHash: string,
    logIndex: number,
  ): Promise<Commitment | null> => {
    return await Commitment.findOne({
      where: {
        transactionHash,
        logIndex,
      },
    });
  };
}

export default CommitmentRepository;
