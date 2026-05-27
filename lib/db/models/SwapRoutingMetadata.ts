import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';

export type SwapRoutingMetadataType = {
  swapId: string;
  data: Buffer;
};

class SwapRoutingMetadata extends Model implements SwapRoutingMetadataType {
  declare swapId: string;
  declare data: Buffer;

  declare createdAt: Date;
  declare updatedAt: Date;

  public static load = (sequelize: Sequelize): void => {
    SwapRoutingMetadata.init(
      {
        swapId: {
          type: new DataTypes.STRING(255),
          primaryKey: true,
          allowNull: false,
        },
        data: {
          type: new DataTypes.BLOB(),
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: 'swap_routing_metadata',
      },
    );
  };
}

export default SwapRoutingMetadata;
