import { Transaction } from 'bitcoinjs-lib';
import { randomBytes } from 'crypto';
import Logger from '../../../lib/Logger';
import { getHexString } from '../../../lib/Utils';
import SwapInfos from '../../../lib/api/SwapInfos';
import {
  CurrencyType,
  OrderSide,
  SwapType,
  SwapUpdateEvent,
} from '../../../lib/consts/Enums';
import TypedEventEmitter from '../../../lib/consts/TypedEventEmitter';
import ReverseSwap from '../../../lib/db/models/ReverseSwap';
import Swap from '../../../lib/db/models/Swap';
import ChainSwapRepository, {
  ChainSwapInfo,
} from '../../../lib/db/repositories/ChainSwapRepository';
import ChannelCreationRepository from '../../../lib/db/repositories/ChannelCreationRepository';
import ReverseSwapRepository from '../../../lib/db/repositories/ReverseSwapRepository';
import SwapRepository from '../../../lib/db/repositories/SwapRepository';
import Errors from '../../../lib/service/Errors';
import EventHandler from '../../../lib/service/EventHandler';
import Service from '../../../lib/service/Service';
import SwapNursery from '../../../lib/swap/SwapNursery';

describe('SwapInfos', () => {
  const service = {
    eventHandler: new TypedEventEmitter(),
  } as any as Service;
  let swapInfos: SwapInfos;

  beforeEach(() => {
    service.eventHandler.removeAllListeners();
    swapInfos = new SwapInfos(Logger.disabledLogger, service);
  });

  describe('constructor', () => {
    test('should update cache on swap.update', () => {
      const id = 'asdf';
      const status = { status: SwapUpdateEvent.TransactionClaimed };
      service.eventHandler.emit('swap.update', { id, status });

      expect(swapInfos['cachedSwapInfos'].get(id)).toEqual(status);
      expect(swapInfos.cacheSize).toEqual(1);
    });
  });

  describe('has', () => {
    test('should return true when swap info is found', async () => {
      swapInfos['get'] = jest
        .fn()
        .mockResolvedValue({ status: SwapUpdateEvent.SwapCreated });

      await expect(swapInfos.has('')).resolves.toEqual(true);
    });

    test('should return false when no swap info is found', async () => {
      swapInfos['get'] = jest.fn().mockResolvedValue(undefined);
      await expect(swapInfos.has('')).resolves.toEqual(false);
    });
  });

  describe('get', () => {
    test('should not fetch when status is cached', async () => {
      const id = 'id';
      const status = {
        status: SwapUpdateEvent.TransactionMempool,
      };

      swapInfos['cachedSwapInfos'].set(id, status);

      SwapRepository.getSwap = jest.fn();
      ReverseSwapRepository.getReverseSwap = jest.fn();
      ChainSwapRepository.getChainSwap = jest.fn();

      await expect(swapInfos.get(id)).resolves.toEqual(status);

      expect(SwapRepository.getSwap).not.toHaveBeenCalled();
      expect(ReverseSwapRepository.getReverseSwap).not.toHaveBeenCalled();
      expect(ChainSwapRepository.getChainSwap).not.toHaveBeenCalled();
    });

    test('should return undefined when swap cannot be found', async () => {
      const id = 'id';

      SwapRepository.getSwap = jest.fn().mockResolvedValue(null);
      ReverseSwapRepository.getReverseSwap = jest.fn().mockResolvedValue(null);
      ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue(null);

      await expect(swapInfos.get(id)).resolves.toEqual(undefined);

      expect(swapInfos.cacheSize).toEqual(0);

      expect(SwapRepository.getSwap).toHaveBeenCalledTimes(1);
      expect(SwapRepository.getSwap).toHaveBeenCalledWith({ id });

      expect(ReverseSwapRepository.getReverseSwap).toHaveBeenCalledTimes(1);
      expect(ReverseSwapRepository.getReverseSwap).toHaveBeenCalledWith({ id });

      expect(ChainSwapRepository.getChainSwap).toHaveBeenCalledTimes(1);
      expect(ChainSwapRepository.getChainSwap).toHaveBeenCalledWith({ id });
    });

    test.each`
      swap                                                                 | reverse                                                                     | chain
      ${{ type: SwapType.Submarine, status: SwapUpdateEvent.SwapCreated }} | ${null}                                                                     | ${null}
      ${null}                                                              | ${{ type: SwapType.ReverseSubmarine, status: SwapUpdateEvent.SwapCreated }} | ${null}
      ${null}                                                              | ${null}                                                                     | ${{ type: SwapType.Chain, status: SwapUpdateEvent.SwapCreated }}
    `(
      'should fetch from database and cache',
      async ({ swap, reverse, chain }) => {
        const id = 'id';

        SwapRepository.getSwap = jest.fn().mockResolvedValue(swap);
        ReverseSwapRepository.getReverseSwap = jest
          .fn()
          .mockResolvedValue(reverse);
        ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue(chain);

        await expect(swapInfos.get(id)).resolves.toEqual({
          status: SwapUpdateEvent.SwapCreated,
        });
        expect(swapInfos.cacheSize).toEqual(1);

        expect(SwapRepository.getSwap).toHaveBeenCalledTimes(1);
        expect(ReverseSwapRepository.getReverseSwap).toHaveBeenCalledTimes(1);
        expect(ChainSwapRepository.getChainSwap).toHaveBeenCalledTimes(1);

        // Validate that the cache is hit the second time
        await expect(swapInfos.get(id)).resolves.toEqual({
          status: SwapUpdateEvent.SwapCreated,
        });
        expect(SwapRepository.getSwap).toHaveBeenCalledTimes(1);
        expect(ReverseSwapRepository.getReverseSwap).toHaveBeenCalledTimes(1);
        expect(ChainSwapRepository.getChainSwap).toHaveBeenCalledTimes(1);
      },
    );
  });

  describe('handleSwapStatus', () => {
    describe('handleSubmarineSwapStatus', () => {
      test('should handle created channels', async () => {
        const swap = {
          id: 'someId',
          type: SwapType.Submarine,
          status: SwapUpdateEvent.ChannelCreated,
        } as unknown as Swap;

        const channelCreation = {
          fundingTransactionId: 'txId',
          fundingTransactionVout: 12,
        };
        ChannelCreationRepository.getChannelCreation = jest
          .fn()
          .mockResolvedValue(channelCreation);

        await expect(swapInfos['handleSwapStatus'](swap)).resolves.toEqual({
          status: swap.status,
          channel: {
            fundingTransactionId: channelCreation.fundingTransactionId,
            fundingTransactionVout: channelCreation.fundingTransactionVout,
          },
        });
      });

      test('should handle rejected zero conf transactions', async () => {
        const transaction = new Transaction();
        const swap = {
          id: 'someId',
          pair: 'L-BTC/BTC',
          orderSide: OrderSide.BUY,
          type: SwapType.Submarine,
          lockupTransactionId: transaction.getId(),
          status: SwapUpdateEvent.TransactionZeroConfRejected,
        } as unknown as Swap;

        service.getTransaction = jest
          .fn()
          .mockResolvedValue(transaction.toHex());
        service.currencies = new Map<string, any>([
          ['BTC', { type: CurrencyType.BitcoinLike }],
        ]);

        await expect(swapInfos['handleSwapStatus'](swap)).resolves.toEqual({
          zeroConfRejected: true,
          status: SwapUpdateEvent.TransactionMempool,
          transaction: EventHandler.formatTransaction(transaction),
        });

        expect(service.getTransaction).toHaveBeenCalledTimes(1);
        expect(service.getTransaction).toHaveBeenCalledWith(
          'BTC',
          transaction.getId(),
        );
      });

      test.each`
        transactionId
        ${undefined}
        ${getHexString(randomBytes(32))}
      `(
        'should not throw when rejected zero conf transaction cannot be found',
        async ({ transactionId }) => {
          const swap = {
            id: 'txNotFound',
            pair: 'L-BTC/BTC',
            orderSide: OrderSide.BUY,
            type: SwapType.Submarine,
            lockupTransactionId: transactionId,
            status: SwapUpdateEvent.TransactionZeroConfRejected,
          } as unknown as Swap;

          service.getTransaction = jest
            .fn()
            .mockRejectedValue('transaction not found');

          await expect(swapInfos['handleSwapStatus'](swap)).resolves.toEqual({
            zeroConfRejected: true,
            status: SwapUpdateEvent.TransactionMempool,
          });
        },
      );

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
            type: SwapType.Submarine,
          } as unknown as Swap;

          await expect(swapInfos['handleSwapStatus'](swap)).resolves.toEqual({
            status: swap.status,
            failureReason:
              failureReason !== null ? swap.failureReason : undefined,
          });
        },
      );
    });

    describe('handleReverseSwapStatus', () => {
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
          type: SwapType.ReverseSubmarine,
        } as unknown as ReverseSwap;

        await expect(swapInfos['handleSwapStatus'](swap)).resolves.toEqual(
          serverSentTx,
        );

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
            type: SwapType.ReverseSubmarine,
          } as unknown as ReverseSwap;

          await expect(swapInfos['handleSwapStatus'](swap)).resolves.toEqual({
            status: swap.status,
            failureReason:
              failureReason !== null ? swap.failureReason : undefined,
          });
        },
      );
    });

    describe('handleChainSwapStatus', () => {
      test('should handle rejected zero conf transactions', async () => {
        const transaction = new Transaction();
        const swap = {
          id: 'someId',
          type: SwapType.Chain,
          status: SwapUpdateEvent.TransactionZeroConfRejected,
          receivingData: {
            symbol: 'BTC',
            transactionId: transaction.getId(),
          },
        } as unknown as ChainSwapInfo;

        service.getTransaction = jest
          .fn()
          .mockResolvedValue(transaction.toHex());

        await expect(swapInfos['handleSwapStatus'](swap)).resolves.toEqual({
          zeroConfRejected: true,
          status: SwapUpdateEvent.TransactionMempool,
          transaction: EventHandler.formatTransaction(transaction),
        });

        expect(service.getTransaction).toHaveBeenCalledTimes(1);
        expect(service.getTransaction).toHaveBeenCalledWith(
          'BTC',
          transaction.getId(),
        );
      });

      test.each`
        transactionId
        ${undefined}
        ${getHexString(randomBytes(32))}
      `(
        'should not throw when rejected zero conf transaction cannot be found',
        async ({ transactionId }) => {
          const swap = {
            id: 'someId',
            type: SwapType.Chain,
            status: SwapUpdateEvent.TransactionZeroConfRejected,
            receivingData: {
              transactionId,
              symbol: 'BTC',
            },
          } as unknown as ChainSwapInfo;
          service.getTransaction = jest.fn().mockRejectedValue('not found');

          await expect(swapInfos['handleSwapStatus'](swap)).resolves.toEqual({
            zeroConfRejected: true,
            status: SwapUpdateEvent.TransactionMempool,
          });
        },
      );

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
          type: SwapType.Chain,
          sendingData: {
            symbol: 'L-BTC',
            transactionId: 'txId',
          },
        } as unknown as ChainSwapInfo;

        await expect(swapInfos['handleSwapStatus'](swap)).resolves.toEqual(
          serverSentTx,
        );

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
            type: SwapType.Chain,
          } as unknown as ChainSwapInfo;

          await expect(swapInfos['handleSwapStatus'](swap)).resolves.toEqual({
            status: swap.status,
            failureReason:
              failureReason !== null ? swap.failureReason : undefined,
          });
        },
      );
    });
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
