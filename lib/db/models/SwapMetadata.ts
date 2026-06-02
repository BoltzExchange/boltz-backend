import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';

export type SwapMetadataType = {
  swapId: string;
  data: Buffer;
};

class SwapMetadata extends Model implements SwapMetadataType {
  declare swapId: string;
  declare data: Buffer;

  declare createdAt: Date;

  public static load = (sequelize: Sequelize): void => {
    SwapMetadata.init(
      {
        swapId: {
          type: new DataTypes.STRING(255),
          primaryKey: true,
          allowNull: false,
          field: 'swap_id',
        },
        data: {
          type: new DataTypes.BLOB(),
          allowNull: false,
        },
        createdAt: {
          type: new DataTypes.DATE(),
          allowNull: false,
          defaultValue: DataTypes.NOW,
          field: 'created_at',
        },
      },
      {
        sequelize,
        tableName: 'swap_metadata',
        timestamps: false,
      },
    );
  };
}

export default SwapMetadata;
