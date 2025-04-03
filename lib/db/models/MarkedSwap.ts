import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';

type SwapType = {
  id: string;
};

class MarkedSwap extends Model implements SwapType {
  public id!: string;

  public createdAt!: Date;
  public updatedAt!: Date;

  public static load = (sequelize: Sequelize): void => {
    MarkedSwap.init(
      {
        id: {
          type: new DataTypes.STRING(255),
          primaryKey: true,
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: 'markedSwaps',
      },
    );
  };
}

export default MarkedSwap;
