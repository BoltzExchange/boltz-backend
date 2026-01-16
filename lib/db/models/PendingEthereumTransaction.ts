import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';

type PendingEthereumTransactionType = {
  hash: string;
  chain: string;
  nonce: number;
  etherAmount: number;
  hex: string;
};

class PendingEthereumTransaction
  extends Model
  implements PendingEthereumTransactionType
{
  declare hash: string;
  declare chain: string;
  declare nonce: number;
  declare etherAmount: number;
  declare hex: string;

  public static load = (sequelize: Sequelize): void => {
    PendingEthereumTransaction.init(
      {
        hash: {
          type: new DataTypes.STRING(255),
          primaryKey: true,
          allowNull: false,
        },
        chain: {
          type: new DataTypes.STRING(255),
          allowNull: false,
        },
        nonce: {
          type: new DataTypes.INTEGER(),
          allowNull: false,
        },
        etherAmount: {
          type: new DataTypes.DECIMAL(),
          allowNull: false,
        },
        hex: {
          type: new DataTypes.TEXT(),
          allowNull: false,
        },
      },
      {
        sequelize,
        timestamps: false,
        tableName: 'pendingEthereumTransactions',
        indexes: [
          {
            unique: true,
            fields: ['hash'],
          },
          {
            unique: true,
            fields: ['chain', 'nonce'],
          },
        ],
      },
    );
  };
}

export default PendingEthereumTransaction;
export { PendingEthereumTransactionType };
