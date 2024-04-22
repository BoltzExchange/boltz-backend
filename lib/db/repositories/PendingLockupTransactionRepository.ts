import PendingLockupTransaction from '../models/PendingLockupTransaction';

class PendingLockupTransactionRepository {
  public static create = (swapId: string, chain: string) =>
    PendingLockupTransaction.create({ swapId, chain });

  public static destroy = async (swapId: string) =>
    PendingLockupTransaction.destroy({
      where: {
        swapId,
      },
    });

  public static getForChain = (chain: string) =>
    PendingLockupTransaction.findAll({
      where: {
        chain,
      },
    });
}

export default PendingLockupTransactionRepository;
