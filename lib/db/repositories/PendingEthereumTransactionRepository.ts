import { Op } from 'sequelize';
import PendingEthereumTransaction from '../models/PendingEthereumTransaction';

class PendingEthereumTransactionRepository {
  public findByNonce = (nonce: number): Promise<PendingEthereumTransaction[]> => {
    return PendingEthereumTransaction.findAll({
      where: {
        nonce: {
          [Op.lte]: nonce,
        },
      }
    });
  }

  public addTransaction = (hash: string, nonce: number): Promise<PendingEthereumTransaction> => {
    return PendingEthereumTransaction.create({
      hash,
      nonce,
    });
  }
}

export default PendingEthereumTransactionRepository;
