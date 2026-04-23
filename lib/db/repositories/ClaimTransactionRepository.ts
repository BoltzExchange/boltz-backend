import { Op } from 'sequelize';
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
