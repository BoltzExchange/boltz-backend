import { randomBytes } from 'crypto';
import Logger from '../../../../lib/Logger';
import { generateId } from '../../../../lib/Utils';
import {
  OrderSide,
  SwapUpdateEvent,
  SwapVersion,
} from '../../../../lib/consts/Enums';
import Database from '../../../../lib/db/Database';
import { NodeType } from '../../../../lib/db/models/ReverseSwap';
import PairRepository from '../../../../lib/db/repositories/PairRepository';
import ReverseSwapRepository from '../../../../lib/db/repositories/ReverseSwapRepository';

describe('ReverseSwap', () => {
  const db = new Database(Logger.disabledLogger, Database.memoryDatabase);

  beforeAll(async () => {
    await db.init();

    await PairRepository.addPair({
      id: 'L-BTC/BTC',
      base: 'L-BTC',
      quote: 'BTC',
    });
  });

  afterAll(async () => {
    await db.close();
  });

  test.each`
    pair           | orderSide         | expectedCurrency
    ${'L-BTC/BTC'} | ${OrderSide.BUY}  | ${'L-BTC'}
    ${'L-BTC/BTC'} | ${OrderSide.SELL} | ${'BTC'}
  `(
    'should get chain currency',
    async ({ pair, orderSide, expectedCurrency }) => {
      const swap = await ReverseSwapRepository.addReverseSwap({
        pair,
        orderSide,
        fee: 0,
        invoiceAmount: 0,
        onchainAmount: 0,
        id: generateId(),
        lockupAddress: '',
        node: NodeType.LND,
        timeoutBlockHeight: 1,
        version: SwapVersion.Taproot,
        status: SwapUpdateEvent.SwapCreated,
        invoice: randomBytes(32).toString('hex'),
        preimageHash: randomBytes(32).toString('hex'),
      });

      expect(swap.chainCurrency).toEqual(expectedCurrency);
    },
  );

  test.each`
    pair           | orderSide         | expectedCurrency
    ${'L-BTC/BTC'} | ${OrderSide.BUY}  | ${'BTC'}
    ${'L-BTC/BTC'} | ${OrderSide.SELL} | ${'L-BTC'}
  `(
    'should get lightning currency',
    async ({ pair, orderSide, expectedCurrency }) => {
      const swap = await ReverseSwapRepository.addReverseSwap({
        pair,
        orderSide,
        fee: 0,
        invoiceAmount: 0,
        onchainAmount: 0,
        id: generateId(),
        lockupAddress: '',
        node: NodeType.LND,
        timeoutBlockHeight: 1,
        version: SwapVersion.Taproot,
        status: SwapUpdateEvent.SwapCreated,
        invoice: randomBytes(32).toString('hex'),
        preimageHash: randomBytes(32).toString('hex'),
      });

      expect(swap.lightningCurrency).toEqual(expectedCurrency);
    },
  );
});
