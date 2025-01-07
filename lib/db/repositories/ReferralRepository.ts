import { QueryTypes } from 'sequelize';
import { SuccessSwapUpdateEvents } from '../../consts/Enums';
import Database from '../Database';
import Referral, { ReferralConfig, ReferralType } from '../models/Referral';
import { StatsDate } from './StatsRepository';

type ReferralSumRow = StatsDate & {
  pair: string;
  referral: string;
  sum: number;
};

class ReferralRepository {
  private static readonly referralSumQuery =
    // language=PostgreSQL
    `
        WITH data AS (SELECT pair, status, fee, referral, "createdAt"
                      FROM swaps
                      UNION ALL
                      SELECT pair, status, fee, referral, "createdAt"
                      FROM "reverseSwaps"
                      UNION ALL
                      SELECT pair, status, fee, referral, "createdAt"
                      FROM "chainSwaps")
        SELECT EXTRACT(YEAR from data."createdAt")          AS year,
               EXTRACT(MONTH from data."createdAt")         AS month,
               pair,
               data.referral                                as referral,
               (SUM(data.fee * r."feeShare") / 100)::BIGINT AS sum
        FROM data
                 INNER JOIN referrals r ON data.referral = r.id
        WHERE data.status IN (?)
        GROUP BY year, month, pair, data.referral
        ORDER BY year, month;
    `;

  public static addReferral = (referral: ReferralType): Promise<Referral> => {
    return Referral.create(referral);
  };

  public static getReferrals = (): Promise<Referral[]> => {
    return Referral.findAll();
  };

  public static getReferralById = (id: string): Promise<Referral | null> => {
    return Referral.findOne({
      where: {
        id,
      },
    });
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
        query: ReferralRepository.referralSumQuery,
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

  public static setConfig = (ref: Referral, config?: ReferralConfig | null) =>
    ref.update({
      config: config === undefined ? null : config,
    });
}

export default ReferralRepository;
export { ReferralType };
