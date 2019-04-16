import { Model, Sequelize, DataTypes } from 'sequelize';
import Wallet from './Wallet';

class Output extends Model {
  public id!: number;

  public script!: string;
  public redeemScript!: string | null;

  public currency!: string;
  public keyIndex!: number;

  public type!: number;

  public static load = (sequelize: Sequelize) => {
    Output.init({
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      script: { type: new DataTypes.STRING(255), allowNull: false },
      redeemScript: { type: new DataTypes.STRING(255), allowNull: true },
      currency: { type: new DataTypes.STRING(255), allowNull: false },
      keyIndex: { type: DataTypes.INTEGER, allowNull: false },
      type: { type: DataTypes.BOOLEAN, allowNull: false },
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
