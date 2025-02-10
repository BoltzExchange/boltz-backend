import { QueryTypes } from 'sequelize';
import { SuccessSwapUpdateEvents } from '../../consts/Enums';
import Database from '../Database';
import Referral, {
  ReferralConfig,
  ReferralPairConfig,
  ReferralType,
} from '../models/Referral';
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

  public static addReferral = async (
    referral: ReferralType,
  ): Promise<Referral> => {
    ReferralRepository.sanityCheckConfig(referral.config);

    return await Referral.create(referral);
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

  public static setConfig = async (
    ref: Referral,
    config?: ReferralConfig | null,
  ) => {
    ReferralRepository.sanityCheckConfig(config);

    return await ref.update({
      config: config === undefined ? null : config,
    });
  };

  private static sanityCheckConfig = (
    config: ReferralConfig | null | undefined,
  ) => {
    const sanityCheckPairConfig = (cfg: ReferralPairConfig) => {
      if (cfg.maxRoutingFee) {
        if (cfg.maxRoutingFee < 0 || cfg.maxRoutingFee > 0.005) {
          throw 'maxRoutingFee out of range';
        }
      }

      if (cfg.premiums) {
        if (Object.values(cfg.premiums).some((p) => p < -100 || p > 100)) {
          throw 'premium out of range';
        }
      }

      if (cfg.expirations) {
        if (
          Object.values(cfg.expirations).some(
            (e) => e < 120 || e > 60 * 60 * 24,
          )
        ) {
          throw 'expiration out of range';
        }
      }
    };

    if (config) {
      sanityCheckPairConfig(config);

      if (config.pairs) {
        for (const pair of Object.values(config.pairs)) {
          sanityCheckPairConfig(pair);
        }
      }
    }
  };
}

export default ReferralRepository;
export { ReferralType };
