import Logger from '../../../../lib/Logger';
import Database from '../../../../lib/db/Database';
import LightningPayment, {
  LightningPaymentStatus,
} from '../../../../lib/db/models/LightningPayment';
import Swap from '../../../../lib/db/models/Swap';
import LightningPaymentRepository, {
  Errors,
} from '../../../../lib/db/repositories/LightningPaymentRepository';
import PairRepository from '../../../../lib/db/repositories/PairRepository';
import { createSubmarineSwapData } from './Fixtures';

describe('LightningPaymentRepository', () => {
  let db: Database;
  const lndNodeId = 'lnd-1';
  const clnNodeId = 'cln-1';

  beforeAll(async () => {
    db = new Database(Logger.disabledLogger, Database.memoryDatabase);
    await db.init();

    await PairRepository.addPair({
      id: 'BTC/BTC',
      base: 'BTC',
      quote: 'BTC',
    });
  });

  beforeEach(async () => {
    await LightningPayment.truncate();
    await Swap.truncate();
  });

  afterAll(async () => {
    await db.close();
  });

  describe('create', () => {
    test('should create new lightning payments', async () => {
      const swap = await Swap.create(createSubmarineSwapData());

      const payment = await LightningPaymentRepository.create({
        nodeId: lndNodeId,
        preimageHash: swap.preimageHash,
      });
      expect(payment.retries).toEqual(1);
      expect(payment.preimageHash).toEqual(swap.preimageHash);
      expect(payment.status).toEqual(LightningPaymentStatus.Pending);
    });

    test.each`
      status
      ${LightningPaymentStatus.Pending}
      ${LightningPaymentStatus.Success}
      ${LightningPaymentStatus.PermanentFailure}
    `('should not create when status is $status', async ({ status }) => {
      const swap = await Swap.create(createSubmarineSwapData());
      await LightningPayment.create({
        status,
        nodeId: lndNodeId,
        preimageHash: swap.preimageHash,
      });

      await expect(
        LightningPaymentRepository.create({
          nodeId: lndNodeId,
          preimageHash: swap.preimageHash,
        }),
      ).rejects.toEqual(Errors.PaymentExistsAlready);
    });

    test(`should update when payment with status ${LightningPaymentStatus.TemporaryFailure} exists already`, async () => {
      const swap = await Swap.create(createSubmarineSwapData());
      const existing = await LightningPayment.create({
        retries: 3,
        nodeId: lndNodeId,
        preimageHash: swap.preimageHash,
        status: LightningPaymentStatus.TemporaryFailure,
      });

      const payment = await LightningPaymentRepository.create({
        nodeId: lndNodeId,
        preimageHash: swap.preimageHash,
      });
      expect(payment.retries).toEqual(existing.retries! + 1);
      expect(payment.preimageHash).toEqual(swap.preimageHash);
      expect(payment.status).toEqual(LightningPaymentStatus.Pending);

      await existing.reload();
      expect(existing.status).toEqual(LightningPaymentStatus.Pending);
    });
  });

  describe('setStatus', () => {
    test('should set success status', async () => {
      const swap = await Swap.create(createSubmarineSwapData());
      const payment = await LightningPaymentRepository.create({
        nodeId: lndNodeId,
        preimageHash: swap.preimageHash,
      });

      await expect(
        LightningPaymentRepository.setStatus(
          swap.preimageHash,
          lndNodeId,
          LightningPaymentStatus.Success,
        ),
      ).resolves.toEqual([1]);

      await payment.reload();
      expect(payment.status).toEqual(LightningPaymentStatus.Success);
    });

    test('should set pending status', async () => {
      const swap = await Swap.create(createSubmarineSwapData());
      const payment = await LightningPaymentRepository.create({
        nodeId: lndNodeId,
        preimageHash: swap.preimageHash,
      });
      await payment.update({ status: LightningPaymentStatus.TemporaryFailure });

      await expect(
        LightningPaymentRepository.setStatus(
          swap.preimageHash,
          lndNodeId,
          LightningPaymentStatus.Pending,
        ),
      ).resolves.toEqual([1]);

      await payment.reload();
      expect(payment.status).toEqual(LightningPaymentStatus.Pending);
    });

    test('should set temporary failure status', async () => {
      const swap = await Swap.create(createSubmarineSwapData());
      const payment = await LightningPaymentRepository.create({
        nodeId: lndNodeId,
        preimageHash: swap.preimageHash,
      });

      await expect(
        LightningPaymentRepository.setStatus(
          swap.preimageHash,
          lndNodeId,
          LightningPaymentStatus.TemporaryFailure,
        ),
      ).resolves.toEqual([1]);

      await payment.reload();
      expect(payment.status).toEqual(LightningPaymentStatus.TemporaryFailure);
    });

    test('should set permanent failure status', async () => {
      const swap = await Swap.create(createSubmarineSwapData());
      const payment = await LightningPaymentRepository.create({
        nodeId: lndNodeId,
        preimageHash: swap.preimageHash,
      });

      const error = 'some error';
      await expect(
        LightningPaymentRepository.setStatus(
          swap.preimageHash,
          lndNodeId,
          LightningPaymentStatus.PermanentFailure,
          error,
        ),
      ).resolves.toEqual([1]);

      await payment.reload();
      expect(payment.status).toEqual(LightningPaymentStatus.PermanentFailure);
      expect(payment.error).toEqual(error);
    });

    test.each`
      status
      ${LightningPaymentStatus.Pending}
      ${LightningPaymentStatus.Success}
      ${LightningPaymentStatus.TemporaryFailure}
    `(
      'should not allow error message for status $status',
      async ({ status }) => {
        const swap = await Swap.create(createSubmarineSwapData());
        await LightningPaymentRepository.create({
          nodeId: lndNodeId,
          preimageHash: swap.preimageHash,
        });

        const error = 'some error';
        expect(() =>
          LightningPaymentRepository.setStatus(
            swap.preimageHash,
            lndNodeId,
            status,
            error,
          ),
        ).toThrow(Errors.ErrorSetNonPermanentFailure);
      },
    );

    test('should not allow setting permanent error without error message', async () => {
      const swap = await Swap.create(createSubmarineSwapData());
      await LightningPaymentRepository.create({
        nodeId: lndNodeId,
        preimageHash: swap.preimageHash,
      });

      expect(() =>
        LightningPaymentRepository.setStatus(
          swap.preimageHash,
          lndNodeId,
          LightningPaymentStatus.PermanentFailure,
        ),
      ).toThrow(Errors.ErrorMissingPermanentFailure);
    });
  });

  describe('findByPreimageHash', () => {
    test('should find by preimage hash', async () => {
      const swap = await Swap.create(createSubmarineSwapData());

      await LightningPaymentRepository.create({
        nodeId: lndNodeId,
        preimageHash: swap.preimageHash,
      });
      await LightningPaymentRepository.create({
        nodeId: clnNodeId,
        preimageHash: swap.preimageHash,
      });

      await expect(
        LightningPaymentRepository.findByPreimageHash(swap.preimageHash),
      ).resolves.toHaveLength(2);
    });
  });

  describe('findByPreimageHashAndNodeId', () => {
    test('should find by preimage hash and node id', async () => {
      const swap = await Swap.create(createSubmarineSwapData());

      await LightningPaymentRepository.create({
        nodeId: lndNodeId,
        preimageHash: swap.preimageHash,
      });

      const fetched =
        await LightningPaymentRepository.findByPreimageHashAndNodeId(
          swap.preimageHash,
          lndNodeId,
        );
      expect(fetched!.nodeId).toEqual(lndNodeId);
      expect(fetched!.preimageHash).toEqual(swap.preimageHash);

      await expect(
        LightningPaymentRepository.findByPreimageHashAndNodeId(
          swap.preimageHash,
          clnNodeId,
        ),
      ).resolves.toBeNull();
    });
  });

  describe('findByStatus', () => {
    test('should find by status', async () => {
      const swap = await Swap.create(createSubmarineSwapData());
      await LightningPaymentRepository.create({
        nodeId: lndNodeId,
        preimageHash: swap.preimageHash,
      });

      const res = await LightningPaymentRepository.findByStatus(
        LightningPaymentStatus.Pending,
      );

      expect(res).toHaveLength(1);
      expect(res[0].preimageHash).toEqual(swap.preimageHash);
      expect(res[0].status).toEqual(LightningPaymentStatus.Pending);

      expect(res[0].Swap.id).toEqual(swap.id);
    });
  });
});
