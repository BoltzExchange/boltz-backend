import { Model, Sequelize, DataTypes } from 'sequelize';

type KeyProviderType = {
  symbol: string;

  derivationPath: string;
  highestUsedIndex: number;
};

class KeyProvider extends Model implements KeyProviderType {
  public symbol!: string;

  public derivationPath!: string;
  public highestUsedIndex!: number;

  public static load = (sequelize: Sequelize) => {
    KeyProvider.init({
      symbol: { type: new DataTypes.STRING(255), primaryKey: true, allowNull: false },
      derivationPath: { type: new DataTypes.STRING(255), allowNull: false },
      highestUsedIndex: { type: new DataTypes.INTEGER(), allowNull: false },
    }, {
      sequelize,
      timestamps: false,
      tableName: 'keys',
    });
  }
}

export default KeyProvider;
export { KeyProviderType };
