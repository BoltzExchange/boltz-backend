import { randomBytes } from 'crypto';
import { Signature } from 'ethers';
import { getHexBuffer } from '../../../../lib/Utils';
import type Database from '../../../../lib/db/Database';
import Commitment from '../../../../lib/db/models/Commitment';
import CommitmentRepository from '../../../../lib/db/repositories/CommitmentRepository';
import { getPostgresDatabase } from '../../../Utils';

describe('CommitmentRepository', () => {
  let database: Database;

  const createCommitment = (
    overrides?: Partial<{
      swapId: string;
      lockupHash: string;
      transactionHash: string;
      signature: Buffer;
    }>,
  ) => ({
    swapId: overrides?.swapId ?? `swap-${randomBytes(8).toString('hex')}`,
    lockupHash: overrides?.lockupHash ?? `0x${randomBytes(32).toString('hex')}`,
    transactionHash:
      overrides?.transactionHash ?? `0x${randomBytes(32).toString('hex')}`,
    signature: overrides?.signature ?? randomBytes(65),
  });

  beforeAll(async () => {
    database = getPostgresDatabase();
    await Commitment.drop();
    await database.init();
  });

  beforeEach(async () => {
    await Commitment.truncate();
  });

  afterAll(async () => {
    await Commitment.drop();
    await database.close();
  });

  describe('create', () => {
    test('should create a commitment', async () => {
      const commitment = createCommitment();

      const result = await CommitmentRepository.create(commitment);

      expect(result.swapId).toEqual(commitment.swapId);
      expect(result.lockupHash).toEqual(commitment.lockupHash);
      expect(result.transactionHash).toEqual(commitment.transactionHash);
      expect(result.signature).toEqual(commitment.signature);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    test('should fail when creating duplicate swapId', async () => {
      const swapId = 'duplicate-swap-id';
      const commitment1 = createCommitment({ swapId });
      const commitment2 = createCommitment({ swapId });

      await CommitmentRepository.create(commitment1);

      await expect(CommitmentRepository.create(commitment2)).rejects.toThrow();
    });

    test('should fail when creating duplicate lockupHash', async () => {
      const lockupHash = `0x${randomBytes(32).toString('hex')}`;

      const commitment1 = createCommitment({ lockupHash });
      const commitment2 = createCommitment({ lockupHash });

      await CommitmentRepository.create(commitment1);

      await expect(CommitmentRepository.create(commitment2)).rejects.toThrow();
    });

    test('should allow same transactionHash with different lockupHash', async () => {
      const transactionHash = `0x${randomBytes(32).toString('hex')}`;

      const commitment1 = createCommitment({ transactionHash });
      const commitment2 = createCommitment({ transactionHash });

      await CommitmentRepository.create(commitment1);
      const result = await CommitmentRepository.create(commitment2);

      expect(result.transactionHash).toEqual(transactionHash);
    });
  });

  describe('getBySwapId', () => {
    test('should return commitment by swapId', async () => {
      const commitment = createCommitment();
      await CommitmentRepository.create(commitment);

      const result = await CommitmentRepository.getBySwapId(commitment.swapId);

      expect(result).not.toBeNull();
      expect(result!.swapId).toEqual(commitment.swapId);
      expect(result!.lockupHash).toEqual(commitment.lockupHash);
      expect(result!.transactionHash).toEqual(commitment.transactionHash);
      expect(result!.signature).toEqual(commitment.signature);
    });

    test('should return null for non-existent swapId', async () => {
      const result =
        await CommitmentRepository.getBySwapId('non-existent-swap');

      expect(result).toBeNull();
    });
  });

  describe('getBySwapIds', () => {
    test('should return commitments for multiple swapIds', async () => {
      const commitment1 = createCommitment();
      const commitment2 = createCommitment();
      const commitment3 = createCommitment();

      await CommitmentRepository.create(commitment1);
      await CommitmentRepository.create(commitment2);
      await CommitmentRepository.create(commitment3);

      const result = await CommitmentRepository.getBySwapIds([
        commitment1.swapId,
        commitment2.swapId,
        commitment3.swapId,
      ]);

      expect(result.size).toEqual(3);
      expect(result.get(commitment1.swapId)!.swapId).toEqual(
        commitment1.swapId,
      );
      expect(result.get(commitment2.swapId)!.swapId).toEqual(
        commitment2.swapId,
      );
      expect(result.get(commitment3.swapId)!.swapId).toEqual(
        commitment3.swapId,
      );
    });

    test('should return empty map for non-existent swapIds', async () => {
      const result = await CommitmentRepository.getBySwapIds([
        'non-existent-1',
        'non-existent-2',
      ]);

      expect(result.size).toEqual(0);
    });

    test('should return empty map for empty input array', async () => {
      const result = await CommitmentRepository.getBySwapIds([]);

      expect(result.size).toEqual(0);
    });

    test('should return only matching commitments when some IDs do not exist', async () => {
      const commitment1 = createCommitment();
      const commitment2 = createCommitment();

      await CommitmentRepository.create(commitment1);
      await CommitmentRepository.create(commitment2);

      const result = await CommitmentRepository.getBySwapIds([
        commitment1.swapId,
        'non-existent',
        commitment2.swapId,
      ]);

      expect(result.size).toEqual(2);
      expect(result.get(commitment1.swapId)!.swapId).toEqual(
        commitment1.swapId,
      );
      expect(result.get(commitment2.swapId)!.swapId).toEqual(
        commitment2.swapId,
      );
      expect(result.get('non-existent')).toBeUndefined();
    });
  });

  describe('getByLockupHash', () => {
    test('should return commitment by lockupHash', async () => {
      const commitment = createCommitment();
      await CommitmentRepository.create(commitment);

      const result = await CommitmentRepository.getByLockupHash(
        commitment.lockupHash,
      );

      expect(result).not.toBeNull();
      expect(result!.swapId).toEqual(commitment.swapId);
      expect(result!.lockupHash).toEqual(commitment.lockupHash);
      expect(result!.transactionHash).toEqual(commitment.transactionHash);
    });

    test('should return null for non-existent lockupHash', async () => {
      const result = await CommitmentRepository.getByLockupHash(
        '0xnonexistent0000000000000000000000000000000000000000000000000000',
      );

      expect(result).toBeNull();
    });
  });

  describe('signatureEthers', () => {
    test('should return ethers Signature from buffer', async () => {
      const signature = Signature.from(
        '0x50f29beaafa5f4e6780b4e477335dca0bfee4079cfa90fca991e4448230d171973de798da616df06125d2c570f3fc70647dfa3d06f5029907141b626372b0abf1b',
      );

      const commitment = createCommitment({
        signature: getHexBuffer(signature.compactSerialized.slice(2)),
      });
      const result = await CommitmentRepository.create(commitment);
      expect(result.signatureEthers.serialized).toEqual(signature.serialized);
    });
  });
});
