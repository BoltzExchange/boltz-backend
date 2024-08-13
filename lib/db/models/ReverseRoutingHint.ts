import { DataTypes, Model, Sequelize } from 'sequelize';
import ReverseSwap from './ReverseSwap';

type ReverseRoutingHintsType = {
  swapId: string;
  bip21: string;
  signature: string;
};

class ReverseRoutingHint extends Model {
  public swapId!: string;

  public bip21!: string;
  public signature!: string;

  public static load = (sequelize: Sequelize) => {
    ReverseRoutingHint.init(
      {
        swapId: {
          type: new DataTypes.STRING(255),
          primaryKey: true,
          allowNull: false,
        },
        bip21: { type: new DataTypes.TEXT(), allowNull: false },
        signature: { type: new DataTypes.STRING(255), allowNull: false },
      },
      {
        sequelize,
        tableName: 'reverseRoutingHints',
      },
    );

    ReverseRoutingHint.belongsTo(ReverseSwap, {
      foreignKey: 'swapId',
    });
  };
}

export default ReverseRoutingHint;
export { ReverseRoutingHintsType };
