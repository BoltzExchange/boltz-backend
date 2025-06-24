import { OrderSide, SwapUpdateEvent } from '../../../lib/consts/Enums';
import SwapRepository from '../../../lib/db/repositories/SwapRepository';
import * as sidecarrpc from '../../../lib/proto/boltzr_pb';
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

    test(`should handle status ${SwapUpdateEvent.TransactionDirect}`, async () => {
      eventHandler.emit = jest.fn();

      const update = new sidecarrpc.SwapUpdate();
      update.setId('test-swap');
      update.setStatus(SwapUpdateEvent.TransactionDirect);
      const transactionInfo = new sidecarrpc.SwapUpdate.TransactionInfo();
      transactionInfo.setId('txid');
      transactionInfo.setHex('hex');
      update.setTransactionInfo(transactionInfo as any);

      await sidecar['handleSentSwapUpdate'](update);

      expect(eventHandler.emit).toHaveBeenCalledTimes(1);
      expect(eventHandler.emit).toHaveBeenCalledWith('swap.update', {
        id: update.getId(),
        status: {
          status: SwapUpdateEvent.TransactionDirect,
          transaction: {
            id: transactionInfo.getId(),
            hex: transactionInfo.getHex(),
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
      const update = new sidecarrpc.SwapUpdate();
      update.setId('test');
      update.setStatus(status);

      await sidecar['handleSentSwapUpdate'](update);
    });
  });
});
