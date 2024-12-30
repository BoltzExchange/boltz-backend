import { OrderSide, SwapUpdateEvent } from '../../../lib/consts/Enums';
import SwapRepository from '../../../lib/db/repositories/SwapRepository';
import * as noderpc from '../../../lib/proto/cln/node_pb';
import * as sidecarrpc from '../../../lib/proto/sidecar/boltzr_pb';
import { InvoiceType } from '../../../lib/sidecar/DecodedInvoice';
import Sidecar from '../../../lib/sidecar/Sidecar';
import { clnClient } from '../Nodes';
import { sidecar, startSidecar } from './Utils';

describe('Sidecar', () => {
  const eventHandler = { on: jest.fn(), removeAllListeners: jest.fn() } as any;

  beforeAll(async () => {
    startSidecar();
    await Promise.all([
      sidecar.connect(eventHandler, {} as any, false),
      clnClient.connect(),
    ]);
  });

  afterAll(async () => {
    sidecar.disconnect();
    clnClient.disconnect();

    await Sidecar.stop();
  });

  test('should fetch bolt12 offers', async () => {
    const req = new noderpc.OfferRequest();
    req.setAmount('any');
    req.setDescription('test');

    const offer = (
      await clnClient['unaryNodeCall']<
        noderpc.OfferRequest,
        noderpc.OfferResponse.AsObject
      >('offer', req, true)
    ).bolt12;

    expect(offer).toBeDefined();

    const invoice = await sidecar.fetchOffer('BTC', offer, 10_000);
    const decoded = await sidecar.decodeInvoiceOrOffer(invoice);
    expect(decoded.type).toEqual(InvoiceType.Bolt12Invoice);
  });

  describe('handleSentSwapUpdate', () => {
    test(`should handle status ${SwapUpdateEvent.InvoiceFailedToPay}`, async () => {
      const id = 'failed';

      const update = new sidecarrpc.SwapUpdate();
      update.setId(id);
      update.setStatus(SwapUpdateEvent.InvoiceFailedToPay);

      const swap = {
        id,
        pair: 'L-BTC/BTC',
        lockupAddress: 'bc1',
        orderSide: OrderSide.BUY,
      };
      SwapRepository.getSwap = jest.fn().mockResolvedValue(swap);

      const chainClient = { removeOutputFilter: jest.fn() };
      const wallet = {
        decodeAddress: jest.fn().mockReturnValue('decoded'),
      };

      eventHandler.nursery = {
        emit: jest.fn(),
        currencies: new Map([
          [
            'BTC',
            {
              chainClient,
            },
          ],
        ]),
        walletManager: {
          wallets: new Map([['BTC', wallet]]),
        },
      };

      await sidecar['handleSentSwapUpdate'](update);

      expect(wallet.decodeAddress).toHaveBeenCalledTimes(1);
      expect(wallet.decodeAddress).toHaveBeenCalledWith(swap.lockupAddress);

      expect(chainClient.removeOutputFilter).toHaveBeenCalledTimes(1);
      expect(chainClient.removeOutputFilter).toHaveBeenCalledWith('decoded');

      expect(eventHandler.nursery.emit).toHaveBeenCalledTimes(1);
      expect(eventHandler.nursery.emit).toHaveBeenCalledWith(
        SwapUpdateEvent.InvoiceFailedToPay,
        swap,
      );
    });

    test.each`
      status
      ${SwapUpdateEvent.InvoicePaid}
      ${SwapUpdateEvent.SwapCreated}
      ${SwapUpdateEvent.InvoiceExpired}
      ${SwapUpdateEvent.TransactionClaimPending}
    `('should ignore status $status', async ({ status }) => {
      const update = new sidecarrpc.SwapUpdate();
      update.setId('test');
      update.setStatus(status);

      await sidecar['handleSentSwapUpdate'](update);
    });
  });
});
