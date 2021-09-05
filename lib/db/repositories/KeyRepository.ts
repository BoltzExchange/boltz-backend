import KeyProvider, { KeyProviderType } from '../models/KeyProvider';

class KeyRepository {
  public getKeyProviders = (): Promise<KeyProviderType[]> => {
    return KeyProvider.findAll();
  }

  public getKeyProvider = (symbol: string): Promise<KeyProviderType | null> => {
    return KeyProvider.findOne({
      where: {
        symbol,
      },
    });
  }

  public addKeyProvider = (wallet: KeyProviderType): Promise<KeyProviderType> => {
    return KeyProvider.create(wallet);
  }

  public setHighestUsedIndex = (symbol: string, highestUsedIndex: number): Promise<[number, KeyProviderType[]]> => {
    return KeyProvider.update({
      highestUsedIndex,
    }, {
      where: {
        symbol,
      },
    });
  }
}

export default KeyRepository;
