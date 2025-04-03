import { randomBytes } from 'crypto';
import Logger from '../../../../lib/Logger';
import { getHexString } from '../../../../lib/Utils';
import { LightningPaymentStatus } from '../../../../lib/db/models/LightningPayment';
import { NodeType } from '../../../../lib/db/models/ReverseSwap';
import LightningPaymentRepository from '../../../../lib/db/repositories/LightningPaymentRepository';
import type { LightningClient } from '../../../../lib/lightning/LightningClient';
import NodePendingPaymentTracker from '../../../../lib/lightning/paymentTrackers/NodePendingPaymentTracker';

class MockTracker extends NodePendingPaymentTracker {
  constructor() {
    super(Logger.disabledLogger, NodeType.CLN);
  }

  public trackPayment = jest.fn();

  public watchPayment = jest.fn();

  public isPermanentError = jest.fn();

  public parseErrorMessage = jest.fn();
}

describe('NodePendingPaymentTracker', () => {
  describe('handleFailedPayment', () => {
    const tracker = new MockTracker();

    beforeEach(() => {
      tracker.isPermanentError = jest.fn().mockReturnValue(false);
      tracker.parseErrorMessage = jest.fn().mockImplementation((msg) => msg);
    });

    test('should set permanent failures', async () => {
      tracker.isPermanentError = jest.fn().mockReturnValue(true);

      const msg = 'incorrect payment details';
      const preimageHash = getHexString(randomBytes(32));

      LightningPaymentRepository.setStatus = jest.fn();

      await tracker['handleFailedPayment'](
        {
          isConnected: jest.fn().mockReturnValue(true),
        } as unknown as LightningClient,
        preimageHash,
        msg,
      );

      expect(LightningPaymentRepository.setStatus).toHaveBeenCalledTimes(1);
      expect(LightningPaymentRepository.setStatus).toHaveBeenCalledWith(
        preimageHash,
        NodeType.CLN,
        LightningPaymentStatus.PermanentFailure,
        msg,
      );
    });

    test('should set temporary failures', async () => {
      const preimageHash = getHexString(randomBytes(32));

      LightningPaymentRepository.setStatus = jest.fn();

      await tracker['handleFailedPayment'](
        {
          isConnected: jest.fn().mockReturnValue(true),
        } as unknown as LightningClient,
        preimageHash,
        'idk try again',
      );

      expect(LightningPaymentRepository.setStatus).toHaveBeenCalledTimes(1);
      expect(LightningPaymentRepository.setStatus).toHaveBeenCalledWith(
        preimageHash,
        NodeType.CLN,
        LightningPaymentStatus.TemporaryFailure,
        undefined,
      );
    });

    test('should not fail payment if client is not connected', async () => {
      LightningPaymentRepository.setStatus = jest.fn();

      const client = {
        isConnected: jest.fn().mockReturnValue(false),
      } as unknown as LightningClient;

      await tracker['handleFailedPayment'](
        client,
        getHexString(randomBytes(32)),
        'error',
      );

      expect(LightningPaymentRepository.setStatus).not.toHaveBeenCalled();
    });

    test('should not fail payment when connection is dropped', async () => {
      LightningPaymentRepository.setStatus = jest.fn();

      const client = {
        isConnected: jest.fn().mockReturnValue(true),
      } as unknown as LightningClient;

      await tracker['handleFailedPayment'](
        client,
        getHexString(randomBytes(32)),
        'Connection dropped',
      );

      expect(LightningPaymentRepository.setStatus).not.toHaveBeenCalled();
    });
  });
});
