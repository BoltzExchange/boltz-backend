import { randomBytes } from 'crypto';
import { Op } from 'sequelize';
import Logger from '../../../lib/Logger';
import { generateId, getHexString } from '../../../lib/Utils';
import ChainClient from '../../../lib/chain/ChainClient';
import { OrderSide, SwapType } from '../../../lib/consts/Enums';
import { liquidSymbol } from '../../../lib/consts/LiquidTypes';
import Swap from '../../../lib/db/models/Swap';
import ChainSwapRepository from '../../../lib/db/repositories/ChainSwapRepository';
import PendingLockupTransactionRepository from '../../../lib/db/repositories/PendingLockupTransactionRepository';
import SwapRepository from '../../../lib/db/repositories/SwapRepository';
import Errors from '../../../lib/rates/Errors';
import LockupTransactionTracker from '../../../lib/rates/LockupTransactionTracker';
import RateProvider from '../../../lib/rates/RateProvider';
import { wait } from '../../Utils';
import { bitcoinClient, elementsClient } from '../Nodes';

jest.mock('../../../lib/db/repositories/ChainTipRepository');

describe('LockupTransactionTracker', () => {
  const rateProvider = {
    setZeroConfAmount: jest.fn(),
  } as unknown as RateProvider;
  let tracker: LockupTransactionTracker;

  beforeAll(async () => {
    await Promise.all([bitcoinClient.connect(), elementsClient.connect()]);
    await Promise.all([bitcoinClient.generate(1), elementsClient.generate(1)]);

    SwapRepository.getSwaps = jest.fn().mockResolvedValue([]);
    ChainSwapRepository.getChainSwaps = jest.fn().mockResolvedValue([]);

    tracker = new LockupTransactionTracker(
      Logger.disabledLogger,
      new Map<string, any>([
        [
          'BTC',
          {
            chainClient: bitcoinClient,
          },
        ],
        [
          liquidSymbol,
          {
            chainClient: elementsClient,
          },
        ],
      ]),
      rateProvider,
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
    tracker.removeAllListeners();
  });

  afterAll(async () => {
    await Promise.all([bitcoinClient.generate(1), elementsClient.generate(1)]);

    bitcoinClient.disconnect();
    elementsClient.disconnect();
  });

  test('should initialize', () => {
    expect(tracker['zeroConfAcceptedMap'].size).toEqual(2);
    expect(tracker['zeroConfAcceptedMap'].get('BTC')).toEqual(true);
    expect(tracker['zeroConfAcceptedMap'].get('L-BTC')).toEqual(true);
  });

  test.each`
    symbol         | result
    ${'BTC'}       | ${true}
    ${'L-BTC'}     | ${true}
    ${'not found'} | ${false}
  `('should have zeroConfAccepted $symbol -> $result', ({ symbol, result }) => {
    expect(tracker.zeroConfAccepted(symbol)).toEqual(result);
  });

  describe('addPendingTransactionToTrack', () => {
    test.each`
      pair           | orderSide         | chainCurrency
      ${'BTC/BTC'}   | ${OrderSide.BUY}  | ${'BTC'}
      ${'BTC/BTC'}   | ${OrderSide.SELL} | ${'BTC'}
      ${'L-BTC/BTC'} | ${OrderSide.BUY}  | ${'BTC'}
      ${'L-BTC/BTC'} | ${OrderSide.SELL} | ${'L-BTC'}
    `(
      'should add pending $chainCurrency Submarine transaction to track',
      async ({ pair, orderSide, chainCurrency }) => {
        PendingLockupTransactionRepository.create = jest.fn();

        const id = generateId();
        await tracker.addPendingTransactionToTrack({
          id,
          pair,
          orderSide,
          type: SwapType.Submarine,
        } as any);
        expect(PendingLockupTransactionRepository.create).toHaveBeenCalledTimes(
          1,
        );
        expect(PendingLockupTransactionRepository.create).toHaveBeenCalledWith(
          id,
          chainCurrency,
        );
      },
    );

    test.each`
      pair           | orderSide         | chainCurrency
      ${'BTC/BTC'}   | ${OrderSide.BUY}  | ${'BTC'}
      ${'BTC/BTC'}   | ${OrderSide.SELL} | ${'BTC'}
      ${'L-BTC/BTC'} | ${OrderSide.BUY}  | ${'BTC'}
      ${'L-BTC/BTC'} | ${OrderSide.SELL} | ${'L-BTC'}
    `(
      'should add pending $chainCurrency Chain Swap transaction to track',
      async ({ pair, orderSide, chainCurrency }) => {
        PendingLockupTransactionRepository.create = jest.fn();

        const id = generateId();
        await tracker.addPendingTransactionToTrack({
          id,
          pair,
          orderSide,
          type: SwapType.Chain,
        } as any);
        expect(PendingLockupTransactionRepository.create).toHaveBeenCalledTimes(
          1,
        );
        expect(PendingLockupTransactionRepository.create).toHaveBeenCalledWith(
          id,
          chainCurrency,
        );
      },
    );

    test('should throw when transaction of chain currency that is not being tracked is added', async () => {
      await expect(
        tracker.addPendingTransactionToTrack({
          pair: 'NOT/TRACKED',
          orderSide: OrderSide.BUY,
        } as unknown as Swap),
      ).rejects.toEqual(Errors.SYMBOL_LOCKUPS_NOT_BEING_TRACKED('TRACKED'));

      expect(PendingLockupTransactionRepository.create).toHaveBeenCalledTimes(
        0,
      );
    });
  });

  describe('checkPendingLockupsForChain', () => {
    test.each`
      symbol     | client
      ${'BTC'}   | ${bitcoinClient}
      ${'L-BTC'} | ${elementsClient}
    `(
      'should detect confirmed $symbol lockup transactions of Submarine Swaps',
      async ({ client }: { client: ChainClient }) => {
        const ids = ['1', '2', 'asdf'];
        PendingLockupTransactionRepository.getForChain = jest
          .fn()
          .mockResolvedValue(
            ids.map((id) => ({
              swapId: id,
            })),
          );
        PendingLockupTransactionRepository.destroy = jest.fn();

        const transactionId = await client.sendToAddress(
          await client.getNewAddress(),
          100_000,
        );

        SwapRepository.getSwaps = jest.fn().mockResolvedValue([
          {
            id: ids[0],
            type: SwapType.Submarine,
            lockupTransactionId: transactionId,
          },
        ]);
        ChainSwapRepository.getChainSwaps = jest.fn().mockResolvedValue([]);

        await client.generate(1);

        await wait(100);

        expect(
          PendingLockupTransactionRepository.getForChain,
        ).toHaveBeenCalledWith(client.symbol);
        expect(SwapRepository.getSwaps).toHaveBeenCalledTimes(1);
        expect(SwapRepository.getSwaps).toHaveBeenCalledWith({
          id: {
            [Op.in]: ids,
          },
        });
        expect(
          PendingLockupTransactionRepository.destroy,
        ).toHaveBeenCalledTimes(1);
        expect(PendingLockupTransactionRepository.destroy).toHaveBeenCalledWith(
          ids[0],
        );
      },
    );

    test.each`
      symbol     | client
      ${'BTC'}   | ${bitcoinClient}
      ${'L-BTC'} | ${elementsClient}
    `(
      'should detect confirmed $symbol lockup transactions of Chain Swaps',
      async ({ client }: { client: ChainClient }) => {
        const ids = ['1', '2', 'asdf'];
        PendingLockupTransactionRepository.getForChain = jest
          .fn()
          .mockResolvedValue(
            ids.map((id) => ({
              swapId: id,
            })),
          );
        PendingLockupTransactionRepository.destroy = jest.fn();

        const transactionId = await client.sendToAddress(
          await client.getNewAddress(),
          100_000,
        );

        SwapRepository.getSwaps = jest.fn().mockResolvedValue([]);
        ChainSwapRepository.getChainSwaps = jest.fn().mockResolvedValue([
          {
            id: ids[0],
            type: SwapType.Chain,
            receivingData: {
              transactionId,
            },
          },
        ]);

        await client.generate(1);

        await wait(100);

        expect(
          PendingLockupTransactionRepository.getForChain,
        ).toHaveBeenCalledWith(client.symbol);
        expect(ChainSwapRepository.getChainSwaps).toHaveBeenCalledTimes(1);
        expect(ChainSwapRepository.getChainSwaps).toHaveBeenCalledWith({
          id: {
            [Op.in]: ids,
          },
        });
        expect(
          PendingLockupTransactionRepository.destroy,
        ).toHaveBeenCalledTimes(1);
        expect(PendingLockupTransactionRepository.destroy).toHaveBeenCalledWith(
          ids[0],
        );
      },
    );

    test.each`
      symbol     | client
      ${'BTC'}   | ${bitcoinClient}
      ${'L-BTC'} | ${elementsClient}
    `(
      'should not remove unconfirmed $symbol transaction when it is not confirmed yet',
      async ({ client }: { client: ChainClient }) => {
        const id = '123';
        PendingLockupTransactionRepository.getForChain = jest
          .fn()
          .mockResolvedValue([{ swapId: id }]);
        PendingLockupTransactionRepository.destroy = jest.fn();

        const transactionId = await client.sendToAddress(
          await client.getNewAddress(),
          100_000,
        );

        SwapRepository.getSwaps = jest.fn().mockResolvedValue([
          {
            id,
            type: SwapType.Submarine,
            lockupTransactionId: transactionId,
          },
        ]);
        ChainSwapRepository.getChainSwaps = jest.fn().mockResolvedValue([]);

        client['emit']('block', 1);
        await wait(100);

        expect(
          PendingLockupTransactionRepository.destroy,
        ).not.toHaveBeenCalled();
      },
    );

    test('should disable 0-conf when lockup transaction cannot be found', async () => {
      expect.assertions(5);

      expect(tracker.zeroConfAccepted('BTC')).toEqual(true);

      const id = '123';
      PendingLockupTransactionRepository.getForChain = jest
        .fn()
        .mockResolvedValue([{ swapId: id }]);
      PendingLockupTransactionRepository.destroy = jest.fn();

      const transactionId = getHexString(randomBytes(32));

      SwapRepository.getSwaps = jest.fn().mockResolvedValue([
        {
          id,
          type: SwapType.Submarine,
          lockupTransactionId: transactionId,
        },
      ]);

      tracker.once('zeroConf.disabled', (symbol) => {
        expect(symbol).toEqual(bitcoinClient.symbol);
      });

      await bitcoinClient.generate(1);
      await wait(100);

      expect(tracker.zeroConfAccepted('BTC')).toEqual(false);

      expect(rateProvider.setZeroConfAmount).toHaveBeenCalledTimes(1);
      expect(rateProvider.setZeroConfAmount).toHaveBeenCalledWith(
        bitcoinClient.symbol,
        0,
      );
    });
  });
});
