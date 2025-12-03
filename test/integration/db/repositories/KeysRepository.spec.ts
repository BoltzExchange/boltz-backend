import Logger from '../../../../lib/Logger';
import Database from '../../../../lib/db/Database';
import KeyProvider from '../../../../lib/db/models/KeyProvider';
import KeyRepository from '../../../../lib/db/repositories/KeyRepository';
import { getPostgresDatabase } from '../../../Utils';

describe('KeyRepository', () => {
  let database: Database;

  beforeAll(async () => {
    database = getPostgresDatabase();
    await database.init();
  });

  beforeEach(async () => {
    await KeyProvider.truncate();
  });

  afterAll(async () => {
    await database.close();
  });

  describe('incrementHighestUsedIndex', () => {
    test('should increment highest used index for existing key provider', async () => {
      const symbol = 'BTC';
      const initialIndex = 0;

      await KeyRepository.addKeyProvider({
        symbol,
        derivationPath: "m/0'/0'/0'",
        highestUsedIndex: initialIndex,
      });

      const newIndex = await KeyRepository.incrementHighestUsedIndex(symbol);

      expect(newIndex).toBe(1);

      const keyProvider = await KeyRepository.getKeyProvider(symbol);
      expect(keyProvider?.highestUsedIndex).toBe(1);
    });

    test('should increment multiple times correctly', async () => {
      const symbol = 'ETH';
      const initialIndex = 5;

      await KeyRepository.addKeyProvider({
        symbol,
        derivationPath: "m/44'/60'/0'",
        highestUsedIndex: initialIndex,
      });

      const index1 = await KeyRepository.incrementHighestUsedIndex(symbol);
      expect(index1).toBe(6);

      const index2 = await KeyRepository.incrementHighestUsedIndex(symbol);
      expect(index2).toBe(7);

      const index3 = await KeyRepository.incrementHighestUsedIndex(symbol);
      expect(index3).toBe(8);

      // Verify final state
      const keyProvider = await KeyRepository.getKeyProvider(symbol);
      expect(keyProvider?.highestUsedIndex).toBe(8);
    });

    test('should return undefined for non-existent key provider', async () => {
      const result =
        await KeyRepository.incrementHighestUsedIndex('NON_EXISTENT');

      expect(result).toBeUndefined();
    });

    test('should handle concurrent increments correctly', async () => {
      const symbol = 'LTC';
      const initialIndex = 0;

      await KeyRepository.addKeyProvider({
        symbol,
        derivationPath: "m/84'/2'/0'",
        highestUsedIndex: initialIndex,
      });

      // Perform multiple increments concurrently
      const promises = Array(5)
        .fill(null)
        .map(() => KeyRepository.incrementHighestUsedIndex(symbol));

      const results = await Promise.all(promises);

      const uniqueResults = new Set(results);
      expect(uniqueResults.size).toBe(5);
      [1, 2, 3, 4, 5].forEach((index) => {
        expect(results).toContain(index);
      });

      const keyProvider = await KeyRepository.getKeyProvider(symbol);
      expect(keyProvider?.highestUsedIndex).toBe(5);
    });

    test('should not affect other key providers', async () => {
      const symbol1 = 'BTC';
      const symbol2 = 'ETH';

      await KeyRepository.addKeyProvider({
        symbol: symbol1,
        derivationPath: "m/84'/0'/0'",
        highestUsedIndex: 10,
      });

      await KeyRepository.addKeyProvider({
        symbol: symbol2,
        derivationPath: "m/44'/60'/0'",
        highestUsedIndex: 20,
      });

      await KeyRepository.incrementHighestUsedIndex(symbol1);

      const btcProvider = await KeyRepository.getKeyProvider(symbol1);
      expect(btcProvider?.highestUsedIndex).toBe(11);

      const ethProvider = await KeyRepository.getKeyProvider(symbol2);
      expect(ethProvider?.highestUsedIndex).toBe(20);
    });
  });
});
