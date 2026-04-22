import { SwapUpdateEvent, SwapVersion } from '../../../../lib/consts/Enums';
import type Database from '../../../../lib/db/Database';
import ExtraFee from '../../../../lib/db/models/ExtraFee';
import Pair from '../../../../lib/db/models/Pair';
import Swap from '../../../../lib/db/models/Swap';
import ExtraFeeRepository from '../../../../lib/db/repositories/ExtraFeeRepository';
import { getPostgresDatabase } from '../../../Utils';

describe('ExtraFeeRepository', () => {
  const extraFeeFixture = {
    swapId: 'swapId',
    id: 'ref',
    fee: 1000,
    percentage: 0.123,
  };

  let database: Database;

  const truncate = async () => {
    await ExtraFee.destroy({ where: {}, truncate: true, cascade: true });
    await Swap.destroy({ where: {}, truncate: true, cascade: true });
    await Pair.destroy({ where: {}, truncate: true, cascade: true });
  };

  beforeAll(async () => {
    database = getPostgresDatabase();
    await database.init();
  });

  beforeEach(truncate);
  afterEach(truncate);

  afterAll(async () => {
    await database.close();
  });

  test('should create', async () => {
    await ExtraFeeRepository.create(extraFeeFixture);

    const fetched = await ExtraFeeRepository.get(extraFeeFixture.swapId);
    expect(fetched).not.toBeNull();
    expect(fetched).toMatchObject({
      ...extraFeeFixture,
      percentage: String(extraFeeFixture.percentage),
    });
  });

  test('should set fee', async () => {
    await ExtraFeeRepository.create(extraFeeFixture);
    await ExtraFeeRepository.setFee(extraFeeFixture.swapId, 2000);

    const fetched = await ExtraFeeRepository.get(extraFeeFixture.swapId);
    expect(fetched).not.toBeNull();
    expect(fetched!.fee).toEqual(2000);
  });

  describe('prototype-pollution defence', () => {
    const referralId = 'prototype-pollution-test';

    const seedMaliciousRow = async (id: string, swapId: string) => {
      await Pair.findOrCreate({
        where: { id: 'BTC/BTC' },
        defaults: { id: 'BTC/BTC', base: 'BTC', quote: 'BTC' },
      });

      await Swap.create({
        id: swapId,
        pair: 'BTC/BTC',
        orderSide: 0,
        version: SwapVersion.Taproot,
        status: SwapUpdateEvent.InvoiceSettled,
        preimageHash: swapId.padEnd(64, '0'),
        lockupAddress: `bc1-${swapId}`,
        timeoutBlockHeight: 1,
        invoiceAmount: 100_000,
        onchainAmount: 99_500,
        createdRefundSignature: false,
        referral: referralId,
      });

      await ExtraFeeRepository.create({
        swapId,
        id,
        fee: 1000,
        percentage: 0.1,
      });
    };

    const snapshotPrototypeKeys = () =>
      new Set(Object.getOwnPropertyNames(Object.prototype));

    test.each(['__proto__', 'constructor', 'prototype'])(
      'mergeStats refuses DB row with unsafe id "%s" and leaves Object.prototype clean',
      async (unsafeId) => {
        await seedMaliciousRow(
          unsafeId,
          `swap-${Buffer.from(unsafeId).toString('hex')}`,
        );

        const extraStats =
          await ExtraFeeRepository.getStatsByReferral(referralId);
        expect(extraStats.some((row) => row.id === unsafeId)).toBe(true);

        const before = snapshotPrototypeKeys();

        expect(() => ExtraFeeRepository.mergeStats({}, extraStats)).toThrow(
          `unsafe object key: ${unsafeId}`,
        );

        expect(snapshotPrototypeKeys()).toEqual(before);
        expect(({} as any).volume).toBeUndefined();
        expect(({} as any).trades).toBeUndefined();
        expect(({} as any).failureRates).toBeUndefined();
      },
    );

    test.each(['__proto__', 'constructor', 'prototype'])(
      'getFeesByReferral does not pollute Object.prototype for DB row with unsafe id "%s"',
      async (unsafeId) => {
        await seedMaliciousRow(
          unsafeId,
          `fee-${Buffer.from(unsafeId).toString('hex')}`,
        );

        const before = snapshotPrototypeKeys();

        await ExtraFeeRepository.getFeesByReferral(referralId);

        expect(snapshotPrototypeKeys()).toEqual(before);
        expect(({} as any).volume).toBeUndefined();
      },
    );
  });
});
