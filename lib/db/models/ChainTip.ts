import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';

type ChainTipType = {
  symbol: string;
  height: number;
};

class ChainTip extends Model implements ChainTipType {
  declare symbol: string;
  declare height: number;

  public static load = (sequelize: Sequelize): void => {
    ChainTip.init(
      {
        symbol: { type: new DataTypes.STRING(255), primaryKey: true },
        height: { type: new DataTypes.INTEGER(), allowNull: false },
      },
      {
        sequelize,
        timestamps: false,
        tableName: 'chainTips',
      },
    );
  };
}

export default ChainTip;
export { ChainTipType };
