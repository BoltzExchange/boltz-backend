import { DataTypes, Model, Sequelize } from 'sequelize';
import Swap from './Swap';

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
      },
      {
        sequelize,
        modelName: 'pendingLockupTransaction',
        indexes: [
          {
            unique: false,
            fields: ['chain'],
          },
        ],
      },
    );

    PendingLockupTransaction.belongsTo(Swap, {
      foreignKey: 'swapId',
    });
  };
}

export default PendingLockupTransaction;
