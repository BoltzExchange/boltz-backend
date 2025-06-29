import { DataTypes, Model, type Sequelize } from 'sequelize';

enum RefundStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Failed = 'failed',
}

type RefundTransactionType = {
  swapId: string;
  id: string;
  vin?: number;
  status: RefundStatus;
};

class RefundTransaction extends Model implements RefundTransactionType {
  public swapId!: string;
  public id!: string;
  public vin!: number;
  public status!: RefundStatus;

  public static load = (sequelize: Sequelize): void => {
    RefundTransaction.init(
      {
        swapId: {
          type: new DataTypes.STRING(255),
          primaryKey: true,
          allowNull: false,
        },
        id: {
          type: new DataTypes.STRING(255),
          allowNull: false,
        },
        vin: {
          type: new DataTypes.INTEGER(),
          allowNull: true,
        },
        status: {
          type: new DataTypes.STRING(255),
          allowNull: false,
        },
      },
      {
        sequelize,
        timestamps: true,
        tableName: 'refund_transactions',
        indexes: [
          {
            using: 'HASH',
            unique: false,
            fields: ['id'],
          },
          {
            using: 'HASH',
            unique: false,
            fields: ['status'],
          },
        ],
      },
    );
  };
}

export default RefundTransaction;
export { RefundTransactionType, RefundStatus };
