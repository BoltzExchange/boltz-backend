import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';

type KeyProviderType = {
  symbol: string;

  derivationPath: string;
  highestUsedIndex: number;
};

class KeyProvider extends Model implements KeyProviderType {
  declare symbol: string;

  declare derivationPath: string;
  declare highestUsedIndex: number;

  public static load = (sequelize: Sequelize): void => {
    KeyProvider.init(
      {
        symbol: {
          type: new DataTypes.STRING(255),
          primaryKey: true,
          allowNull: false,
        },
        derivationPath: { type: new DataTypes.STRING(255), allowNull: false },
        highestUsedIndex: { type: new DataTypes.INTEGER(), allowNull: false },
      },
      {
        sequelize,
        tableName: 'keys',
        timestamps: false,
      },
    );
  };
}

export default KeyProvider;
export { KeyProviderType };
