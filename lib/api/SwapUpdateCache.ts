import Redis from '../db/Redis';
import { SwapUpdate } from '../service/EventHandler';

abstract class SwapUpdateCache {
  abstract size(): Promise<number>;
  abstract get(id: string): Promise<SwapUpdate | undefined>;
  abstract set(id: string, swapInfo: SwapUpdate): Promise<void>;
  abstract clear(): Promise<void>;
}

class MapCache extends SwapUpdateCache {
  private readonly cache = new Map<string, SwapUpdate>();

  public size = (): Promise<number> => Promise.resolve(this.cache.size);

  public get = (id: string): Promise<SwapUpdate | undefined> =>
    Promise.resolve(this.cache.get(id));

  public set = (id: string, swapInfo: SwapUpdate): Promise<void> => {
    this.cache.set(id, swapInfo);
    return Promise.resolve();
  };

  public clear = (): Promise<void> => {
    this.cache.clear();
    return Promise.resolve();
  };
}

class RedisCache extends SwapUpdateCache {
  private static readonly key = 'swap:update';

  private readonly redis: Redis;

  constructor(redis: Redis) {
    super();
    this.redis = redis;
  }

  public size = async (): Promise<number> => {
    return await this.redis.hashLength(RedisCache.key);
  };

  public get = async (id: string): Promise<SwapUpdate | undefined> => {
    return await this.redis.hashGet<SwapUpdate>(RedisCache.key, id);
  };

  public set = async (id: string, swapInfo: SwapUpdate): Promise<void> => {
    await this.redis.hashSet(RedisCache.key, id, swapInfo);
  };

  public clear = async (): Promise<void> => {
    for await (const keys of this.redis.hashScan(RedisCache.key, '*')) {
      await this.redis.hashDelete(
        RedisCache.key,
        keys.map((k) => k.field),
      );
    }
  };
}

export { SwapUpdateCache, MapCache, RedisCache };
