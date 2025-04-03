import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';

type TransactionLabelType = {
  id: string;
  symbol: string;
  label: string;
};

class TransactionLabel extends Model implements TransactionLabelType {
  public id!: string;
  public symbol!: string;
  public label!: string;

  public static load = (sequelize: Sequelize) => {
    TransactionLabel.init(
      {
        id: {
          type: DataTypes.STRING(255),
          primaryKey: true,
        },
        symbol: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        label: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: 'transaction_labels',
      },
    );
  };
}

export default TransactionLabel;
