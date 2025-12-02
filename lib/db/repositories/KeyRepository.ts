import { QueryTypes } from 'sequelize';
import type { KeyProviderType } from '../models/KeyProvider';
import KeyProvider from '../models/KeyProvider';

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

  public static incrementHighestUsedIndex = async (
    symbol: string,
  ): Promise<number | undefined> => {
    const results = await KeyProvider.sequelize!.query(
      'UPDATE keys SET "highestUsedIndex" = "highestUsedIndex" + 1 WHERE symbol = $1 RETURNING "highestUsedIndex"',
      {
        bind: [symbol],
        type: QueryTypes.SELECT, // has to be select for returning the new index
      },
    );

    if (!results || results.length === 0) {
      return undefined;
    }

    return (results[0] as { highestUsedIndex: number }).highestUsedIndex;
  };
}

export default KeyRepository;
