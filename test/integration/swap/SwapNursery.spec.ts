import { sha256 } from '@noble/hashes/sha2.js';
import { randomBytes } from 'crypto';
import Logger from '../../../lib/Logger';
import { generateSwapId, getHexString } from '../../../lib/Utils';
import {
  CurrencyType,
  OrderSide,
  SwapUpdateEvent,
  SwapVersion,
} from '../../../lib/consts/Enums';
import type Database from '../../../lib/db/Database';
import ChainSwap from '../../../lib/db/models/ChainSwap';
import ChainSwapData from '../../../lib/db/models/ChainSwapData';
import Pair from '../../../lib/db/models/Pair';
import { NodeType } from '../../../lib/db/models/ReverseSwap';
import ChainSwapRepository from '../../../lib/db/repositories/ChainSwapRepository';
import PairRepository from '../../../lib/db/repositories/PairRepository';
import SwapNursery from '../../../lib/swap/SwapNursery';
import type { Currency } from '../../../lib/wallet/WalletManager';
import { getPostgresDatabase } from '../../Utils';

describe('SwapNursery', () => {
  const logger = Logger.disabledLogger;

  const btcCurrency = {
    symbol: 'BTC',
    type: CurrencyType.BitcoinLike,
  } as unknown as Currency;

  const claimer = {
    on: jest.fn(),
    deferClaim: jest.fn().mockResolvedValue(true),
  } as any;

  const nursery = new SwapNursery(
    logger,
    {} as any,
    undefined,
    {} as any,
    {} as any,
    {} as any,
    { ethereumManagers: [], wallets: new Map() } as any,
    {} as any,
    0,
    claimer,
    { on: jest.fn(), setAttemptSettle: jest.fn() } as any,
    {} as any,
    {} as any,
  );

  const createChainSwap = async () => {
    const preimage = randomBytes(32);
    const id = generateSwapId(SwapVersion.Taproot);

    await ChainSwapRepository.addChainSwap({
      chainSwap: {
        id,
        pair: 'L-BTC/BTC',
        orderSide: OrderSide.BUY,
        preimageHash: getHexString(Buffer.from(sha256(preimage))),
        status: SwapUpdateEvent.TransactionServerConfirmed,
        acceptZeroConf: false,
        createdRefundSignature: false,
        fee: 1000,
      },
      receivingData: {
        swapId: id,
        symbol: 'BTC',
        lockupAddress: 'bcrt1qreceiving',
        timeoutBlockHeight: 812,
        expectedAmount: 100_000,
        amount: 100_000,
        transactionId: getHexString(randomBytes(32)),
        transactionVout: 0,
      },
      sendingData: {
        swapId: id,
        symbol: 'L-BTC',
        lockupAddress: 'el1qsending',
        timeoutBlockHeight: 21,
        expectedAmount: 99_000,
        amount: 99_000,
        transactionId: getHexString(randomBytes(32)),
      },
    });

    const swap = (await ChainSwapRepository.getChainSwap({ id }))!;

    return { swap, preimage };
  };

  let database: Database;
  let createdPair = false;

  beforeAll(async () => {
    database = getPostgresDatabase();
    await database.init();

    if ((await Pair.findByPk('L-BTC/BTC')) === null) {
      createdPair = true;
      await PairRepository.addPair({
        id: 'L-BTC/BTC',
        base: 'L-BTC',
        quote: 'BTC',
      });
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    claimer.deferClaim.mockResolvedValue(true);
  });

  afterAll(async () => {
    await ChainSwapData.destroy({ where: {} });
    await ChainSwap.destroy({ where: {} });
    if (createdPair) {
      await Pair.destroy({ where: { id: 'L-BTC/BTC' } });
    }

    (nursery as any).pendingPaymentTracker.lightningTrackers[
      NodeType.CLN
    ].stop();

    await database.close();
  });

  describe('attemptSettleSwap', () => {
    test('should not claim again when the swap was settled after the stale snapshot was taken', async () => {
      const { swap: staleSwap, preimage } = await createChainSwap();

      // What the first, successful claim does; the stale snapshot does not see it
      await ChainSwapRepository.setClaimMinerFee(
        (await ChainSwapRepository.getChainSwap({ id: staleSwap.id }))!,
        preimage,
        420,
      );
      expect(staleSwap.status).toEqual(
        SwapUpdateEvent.TransactionServerConfirmed,
      );

      const debugLogs: string[] = [];
      const loggerSpy = jest
        .spyOn(logger, 'debug')
        .mockImplementation((msg: string) => {
          debugLogs.push(msg);
        });

      await nursery.attemptSettleSwap(btcCurrency, staleSwap, preimage);

      loggerSpy.mockRestore();

      expect(claimer.deferClaim).not.toHaveBeenCalled();
      expect(debugLogs).toContain(
        `Skipping claim of Chain Swap ${staleSwap.id}: already settled`,
      );
    });

    test('should settle an unclaimed swap with the freshly fetched database row', async () => {
      const { swap: staleSwap, preimage } = await createChainSwap();

      const claimPending = new Promise<any>((resolve) => {
        nursery.once('claim.pending', resolve);
      });

      await nursery.attemptSettleSwap(btcCurrency, staleSwap, preimage);

      expect(claimer.deferClaim).toHaveBeenCalledTimes(1);

      const settledSwap = await claimPending;
      expect(settledSwap.id).toEqual(staleSwap.id);
      // The re-fetched row, not the snapshot that was passed in
      expect(settledSwap).not.toBe(staleSwap);
      expect(claimer.deferClaim).toHaveBeenCalledWith(settledSwap, preimage);
    });
  });
});
