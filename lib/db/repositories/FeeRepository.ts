import { QueryTypes } from 'sequelize';
import { Queries } from '../Utils';
import Database, { DatabaseType } from '../Database';
import { SuccessSwapUpdateEvents } from '../../consts/Enums';

type Fee = {
  asset: string;
  sum: number;
};

class FeeRepository {
  private static queryFees: Queries = {
    // language=PostgreSQL
    [DatabaseType.PostgreSQL]: `
WITH data AS (
    SELECT
        CASE WHEN "orderSide" = 1
            THEN SPLIT_PART(pair, '/', 1)
            ELSE SPLIT_PART(pair, '/', 2)
        END AS asset,
        pair,
        status,
        fee
    FROM swaps
    UNION ALL
    SELECT
        CASE WHEN "orderSide" = 1
            THEN SPLIT_PART(pair, '/', 2)
            ELSE SPLIT_PART(pair, '/', 1)
        END AS asset,
        pair,
        status,
        fee
    FROM "reverseSwaps"
)
SELECT
    asset,
    SUM(fee) AS sum
FROM data
WHERE status IN (?)
GROUP BY asset
ORDER BY asset;
`,

    // language=SQLite
    [DatabaseType.SQLite]: `
WITH data AS (
    SELECT
        CASE WHEN orderSide
            THEN SUBSTRING(pair, 0, INSTR(pair, '/'))
            ELSE SUBSTRING(pair, INSTR(pair, '/') + 1)
        END AS asset,
        pair,
        status,
        fee
    FROM swaps
    UNION ALL
    SELECT
        CASE WHEN orderSide
            THEN SUBSTRING(pair, INSTR(pair, '/') + 1)
            ELSE SUBSTRING(pair, 0, INSTR(pair, '/'))
        END AS asset,
        pair,
        status,
        fee
    FROM reverseSwaps
)
SELECT
    asset,
    SUM(fee) AS sum
FROM data
WHERE status IN (?)
GROUP BY asset;
    `,
  };

  public static getFees = (): Promise<Fee[]> => {
    return Database.sequelize.query(
      {
        query: FeeRepository.queryFees[Database.type],
        values: [SuccessSwapUpdateEvents],
      },
      {
        type: QueryTypes.SELECT,
      },
    );
  };
}

export default FeeRepository;
