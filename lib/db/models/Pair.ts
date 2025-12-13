import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';

type PairType = {
  id: string;
  base: string;
  quote: string;
};

class Pair extends Model implements PairType {
  declare id: string;
  declare base: string;
  declare quote: string;

  public static load = (sequelize: Sequelize): void => {
    Pair.init(
      {
        id: { type: new DataTypes.STRING(255), primaryKey: true },
        base: { type: new DataTypes.STRING(255), allowNull: false },
        quote: { type: new DataTypes.STRING(255), allowNull: false },
      },
      {
        sequelize,
        tableName: 'pairs',
        timestamps: false,
      },
    );
  };
}

export default Pair;
export { PairType };
