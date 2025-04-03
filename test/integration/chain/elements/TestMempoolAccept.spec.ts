import type { Transaction } from 'liquidjs-lib';
import Logger from '../../../../lib/Logger';
import TestMempoolAccept from '../../../../lib/chain/elements/TestMempoolAccept';
import { elementsClient } from '../../Nodes';

jest.mock('../../../../lib/db/repositories/ChainTipRepository');
jest.mock('../../../../lib/PromiseUtils', () => ({
  sleep: jest.fn().mockResolvedValue(undefined),
}));

describe('TestMempoolAccept', () => {
  let testMempoolAccept: TestMempoolAccept;

  beforeAll(async () => {
    await elementsClient.connect();
  });

  afterAll(async () => {
    elementsClient.disconnect();
  });

  test('should use default check time', async () => {
    expect(
      new TestMempoolAccept(Logger.disabledLogger, elementsClient)[
        'zeroConfCheckTime'
      ],
    ).toEqual(TestMempoolAccept['zeroConfCheckTimeDefault']);
  });

  test('should construct', async () => {
    const checkTime = 1000;
    testMempoolAccept = new TestMempoolAccept(
      Logger.disabledLogger,
      elementsClient,
      checkTime,
    );

    expect(testMempoolAccept['zeroConfCheckTime']).toEqual(checkTime);
  });

  test('should get name', () => {
    expect(testMempoolAccept.name).toEqual('Test mempool acceptance');
  });

  describe('init', () => {
    test.each`
      chain              | isRegtest | description
      ${'liquidregtest'} | ${true}   | ${'regtest chain'}
      ${'liquidv1'}      | ${false}  | ${'mainnet chain'}
      ${'liquidtestnet'} | ${false}  | ${'testnet chain'}
    `('should detect $description correctly', async ({ chain, isRegtest }) => {
      const mockGetBlockchainInfo = jest.spyOn(
        elementsClient,
        'getBlockchainInfo',
      );
      mockGetBlockchainInfo.mockResolvedValueOnce({ chain } as any);

      const instance = new TestMempoolAccept(
        Logger.disabledLogger,
        elementsClient,
      );
      await instance.init();

      expect(instance['isRegtest']).toEqual(isRegtest);
      mockGetBlockchainInfo.mockRestore();
    });
  });

  describe('checkTransaction', () => {
    let mockTransaction: Transaction;

    beforeEach(() => {
      mockTransaction = {
        getId: jest.fn().mockReturnValue('mocktxid'),
        toHex: jest.fn().mockReturnValue('mocktxhex'),
      } as any;
    });

    test('should return true immediately for regtest', async () => {
      jest.spyOn(elementsClient, 'testMempoolAccept');

      const instance = new TestMempoolAccept(
        Logger.disabledLogger,
        elementsClient,
      );
      instance['isRegtest'] = true;

      const result = await instance.checkTransaction(mockTransaction);

      expect(result).toEqual(true);
      expect(elementsClient.testMempoolAccept).not.toHaveBeenCalled();
    });

    test('should return true for accepted transaction', async () => {
      const mockTestMempoolAccept = jest.spyOn(
        elementsClient,
        'testMempoolAccept',
      );
      mockTestMempoolAccept.mockResolvedValueOnce([
        {
          allowed: true,
          txid: 'mocktxid',
          wtxid: 'mockwtxid',
        },
      ]);

      const instance = new TestMempoolAccept(
        Logger.disabledLogger,
        elementsClient,
      );
      instance['isRegtest'] = false;

      const result = await instance.checkTransaction(mockTransaction);

      expect(result).toEqual(true);
      expect(mockTestMempoolAccept).toHaveBeenCalledWith(['mocktxhex']);
      mockTestMempoolAccept.mockRestore();
    });

    test('should return true for allowed error reasons', async () => {
      const mockTestMempoolAccept = jest.spyOn(
        elementsClient,
        'testMempoolAccept',
      );

      for (const errorReason of [
        'min relay fee not met',
        'txn-already-in-mempool',
      ]) {
        mockTestMempoolAccept.mockResolvedValueOnce([
          {
            allowed: false,
            'reject-reason': errorReason,
            txid: 'mocktxid',
            wtxid: 'mockwtxid',
          },
        ]);

        const instance = new TestMempoolAccept(
          Logger.disabledLogger,
          elementsClient,
        );
        instance['isRegtest'] = false;

        const result = await instance.checkTransaction(mockTransaction);

        expect(result).toEqual(true);
      }

      mockTestMempoolAccept.mockRestore();
    });

    test('should return false for non-allowed error reasons', async () => {
      const mockTestMempoolAccept = jest.spyOn(
        elementsClient,
        'testMempoolAccept',
      );
      mockTestMempoolAccept.mockResolvedValueOnce([
        {
          allowed: false,
          'reject-reason': 'some-other-error',
          txid: 'mocktxid',
          wtxid: 'mockwtxid',
        },
      ]);

      const instance = new TestMempoolAccept(
        Logger.disabledLogger,
        elementsClient,
      );
      instance['isRegtest'] = false;

      const result = await instance.checkTransaction(mockTransaction);

      expect(result).toEqual(false);
      expect(mockTestMempoolAccept).toHaveBeenCalledWith(['mocktxhex']);
      mockTestMempoolAccept.mockRestore();
    });
  });
});
