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
}

export default ReverseRoutingHintRepository;
