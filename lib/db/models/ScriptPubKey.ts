import { DataTypes, Model, type Sequelize } from 'sequelize';

type ScriptPubKeyType = {
  symbol: string;
  script_pubkey: Buffer;
  swap_id: string;
};

class ScriptPubKey extends Model implements ScriptPubKeyType {
  declare symbol: string;
  declare script_pubkey: Buffer;
  declare swap_id: string;

  public static load = (sequelize: Sequelize): void => {
    ScriptPubKey.init(
      {
        symbol: {
          type: new DataTypes.STRING(255),
          primaryKey: true,
          allowNull: false,
        },
        script_pubkey: {
          type: new DataTypes.BLOB(),
          primaryKey: true,
          allowNull: false,
        },
        swap_id: {
          type: new DataTypes.STRING(255),
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
