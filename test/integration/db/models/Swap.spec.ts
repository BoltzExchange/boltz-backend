import { randomBytes } from 'crypto';
import Logger from '../../../../lib/Logger';
import { generateSwapId, getHexString } from '../../../../lib/Utils';
import {
  OrderSide,
  SwapUpdateEvent,
  SwapVersion,
} from '../../../../lib/consts/Enums';
import Database from '../../../../lib/db/Database';
import Swap from '../../../../lib/db/models/Swap';
import PairRepository from '../../../../lib/db/repositories/PairRepository';

describe('Swap', () => {
  const db = new Database(Logger.disabledLogger, Database.memoryDatabase);

  beforeAll(async () => {
    await db.init();

    await Promise.all([
      PairRepository.addPair({
        id: 'BTC/BTC',
        base: 'BTC',
        quote: 'BTC',
      }),
      PairRepository.addPair({
        id: 'L-BTC/BTC',
        base: 'L-BTC',
        quote: 'BTC',
      }),
    ]);
  });

  afterAll(async () => {
    await db.close();
  });

  describe('lightningCurrency', () => {
    test.each`
      orderSide | expected
      ${0}      | ${'L-BTC'}
      ${1}      | ${'BTC'}
    `(
      'should get lightningCurrency for orderSide $orderSide',
      async ({ orderSide, expected }) => {
        const swap = await Swap.create({
          orderSide,
          pair: 'L-BTC/BTC',
          lockupAddress: 'bc1',
          timeoutBlockHeight: 1,
          version: SwapVersion.Taproot,
          status: SwapUpdateEvent.SwapCreated,
          id: generateSwapId(SwapVersion.Taproot),
          preimageHash: getHexString(randomBytes(32)),
        });

        expect(swap.lightningCurrency).toEqual(expected);
      },
    );
  });

  describe('failureDetails', () => {
    const createSwapBase = () => ({
      pair: 'BTC/BTC',
      lockupAddress: 'bc1',
      timeoutBlockHeight: 1,
      orderSide: OrderSide.BUY,
      version: SwapVersion.Taproot,
      status: SwapUpdateEvent.SwapCreated,
      id: generateSwapId(SwapVersion.Taproot),
      preimageHash: getHexString(randomBytes(32)),
    });

    test.each`
      name                                          | swapData
      ${'onchainAmount is undefined'}               | ${{}}
      ${'expectedAmount is undefined'}              | ${{ onchainAmount: 123 }}
      ${'onchainAmount is equal to expectedAmount'} | ${{ onchainAmount: 123, expectedAmount: 123 }}
    `('should return undefined when $name', async ({ swapData }) => {
      const swap = await Swap.create({
        ...createSwapBase(),
        ...swapData,
      });
      expect(swap.failureDetails).toEqual(undefined);
    });

    test.each`
      name      | amount
      ${'less'} | ${20}
      ${'more'} | ${22}
    `(
      'should return incorrect amount details when onchain amount is $name than expected amount',
      async ({ amount }) => {
        const swap = await Swap.create({
          ...createSwapBase(),
          expectedAmount: 21,
          onchainAmount: amount,
          status: SwapUpdateEvent.TransactionLockupFailed,
        });
        expect(swap.failureDetails).toEqual({
          actual: swap.onchainAmount,
          expected: swap.expectedAmount,
        });
      },
    );

    test('should return undefined when status is not TransactionLockupFailed', async () => {
      const swap = await Swap.create({
        ...createSwapBase(),
        onchainAmount: 20,
        expectedAmount: 21,
        status: SwapUpdateEvent.TransactionClaimed,
      });
      expect(swap.failureDetails).toEqual(undefined);
    });
  });
});
