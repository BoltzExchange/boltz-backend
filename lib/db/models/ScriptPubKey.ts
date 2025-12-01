import { DataTypes, Model, type Sequelize } from 'sequelize';

type ScriptPubKeyType = {
  swap_id: string;
  symbol: string;
  script_pubkey: Buffer;
};

class ScriptPubKey extends Model implements ScriptPubKeyType {
  public swap_id!: string;
  public symbol!: string;
  public script_pubkey!: Buffer;

  public static load = (sequelize: Sequelize): void => {
    ScriptPubKey.init(
      {
        swap_id: {
          type: new DataTypes.STRING(255),
          primaryKey: true,
          allowNull: false,
        },
        symbol: {
          type: new DataTypes.STRING(255),
          primaryKey: true,
          allowNull: false,
        },
        script_pubkey: {
          type: new DataTypes.BLOB(),
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: 'script_pubkeys',
        indexes: [
          {
            fields: ['script_pubkey'],
            unique: false,
            using: 'HASH',
          },
        ],
      },
    );
  };
}

export default ScriptPubKey;
export { ScriptPubKeyType };
