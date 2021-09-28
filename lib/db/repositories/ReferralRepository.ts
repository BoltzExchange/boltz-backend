import Referral, { ReferralType } from '../models/Referral';

class ReferralRepository {
  public static addReferral = (referral: ReferralType): Promise<Referral> => {
    return Referral.create(referral);
  }

  public static getReferrals = (): Promise<Referral[]> => {
    return Referral.findAll();
  }

  public static getReferralByApiKey = (apiKey: string): Promise<Referral | null> => {
    return Referral.findOne({
      where: {
        apiKey,
      },
    });
  }

  public static getReferralByRoutingNode = (routingNode: string): Promise<Referral | null> => {
    return Referral.findOne({
      where: {
        routingNode,
      },
    });
  }
}

export default ReferralRepository;
