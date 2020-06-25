import { Op } from 'sequelize';
import KeyProvider, { KeyProviderType } from './models/KeyProvider';

class KeyRepository {
  constructor() {}

  public getKeyProviders = async () => {
    return KeyProvider.findAll();
  }

  public getKeyProvider = async (symbol: string) => {
    return KeyProvider.findOne({
      where: {
        symbol: {
          [Op.eq]: symbol,
        },
      },
    });
  }

  public addKeyProvider = async (wallet: KeyProviderType) => {
    return KeyProvider.create(wallet);
  }

  public setHighestUsedIndex = async (symbol: string, highestUsedIndex: number) => {
    return KeyProvider.update({
      highestUsedIndex,
    }, {
      where: {
        symbol: {
          [Op.eq]: symbol,
        },
      },
    });
  }
}

export default KeyRepository;
