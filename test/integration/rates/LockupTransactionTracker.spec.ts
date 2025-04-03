import { randomBytes } from 'crypto';
import { Op } from 'sequelize';
import Logger from '../../../lib/Logger';
import { generateId, getHexString } from '../../../lib/Utils';
import type ChainClient from '../../../lib/chain/ChainClient';
import { OrderSide, SwapType } from '../../../lib/consts/Enums';
import { liquidSymbol } from '../../../lib/consts/LiquidTypes';
import type Swap from '../../../lib/db/models/Swap';
import ChainSwapRepository from '../../../lib/db/repositories/ChainSwapRepository';
import PendingLockupTransactionRepository from '../../../lib/db/repositories/PendingLockupTransactionRepository';
import SwapRepository from '../../../lib/db/repositories/SwapRepository';
import Errors from '../../../lib/rates/Errors';
import LockupTransactionTracker from '../../../lib/rates/LockupTransactionTracker';
import type RateProvider from '../../../lib/rates/RateProvider';
import { wait } from '../../Utils';
import { bitcoinClient, elementsClient } from '../Nodes';

jest.mock('../../../lib/db/repositories/ChainTipRepository');

describe('LockupTransactionTracker', () => {
  const rateProvider = {
    setZeroConfAmount: jest.fn(),
  } as unknown as RateProvider;
  const config = {
    currencies: [
      {
        symbol: 'BTC',
        maxZeroConfRisk: 2_000_000,
      },
    ],
    liquid: {
      maxZeroConfAmount: 100_000,
    },
  } as any;

  let tracker: LockupTransactionTracker;

  beforeAll(async () => {
    await Promise.all([bitcoinClient.connect(), elementsClient.connect()]);
    await Promise.all([bitcoinClient.generate(1), elementsClient.generate(1)]);

    SwapRepository.getSwaps = jest.fn().mockResolvedValue([]);
    ChainSwapRepository.getChainSwaps = jest.fn().mockResolvedValue([]);
  });

  beforeEach(() => {
    if (tracker !== undefined) {
      bitcoinClient.removeAllListeners();
      elementsClient.removeAllListeners();

      tracker.removeAllListeners();
    }

    tracker = new LockupTransactionTracker(
      Logger.disabledLogger,
      config,
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

    jest.clearAllMocks();
    tracker.removeAllListeners();
  });

  afterAll(async () => {
    await Promise.all([bitcoinClient.generate(1), elementsClient.generate(1)]);

    bitcoinClient.disconnect();
    elementsClient.disconnect();
  });

  test('should populate maps in constructor', () => {
    expect(tracker['zeroConfAcceptedMap'].size).toEqual(2);
    expect(tracker['zeroConfAcceptedMap'].get('BTC')).toEqual(true);
    expect(tracker['zeroConfAcceptedMap'].get('L-BTC')).toEqual(true);

    expect(tracker['maxRisk'].size).toEqual(2);
    expect(tracker['maxRisk'].get('BTC')).toEqual(2_000_000n);
    expect(tracker['maxRisk'].get('L-BTC')).toEqual(100_000n);
  });

  test('should init', async () => {
    PendingLockupTransactionRepository.getForChain = jest
      .fn()
      .mockResolvedValue([{ swapId: 'submarine' }, { swapId: 'chain' }]);
    SwapRepository.getSwaps = jest
      .fn()
      .mockResolvedValue([
        { type: SwapType.Submarine, onchainAmount: 100_000 },
      ]);
    ChainSwapRepository.getChainSwaps = jest.fn().mockResolvedValue([
      {
        type: SwapType.Chain,
        receivingData: {
          amount: 420_000,
        },
      },
    ]);

    await tracker.init();

    expect(
      PendingLockupTransactionRepository.getForChain,
    ).toHaveBeenCalledTimes(2);
    expect(PendingLockupTransactionRepository.getForChain).toHaveBeenCalledWith(
      'BTC',
    );
    expect(PendingLockupTransactionRepository.getForChain).toHaveBeenCalledWith(
      'L-BTC',
    );

    const whereClause = {
      id: {
        [Op.in]: ['submarine', 'chain'],
      },
    };

    expect(SwapRepository.getSwaps).toHaveBeenCalledTimes(2);
    expect(SwapRepository.getSwaps).toHaveBeenCalledWith(whereClause);

    expect(ChainSwapRepository.getChainSwaps).toHaveBeenCalledTimes(2);
    expect(ChainSwapRepository.getChainSwaps).toHaveBeenCalledWith(whereClause);

    expect(tracker['risk'].size).toEqual(2);
    expect(tracker['risk'].get('BTC')).toEqual(520_000n);
    expect(tracker['risk'].get('L-BTC')).toEqual(520_000n);
  });

  test.each`
    symbol         | result
    ${'BTC'}       | ${true}
    ${'L-BTC'}     | ${true}
    ${'not found'} | ${false}
  `('should have zeroConfAccepted $symbol -> $result', ({ symbol, result }) => {
    expect(tracker.zeroConfAccepted(symbol)).toEqual(result);
  });

  describe('isAcceptable', () => {
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
        const onchainAmount = 10_000;

        await expect(
          tracker.isAcceptable(
            {
              id,
              pair,
              orderSide,
              onchainAmount,
              type: SwapType.Submarine,
            } as any,
            'hex',
          ),
        ).resolves.toEqual(true);

        expect(PendingLockupTransactionRepository.create).toHaveBeenCalledTimes(
          1,
        );
        expect(PendingLockupTransactionRepository.create).toHaveBeenCalledWith(
          id,
          chainCurrency,
          'hex',
        );

        expect(tracker['risk'].get(chainCurrency)).toEqual(
          BigInt(onchainAmount),
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
        const receiveAmount = 20_000;

        await expect(
          tracker.isAcceptable(
            {
              id,
              pair,
              orderSide,
              type: SwapType.Chain,
              receivingData: {
                amount: receiveAmount,
              },
            } as any,
            'hex',
          ),
        ).resolves.toEqual(true);

        expect(PendingLockupTransactionRepository.create).toHaveBeenCalledTimes(
          1,
        );
        expect(PendingLockupTransactionRepository.create).toHaveBeenCalledWith(
          id,
          chainCurrency,
          'hex',
        );

        expect(tracker['risk'].get(chainCurrency)).toEqual(
          BigInt(receiveAmount),
        );
      },
    );

    test('should not be acceptable when above risk tolerance', async () => {
      PendingLockupTransactionRepository.create = jest.fn();

      const id = generateId();
      const onchainAmount = 1_000_000_000;

      await expect(
        tracker.isAcceptable(
          {
            id,
            onchainAmount,
            pair: 'BTC/BTC',
            orderSide: OrderSide.BUY,
            type: SwapType.Submarine,
          } as any,
          'hex',
        ),
      ).resolves.toEqual(false);

      expect(tracker['risk'].get('BTC')).toEqual(0n);

      expect(PendingLockupTransactionRepository.create).toHaveBeenCalledTimes(
        0,
      );
    });

    test('should throw when transaction of chain currency that is not being tracked is added', async () => {
      await expect(
        tracker.isAcceptable(
          {
            pair: 'NOT/TRACKED',
            orderSide: OrderSide.BUY,
          } as unknown as Swap,
          'hex',
        ),
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
      async ({ symbol, client }: { symbol: string; client: ChainClient }) => {
        const ids = ['1', '2', 'asdf'];
        PendingLockupTransactionRepository.getForChain = jest
          .fn()
          .mockResolvedValue(
            ids.map((id) => ({
              swapId: id,
            })),
          );
        PendingLockupTransactionRepository.destroy = jest.fn();

        const amount = 100_000;
        const transactionId = await client.sendToAddress(
          await client.getNewAddress(''),
          amount,
          undefined,
          false,
          '',
        );

        SwapRepository.getSwaps = jest.fn().mockResolvedValue([
          {
            id: ids[0],
            onchainAmount: amount,
            type: SwapType.Submarine,
            lockupTransactionId: transactionId,
          },
        ]);
        ChainSwapRepository.getChainSwaps = jest.fn().mockResolvedValue([]);

        tracker['risk'].set(symbol, BigInt(amount));

        await client.generate(1);
        await wait(100);

        expect(tracker['risk'].get(symbol)).toEqual(0n);

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
      async ({ symbol, client }: { symbol: string; client: ChainClient }) => {
        const ids = ['1', '2', 'asdf'];
        PendingLockupTransactionRepository.getForChain = jest
          .fn()
          .mockResolvedValue(
            ids.map((id) => ({
              swapId: id,
            })),
          );
        PendingLockupTransactionRepository.destroy = jest.fn();

        const amount = 100_000;
        const transactionId = await client.sendToAddress(
          await client.getNewAddress(''),
          amount,
          undefined,
          false,
          '',
        );

        SwapRepository.getSwaps = jest.fn().mockResolvedValue([]);
        ChainSwapRepository.getChainSwaps = jest.fn().mockResolvedValue([
          {
            id: ids[0],
            type: SwapType.Chain,
            receivingData: {
              amount,
              transactionId,
            },
          },
        ]);

        tracker['risk'].set(symbol, BigInt(amount));

        await client.generate(1);
        await wait(100);

        expect(tracker['risk'].get(symbol)).toEqual(0n);

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
      async ({ symbol, client }: { symbol: string; client: ChainClient }) => {
        const id = '123';
        PendingLockupTransactionRepository.getForChain = jest
          .fn()
          .mockResolvedValue([{ swapId: id }]);
        PendingLockupTransactionRepository.destroy = jest.fn();

        const amount = 100_000;
        const transactionId = await client.sendToAddress(
          await client.getNewAddress(''),
          amount,
          undefined,
          false,
          '',
        );

        SwapRepository.getSwaps = jest.fn().mockResolvedValue([
          {
            id,
            onchainAmount: amount,
            type: SwapType.Submarine,
            lockupTransactionId: transactionId,
          },
        ]);
        ChainSwapRepository.getChainSwaps = jest.fn().mockResolvedValue([]);

        tracker['risk'].set(symbol, BigInt(amount));

        client['emit']('block', 1);
        await wait(100);

        expect(tracker['risk'].get(symbol)).toEqual(BigInt(amount));

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

    test('should not disable 0-conf multiple times', async () => {
      tracker['zeroConfAcceptedMap'].set('BTC', false);

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

      await bitcoinClient.generate(1);
      await wait(100);

      expect(tracker.zeroConfAccepted('BTC')).toEqual(false);

      expect(rateProvider.setZeroConfAmount).toHaveBeenCalledTimes(0);
    });
  });

  describe('getReceivingAmount', () => {
    test('should get receiving amount for submarine swaps', () => {
      const onchainAmount = 123_321;
      expect(
        tracker['getReceivingAmount']({
          onchainAmount,
          type: SwapType.Submarine,
        } as any),
      ).toEqual(BigInt(onchainAmount));
    });

    test('should get receiving amount for chain swaps', () => {
      const amount = 123_321;
      expect(
        tracker['getReceivingAmount']({
          type: SwapType.Chain,
          receivingData: {
            amount,
          },
        } as any),
      ).toEqual(BigInt(amount));
    });
  });
});
