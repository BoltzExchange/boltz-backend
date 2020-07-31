import { Op } from 'sequelize';
import ChainTip from './models/ChainTip';

class ChainTipRepository {
  public getChainTips = (): Promise<ChainTip[]> => {
    return ChainTip.findAll();
  }

  public findOrCreateTip = async (symbol: string, height: number): Promise<ChainTip> => {
    const [chainTip] = await ChainTip.findOrCreate({
      where: {
        symbol: {
          [Op.eq]: symbol,
        }
      },
      defaults: {
        symbol,
        height,
      },
    });

    return chainTip;
  }

  public updateTip = (chainTip: ChainTip, height: number): Promise<ChainTip> => {
    return chainTip.update({
      height,
    });
  }
}

export default ChainTipRepository;
