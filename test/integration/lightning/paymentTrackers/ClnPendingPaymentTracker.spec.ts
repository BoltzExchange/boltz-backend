import { crypto } from 'bitcoinjs-lib';
import bolt11 from 'bolt11';
import { randomBytes } from 'crypto';
import Logger from '../../../../lib/Logger';
import { getHexBuffer, getHexString } from '../../../../lib/Utils';
import { LightningPaymentStatus } from '../../../../lib/db/models/LightningPayment';
import { NodeType } from '../../../../lib/db/models/ReverseSwap';
import LightningPaymentRepository from '../../../../lib/db/repositories/LightningPaymentRepository';
import ClnPendingPaymentTracker from '../../../../lib/lightning/paymentTrackers/ClnPendingPaymentTracker';
import { createInvoice } from '../../../unit/swap/InvoiceUtils';
import { bitcoinLndClient, clnClient } from '../../Nodes';

jest.mock('../../../../lib/db/repositories/LightningPaymentRepository', () => ({
  setStatus: jest.fn(),
}));

describe('ClnPendingPaymentTracker', () => {
  const tracker = new ClnPendingPaymentTracker(Logger.disabledLogger);

  const newPreimage = () => {
    const preimage = randomBytes(32);
    return {
      preimage,
      preimageHash: crypto.sha256(preimage),
    };
  };

  beforeAll(async () => {
    await Promise.all([clnClient.connect(), bitcoinLndClient.connect(false)]);
  });

  beforeEach(async () => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    tracker.stop();

    clnClient.disconnect();
    bitcoinLndClient.disconnect();
  });

  describe('trackPayment', () => {
    test('should handle successful payments', async () => {
      const { paymentRequest } = await bitcoinLndClient.addInvoice(1);
      const preimageHash = bolt11
        .decode(paymentRequest)
        .tags.find((tag) => tag.tagName === 'payment_hash')!.data as string;

      const promise = clnClient.sendPayment(paymentRequest);

      tracker.trackPayment(preimageHash, promise);
      await promise;

      expect(LightningPaymentRepository.setStatus).toHaveBeenCalledTimes(1);
      expect(LightningPaymentRepository.setStatus).toHaveBeenCalledWith(
        preimageHash,
        NodeType.CLN,
        LightningPaymentStatus.Success,
      );
    });

    test('should handle permanently failed payments', async () => {
      const { paymentRequest } = await bitcoinLndClient.addInvoice(1);
      const preimageHash = bolt11
        .decode(paymentRequest)
        .tags.find((tag) => tag.tagName === 'payment_hash')!.data as string;
      await bitcoinLndClient.cancelHoldInvoice(getHexBuffer(preimageHash));

      const promise = clnClient.sendPayment(paymentRequest);

      tracker.trackPayment(preimageHash, promise);
      await expect(promise).rejects.toEqual(expect.anything());

      expect(LightningPaymentRepository.setStatus).toHaveBeenCalledTimes(1);
      expect(LightningPaymentRepository.setStatus).toHaveBeenCalledWith(
        preimageHash,
        NodeType.CLN,
        LightningPaymentStatus.PermanentFailure,
        expect.anything(),
      );
    });

    test('should handle temporarily failed payments', async () => {
      // Create an invoice ourselves with a random node as destination so that a "no route" error is thrown
      const invoice = createInvoice();
      const preimageHash = bolt11
        .decode(invoice)
        .tags.find((tag) => tag.tagName === 'payment_hash')!.data as string;

      const promise = clnClient.sendPayment(invoice);
      tracker.trackPayment(preimageHash, promise);
      await expect(promise).rejects.toEqual(expect.anything());

      expect(LightningPaymentRepository.setStatus).toHaveBeenCalledTimes(1);
      expect(LightningPaymentRepository.setStatus).toHaveBeenCalledWith(
        preimageHash,
        NodeType.CLN,
        LightningPaymentStatus.TemporaryFailure,
        undefined,
      );
    });
  });

  describe('watchPayment', () => {
    test('should watch for successful payments', async () => {
      const { preimage, preimageHash } = newPreimage();
      const invoice = await bitcoinLndClient.addHoldInvoice(1, preimageHash);
      bitcoinLndClient.subscribeSingleInvoice(preimageHash);
      bitcoinLndClient.on('htlc.accepted', async () => {
        await bitcoinLndClient.settleHoldInvoice(preimage);
      });

      const paymentPromise = clnClient.sendPayment(invoice);
      tracker.watchPayment(clnClient, invoice, getHexString(preimageHash));
      await paymentPromise;

      await tracker['checkPendingPayments']();

      expect(LightningPaymentRepository.setStatus).toHaveBeenCalledTimes(1);
      expect(LightningPaymentRepository.setStatus).toHaveBeenCalledWith(
        getHexString(preimageHash),
        NodeType.CLN,
        LightningPaymentStatus.Success,
      );
    });
  });

  describe('isPermanentError', () => {
    test.each`
      error                                                                                                                                                              | expected
      ${'InvoiceExpiredError()'}                                                                                                                                         | ${true}
      ${'permanent error WIRE_INCORRECT_OR_UNKNOWN_PAYMENT_DETAILS at node 1 (03c5fae1d507150bfb2f82b113e76f0ae2d05fde5b8463bffa15c4e0e4c3b6fc9f) in channel 124x1x0/0'} | ${true}
      ${'something that can be retried'}                                                                                                                                 | ${false}
    `(
      'should check if $error is a permanent error',
      async ({ error, expected }) => {
        expect(tracker.isPermanentError(error)).toEqual(expected);
      },
    );
  });
});
