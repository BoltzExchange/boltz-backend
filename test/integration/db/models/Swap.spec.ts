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

    await PairRepository.addPair({
      id: 'BTC/BTC',
      quote: 'BTC',
      base: 'BTC',
    });
  });

  afterAll(async () => {
    await db.close();
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
      name                                              | swapData
      ${'onchainAmount is undefined'}                   | ${{}}
      ${'expectedAmount is undefined'}                  | ${{ onchainAmount: 123 }}
      ${'onchainAmount is equal to expectedAmount'}     | ${{ onchainAmount: 123, expectedAmount: 123 }}
      ${'onchainAmount is greater than expectedAmount'} | ${{ onchainAmount: 1234, expectedAmount: 123 }}
    `('should return undefined when $name', async ({ swapData }) => {
      const swap = await Swap.create({
        ...createSwapBase(),
        ...swapData,
      });
      expect(swap.failureDetails).toEqual(undefined);
    });

    test('should return insufficient amount details when onchain amount is less than expected amount', async () => {
      const swap = await Swap.create({
        ...createSwapBase(),
        onchainAmount: 20,
        expectedAmount: 21,
      });
      expect(swap.failureDetails).toEqual({
        actual: swap.onchainAmount,
        expected: swap.expectedAmount,
      });
    });
  });
});
