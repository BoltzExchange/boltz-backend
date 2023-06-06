import ChainTip from '../models/ChainTip';

class ChainTipRepository {
  public static getChainTips = (): Promise<ChainTip[]> => {
    return ChainTip.findAll();
  };

  public static findOrCreateTip = async (
    symbol: string,
    height: number,
  ): Promise<ChainTip> => {
    const [chainTip] = await ChainTip.findOrCreate({
      where: {
        symbol,
      },
      defaults: {
        symbol,
        height,
      },
    });

    return chainTip;
  };

  public static updateTip = (
    chainTip: ChainTip,
    height: number,
  ): Promise<ChainTip> => {
    return chainTip.update({
      height,
    });
  };
}

export default ChainTipRepository;
