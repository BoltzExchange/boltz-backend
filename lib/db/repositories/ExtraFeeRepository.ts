import { QueryTypes } from 'sequelize';
import { SwapUpdateEvent } from '../../consts/Enums';
import { getNestedObject } from '../../data/Utils';
import Database from '../Database';
import ExtraFee, { ExtraFeeType } from '../models/ExtraFee';

type GroupedByYearMonth<T> = Record<string, Record<string, T>>;

class ExtraFeeRepository {
  private static readonly statsQuery = `
WITH successful AS (SELECT id, status, referral, "createdAt"
                    FROm swaps
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

  public static getStats = async (
    id: string,
  ): Promise<GroupedByYearMonth<number>> => {
    const stats = (await Database.sequelize.query(
      {
        query: ExtraFeeRepository.statsQuery,
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

    stats.forEach((stat) => {
      const monthObj = getNestedObject(
        getNestedObject(res, stat.year),
        stat.month,
      );
      monthObj[stat.id] = Number(stat.fee);
    });

    return res;
  };
}

export default ExtraFeeRepository;
