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
    swapManager: {
      eipSigner: {
        signCommitmentRefund: jest.fn().mockResolvedValue('0xrefundsignature'),
      },
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

    expect(mockedRouter.post).toHaveBeenCalledTimes(2);
    expect(mockedRouter.post).toHaveBeenCalledWith(
      '/:currency',
      expect.anything(),
    );
    expect(mockedRouter.post).toHaveBeenCalledWith(
      '/:currency/refund',
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
    const validTransactionHash = `0x${'a'.repeat(64)}`;

    test.each`
      error                                            | params                  | body
      ${'undefined parameter: currency'}               | ${{}}                   | ${{ swapId: 'id', signature: 'sig', transactionHash: validTransactionHash }}
      ${'invalid parameter: currency'}                 | ${{ currency: 123 }}    | ${{ swapId: 'id', signature: 'sig', transactionHash: validTransactionHash }}
      ${'undefined parameter: swapId'}                 | ${{ currency: 'RBTC' }} | ${{ signature: 'sig', transactionHash: validTransactionHash }}
      ${'invalid parameter: swapId'}                   | ${{ currency: 'RBTC' }} | ${{ swapId: 123, signature: 'sig', transactionHash: validTransactionHash }}
      ${'undefined parameter: signature'}              | ${{ currency: 'RBTC' }} | ${{ swapId: 'id', transactionHash: validTransactionHash }}
      ${'invalid parameter: signature'}                | ${{ currency: 'RBTC' }} | ${{ swapId: 'id', signature: 123, transactionHash: validTransactionHash }}
      ${'undefined parameter: transactionHash'}        | ${{ currency: 'RBTC' }} | ${{ swapId: 'id', signature: 'sig' }}
      ${'invalid parameter: transactionHash'}          | ${{ currency: 'RBTC' }} | ${{ swapId: 'id', signature: 'sig', transactionHash: 123 }}
      ${'invalid parameter: logIndex'}                 | ${{ currency: 'RBTC' }} | ${{ swapId: 'id', signature: 'sig', transactionHash: validTransactionHash, logIndex: 'invalid' }}
      ${'invalid parameter: logIndex'}                 | ${{ currency: 'RBTC' }} | ${{ swapId: 'id', signature: 'sig', transactionHash: validTransactionHash, logIndex: -1 }}
      ${'invalid parameter: logIndex'}                 | ${{ currency: 'RBTC' }} | ${{ swapId: 'id', signature: 'sig', transactionHash: validTransactionHash, logIndex: 1.5 }}
      ${'invalid parameter: maxOverpaymentPercentage'} | ${{ currency: 'RBTC' }} | ${{ swapId: 'id', signature: 'sig', transactionHash: validTransactionHash, maxOverpaymentPercentage: 'invalid' }}
      ${'invalid parameter: maxOverpaymentPercentage'} | ${{ currency: 'RBTC' }} | ${{ swapId: 'id', signature: 'sig', transactionHash: validTransactionHash, maxOverpaymentPercentage: -1 }}
      ${'invalid parameter: maxOverpaymentPercentage'} | ${{ currency: 'RBTC' }} | ${{ swapId: 'id', signature: 'sig', transactionHash: validTransactionHash, maxOverpaymentPercentage: 11 }}
      ${'invalid parameter: maxOverpaymentPercentage'} | ${{ currency: 'RBTC' }} | ${{ swapId: 'id', signature: 'sig', transactionHash: validTransactionHash, maxOverpaymentPercentage: Infinity }}
      ${'invalid parameter: maxOverpaymentPercentage'} | ${{ currency: 'RBTC' }} | ${{ swapId: 'id', signature: 'sig', transactionHash: validTransactionHash, maxOverpaymentPercentage: NaN }}
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
      const transactionHash = validTransactionHash;

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
        undefined,
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({});
    });

    test('should post commitment with logIndex', async () => {
      const currency = 'RBTC';
      const swapId = 'swap123';
      const signature = '0xsignature';
      const transactionHash = validTransactionHash;
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
        undefined,
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({});
    });

    test('should post commitment with custom maxOverpaymentPercentage', async () => {
      const currency = 'RBTC';
      const swapId = 'swap123';
      const signature = '0xsignature';
      const transactionHash = validTransactionHash;
      const maxOverpaymentPercentage = 3.5;

      const res = mockResponse();
      await commitmentRouter['postCommitment'](
        mockRequest(
          { swapId, signature, transactionHash, maxOverpaymentPercentage },
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
        undefined,
        maxOverpaymentPercentage,
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({});
    });

    test('should throw for unsupported currency', async () => {
      const res = mockResponse();
      await expect(
        commitmentRouter['postCommitment'](
          mockRequest(
            {
              swapId: 'id',
              signature: 'sig',
              transactionHash: validTransactionHash,
            },
            undefined,
            { currency: 'BTC' },
          ),
          res,
        ),
      ).rejects.toThrow('currency does not support commitment swaps');
    });
  });

  describe('POST /:currency/refund', () => {
    const refundAddressSignature = 'signed-proof';

    test.each`
      error                                            | params                  | body
      ${'undefined parameter: currency'}               | ${{}}                   | ${{ transactionHash: `0x${'1'.repeat(64)}`, refundAddressSignature }}
      ${'undefined parameter: transactionHash'}        | ${{ currency: 'RBTC' }} | ${{ refundAddressSignature }}
      ${'undefined parameter: refundAddressSignature'} | ${{ currency: 'RBTC' }} | ${{ transactionHash: `0x${'1'.repeat(64)}` }}
      ${'invalid parameter: refundAddressSignature'}   | ${{ currency: 'RBTC' }} | ${{ transactionHash: `0x${'1'.repeat(64)}`, refundAddressSignature: 123 }}
      ${'invalid parameter: transactionHash'}          | ${{ currency: 'RBTC' }} | ${{ transactionHash: 'invalid', refundAddressSignature }}
      ${'invalid parameter: transactionHash'}          | ${{ currency: 'RBTC' }} | ${{ transactionHash: '0x1234', refundAddressSignature }}
      ${'invalid parameter: logIndex'}                 | ${{ currency: 'RBTC' }} | ${{ transactionHash: `0x${'1'.repeat(64)}`, refundAddressSignature, logIndex: -1 }}
      ${'invalid parameter: logIndex'}                 | ${{ currency: 'RBTC' }} | ${{ transactionHash: `0x${'1'.repeat(64)}`, refundAddressSignature, logIndex: 1.5 }}
    `(
      'should not refund commitment with invalid parameters ($error)',
      async ({ params, body, error }) => {
        await expect(
          commitmentRouter['refundCommitment'](
            mockRequest(body, undefined, params),
            mockResponse(),
          ),
        ).rejects.toEqual(error);
      },
    );

    test('should refund commitment', async () => {
      const currency = 'RBTC';
      const transactionHash = `0x${'1'.repeat(64)}`;

      const res = mockResponse();
      await commitmentRouter['refundCommitment'](
        mockRequest({ transactionHash, refundAddressSignature }, undefined, {
          currency,
        }),
        res,
      );

      expect(
        service.walletManager.ethereumManagers[0].hasSymbol,
      ).toHaveBeenCalledWith(currency);
      expect(
        service.swapManager.eipSigner.signCommitmentRefund,
      ).toHaveBeenCalledWith(
        currency,
        transactionHash,
        refundAddressSignature,
        undefined,
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        signature: '0xrefundsignature',
      });
    });

    test('should throw for unsupported currency', async () => {
      await expect(
        commitmentRouter['refundCommitment'](
          mockRequest(
            {
              transactionHash: `0x${'2'.repeat(64)}`,
              refundAddressSignature,
            },
            undefined,
            { currency: 'BTC' },
          ),
          mockResponse(),
        ),
      ).rejects.toThrow('currency does not support commitment swaps');
    });

    test('should refund commitment with logIndex', async () => {
      const currency = 'RBTC';
      const transactionHash = `0x${'3'.repeat(64)}`;
      const logIndex = 2;

      await commitmentRouter['refundCommitment'](
        mockRequest(
          { transactionHash, refundAddressSignature, logIndex },
          undefined,
          { currency },
        ),
        mockResponse(),
      );

      expect(
        service.swapManager.eipSigner.signCommitmentRefund,
      ).toHaveBeenCalledWith(
        currency,
        transactionHash,
        refundAddressSignature,
        logIndex,
      );
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
