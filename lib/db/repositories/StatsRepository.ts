import { QueryTypes } from 'sequelize';
import {
  FinalChainSwapEvents,
  FinalReverseSwapEvents,
  FinalSwapEvents,
  SwapUpdateEvent,
} from '../../consts/Enums';
import Database from '../Database';

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
  type: string;
  failureRate: number;
};

enum SwapType {
  Swap = 'swap',
  Reverse = 'reverse',
  Chain = 'chain',
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
  type: string;
  locked: number;
};

class StatsRepository {
  private static readonly queryVolume =
    // language=PostgreSQL
    `
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
    UNION ALL
    SELECT
        pair,
        status,
        referral,
        d.amount AS amount,
        c."createdAt" AS "createdAt"
    FROM "chainSwaps" c
        INNER JOIN "chainSwapData" d
            ON d."swapId" = c.id AND
                d.symbol = CASE WHEN "orderSide" = 0
                    THEN SPLIT_PART(pair, '/', 1)
                    ELSE SPLIT_PART(pair, '/', 2)
                END
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
`;

  private static readonly queryTradeCounts =
    // language=PostgreSQL
    `
WITH data AS (
    SELECT pair, status, referral, "createdAt"
    FROM swaps
    WHERE status = ?
    UNION ALL
    SELECT pair, status, referral, "createdAt"
    FROM "reverseSwaps"
    WHERE status = ?
    UNION ALL
    SELECT pair, status, referral, "createdAt"
    FROM "chainSwaps"
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
`;

  private static readonly queryFailureRates =
    // language=PostgreSQL
    `
WITH data AS (
    SELECT pair, 'submarine' AS type, status, "failureReason", referral, "createdAt"
    FROM swaps
    UNION ALL
    SELECT pair, 'reverse' AS type, status, "failureReason",referral, "createdAt"
    FROM "reverseSwaps"
    UNION ALL
    SELECT pair, 'chain' AS type, status, "failureReason", referral, "createdAt"
    FROM "chainSwaps"
)
SELECT
    EXTRACT(YEAR FROM "createdAt") AS year,
    EXTRACT(MONTH FROM "createdAt") AS month,
    type,
    COUNT(*) FILTER (
        WHERE status IN (?)
          AND "failureReason" NOT IN (?)
    ) / CAST(COUNT(*) AS REAL) AS "failureRate"
FROM data
WHERE
    CASE WHEN ? IS NOT NULL THEN referral = ? ELSE TRUE END
    AND ((
        EXTRACT(YEAR FROM "createdAt") >= ? AND
        EXTRACT(MONTH FROM "createdAt") >= ?
    ) OR EXTRACT(YEAR FROM "createdAt") > ?)
GROUP BY year, month, type
ORDER BY year, month, type;
`;

  private static readonly querySwapCounts =
    // language=PostgreSQL
    `
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
    UNION ALL
    SELECT
        pair,
        'chain' AS type,
        CASE
            WHEN status = ? THEN 'success'
            WHEN status IN (?) THEN 'failure'
            ELSE 'timeout'
        END AS status
    FROM "chainSwaps"
)
SELECT
    pair,
    type,
    status,
    COUNT(*) AS count
FROM data
GROUP BY pair, type, status;
`;

  private static readonly queryVolumePerPairType =
    // language=PostgreSQL
    `
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
    UNION ALL
    SELECT
        pair,
        'chain' AS type,
        d.amount AS amount
    FROM "chainSwaps" c
        INNER JOIN "chainSwapData" d
            ON d."swapId" = c.id AND
                d.symbol = CASE WHEN "orderSide" = 0
                    THEN SPLIT_PART(pair, '/', 1)
                    ELSE SPLIT_PART(pair, '/', 2)
                END
    WHERE status = ?
)
SELECT pair, type, SUM(amount)::BIGINT AS volume
FROM data
GROUP BY pair, type;
`;

  private static readonly queryPendingSwapsCounts =
    // language=PostgreSQL
    `
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
    UNION ALL
    SELECT
        pair,
        'chain' AS type
    FROM "chainSwaps"
    WHERE status NOT IN (?)
)
SELECT
    pair,
    type,
    COUNT(*) as count
FROM data
GROUP BY pair, type;
`;

  private static readonly queryLockedFunds =
    // language=PostgreSQL
    `
WITH data AS (
    SELECT
        pair,
        'reverse' AS type,
        CASE WHEN "orderSide" = 1
            THEN "onchainAmount"
            ELSE "invoiceAmount"
        END AS locked
    FROM "reverseSwaps"
    WHERE status IN (?)
    UNION ALL
    SELECT
        pair,
        'chain' AS type,
        d.amount AS locked
    FROM "chainSwaps" c
        INNER JOIN "chainSwapData" d
            ON d."swapId" = c.id AND
                d.symbol = CASE WHEN "orderSide" = 0
                    THEN SPLIT_PART(pair, '/', 1)
                    ELSE SPLIT_PART(pair, '/', 2)
                END
    WHERE status IN (?)
)
SELECT
    pair,
    type,
    SUM(locked)::BIGINT as locked
FROM data
GROUP BY pair, type;
`;

  public static getVolume = (
    minYear: number = 0,
    minMonth: number = 0,
    referral: string | null = null,
  ): Promise<Volume[]> => {
    return StatsRepository.query({
      query: StatsRepository.queryVolume,
      values: [
        SwapUpdateEvent.TransactionClaimed,
        SwapUpdateEvent.InvoiceSettled,
        SwapUpdateEvent.TransactionClaimed,
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
      query: StatsRepository.queryTradeCounts,
      values: [
        SwapUpdateEvent.TransactionClaimed,
        SwapUpdateEvent.InvoiceSettled,
        SwapUpdateEvent.TransactionClaimed,
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
      query: StatsRepository.queryFailureRates,
      values: [
        [
          SwapUpdateEvent.TransactionFailed,
          SwapUpdateEvent.InvoiceFailedToPay,
          SwapUpdateEvent.TransactionRefunded,
        ],
        ['invoice expired', 'swap expired'],
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
      query: StatsRepository.querySwapCounts,
      values: [
        SwapUpdateEvent.TransactionClaimed,
        SwapUpdateEvent.InvoiceFailedToPay,
        SwapUpdateEvent.InvoiceSettled,
        [
          SwapUpdateEvent.TransactionFailed,
          SwapUpdateEvent.TransactionRefunded,
        ],
        SwapUpdateEvent.TransactionClaimed,
        [
          SwapUpdateEvent.TransactionFailed,
          SwapUpdateEvent.TransactionRefunded,
        ],
      ],
    });
  };

  public static getVolumePerPairType = (): Promise<VolumePerPairType[]> => {
    return StatsRepository.query({
      query: StatsRepository.queryVolumePerPairType,
      values: [
        SwapUpdateEvent.TransactionClaimed,
        SwapUpdateEvent.InvoiceSettled,
        SwapUpdateEvent.TransactionClaimed,
      ],
    });
  };

  public static getPendingSwapsCounts = (): Promise<PendingSwaps[]> => {
    return StatsRepository.query({
      query: StatsRepository.queryPendingSwapsCounts,
      values: [FinalSwapEvents, FinalReverseSwapEvents, FinalChainSwapEvents],
    });
  };

  public static getLockedFunds = (): Promise<LockedFunds[]> => {
    return StatsRepository.query({
      query: StatsRepository.queryLockedFunds,
      values: [
        [
          SwapUpdateEvent.TransactionMempool,
          SwapUpdateEvent.TransactionConfirmed,
        ],
        [
          SwapUpdateEvent.TransactionServerMempool,
          SwapUpdateEvent.TransactionServerConfirmed,
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
