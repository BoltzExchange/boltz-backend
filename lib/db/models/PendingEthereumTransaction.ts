import { DataTypes, Model, Sequelize } from 'sequelize';

type PendingEthereumTransactionType = {
  hash: string;
  nonce: number;
};

class PendingEthereumTransaction
  extends Model
  implements PendingEthereumTransactionType
{
  public hash!: string;
  public nonce!: number;

  public static load = (sequelize: Sequelize): void => {
    PendingEthereumTransaction.init(
      {
        hash: {
          type: new DataTypes.STRING(255),
          primaryKey: true,
          allowNull: false,
        },
        nonce: {
          type: new DataTypes.INTEGER(),
          unique: true,
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
            fields: ['nonce'],
          },
        ],
      },
    );
  };
}

export default PendingEthereumTransaction;
export { PendingEthereumTransactionType };
