import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';

class Rebroadcast extends Model {
  public rawTransaction!: string;
  public symbol!: string;

  public static load = (sequelize: Sequelize) => {
    Rebroadcast.init(
      {
        rawTransaction: {
          type: new DataTypes.TEXT(),
          primaryKey: true,
          allowNull: false,
        },
        symbol: {
          type: new DataTypes.STRING(255),
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: 'rebroadcasts',
        indexes: [{ fields: ['symbol'], unique: false }],
      },
    );
  };
}

export default Rebroadcast;
