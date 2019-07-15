import { Model, Sequelize, DataTypes } from 'sequelize';

type WalletType = {
  symbol: string;

  derivationPath: string;
  highestUsedIndex: number;

  blockHeight: number;
};

class Wallet extends Model implements WalletType {
  public symbol!: string;

  public derivationPath!: string;
  public highestUsedIndex!: number;

  public blockHeight!: number;

  public static load = (sequelize: Sequelize) => {
    Wallet.init({
      symbol: { type: new DataTypes.STRING(255), primaryKey: true, allowNull: false },
      derivationPath: { type: new DataTypes.STRING(255), allowNull: false },
      highestUsedIndex: { type: new DataTypes.INTEGER(), allowNull: false },
      blockHeight: { type: new DataTypes.INTEGER(), allowNull: false },
    }, {
      sequelize,
      timestamps: false,
      tableName: 'wallets',
    });
  }
}

export default Wallet;
export { WalletType };
