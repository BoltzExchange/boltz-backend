import { QueryTypes } from 'sequelize';
import {
  OrderSide,
  SuccessSwapUpdateEvents,
  SwapType,
} from '../../consts/Enums';
import Database from '../Database';
import Referral, {
  DirectionalPremium,
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

  private static readonly maxPremiumPercentage = 100;
  private static readonly minPremiumPercentage = -100;
  private static readonly minExpiration = 120;
  private static readonly maxExpiration = 60 * 60 * 24;
  private static readonly minRoutingFee = 0;
  private static readonly maxRoutingFee = 0.005;

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
    const validateDirectionalPremium = (
      premium: unknown,
    ): DirectionalPremium => {
      if (typeof premium === 'object') {
        const premiumObj = premium as Record<string, unknown>;
        if (
          (OrderSide.BUY in premiumObj &&
            typeof premiumObj[OrderSide.BUY] !== 'number') ||
          (OrderSide.SELL in premiumObj &&
            typeof premiumObj[OrderSide.SELL] !== 'number')
        ) {
          throw 'premium values must be numbers';
        }
      }

      return premium as DirectionalPremium;
    };

    const sanityCheckPairConfig = (cfg: ReferralPairConfig) => {
      if (
        cfg.maxRoutingFee !== undefined &&
        (cfg.maxRoutingFee < ReferralRepository.minRoutingFee ||
          cfg.maxRoutingFee > ReferralRepository.maxRoutingFee)
      ) {
        throw 'maxRoutingFee out of range';
      }

      if (cfg.premiums) {
        for (const [typeStr, premium] of Object.entries(cfg.premiums)) {
          const type = Number(typeStr) as SwapType;

          if (type === SwapType.Chain) {
            const directionalPremium = validateDirectionalPremium(premium);
            Object.values(directionalPremium).forEach((p) => {
              if (
                p < ReferralRepository.minPremiumPercentage ||
                p > ReferralRepository.maxPremiumPercentage
              ) {
                throw 'premium out of range';
              }
            });
          } else {
            if (typeof premium !== 'number') {
              throw 'premium must be a number';
            }
            if (
              premium < ReferralRepository.minPremiumPercentage ||
              premium > ReferralRepository.maxPremiumPercentage
            ) {
              throw 'premium out of range';
            }
          }
        }
      }

      if (cfg.expirations) {
        if (
          Object.values(cfg.expirations).some(
            (e) =>
              e < ReferralRepository.minExpiration ||
              e > ReferralRepository.maxExpiration,
          )
        ) {
          throw 'expiration out of range';
        }
      }
    };

    if (config) {
      sanityCheckPairConfig(config);

      if (config.pairs) {
        Object.values(config.pairs).forEach(sanityCheckPairConfig);
      }
    }
  };
}

export default ReferralRepository;
export { ReferralType };
