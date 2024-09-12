import { crypto } from 'bitcoinjs-lib';
import bolt11 from 'bolt11';
import { randomBytes } from 'crypto';
import Logger from '../../../../lib/Logger';
import { getHexBuffer, getHexString } from '../../../../lib/Utils';
import { LightningPaymentStatus } from '../../../../lib/db/models/LightningPayment';
import { NodeType } from '../../../../lib/db/models/ReverseSwap';
import LightningPaymentRepository from '../../../../lib/db/repositories/LightningPaymentRepository';
import LndClient from '../../../../lib/lightning/LndClient';
import LndPendingPaymentTracker from '../../../../lib/lightning/paymentTrackers/LndPendingPaymentTracker';
import { PaymentFailureReason } from '../../../../lib/proto/lnd/rpc_pb';
import { wait } from '../../../Utils';
import { createInvoice } from '../../../unit/swap/InvoiceUtils';
import { bitcoinLndClient, bitcoinLndClient2 } from '../../Nodes';

jest.mock('../../../../lib/db/repositories/LightningPaymentRepository', () => ({
  setStatus: jest.fn(),
}));

describe('LndPendingPaymentTracker', () => {
  const tracker = new LndPendingPaymentTracker(Logger.disabledLogger);

  const newPreimage = () => {
    const preimage = randomBytes(32);
    return {
      preimage,
      preimageHash: crypto.sha256(preimage),
    };
  };

  beforeAll(async () => {
    await Promise.all([
      bitcoinLndClient.connect(false),
      bitcoinLndClient2.connect(false),
    ]);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterAll(() => {
    bitcoinLndClient.disconnect();
    bitcoinLndClient2.disconnect();
  });

  describe('trackPayment', () => {
    test('should handle successful payments', async () => {
      const { paymentRequest } = await bitcoinLndClient2.addInvoice(1);
      const preimageHash = bolt11
        .decode(paymentRequest)
        .tags.find((tag) => tag.tagName === 'payment_hash')!.data as string;

      const promise = bitcoinLndClient.sendPayment(paymentRequest);

      tracker.trackPayment(preimageHash, promise);
      await promise;

      expect(LightningPaymentRepository.setStatus).toHaveBeenCalledTimes(1);
      expect(LightningPaymentRepository.setStatus).toHaveBeenCalledWith(
        preimageHash,
        NodeType.LND,
        LightningPaymentStatus.Success,
      );
    });

    test('should handle permanently failed payments', async () => {
      const { paymentRequest } = await bitcoinLndClient2.addInvoice(1);
      const preimageHash = bolt11
        .decode(paymentRequest)
        .tags.find((tag) => tag.tagName === 'payment_hash')!.data as string;

      await bitcoinLndClient2.cancelHoldInvoice(getHexBuffer(preimageHash));

      const promise = bitcoinLndClient.sendPayment(paymentRequest);

      tracker.trackPayment(preimageHash, promise);
      await expect(promise).rejects.toEqual(
        PaymentFailureReason.FAILURE_REASON_INCORRECT_PAYMENT_DETAILS,
      );

      expect(LightningPaymentRepository.setStatus).toHaveBeenCalledTimes(1);
      expect(LightningPaymentRepository.setStatus).toHaveBeenCalledWith(
        preimageHash,
        NodeType.LND,
        LightningPaymentStatus.PermanentFailure,
        LndClient.formatPaymentFailureReason(
          PaymentFailureReason.FAILURE_REASON_INCORRECT_PAYMENT_DETAILS,
        ),
      );
    });

    test('should handle temporarily failed payments', async () => {
      // Create an invoice ourselves with a random node as destination so that a "no route" error is thrown
      const invoice = createInvoice();
      const preimageHash = bolt11
        .decode(invoice)
        .tags.find((tag) => tag.tagName === 'payment_hash')!.data as string;

      const promise = bitcoinLndClient.sendPayment(invoice);
      tracker.trackPayment(preimageHash, promise);
      await expect(promise).rejects.toEqual(
        PaymentFailureReason.FAILURE_REASON_NO_ROUTE,
      );

      expect(LightningPaymentRepository.setStatus).toHaveBeenCalledTimes(1);
      expect(LightningPaymentRepository.setStatus).toHaveBeenCalledWith(
        preimageHash,
        NodeType.LND,
        LightningPaymentStatus.TemporaryFailure,
        undefined,
      );
    });
  });

  describe('watchPayment', () => {
    test('should watch for successful payments', async () => {
      const { preimage, preimageHash } = newPreimage();
      const invoice = await bitcoinLndClient2.addHoldInvoice(1, preimageHash);
      bitcoinLndClient2.subscribeSingleInvoice(preimageHash);
      bitcoinLndClient2.on('htlc.accepted', async () => {
        await bitcoinLndClient2.settleHoldInvoice(preimage);
      });

      const paymentPromise = bitcoinLndClient.sendPayment(invoice);
      await wait(50);

      tracker.watchPayment(
        bitcoinLndClient,
        invoice,
        getHexString(preimageHash),
      );
      await paymentPromise;

      await wait(50);

      expect(LightningPaymentRepository.setStatus).toHaveBeenCalledTimes(1);
      expect(LightningPaymentRepository.setStatus).toHaveBeenCalledWith(
        getHexString(preimageHash),
        NodeType.LND,
        LightningPaymentStatus.Success,
      );
    });

    test('should watch for failed payments', async () => {
      const { preimageHash } = newPreimage();
      const invoice = await bitcoinLndClient2.addHoldInvoice(1, preimageHash);
      bitcoinLndClient2.subscribeSingleInvoice(preimageHash);
      bitcoinLndClient2.on('htlc.accepted', async () => {
        await bitcoinLndClient2.cancelHoldInvoice(preimageHash);
      });

      const paymentPromise = bitcoinLndClient.sendPayment(invoice);
      await wait(50);

      tracker.watchPayment(
        bitcoinLndClient,
        invoice,
        getHexString(preimageHash),
      );
      await expect(paymentPromise).rejects.toEqual(
        PaymentFailureReason.FAILURE_REASON_INCORRECT_PAYMENT_DETAILS,
      );

      await wait(50);

      expect(LightningPaymentRepository.setStatus).toHaveBeenCalledTimes(1);
      expect(LightningPaymentRepository.setStatus).toHaveBeenCalledWith(
        getHexString(preimageHash),
        NodeType.LND,
        LightningPaymentStatus.PermanentFailure,
        LndClient.formatPaymentFailureReason(
          PaymentFailureReason.FAILURE_REASON_INCORRECT_PAYMENT_DETAILS,
        ),
      );
    });
  });

  describe('isPermanentError', () => {
    test.each`
      error                                                                                 | expected
      ${PaymentFailureReason.FAILURE_REASON_INCORRECT_PAYMENT_DETAILS}                      | ${true}
      ${PaymentFailureReason.FAILURE_REASON_NO_ROUTE}                                       | ${false}
      ${'code = Unknown desc = invoice expired. Valid until 2024-06-08 13:45:16 +0000 UTC'} | ${true}
      ${'something that can be retried'}                                                    | ${false}
    `(
      'should check if $error is a permanent error',
      async ({ error, expected }) => {
        expect(tracker.isPermanentError(error)).toEqual(expected);
      },
    );
  });
});
