import { Model, Sequelize, DataTypes } from 'sequelize';

type PairType = {
  id: string;
  base: string;
  quote: string;
};

class Pair extends Model implements PairType {
  public id!: string;
  public base!: string;
  public quote!: string;

  public static load = (sequelize: Sequelize) => {
    Pair.init({
      id: { type: new DataTypes.STRING(255), primaryKey: true },
      base: { type: new DataTypes.STRING(255), allowNull: false },
      quote: { type: new DataTypes.STRING(255), allowNull: false },
    }, {
      sequelize,
      tableName: 'pairs',
      timestamps: false,
    });
  }
}

export default Pair;
export { PairType };
