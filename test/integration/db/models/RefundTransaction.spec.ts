import Logger from '../../../../lib/Logger';
import Database from '../../../../lib/db/Database';
import RefundTransaction, {
  RefundStatus,
} from '../../../../lib/db/models/RefundTransaction';

describe('RefundTransaction', () => {
  const db = new Database(Logger.disabledLogger, Database.memoryDatabase);

  beforeAll(async () => {
    await db.init();
  });

  beforeEach(async () => {
    await RefundTransaction.truncate();
  });

  afterAll(async () => {
    await db.close();
  });

  test.each`
    status                    | expected
    ${RefundStatus.Confirmed} | ${true}
    ${RefundStatus.Pending}   | ${false}
    ${RefundStatus.Failed}    | ${false}
  `('isFinal getter: $status -> $expected', async ({ status, expected }) => {
    const tx = await RefundTransaction.create({
      swapId: 'swap',
      symbol: 'BTC',
      id: 'tx',
      vin: 123,
      status,
    });
    expect(tx.isFinal).toBe(expected);
  });
});
