import { splitPairId } from '../Utils';
import ReferralRepository from '../db/repositories/ReferralRepository';
import { getNestedObject } from './Utils';

type Stats = Record<string, Record<string, Record<string, number>>>;

class ReferralStats {
  public static getReferralFees = async (
    referralKey?: string,
  ): Promise<Stats | Record<string, Stats>> => {
    const data = await ReferralRepository.getReferralSum(referralKey);
    const years = {};

    data.forEach((ref) => {
      let assets = getNestedObject(getNestedObject(years, ref.year), ref.month);

      if (referralKey === undefined) {
        assets = getNestedObject(assets, ref.referral);
      }

      const { quote } = splitPairId(ref.pair);
      assets[quote] = (assets[quote] || 0) + ref.sum;
    });

    return years;
  };
}

export default ReferralStats;
