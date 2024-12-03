import Rebroadcast from '../models/Rebroadcast';

class RebroadcastRepository {
  public static add = (symbol: string, rawTransaction: string) =>
    Rebroadcast.create({
      symbol,
      rawTransaction,
    });

  public static get = (rawTransaction: string): Promise<Rebroadcast | null> =>
    Rebroadcast.findOne({
      where: {
        rawTransaction,
      },
    });

  public static getForSymbol = (symbol: string): Promise<Rebroadcast[]> =>
    Rebroadcast.findAll({
      where: {
        symbol,
      },
    });

  public static delete = (rawTransaction: string) =>
    Rebroadcast.destroy({
      where: {
        rawTransaction,
      },
    });
}

export default RebroadcastRepository;
