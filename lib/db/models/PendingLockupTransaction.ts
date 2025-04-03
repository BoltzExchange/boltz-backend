import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';

export type PendingLockupTransactionType = {
  swapId: string;
  chain: string;
};

class PendingLockupTransaction
  extends Model
  implements PendingLockupTransactionType
{
  public swapId!: string;
  public chain!: string;

  public static load = (sequelize: Sequelize) => {
    PendingLockupTransaction.init(
      {
        swapId: {
          type: new DataTypes.STRING(255),
          primaryKey: true,
          allowNull: false,
        },
        chain: {
          type: new DataTypes.STRING(255),
          allowNull: false,
        },
        transaction: {
          type: new DataTypes.TEXT(),
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: 'pendingLockupTransactions',
        indexes: [
          {
            unique: false,
            fields: ['chain'],
          },
        ],
      },
    );
  };
}

export default PendingLockupTransaction;
