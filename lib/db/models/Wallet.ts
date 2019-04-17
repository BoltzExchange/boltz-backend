import { Model, Sequelize, DataTypes } from 'sequelize';

class Wallet extends Model {
  public symbol!: string;

  public highestUsedIndex!: number;
  public derivationPath!: string;

  public blockHeight!: number;

  public static load = (sequelize: Sequelize) => {
    Wallet.init({
      symbol: { type: DataTypes.STRING(255), primaryKey: true, allowNull: false },
      highestUsedIndex: { type: DataTypes.INTEGER, allowNull: false },
      derivationPath: { type: DataTypes.STRING(255), allowNull: false },
      blockHeight: { type: DataTypes.INTEGER, allowNull: false },
    }, {
      sequelize,
      timestamps: false,
      tableName: 'wallets',
    });
  }
}

export default Wallet;
