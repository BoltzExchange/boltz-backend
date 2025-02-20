import Logger from '../../../../lib/Logger';
import Database from '../../../../lib/db/Database';
import ExtraFee from '../../../../lib/db/models/ExtraFee';
import ExtraFeeRepository from '../../../../lib/db/repositories/ExtraFeeRepository';

describe('ExtraFeeRepository', () => {
  const extraFeeFixture = {
    swapId: 'swapId',
    id: 'ref',
    fee: 1000,
    percentage: 0.123,
  };

  let database: Database;

  beforeAll(async () => {
    database = new Database(Logger.disabledLogger, Database.memoryDatabase);
    await database.init();
  });

  beforeEach(async () => {
    await ExtraFee.destroy({
      truncate: true,
    });
  });

  afterAll(async () => {
    await database.close();
  });

  test('should create', async () => {
    await ExtraFeeRepository.create(extraFeeFixture);

    const fetched = await ExtraFeeRepository.get(extraFeeFixture.swapId);
    expect(fetched).not.toBeNull();
    expect(fetched).toMatchObject(extraFeeFixture);
  });

  test('should set fee', async () => {
    await ExtraFeeRepository.create(extraFeeFixture);
    await ExtraFeeRepository.setFee(extraFeeFixture.swapId, 2000);

    const fetched = await ExtraFeeRepository.get(extraFeeFixture.swapId);
    expect(fetched).not.toBeNull();
    expect(fetched!.fee).toEqual(2000);
  });
});
