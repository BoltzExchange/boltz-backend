import Pair, { PairType } from '../models/Pair';

class PairRepository {
  public static getPairs = (): Promise<Pair[]> => {
    return Pair.findAll({});
  };

  public static addPair = (pair: PairType): Promise<Pair> => {
    return Pair.create(pair);
  };

  public static removePair = (id: string): Promise<number> => {
    return Pair.destroy({
      where: {
        id,
      },
    });
  };

  public static dropTable = async (): Promise<void> => {
    return Pair.drop();
  };
}

export default PairRepository;
