import { Model, Sequelize, DataTypes } from 'sequelize';
import Pair from './Pair';

type ReverseSwapType = {
  id: string;

  lockupAddress: string;

  keyIndex?: number;
  redeemScript?: string;

  claimAddress?: string

  fee: number;
  minerFee?: number;

  pair: string;
  orderSide: number;

  status: string;
  timeoutBlockHeight: number;

  invoice: string;
  minerFeeInvoice?: string;

  preimageHash: string;
  preimage?: string;

  onchainAmount: number;
  transactionId?: string;
  transactionVout?: number;
};

class ReverseSwap extends Model implements ReverseSwapType {
  public id!: string;

  public lockupAddress!: string;

  public keyIndex?: number;
  public redeemScript?: string;

  public claimAddress?: string;

  public fee!: number;
  public minerFee!: number;

  public pair!: string;
  public orderSide!: number;

  public status!: string;
  public timeoutBlockHeight!: number;

  public invoice!: string;
  public minerFeeInvoice?: string;

  public preimageHash!: string;
  public preimage?: string;

  public onchainAmount!: number;
  public transactionId?: string;
  public transactionVout?: number;

  public createdAt!: string;
  public updatedAt!: string;

  public static load = (sequelize: Sequelize): void => {
    ReverseSwap.init({
      id: { type: new DataTypes.STRING(255), primaryKey: true, allowNull: false },
      lockupAddress: { type: new DataTypes.STRING(255), allowNull: false },
      keyIndex: { type: new DataTypes.INTEGER(), allowNull: true },
      redeemScript: { type: new DataTypes.STRING(255), allowNull: true },
      claimAddress: { type: new DataTypes.STRING(255), allowNull: true },
      fee: { type: new DataTypes.INTEGER(), allowNull: false },
      minerFee: { type: new DataTypes.INTEGER(), allowNull: true },
      pair: { type: new DataTypes.STRING(255), allowNull: false },
      orderSide: { type: new DataTypes.INTEGER(), allowNull: false },
      status: { type: new DataTypes.STRING(255), allowNull: false },
      timeoutBlockHeight: { type: new DataTypes.INTEGER(), allowNull: false },
      invoice: { type: new DataTypes.STRING(255), allowNull: false, unique: true },
      minerFeeInvoice: { type: new DataTypes.STRING(255), allowNull: true, unique: true },
      preimageHash: { type: new DataTypes.STRING(255), allowNull: false, unique: true },
      preimage: { type: new DataTypes.STRING(255), allowNull: true },
      onchainAmount: { type: new DataTypes.INTEGER(), allowNull: false },
      transactionId: { type: new DataTypes.STRING(255), allowNull: true },
      transactionVout: { type: new DataTypes.INTEGER(), allowNull: true },
    }, {
      sequelize,
      tableName: 'reverseSwaps',
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
        {
          unique: true,
          fields: ['minerFeeInvoice'],
        },
      ],
    });

    ReverseSwap.belongsTo(Pair, {
      foreignKey: 'pair',
    });
  }
}

export default ReverseSwap;
export { ReverseSwapType };
