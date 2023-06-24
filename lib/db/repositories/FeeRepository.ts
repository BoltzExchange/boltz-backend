import { QueryTypes } from 'sequelize';
import Database from '../Database';
import { arrayToSqlInClause } from '../Utils';
import { SuccessSwapUpdateEvents } from '../../consts/Enums';

type Fee = {
  asset: string;
  sum: number;
};

class FeeRepository {
  private static queryFees = `
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
WHERE status IN (${arrayToSqlInClause(SuccessSwapUpdateEvents)})
GROUP BY asset;
`;

  public static getFees = (): Promise<Fee[]> => {
    return Database.sequelize.query(FeeRepository.queryFees, {
      type: QueryTypes.SELECT,
    });
  };
}

export default FeeRepository;
