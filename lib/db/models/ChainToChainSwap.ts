import { Model, Sequelize, DataTypes } from 'sequelize';
import Pair from './Pair';

type ChainToChainSwapType = {
  id: string;
  pair: string;
  orderSide: number;
  status: string;
  fee: number;

  preimage?: string;
  preimageHash: string;
  acceptZeroConf: boolean;

  sendingAmount: number;
  sendingMinerFee?: number;
  sendingKeyIndex: number;
  sendingRedeemScript: string;
  sendingLockupAddress: string;
  sendingTransactionId?: string;
  sendingTimeoutBlockHeight: number;

  receivingAmount: number;
  receivingMinerFee?: number;
  receivingKeyIndex: number;
  receivingRedeemScript: string;
  receivingLockupAddress: string;
  receivingTransactionId?: string;
  receivingTimeoutBlockHeight: number;
};

class ChainToChainSwap extends Model implements ChainToChainSwapType {
  public id!: string;
  public pair!: string;
  public orderSide!: number;
  public status!: string;
  public fee!: number;

  public preimage?: string;
  public preimageHash!: string;
  public acceptZeroConf!: boolean;

  public sendingAmount!: number;
  public sendingMinerFee?: number;
  public sendingKeyIndex!: number;
  public sendingRedeemScript!: string;
  public sendingLockupAddress!: string;
  public sendingTransactionId?: string;
  public sendingTimeoutBlockHeight!: number;

  public receivingAmount!: number;
  public receivingMinerFee?: number;
  public receivingKeyIndex!: number;
  public receivingRedeemScript!: string;
  public receivingLockupAddress!: string;
  public receivingTransactionId?: string;
  public receivingTimeoutBlockHeight!: number;

  public static load = (sequelize: Sequelize) => {
    ChainToChainSwap.init({
      id: { type: new DataTypes.STRING(255), primaryKey: true, allowNull: false },
      pair: { type: new DataTypes.STRING(255), allowNull: false },
      orderSide: { type: new DataTypes.INTEGER(), allowNull: false },
      status: { type: new DataTypes.STRING(255), allowNull: false },
      fee: { type: new DataTypes.INTEGER(), allowNull: false },
      preimage: { type: new DataTypes.STRING(255), allowNull: true },
      preimageHash: { type: new DataTypes.STRING(255), allowNull: false },
      acceptZeroConf: { type: DataTypes.BOOLEAN, allowNull: false },

      sendingAmount: { type: new DataTypes.INTEGER(), allowNull: false },
      sendingMinerFee: { type: new DataTypes.INTEGER(), allowNull: true },
      sendingKeyIndex: { type: new DataTypes.INTEGER(), allowNull: false },
      sendingRedeemScript: { type: new DataTypes.STRING(255), allowNull: false },
      sendingLockupAddress: { type: new DataTypes.STRING(255), allowNull: false },
      sendingTransactionId: { type: new DataTypes.STRING(255), allowNull: true },
      sendingTimeoutBlockHeight: { type: new DataTypes.INTEGER(), allowNull: false },

      receivingAmount: { type: new DataTypes.INTEGER(), allowNull: false },
      receivingMinerFee: { type: new DataTypes.INTEGER(), allowNull: true },
      receivingKeyIndex: { type: new DataTypes.INTEGER(), allowNull: false },
      receivingRedeemScript: { type: new DataTypes.STRING(255), allowNull: false },
      receivingLockupAddress: { type: new DataTypes.STRING(255), allowNull: false },
      receivingTransactionId: { type: new DataTypes.STRING(255), allowNull: true },
      receivingTimeoutBlockHeight: { type: new DataTypes.INTEGER(), allowNull: false },
    }, {
      sequelize,
      tableName: 'chainToChainSwaps',
      indexes: [
        {
          unique: true,
          fields: ['id', 'preimageHash'],
        },
      ],
    });

    ChainToChainSwap.belongsTo(Pair, {
      foreignKey: 'pair',
    });
  }
}

export default ChainToChainSwap;
export { ChainToChainSwapType };
