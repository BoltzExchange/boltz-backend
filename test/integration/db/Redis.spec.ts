import { redis } from '../Nodes';

describe('Redis', () => {
  beforeAll(async () => {
    await redis.connect();
    await redis['client'].flushDb();
  });

  afterAll(async () => {
    await redis['client'].flushDb();
    await redis.disconnect();
  });

  describe('hash', () => {
    const setKey = 'hash:test';

    test.each`
      value
      ${'test'}
      ${1}
      ${true}
      ${false}
      ${null}
      ${[1, 'data']}
      ${{ some: 'data' }}
    `('should set and get value "$value"', async ({ value }) => {
      const key = 'test';
      await redis.hashSet(setKey, key, value);
      const result = await redis.hashGet<typeof value>(setKey, key);
      expect(result).toEqual(value);
    });

    test('should delete a value', async () => {
      const key = 'data';

      await redis.hashSet(setKey, key, 'test');
      await redis.hashDelete(setKey, key);
      expect(await redis.hashGet(setKey, key)).toEqual(undefined);
    });

    test('should scan for a pattern', async () => {
      await redis.hashSet(setKey, 'test', 'test');
      await redis.hashSet(setKey, 'test2', 'test2');
      await redis.hashSet(setKey, 'not:included', 'data');

      for await (const res of redis.hashScan(setKey, 'test*')) {
        expect(res.length).toEqual(2);
        expect(res).toContainEqual({ field: 'test', value: 'test' });
        expect(res).toContainEqual({ field: 'test2', value: 'test2' });
        break;
      }
    });
  });
});
