import { Op } from 'sequelize';
import ReverseRoutingHint, {
  ReverseRoutingHintsType,
} from '../models/ReverseRoutingHint';

class ReverseRoutingHintRepository {
  public static addHint = (hints: ReverseRoutingHintsType) =>
    ReverseRoutingHint.create(hints);

  public static getHint = (swapId: string) =>
    ReverseRoutingHint.findOne({
      where: {
        swapId,
      },
    });

  public static getHints = (swapIds: string[]) =>
    ReverseRoutingHint.findAll({
      where: {
        swapId: {
          [Op.in]: swapIds,
        },
      },
    });
}

export default ReverseRoutingHintRepository;
