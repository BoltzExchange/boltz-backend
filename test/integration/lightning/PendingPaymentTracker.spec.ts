import { crypto } from 'bitcoinjs-lib';
import { randomBytes } from 'crypto';
import Logger from '../../../lib/Logger';
import { getHexString } from '../../../lib/Utils';
import Database from '../../../lib/db/Database';
import LightningPayment, {
  LightningPaymentStatus,
} from '../../../lib/db/models/LightningPayment';
import { NodeType } from '../../../lib/db/models/ReverseSwap';
import Swap from '../../../lib/db/models/Swap';
import LightningPaymentRepository from '../../../lib/db/repositories/LightningPaymentRepository';
import PairRepository from '../../../lib/db/repositories/PairRepository';
import PendingPaymentTracker from '../../../lib/lightning/PendingPaymentTracker';
import Sidecar from '../../../lib/sidecar/Sidecar';
import { Currency } from '../../../lib/wallet/WalletManager';
import { bitcoinLndClient, clnClient, waitForClnChainSync } from '../Nodes';
import { createSubmarineSwapData } from '../db/repositories/Fixtures';
import { sidecar, startSidecar } from '../sidecar/Utils';

jest.mock(
  '../../../lib/lightning/paymentTrackers/ClnPendingPaymentTracker',
  () =>
    jest.fn().mockImplementation(() => ({
      trackPayment: jest.fn(),
      watchPayment: jest.fn(),
      isPermanentError: jest.fn().mockReturnValue(true),
      parseErrorMessage: jest.fn().mockReturnValue('permanent CLN error'),
    })),
);

jest.mock(
  '../../../lib/lightning/paymentTrackers/LndPendingPaymentTracker',
  () =>
    jest.fn().mockImplementation(() => ({
      trackPayment: jest.fn(),
      watchPayment: jest.fn(),
      isPermanentError: jest.fn().mockReturnValue(true),
      parseErrorMessage: jest.fn().mockReturnValue('permanent CLN error'),
    })),
);

describe('PendingPaymentTracker', () => {
  let db: Database;
  const tracker = new PendingPaymentTracker(Logger.disabledLogger, sidecar);

  const currencies = [
    {
      clnClient,
      symbol: 'BTC',
      lndClient: bitcoinLndClient,
    },
  ] as Currency[];

  beforeAll(async () => {
    db = new Database(Logger.disabledLogger, Database.memoryDatabase);

    startSidecar();
    await Promise.all([
      db.init(),
      clnClient.connect(),
      bitcoinLndClient.connect(false),
      sidecar.connect(
        { on: jest.fn(), removeAllListeners: jest.fn() } as any,
        {} as any,
        false,
      ),
    ]);

    clnClient.subscribeTrackHoldInvoices();

    await PairRepository.addPair({
      id: 'BTC/BTC',
      base: 'BTC',
      quote: 'BTC',
    });
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    await LightningPayment.truncate();
    await Swap.truncate();

    await tracker.init(currencies);
  });

  afterAll(async () => {
    await db.close();

    await Sidecar.stop();

    clnClient.disconnect();
    bitcoinLndClient.disconnect();
  });

  describe('init', () => {
    test('should populate lightning nodes', async () => {
      await tracker.init(currencies);

      expect(tracker['lightningNodes'].size).toEqual(1);
      expect(tracker['lightningNodes'].get('BTC')).toEqual({
        [NodeType.CLN]: clnClient,
        [NodeType.LND]: bitcoinLndClient,
      });
    });

    test('should watch pending lightning payments', async () => {
      const swap = await Swap.create({
        ...createSubmarineSwapData(),
        invoice: 'lnbc1',
      });
      await LightningPaymentRepository.create({
        node: NodeType.LND,
        preimageHash: swap.preimageHash,
      });

      await tracker.init(currencies);

      expect(
        tracker.lightningTrackers[NodeType.CLN].watchPayment,
      ).not.toHaveBeenCalled();

      expect(
        tracker.lightningTrackers[NodeType.LND].watchPayment,
      ).toHaveBeenCalledTimes(1);
      expect(
        tracker.lightningTrackers[NodeType.LND].watchPayment,
      ).toHaveBeenCalledWith(bitcoinLndClient, swap.invoice, swap.preimageHash);
    });

    test('should not watch pending lightning payments when the client with the pending payment is not available', async () => {
      const swap = await Swap.create({
        ...createSubmarineSwapData(),
        invoice: 'lnbc1',
      });
      await LightningPaymentRepository.create({
        node: NodeType.LND,
        preimageHash: swap.preimageHash,
      });

      await tracker.init([
        {
          ...currencies[0],
          lndClient: undefined,
        },
      ]);

      expect(
        tracker.lightningTrackers[NodeType.LND].watchPayment,
      ).not.toHaveBeenCalled();
      expect(
        tracker.lightningTrackers[NodeType.CLN].watchPayment,
      ).not.toHaveBeenCalled();
    });
  });

  describe('sendPayment', () => {
    test('should send payments', async () => {
      const invoiceRes = await bitcoinLndClient.addInvoice(1);
      const preimageHash = (
        await sidecar.decodeInvoiceOrOffer(invoiceRes.paymentRequest)
      ).paymentHash!;

      const swap = await Swap.create({
        ...createSubmarineSwapData(),
        invoice: invoiceRes.paymentRequest,
        preimageHash: getHexString(preimageHash),
      });

      await waitForClnChainSync();
      const res = await tracker.sendPayment(swap, clnClient);
      expect(res).not.toBeUndefined();
      expect(typeof res!.feeMsat).toEqual('number');
      expect(res!.preimage).toEqual(
        Buffer.from(
          (await bitcoinLndClient.lookupInvoice(preimageHash))
            .rPreimage as string,
          'base64',
        ),
      );

      const payments = await LightningPaymentRepository.findByPreimageHash(
        getHexString(preimageHash),
      );
      expect(payments).toHaveLength(1);
      expect(payments[0].node).toEqual(NodeType.CLN);
      expect(payments[0].status).toEqual(LightningPaymentStatus.Success);
    });

    test('should bubble up error when payment cannot be sent', async () => {
      const invoiceRes = await bitcoinLndClient.addInvoice(1);
      const preimageHash = (
        await sidecar.decodeInvoiceOrOffer(invoiceRes.paymentRequest)
      ).paymentHash!;

      await bitcoinLndClient.cancelHoldInvoice(preimageHash);
      const swap = await Swap.create({
        ...createSubmarineSwapData(),
        invoice: invoiceRes.paymentRequest,
        preimageHash: getHexString(preimageHash),
      });

      await expect(tracker.sendPayment(swap, clnClient)).rejects.toEqual(
        expect.anything(),
      );

      const payments = await LightningPaymentRepository.findByPreimageHash(
        getHexString(preimageHash),
      );
      expect(payments).toHaveLength(1);
      expect(payments[0].node).toEqual(NodeType.CLN);
      expect(payments[0].status).toEqual(
        LightningPaymentStatus.PermanentFailure,
      );
      expect(payments[0].error).not.toBeNull();
      expect(payments[0].error).not.toBeUndefined();
    });

    test('should keep track of pending payments in background', async () => {
      const preimageHash = randomBytes(32);
      const invoice = await bitcoinLndClient.addHoldInvoice(1, preimageHash);

      const swap = await Swap.create({
        ...createSubmarineSwapData(),
        invoice,
        preimageHash: getHexString(preimageHash),
      });

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      PendingPaymentTracker['raceTimeout'] = 2;
      await expect(tracker.sendPayment(swap, clnClient)).resolves.toEqual(
        undefined,
      );
      await bitcoinLndClient.cancelHoldInvoice(preimageHash);

      expect(
        tracker.lightningTrackers[NodeType.CLN].trackPayment,
      ).toHaveBeenCalledTimes(1);
      expect(
        tracker.lightningTrackers[NodeType.CLN].trackPayment,
      ).toHaveBeenCalledWith(getHexString(preimageHash), expect.any(Promise));

      const payments = await LightningPaymentRepository.findByPreimageHash(
        getHexString(preimageHash),
      );
      expect(payments).toHaveLength(1);
      expect(payments[0].node).toEqual(NodeType.CLN);
      expect(payments[0].status).toEqual(LightningPaymentStatus.Pending);
    });

    describe('existing relevant status', () => {
      test('should not call the nodes when there is a pending payment', async () => {
        const swapData = createSubmarineSwapData();
        const preimageHash = randomBytes(32);
        const invoice = await clnClient.addHoldInvoice(1, preimageHash);

        const swap = await Swap.create({
          ...swapData,
          invoice,
          preimageHash: getHexString(preimageHash),
        });
        await LightningPaymentRepository.create({
          node: NodeType.LND,
          preimageHash: swap.preimageHash,
        });

        await expect(
          tracker.sendPayment(swap, bitcoinLndClient),
        ).resolves.toEqual(undefined);
      });

      describe('success', () => {
        test('should get success details from LND when the invoice has been paid', async () => {
          const preimage = randomBytes(32);
          const preimageHash = crypto.sha256(preimage);

          const invoice = await clnClient.addHoldInvoice(1, preimageHash);
          clnClient.on('htlc.accepted', async () => {
            await clnClient.settleHoldInvoice(preimage);
          });

          const swap = await Swap.create({
            ...createSubmarineSwapData(),
            invoice,
            preimageHash: getHexString(preimageHash),
          });
          await LightningPayment.create({
            node: NodeType.LND,
            preimageHash: swap.preimageHash,
            status: LightningPaymentStatus.Success,
          });

          const paymentRes = await bitcoinLndClient.sendPayment(invoice);
          await expect(
            tracker.sendPayment(swap, bitcoinLndClient),
          ).resolves.toEqual(paymentRes);
        });

        test('should get success details from CLN when the invoice has been paid', async () => {
          const invoiceRes = await bitcoinLndClient.addInvoice(1);
          const swap = await Swap.create({
            ...createSubmarineSwapData(),
            invoice: invoiceRes.paymentRequest,
            preimageHash: getHexString(
              (await sidecar.decodeInvoiceOrOffer(invoiceRes.paymentRequest))
                .paymentHash!,
            ),
          });
          await LightningPayment.create({
            node: NodeType.CLN,
            preimageHash: swap.preimageHash,
            status: LightningPaymentStatus.Success,
          });

          const paymentRes = await clnClient.sendPayment(
            invoiceRes.paymentRequest,
          );
          await expect(tracker.sendPayment(swap, clnClient)).resolves.toEqual(
            paymentRes,
          );
        });

        test('should return undefined when node for fetching success details is not available', async () => {
          const invoiceRes = await bitcoinLndClient.addInvoice(1);
          const swap = await Swap.create({
            ...createSubmarineSwapData(),
            invoice: invoiceRes.paymentRequest,
            preimageHash: getHexString(
              (await sidecar.decodeInvoiceOrOffer(invoiceRes.paymentRequest))
                .paymentHash!,
            ),
          });
          await LightningPayment.create({
            node: NodeType.CLN,
            preimageHash: swap.preimageHash,
            status: LightningPaymentStatus.Success,
          });

          await tracker.init([
            {
              ...currencies[0],
              clnClient: undefined,
            },
          ]);

          await clnClient.sendPayment(invoiceRes.paymentRequest);
          await expect(tracker.sendPayment(swap, clnClient)).resolves.toEqual(
            undefined,
          );
        });
      });

      test('should throw error for permanently failed payments', async () => {
        const preimageHash = crypto.sha256(randomBytes(32));
        const invoice = await clnClient.addHoldInvoice(1, preimageHash);

        const swap = await Swap.create({
          ...createSubmarineSwapData(),
          invoice,
          preimageHash: getHexString(preimageHash),
        });
        const error = 'some error';
        await LightningPayment.create({
          error,
          node: NodeType.LND,
          preimageHash: swap.preimageHash,
          status: LightningPaymentStatus.PermanentFailure,
        });

        await expect(
          tracker.sendPayment(swap, bitcoinLndClient),
        ).rejects.toEqual(error);
      });
    });
  });
});
