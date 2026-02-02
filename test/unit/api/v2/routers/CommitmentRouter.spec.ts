import { Router } from 'express';
import Logger from '../../../../../lib/Logger';
import CommitmentRouter from '../../../../../lib/api/v2/routers/CommitmentRouter';
import type Service from '../../../../../lib/service/Service';
import { mockRequest, mockResponse } from '../../Utils';

const mockedRouter = {
  get: jest.fn(),
  post: jest.fn(),
};

jest.mock('express', () => {
  return {
    Router: jest.fn().mockImplementation(() => mockedRouter),
  };
});

describe('CommitmentRouter', () => {
  const lockupDetails = {
    contract: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    claimAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    timelock: 20160,
  };

  const service = {
    walletManager: {
      ethereumManagers: [
        {
          hasSymbol: jest
            .fn()
            .mockImplementation((currency) => currency === 'RBTC'),
          commitments: {
            lockupDetails: jest.fn().mockResolvedValue(lockupDetails),
            commit: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    },
  } as unknown as Service;

  const commitmentRouter = new CommitmentRouter(Logger.disabledLogger, service);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should get route prefix', () => {
    expect(commitmentRouter.path).toEqual('commitment');
  });

  test('should get router', () => {
    const router = commitmentRouter.getRouter();
    expect(router).not.toBeUndefined();

    expect(Router).toHaveBeenCalledTimes(1);

    expect(mockedRouter.get).toHaveBeenCalledTimes(1);
    expect(mockedRouter.get).toHaveBeenCalledWith(
      '/:currency/details',
      expect.anything(),
    );

    expect(mockedRouter.post).toHaveBeenCalledTimes(1);
    expect(mockedRouter.post).toHaveBeenCalledWith(
      '/:currency',
      expect.anything(),
    );
  });

  describe('GET /:currency/details', () => {
    test.each`
      error                              | params
      ${'undefined parameter: currency'} | ${{}}
      ${'invalid parameter: currency'}   | ${{ currency: 1 }}
      ${'invalid parameter: currency'}   | ${{ currency: { some: 'data' } }}
    `(
      'should not get details with invalid parameters ($error)',
      async ({ params, error }) => {
        await expect(
          commitmentRouter['getDetails'](
            mockRequest(undefined, undefined, params),
            mockResponse(),
          ),
        ).rejects.toEqual(error);
      },
    );

    test('should get lockup details', async () => {
      const currency = 'RBTC';

      const res = mockResponse();
      await commitmentRouter['getDetails'](
        mockRequest(undefined, undefined, { currency }),
        res,
      );

      expect(
        service.walletManager.ethereumManagers[0].hasSymbol,
      ).toHaveBeenCalledTimes(1);
      expect(
        service.walletManager.ethereumManagers[0].hasSymbol,
      ).toHaveBeenCalledWith(currency);

      expect(
        service.walletManager.ethereumManagers[0].commitments.lockupDetails,
      ).toHaveBeenCalledTimes(1);
      expect(
        service.walletManager.ethereumManagers[0].commitments.lockupDetails,
      ).toHaveBeenCalledWith(currency);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(lockupDetails);
    });

    test('should throw for unsupported currency', async () => {
      const res = mockResponse();
      await expect(
        commitmentRouter['getDetails'](
          mockRequest(undefined, undefined, { currency: 'BTC' }),
          res,
        ),
      ).rejects.toThrow('currency does not support commitment swaps');
    });
  });

  describe('POST /:currency', () => {
    test.each`
      error                                     | params                  | body
      ${'undefined parameter: currency'}        | ${{}}                   | ${{ swapId: 'id', signature: 'sig', transactionHash: 'tx' }}
      ${'invalid parameter: currency'}          | ${{ currency: 123 }}    | ${{ swapId: 'id', signature: 'sig', transactionHash: 'tx' }}
      ${'undefined parameter: swapId'}          | ${{ currency: 'RBTC' }} | ${{ signature: 'sig', transactionHash: 'tx' }}
      ${'invalid parameter: swapId'}            | ${{ currency: 'RBTC' }} | ${{ swapId: 123, signature: 'sig', transactionHash: 'tx' }}
      ${'undefined parameter: signature'}       | ${{ currency: 'RBTC' }} | ${{ swapId: 'id', transactionHash: 'tx' }}
      ${'invalid parameter: signature'}         | ${{ currency: 'RBTC' }} | ${{ swapId: 'id', signature: 123, transactionHash: 'tx' }}
      ${'undefined parameter: transactionHash'} | ${{ currency: 'RBTC' }} | ${{ swapId: 'id', signature: 'sig' }}
      ${'invalid parameter: transactionHash'}   | ${{ currency: 'RBTC' }} | ${{ swapId: 'id', signature: 'sig', transactionHash: 123 }}
      ${'invalid parameter: logIndex'}          | ${{ currency: 'RBTC' }} | ${{ swapId: 'id', signature: 'sig', transactionHash: 'tx', logIndex: 'invalid' }}
      ${'invalid parameter: logIndex'}          | ${{ currency: 'RBTC' }} | ${{ swapId: 'id', signature: 'sig', transactionHash: 'tx', logIndex: -1 }}
    `(
      'should not post commitment with invalid parameters ($error)',
      async ({ params, body, error }) => {
        await expect(
          commitmentRouter['postCommitment'](
            mockRequest(body, undefined, params),
            mockResponse(),
          ),
        ).rejects.toEqual(error);
      },
    );

    test('should post commitment', async () => {
      const currency = 'RBTC';
      const swapId = 'swap123';
      const signature = '0xsignature';
      const transactionHash = '0xtxhash';

      const res = mockResponse();
      await commitmentRouter['postCommitment'](
        mockRequest({ swapId, signature, transactionHash }, undefined, {
          currency,
        }),
        res,
      );

      expect(
        service.walletManager.ethereumManagers[0].hasSymbol,
      ).toHaveBeenCalledTimes(1);
      expect(
        service.walletManager.ethereumManagers[0].hasSymbol,
      ).toHaveBeenCalledWith(currency);

      expect(
        service.walletManager.ethereumManagers[0].commitments.commit,
      ).toHaveBeenCalledTimes(1);
      expect(
        service.walletManager.ethereumManagers[0].commitments.commit,
      ).toHaveBeenCalledWith(
        currency,
        swapId,
        signature,
        transactionHash,
        undefined,
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({});
    });

    test('should post commitment with logIndex', async () => {
      const currency = 'RBTC';
      const swapId = 'swap123';
      const signature = '0xsignature';
      const transactionHash = '0xtxhash';
      const logIndex = 2;

      const res = mockResponse();
      await commitmentRouter['postCommitment'](
        mockRequest(
          { swapId, signature, transactionHash, logIndex },
          undefined,
          { currency },
        ),
        res,
      );

      expect(
        service.walletManager.ethereumManagers[0].commitments.commit,
      ).toHaveBeenCalledWith(
        currency,
        swapId,
        signature,
        transactionHash,
        logIndex,
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({});
    });

    test('should throw for unsupported currency', async () => {
      const res = mockResponse();
      await expect(
        commitmentRouter['postCommitment'](
          mockRequest(
            { swapId: 'id', signature: 'sig', transactionHash: 'tx' },
            undefined,
            { currency: 'BTC' },
          ),
          res,
        ),
      ).rejects.toThrow('currency does not support commitment swaps');
    });
  });

  describe('getManager', () => {
    test('should get manager for supported currency', () => {
      const manager = commitmentRouter['getManager']('RBTC');
      expect(manager).toBe(service.walletManager.ethereumManagers[0]);
    });

    test('should throw for unsupported currency', () => {
      expect(() => commitmentRouter['getManager']('BTC')).toThrow(
        'currency does not support commitment swaps',
      );
    });
  });
});
