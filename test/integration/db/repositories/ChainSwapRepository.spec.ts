import { randomBytes } from 'crypto';
import Logger from '../../../../lib/Logger';
import { getHexString } from '../../../../lib/Utils';
import {
  OrderSide,
  SwapType,
  SwapUpdateEvent,
  SwapVersion,
} from '../../../../lib/consts/Enums';
import Database from '../../../../lib/db/Database';
import ChainSwap from '../../../../lib/db/models/ChainSwap';
import ChainSwapData from '../../../../lib/db/models/ChainSwapData';
import Pair from '../../../../lib/db/models/Pair';
import ChainSwapRepository, {
  ChainSwapInfo,
} from '../../../../lib/db/repositories/ChainSwapRepository';
import { createChainSwap } from './Fixtures';

describe('ChainSwapInfo', () => {
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
});

describe('ChainSwapRepository', () => {
  const database = new Database(Logger.disabledLogger, ':memory:');

  beforeAll(async () => {
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

    const fetched = await ChainSwapRepository.getChainSwapsByData(
      {
        lockupAddress: [
          swaps[0].sendingData.lockupAddress,
          swaps[0].receivingData.lockupAddress,
        ],
      },
      {
        id: swaps[0].chainSwap.id,
      },
    );
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
