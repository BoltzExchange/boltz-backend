import { Op } from 'sequelize';
import type Logger from '../../Logger';
import { formatError } from '../../Utils';
import ClaimTransaction, {
  type ClaimTransactionType,
} from '../models/ClaimTransaction';

class ClaimTransactionRepository {
  public static addTransaction = async (
    claimTransaction: ClaimTransactionType,
  ) => {
    const tx = await ClaimTransaction.upsert(claimTransaction, {
      returning: true,
    });

    return tx[0];
  };

  public static persistTransaction = async (
    logger: Logger,
    claimTransaction: ClaimTransactionType,
  ) => {
    try {
      await ClaimTransactionRepository.addTransaction(claimTransaction);
    } catch (err) {
      logger.error(
        `Could not persist claim transaction for swap ${claimTransaction.swapId}: ${formatError(err)}`,
      );
    }
  };

  public static getTransactionForSwap = async (swapId: string) => {
    return await ClaimTransaction.findOne({ where: { swapId } });
  };

  public static getTransactionsForSwaps = async (swapIds: string[]) => {
    if (swapIds.length === 0) {
      return [];
    }

    return await ClaimTransaction.findAll({
      where: { swapId: { [Op.in]: swapIds } },
    });
  };
}

export default ClaimTransactionRepository;
