import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import Swap from './Swap';

type ChannelCreationType = {
  swapId: string;

  status?: string;

  type: string;
  private: boolean;
  inboundLiquidity: number;

  nodePublicKey?: string;
  fundingTransactionId?: string;
  fundingTransactionVout?: number;
};

class ChannelCreation extends Model implements ChannelCreationType {
  declare swapId: string;

  declare status?: string;

  declare type: string;
  declare private: boolean;
  declare inboundLiquidity: number;

  declare nodePublicKey?: string;
  declare fundingTransactionId?: string;
  declare fundingTransactionVout?: number;

  public static load = (sequelize: Sequelize): void => {
    ChannelCreation.init(
      {
        swapId: {
          type: new DataTypes.STRING(255),
          primaryKey: true,
          allowNull: false,
        },
        status: { type: new DataTypes.STRING(255), allowNull: true },
        type: { type: new DataTypes.STRING(255), allowNull: false },
        private: { type: DataTypes.BOOLEAN, allowNull: false },
        nodePublicKey: { type: new DataTypes.STRING(255), allowNull: true },
        inboundLiquidity: { type: new DataTypes.INTEGER(), allowNull: false },
        fundingTransactionId: {
          type: new DataTypes.STRING(255),
          allowNull: true,
        },
        fundingTransactionVout: {
          type: new DataTypes.INTEGER(),
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'channelCreations',
        indexes: [
          {
            unique: true,
            fields: ['swapId'],
          },
        ],
      },
    );

    ChannelCreation.belongsTo(Swap, {
      foreignKey: 'swapId',
    });
  };
}

export default ChannelCreation;
export { ChannelCreationType };
