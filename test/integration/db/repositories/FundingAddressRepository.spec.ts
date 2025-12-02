import type Database from '../../../../lib/db/Database';
import FundingAddress from '../../../../lib/db/models/FundingAddress';
import FundingAddressRepository from '../../../../lib/db/repositories/FundingAddressRepository';
import { getPostgresDatabase } from '../../../Utils';

describe('FundingAddressRepository', () => {
  let database: Database;

  beforeAll(async () => {
    database = getPostgresDatabase();
    await database.init();
  });

  beforeEach(async () => {
    await FundingAddress.truncate();
  });

  afterAll(async () => {
    await database.close();
  });

  describe('addFundingAddress', () => {
    test('should add a new funding address', async () => {
      const fundingAddress = await FundingAddressRepository.addFundingAddress({
        id: 'test123',
        symbol: 'BTC',
        keyIndex: 0,
        theirPublicKey:
          'e5b4f43d66647713102a5e65be6ee689a16b44cfae716c724e319c9023e63452',
        timeoutBlockHeight: 1000,
        lockupConfirmed: false,
      });

      expect(fundingAddress.id).toEqual('test123');
      expect(fundingAddress.symbol).toEqual('BTC');
      expect(fundingAddress.keyIndex).toEqual(0);
      expect(fundingAddress.theirPublicKey).toEqual(
        'e5b4f43d66647713102a5e65be6ee689a16b44cfae716c724e319c9023e63452',
      );
      expect(fundingAddress.timeoutBlockHeight).toEqual(1000);
      expect(fundingAddress.lockupConfirmed).toEqual(false);
    });
  });

  describe('getFundingAddressById', () => {
    test('should get funding address by id', async () => {
      await FundingAddressRepository.addFundingAddress({
        id: 'gettest123',
        symbol: 'BTC',
        keyIndex: 5,
        theirPublicKey:
          'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        timeoutBlockHeight: 2000,
        lockupConfirmed: false,
      });

      const result =
        await FundingAddressRepository.getFundingAddressById('gettest123');

      expect(result).not.toBeNull();
      expect(result?.id).toEqual('gettest123');
      expect(result?.symbol).toEqual('BTC');
      expect(result?.keyIndex).toEqual(5);
      expect(result?.timeoutBlockHeight).toEqual(2000);
    });

    test('should return null for non-existent id', async () => {
      const result =
        await FundingAddressRepository.getFundingAddressById('nonexistent');

      expect(result).toBeNull();
    });

    test('should get funding address with all optional fields', async () => {
      const presignedTx = Buffer.from('deadbeef', 'hex');

      await FundingAddressRepository.addFundingAddress({
        id: 'fulltest',
        symbol: 'L-BTC',
        keyIndex: 10,
        theirPublicKey:
          'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        timeoutBlockHeight: 3000,
        lockupConfirmed: true,
        lockupTransactionId: 'txid123',
        lockupAmount: 50000,
        swapId: 'swap456',
        presignedTx,
      });

      const result =
        await FundingAddressRepository.getFundingAddressById('fulltest');

      expect(result).not.toBeNull();
      expect(result?.lockupTransactionId).toEqual('txid123');
      expect(result?.lockupConfirmed).toEqual(true);
      expect(result?.lockupAmount).toEqual(50000);
      expect(result?.swapId).toEqual('swap456');
      expect(result?.presignedTx).toEqual(presignedTx);
    });

    test('should get correct funding address when multiple exist', async () => {
      await FundingAddressRepository.addFundingAddress({
        id: 'first',
        symbol: 'BTC',
        keyIndex: 1,
        theirPublicKey:
          '1111111111111111111111111111111111111111111111111111111111111111',
        timeoutBlockHeight: 100,
        lockupConfirmed: false,
      });

      await FundingAddressRepository.addFundingAddress({
        id: 'second',
        symbol: 'L-BTC',
        keyIndex: 2,
        theirPublicKey:
          '2222222222222222222222222222222222222222222222222222222222222222',
        timeoutBlockHeight: 200,
        lockupConfirmed: false,
      });

      await FundingAddressRepository.addFundingAddress({
        id: 'third',
        symbol: 'BTC',
        keyIndex: 3,
        theirPublicKey:
          '3333333333333333333333333333333333333333333333333333333333333333',
        timeoutBlockHeight: 300,
        lockupConfirmed: false,
      });

      const result =
        await FundingAddressRepository.getFundingAddressById('second');

      expect(result).not.toBeNull();
      expect(result?.id).toEqual('second');
      expect(result?.symbol).toEqual('L-BTC');
      expect(result?.keyIndex).toEqual(2);
    });
  });
});
