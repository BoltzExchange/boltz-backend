import { randomBytes } from 'crypto';
import Logger from '../../../../lib/Logger';
import Database from '../../../../lib/db/Database';
import SwapMetadata from '../../../../lib/db/models/SwapMetadata';
import SwapMetadataRepository from '../../../../lib/db/repositories/SwapMetadataRepository';

describe('SwapMetadataRepository', () => {
  let database: Database;

  beforeAll(async () => {
    database = new Database(Logger.disabledLogger, Database.memoryDatabase);
    await database.init();
    await SwapMetadata.sync();
  });

  beforeEach(async () => {
    await SwapMetadata.truncate();
  });

  afterAll(async () => {
    await database.close();
  });

  test('should set and get metadata', async () => {
    const swapId = 'swapId';
    const data = randomBytes(32);

    await SwapMetadataRepository.set(swapId, data);
    const metadata = await SwapMetadataRepository.get(swapId);

    expect(metadata).not.toBeNull();
    expect(metadata!.swapId).toEqual(swapId);
    expect(metadata!.data).toEqual(data);
    expect(metadata!.createdAt).toBeInstanceOf(Date);
  });

  test('should overwrite metadata', async () => {
    const swapId = 'swapId';
    const first = randomBytes(32);
    const second = randomBytes(32);

    await SwapMetadataRepository.set(swapId, first);
    expect((await SwapMetadataRepository.get(swapId))!.data).toEqual(first);

    await SwapMetadataRepository.set(swapId, second);
    expect((await SwapMetadataRepository.get(swapId))!.data).toEqual(second);
  });

  test('should return null when no metadata exists', async () => {
    await expect(SwapMetadataRepository.get('notFound')).resolves.toBeNull();
  });
});
