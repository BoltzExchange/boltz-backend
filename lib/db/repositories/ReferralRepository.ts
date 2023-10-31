import { QueryTypes } from 'sequelize';
import { Queries } from '../Utils';
import { StatsDate } from './StatsRepository';
import Database, { DatabaseType } from '../Database';
import Referral, { ReferralType } from '../models/Referral';
import { SuccessSwapUpdateEvents } from '../../consts/Enums';

type ReferralSumRow = StatsDate & {
  pair: string;
  referral: string;
  sum: number;
};

class ReferralRepository {
  private static readonly referralSumQuery: Queries = {
    // language=PostgreSQL
    [DatabaseType.PostgreSQL]: `
WITH data AS (
    SELECT pair, status, fee, referral, "createdAt" FROM swaps
    UNION ALL
    SELECT pair, status, fee, referral, "createdAt" FROM "reverseSwaps"
)
SELECT
    EXTRACT(YEAR from data."createdAt") AS year,
    EXTRACT(MONTH from data."createdAt") AS month,
    pair,
    data.referral as referral,
    (SUM(data.fee * r."feeShare") / 100)::BIGINT AS sum
FROM data
    INNER JOIN referrals r ON data.referral = r.id
WHERE data.status IN (?)
GROUP BY year, month, pair, data.referral
ORDER BY year, month;
    `,

    // language=SQLite
    [DatabaseType.SQLite]: `
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
WHERE data.status IN (?)
GROUP BY year, month, pair, referral
ORDER BY year, month;
`,
  };

  public static addReferral = (referral: ReferralType): Promise<Referral> => {
    return Referral.create(referral);
  };

  public static getReferrals = (): Promise<Referral[]> => {
    return Referral.findAll();
  };

  public static getReferralByApiKey = (
    apiKey: string,
  ): Promise<Referral | null> => {
    return Referral.findOne({
      where: {
        apiKey,
      },
    });
  };

  public static getReferralByRoutingNode = (
    routingNode: string,
  ): Promise<Referral | null> => {
    return Referral.findOne({
      where: {
        routingNode,
      },
    });
  };

  public static getReferralSum = async (
    referralKey?: string,
  ): Promise<ReferralSumRow[]> => {
    const res: ReferralSumRow[] = await Database.sequelize.query(
      {
        query: ReferralRepository.referralSumQuery[Database.type],
        values: [SuccessSwapUpdateEvents],
      },
      {
        type: QueryTypes.SELECT,
      },
    );

    if (referralKey) {
      return res.filter((row) => row.referral === referralKey);
    }

    return res;
  };
}

export default ReferralRepository;
export { ReferralType };
