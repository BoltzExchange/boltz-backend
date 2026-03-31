import { OrderSide, SwapUpdateEvent } from '../../../lib/consts/Enums';
import SwapRepository from '../../../lib/db/repositories/SwapRepository';
import type * as sidecarrpc from '../../../lib/proto/boltzr';
import Sidecar from '../../../lib/sidecar/Sidecar';
import { clnClient } from '../Nodes';
import { sidecar, startSidecar } from './Utils';

describe('Sidecar', () => {
  const eventHandler = { on: jest.fn(), removeAllListeners: jest.fn() } as any;

  beforeAll(async () => {
    await startSidecar();
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

  describe('handleSentSwapUpdate', () => {
    test(`should handle status ${SwapUpdateEvent.InvoiceFailedToPay}`, async () => {
      const id = 'failed';

      const update: sidecarrpc.SwapUpdate = {
        id,
        status: SwapUpdateEvent.InvoiceFailedToPay,
      };

      const swap = {
        id,
        pair: 'L-BTC/BTC',
        lockupAddress: 'bc1',
        orderSide: OrderSide.BUY,
      };
      SwapRepository.getSwap = jest.fn().mockResolvedValue(swap);

      eventHandler.nursery = {
        emit: jest.fn(),
      };

      await sidecar['handleSentSwapUpdate'](update);

      expect(eventHandler.nursery.emit).toHaveBeenCalledTimes(1);
      expect(eventHandler.nursery.emit).toHaveBeenCalledWith(
        SwapUpdateEvent.InvoiceFailedToPay,
        swap,
      );
    });

    test(`should handle status ${SwapUpdateEvent.TransactionDirect}`, async () => {
      eventHandler.emit = jest.fn();

      const transactionInfo: sidecarrpc.SwapUpdate_TransactionInfo = {
        id: 'txid',
        hex: 'hex',
      };
      const update: sidecarrpc.SwapUpdate = {
        id: 'test-swap',
        status: SwapUpdateEvent.TransactionDirect,
        transactionInfo,
      };

      await sidecar['handleSentSwapUpdate'](update);

      expect(eventHandler.emit).toHaveBeenCalledTimes(1);
      expect(eventHandler.emit).toHaveBeenCalledWith('swap.update', {
        id: update.id,
        status: {
          status: SwapUpdateEvent.TransactionDirect,
          transaction: {
            id: transactionInfo.id,
            hex: transactionInfo.hex,
          },
        },
        skipCache: true,
      });
    });

    test.each`
      status
      ${SwapUpdateEvent.InvoicePaid}
      ${SwapUpdateEvent.SwapCreated}
      ${SwapUpdateEvent.InvoiceExpired}
      ${SwapUpdateEvent.TransactionClaimPending}
    `('should ignore status $status', async ({ status }) => {
      const update: sidecarrpc.SwapUpdate = {
        id: 'test',
        status,
      };

      await sidecar['handleSentSwapUpdate'](update);
    });
  });
});
