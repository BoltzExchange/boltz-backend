import { Model, Sequelize, DataTypes } from 'sequelize';
import Pair from './Pair';

type SwapType = {
  id: string;

  keyIndex?: number;
  redeemScript?: string;

  fee?: number;
  routingFee?: number;
  minerFee?: number;

  pair: string;
  orderSide: number;

  status: string;

  preimageHash: string;
  invoice?: string;

  acceptZeroConf?: boolean;
  timeoutBlockHeight: number;
  rate?: number;
  expectedAmount?: number;
  onchainAmount?: number;
  lockupAddress: string;
  lockupTransactionId?: string;
};

class Swap extends Model implements SwapType {
  public id!: string;

  public keyIndex?: number;
  public redeemScript?: string;

  public fee?: number;
  public routingFee?: number;
  public minerFee?: number;

  public pair!: string;
  public orderSide!: number;

  public status!: string;

  public preimageHash!: string;
  public invoice?: string;

  public acceptZeroConf?: boolean;
  public timeoutBlockHeight!: number;
  public rate?: number;
  public expectedAmount?: number;
  public onchainAmount?: number;
  public lockupAddress!: string;
  public lockupTransactionId?: string;

  public createdAt!: string;
  public updatedAt!: string;

  public static load = (sequelize: Sequelize): void => {
    Swap.init({
      id: { type: new DataTypes.STRING(255), primaryKey: true, allowNull: false },
      keyIndex: { type: new DataTypes.INTEGER(), allowNull: true },
      redeemScript: { type: new DataTypes.STRING(255), allowNull: true },
      fee: { type: new DataTypes.INTEGER(), allowNull: true },
      routingFee: { type: new DataTypes.INTEGER(), allowNull: true },
      minerFee: { type: new DataTypes.INTEGER(), allowNull: true },
      pair: { type: new DataTypes.STRING(255), allowNull: false },
      orderSide: { type: new DataTypes.INTEGER(), allowNull: false },
      status: { type: new DataTypes.STRING(255), allowNull: false },
      preimageHash: { type: new DataTypes.STRING(255), allowNull: false, unique: true },
      invoice: { type: new DataTypes.STRING(255), allowNull: true, unique: true },
      acceptZeroConf: { type: DataTypes.BOOLEAN, allowNull: true },
      timeoutBlockHeight: { type: new DataTypes.INTEGER(), allowNull: false },
      rate: { type: new DataTypes.REAL(), allowNull: true },
      expectedAmount: { type: new DataTypes.INTEGER(), allowNull: true },
      onchainAmount: { type: new DataTypes.INTEGER(), allowNull: true },
      lockupAddress: { type: new DataTypes.STRING(255), allowNull: false },
      lockupTransactionId: { type: new DataTypes.STRING(255), allowNull: true },
    }, {
      sequelize,
      tableName: 'swaps',
      indexes: [
        {
          unique: true,
          fields: ['id'],
        },
        {
          unique: true,
          fields: ['preimageHash'],
        },
        {
          unique: true,
          fields: ['invoice'],
        },
      ],
    });

    Swap.belongsTo(Pair, {
      foreignKey: 'pair',
    });
  }
}

export default Swap;
export { SwapType };
