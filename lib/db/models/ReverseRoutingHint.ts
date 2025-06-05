import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import ReverseSwap from './ReverseSwap';

type ReverseRoutingHintsType = {
  swapId: string;
  address: string;
  symbol: string;
  params: string;
  signature: string;
};

class ReverseRoutingHint extends Model {
  public swapId!: string;

  public address!: string;
  public symbol!: string;
  public params!: string;
  public signature!: string;

  public static load = (sequelize: Sequelize) => {
    ReverseRoutingHint.init(
      {
        swapId: {
          type: new DataTypes.STRING(255),
          primaryKey: true,
          allowNull: false,
        },
        address: { type: new DataTypes.TEXT(), allowNull: false },
        symbol: { type: new DataTypes.TEXT(), allowNull: false },
        params: { type: new DataTypes.TEXT(), allowNull: false },
        signature: { type: new DataTypes.STRING(255), allowNull: false },
      },
      {
        sequelize,
        tableName: 'reverseRoutingHints',
      },
    );

    ReverseRoutingHint.belongsTo(ReverseSwap, {
      foreignKey: 'swapId',
    });
  };
}

export default ReverseRoutingHint;
export { ReverseRoutingHintsType };
