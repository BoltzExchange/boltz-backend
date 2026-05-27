import { randomBytes } from 'crypto';
import Logger from '../../../../lib/Logger';
import Database from '../../../../lib/db/Database';
import SwapRoutingMetadata from '../../../../lib/db/models/SwapRoutingMetadata';
import SwapRoutingMetadataRepository from '../../../../lib/db/repositories/SwapRoutingMetadataRepository';

describe('SwapRoutingMetadataRepository', () => {
  let database: Database;

  beforeAll(async () => {
    database = new Database(Logger.disabledLogger, Database.memoryDatabase);
    await database.init();
  });

  beforeEach(async () => {
    await SwapRoutingMetadata.truncate();
  });

  afterAll(async () => {
    await database.close();
  });

  test('should add and get encrypted routing metadata', async () => {
    const swapId = 'swapId';
    const data = Buffer.concat([Buffer.from([1]), randomBytes(44)]);

    await SwapRoutingMetadataRepository.add(swapId, data);
    const metadata = await SwapRoutingMetadataRepository.get(swapId);

    expect(metadata).not.toBeNull();
    expect(metadata!.swapId).toEqual(swapId);
    expect(metadata!.data).toEqual(data);
    expect(metadata!.createdAt).toBeInstanceOf(Date);
    expect(metadata!.updatedAt).toBeInstanceOf(Date);
  });
});
