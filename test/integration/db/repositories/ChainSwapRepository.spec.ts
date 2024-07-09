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
import ChainSwap from '../../../../lib/db/models/ChainSwap';
import ChainSwapData, {
  ChainSwapDataType,
} from '../../../../lib/db/models/ChainSwapData';
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

  describe('failureDetails', () => {
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
    await createChainSwap(SwapUpdateEvent.SwapCreated, 11);
    const expirable = await createChainSwap(SwapUpdateEvent.SwapCreated, 9);

    const expirableSwaps = await ChainSwapRepository.getChainSwapsExpirable(
      ['L-BTC'],
      10,
    );
    expect(expirableSwaps).toHaveLength(1);
    expect(expirableSwaps[0].chainSwap).toMatchObject(expirable.chainSwap);
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

  test.each`
    status                                  | confirmed
    ${SwapUpdateEvent.TransactionMempool}   | ${false}
    ${SwapUpdateEvent.TransactionConfirmed} | ${true}
  `(
    'should set user lockup transaction (confirmed: $confirmed)',
    async ({ status, confirmed }) => {
      const swap = await createChainSwap();
      const txId = 'tx';
      const vout = 1;
      const onchainAmount = swap.receivingData.expectedAmount! + 1;

      const updated = await ChainSwapRepository.setUserLockupTransaction(
        (await ChainSwapRepository.getChainSwap({
          id: swap.chainSwap.id,
        }))!,
        txId,
        onchainAmount,
        confirmed,
        vout,
      );

      expect(updated).not.toBeNull();
      expect(updated!.chainSwap.status).toEqual(status);
      expect(updated!.receivingData.transactionId).toEqual(txId);
      expect(updated!.receivingData.amount).toEqual(onchainAmount);
      expect(updated!.receivingData.transactionVout).toEqual(vout);
    },
  );

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
