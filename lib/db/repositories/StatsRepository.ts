import { QueryTypes } from 'sequelize';
import Database from '../Database';
import { arrayToSqlInClause } from '../Utils';
import { SwapUpdateEvent } from '../../consts/Enums';

type StatsDate = {
  year: number;
  month: number;
};

type Volume = StatsDate & {
  pair?: string;
  sum: number;
};

type TradeCount = StatsDate & {
  pair?: string;
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
    WHERE status = ?
    UNION ALL
    SELECT
        pair,
        status,
        CASE WHEN orderSide THEN onchainAmount ELSE invoiceAmount END AS amount,
        createdAt
    FROM reverseSwaps
    WHERE status = ?
), groupedSwaps AS (
    SELECT
        CAST(STRFTIME('%Y', createdAt) AS INT) AS year,
        CAST(STRFTIME('%m', createdAt) AS INT) AS month,
        pair,
        SUM(amount) AS sum
    FROM data
    GROUP BY year, month, pair
    ORDER BY year, month, pair
), groupedTotals AS (
    SELECT * FROM groupedSwaps
    UNION ALL
    SELECT year, month, NULL AS pair, SUM(sum) AS sum
    FROM groupedSwaps
    GROUP BY year, month
)
SELECT * FROM groupedTotals
WHERE year >= ? AND month >= ?
ORDER BY year, month, pair;
`;

  private static queryTradeCounts = `
WITH data AS (
    SELECT pair, status, createdAt
    FROM swaps
    WHERE status = ?
    UNION ALL
    SELECT pair, status, createdAt
    FROM reverseSwaps
    WHERE status = ?
), groupedSwaps AS (
    SELECT
        CAST(STRFTIME('%Y', createdAt) AS INT) AS year,
        CAST(STRFTIME('%m', createdAt) AS INT) AS month,
        pair,
        COUNT(*) AS count
    FROM data
    GROUP BY pair, year, month
    ORDER BY year, month
), groupedTotals AS (
    SELECT * FROM groupedSwaps
    UNION ALL
    SELECT year, month, NULL AS pair, SUM(count) AS count
    FROM groupedSwaps
    GROUP BY year, month
)
SELECT * FROM groupedTotals
WHERE year >= ? AND month >= ?
ORDER BY year, month, pair;
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
        WHERE status IN (${arrayToSqlInClause([
          SwapUpdateEvent.TransactionFailed,
          SwapUpdateEvent.InvoiceFailedToPay,
          SwapUpdateEvent.TransactionRefunded,
        ])})
    ) / CAST(COUNT(*) AS REAL) AS failureRate
FROM data
WHERE year >= ? AND month >= ?
GROUP BY year, month, isReverse
ORDER BY year, month, isReverse;
`;

  public static getVolume = (
    minYear: number,
    minMonth: number,
  ): Promise<Volume[]> => {
    return StatsRepository.query({
      query: StatsRepository.queryVolume,
      values: [
        SwapUpdateEvent.TransactionClaimed,
        SwapUpdateEvent.InvoiceSettled,
        minYear,
        minMonth,
      ],
    });
  };

  public static getTradeCounts = (
    minYear: number,
    minMonth: number,
  ): Promise<TradeCount[]> => {
    return StatsRepository.query({
      query: StatsRepository.queryTradeCounts,
      values: [
        SwapUpdateEvent.TransactionClaimed,
        SwapUpdateEvent.InvoiceSettled,
        minYear,
        minMonth,
      ],
    });
  };

  public static getFailureRates = (
    minYear: number,
    minMonth: number,
  ): Promise<FailureRate[]> => {
    return StatsRepository.query({
      query: StatsRepository.queryFailureRates,
      values: [minYear, minMonth],
    });
  };

  private static query = (
    query: string | { query: string; values: unknown[] },
  ): Promise<any[]> => {
    return Database.sequelize.query(query, {
      type: QueryTypes.SELECT,
    });
  };
}

export default StatsRepository;
export { StatsDate };
