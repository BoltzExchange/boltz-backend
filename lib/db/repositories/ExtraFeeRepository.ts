import { QueryTypes } from 'sequelize';
import { satoshisToPaddedCoins } from '../../DenominationConverter';
import { FailedSwapUpdateEvents, SwapUpdateEvent } from '../../consts/Enums';
import type { MonthStats } from '../../data/Stats';
import { getNestedObject } from '../../data/Utils';
import Database from '../Database';
import type { ExtraFeeType } from '../models/ExtraFee';
import ExtraFee from '../models/ExtraFee';

type GroupedByYearMonth<T> = Record<string, Record<string, T>>;

export type ExtraFeeStats = {
  year: string;
  month: string;
  id: string;
  pair: string | null;
  swap_count: number;
  volume: string;
  failure_rate_submarine: number;
  failure_rate_reverse: number;
  failure_rate_chain: number;
};

class ExtraFeeRepository {
  private static readonly feeQuery = `
WITH successful AS (SELECT id, status, referral, "createdAt"
                    FROM swaps
                    WHERE status = ?
                    UNION ALL
                    SELECT id, status, referral, "createdAt"
                    FROM "reverseSwaps"
                    WHERE status = ?
                    UNION ALL
                    SELECT id, status, referral, "createdAt"
                    FROM "chainSwaps"
                    WHERE status = ?),
     successful_extra AS (SELECT e.id AS id, e.fee AS fee, e."createdAt"
                          FROM successful s
                                   RIGHT JOIN extra_fees e on s.id = e."swapId"
                          WHERE referral = ?)
SELECT EXTRACT(YEAR FROM "createdAt") AS year, EXTRACT(MONTH FROM "createdAt") AS month, id, SUM(fee) AS fee
FROM successful_extra
GROUP BY year, month, id
ORDER BY year, month, id;
`;

  private static readonly statsQuery = `
WITH swaps AS (SELECT id,
                      'submarine' as type,
                      status,
                      referral,
                      pair,
                      CASE
                          WHEN "orderSide" = 1
                              THEN "invoiceAmount"
                          ELSE "onchainAmount"
                          END     AS amount,
                      "createdAt"
               FROM swaps
               UNION ALL
               SELECT id,
                      'reverse' as type,
                      status,
                      referral,
                      pair,
                      CASE
                          WHEN "orderSide" = 1
                              THEN "onchainAmount"
                          ELSE "invoiceAmount"
                          END   AS amount,
                      "createdAt"
               FROM "reverseSwaps"
               UNION ALL
               SELECT id, 'chain' as type, status, referral, pair, d.amount AS amount, c."createdAt"
               FROM "chainSwaps" c
                        INNER JOIN "chainSwapData" d
                                   ON d."swapId" = c.id AND
                                      d.symbol = CASE
                                                     WHEN "orderSide" = 0
                                                         THEN SPLIT_PART(pair, '/', 1)
                                                     ELSE SPLIT_PART(pair, '/', 2)
                                          END),
     extra AS (SELECT e.id AS id, e.fee AS fee, s.type, s.pair, s.status, s.amount, e."createdAt"
               FROM swaps s
                        RIGHT JOIN extra_fees e on s.id = e."swapId"
               WHERE referral = ?)
SELECT EXTRACT(YEAR FROM "createdAt")  AS year,
       EXTRACT(MONTH FROM "createdAt") AS month,
       id,
       pair,
       COUNT(*)
       FILTER (WHERE status IN (?))    AS swap_count,
       COALESCE(SUM(amount) FILTER (WHERE status IN (?)),
                0)                     AS volume,
       COALESCE(COUNT(*) FILTER (WHERE type = 'submarine' AND status IN (?))::float8 /
                NULLIF(COUNT(*) FILTER (WHERE type = 'submarine'), 0),
                0)                     AS failure_rate_submarine,
       COALESCE(COUNT(*) FILTER (WHERE type = 'reverse' AND status IN (?))::float8 /
                NULLIF(COUNT(*) FILTER (WHERE type = 'reverse'), 0),
                0)                     AS failure_rate_reverse,
       COALESCE(COUNT(*) FILTER (WHERE type = 'chain' AND status IN (?))::float8 /
                NULLIF(COUNT(*) FILTER (WHERE type = 'chain'), 0),
                0)                     AS failure_rate_chain
FROM extra
GROUP BY GROUPING SETS ((year, month, id, pair), (year, month, id))
ORDER BY year, month, id, pair NULLS FIRST;
  `;

  public static mergeStats = (
    stats: GroupedByYearMonth<MonthStats>,
    extraStats: ExtraFeeStats[],
  ): GroupedByYearMonth<
    MonthStats & { groups?: Record<string, MonthStats> }
  > => {
    // Create a deep copy to avoid mutating the original stats
    const mergedStats = JSON.parse(JSON.stringify(stats));

    extraStats.forEach((extraStat) => {
      const yearObj = getNestedObject(mergedStats, extraStat.year);
      const monthObj = getNestedObject(yearObj, extraStat.month);

      const groupsObj = getNestedObject(monthObj, 'groups');
      const groupObj = getNestedObject(groupsObj, extraStat.id);

      if (!groupObj.volume) {
        groupObj.volume = {};
      }
      if (!groupObj.trades) {
        groupObj.trades = {};
      }
      if (!groupObj.failureRates) {
        groupObj.failureRates = {};
      }

      const pairKey = extraStat.pair || 'total';
      groupObj.volume[pairKey] = satoshisToPaddedCoins(
        Number(extraStat.volume),
      );
      groupObj.trades[pairKey] = extraStat.swap_count;

      // We are only interested in the total failure rates, not the one by pair
      if (extraStat.pair === null) {
        if (extraStat.failure_rate_chain > 0) {
          groupObj.failureRates.chain = extraStat.failure_rate_chain;
        }
        if (extraStat.failure_rate_reverse > 0) {
          groupObj.failureRates.reverse = extraStat.failure_rate_reverse;
        }
        if (extraStat.failure_rate_submarine > 0) {
          groupObj.failureRates.submarine = extraStat.failure_rate_submarine;
        }
      }
    });

    return mergedStats;
  };

  public static create = async (
    extraFee: Omit<ExtraFeeType, 'fee'> & { fee?: number },
  ): Promise<void> => {
    await ExtraFee.create(extraFee);
  };

  public static get = async (id: string): Promise<ExtraFeeType | null> => {
    return await ExtraFee.findByPk(id);
  };

  public static setFee = async (id: string, fee: number): Promise<void> => {
    await ExtraFee.update({ fee }, { where: { swapId: id } });
  };

  public static getFeesByReferral = async (
    id: string,
  ): Promise<GroupedByYearMonth<number>> => {
    const fees = (await Database.sequelize.query(
      {
        query: ExtraFeeRepository.feeQuery,
        values: [
          SwapUpdateEvent.TransactionClaimed,
          SwapUpdateEvent.InvoiceSettled,
          SwapUpdateEvent.TransactionClaimed,
          id,
        ],
      },
      {
        type: QueryTypes.SELECT,
      },
    )) as { year: number; month: number; id: string; fee: number }[];

    const res = {};

    fees.forEach((stat) => {
      const monthObj = getNestedObject(
        getNestedObject(res, stat.year),
        stat.month,
      );
      monthObj[stat.id] = Number(stat.fee);
    });

    return res;
  };

  public static getStatsByReferral = async (
    referralId: string,
  ): Promise<ExtraFeeStats[]> => {
    return (await Database.sequelize.query(
      {
        query: ExtraFeeRepository.statsQuery,
        values: [
          referralId,
          [SwapUpdateEvent.InvoiceSettled, SwapUpdateEvent.TransactionClaimed],
          [SwapUpdateEvent.InvoiceSettled, SwapUpdateEvent.TransactionClaimed],
          FailedSwapUpdateEvents,
          FailedSwapUpdateEvents,
          FailedSwapUpdateEvents,
        ],
      },
      { type: QueryTypes.SELECT },
    )) as ExtraFeeStats[];
  };
}

export default ExtraFeeRepository;
