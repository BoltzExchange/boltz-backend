import PendingLockupTransaction from '../models/PendingLockupTransaction';

class PendingLockupTransactionRepository {
  public static create = (
    swapId: string,
    chain: string,
    transactionHex: string,
  ) =>
    PendingLockupTransaction.create({
      swapId,
      chain,
      transaction: transactionHex,
    });

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
