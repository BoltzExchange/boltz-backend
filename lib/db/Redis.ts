import { createClient } from 'redis';
import type Logger from '../Logger';
import { formatError } from '../Utils';

export type RedisConfig = {
  redisEndpoint: string;
};

class Redis {
  private readonly client: ReturnType<typeof createClient>;

  constructor(
    private readonly logger: Logger,
    config: RedisConfig,
  ) {
    this.client = createClient({
      url: config.redisEndpoint,
    });
  }

  public connect = async () => {
    await this.client.connect();
    this.client.on('error', (err) => {
      this.logger.error(`Redis connection error: ${formatError(err)}`);
    });

    this.logger.info('Connected to Redis');
  };

  public disconnect = async () => {
    this.client.removeAllListeners();
    await this.client.disconnect();
  };

  public hashLength = async (key: string): Promise<number> => {
    return await this.client.hLen(key);
  };

  public hashSet = async <T>(key: string, field: string, value: T) => {
    await this.client.hSet(key, field, JSON.stringify(value));
  };

  public hashGet = async <T>(
    key: string,
    field: string,
  ): Promise<T | undefined> => {
    const value = await this.client.hGet(key, field);
    return value !== null && value !== undefined
      ? JSON.parse(value)
      : undefined;
  };

  public hashDelete = async (key: string, field: string | string[]) => {
    await this.client.hDel(key, field);
  };

  public hashScan = (
    key: string,
    pattern: string,
    batchCount: number = 1_000,
  ): AsyncIterableIterator<{ field: string; value: unknown }[]> => {
    const client = this.client;

    return (async function* () {
      let cursor = 0;
      do {
        const result = await client.hScan(key, cursor, {
          MATCH: pattern,
          COUNT: batchCount,
        });
        cursor = result.cursor;

        if (result.tuples.length > 0) {
          yield result.tuples.map((tuple) => ({
            field: tuple.field,
            value: JSON.parse(tuple.value),
          }));
        }
      } while (cursor !== 0);
    })();
  };
}

export default Redis;
