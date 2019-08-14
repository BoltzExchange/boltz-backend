import { Model, Sequelize, DataTypes } from 'sequelize';
import Pair from './Pair';

type ReverseSwapType = {
  id: string;

  keyIndex: number;
  redeemScript: string;

  fee: number;
  minerFee: number;

  pair: string;
  orderSide: number;

  status?: string;
  timeoutBlockHeight: number;

  invoice: string;
  preimage?: string;

  onchainAmount: number;
  transactionId: string;
};

class ReverseSwap extends Model implements ReverseSwapType {
  public id!: string;

  public keyIndex!: number;
  public redeemScript!: string;

  public fee!: number;
  public minerFee!: number;

  public pair!: string;
  public orderSide!: number;

  public status?: string;
  public timeoutBlockHeight!: number;

  public invoice!: string;
  public preimage?: string;

  public onchainAmount!: number;
  public transactionId!: string;

  public createdAt!: string;
  public updatedAt!: string;

  public static load = (sequelize: Sequelize) => {
    ReverseSwap.init({
      id: { type: new DataTypes.STRING(255), primaryKey: true, allowNull: false },
      keyIndex: { type: new DataTypes.INTEGER(), allowNull: false },
      redeemScript: { type: new DataTypes.STRING(255), allowNull: false },
      fee: { type: new DataTypes.INTEGER(), allowNull: false },
      minerFee: { type: new DataTypes.INTEGER(), allowNull: false },
      pair: { type: new DataTypes.STRING(255), allowNull: false },
      orderSide: { type: new DataTypes.INTEGER(), allowNull: false },
      status: { type: new DataTypes.STRING(255), allowNull: true },
      timeoutBlockHeight: { type: new DataTypes.INTEGER(), allowNull: false },
      invoice: { type: new DataTypes.STRING(255), allowNull: false },
      preimage: { type: new DataTypes.STRING(255), allowNull: true },
      onchainAmount: { type: new DataTypes.INTEGER(), allowNull: false },
      transactionId: { type: new DataTypes.STRING(255), allowNull: false },
    }, {
      sequelize,
      tableName: 'reverseSwaps',
    });

    ReverseSwap.belongsTo(Pair, {
      foreignKey: 'pair',
    });
  }
}

export default ReverseSwap;
export { ReverseSwapType };
