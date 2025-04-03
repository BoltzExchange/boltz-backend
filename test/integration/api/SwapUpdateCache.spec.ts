import type { SwapUpdateCache } from '../../../lib/api/SwapUpdateCache';
import { MapCache, RedisCache } from '../../../lib/api/SwapUpdateCache';
import { SwapUpdateEvent } from '../../../lib/consts/Enums';
import { redis } from '../Nodes';

describe('SwapUpdateCache', () => {
  beforeEach(async () => {
    await redis.connect();
    await redis['client'].flushDb();
  });

  afterEach(async () => {
    await redis['client'].flushDb();
    await redis.disconnect();
  });

  describe.each`
    name            | client
    ${'MapCache'}   | ${new MapCache()}
    ${'RedisCache'} | ${new RedisCache(redis)}
  `('$name', ({ client }: { client: SwapUpdateCache }) => {
    test.each`
      status
      ${{ status: SwapUpdateEvent.SwapCreated }}
      ${{ status: SwapUpdateEvent.TransactionClaimed }}
      ${{ status: SwapUpdateEvent.TransactionMempool, transaction: { id: 'id', hex: 'hex' } }}
      ${{ status: SwapUpdateEvent.InvoiceFailedToPay, failureReason: 'reason' }}
    `('should get and set swap update "$status"', async ({ status }) => {
      const id = 'id';
      await client.set(id, status);
      await expect(client.get(id)).resolves.toEqual(status);
    });

    test('should get cache size', async () => {
      await client.set('id', { status: SwapUpdateEvent.TransactionMempool });
      await client.set('id2', { status: SwapUpdateEvent.TransactionClaimed });
      await expect(client.size()).resolves.toEqual(2);
    });

    test('should clear cache', async () => {
      await client.set('id', { status: SwapUpdateEvent.TransactionMempool });
      await client.set('id2', { status: SwapUpdateEvent.TransactionClaimed });
      await client.clear();
      await expect(client.size()).resolves.toEqual(0);
    });

    test('should delete entry', async () => {
      const id1 = 'id1';
      const id2 = 'id2';
      await client.set(id1, { status: SwapUpdateEvent.TransactionMempool });
      await client.set(id2, { status: SwapUpdateEvent.TransactionClaimed });

      await client.delete(id1);

      await expect(client.get(id1)).resolves.toBeUndefined();
      await expect(client.get(id2)).resolves.toEqual({
        status: SwapUpdateEvent.TransactionClaimed,
      });
      await expect(client.size()).resolves.toEqual(1);
    });
  });
});
