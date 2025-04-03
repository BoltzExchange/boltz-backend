import { Op } from 'sequelize';
import type { ReverseRoutingHintsType } from '../models/ReverseRoutingHint';
import ReverseRoutingHint from '../models/ReverseRoutingHint';

class ReverseRoutingHintRepository {
  public static addHint = (hints: ReverseRoutingHintsType) =>
    ReverseRoutingHint.create(hints);

  public static getHint = (swapId: string) =>
    ReverseRoutingHint.findOne({
      where: {
        swapId,
      },
    });

  public static getHints = async (
    swapIds: string[],
  ): Promise<ReverseRoutingHint[]> => {
    if (swapIds.length === 0) {
      return [];
    }

    return await ReverseRoutingHint.findAll({
      where: {
        swapId: {
          [Op.in]: swapIds,
        },
      },
    });
  };
}

export default ReverseRoutingHintRepository;
