import KeyProvider, { KeyProviderType } from '../models/KeyProvider';

class KeyRepository {
  public static getKeyProviders = (): Promise<KeyProviderType[]> => {
    return KeyProvider.findAll();
  };

  public static getKeyProvider = (
    symbol: string,
  ): Promise<KeyProviderType | null> => {
    return KeyProvider.findOne({
      where: {
        symbol,
      },
    });
  };

  public static addKeyProvider = (
    wallet: KeyProviderType,
  ): Promise<KeyProviderType> => {
    return KeyProvider.create(wallet);
  };

  public static setHighestUsedIndex = (
    symbol: string,
    highestUsedIndex: number,
  ): Promise<[number]> => {
    return KeyProvider.update(
      {
        highestUsedIndex,
      },
      {
        where: {
          symbol,
        },
      },
    );
  };
}

export default KeyRepository;
