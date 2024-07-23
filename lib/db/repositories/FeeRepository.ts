import { QueryTypes } from 'sequelize';
import { SuccessSwapUpdateEvents } from '../../consts/Enums';
import Database from '../Database';

type Fee = {
  asset: string;
  sum: number;
};

class FeeRepository {
  private static readonly queryFees =
    // language=PostgreSQL
    `
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
    UNION ALL
    SELECT
        CASE WHEN "orderSide" = 1
            THEN SPLIT_PART(pair, '/', 2)
            ELSE SPLIT_PART(pair, '/', 1)
        END AS asset,
        pair,
        status,
        fee
    FROM "chainSwaps"
)
SELECT
    asset,
    SUM(fee) AS sum
FROM data
WHERE status IN (?)
GROUP BY asset
ORDER BY asset;
`;

  public static getFees = (): Promise<Fee[]> => {
    return Database.sequelize.query(
      {
        query: FeeRepository.queryFees,
        values: [SuccessSwapUpdateEvents],
      },
      {
        type: QueryTypes.SELECT,
      },
    );
  };
}

export default FeeRepository;
