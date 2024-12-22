import { DataTypes, Model, Sequelize } from 'sequelize';
import { SwapType } from '../../consts/Enums';

type ReferralType = {
  id: string;

  apiKey: string;
  apiSecret: string;

  feeShare: number;
  routingNode?: string;

  submarinePremium?: number;
  reversePremium?: number;
  chainPremium?: number;
};

class Referral extends Model implements ReferralType {
  public id!: string;

  public apiKey!: string;
  public apiSecret!: string;

  public feeShare!: number;
  public routingNode?: string;

  public submarinePremium?: number;
  public reversePremium?: number;
  public chainPremium?: number;

  public static load = (sequelize: Sequelize): void => {
    Referral.init(
      {
        id: {
          type: new DataTypes.STRING(255),
          primaryKey: true,
          allowNull: false,
        },
        apiKey: {
          type: new DataTypes.STRING(255),
          unique: true,
          allowNull: false,
        },
        apiSecret: {
          type: new DataTypes.STRING(255),
          unique: true,
          allowNull: false,
        },
        feeShare: { type: new DataTypes.INTEGER(), allowNull: false },
        routingNode: {
          type: new DataTypes.STRING(),
          allowNull: true,
          unique: true,
        },
        submarinePremium: { type: new DataTypes.INTEGER(), allowNull: true },
        reversePremium: { type: new DataTypes.INTEGER(), allowNull: true },
        chainPremium: { type: new DataTypes.INTEGER(), allowNull: true },
      },
      {
        sequelize,
        tableName: 'referrals',
        indexes: [
          {
            unique: true,
            fields: ['id'],
          },
          {
            unique: true,
            fields: ['apiKey'],
          },
        ],
      },
    );
  };

  public premiumForType = (type: SwapType) => {
    switch (type) {
      case SwapType.Submarine:
        return this.submarinePremium;

      case SwapType.ReverseSubmarine:
        return this.reversePremium;

      case SwapType.Chain:
        return this.chainPremium;
    }
  };
}

export default Referral;
export { ReferralType };
