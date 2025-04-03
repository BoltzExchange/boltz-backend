import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';

type ExtraFeeType = {
  swapId: string;
  id: string;
  fee: number;
  percentage: number;
};

class ExtraFee extends Model implements ExtraFeeType {
  public swapId!: string;
  public id!: string;
  public fee!: number;
  public percentage!: number;

  public createdAt!: Date;
  public updatedAt!: Date;

  public static load = (sequelize: Sequelize): void => {
    ExtraFee.init(
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
        fee: {
          type: new DataTypes.BIGINT(),
          allowNull: true,
        },
        percentage: {
          type: new DataTypes.DECIMAL(),
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: 'extra_fees',
        indexes: [
          {
            unique: false,
            fields: ['id'],
          },
        ],
      },
    );
  };
}

export default ExtraFee;
export { ExtraFeeType };
