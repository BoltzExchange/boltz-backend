import { QueryTypes } from 'sequelize';
import Database from '../Database';
import {StatsDate} from './StatsRepository';
import { arrayToSqlInClause } from '../Utils';
import Referral, { ReferralType } from '../models/Referral';
import { SuccessSwapUpdateEvents } from '../../consts/Enums';

type ReferralSumRow = StatsDate & {
  pair: string;
  referral: string;
  sum: number;
};

class ReferralRepository {
  public static addReferral = (referral: ReferralType): Promise<Referral> => {
    return Referral.create(referral);
  };

  public static getReferrals = (): Promise<Referral[]> => {
    return Referral.findAll();
  };

  public static getReferralByApiKey = (apiKey: string): Promise<Referral | null> => {
    return Referral.findOne({
      where: {
        apiKey,
      },
    });
  };

  public static getReferralByRoutingNode = (routingNode: string): Promise<Referral | null> => {
    return Referral.findOne({
      where: {
        routingNode,
      },
    });
  };

  public static getReferralSum = (referralKey?: string): Promise<ReferralSumRow[]> => {
    return Database.sequelize.query(this.referralsQuery(referralKey), {
      replacements: referralKey !== undefined ? [referralKey] : [],
      type: QueryTypes.SELECT,
    });
  };

  private static referralsQuery = (referralKey?: string): string => {
    const keyClause = referralKey !== undefined ? 'AND referral = ?' : '';
    return `
WITH data AS (
    SELECT pair, status, fee, referral, createdAt FROM swaps
    UNION ALL
    SELECT pair, status, fee, referral, createdAt FROM reverseSwaps
)
SELECT
    CAST(STRFTIME('%Y', data.createdAt) AS INT) AS year,
    CAST(STRFTIME('%m', data.createdAt) AS INT) AS month,
    pair,
    referral,
    SUM(data.fee * referrals.feeShare) / 100 AS sum
FROM data
    INNER JOIN referrals ON data.referral = referrals.id
WHERE data.status IN (
    ${arrayToSqlInClause(SuccessSwapUpdateEvents)}
) ${keyClause}
GROUP BY pair, referral, year, month
ORDER BY year, month;
`;
  };
}

export default ReferralRepository;
export {
  ReferralType
};
