import { getHexBuffer } from '../../../../lib/Utils';
import type Database from '../../../../lib/db/Database';
import FundingAddress from '../../../../lib/db/models/FundingAddress';
import type { FundingAddressType } from '../../../../lib/db/models/FundingAddress';
import FundingAddressRepository from '../../../../lib/db/repositories/FundingAddressRepository';
import { getPostgresDatabase } from '../../../Utils';

const createFundingAddress = (
  overrides: Partial<FundingAddressType> = {},
): FundingAddressType => ({
  id: 'test-id',
  status: 'created',
  symbol: 'BTC',
  keyIndex: 0,
  theirPublicKey: getHexBuffer(
    'e5b4f43d66647713102a5e65be6ee689a16b44cfae716c724e319c9023e63452',
  ),
  timeoutBlockHeight: 1000,
  ...overrides,
});

describe('FundingAddressRepository', () => {
  let database: Database;

  beforeAll(async () => {
    database = getPostgresDatabase();
    await database.init();
    await FundingAddress.sync();
  });

  beforeEach(async () => {
    await FundingAddress.truncate();
  });

  afterAll(async () => {
    await database.close();
  });

  describe('addFundingAddress', () => {
    test('should add a new funding address', async () => {
      const input = createFundingAddress({ id: 'test123' });
      const result = await FundingAddressRepository.addFundingAddress(input);

      expect(result.id).toEqual('test123');
      expect(result.status).toEqual('created');
      expect(result.symbol).toEqual('BTC');
      expect(result.keyIndex).toEqual(0);
      expect(result.theirPublicKey).toEqual(
        getHexBuffer(
          'e5b4f43d66647713102a5e65be6ee689a16b44cfae716c724e319c9023e63452',
        ),
      );
      expect(result.timeoutBlockHeight).toEqual(1000);
    });
  });

  describe('getFundingAddressById', () => {
    test('should get funding address by id', async () => {
      await FundingAddressRepository.addFundingAddress(
        createFundingAddress({ id: 'gettest123', keyIndex: 5 }),
      );

      const result =
        await FundingAddressRepository.getFundingAddressById('gettest123');

      expect(result).not.toBeNull();
      expect(result?.id).toEqual('gettest123');
      expect(result?.keyIndex).toEqual(5);
    });

    test('should return null for non-existent id', async () => {
      const result =
        await FundingAddressRepository.getFundingAddressById('nonexistent');

      expect(result).toBeNull();
    });

    test('should get funding address with all optional fields', async () => {
      const presignedTx = Buffer.from('deadbeef', 'hex');

      await FundingAddressRepository.addFundingAddress(
        createFundingAddress({
          id: 'fulltest',
          symbol: 'L-BTC',
          lockupTransactionId: 'txid123',
          lockupAmount: 50000,
          swapId: 'swap456',
          presignedTx,
        }),
      );

      const result =
        await FundingAddressRepository.getFundingAddressById('fulltest');

      expect(result).not.toBeNull();
      expect(result?.symbol).toEqual('L-BTC');
      expect(result?.lockupTransactionId).toEqual('txid123');
      expect(result?.lockupAmount).toEqual(50000);
      expect(result?.swapId).toEqual('swap456');
      expect(result?.presignedTx).toEqual(presignedTx);
    });
  });
});
