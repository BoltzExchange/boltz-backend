import { QueryTypes } from 'sequelize';
import {
  NotPendingReverseSwapEvents,
  NotPendingSwapEvents,
  SwapUpdateEvent,
} from '../../consts/Enums';
import Database, { DatabaseType } from '../Database';
import { Queries } from '../Utils';

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
  isReverse: boolean;
  failureRate: number;
};

enum SwapType {
  Swap = 'swap',
  Reverse = 'reverse',
}

type BaseMetric = {
  pair: string;
  type: SwapType;
};

type SwapCount = BaseMetric & {
  status: 'success' | 'failure' | 'timeout';
  count: number;
};

type VolumePerPairType = BaseMetric & {
  volume: number;
};

type PendingSwaps = BaseMetric & {
  count: number;
};

type LockedFunds = {
  pair: string;
  locked: number;
};

class StatsRepository {
  private static readonly queryVolume: Queries = {
    // language=PostgreSQL
    [DatabaseType.PostgreSQL]: `
WITH data AS (
    SELECT
        pair,
        status,
        referral,
        CASE WHEN "orderSide" = 1
            THEN "invoiceAmount"
            ELSE "onchainAmount"
        END AS amount,
        "createdAt"
    FROM swaps
    WHERE status = ?
    UNION ALL
    SELECT
        pair,
        status,
        referral,
        CASE WHEN "orderSide" = 1
            THEN "onchainAmount"
            ELSE "invoiceAmount"
        END AS amount,
        "createdAt"
    FROM "reverseSwaps"
    WHERE status = ?
)
SELECT
    EXTRACT(YEAR FROM "createdAt") AS year,
    EXTRACT(MONTH FROM "createdAt") AS month,
    pair,
    SUM(amount) AS sum
FROM data
WHERE
    CASE WHEN ? IS NOT NULL THEN referral = ? ELSE TRUE END
    AND ((
      EXTRACT(YEAR FROM "createdAt") >= ? AND
      EXTRACT(MONTH FROM "createdAt") >= ?
    ) OR EXTRACT(YEAR from "createdAt") > ?)
GROUP BY GROUPING SETS (
    (year, month),
    (year, month, pair)
)
ORDER BY year, month, pair NULLS FIRST;    
`,

    // language=SQLite
    [DatabaseType.SQLite]: `
WITH data AS (
    SELECT
        pair,
        status,
        referral,
        CASE WHEN orderSide THEN invoiceAmount ELSE onchainAmount END AS amount,
        createdAt
    FROM swaps
    WHERE status = ?
    UNION ALL
    SELECT
        pair,
        status,
        referral,
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
    WHERE CASE WHEN ? IS NOT NULL THEN referral = ? ELSE TRUE END
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
WHERE (year >= ? AND month >= ?) OR year > ?
ORDER BY year, month, pair;
`,
  };

  private static readonly queryTradeCounts: Queries = {
    // language=PostgreSQL
    [DatabaseType.PostgreSQL]: `
WITH data AS (
    SELECT pair, status, referral, "createdAt"
    FROM swaps
    WHERE status = ?
    UNION ALL
    SELECT pair, status, referral, "createdAt"
    FROM "reverseSwaps"
    WHERE status = ?
)
SELECT
    EXTRACT(YEAR FROM "createdAt") AS year,
    EXTRACT(MONTH FROM "createdAt") AS month,
    pair,
    COUNT(*) AS count
FROM data
WHERE
    CASE WHEN ? IS NOT NULL THEN referral = ? ELSE TRUE END
    AND ((
        EXTRACT(YEAR FROM "createdAt") >= ? AND
        EXTRACT(MONTH FROM "createdAt") >= ?
    ) OR EXTRACT(YEAR FROM "createdAt") > ?)
GROUP BY GROUPING SETS (
    (year, month),
    (pair, year, month)
)
ORDER BY year, month, pair NULLS FIRST;
`,

    // language=SQLite
    [DatabaseType.SQLite]: `
WITH data AS (
    SELECT pair, status, referral, createdAt
    FROM swaps
    WHERE status = ?
    UNION ALL
    SELECT pair, status, referral, createdAt
    FROM reverseSwaps
    WHERE status = ?
), groupedSwaps AS (
    SELECT
        CAST(STRFTIME('%Y', createdAt) AS INT) AS year,
        CAST(STRFTIME('%m', createdAt) AS INT) AS month,
        pair,
        COUNT(*) AS count
    FROM data
    WHERE CASE WHEN ? IS NOT NULL THEN referral = ? ELSE TRUE END
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
WHERE (year >= ? AND month >= ?) OR year > ?
ORDER BY year, month, pair;
`,
  };

  private static readonly queryFailureRates: Queries = {
    // language=PostgreSQL
    [DatabaseType.PostgreSQL]: `
WITH data AS (
    SELECT pair, false AS "isReverse", status, referral, "createdAt" FROM swaps
    UNION ALL
    SELECT pair, true as "isReverse", status, referral, "createdAt" FROM "reverseSwaps"
)
SELECT
    EXTRACT(YEAR FROM "createdAt") AS year,
    EXTRACT(MONTH FROM "createdAt") AS month,
    "isReverse",
    COUNT(*) FILTER (
        WHERE status IN (?)
    ) / CAST(COUNT(*) AS REAL) AS "failureRate"
FROM data
WHERE
    CASE WHEN ? IS NOT NULL THEN referral = ? ELSE TRUE END
    AND ((
        EXTRACT(YEAR FROM "createdAt") >= ? AND
        EXTRACT(MONTH FROM "createdAt") >= ?
    ) OR EXTRACT(YEAR FROM "createdAt") > ?)
GROUP BY year, month, "isReverse"
ORDER BY year, month, "isReverse";
`,

    // language=SQLite
    [DatabaseType.SQLite]: `
WITH data AS (
    SELECT pair, false AS isReverse, status, referral, createdAt FROM swaps
    UNION ALL
    SELECT pair, true as isReverse, status, referral, createdAt FROM reverseSwaps
)
SELECT
    CAST(STRFTIME('%Y', createdAt) AS INT) AS year,
    CAST(STRFTIME('%m', createdAt) AS INT) AS month,
    pair,
    isReverse,
    COUNT(*) FILTER (
        WHERE status IN (?)
    ) / CAST(COUNT(*) AS REAL) AS failureRate
FROM data
WHERE
    CASE WHEN ? IS NOT NULL THEN referral = ? ELSE TRUE END AND
    ((year >= ? AND month >= ?) OR year > ?)
GROUP BY year, month, isReverse
ORDER BY year, month, isReverse;
`,
  };

  private static readonly querySwapCounts: Queries = {
    // language=PostgreSQL
    [DatabaseType.PostgreSQL]: `
WITH data AS (
    SELECT
        pair,
        'swap' AS type,
        CASE
            WHEN status = ? THEN 'success'
            WHEN status = ? THEN 'failure'
            ELSE 'timeout'
        END AS status
    FROM swaps
    UNION ALL
    SELECT
        pair,
        'reverse' AS type,
        CASE
            WHEN status = ? THEN 'success'
            WHEN status IN (?) THEN 'failure'
            ELSE 'timeout'
        END AS status
    FROM "reverseSwaps"
)
SELECT
    pair,
    type,
    status,
    COUNT(*) AS count
FROM data
GROUP BY pair, type, status;
`,

    // language=SQLite
    [DatabaseType.SQLite]: `
WITH data AS (
    SELECT
        pair,
        'swap' AS type,
        CASE
            WHEN status == ? THEN 'success'
            WHEN status == ? THEN 'failure'
            ELSE 'timeout'
        END AS status
    FROM swaps
    UNION ALL
    SELECT
        pair,
        'reverse' AS type,
        CASE
            WHEN status == ? THEN 'success'
            WHEN status IN (?) THEN 'failure'
            ELSE 'timeout'
        END AS status
    FROM reverseSwaps
)
SELECT
    pair,
    type,
    status,
    COUNT(*) AS count
FROM data
GROUP BY pair, type, status;
`,
  };

  private static readonly queryVolumePerPairType: Queries = {
    // language=PostgreSQL
    [DatabaseType.PostgreSQL]: `
WITH data AS (
    SELECT
        pair,
        'swap' AS type,
        CASE WHEN "orderSide" = 1
            THEN "invoiceAmount"
            ELSE "onchainAmount"
        END AS amount
    FROM swaps
    WHERE status = ?
    UNION ALL
    SELECT
        pair,
        'reverse' AS type,
        CASE WHEN "orderSide" = 1
            THEN "onchainAmount"
            ELSE "invoiceAmount"
        END AS amount
    FROM "reverseSwaps"
    WHERE status = ?
)
SELECT pair, type, SUM(amount)::BIGINT AS volume
FROM data
GROUP BY pair, type;
`,

    // language=SQLite
    [DatabaseType.SQLite]: `
WITH data AS (
    SELECT
        pair,
        'swap' AS type,
        CASE WHEN orderSide THEN invoiceAmount ELSE onchainAmount END AS amount
    FROM swaps
    WHERE status = ?
    UNION ALL
    SELECT
        pair,
        'reverse' AS type,
        CASE WHEN orderSide THEN onchainAmount ELSE invoiceAmount END AS amount
    FROM reverseSwaps
    WHERE status = ?
)
SELECT pair, type, SUM(amount) AS volume
FROM data
GROUP BY pair, type;
`,
  };

  private static readonly queryPendingSwapsCounts: Queries = {
    // language=PostgreSQL
    [DatabaseType.PostgreSQL]: `
WITH data AS (
    SELECT
        pair,
        'swap' AS type
    FROM swaps
    WHERE status NOT IN (?)
    UNION ALL
    SELECT
        pair,
        'reverse' AS type
    FROM "reverseSwaps"
    WHERE status NOT IN (?)
)
SELECT
    pair,
    type,
    COUNT(*) as count
FROM data
GROUP BY pair, type;
`,

    // language=SQLite
    [DatabaseType.SQLite]: `
WITH data AS (
    SELECT
        pair,
        'swap' AS type
    FROM swaps
    WHERE status NOT IN (?)
    UNION ALL
    SELECT
        pair,
        'reverse' AS type
    FROM reverseSwaps
    WHERE status NOT IN (?)
)
SELECT
    pair,
    type,
    COUNT(*) as count
FROM data
GROUP BY pair, type;
`,
  };

  private static readonly queryLockedFunds: Queries = {
    // language=PostgreSQL
    [DatabaseType.PostgreSQL]: `
SELECT
    pair,
    SUM(
        CASE WHEN "orderSide" = 1
            THEN "onchainAmount"
            ELSE "invoiceAmount"
        END
    )::BIGINT AS locked
FROM "reverseSwaps"
WHERE status IN (?)
GROUP BY pair;
`,

    // language=SQLite
    [DatabaseType.SQLite]: `
SELECT
    pair,
    SUM(amount) AS locked
FROM (
    SELECT
        pair,
        CASE WHEN orderSide THEN onchainAmount ELSE invoiceAmount END AS amount
    FROM reverseSwaps
    WHERE status IN (?)
)
GROUP BY pair;
`,
  };

  public static getVolume = (
    minYear: number = 0,
    minMonth: number = 0,
    referral: string | null = null,
  ): Promise<Volume[]> => {
    return StatsRepository.query({
      query: StatsRepository.queryVolume[Database.type],
      values: [
        SwapUpdateEvent.TransactionClaimed,
        SwapUpdateEvent.InvoiceSettled,
        referral,
        referral,
        minYear,
        minMonth,
        minYear,
      ],
    });
  };

  public static getTradeCounts = (
    minYear: number = 0,
    minMonth: number = 0,
    referral: string | null = null,
  ): Promise<TradeCount[]> => {
    return StatsRepository.query({
      query: StatsRepository.queryTradeCounts[Database.type],
      values: [
        SwapUpdateEvent.TransactionClaimed,
        SwapUpdateEvent.InvoiceSettled,
        referral,
        referral,
        minYear,
        minMonth,
        minYear,
      ],
    });
  };

  public static getFailureRates = (
    minYear: number = 0,
    minMonth: number = 0,
    referral: string | null = null,
  ): Promise<FailureRate[]> => {
    return StatsRepository.query({
      query: StatsRepository.queryFailureRates[Database.type],
      values: [
        [
          SwapUpdateEvent.TransactionFailed,
          SwapUpdateEvent.InvoiceFailedToPay,
          SwapUpdateEvent.TransactionRefunded,
        ],
        referral,
        referral,
        minYear,
        minMonth,
        minYear,
      ],
    });
  };

  public static getSwapCounts = (): Promise<SwapCount[]> => {
    return StatsRepository.query({
      query: StatsRepository.querySwapCounts[Database.type],
      values: [
        SwapUpdateEvent.TransactionClaimed,
        SwapUpdateEvent.InvoiceFailedToPay,
        SwapUpdateEvent.InvoiceSettled,
        [
          SwapUpdateEvent.TransactionFailed,
          SwapUpdateEvent.TransactionRefunded,
        ],
      ],
    });
  };

  public static getVolumePerPairType = (): Promise<VolumePerPairType[]> => {
    return StatsRepository.query({
      query: StatsRepository.queryVolumePerPairType[Database.type],
      values: [
        SwapUpdateEvent.TransactionClaimed,
        SwapUpdateEvent.InvoiceSettled,
      ],
    });
  };

  public static getPendingSwapsCounts = (): Promise<PendingSwaps[]> => {
    return StatsRepository.query({
      query: StatsRepository.queryPendingSwapsCounts[Database.type],
      values: [NotPendingSwapEvents, NotPendingReverseSwapEvents],
    });
  };

  public static getLockedFunds = (): Promise<LockedFunds[]> => {
    return StatsRepository.query({
      query: StatsRepository.queryLockedFunds[Database.type],
      values: [
        [
          SwapUpdateEvent.TransactionMempool,
          SwapUpdateEvent.TransactionConfirmed,
        ],
      ],
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
export { SwapType, StatsDate };
