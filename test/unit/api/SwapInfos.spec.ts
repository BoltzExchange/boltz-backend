import Logger from '../../../lib/Logger';
import SwapInfos from '../../../lib/api/SwapInfos';
import { OrderSide, SwapUpdateEvent } from '../../../lib/consts/Enums';
import ChainSwapRepository from '../../../lib/db/repositories/ChainSwapRepository';
import ChannelCreationRepository from '../../../lib/db/repositories/ChannelCreationRepository';
import ReverseSwapRepository from '../../../lib/db/repositories/ReverseSwapRepository';
import SwapRepository from '../../../lib/db/repositories/SwapRepository';
import Errors from '../../../lib/service/Errors';
import { SwapUpdate } from '../../../lib/service/EventHandler';
import Service from '../../../lib/service/Service';
import SwapNursery from '../../../lib/swap/SwapNursery';

describe('SwapInfos', () => {
  const service = {} as any as Service;
  let swapInfos: SwapInfos;

  beforeEach(() => {
    swapInfos = new SwapInfos(Logger.disabledLogger, service);
  });

  test('should wrap status map', () => {
    const id = 'id';
    const status = {
      status: SwapUpdateEvent.SwapCreated,
    } as SwapUpdate;

    expect(swapInfos.has(id)).toEqual(false);
    expect(swapInfos.get(id)).toEqual(undefined);

    swapInfos.set(id, status);

    expect(swapInfos.has(id)).toEqual(true);
    expect(swapInfos.get(id)).toEqual(status);
  });

  test('should init', async () => {
    swapInfos['fetchSwaps'] = jest.fn();
    swapInfos['fetchReverse'] = jest.fn();
    swapInfos['fetchChainSwaps'] = jest.fn();

    await swapInfos.init();

    expect(swapInfos['fetchSwaps']).toHaveBeenCalledTimes(1);
    expect(swapInfos['fetchReverse']).toHaveBeenCalledTimes(1);
    expect(swapInfos['fetchChainSwaps']).toHaveBeenCalledTimes(1);
  });

  describe('fetchSwaps', () => {
    test('should handle created channels', async () => {
      const swap = {
        id: 'someId',
        status: SwapUpdateEvent.ChannelCreated,
      };
      SwapRepository.getSwaps = jest.fn().mockResolvedValue([swap]);

      const channelCreation = {
        fundingTransactionId: 'txId',
        fundingTransactionVout: 12,
      };
      ChannelCreationRepository.getChannelCreation = jest
        .fn()
        .mockResolvedValue(channelCreation);

      await swapInfos['fetchSwaps']();

      expect(swapInfos.get(swap.id)).toEqual({
        status: swap.status,
        channel: {
          fundingTransactionId: channelCreation.fundingTransactionId,
          fundingTransactionVout: channelCreation.fundingTransactionVout,
        },
      });
    });

    test('should handle rejected zero conf transactions', async () => {
      const swap = {
        id: 'someId',
        status: SwapUpdateEvent.TransactionZeroConfRejected,
      };
      SwapRepository.getSwaps = jest.fn().mockResolvedValue([swap]);

      await swapInfos['fetchSwaps']();

      expect(swapInfos.get(swap.id)).toEqual({
        status: SwapUpdateEvent.TransactionMempool,
        zeroConfRejected: true,
      });
    });

    test.each`
      status                                | failureReason
      ${SwapUpdateEvent.InvoiceSet}         | ${null}
      ${SwapUpdateEvent.SwapCreated}        | ${null}
      ${SwapUpdateEvent.InvoiceFailedToPay} | ${'no liquidity'}
    `(
      'should handle other status update events',
      async ({ status, failureReason }) => {
        const swap = {
          status,
          failureReason,
          id: 'someId',
        };
        SwapRepository.getSwaps = jest.fn().mockResolvedValue([swap]);

        await swapInfos['fetchSwaps']();

        expect(swapInfos.get(swap.id)).toEqual({
          status: swap.status,
          failureReason:
            failureReason !== null ? swap.failureReason : undefined,
        });
      },
    );
  });

  describe('fetchReverse', () => {
    test.each([
      SwapUpdateEvent.TransactionMempool,
      SwapUpdateEvent.TransactionConfirmed,
    ])('should fetch transaction for status %p', async (status) => {
      const serverSentTx = { data: 'of swap' };
      swapInfos['getSwapStatusForServerSentTransaction'] = jest
        .fn()
        .mockResolvedValue(serverSentTx);

      const swap = {
        status,
        id: 'someId',
        pair: 'L-BTC/BTC',
        transactionId: 'txId',
        orderSide: OrderSide.BUY,
      };
      ReverseSwapRepository.getReverseSwaps = jest
        .fn()
        .mockResolvedValue([swap]);

      await swapInfos['fetchReverse']();

      expect(swapInfos.get(swap.id)).toEqual(serverSentTx);
      expect(
        swapInfos['getSwapStatusForServerSentTransaction'],
      ).toHaveBeenCalledTimes(1);
      expect(
        swapInfos['getSwapStatusForServerSentTransaction'],
      ).toHaveBeenCalledWith(status, 'L-BTC', swap.transactionId);
    });

    test.each`
      status                               | failureReason
      ${SwapUpdateEvent.SwapCreated}       | ${null}
      ${SwapUpdateEvent.TransactionFailed} | ${'no liquidity'}
    `(
      'should handle other status update events',
      async ({ status, failureReason }) => {
        const swap = {
          status,
          failureReason,
          id: 'someId',
        };
        ReverseSwapRepository.getReverseSwaps = jest
          .fn()
          .mockResolvedValue([swap]);

        await swapInfos['fetchReverse']();

        expect(swapInfos.get(swap.id)).toEqual({
          status: swap.status,
          failureReason:
            failureReason !== null ? swap.failureReason : undefined,
        });
      },
    );
  });

  describe('fetchChainSwaps', () => {
    test('should handle rejected zero conf transactions', async () => {
      const swap = {
        id: 'someId',
        status: SwapUpdateEvent.TransactionZeroConfRejected,
      };
      ChainSwapRepository.getChainSwaps = jest.fn().mockResolvedValue([swap]);

      await swapInfos['fetchChainSwaps']();

      expect(swapInfos.get(swap.id)).toEqual({
        status: SwapUpdateEvent.TransactionMempool,
        zeroConfRejected: true,
      });
    });

    test.each([
      SwapUpdateEvent.TransactionServerMempool,
      SwapUpdateEvent.TransactionServerConfirmed,
    ])('should fetch transaction for status %p', async (status) => {
      const serverSentTx = { data: 'of swap' };
      swapInfos['getSwapStatusForServerSentTransaction'] = jest
        .fn()
        .mockResolvedValue(serverSentTx);

      const swap = {
        status,
        id: 'someId',
        sendingData: {
          symbol: 'L-BTC',
          transactionId: 'txId',
        },
      };
      ChainSwapRepository.getChainSwaps = jest.fn().mockResolvedValue([swap]);

      await swapInfos['fetchChainSwaps']();

      expect(swapInfos.get(swap.id)).toEqual(serverSentTx);
      expect(
        swapInfos['getSwapStatusForServerSentTransaction'],
      ).toHaveBeenCalledTimes(1);
      expect(
        swapInfos['getSwapStatusForServerSentTransaction'],
      ).toHaveBeenCalledWith(
        status,
        swap.sendingData.symbol,
        swap.sendingData.transactionId,
      );
    });

    test.each`
      status                               | failureReason
      ${SwapUpdateEvent.SwapCreated}       | ${null}
      ${SwapUpdateEvent.TransactionFailed} | ${'no liquidity'}
    `(
      'should handle other status update events',
      async ({ status, failureReason }) => {
        const swap = {
          status,
          failureReason,
          id: 'someId',
        };
        ChainSwapRepository.getChainSwaps = jest.fn().mockResolvedValue([swap]);

        await swapInfos['fetchChainSwaps']();

        expect(swapInfos.get(swap.id)).toEqual({
          status: swap.status,
          failureReason:
            failureReason !== null ? swap.failureReason : undefined,
        });
      },
    );
  });

  test.each`
    chainCurrency | status                                        | eta
    ${'BTC'}      | ${SwapUpdateEvent.TransactionMempool}         | ${SwapNursery.reverseSwapMempoolEta}
    ${'BTC'}      | ${SwapUpdateEvent.TransactionServerMempool}   | ${SwapNursery.reverseSwapMempoolEta}
    ${'BTC'}      | ${SwapUpdateEvent.TransactionConfirmed}       | ${undefined}
    ${'BTC'}      | ${SwapUpdateEvent.TransactionServerConfirmed} | ${undefined}
  `(
    'should get swap transaction for $chainCurrency with status $status',
    async ({ eta, status, chainCurrency }) => {
      service.getTransaction = jest.fn().mockResolvedValue('txHex');

      await expect(
        swapInfos['getSwapStatusForServerSentTransaction'](
          status,
          chainCurrency,
          'txId',
        ),
      ).resolves.toEqual({
        status,
        transaction: {
          eta,
          id: 'txId',
          hex: 'txHex',
        },
      });
    },
  );

  test('should return only transaction id for swap transactions for which no hex can be fetched', async () => {
    service.getTransaction = jest
      .fn()
      .mockRejectedValue(Errors.NOT_SUPPORTED_BY_SYMBOL('RSK'));

    await expect(
      swapInfos['getSwapStatusForServerSentTransaction'](
        SwapUpdateEvent.TransactionMempool,
        'RSK',
        'txId',
      ),
    ).resolves.toEqual({
      status: SwapUpdateEvent.TransactionMempool,
      transaction: {
        id: 'txId',
      },
    });
  });

  test('should propagate other errors when getting swap transactions', async () => {
    const error = 'no';

    service.getTransaction = jest.fn().mockRejectedValue(error);

    await expect(
      swapInfos['getSwapStatusForServerSentTransaction'],
    ).rejects.toEqual(error);
  });
});
