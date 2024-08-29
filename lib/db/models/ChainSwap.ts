import { DataTypes, Model, Sequelize } from 'sequelize';
import Pair from './Pair';

type ChainSwapType = {
  id: string;

  fee: number;
  referral?: string;

  pair: string;
  orderSide: number;

  status: string;
  failureReason?: string;

  acceptZeroConf: boolean;

  preimageHash: string;
  preimage?: string;

  createdRefundSignature: boolean;
};

class ChainSwap extends Model implements ChainSwapType {
  public id!: string;

  public fee!: number;
  public referral?: string;

  public pair!: string;
  public orderSide!: number;

  public status!: string;
  public failureReason?: string;

  public acceptZeroConf!: boolean;

  public preimageHash!: string;
  public preimage?: string;

  public createdRefundSignature!: boolean;

  public createdAt!: Date;
  public updatedAt!: Date;

  public static load = (sequelize: Sequelize): void => {
    ChainSwap.init(
      {
        id: {
          type: new DataTypes.STRING(255),
          primaryKey: true,
          allowNull: false,
        },
        pair: { type: new DataTypes.STRING(255), allowNull: false },
        orderSide: { type: new DataTypes.INTEGER(), allowNull: false },
        fee: { type: new DataTypes.BIGINT(), allowNull: false },
        referral: { type: new DataTypes.STRING(255), allowNull: true },
        status: { type: new DataTypes.STRING(255), allowNull: false },
        failureReason: { type: new DataTypes.STRING(255), allowNull: true },
        acceptZeroConf: { type: new DataTypes.BOOLEAN(), allowNull: false },
        preimageHash: {
          type: new DataTypes.STRING(64),
          allowNull: false,
          unique: true,
        },
        preimage: { type: new DataTypes.STRING(64), allowNull: true },
        createdRefundSignature: {
          type: DataTypes.BOOLEAN(),
          allowNull: false,
          defaultValue: false,
        },
      },
      {
        sequelize,
        tableName: 'chainSwaps',
        indexes: [
          {
            unique: true,
            fields: ['id'],
          },
          {
            unique: false,
            fields: ['status'],
          },
          {
            unique: true,
            fields: ['preimageHash'],
          },
          {
            unique: false,
            fields: ['referral'],
          },
        ],
      },
    );

    ChainSwap.belongsTo(Pair, {
      foreignKey: 'pair',
    });
  };
}

export default ChainSwap;
export { ChainSwapType };
