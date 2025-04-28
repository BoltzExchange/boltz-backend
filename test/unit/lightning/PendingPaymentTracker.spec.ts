import { randomBytes } from 'crypto';
import Logger from '../../../lib/Logger';
import {
  getHexString,
  minutesToMilliseconds,
  secondsToMilliseconds,
} from '../../../lib/Utils';
import type LightningPayment from '../../../lib/db/models/LightningPayment';
import { LightningPaymentStatus } from '../../../lib/db/models/LightningPayment';
import { NodeType } from '../../../lib/db/models/ReverseSwap';
import type Swap from '../../../lib/db/models/Swap';
import LightningPaymentRepository from '../../../lib/db/repositories/LightningPaymentRepository';
import ReferralRepository from '../../../lib/db/repositories/ReferralRepository';
import LightningErrors from '../../../lib/lightning/Errors';
import type { LightningClient } from '../../../lib/lightning/LightningClient';
import PendingPaymentTracker from '../../../lib/lightning/PendingPaymentTracker';
import type ClnPendingPaymentTracker from '../../../lib/lightning/paymentTrackers/ClnPendingPaymentTracker';

describe('PendingPaymentTracker', () => {
  const paymentTimeoutMinutes = 30;
  const tracker = new PendingPaymentTracker(
    Logger.disabledLogger,
    {} as any,
    paymentTimeoutMinutes,
  );
  const trackerWithoutPaymentTimeout = new PendingPaymentTracker(
    Logger.disabledLogger,
    {} as any,
  );

  describe('constructor', () => {
    let mockLogger: any;

    beforeEach(() => {
      mockLogger = {
        info: jest.fn(),
        debug: jest.fn(),
      };
    });

    test('should set paymentTimeoutMinutes when a valid number is provided', () => {
      const validTimeout = 45;
      const numericTracker = new PendingPaymentTracker(
        mockLogger,
        {} as any,
        validTimeout,
      );

      expect(numericTracker['paymentTimeoutMinutes']).toBe(validTimeout);
      expect(mockLogger.info).toHaveBeenCalledWith(
        `Payment timeout configured: ${validTimeout} minutes`,
      );
      (
        numericTracker.lightningTrackers[
          NodeType.CLN
        ] as ClnPendingPaymentTracker
      ).stop();
    });

    test('should not set paymentTimeoutMinutes when undefined is provided', () => {
      const undefinedTracker = new PendingPaymentTracker(
        mockLogger,
        {} as any,
        undefined,
      );

      expect(undefinedTracker['paymentTimeoutMinutes']).toBeUndefined();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Payment timeout not configured',
      );
      (
        undefinedTracker.lightningTrackers[
          NodeType.CLN
        ] as ClnPendingPaymentTracker
      ).stop();
    });

    test('should not set paymentTimeoutMinutes when non-numeric value is provided', () => {
      const stringTracker = new PendingPaymentTracker(
        mockLogger,
        {} as any,
        '60' as any,
      );

      expect(stringTracker['paymentTimeoutMinutes']).toBeUndefined();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Payment timeout not configured',
      );
      (
        stringTracker.lightningTrackers[
          NodeType.CLN
        ] as ClnPendingPaymentTracker
      ).stop();
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    (
      tracker.lightningTrackers[NodeType.CLN] as ClnPendingPaymentTracker
    ).stop();
    (
      trackerWithoutPaymentTimeout.lightningTrackers[
        NodeType.CLN
      ] as ClnPendingPaymentTracker
    ).stop();
  });

  describe('sendPaymentWithNode', () => {
    const lightningClient = {
      type: NodeType.LND,
      sendPayment: jest.fn().mockResolvedValue({
        feeMsat: 21,
        preimage: randomBytes(32),
      }),
    } as unknown as LightningClient;

    beforeAll(() => {
      LightningPaymentRepository.create = jest.fn();
      LightningPaymentRepository.setStatus = jest.fn();
    });

    test('should use max payment fee ratio from referral', async () => {
      const swap = {
        pair: 'BTC/BTC',
        referral: 'test',
        invoice: 'invoice',
      } as unknown as Swap;

      ReferralRepository.getReferralById = jest.fn().mockResolvedValue({
        maxRoutingFeeRatio: jest.fn().mockReturnValue(0.01),
      });

      await tracker['sendPaymentWithNode'](
        swap,
        lightningClient,
        getHexString(randomBytes(32)),
      );

      expect(ReferralRepository.getReferralById).toHaveBeenCalledTimes(1);
      expect(ReferralRepository.getReferralById).toHaveBeenCalledWith(
        swap.referral,
      );

      expect(lightningClient.sendPayment).toHaveBeenCalledTimes(1);
      expect(lightningClient.sendPayment).toHaveBeenCalledWith(
        swap.invoice,
        undefined,
        undefined,
        0.01,
      );
    });

    test('should not throw no referral for swap can be found', async () => {
      const swap = {
        pair: 'BTC/BTC',
        referral: 'test',
        invoice: 'invoice',
      } as unknown as Swap;

      ReferralRepository.getReferralById = jest.fn().mockResolvedValue(null);

      await tracker['sendPaymentWithNode'](
        swap,
        lightningClient,
        getHexString(randomBytes(32)),
      );

      expect(ReferralRepository.getReferralById).toHaveBeenCalledTimes(1);
      expect(ReferralRepository.getReferralById).toHaveBeenCalledWith(
        swap.referral,
      );

      expect(lightningClient.sendPayment).toHaveBeenCalledTimes(1);
      expect(lightningClient.sendPayment).toHaveBeenCalledWith(
        swap.invoice,
        undefined,
        undefined,
        undefined,
      );
    });

    test('should not throw when swap has no referral', async () => {
      const swap = {
        pair: 'BTC/BTC',
        invoice: 'invoice',
      } as unknown as Swap;

      ReferralRepository.getReferralById = jest.fn().mockResolvedValue({});

      await tracker['sendPaymentWithNode'](
        swap,
        lightningClient,
        getHexString(randomBytes(32)),
      );

      expect(ReferralRepository.getReferralById).toHaveBeenCalledTimes(0);

      expect(lightningClient.sendPayment).toHaveBeenCalledTimes(1);
      expect(lightningClient.sendPayment).toHaveBeenCalledWith(
        swap.invoice,
        undefined,
        undefined,
        undefined,
      );
    });

    test('should watch payment for temporarily failed CLN payments', async () => {
      const clnClient = {
        type: NodeType.CLN,
        sendPayment: jest.fn().mockRejectedValue('xpay doing something weird'),
      } as unknown as LightningClient;

      tracker.lightningTrackers[NodeType.CLN].watchPayment = jest.fn();

      const swap = {
        pair: 'BTC/BTC',
        invoice: 'invoice',
      } as unknown as Swap;

      const preimageHash = getHexString(randomBytes(32));

      await expect(
        tracker['sendPaymentWithNode'](swap, clnClient, preimageHash),
      ).resolves.toEqual(undefined);

      expect(
        tracker.lightningTrackers[NodeType.CLN].watchPayment,
      ).toHaveBeenCalledTimes(1);
      expect(
        tracker.lightningTrackers[NodeType.CLN].watchPayment,
      ).toHaveBeenCalledWith(clnClient, swap.invoice, preimageHash);
    });
  });

  describe('checkInvoiceTimeout', () => {
    const swapId = 'testSwap123';
    const paymentHash = 'paymentHash123';
    const nodeType = NodeType.LND;
    const expectedError = LightningErrors.PAYMENT_TIMED_OUT().message;

    beforeEach(() => {
      jest.clearAllMocks();
      LightningPaymentRepository.setStatus = jest.fn().mockResolvedValue([1]);

      jest.spyOn(Date, 'now').mockReturnValue(1742265902131);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('should not time out when there are no payments', async () => {
      const payments: LightningPayment[] = [];

      await expect(
        tracker['checkInvoiceTimeout'](
          { id: swapId },
          paymentHash,
          nodeType,
          payments,
        ),
      ).resolves.toBeUndefined();

      expect(LightningPaymentRepository.setStatus).not.toHaveBeenCalled();
    });

    test('should not time out when payments are recent', async () => {
      const recentPayment = {
        status: LightningPaymentStatus.TemporaryFailure,
        createdAt: new Date(
          Date.now() - minutesToMilliseconds(paymentTimeoutMinutes / 2),
        ),
      } as LightningPayment;

      await expect(
        tracker['checkInvoiceTimeout']({ id: swapId }, paymentHash, nodeType, [
          recentPayment,
        ]),
      ).resolves.toBeUndefined();

      expect(LightningPaymentRepository.setStatus).not.toHaveBeenCalled();
    });

    test('should not time out when timeout is not configured', async () => {
      const oldPayment = {
        status: LightningPaymentStatus.TemporaryFailure,
        createdAt: new Date(
          Date.now() - minutesToMilliseconds(paymentTimeoutMinutes + 5),
        ),
      } as LightningPayment;

      await expect(
        trackerWithoutPaymentTimeout['checkInvoiceTimeout'](
          { id: swapId },
          paymentHash,
          nodeType,
          [oldPayment],
        ),
      ).resolves.toBeUndefined();

      expect(LightningPaymentRepository.setStatus).not.toHaveBeenCalled();
    });

    test('should time out when one of the payments exceeds timeout', async () => {
      const payments = [
        {
          status: LightningPaymentStatus.Pending,
          createdAt: new Date(
            Date.now() - minutesToMilliseconds(paymentTimeoutMinutes / 3),
          ),
        } as LightningPayment,
        {
          status: LightningPaymentStatus.TemporaryFailure,
          createdAt: new Date(
            Date.now() - minutesToMilliseconds(paymentTimeoutMinutes + 1),
          ),
        } as LightningPayment,
        {
          status: LightningPaymentStatus.TemporaryFailure,
          createdAt: new Date(
            Date.now() - minutesToMilliseconds(paymentTimeoutMinutes / 2),
          ),
        } as LightningPayment,
      ];

      await expect(
        tracker['checkInvoiceTimeout'](
          { id: swapId },
          paymentHash,
          nodeType,
          payments,
        ),
      ).rejects.toEqual(expectedError);

      expect(LightningPaymentRepository.setStatus).toHaveBeenCalledWith(
        paymentHash,
        nodeType,
        LightningPaymentStatus.PermanentFailure,
        expectedError,
      );
    });

    test('should not consider payments with statuses other than TemporaryFailure', async () => {
      const payments = [
        {
          status: LightningPaymentStatus.PermanentFailure,
          createdAt: new Date(
            Date.now() - minutesToMilliseconds(paymentTimeoutMinutes * 2),
          ),
        } as LightningPayment,
        {
          status: LightningPaymentStatus.Success,
          createdAt: new Date(
            Date.now() - minutesToMilliseconds(paymentTimeoutMinutes * 2),
          ),
        } as LightningPayment,
        {
          status: LightningPaymentStatus.Pending,
          createdAt: new Date(
            Date.now() - minutesToMilliseconds(paymentTimeoutMinutes * 2),
          ),
        } as LightningPayment,
      ];

      await expect(
        tracker['checkInvoiceTimeout'](
          { id: swapId },
          paymentHash,
          nodeType,
          payments,
        ),
      ).resolves.toBeUndefined();

      expect(LightningPaymentRepository.setStatus).not.toHaveBeenCalled();
    });

    test('should respect swap.paymentTimeout over global timeout', async () => {
      const oldPayment = {
        status: LightningPaymentStatus.TemporaryFailure,
        createdAt: new Date(Date.now() - secondsToMilliseconds(2)),
      } as LightningPayment;

      await expect(
        tracker['checkInvoiceTimeout'](
          { id: swapId, paymentTimeout: 1 },
          paymentHash,
          nodeType,
          [oldPayment],
        ),
      ).rejects.toEqual(expectedError);
      expect(LightningPaymentRepository.setStatus).toHaveBeenCalledWith(
        paymentHash,
        nodeType,
        LightningPaymentStatus.PermanentFailure,
        expectedError,
      );
    });
  });
});
