import { randomBytes } from 'crypto';
import Logger from '../../../../lib/Logger';
import { generateSwapId, getHexString } from '../../../../lib/Utils';
import {
  OrderSide,
  SwapType,
  SwapUpdateEvent,
  SwapVersion,
} from '../../../../lib/consts/Enums';
import Database from '../../../../lib/db/Database';
import { LockupWriteOutcome } from '../../../../lib/db/LockupIdentity';
import ChainSwap from '../../../../lib/db/models/ChainSwap';
import type { ChainSwapDataType } from '../../../../lib/db/models/ChainSwapData';
import ChainSwapData from '../../../../lib/db/models/ChainSwapData';
import Pair from '../../../../lib/db/models/Pair';
import ChainSwapRepository, {
  ChainSwapInfo,
} from '../../../../lib/db/repositories/ChainSwapRepository';
import { createChainSwap } from './Fixtures';

describe('ChainSwapInfo', () => {
  let database: Database;

  beforeAll(async () => {
    database = new Database(Logger.disabledLogger, Database.memoryDatabase);
    await database.init();
    await Pair.create({
      quote: 'BTC',
      base: 'L-BTC',
      id: 'L-BTC/BTC',
    });
  });

  afterAll(async () => {
    await database.close();
  });

  test('should get type', () => {
    expect(new ChainSwapInfo({} as any, {} as any, {} as any).type).toEqual(
      SwapType.Chain,
    );
  });

  test('should get version', () => {
    expect(new ChainSwapInfo({} as any, {} as any, {} as any).version).toEqual(
      SwapVersion.Taproot,
    );
  });

  test.each`
    status                                | settled
    ${null}                               | ${false}
    ${undefined}                          | ${false}
    ${''}                                 | ${false}
    ${SwapUpdateEvent.SwapCreated}        | ${false}
    ${SwapUpdateEvent.TransactionClaimed} | ${true}
  `(
    'should get correct settled status for event "$status"',
    ({ status, settled }) => {
      const info = new ChainSwapInfo(
        {
          status,
        } as Partial<ChainSwap> as any,
        {} as any,
        {} as any,
      );
      expect(info.isSettled).toEqual(settled);
    },
  );

  test.each`
    paid     | sendingData           | receivingData
    ${false} | ${{}}                 | ${{}}
    ${true}  | ${{ fee: 21 }}        | ${{}}
    ${true}  | ${{ fee: 21 }}        | ${{ fee: undefined }}
    ${true}  | ${{}}                 | ${{ fee: 20 }}
    ${true}  | ${{ fee: undefined }} | ${{ fee: 20 }}
    ${true}  | ${{ fee: 21 }}        | ${{ fee: 20 }}
    ${false} | ${{ fee: undefined }} | ${{ fee: undefined }}
  `(
    'should get if miner fees were paid',
    ({ paid, sendingData, receivingData }) => {
      const info = new ChainSwapInfo({} as any, sendingData, receivingData);
      expect(info.paidMinerFees).toEqual(paid);
    },
  );

  const createSwapBase = () => {
    const id = generateSwapId(SwapVersion.Taproot);
    return {
      chainSwap: {
        id,
        fee: 1,
        pair: 'L-BTC/BTC',
        acceptZeroConf: false,
        orderSide: OrderSide.BUY,
        status: SwapUpdateEvent.SwapCreated,
        preimageHash: getHexString(randomBytes(32)),
        createdRefundSignature: false,
      },
      sendingData: {
        swapId: id,
        symbol: 'L-BTC',
        lockupAddress: 'bc1',
        timeoutBlockHeight: 1,
        expectedAmount: 90,
      },
      receivingData: {
        swapId: id,
        symbol: 'BTC',
        lockupAddress: 'bc1',
        timeoutBlockHeight: 2,
        expectedAmount: 100,
      } as ChainSwapDataType,
    };
  };

  test('should get refund currency', async () => {
    const swap = createSwapBase();
    await ChainSwapRepository.addChainSwap(swap);
    const queried = await ChainSwapRepository.getChainSwap({
      id: swap.chainSwap.id,
    });

    expect(queried!.refundCurrency).toEqual('L-BTC');
  });

  describe('failureDetails', () => {
    test.each`
      name                                   | swapData
      ${'amount is undefined'}               | ${{}}
      ${'amount is equal to expectedAmount'} | ${{ amount: 123, expectedAmount: 123 }}
    `('should return undefined when $name', async ({ swapData }) => {
      const swapType = createSwapBase();
      swapType.receivingData = {
        ...swapType.receivingData,
        ...swapData,
      };
      await ChainSwapRepository.addChainSwap(swapType);

      const swap = await ChainSwapRepository.getChainSwap({
        id: swapType.chainSwap.id,
      });
      expect(swap).not.toBeNull();
      expect(swap!.failureDetails).toEqual(undefined);
    });

    test.each`
      name      | amount
      ${'less'} | ${20}
      ${'more'} | ${22}
    `(
      'should return insufficient amount details when amount is $name than expected amount',
      async ({ amount }) => {
        const swapType = createSwapBase();
        swapType.receivingData = {
          ...swapType.receivingData,
          amount,
          expectedAmount: 21,
        };
        swapType.chainSwap.status = SwapUpdateEvent.TransactionLockupFailed;
        await ChainSwapRepository.addChainSwap(swapType);

        const swap = await ChainSwapRepository.getChainSwap({
          id: swapType.chainSwap.id,
        });
        expect(swap).not.toBeNull();
        expect(swap!.failureDetails).toEqual({
          actual: swapType.receivingData.amount,
          expected: swapType.receivingData.expectedAmount,
        });
      },
    );

    test('should return undefined when status is not TransactionLockupFailed', async () => {
      const swapType = createSwapBase();
      swapType.receivingData = {
        ...swapType.receivingData,
        amount: 20,
        expectedAmount: 21,
      };
      swapType.chainSwap.status = SwapUpdateEvent.TransactionClaimed;
      await ChainSwapRepository.addChainSwap(swapType);

      const swap = await ChainSwapRepository.getChainSwap({
        id: swapType.chainSwap.id,
      });
      expect(swap).not.toBeNull();
      expect(swap!.failureDetails).toEqual(undefined);
    });
  });
});

describe('ChainSwapRepository', () => {
  let database: Database;

  beforeAll(async () => {
    database = new Database(Logger.disabledLogger, Database.memoryDatabase);
    await database.init();
    await Pair.create({
      quote: 'BTC',
      base: 'L-BTC',
      id: 'L-BTC/BTC',
    });
  });

  beforeEach(async () => {
    await ChainSwapData.destroy({
      truncate: true,
    });
    await ChainSwap.destroy({
      truncate: true,
    });
  });

  afterAll(async () => {
    await database.close();
  });

  test('should get chain swap by swap data', async () => {
    const { chainSwap, sendingData, receivingData } = await createChainSwap();
    const fetched = await ChainSwapRepository.getChainSwap({
      id: chainSwap.id,
    });
    expect(fetched).not.toBeNull();
    expect(fetched!.chainSwap).toMatchObject(chainSwap);
    expect(fetched!.sendingData).toMatchObject(sendingData);
    expect(fetched!.receivingData).toMatchObject(receivingData);
  });

  test('should return null when getting chain swap by data with no result', async () => {
    const fetched = await ChainSwapRepository.getChainSwap({
      id: 'notFound',
    });
    expect(fetched).toBeNull();
  });

  describe('getChainSwaps', () => {
    test('should get chain swaps by swap data', async () => {
      const count = 10;
      for (let i = 0; i < count; i++) {
        await createChainSwap();
      }

      const chainSwaps = await ChainSwapRepository.getChainSwaps({
        pair: 'L-BTC/BTC',
        orderSide: OrderSide.BUY,
      });
      expect(chainSwaps).toHaveLength(count);
    });

    test('should get chain swaps by swap data in order', async () => {
      const count = 10;
      for (let i = 0; i < count; i++) {
        await createChainSwap();
      }

      const swaps = await ChainSwapRepository.getChainSwaps(undefined, [
        ['id', 'ASC'],
      ]);
      expect(swaps.map((s) => s.id)).toStrictEqual(
        [...swaps].map((s) => s.id).sort(),
      );
    });

    test('should get chain swaps by swap data with limit', async () => {
      const count = 10;
      for (let i = 0; i < count; i++) {
        await createChainSwap();
      }

      const limit = 2;
      const swaps = await ChainSwapRepository.getChainSwaps(
        undefined,
        undefined,
        limit,
      );
      expect(swaps).toHaveLength(limit);
    });
  });

  test('should get chain swap by data', async () => {
    const { chainSwap, sendingData, receivingData } = await createChainSwap();
    const fetched = await ChainSwapRepository.getChainSwapByData({
      lockupAddress: sendingData.lockupAddress,
    });
    expect(fetched).not.toBeNull();
    expect(fetched!.chainSwap).toMatchObject(chainSwap);
    expect(fetched!.sendingData).toMatchObject(sendingData);
    expect(fetched!.receivingData).toMatchObject(receivingData);

    await expect(
      ChainSwapRepository.getChainSwapByData(
        {
          lockupAddress: sendingData.lockupAddress,
        },
        {
          id: chainSwap.id,
        },
      ),
    ).resolves.toEqual(fetched);

    await expect(
      ChainSwapRepository.getChainSwapByData(
        {
          lockupAddress: sendingData.lockupAddress,
        },
        {
          preimageHash: 'notFound',
        },
      ),
    ).resolves.toBeNull();
    await expect(
      ChainSwapRepository.getChainSwapByData({
        lockupAddress: 'no',
      }),
    ).resolves.toBeNull();
  });

  test('should get chain swaps by data', async () => {
    const swaps: Awaited<ReturnType<typeof createChainSwap>>[] = [];

    for (let i = 0; i < 10; i++) {
      swaps.push(await createChainSwap());
    }

    const fetched = await ChainSwapRepository.getChainSwapsByData({
      lockupAddress: [
        swaps[0].sendingData.lockupAddress,
        swaps[0].receivingData.lockupAddress,
      ],
    });
    expect(fetched).toHaveLength(1);
    expect(fetched[0]).toMatchObject(swaps[0]);

    await expect(
      ChainSwapRepository.getChainSwapsByData(
        {
          lockupAddress: [
            swaps[0].sendingData.lockupAddress,
            swaps[0].receivingData.lockupAddress,
          ],
        },
        { preimageHash: swaps[0].chainSwap.preimageHash },
      ),
    ).resolves.toHaveLength(1);
  });

  test('should get expirable chain swaps', async () => {
    await createChainSwap(SwapUpdateEvent.TransactionClaimed, 1);
    await createChainSwap(SwapUpdateEvent.TransactionClaimPending, 1);
    await createChainSwap(SwapUpdateEvent.SwapCreated, 11);
    const expirable = await createChainSwap(SwapUpdateEvent.SwapCreated, 9);

    const expirableSwaps = await ChainSwapRepository.getChainSwapsExpirable(
      ['L-BTC'],
      10,
    );
    expect(expirableSwaps).toHaveLength(1);
    expect(expirableSwaps[0].chainSwap).toMatchObject(expirable.chainSwap);
  });

  test('destroy', async () => {
    const swap = await createChainSwap();
    const swapToDelete = await createChainSwap();

    await ChainSwapRepository.destroy(swapToDelete.chainSwap.id);
    await expect(
      ChainSwapRepository.getChainSwap({ id: swapToDelete.chainSwap.id }),
    ).resolves.toBeNull();
    await expect(
      ChainSwapRepository.getChainSwap({ id: swap.chainSwap.id }),
    ).resolves.not.toBeNull();
  });

  describe('disableZeroConf', () => {
    test('should disable 0-conf', async () => {
      const swaps: Awaited<ReturnType<typeof createChainSwap>>[] = [];

      for (let i = 0; i < 3; i++) {
        swaps.push(await createChainSwap(undefined, undefined, true));
      }

      expect(swaps.every((s) => s.chainSwap.acceptZeroConf)).toEqual(true);

      const toDisable = await ChainSwapRepository.getChainSwaps({
        id: [swaps[0].chainSwap.id, swaps[1].chainSwap.id],
      });
      await ChainSwapRepository.disableZeroConf(toDisable);

      expect(
        (await ChainSwapRepository.getChainSwap({
          id: swaps[0].chainSwap.id,
        }))!.chainSwap.acceptZeroConf,
      ).toEqual(false);
      expect(
        (await ChainSwapRepository.getChainSwap({
          id: swaps[1].chainSwap.id,
        }))!.chainSwap.acceptZeroConf,
      ).toEqual(false);
      expect(
        (await ChainSwapRepository.getChainSwap({
          id: swaps[2].chainSwap.id,
        }))!.chainSwap.acceptZeroConf,
      ).toEqual(true);
    });

    test('should ignore when no swaps are given as parameter', async () => {
      const swaps: Awaited<ReturnType<typeof createChainSwap>>[] = [];

      for (let i = 0; i < 3; i++) {
        swaps.push(await createChainSwap(undefined, undefined, true));
      }

      await ChainSwapRepository.disableZeroConf([]);

      for (const swap of swaps) {
        expect(
          (await ChainSwapRepository.getChainSwap({
            id: swap.chainSwap.id,
          }))!.chainSwap.acceptZeroConf,
        ).toEqual(true);
      }
    });
  });

  test('should set refund signature created', async () => {
    const swap = await createChainSwap();
    await ChainSwapRepository.setRefundSignatureCreated(swap.chainSwap.id);

    const queried = await ChainSwapRepository.getChainSwap({
      id: swap.chainSwap.id,
    });
    expect(queried).not.toBeNull();
    expect(queried!.createdRefundSignature).toEqual(true);
  });

  test.each`
    status                                  | targetStatus
    ${SwapUpdateEvent.TransactionMempool}   | ${SwapUpdateEvent.TransactionMempool}
    ${SwapUpdateEvent.TransactionConfirmed} | ${SwapUpdateEvent.TransactionConfirmed}
  `(
    'should set user lockup transaction (status: $status)',
    async ({ status, targetStatus }) => {
      const swap = await createChainSwap();
      const txId = 'tx';
      const vout = 1;
      const onchainAmount = swap.receivingData.expectedAmount! + 1;

      const result = await ChainSwapRepository.setUserLockupTransaction(
        (await ChainSwapRepository.getChainSwap({
          id: swap.chainSwap.id,
        }))!,
        txId,
        onchainAmount,
        { status: targetStatus },
        vout,
      );

      expect(result.outcome).toEqual(LockupWriteOutcome.Acquired);
      expect(result.swap.chainSwap.status).toEqual(status);
      expect(result.swap.receivingData.transactionId).toEqual(txId);
      expect(result.swap.receivingData.amount).toEqual(onchainAmount);
      expect(result.swap.receivingData.transactionVout).toEqual(vout);
    },
  );

  test('should reject when the receiving data cannot be found', async () => {
    const swap = await createChainSwap();

    const result = await ChainSwapRepository.setUserLockupTransaction(
      {
        id: swap.chainSwap.id,
        receivingData: { symbol: 'NOT-A-SYMBOL' },
      } as ChainSwapInfo,
      'lockup-a',
      1_000,
      { status: SwapUpdateEvent.TransactionConfirmed },
      0,
    );

    expect(result.outcome).toEqual(LockupWriteOutcome.Rejected);
    expect(result.swap.status).toEqual(SwapUpdateEvent.SwapCreated);
    expect(result.swap.receivingData.transactionId).toBeNull();
  });

  test('should not let a different transaction replace a confirmed user lockup', async () => {
    const swap = await createChainSwap();
    const amount = swap.receivingData.expectedAmount! + 1;

    await ChainSwapRepository.setUserLockupTransaction(
      (await ChainSwapRepository.getChainSwap({ id: swap.chainSwap.id }))!,
      'lockup-a',
      amount,
      { status: SwapUpdateEvent.TransactionConfirmed },
      0,
    );
    const result = await ChainSwapRepository.setUserLockupTransaction(
      (await ChainSwapRepository.getChainSwap({ id: swap.chainSwap.id }))!,
      'lockup-b',
      1_000,
      { status: SwapUpdateEvent.TransactionConfirmed },
      1,
    );

    expect(result.outcome).toEqual(LockupWriteOutcome.Rejected);
    expect(result.swap.status).toEqual(SwapUpdateEvent.TransactionConfirmed);
    expect(result.swap.receivingData.transactionId).toEqual('lockup-a');
    expect(result.swap.receivingData.amount).toEqual(amount);
    expect(result.swap.receivingData.transactionVout).toEqual(0);
  });

  test('should treat another log index of a confirmed transaction as competing', async () => {
    const swap = await createChainSwap();
    const amount = swap.receivingData.expectedAmount! + 1;

    await ChainSwapRepository.setUserLockupTransaction(
      (await ChainSwapRepository.getChainSwap({ id: swap.chainSwap.id }))!,
      'lockup-a',
      amount,
      { status: SwapUpdateEvent.TransactionConfirmed },
      5,
    );
    const result = await ChainSwapRepository.setUserLockupTransaction(
      (await ChainSwapRepository.getChainSwap({ id: swap.chainSwap.id }))!,
      'lockup-a',
      1_000,
      { status: SwapUpdateEvent.TransactionConfirmed },
      7,
    );

    expect(result.outcome).toEqual(LockupWriteOutcome.Rejected);
    expect(result.swap.receivingData.amount).toEqual(amount);
    expect(result.swap.receivingData.transactionVout).toEqual(5);
  });

  test('should not downgrade a confirmed user lockup to lockup failed', async () => {
    const swap = await createChainSwap();
    const amount = swap.receivingData.expectedAmount! + 1;

    await ChainSwapRepository.setUserLockupTransaction(
      (await ChainSwapRepository.getChainSwap({ id: swap.chainSwap.id }))!,
      'lockup-a',
      amount,
      { status: SwapUpdateEvent.TransactionConfirmed },
      0,
    );
    const result = await ChainSwapRepository.setUserLockupTransaction(
      (await ChainSwapRepository.getChainSwap({ id: swap.chainSwap.id }))!,
      'lockup-a',
      amount,
      {
        status: SwapUpdateEvent.TransactionLockupFailed,
        failureReason: 'lockup failed',
      },
      0,
    );

    expect(result.outcome).toEqual(LockupWriteOutcome.Idempotent);
    expect(result.swap.status).toEqual(SwapUpdateEvent.TransactionConfirmed);
    expect(result.swap.receivingData.transactionId).toEqual('lockup-a');
  });

  test('should not downgrade a confirmed user lockup to mempool', async () => {
    const swap = await createChainSwap();
    const amount = swap.receivingData.expectedAmount! + 1;

    await ChainSwapRepository.setUserLockupTransaction(
      (await ChainSwapRepository.getChainSwap({ id: swap.chainSwap.id }))!,
      'lockup-a',
      amount,
      { status: SwapUpdateEvent.TransactionConfirmed },
      0,
    );
    const result = await ChainSwapRepository.setUserLockupTransaction(
      (await ChainSwapRepository.getChainSwap({ id: swap.chainSwap.id }))!,
      'lockup-a',
      amount,
      { status: SwapUpdateEvent.TransactionMempool },
      0,
    );

    expect(result.outcome).toEqual(LockupWriteOutcome.Idempotent);
    expect(result.swap.status).toEqual(SwapUpdateEvent.TransactionConfirmed);
    expect(result.swap.receivingData.transactionId).toEqual('lockup-a');
  });

  test('should not let a different transaction replace an unconfirmed user lockup', async () => {
    const swap = await createChainSwap();
    const amount = swap.receivingData.expectedAmount! + 1;

    await ChainSwapRepository.setUserLockupTransaction(
      (await ChainSwapRepository.getChainSwap({ id: swap.chainSwap.id }))!,
      'lockup-a',
      amount,
      { status: SwapUpdateEvent.TransactionMempool },
      0,
    );
    const result = await ChainSwapRepository.setUserLockupTransaction(
      (await ChainSwapRepository.getChainSwap({ id: swap.chainSwap.id }))!,
      'lockup-b',
      amount,
      { status: SwapUpdateEvent.TransactionConfirmed },
      1,
    );

    expect(result.outcome).toEqual(LockupWriteOutcome.Rejected);
    expect(result.swap.status).toEqual(SwapUpdateEvent.TransactionMempool);
    expect(result.swap.receivingData.transactionId).toEqual('lockup-a');
    expect(result.swap.receivingData.transactionVout).toEqual(0);
  });

  test('should let a valid user lockup take over from a zero-conf rejected one', async () => {
    const swap = await createChainSwap();
    const amount = swap.receivingData.expectedAmount! + 1;

    const initial = await ChainSwapRepository.setUserLockupTransaction(
      (await ChainSwapRepository.getChainSwap({ id: swap.chainSwap.id }))!,
      'lockup-a',
      amount,
      { status: SwapUpdateEvent.TransactionMempool },
      0,
    );
    await initial.swap.chainSwap.update({
      status: SwapUpdateEvent.TransactionZeroConfRejected,
    });
    const result = await ChainSwapRepository.setUserLockupTransaction(
      (await ChainSwapRepository.getChainSwap({ id: swap.chainSwap.id }))!,
      'lockup-b',
      amount,
      { status: SwapUpdateEvent.TransactionConfirmed },
      1,
    );

    expect(result.outcome).toEqual(LockupWriteOutcome.Acquired);
    expect(result.swap.status).toEqual(SwapUpdateEvent.TransactionConfirmed);
    expect(result.swap.receivingData.transactionId).toEqual('lockup-b');
    expect(result.swap.receivingData.transactionVout).toEqual(1);
  });

  test('should not let a different transaction replace a confirmed user lockup even with the override', async () => {
    const swap = await createChainSwap();
    const amount = swap.receivingData.expectedAmount! + 1;

    await ChainSwapRepository.setUserLockupTransaction(
      (await ChainSwapRepository.getChainSwap({ id: swap.chainSwap.id }))!,
      'lockup-a',
      amount,
      { status: SwapUpdateEvent.TransactionConfirmed },
      0,
    );
    const result = await ChainSwapRepository.setUserLockupTransaction(
      (await ChainSwapRepository.getChainSwap({ id: swap.chainSwap.id }))!,
      'lockup-b',
      amount,
      { status: SwapUpdateEvent.TransactionConfirmed },
      1,
      { allowLockupFailedUpdate: true },
    );

    expect(result.outcome).toEqual(LockupWriteOutcome.Rejected);
    expect(result.swap.receivingData.transactionId).toEqual('lockup-a');
    expect(result.swap.receivingData.transactionVout).toEqual(0);
  });

  test('should match and backfill when the stored user lockup has no vout', async () => {
    const swap = await createChainSwap();
    const amount = swap.receivingData.expectedAmount! + 1;

    await ChainSwapRepository.setUserLockupTransaction(
      (await ChainSwapRepository.getChainSwap({ id: swap.chainSwap.id }))!,
      'lockup-a',
      amount,
      { status: SwapUpdateEvent.TransactionMempool },
    );
    const result = await ChainSwapRepository.setUserLockupTransaction(
      (await ChainSwapRepository.getChainSwap({ id: swap.chainSwap.id }))!,
      'lockup-a',
      amount,
      { status: SwapUpdateEvent.TransactionConfirmed },
      3,
    );

    expect(result.outcome).toEqual(LockupWriteOutcome.Idempotent);
    expect(result.swap.status).toEqual(SwapUpdateEvent.TransactionConfirmed);
    expect(result.swap.receivingData.transactionVout).toEqual(3);
  });

  test('should not overwrite failed user lockup transactions by default', async () => {
    const swap = await createChainSwap(SwapUpdateEvent.TransactionLockupFailed);
    const queried = (await ChainSwapRepository.getChainSwap({
      id: swap.chainSwap.id,
    }))!;

    const result = await ChainSwapRepository.setUserLockupTransaction(
      queried,
      'tx',
      queried.receivingData.expectedAmount! + 1,
      { status: SwapUpdateEvent.TransactionConfirmed },
      1,
    );

    expect(result.outcome).toEqual(LockupWriteOutcome.Rejected);
    expect(result.swap.status).toEqual(SwapUpdateEvent.TransactionLockupFailed);
    expect(result.swap.receivingData.transactionId).toBeNull();
    expect(result.swap.receivingData.transactionVout).toBeNull();
    expect(result.swap.receivingData.amount).toBeNull();
  });

  test('should update failed user lockup transactions when explicitly allowed', async () => {
    const swap = await createChainSwap(SwapUpdateEvent.TransactionLockupFailed);
    const queried = (await ChainSwapRepository.getChainSwap({
      id: swap.chainSwap.id,
    }))!;
    await queried.chainSwap.update({ failureReason: 'not enough' });
    const onchainAmount = queried.receivingData.expectedAmount! + 1;

    const result = await ChainSwapRepository.setUserLockupTransaction(
      queried,
      'tx',
      onchainAmount,
      { status: SwapUpdateEvent.TransactionConfirmed },
      1,
      { allowLockupFailedUpdate: true },
    );

    expect(result.outcome).toEqual(LockupWriteOutcome.Acquired);
    expect(result.swap.status).toEqual(SwapUpdateEvent.TransactionConfirmed);
    expect(result.swap.receivingData.transactionId).toEqual('tx');
    expect(result.swap.receivingData.transactionVout).toEqual(1);
    expect(result.swap.receivingData.amount).toEqual(onchainAmount);
    expect(result.swap.failureReason).toBeNull();
  });

  describe('setUserLockupFailed', () => {
    const fetch = (id: string) =>
      ChainSwapRepository.getChainSwap({ id }) as Promise<ChainSwapInfo>;

    const recordLockup = async (id: string, vout = 0) =>
      ChainSwapRepository.setUserLockupTransaction(
        await fetch(id),
        'lockup-a',
        123_500,
        { status: SwapUpdateEvent.TransactionConfirmed },
        vout,
        { allowLockupFailedUpdate: true },
      );

    const failLockup = async (
      id: string,
      lockup: { transactionId: string; vout?: number | null } = {
        transactionId: 'lockup-a',
        vout: 0,
      },
      options?: { allowLockupFailedUpdate?: boolean },
    ) =>
      ChainSwapRepository.setUserLockupFailed(
        await fetch(id),
        lockup,
        'not enough',
        options,
      );

    test('should write the status and its reason in one call', async () => {
      const { chainSwap } = await createChainSwap();
      await recordLockup(chainSwap.id);

      const result = await failLockup(chainSwap.id);

      expect(result.outcome).toEqual(LockupWriteOutcome.Acquired);
      expect(result.written).toEqual(true);
      expect(result.swap.status).toEqual(
        SwapUpdateEvent.TransactionLockupFailed,
      );
      expect(result.swap.failureReason).toEqual('not enough');
    });

    test('should reject a lockup that does not own the swap', async () => {
      const { chainSwap } = await createChainSwap();
      await recordLockup(chainSwap.id);

      const result = await failLockup(chainSwap.id, {
        transactionId: 'lockup-b',
        vout: 0,
      });

      expect(result.outcome).toEqual(LockupWriteOutcome.Rejected);
      expect(result.written).toEqual(false);
      expect(result.swap.status).toEqual(SwapUpdateEvent.TransactionConfirmed);
      expect(result.swap.failureReason).toBeNull();
    });

    test.each([1, null, undefined])(
      'should reject another vout (%p) of the recorded transaction',
      async (vout) => {
        const { chainSwap } = await createChainSwap();
        await recordLockup(chainSwap.id);

        const result = await failLockup(chainSwap.id, {
          transactionId: 'lockup-a',
          vout,
        });

        expect(result.outcome).toEqual(LockupWriteOutcome.Rejected);
        expect(result.swap.status).toEqual(
          SwapUpdateEvent.TransactionConfirmed,
        );
        expect(result.swap.failureReason).toBeNull();
      },
    );

    test('should reject when no lockup was recorded yet', async () => {
      const { chainSwap } = await createChainSwap();

      const result = await failLockup(chainSwap.id);

      expect(result.outcome).toEqual(LockupWriteOutcome.Rejected);
      expect(result.swap.failureReason).toBeNull();
    });

    test.each([
      SwapUpdateEvent.TransactionServerMempool,
      SwapUpdateEvent.TransactionServerConfirmed,
      SwapUpdateEvent.TransactionClaimPending,
      SwapUpdateEvent.TransactionClaimed,
      SwapUpdateEvent.SwapExpired,
    ])('should reject a swap that moved on to %s', async (status) => {
      const { chainSwap } = await createChainSwap();
      await recordLockup(chainSwap.id);
      await (await fetch(chainSwap.id)).chainSwap.update({ status });

      const result = await failLockup(chainSwap.id);

      expect(result.outcome).toEqual(LockupWriteOutcome.Rejected);
      expect(result.swap.status).toEqual(status);
      expect(result.swap.failureReason).toBeNull();
    });

    test('should not fail an already failed lockup by default', async () => {
      const { chainSwap } = await createChainSwap();
      await recordLockup(chainSwap.id);
      await failLockup(chainSwap.id);

      const result = await ChainSwapRepository.setUserLockupFailed(
        await fetch(chainSwap.id),
        { transactionId: 'lockup-a', vout: 0 },
        'other reason',
      );

      expect(result.outcome).toEqual(LockupWriteOutcome.Rejected);
      expect(result.swap.failureReason).toEqual('not enough');
    });

    test('should fail an already failed lockup when explicitly allowed', async () => {
      const { chainSwap } = await createChainSwap();
      await recordLockup(chainSwap.id);
      await failLockup(chainSwap.id);

      const result = await ChainSwapRepository.setUserLockupFailed(
        await fetch(chainSwap.id),
        { transactionId: 'lockup-a', vout: 0 },
        'other reason',
        { allowLockupFailedUpdate: true },
      );

      expect(result.outcome).toEqual(LockupWriteOutcome.Acquired);
      expect(result.swap.status).toEqual(
        SwapUpdateEvent.TransactionLockupFailed,
      );
      expect(result.swap.failureReason).toEqual('other reason');
    });
  });

  describe('setZeroConfRejected', () => {
    test('should reject the recorded mempool user lockup', async () => {
      const swap = await createChainSwap();
      await ChainSwapRepository.setUserLockupTransaction(
        (await ChainSwapRepository.getChainSwap({ id: swap.chainSwap.id }))!,
        'lockup-a',
        swap.receivingData.expectedAmount! + 1,
        { status: SwapUpdateEvent.TransactionMempool },
        0,
      );

      const updated = await ChainSwapRepository.setZeroConfRejected(
        (await ChainSwapRepository.getChainSwap({ id: swap.chainSwap.id }))!,
        'lockup-a',
        0,
      );

      expect(updated.status).toEqual(
        SwapUpdateEvent.TransactionZeroConfRejected,
      );
    });

    test('should not downgrade a confirmed user lockup', async () => {
      const swap = await createChainSwap();
      await ChainSwapRepository.setUserLockupTransaction(
        (await ChainSwapRepository.getChainSwap({ id: swap.chainSwap.id }))!,
        'lockup-a',
        swap.receivingData.expectedAmount! + 1,
        { status: SwapUpdateEvent.TransactionConfirmed },
        0,
      );

      const updated = await ChainSwapRepository.setZeroConfRejected(
        (await ChainSwapRepository.getChainSwap({ id: swap.chainSwap.id }))!,
        'lockup-a',
        0,
      );

      expect(updated.status).toEqual(SwapUpdateEvent.TransactionConfirmed);
    });

    test('should ignore rejections from a transaction that does not own the lockup', async () => {
      const swap = await createChainSwap();
      await ChainSwapRepository.setUserLockupTransaction(
        (await ChainSwapRepository.getChainSwap({ id: swap.chainSwap.id }))!,
        'lockup-a',
        swap.receivingData.expectedAmount! + 1,
        { status: SwapUpdateEvent.TransactionMempool },
        0,
      );

      const updated = await ChainSwapRepository.setZeroConfRejected(
        (await ChainSwapRepository.getChainSwap({ id: swap.chainSwap.id }))!,
        'lockup-b',
        1,
      );

      expect(updated.status).toEqual(SwapUpdateEvent.TransactionMempool);
      expect(updated.receivingData.transactionId).toEqual('lockup-a');
    });

    test('should ignore rejections when no user lockup is recorded', async () => {
      const swap = await createChainSwap();

      const updated = await ChainSwapRepository.setZeroConfRejected(
        (await ChainSwapRepository.getChainSwap({ id: swap.chainSwap.id }))!,
        'lockup-a',
        0,
      );

      expect(updated.status).toEqual(SwapUpdateEvent.SwapCreated);
    });
  });

  test('should set expected amounts', async () => {
    const swap = await createChainSwap();

    const fee = 321_123;
    const userLockAmount = 456_123;
    const serverLockAmount = 787_321;

    const queried = await ChainSwapRepository.getChainSwap({
      id: swap.chainSwap.id,
    });
    expect(queried).not.toBeNull();

    await queried!.chainSwap.update({
      failureReason: 'something really bad',
    });
    expect(queried!.failureReason).not.toBeNull();

    await ChainSwapRepository.setExpectedAmounts(
      queried!,
      fee,
      userLockAmount,
      serverLockAmount,
    );

    expect(queried!.fee).toEqual(fee);
    expect(queried!.failureReason).toBeNull();
    expect(queried!.receivingData.expectedAmount).toEqual(userLockAmount);
    expect(queried!.sendingData.expectedAmount).toEqual(serverLockAmount);
  });

  test('should set claim pending', async () => {
    const swap = await createChainSwap();

    const preimage = randomBytes(32);

    const queried = await ChainSwapRepository.getChainSwap({
      id: swap.chainSwap.id,
    });
    expect(queried).not.toBeNull();

    await ChainSwapRepository.setTransactionClaimPending(queried!, preimage);

    expect(queried!.chainSwap.preimage).toEqual(getHexString(preimage));
    expect(queried!.status).toEqual(SwapUpdateEvent.TransactionClaimPending);
  });

  test('should set claim miner fee', async () => {
    const swap = await createChainSwap();

    const preimage = randomBytes(32);
    const minerFee = 123;

    const updated = await ChainSwapRepository.setClaimMinerFee(
      (await ChainSwapRepository.getChainSwap({
        id: swap.chainSwap.id,
      }))!,
      preimage,
      minerFee,
    );

    expect(updated.status).toEqual(SwapUpdateEvent.TransactionClaimed);
    expect(updated.chainSwap.preimage).toEqual(getHexString(preimage));
    expect(updated.receivingData.fee).toEqual(minerFee);
  });
});
