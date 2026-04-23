import { DataTypes, Model, type Sequelize } from 'sequelize';

type ClaimTransactionType = {
  swapId: string;
  symbol: string;
  id: string;
};

class ClaimTransaction extends Model implements ClaimTransactionType {
  declare swapId: string;
  declare symbol: string;
  declare id: string;

  public static load = (sequelize: Sequelize): void => {
    ClaimTransaction.init(
      {
        swapId: {
          type: new DataTypes.STRING(255),
          primaryKey: true,
          allowNull: false,
        },
        symbol: {
          type: new DataTypes.STRING(255),
          allowNull: false,
        },
        id: {
          type: new DataTypes.STRING(255),
          allowNull: false,
        },
      },
      {
        sequelize,
        timestamps: true,
        underscored: true,
        tableName: 'claim_transactions',
      },
    );
  };
}

export default ClaimTransaction;
export { ClaimTransactionType };
