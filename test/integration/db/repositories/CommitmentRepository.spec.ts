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
      transactionHash: string;
      logIndex: number;
      signature: Buffer;
    }>,
  ) => ({
    swapId: overrides?.swapId ?? `swap-${randomBytes(8).toString('hex')}`,
    transactionHash:
      overrides?.transactionHash ?? `0x${randomBytes(32).toString('hex')}`,
    logIndex: overrides?.logIndex ?? 0,
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
      expect(result.transactionHash).toEqual(commitment.transactionHash);
      expect(result.logIndex).toEqual(commitment.logIndex);
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

    test('should fail when creating duplicate transactionHash and logIndex', async () => {
      const transactionHash = `0x${randomBytes(32).toString('hex')}`;
      const logIndex = 5;

      const commitment1 = createCommitment({ transactionHash, logIndex });
      const commitment2 = createCommitment({ transactionHash, logIndex });

      await CommitmentRepository.create(commitment1);

      await expect(CommitmentRepository.create(commitment2)).rejects.toThrow();
    });

    test('should allow same transactionHash with different logIndex', async () => {
      const transactionHash = `0x${randomBytes(32).toString('hex')}`;

      const commitment1 = createCommitment({ transactionHash, logIndex: 0 });
      const commitment2 = createCommitment({ transactionHash, logIndex: 1 });

      await CommitmentRepository.create(commitment1);
      const result = await CommitmentRepository.create(commitment2);

      expect(result.transactionHash).toEqual(transactionHash);
      expect(result.logIndex).toEqual(1);
    });
  });

  describe('getBySwapId', () => {
    test('should return commitment by swapId', async () => {
      const commitment = createCommitment();
      await CommitmentRepository.create(commitment);

      const result = await CommitmentRepository.getBySwapId(commitment.swapId);

      expect(result).not.toBeNull();
      expect(result!.swapId).toEqual(commitment.swapId);
      expect(result!.transactionHash).toEqual(commitment.transactionHash);
      expect(result!.logIndex).toEqual(commitment.logIndex);
      expect(result!.signature).toEqual(commitment.signature);
    });

    test('should return null for non-existent swapId', async () => {
      const result =
        await CommitmentRepository.getBySwapId('non-existent-swap');

      expect(result).toBeNull();
    });
  });

  describe('getByTransactionHashAndLogIndex', () => {
    test('should return commitment by transactionHash and logIndex', async () => {
      const commitment = createCommitment();
      await CommitmentRepository.create(commitment);

      const result = await CommitmentRepository.getByTransactionHashAndLogIndex(
        commitment.transactionHash,
        commitment.logIndex,
      );

      expect(result).not.toBeNull();
      expect(result!.swapId).toEqual(commitment.swapId);
      expect(result!.transactionHash).toEqual(commitment.transactionHash);
      expect(result!.logIndex).toEqual(commitment.logIndex);
    });

    test('should return null for non-existent transactionHash', async () => {
      const result = await CommitmentRepository.getByTransactionHashAndLogIndex(
        '0xnonexistent',
        0,
      );

      expect(result).toBeNull();
    });

    test('should return null for non-existent logIndex', async () => {
      const commitment = createCommitment();
      await CommitmentRepository.create(commitment);

      const result = await CommitmentRepository.getByTransactionHashAndLogIndex(
        commitment.transactionHash,
        999,
      );

      expect(result).toBeNull();
    });

    test('should distinguish between different logIndexes for same transactionHash', async () => {
      const transactionHash = `0x${randomBytes(32).toString('hex')}`;

      const commitment1 = createCommitment({ transactionHash, logIndex: 0 });
      const commitment2 = createCommitment({ transactionHash, logIndex: 1 });

      await CommitmentRepository.create(commitment1);
      await CommitmentRepository.create(commitment2);

      const result1 =
        await CommitmentRepository.getByTransactionHashAndLogIndex(
          transactionHash,
          0,
        );
      const result2 =
        await CommitmentRepository.getByTransactionHashAndLogIndex(
          transactionHash,
          1,
        );

      expect(result1!.swapId).toEqual(commitment1.swapId);
      expect(result2!.swapId).toEqual(commitment2.swapId);
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
