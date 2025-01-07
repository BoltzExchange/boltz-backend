import { randomBytes } from 'crypto';
import Logger from '../../../lib/Logger';
import { getHexString } from '../../../lib/Utils';
import { NodeType } from '../../../lib/db/models/ReverseSwap';
import Swap from '../../../lib/db/models/Swap';
import LightningPaymentRepository from '../../../lib/db/repositories/LightningPaymentRepository';
import ReferralRepository from '../../../lib/db/repositories/ReferralRepository';
import { LightningClient } from '../../../lib/lightning/LightningClient';
import PendingPaymentTracker from '../../../lib/lightning/PendingPaymentTracker';
import ClnPendingPaymentTracker from '../../../lib/lightning/paymentTrackers/ClnPendingPaymentTracker';

describe('PendingPaymentTracker', () => {
  const tracker = new PendingPaymentTracker(Logger.disabledLogger, {} as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    (
      tracker.lightningTrackers[NodeType.CLN] as ClnPendingPaymentTracker
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

    test('should not throw when swap no referral can be found', async () => {
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
  });
});
