import { Model, Sequelize, DataTypes } from 'sequelize';

type ChainTipType = {
  symbol: string;
  height: string;
};

class ChainTip extends Model implements ChainTipType {
  public height!: string;
  public symbol!: string;

  public static load = (sequelize: Sequelize): void => {
    ChainTip.init({
      symbol: { type: new DataTypes.STRING(255), primaryKey: true },
      height: { type: new DataTypes.INTEGER(), allowNull: false },
    }, {
      sequelize,
      timestamps: false,
      tableName: 'chainTips',
    });
  }
}

export default ChainTip;
export { ChainTipType };
