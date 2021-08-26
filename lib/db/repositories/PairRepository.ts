import { Op } from 'sequelize';
import Pair, { PairType } from '../models/Pair';

class PairRepository {
  public getPairs = (): Promise<Pair[]> => {
    return Pair.findAll({});
  }

  public addPair = (pair: PairType): Promise<Pair> => {
    return Pair.create(pair);
  }

  public removePair = (id: string): Promise<number> => {
    return Pair.destroy({
      where: {
        id: {
          [Op.eq]: id,
        },
      },
    });
  }

  public dropTable = async (): Promise<void> => {
    return Pair.drop();
  }
}

export default PairRepository;
