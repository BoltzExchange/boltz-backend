import MarkedSwap from '../models/MarkedSwap';

class MarkedSwapRepository {
  public static addMarkedSwap = (id: string) => {
    return MarkedSwap.create({
      id,
    });
  };
}

export default MarkedSwapRepository;
