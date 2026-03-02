import { Op, Transaction } from 'sequelize';
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

  public static getBySwapIds = async (
    swapIds: string[],
  ): Promise<Map<string, Commitment>> => {
    const commitments = await Commitment.findAll({
      where: {
        swapId: {
          [Op.in]: swapIds,
        },
      },
    });
    return new Map(
      commitments
        .filter((c): c is Commitment & { swapId: string } => c.swapId !== null)
        .map((c) => [c.swapId, c]),
    );
  };

  public static getByLockupHash = async (
    lockupHash: string,
  ): Promise<Commitment | null> => {
    return await Commitment.findOne({
      where: {
        lockupHash,
      },
    });
  };

  public static linkToSwap = async (
    lockupHash: string,
    swapId: string,
  ): Promise<Commitment> => {
    return await Database.sequelize.transaction(
      {
        isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
      },
      async (transaction) => {
        const commitment = await Commitment.findOne({
          where: { lockupHash },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        if (commitment === null) {
          throw new Error('commitment not found');
        }
        if (commitment.refunded) {
          throw new Error('refunded commitment cannot be linked to a swap');
        }
        if (commitment.swapId !== null && commitment.swapId !== swapId) {
          throw new Error('commitment linked to a different swap already');
        }

        commitment.swapId = swapId;
        await commitment.save({ transaction });
        return commitment;
      },
    );
  };

  public static markRefunded = async (
    lockupHash: string,
    transactionHash: string,
  ): Promise<Commitment> => {
    return await Database.sequelize.transaction(
      {
        isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
      },
      async (transaction) => {
        const existing = await Commitment.findOne({
          where: { lockupHash },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        if (existing !== null) {
          if (existing.swapId !== null) {
            throw new Error('linked commitment cannot be marked as refunded');
          }

          existing.refunded = true;
          existing.transactionHash = transactionHash;
          await existing.save({ transaction });
          return existing;
        }

        return await Commitment.create(
          {
            lockupHash,
            transactionHash,
            refunded: true,
          },
          { transaction },
        );
      },
    );
  };
}

export default CommitmentRepository;
