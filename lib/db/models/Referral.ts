import { Model, Sequelize, DataTypes } from 'sequelize';

type ReferralType = {
  id: string;

  apiKey: string;
  apiSecret: string;

  feeShare: number;
  routingNode?: string;
};

class Referral extends Model implements ReferralType {
  public id!: string;

  public apiKey!: string;
  public apiSecret!: string;

  public feeShare!: number;
  public routingNode?: string;

  public static load = (sequelize: Sequelize): void => {
    Referral.init({
      id: { type: new DataTypes.STRING(255), primaryKey: true, allowNull: false },
      apiKey: { type: new DataTypes.STRING(255), unique: true, allowNull: false },
      apiSecret: { type: new DataTypes.STRING(255), unique: true, allowNull: false },
      feeShare: { type: new DataTypes.INTEGER(), allowNull: false },
      routingNode: { type: new DataTypes.STRING(), allowNull: true, unique: true },
    }, {
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
    });
  }
}

export default Referral;
export { ReferralType };
