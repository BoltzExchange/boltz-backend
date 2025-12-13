import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import { SwapType } from '../../consts/Enums';
import ChainSwap from './ChainSwap';

type ChainSwapDataType = {
  swapId: string;
  symbol: string;

  keyIndex?: number;
  lockupAddress: string;

  timeoutBlockHeight: number;

  theirPublicKey?: string;
  swapTree?: string;

  claimAddress?: string;

  expectedAmount: number;
  amount?: number;
  fee?: number;

  transactionId?: string;
  transactionVout?: number;
};

class ChainSwapData extends Model implements ChainSwapDataType {
  declare swapId: string;
  declare symbol: string;

  declare keyIndex?: number;
  declare lockupAddress: string;

  declare timeoutBlockHeight: number;

  declare theirPublicKey?: string;
  declare swapTree?: string;

  declare claimAddress?: string;

  declare expectedAmount: number;
  declare amount?: number;
  declare fee?: number;

  declare transactionId?: string;
  declare transactionVout?: number;

  declare createdAt: Date;
  declare updatedAt: Date;

  public static load = (sequelize: Sequelize): void => {
    ChainSwapData.init(
      {
        swapId: {
          type: new DataTypes.STRING(255),
          primaryKey: true,
          allowNull: false,
        },
        symbol: {
          type: new DataTypes.STRING(255),
          primaryKey: true,
          allowNull: false,
        },
        keyIndex: { type: new DataTypes.INTEGER(), allowNull: true },
        lockupAddress: { type: new DataTypes.STRING(255), allowNull: false },
        timeoutBlockHeight: { type: new DataTypes.INTEGER(), allowNull: false },
        theirPublicKey: { type: new DataTypes.STRING(), allowNull: true },
        swapTree: { type: new DataTypes.TEXT(), allowNull: true },
        claimAddress: { type: new DataTypes.STRING(255), allowNull: true },
        expectedAmount: { type: new DataTypes.BIGINT(), allowNull: false },
        amount: { type: new DataTypes.BIGINT(), allowNull: true },
        fee: { type: new DataTypes.BIGINT(), allowNull: true },
        transactionId: { type: new DataTypes.STRING(255), allowNull: true },
        transactionVout: { type: new DataTypes.INTEGER(), allowNull: true },
      },
      {
        sequelize,
        tableName: 'chainSwapData',
        indexes: [
          {
            unique: false,
            fields: ['swapId'],
          },
          {
            unique: false,
            fields: ['lockupAddress'],
          },
          {
            unique: false,
            fields: ['transactionId'],
          },
          {
            unique: false,
            fields: ['theirPublicKey'],
          },
        ],
      },
    );

    ChainSwapData.belongsTo(ChainSwap, {
      foreignKey: 'swapId',
    });
  };

  get type() {
    return SwapType.Chain;
  }

  get lockupTransactionId() {
    return this.transactionId;
  }

  get redeemScript() {
    return this.swapTree;
  }
}

export default ChainSwapData;
export { ChainSwapDataType };
