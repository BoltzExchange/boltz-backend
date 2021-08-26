import { Op } from 'sequelize';
import Referral, { ReferralType } from '../models/Referral';

class ReferralRepository {
  public addReferral = (referral: ReferralType): Promise<Referral> => {
    return Referral.create(referral);
  }

  public getReferrals = (): Promise<Referral[]> => {
    return Referral.findAll();
  }

  public getReferralByRoutingNode = (routingNode: string): Promise<Referral | null> => {
    return Referral.findOne({
      where: {
        routingNode: {
          [Op.eq]: routingNode,
        },
      },
    });
  }
}

export default ReferralRepository;
