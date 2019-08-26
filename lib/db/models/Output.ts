import { Model, Sequelize, DataTypes } from 'sequelize';
import Wallet from './Wallet';

type OutputType = {
  currency: string;

  type: number;

  keyIndex: number;
  script: string;
  redeemScript: string | null;
};

class Output extends Model implements OutputType {
  public id!: number;

  public currency!: string;

  public type!: number;

  public keyIndex!: number;
  public script!: string;
  public redeemScript!: string | null;

  public static load = (sequelize: Sequelize) => {
    Output.init({
      id: { type: new DataTypes.INTEGER(), primaryKey: true, autoIncrement: true },
      currency: { type: new DataTypes.STRING(255), allowNull: false },
      type: { type: new DataTypes.INTEGER(), allowNull: false },
      keyIndex: { type: new DataTypes.INTEGER(), allowNull: false },
      script: { type: new DataTypes.STRING(255), allowNull: false },
      redeemScript: { type: new DataTypes.STRING(255), allowNull: true },
    }, {
      sequelize,
      timestamps: false,
      tableName: 'outputs',
    });

    Output.belongsTo(Wallet, {
      foreignKey: 'currency',
    });
  }
}

export default Output;
export { OutputType };
