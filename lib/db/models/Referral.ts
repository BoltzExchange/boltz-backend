import { Model, Sequelize, DataTypes } from 'sequelize';

type ReferralType = {
  id: string;

  feeShare: number;
  routingNode?: string;
};

class Referral extends Model implements ReferralType {
  public id!: string;

  public feeShare!: number;
  public routingNode?: string;

  public static load = (sequelize: Sequelize): void => {
    Referral.init({
      id: { type: new DataTypes.STRING(255), primaryKey: true, allowNull: false },
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
      ],
    });
  }
}

export default Referral;
export { ReferralType };
