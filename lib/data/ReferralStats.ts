import { splitPairId } from '../Utils';
import ReferralRepository from '../db/repositories/ReferralRepository';
import { getNestedObject } from './Utils';

class ReferralStats {
  public static generate = async (
    referralKey?: string,
  ): Promise<
    Record<string, Record<string, Record<string, Record<string, number>>>>
  > => {
    const data = await ReferralRepository.getReferralSum(referralKey);
    const years = {};

    data.forEach((ref) => {
      const assets = getNestedObject(
        getNestedObject(getNestedObject(years, ref.year), ref.month),
        ref.referral,
      );

      const { quote } = splitPairId(ref.pair);
      assets[quote] = (assets[quote] || 0) + ref.sum;
    });

    return years;
  };
}

export default ReferralStats;
