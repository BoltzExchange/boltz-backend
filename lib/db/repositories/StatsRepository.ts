import { QueryTypes } from 'sequelize';
import Database from '../Database';
import { arrayToSqlInClause } from '../Utils';
import {
  FailedSwapUpdateEvents,
  SuccessSwapUpdateEvents,
} from '../../consts/Enums';

type StatsDate = {
  year: number;
  month: number;
};

type Volume = StatsDate & {
  asset: string;
  sum: number;
};

type TradeCount = StatsDate & {
  pair: string;
  count: number;
};

type FailureRate = StatsDate & {
  pair: string;
  isReverse: boolean;
  failureRate: number;
};

class StatsRepository {
  private static queryVolume = `
WITH data AS (
    SELECT
        pair,
        status,
        CASE WHEN orderSide THEN invoiceAmount ELSE onchainAmount END AS amount,
        createdAt
    FROM swaps
    UNION ALL
    SELECT
        pair,
        status,
        CASE WHEN orderSide THEN onchainAmount ELSE invoiceAmount END AS amount,
        createdAt
    FROM reverseSwaps
)
SELECT
    CAST(STRFTIME('%Y', createdAt) AS INT) AS year,
    CAST(STRFTIME('%m', createdAt) AS INT) AS month,
    SUBSTRING(pair, INSTR(pair, '/') + 1) AS asset,
    SUM(amount) AS sum
FROM data
WHERE status IN (${arrayToSqlInClause(SuccessSwapUpdateEvents)})
GROUP BY asset, year, month
ORDER BY year, month;
`;

  private static queryTradeCounts = `
WITH data AS (
    SELECT pair, status, createdAt FROM swaps
    UNION ALL
    SELECT pair, status, createdAt FROM reverseSwaps
)
SELECT
    CAST(STRFTIME('%Y', createdAt) AS INT) AS year,
    CAST(STRFTIME('%m', createdAt) AS INT) AS month,
    pair,
    COUNT(*) AS count
FROM data
WHERE status IN (${arrayToSqlInClause(SuccessSwapUpdateEvents)})
GROUP BY pair, year, month
ORDER BY year, month;
`;

  private static queryFailureRates = `
WITH data AS (
    SELECT pair, false AS isReverse, status, createdAt FROM swaps
    UNION ALL
    SELECT pair, true as isReverse, status, createdAt FROM reverseSwaps
)
SELECT
    CAST(STRFTIME('%Y', createdAt) AS INT) AS year,
    CAST(STRFTIME('%m', createdAt) AS INT) AS month,
    pair,
    isReverse,
    COUNT(*) FILTER (
        WHERE status IN (${arrayToSqlInClause(FailedSwapUpdateEvents)})
    ) / CAST(COUNT(*) AS REAL) AS failureRate
FROM data
GROUP BY isReverse, year, month
ORDER BY year, month, isReverse;
`;

  public static getVolume = (): Promise<Volume[]> => {
    return StatsRepository.query(StatsRepository.queryVolume);
  };

  public static getTradeCounts = (): Promise<TradeCount[]> => {
    return StatsRepository.query(StatsRepository.queryTradeCounts);
  };

  public static getFailureRates = (): Promise<FailureRate[]> => {
    return StatsRepository.query(StatsRepository.queryFailureRates);
  };

  private static query = (query: string): Promise<any[]> => {
    return Database.sequelize.query(query, {
      type: QueryTypes.SELECT,
    });
  };
}

export default StatsRepository;
export { StatsDate };
