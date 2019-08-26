import { Op } from 'sequelize';
import Pair, { PairType } from '../db/models/Pair';

class PairRepository {

  public getPairs = async (): Promise<Pair[]> => {
    return Pair.findAll({});
  }

  public addPair = async (pair: PairType) => {
    return Pair.create(pair);
  }

  public removePair = async (id: string) => {
    return Pair.destroy({
      where: {
        id: {
          [Op.eq]: id,
        },
      },
    });
  }

  public dropTable = async () => {
    return Pair.drop();
  }
}

export default PairRepository;
