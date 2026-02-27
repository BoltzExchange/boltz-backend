import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import Swap from './Swap';

enum LightningPaymentStatus {
  Pending = 0,
  Success = 1,
  PermanentFailure = 2,
  TemporaryFailure = 3,
}

type LightningPaymentType = {
  preimageHash: string;
  nodeId: string;
  status: LightningPaymentStatus;
  error?: string;
  retries: number | null;
};

class LightningPayment extends Model implements LightningPaymentType {
  declare preimageHash: string;
  declare nodeId: string;
  declare status: LightningPaymentStatus;
  declare error?: string;
  declare retries: number | null;

  declare createdAt: Date;
  declare updatedAt: Date;

  public static load = (sequelize: Sequelize) => {
    LightningPayment.init(
      {
        preimageHash: {
          type: new DataTypes.STRING(64),
          allowNull: false,
          primaryKey: true,
        },
        nodeId: {
          type: new DataTypes.STRING(255),
          allowNull: false,
          primaryKey: true,
        },
        status: {
          type: new DataTypes.INTEGER(),
          allowNull: false,
          validate: {
            isIn: [
              Object.values(LightningPaymentStatus).filter(
                (val) => typeof val === 'number',
              ),
            ],
          },
        },
        error: {
          type: new DataTypes.STRING(),
          allowNull: true,
        },
        retries: {
          type: new DataTypes.INTEGER(),
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'lightningPayments',
        indexes: [
          {
            unique: false,
            fields: ['preimageHash'],
          },
        ],
      },
    );

    LightningPayment.belongsTo(Swap, {
      targetKey: 'preimageHash',
      foreignKey: 'preimageHash',
    });
  };
}

export default LightningPayment;
export { LightningPaymentStatus, LightningPaymentType };
