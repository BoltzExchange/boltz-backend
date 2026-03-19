import { Op } from 'sequelize';
import type { ReverseRoutingHintsType } from '../models/ReverseRoutingHint';
import ReverseRoutingHint from '../models/ReverseRoutingHint';

class ReverseRoutingHintRepository {
  public static addHint = async (hints: ReverseRoutingHintsType) => {
    const hasScriptPubkey =
      hints.scriptPubkey !== undefined && hints.scriptPubkey !== null;
    const hasAddress = hints.address !== undefined && hints.address !== null;

    if (hasScriptPubkey === hasAddress) {
      throw new Error(
        'exactly one of reverse routing hint scriptPubkey or address must be defined',
      );
    }

    return await ReverseRoutingHint.create(hints);
  };

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
