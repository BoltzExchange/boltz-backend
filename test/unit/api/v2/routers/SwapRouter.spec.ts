import { randomBytes } from 'crypto';
import { Router } from 'express';
import Logger from '../../../../../lib/Logger';
import { getHexBuffer, getHexString } from '../../../../../lib/Utils';
import ApiErrors from '../../../../../lib/api/Errors';
import SwapInfos from '../../../../../lib/api/SwapInfos';
import SwapRouter from '../../../../../lib/api/v2/routers/SwapRouter';
import { OrderSide, SwapVersion } from '../../../../../lib/consts/Enums';
import ChainSwapRepository from '../../../../../lib/db/repositories/ChainSwapRepository';
import MarkedSwapRepository from '../../../../../lib/db/repositories/MarkedSwapRepository';
import ReferralRepository from '../../../../../lib/db/repositories/ReferralRepository';
import SwapRepository from '../../../../../lib/db/repositories/SwapRepository';
import RateProviderTaproot from '../../../../../lib/rates/providers/RateProviderTaproot';
import CountryCodes from '../../../../../lib/service/CountryCodes';
import Errors from '../../../../../lib/service/Errors';
import Service from '../../../../../lib/service/Service';
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

jest.mock('../../../../../lib/db/repositories/SwapRepository', () => ({
  getSwap: jest.fn().mockImplementation(async ({ id }) => {
    if (id === 'notFound') {
      return undefined;
    }

    return {
      swap: 'details',
    };
  }),
}));

jest.mock('../../../../../lib/db/repositories/MarkedSwapRepository', () => ({
  addMarkedSwap: jest.fn().mockResolvedValue(undefined),
}));

describe('SwapRouter', () => {
  const service = {
    rateProvider: {
      providers: {
        [SwapVersion.Taproot]: {
          getSubmarinePairs: jest
            .fn()
            .mockReturnValue(
              new Map<string, Map<string, any>>([
                [
                  'L-BTC',
                  new Map<string, any>([['BTC', { some: 'submarine data' }]]),
                ],
              ]),
            ),
          getReversePairs: jest
            .fn()
            .mockReturnValue(
              new Map<string, Map<string, any>>([
                [
                  'BTC',
                  new Map<string, any>([['L-BTC', { some: 'reverse data' }]]),
                ],
              ]),
            ),
          getChainPairs: jest
            .fn()
            .mockReturnValue(
              new Map<string, Map<string, any>>([
                [
                  'BTC',
                  new Map<string, any>([['L-BTC', { some: 'chain data' }]]),
                ],
              ]),
            ),
        },
      },
    },

    musigSigner: {
      signRefund: jest.fn().mockResolvedValue({
        pubNonce: getHexBuffer('1111'),
        signature: getHexBuffer('1112'),
      }),
      signReverseSwapClaim: jest.fn().mockResolvedValue({
        pubNonce: getHexBuffer('2111'),
        signature: getHexBuffer('2112'),
      }),
    },

    swapManager: {
      deferredClaimer: {
        getCooperativeDetails: jest.fn().mockResolvedValue({
          preimage: randomBytes(32),
          pubNonce: randomBytes(31),
          publicKey: randomBytes(30),
          transactionHash: randomBytes(33),
        }),
        broadcastCooperative: jest.fn().mockResolvedValue(undefined),
      },

      chainSwapSigner: {
        getCooperativeDetails: jest.fn().mockResolvedValue({
          pubNonce: getHexBuffer('00'),
          publicKey: getHexBuffer('01'),
          transactionHash: getHexBuffer('02'),
        }),
        signClaim: jest.fn().mockResolvedValue({
          pubNonce: getHexBuffer('21'),
          signature: getHexBuffer('42'),
        }),
      },

      eipSigner: {
        signSwapRefund: jest.fn().mockResolvedValue('12344321'),
      },

      renegotiator: {},
    },

    transactionFetcher: {
      getSubmarineTransaction: jest.fn().mockResolvedValue({
        transactionId: 'txId',
        transactionHex: 'txHex',
        timeoutBlockHeight: 21,
        timeoutEta: 210987,
      }),
      getReverseSwapTransaction: jest.fn().mockResolvedValue({
        transactionId: 'txIdReverse',
        transactionHex: 'txHexReverse',
        timeoutBlockHeight: 42,
      }),
      getChainSwapTransactions: jest.fn().mockResolvedValue({
        some: 'data',
        to: 'serialize',
      }),
    },

    convertToPairAndSide: jest
      .fn()
      .mockReturnValue({ pairId: 'L-BTC/BTC', orderSide: OrderSide.BUY }),
    createSwap: jest.fn().mockResolvedValue({ id: 'randomIdPreimageHash' }),
    createSwapWithInvoice: jest.fn().mockResolvedValue({ id: 'randomId' }),
    createReverseSwap: jest.fn().mockResolvedValue({ id: 'reverseId' }),
    createChainSwap: jest.fn().mockResolvedValue({ id: 'chainId' }),
    getReverseBip21: jest.fn().mockResolvedValue({
      bip21: 'bip21',
      signature: 'bip21Sig',
    }),
    getSubmarinePreimage: jest
      .fn()
      .mockResolvedValue(
        '9a2f9ebe8d8d9e9beb9faba552b6203b89d0453a73fb8c768623b9e23ea5fd76',
      ),
  } as unknown as Service;

  const swapInfosData = new Map([['swapId', { some: 'statusData' }]]);
  const swapInfos = {
    get: async (id: string) => {
      return swapInfosData.get(id);
    },
  } as unknown as SwapInfos;

  const countryCodes = {
    isRelevantCountry: jest.fn().mockReturnValue(true),
    getCountryCode: jest.fn().mockReturnValue('TOR'),
  } as unknown as CountryCodes;

  const swapRouter = new SwapRouter(
    Logger.disabledLogger,
    service,
    swapInfos,
    countryCodes,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should get route prefix', () => {
    expect(swapRouter.path).toEqual('swap');
  });

  test('should get router', () => {
    const router = swapRouter.getRouter();
    expect(router).not.toBeUndefined();

    expect(Router).toHaveBeenCalledTimes(1);

    expect(mockedRouter.get).toHaveBeenCalledTimes(15);
    expect(mockedRouter.get).toHaveBeenCalledWith('/:id', expect.anything());
    expect(mockedRouter.get).toHaveBeenCalledWith(
      '/submarine',
      expect.anything(),
    );
    expect(mockedRouter.get).toHaveBeenCalledWith(
      '/submarine/:id/invoice/amount',
      expect.anything(),
    );
    expect(mockedRouter.get).toHaveBeenCalledWith(
      '/submarine/:id/transaction',
      expect.anything(),
    );
    expect(mockedRouter.get).toHaveBeenCalledWith(
      '/submarine/:id/preimage',
      expect.anything(),
    );
    expect(mockedRouter.get).toHaveBeenCalledWith(
      '/submarine/:id/claim',
      expect.anything(),
    );
    expect(mockedRouter.get).toHaveBeenCalledWith(
      '/submarine/:id/refund',
      expect.anything(),
    );

    expect(mockedRouter.get).toHaveBeenCalledWith(
      '/reverse',
      expect.anything(),
    );
    expect(mockedRouter.get).toHaveBeenCalledWith(
      '/reverse/:invoice/bip21',
      expect.anything(),
    );
    expect(mockedRouter.get).toHaveBeenCalledWith(
      '/reverse/:id/transaction',
      expect.anything(),
    );
    expect(mockedRouter.get).toHaveBeenCalledWith('/chain', expect.anything());
    expect(mockedRouter.get).toHaveBeenCalledWith(
      '/chain/:id/transactions',
      expect.anything(),
    );
    expect(mockedRouter.get).toHaveBeenCalledWith(
      '/chain/:id/claim',
      expect.anything(),
    );
    expect(mockedRouter.get).toHaveBeenCalledWith(
      '/chain/:id/refund',
      expect.anything(),
    );
    expect(mockedRouter.get).toHaveBeenCalledWith(
      '/chain/:id/quote',
      expect.anything(),
    );

    expect(mockedRouter.post).toHaveBeenCalledTimes(12);
    expect(mockedRouter.post).toHaveBeenCalledWith(
      '/submarine',
      expect.anything(),
    );
    expect(mockedRouter.post).toHaveBeenCalledWith(
      '/submarine/refund',
      expect.anything(),
    );
    expect(mockedRouter.post).toHaveBeenCalledWith(
      '/submarine/:id/refund',
      expect.anything(),
    );
    expect(mockedRouter.post).toHaveBeenCalledWith(
      '/submarine/:id/claim',
      expect.anything(),
    );
    expect(mockedRouter.post).toHaveBeenCalledWith(
      '/submarine/:id/invoice',
      expect.anything(),
    );
    expect(mockedRouter.post).toHaveBeenCalledWith(
      '/reverse',
      expect.anything(),
    );
    expect(mockedRouter.post).toHaveBeenCalledWith(
      '/reverse/claim',
      expect.anything(),
    );
    expect(mockedRouter.post).toHaveBeenCalledWith(
      '/reverse/:id/claim',
      expect.anything(),
    );
    expect(mockedRouter.post).toHaveBeenCalledWith('/chain', expect.anything());
    expect(mockedRouter.post).toHaveBeenCalledWith(
      '/chain/:id/claim',
      expect.anything(),
    );
    expect(mockedRouter.post).toHaveBeenCalledWith(
      '/chain/:id/refund',
      expect.anything(),
    );
    expect(mockedRouter.post).toHaveBeenCalledWith(
      '/chain/:id/quote',
      expect.anything(),
    );
  });

  test.each`
    error                        | params
    ${'undefined parameter: id'} | ${{}}
    ${'invalid parameter: id'}   | ${{ id: 1 }}
  `(
    'should not get status of swaps with invalid parameters ($error)',
    async ({ params, error }) => {
      await expect(
        swapRouter['getSwapStatus'](
          mockRequest(undefined, undefined, params),
          mockResponse(),
        ),
      ).rejects.toEqual(error);
    },
  );

  test('should get status of swaps', async () => {
    const id = 'swapId';

    const res = mockResponse();
    await swapRouter['getSwapStatus'](
      mockRequest(undefined, undefined, { id }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(await swapInfos.get(id));
  });

  test('should return 404 as status when swap id cannot be found', async () => {
    const id = 'notFound';

    const res = mockResponse();
    await swapRouter['getSwapStatus'](
      mockRequest(undefined, undefined, { id }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: `could not find swap with id: ${id}`,
    });
  });

  test('should get submarine pairs', async () => {
    const res = mockResponse();
    await swapRouter['getSubmarine'](mockRequest(), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      RateProviderTaproot.serializePairs(
        service.rateProvider.providers[SwapVersion.Taproot].getSubmarinePairs(),
      ),
    );
  });

  test.each`
    error                                            | body
    ${'undefined parameter: to'}                     | ${{}}
    ${'undefined parameter: from'}                   | ${{ to: 'BTC' }}
    ${'could not parse hex string: refundPublicKey'} | ${{ to: 'BTC', from: 'L-BTC', invoice: 'lnbc1', refundPublicKey: 'notHex' }}
  `(
    'should not create submarine swaps with invalid parameters ($error)',
    async ({ body, error }) => {
      await expect(
        swapRouter['createSubmarine'](mockRequest(body), mockResponse()),
      ).rejects.toEqual(error);
    },
  );

  test.each`
    length
    ${1}
    ${31}
    ${33}
    ${34}
  `('should reject preimage hashes with length $length', async ({ length }) => {
    await expect(
      swapRouter['createSubmarine'](
        mockRequest({
          to: 'BTC',
          from: 'BTC',
          refundPublicKey: '0021',
          preimageHash: getHexString(randomBytes(length)),
        }),
        mockResponse(),
      ),
    ).rejects.toEqual(`invalid preimage hash length: ${length}`);
  });

  test('should create submarine swaps', async () => {
    const reqBody = {
      to: 'BTC',
      from: 'L-BTC',
      invoice: 'LNBC1',
      refundPublicKey: '0021',
    };
    const res = mockResponse();

    await swapRouter['createSubmarine'](mockRequest(reqBody), res);

    expect(service.convertToPairAndSide).toHaveBeenCalledTimes(1);
    expect(service.convertToPairAndSide).toHaveBeenCalledWith(
      reqBody.from,
      reqBody.to,
    );

    expect(service.createSwapWithInvoice).toHaveBeenCalledTimes(1);
    expect(service.createSwapWithInvoice).toHaveBeenCalledWith(
      'L-BTC/BTC',
      OrderSide.BUY,
      getHexBuffer(reqBody.refundPublicKey),
      reqBody.invoice.toLowerCase(),
      undefined,
      undefined,
      undefined,
      SwapVersion.Taproot,
      undefined,
    );

    expect(MarkedSwapRepository.addMarkedSwap).toHaveBeenCalledTimes(1);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 'randomId' });
  });

  test('should create submarine swaps with webhook', async () => {
    const reqBody = {
      to: 'BTC',
      from: 'L-BTC',
      invoice: 'LNBC1',
      refundPublicKey: '0021',
      webhook: {
        url: 'test',
        hashSwapId: false,
      },
    };
    const res = mockResponse();

    await swapRouter['createSubmarine'](mockRequest(reqBody), res);

    expect(service.createSwapWithInvoice).toHaveBeenCalledTimes(1);
    expect(service.createSwapWithInvoice).toHaveBeenCalledWith(
      'L-BTC/BTC',
      OrderSide.BUY,
      getHexBuffer(reqBody.refundPublicKey),
      reqBody.invoice.toLowerCase(),
      undefined,
      undefined,
      undefined,
      SwapVersion.Taproot,
      reqBody.webhook,
    );
  });

  test('should create submarine swaps with preimage hash', async () => {
    const reqBody = {
      to: 'BTC',
      from: 'L-BTC',
      refundPublicKey: '0021',
      preimageHash:
        'd1e9cce3bec183a27f4a5a8f86b5029016aa4f5f87f86695c1d1c79b5f0c4e05',
    };
    const res = mockResponse();

    await swapRouter['createSubmarine'](mockRequest(reqBody), res);

    expect(service.convertToPairAndSide).toHaveBeenCalledTimes(1);
    expect(service.convertToPairAndSide).toHaveBeenCalledWith(
      reqBody.from,
      reqBody.to,
    );

    expect(service.createSwap).toHaveBeenCalledTimes(1);
    expect(service.createSwap).toHaveBeenCalledWith({
      pairId: 'L-BTC/BTC',
      orderSide: OrderSide.BUY,
      version: SwapVersion.Taproot,
      preimageHash: getHexBuffer(reqBody.preimageHash),
      refundPublicKey: getHexBuffer(reqBody.refundPublicKey),
    });

    expect(MarkedSwapRepository.addMarkedSwap).toHaveBeenCalledTimes(1);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 'randomIdPreimageHash' });
  });

  test('should create submarine swaps with preimage hash and webhook', async () => {
    const reqBody = {
      to: 'BTC',
      from: 'L-BTC',
      refundPublicKey: '0021',
      preimageHash:
        'd1e9cce3bec183a27f4a5a8f86b5029016aa4f5f87f86695c1d1c79b5f0c4e05',
      webhook: {
        url: 'test',
        hashSwapId: false,
      },
    };
    const res = mockResponse();

    await swapRouter['createSubmarine'](mockRequest(reqBody), res);

    expect(service.createSwap).toHaveBeenCalledTimes(1);
    expect(service.createSwap).toHaveBeenCalledWith({
      pairId: 'L-BTC/BTC',
      orderSide: OrderSide.BUY,
      webHook: reqBody.webhook,
      version: SwapVersion.Taproot,
      preimageHash: getHexBuffer(reqBody.preimageHash),
      refundPublicKey: getHexBuffer(reqBody.refundPublicKey),
    });
  });

  test('should create submarine swaps with pairHash', async () => {
    const reqBody = {
      to: 'BTC',
      from: 'L-BTC',
      invoice: 'LNBC1',
      pairHash: 'some hash',
      refundPublicKey: '0021',
    };
    const res = mockResponse();

    await swapRouter['createSubmarine'](mockRequest(reqBody), res);

    expect(service.createSwapWithInvoice).toHaveBeenCalledTimes(1);
    expect(service.createSwapWithInvoice).toHaveBeenCalledWith(
      'L-BTC/BTC',
      OrderSide.BUY,
      getHexBuffer(reqBody.refundPublicKey),
      reqBody.invoice.toLowerCase(),
      reqBody.pairHash,
      undefined,
      undefined,
      SwapVersion.Taproot,
      undefined,
    );
  });

  test('should create submarine swaps with referralId', async () => {
    const reqBody = {
      to: 'BTC',
      from: 'L-BTC',
      invoice: 'LNBC1',
      referralId: 'partner',
      refundPublicKey: '0021',
    };

    const res = mockResponse();
    await swapRouter['createSubmarine'](mockRequest(reqBody), res);

    expect(service.createSwapWithInvoice).toHaveBeenCalledTimes(1);
    expect(service.createSwapWithInvoice).toHaveBeenCalledWith(
      'L-BTC/BTC',
      OrderSide.BUY,
      getHexBuffer(reqBody.refundPublicKey),
      reqBody.invoice.toLowerCase(),
      undefined,
      reqBody.referralId,
      undefined,
      SwapVersion.Taproot,
      undefined,
    );
  });

  test('should create submarine swaps with referralId in URL query', async () => {
    const reqBody = {
      to: 'BTC',
      from: 'L-BTC',
      invoice: 'LNBC1',
      refundPublicKey: '0021',
    };
    const referralId = 'partner';

    const res = mockResponse();
    await swapRouter['createSubmarine'](
      mockRequest(reqBody, {
        referralId,
      }),
      res,
    );

    expect(service.createSwapWithInvoice).toHaveBeenCalledTimes(1);
    expect(service.createSwapWithInvoice).toHaveBeenCalledWith(
      'L-BTC/BTC',
      OrderSide.BUY,
      getHexBuffer(reqBody.refundPublicKey),
      reqBody.invoice.toLowerCase(),
      undefined,
      referralId,
      undefined,
      SwapVersion.Taproot,
      undefined,
    );
  });

  test.each`
    error                        | params
    ${'undefined parameter: id'} | ${{}}
    ${'invalid parameter: id'}   | ${{ id: 1 }}
  `(
    'should not get lockup transaction of submarine swaps with invalid parameters ($error)',
    async ({ error, params }) => {
      await expect(
        swapRouter['getSubmarineTransaction'](
          mockRequest(undefined, undefined, params),
          mockResponse(),
        ),
      ).rejects.toEqual(error);
    },
  );

  test('should get lockup transaction of submarine swaps', async () => {
    const id = 'asdf';

    const res = mockResponse();
    await swapRouter['getSubmarineTransaction'](
      mockRequest(undefined, undefined, { id }),
      res,
    );

    expect(
      service.transactionFetcher.getSubmarineTransaction,
    ).toHaveBeenCalledTimes(1);
    expect(
      service.transactionFetcher.getSubmarineTransaction,
    ).toHaveBeenCalledWith(id);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      id: 'txId',
      hex: 'txHex',
      timeoutBlockHeight: 21,
      timeoutEta: 210987,
    });
  });

  describe('getSubmarinePreimage', () => {
    test.each`
      error                        | params
      ${'undefined parameter: id'} | ${{}}
      ${'invalid parameter: id'}   | ${{ id: 1 }}
    `(
      'should not get preimage of submarine swaps with invalid parameters ($error)',
      async ({ error, params }) => {
        await expect(
          swapRouter['getSubmarinePreimage'](
            mockRequest(undefined, undefined, params),
            mockResponse(),
          ),
        ).rejects.toEqual(error);
      },
    );

    test('should get preimage of submarine swaps', async () => {
      const id = 'asdf';

      const res = mockResponse();
      await swapRouter['getSubmarinePreimage'](
        mockRequest(undefined, undefined, { id }),
        res,
      );

      expect(service.getSubmarinePreimage).toHaveBeenCalledTimes(1);
      expect(service.getSubmarinePreimage).toHaveBeenCalledWith(id);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        preimage: await service.getSubmarinePreimage(id),
      });
    });
  });

  test.each`
    error                                        | body
    ${'undefined parameter: id'}                 | ${{}}
    ${'undefined parameter: index'}              | ${{ id: 'someId' }}
    ${'invalid parameter: index'}                | ${{ id: 'someId', index: 'yo' }}
    ${'undefined parameter: pubNonce'}           | ${{ id: 'someId', index: 0 }}
    ${'could not parse hex string: pubNonce'}    | ${{ id: 'someId', index: 0, pubNonce: 'notHex' }}
    ${'undefined parameter: transaction'}        | ${{ id: 'someId', index: 0, pubNonce: '0011' }}
    ${'could not parse hex string: transaction'} | ${{ id: 'someId', index: 0, pubNonce: '0011', transaction: 'notHex' }}
  `(
    'should not refund submarine swaps with invalid parameters ($error)',
    async ({ error, body }) => {
      await expect(
        swapRouter['signUtxoRefund'](service.musigSigner)(
          mockRequest(body),
          mockResponse(),
        ),
      ).rejects.toEqual(error);
    },
  );

  test('should refund submarine swaps with id in params', async () => {
    const reqParams = {
      id: 'someId',
    };
    const reqBody = {
      index: 1,
      pubNonce: '0011',
      transaction: '0021',
    };
    const res = mockResponse();

    await swapRouter['signUtxoRefund'](service.musigSigner)(
      mockRequest(reqBody, undefined, reqParams),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      pubNonce: '1111',
      partialSignature: '1112',
    });

    expect(service.musigSigner.signRefund).toHaveBeenCalledTimes(1);
    expect(service.musigSigner.signRefund).toHaveBeenCalledWith(
      reqParams.id,
      getHexBuffer(reqBody.pubNonce),
      getHexBuffer(reqBody.transaction),
      reqBody.index,
    );
  });

  test('should refund submarine swaps with id in body', async () => {
    const reqBody = {
      id: 'someId',
      index: 1,
      pubNonce: '0011',
      transaction: '0021',
    };
    const res = mockResponse();

    await swapRouter['signUtxoRefund'](service.musigSigner)(
      mockRequest(reqBody),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      pubNonce: '1111',
      partialSignature: '1112',
    });

    expect(service.musigSigner.signRefund).toHaveBeenCalledTimes(1);
    expect(service.musigSigner.signRefund).toHaveBeenCalledWith(
      reqBody.id,
      getHexBuffer(reqBody.pubNonce),
      getHexBuffer(reqBody.transaction),
      reqBody.index,
    );
  });

  test('should refund evm submarine swaps', async () => {
    const reqParams = {
      id: 'someId',
    };
    const res = mockResponse();

    await swapRouter['refundEvm'](mockRequest(null, {}, reqParams), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      signature: '12344321',
    });

    expect(service.swapManager.eipSigner.signSwapRefund).toHaveBeenCalledTimes(
      1,
    );
    expect(service.swapManager.eipSigner.signSwapRefund).toHaveBeenCalledWith(
      reqParams.id,
    );
  });

  test.each`
    error                        | params
    ${'undefined parameter: id'} | ${{}}
    ${'invalid parameter: id'}   | ${{ id: 123 }}
  `(
    'should not get submarine claim details with invalid parameters ($error)',
    async ({ error, params }) => {
      await expect(
        swapRouter['getSubmarineClaimDetails'](
          mockRequest(null, {}, params),
          mockResponse(),
        ),
      ).rejects.toEqual(error);
    },
  );

  test('should throw when getting submarine claim details for swap that does not exist', async () => {
    const id = 'notFound';

    const res = mockResponse();
    await swapRouter['getSubmarineClaimDetails'](
      mockRequest(
        null,
        {},
        {
          id,
        },
      ),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: Errors.SWAP_NOT_FOUND(id).message,
    });
  });

  test('should get submarine claim details', async () => {
    const id = 'swapId';

    const res = mockResponse();
    await swapRouter['getSubmarineClaimDetails'](
      mockRequest(
        null,
        {},
        {
          id,
        },
      ),
      res,
    );

    expect(SwapRepository.getSwap).toHaveBeenCalledTimes(1);
    expect(SwapRepository.getSwap).toHaveBeenCalledWith({
      id,
    });
    expect(
      service.swapManager.deferredClaimer.getCooperativeDetails,
    ).toHaveBeenCalledTimes(1);
    expect(
      service.swapManager.deferredClaimer.getCooperativeDetails,
    ).toHaveBeenCalledWith(await SwapRepository.getSwap({}));

    const details =
      await service.swapManager.deferredClaimer.getCooperativeDetails(
        {} as any,
      );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      preimage: getHexString(details.preimage),
      pubNonce: getHexString(details.pubNonce),
      publicKey: getHexString(details.publicKey),
      transactionHash: getHexString(details.transactionHash),
    });
  });

  test.each`
    error                                             | params           | body
    ${'undefined parameter: id'}                      | ${{}}            | ${{}}
    ${'undefined parameter: partialSignature'}        | ${{ id: '123' }} | ${{ pubNonce: 'aabbcc' }}
    ${'could not parse hex string: pubNonce'}         | ${{ id: '123' }} | ${{ pubNonce: 'notHex' }}
    ${'could not parse hex string: partialSignature'} | ${{ id: '123' }} | ${{ pubNonce: 'aabbcc', partialSignature: 'notHex' }}
  `(
    'should not refund submarine swaps with invalid parameters ($error)',
    async ({ error, params, body }) => {
      await expect(
        swapRouter['claimSubmarine'](
          mockRequest(body, {}, params),
          mockResponse(),
        ),
      ).rejects.toEqual(error);
    },
  );

  test('should throw when broadcasting cooperative submarine claim', async () => {
    const id = 'notFound';

    const res = mockResponse();
    await swapRouter['claimSubmarine'](
      mockRequest(
        {
          pubNonce: 'aa',
          partialSignature: 'bb',
        },
        {},
        {
          id,
        },
      ),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: Errors.SWAP_NOT_FOUND(id).message,
    });
  });

  test('should broadcast cooperative submarine swap claims', async () => {
    const id = 'swapId';
    const body = {
      pubNonce: getHexString(randomBytes(32)),
      partialSignature: getHexString(randomBytes(32)),
    };

    const res = mockResponse();
    await swapRouter['claimSubmarine'](
      mockRequest(
        body,
        {},
        {
          id,
        },
      ),
      res,
    );

    expect(SwapRepository.getSwap).toHaveBeenCalledTimes(1);
    expect(SwapRepository.getSwap).toHaveBeenCalledWith({
      id,
    });
    expect(
      service.swapManager.deferredClaimer.broadcastCooperative,
    ).toHaveBeenCalledTimes(1);
    expect(
      service.swapManager.deferredClaimer.broadcastCooperative,
    ).toHaveBeenCalledWith(
      await SwapRepository.getSwap({}),
      getHexBuffer(body.pubNonce),
      getHexBuffer(body.partialSignature),
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({});
  });

  test('should get reverse pairs', async () => {
    const res = mockResponse();
    await swapRouter['getReverse'](mockRequest(), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      RateProviderTaproot.serializePairs(
        service.rateProvider.providers[SwapVersion.Taproot].getReversePairs(),
      ),
    );
  });

  test.each`
    error                                             | body
    ${'undefined parameter: to'}                      | ${{}}
    ${'undefined parameter: from'}                    | ${{ to: 'L-BTC' }}
    ${'undefined parameter: preimageHash'}            | ${{ to: 'L-BTC', from: 'BTC' }}
    ${'could not parse hex string: preimageHash'}     | ${{ to: 'L-BTC', from: 'BTC', preimageHash: 'notHex' }}
    ${'could not parse hex string: claimPublicKey'}   | ${{ to: 'L-BTC', from: 'BTC', preimageHash: '00', claimPublicKey: 'notHex' }}
    ${'could not parse hex string: addressSignature'} | ${{ to: 'L-BTC', from: 'BTC', preimageHash: '00', claimPublicKey: '0011', addressSignature: 'notHex' }}
    ${'invalid parameter: invoiceExpiry'}             | ${{ to: 'L-BTC', from: 'BTC', preimageHash: '00', claimPublicKey: '0011', invoiceExpiry: '123' }}
    ${'invalid parameter: description'}               | ${{ to: 'L-BTC', from: 'BTC', preimageHash: '00', claimPublicKey: '0011', description: 123 }}
    ${'invalid parameter: claimCovenant'}             | ${{ to: 'L-BTC', from: 'BTC', preimageHash: '00', claimPublicKey: '0011', claimCovenant: 123 }}
    ${'invalid parameter: claimCovenant'}             | ${{ to: 'L-BTC', from: 'BTC', preimageHash: '00', claimPublicKey: '0011', claimCovenant: 'notBool' }}
    ${'invalid parameter: descriptionHash'}           | ${{ to: 'L-BTC', from: 'BTC', preimageHash: '00', claimPublicKey: '0011', descriptionHash: 123 }}
    ${'could not parse hex string: descriptionHash'}  | ${{ to: 'L-BTC', from: 'BTC', preimageHash: '00', claimPublicKey: '0011', descriptionHash: 'notHex' }}
  `(
    'should not create reverse swaps with invalid parameters ($error)',
    async ({ body, error }) => {
      await expect(
        swapRouter['createReverse'](mockRequest(body), mockResponse()),
      ).rejects.toEqual(error);
    },
  );

  test.each([1, 2, 3, 21, 31, 33, 64])(
    'should not create reverse swaps with preimage hash length != 32',
    async (length) => {
      await expect(
        swapRouter['createReverse'](
          mockRequest({
            to: 'L-BTC',
            from: 'BTC',
            claimPublicKey: '21',
            preimageHash: getHexString(randomBytes(length)),
          }),
          mockResponse(),
        ),
      ).rejects.toEqual(`invalid preimage hash length: ${length}`);
    },
  );

  test('should create reverse swaps', async () => {
    const reqBody = {
      to: 'L-BTC',
      from: 'BTC',
      claimPublicKey: '21',
      preimageHash: getHexString(randomBytes(32)),
    };
    const res = mockResponse();

    await swapRouter['createReverse'](mockRequest(reqBody), res);

    expect(service.convertToPairAndSide).toHaveBeenCalledTimes(1);
    expect(service.convertToPairAndSide).toHaveBeenCalledWith(
      reqBody.from,
      reqBody.to,
    );

    expect(service.createReverseSwap).toHaveBeenCalledTimes(1);
    expect(service.createReverseSwap).toHaveBeenCalledWith({
      pairId: 'L-BTC/BTC',
      prepayMinerFee: false,
      orderSide: OrderSide.BUY,
      version: SwapVersion.Taproot,
      preimageHash: getHexBuffer(reqBody.preimageHash),
      claimPublicKey: getHexBuffer(reqBody.claimPublicKey),
    });

    expect(MarkedSwapRepository.addMarkedSwap).toHaveBeenCalledTimes(1);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 'reverseId' });
  });

  test('should create reverse swaps with webhook', async () => {
    const reqBody = {
      to: 'L-BTC',
      from: 'BTC',
      claimPublicKey: '21',
      preimageHash: getHexString(randomBytes(32)),
      webhook: {
        url: 'test',
        hashSwapId: false,
      },
    };
    const res = mockResponse();

    await swapRouter['createReverse'](mockRequest(reqBody), res);

    expect(service.createReverseSwap).toHaveBeenCalledTimes(1);
    expect(service.createReverseSwap).toHaveBeenCalledWith({
      pairId: 'L-BTC/BTC',
      prepayMinerFee: false,
      orderSide: OrderSide.BUY,
      webHook: reqBody.webhook,
      version: SwapVersion.Taproot,
      preimageHash: getHexBuffer(reqBody.preimageHash),
      claimPublicKey: getHexBuffer(reqBody.claimPublicKey),
    });
  });

  test('should create reverse swaps with pairHash', async () => {
    const reqBody = {
      to: 'L-BTC',
      from: 'BTC',
      pairHash: 'someHash',
      claimPublicKey: '21',
      preimageHash: getHexString(randomBytes(32)),
    };
    const res = mockResponse();

    await swapRouter['createReverse'](mockRequest(reqBody), res);

    expect(service.createReverseSwap).toHaveBeenCalledTimes(1);
    expect(service.createReverseSwap).toHaveBeenCalledWith({
      pairId: 'L-BTC/BTC',
      prepayMinerFee: false,
      orderSide: OrderSide.BUY,
      pairHash: reqBody.pairHash,
      version: SwapVersion.Taproot,
      preimageHash: getHexBuffer(reqBody.preimageHash),
      claimPublicKey: getHexBuffer(reqBody.claimPublicKey),
    });
  });

  test('should create reverse swaps with referralId', async () => {
    const reqBody = {
      to: 'L-BTC',
      from: 'BTC',
      claimPublicKey: '21',
      referralId: 'partner',
      preimageHash: getHexString(randomBytes(32)),
    };
    const res = mockResponse();

    await swapRouter['createReverse'](mockRequest(reqBody), res);

    expect(service.createReverseSwap).toHaveBeenCalledTimes(1);
    expect(service.createReverseSwap).toHaveBeenCalledWith({
      pairId: 'L-BTC/BTC',
      prepayMinerFee: false,
      orderSide: OrderSide.BUY,
      version: SwapVersion.Taproot,
      referralId: reqBody.referralId,
      preimageHash: getHexBuffer(reqBody.preimageHash),
      claimPublicKey: getHexBuffer(reqBody.claimPublicKey),
    });
  });

  test('should create reverse swaps with referralId in URL query', async () => {
    const reqBody = {
      to: 'L-BTC',
      from: 'BTC',
      claimPublicKey: '21',
      preimageHash: getHexString(randomBytes(32)),
    };
    const referralId = 'partner';

    const res = mockResponse();

    await swapRouter['createReverse'](
      mockRequest(reqBody, {
        referralId,
      }),
      res,
    );

    expect(service.createReverseSwap).toHaveBeenCalledTimes(1);
    expect(service.createReverseSwap).toHaveBeenCalledWith({
      referralId,
      pairId: 'L-BTC/BTC',
      prepayMinerFee: false,
      orderSide: OrderSide.BUY,
      version: SwapVersion.Taproot,
      preimageHash: getHexBuffer(reqBody.preimageHash),
      claimPublicKey: getHexBuffer(reqBody.claimPublicKey),
    });
  });

  test('should create reverse swaps with routingNode', async () => {
    const reqBody = {
      to: 'L-BTC',
      from: 'BTC',
      claimPublicKey: '21',
      routingNode: '02abcd',
      preimageHash: getHexString(randomBytes(32)),
    };
    const res = mockResponse();

    await swapRouter['createReverse'](mockRequest(reqBody), res);

    expect(service.createReverseSwap).toHaveBeenCalledTimes(1);
    expect(service.createReverseSwap).toHaveBeenCalledWith({
      pairId: 'L-BTC/BTC',
      prepayMinerFee: false,
      orderSide: OrderSide.BUY,
      version: SwapVersion.Taproot,
      routingNode: reqBody.routingNode,
      preimageHash: getHexBuffer(reqBody.preimageHash),
      claimPublicKey: getHexBuffer(reqBody.claimPublicKey),
    });
  });

  test('should create reverse swaps with invoiceAmount', async () => {
    const reqBody = {
      to: 'L-BTC',
      from: 'BTC',
      invoiceAmount: 123,
      claimPublicKey: '21',
      preimageHash: getHexString(randomBytes(32)),
    };
    const res = mockResponse();

    await swapRouter['createReverse'](mockRequest(reqBody), res);

    expect(service.createReverseSwap).toHaveBeenCalledTimes(1);
    expect(service.createReverseSwap).toHaveBeenCalledWith({
      pairId: 'L-BTC/BTC',
      prepayMinerFee: false,
      orderSide: OrderSide.BUY,
      version: SwapVersion.Taproot,
      invoiceAmount: reqBody.invoiceAmount,
      preimageHash: getHexBuffer(reqBody.preimageHash),
      claimPublicKey: getHexBuffer(reqBody.claimPublicKey),
    });
  });

  test('should create reverse swaps with onchainAmount', async () => {
    const reqBody = {
      to: 'L-BTC',
      from: 'BTC',
      onchainAmount: 123,
      claimPublicKey: '21',
      preimageHash: getHexString(randomBytes(32)),
    };
    const res = mockResponse();

    await swapRouter['createReverse'](mockRequest(reqBody), res);

    expect(service.createReverseSwap).toHaveBeenCalledTimes(1);
    expect(service.createReverseSwap).toHaveBeenCalledWith({
      pairId: 'L-BTC/BTC',
      prepayMinerFee: false,
      orderSide: OrderSide.BUY,
      version: SwapVersion.Taproot,
      onchainAmount: reqBody.onchainAmount,
      preimageHash: getHexBuffer(reqBody.preimageHash),
      claimPublicKey: getHexBuffer(reqBody.claimPublicKey),
    });
  });

  test('should create reverse swaps with address and addressSignature', async () => {
    const reqBody = {
      to: 'L-BTC',
      from: 'BTC',
      address: 'bc1',
      onchainAmount: 123,
      claimPublicKey: '21',
      addressSignature: '0011',
      preimageHash: getHexString(randomBytes(32)),
    };
    const res = mockResponse();

    await swapRouter['createReverse'](mockRequest(reqBody), res);

    expect(service.createReverseSwap).toHaveBeenCalledTimes(1);
    expect(service.createReverseSwap).toHaveBeenCalledWith({
      pairId: 'L-BTC/BTC',
      prepayMinerFee: false,
      orderSide: OrderSide.BUY,
      version: SwapVersion.Taproot,
      userAddress: reqBody.address,
      onchainAmount: reqBody.onchainAmount,
      preimageHash: getHexBuffer(reqBody.preimageHash),
      claimPublicKey: getHexBuffer(reqBody.claimPublicKey),
      userAddressSignature: getHexBuffer(reqBody.addressSignature),
    });
  });

  test('should create reverse swaps with claimCovenant', async () => {
    const reqBody = {
      to: 'L-BTC',
      from: 'BTC',
      address: 'bc1',
      onchainAmount: 123,
      claimCovenant: true,
      claimPublicKey: '21',
      addressSignature: '0011',
      preimageHash: getHexString(randomBytes(32)),
    };
    const res = mockResponse();

    await swapRouter['createReverse'](mockRequest(reqBody), res);

    expect(service.createReverseSwap).toHaveBeenCalledTimes(1);
    expect(service.createReverseSwap).toHaveBeenCalledWith({
      pairId: 'L-BTC/BTC',
      prepayMinerFee: false,
      orderSide: OrderSide.BUY,
      version: SwapVersion.Taproot,
      userAddress: reqBody.address,
      claimCovenant: reqBody.claimCovenant,
      onchainAmount: reqBody.onchainAmount,
      preimageHash: getHexBuffer(reqBody.preimageHash),
      claimPublicKey: getHexBuffer(reqBody.claimPublicKey),
      userAddressSignature: getHexBuffer(reqBody.addressSignature),
    });
  });

  test('should create reverse swaps with description', async () => {
    const reqBody = {
      to: 'L-BTC',
      from: 'BTC',
      address: 'bc1',
      onchainAmount: 123,
      description: 'some text',
      preimageHash: getHexString(randomBytes(32)),
    };
    const res = mockResponse();

    await swapRouter['createReverse'](mockRequest(reqBody), res);

    expect(service.createReverseSwap).toHaveBeenCalledTimes(1);
    expect(service.createReverseSwap).toHaveBeenCalledWith({
      pairId: 'L-BTC/BTC',
      prepayMinerFee: false,
      orderSide: OrderSide.BUY,
      version: SwapVersion.Taproot,
      userAddress: reqBody.address,
      description: reqBody.description,
      onchainAmount: reqBody.onchainAmount,
      preimageHash: getHexBuffer(reqBody.preimageHash),
    });
  });

  test('should get BIP-21 of reverse swaps', async () => {
    const invoice = 'bip21Swap';

    const res = mockResponse();
    await swapRouter['getReverseBip21'](
      mockRequest(undefined, undefined, { invoice }),
      res,
    );

    expect(service.getReverseBip21).toHaveBeenCalledTimes(1);
    expect(service.getReverseBip21).toHaveBeenCalledWith(invoice.toLowerCase());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      bip21: 'bip21',
      signature: 'bip21Sig',
    });
  });

  test('should write 404 when no BIP-21 of reverse swap was set', async () => {
    const invoice = 'noBip21Swap';

    service.getReverseBip21 = jest.fn().mockResolvedValue(undefined);

    const res = mockResponse();
    await swapRouter['getReverseBip21'](
      mockRequest(undefined, undefined, { invoice }),
      res,
    );

    expect(service.getReverseBip21).toHaveBeenCalledTimes(1);
    expect(service.getReverseBip21).toHaveBeenCalledWith(invoice.toLowerCase());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'no BIP-21 for swap',
    });
  });

  test('should get lockup transactions of reverse swaps', async () => {
    const id = 'asdf';

    const res = mockResponse();
    await swapRouter['getReverseTransaction'](
      mockRequest(undefined, undefined, { id }),
      res,
    );

    expect(
      service.transactionFetcher.getReverseSwapTransaction,
    ).toHaveBeenCalledTimes(1);
    expect(
      service.transactionFetcher.getReverseSwapTransaction,
    ).toHaveBeenCalledWith(id);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      id: 'txIdReverse',
      hex: 'txHexReverse',
      timeoutBlockHeight: 42,
    });
  });

  describe('signReverseSwapClaim', () => {
    test.each`
      error                                                                 | body
      ${'undefined parameter: id'}                                          | ${{}}
      ${'undefined parameter: preimage'}                                    | ${{ id: 'someId' }}
      ${'could not parse hex string: preimage'}                             | ${{ id: 'someId', preimage: 'notHex' }}
      ${'pubNonce, index and transaction must be all set or all undefined'} | ${{ id: 'someId', preimage: '21', pubNonce: '0011' }}
      ${'pubNonce, index and transaction must be all set or all undefined'} | ${{ id: 'someId', preimage: '21', index: 0 }}
      ${'pubNonce, index and transaction must be all set or all undefined'} | ${{ id: 'someId', preimage: '21', transaction: '0011' }}
      ${'could not parse hex string: pubNonce'}                             | ${{ id: 'someId', preimage: '21', pubNonce: 'notHex', index: 0, transaction: '0011' }}
      ${'could not parse hex string: transaction'}                          | ${{ id: 'someId', preimage: '21', pubNonce: '0011', index: 0, transaction: 'notHex' }}
      ${'invalid parameter: index'}                                         | ${{ id: 'someId', preimage: '21', pubNonce: '0011', index: 'yo', transaction: '0011' }}
    `(
      'should not claim reverse swaps with invalid parameters ($error)',
      async ({ body, error }) => {
        await expect(
          swapRouter['claimReverse'](mockRequest(body), mockResponse()),
        ).rejects.toEqual(error);
      },
    );

    test('should claim reverse swaps with in params', async () => {
      const reqParams = {
        id: 'someId',
      };
      const reqBody = {
        index: 1,
        pubNonce: '0011',
        preimage: 'aabbcc',
        transaction: '0021',
      };
      const res = mockResponse();

      await swapRouter['claimReverse'](
        mockRequest(reqBody, undefined, reqParams),
        res,
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        pubNonce: '2111',
        partialSignature: '2112',
      });

      expect(service.musigSigner.signReverseSwapClaim).toHaveBeenCalledTimes(1);
      expect(service.musigSigner.signReverseSwapClaim).toHaveBeenCalledWith(
        reqParams.id,
        getHexBuffer(reqBody.preimage),
        {
          index: reqBody.index,
          theirNonce: getHexBuffer(reqBody.pubNonce),
          rawTransaction: getHexBuffer(reqBody.transaction),
        },
      );
    });

    test('should claim reverse swaps with in body', async () => {
      const reqBody = {
        id: 'someId',
        index: 1,
        pubNonce: '0011',
        preimage: 'aabbcc',
        transaction: '0021',
      };
      const res = mockResponse();

      await swapRouter['claimReverse'](mockRequest(reqBody), res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        pubNonce: '2111',
        partialSignature: '2112',
      });

      expect(service.musigSigner.signReverseSwapClaim).toHaveBeenCalledTimes(1);
      expect(service.musigSigner.signReverseSwapClaim).toHaveBeenCalledWith(
        reqBody.id,
        getHexBuffer(reqBody.preimage),
        {
          index: reqBody.index,
          theirNonce: getHexBuffer(reqBody.pubNonce),
          rawTransaction: getHexBuffer(reqBody.transaction),
        },
      );
    });

    test('should claim reverse swaps without transaction', async () => {
      const reqParams = {
        id: 'someId',
      };
      const reqBody = {
        preimage: 'aabbcc',
      };
      const res = mockResponse();

      await swapRouter['claimReverse'](
        mockRequest(reqBody, undefined, reqParams),
        res,
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        pubNonce: '2111',
        partialSignature: '2112',
      });

      expect(service.musigSigner.signReverseSwapClaim).toHaveBeenCalledTimes(1);
      expect(service.musigSigner.signReverseSwapClaim).toHaveBeenCalledWith(
        reqParams.id,
        getHexBuffer(reqBody.preimage),
        undefined,
      );
    });
  });

  test('should get chain swap pairs', async () => {
    const res = mockResponse();
    await swapRouter['getChain'](mockRequest(), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      RateProviderTaproot.serializePairs(
        service.rateProvider.providers[SwapVersion.Taproot].getChainPairs(),
      ),
    );
  });

  test.each`
    error                                            | body
    ${'undefined parameter: to'}                     | ${{}}
    ${'undefined parameter: from'}                   | ${{ to: 'L-BTC' }}
    ${'undefined parameter: preimageHash'}           | ${{ to: 'L-BTC', from: 'BTC' }}
    ${'could not parse hex string: preimageHash'}    | ${{ to: 'L-BTC', from: 'BTC', preimageHash: 'asdf' }}
    ${'invalid preimage hash length: 2'}             | ${{ to: 'L-BTC', from: 'BTC', preimageHash: '0011' }}
    ${'could not parse hex string: claimPublicKey'}  | ${{ claimPublicKey: 'asdf', to: 'L-BTC', from: 'BTC', preimageHash: '32392e7849d736455b18707052e48d9f204d1575ecf979f19ae12919a32c0e4c' }}
    ${'could not parse hex string: refundPublicKey'} | ${{ refundPublicKey: 'asdf', to: 'L-BTC', from: 'BTC', preimageHash: '32392e7849d736455b18707052e48d9f204d1575ecf979f19ae12919a32c0e4c' }}
  `(
    'should not create chain swaps with invalid parameters ($error)',
    async ({ body, error }) => {
      await expect(
        swapRouter['createChain'](mockRequest(body), mockResponse()),
      ).rejects.toEqual(error);
    },
  );

  test('should create chain swaps', async () => {
    const reqBody = {
      to: 'L-BTC',
      from: 'BTC',
      pairHash: 'pHash',
      userLockAmount: 123,
      claimPublicKey: '21',
      referralId: 'partner',
      claimAddress: '0x123',
      serverLockAmount: 321,
      refundPublicKey: '12',
      preimageHash: getHexString(randomBytes(32)),
    };
    const res = mockResponse();

    await swapRouter['createChain'](mockRequest(reqBody), res);

    expect(service.convertToPairAndSide).toHaveBeenCalledTimes(1);
    expect(service.convertToPairAndSide).toHaveBeenCalledWith(
      reqBody.from,
      reqBody.to,
    );

    expect(service.createChainSwap).toHaveBeenCalledTimes(1);
    expect(service.createChainSwap).toHaveBeenCalledWith({
      pairId: 'L-BTC/BTC',
      orderSide: OrderSide.BUY,
      pairHash: reqBody.pairHash,
      referralId: reqBody.referralId,
      claimAddress: reqBody.claimAddress,
      userLockAmount: reqBody.userLockAmount,
      serverLockAmount: reqBody.serverLockAmount,
      preimageHash: getHexBuffer(reqBody.preimageHash),
      claimPublicKey: getHexBuffer(reqBody.claimPublicKey),
      refundPublicKey: getHexBuffer(reqBody.refundPublicKey),
    });

    expect(MarkedSwapRepository.addMarkedSwap).toHaveBeenCalledTimes(1);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 'chainId' });
  });

  test('should create chain swaps with webhook', async () => {
    const reqBody = {
      to: 'L-BTC',
      from: 'BTC',
      pairHash: 'pHash',
      userLockAmount: 123,
      claimPublicKey: '21',
      referralId: 'partner',
      claimAddress: '0x123',
      serverLockAmount: 321,
      refundPublicKey: '12',
      preimageHash: getHexString(randomBytes(32)),
      webhook: {
        url: 'test',
        hashSwapId: false,
      },
    };
    const res = mockResponse();

    await swapRouter['createChain'](mockRequest(reqBody), res);

    expect(service.createChainSwap).toHaveBeenCalledTimes(1);
    expect(service.createChainSwap).toHaveBeenCalledWith({
      pairId: 'L-BTC/BTC',
      orderSide: OrderSide.BUY,
      webHook: reqBody.webhook,
      pairHash: reqBody.pairHash,
      referralId: reqBody.referralId,
      claimAddress: reqBody.claimAddress,
      userLockAmount: reqBody.userLockAmount,
      serverLockAmount: reqBody.serverLockAmount,
      preimageHash: getHexBuffer(reqBody.preimageHash),
      claimPublicKey: getHexBuffer(reqBody.claimPublicKey),
      refundPublicKey: getHexBuffer(reqBody.refundPublicKey),
    });
  });

  test('should 404 when getting transactions of chain swap that does not exist', async () => {
    ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue(null);

    const id = 'notFound';

    const res = mockResponse();
    await swapRouter['getChainSwapTransactions'](
      mockRequest(null, {}, { id }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: Errors.SWAP_NOT_FOUND(id).message,
    });

    expect(ChainSwapRepository.getChainSwap).toHaveBeenCalledWith({ id });
  });

  test('should get transactions of chain swaps', async () => {
    const chainSwap = { id: 'yo' };
    ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue(chainSwap);

    const res = mockResponse();
    await swapRouter['getChainSwapTransactions'](
      mockRequest(null, {}, { id: chainSwap.id }),
      res,
    );

    expect(ChainSwapRepository.getChainSwap).toHaveBeenCalledWith({
      id: chainSwap.id,
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      await service.transactionFetcher.getChainSwapTransactions(
        chainSwap as any,
      ),
    );
  });

  test('should 404 when getting claim details of chain swap that does not exist', async () => {
    ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue(null);

    const id = 'notFound';

    const res = mockResponse();
    await swapRouter['getChainSwapClaimDetails'](
      mockRequest(null, {}, { id }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: Errors.SWAP_NOT_FOUND(id).message,
    });

    expect(ChainSwapRepository.getChainSwap).toHaveBeenCalledWith({ id });
  });

  test('should get claim details of chain swaps', async () => {
    const chainSwap = { id: 'yo' };
    ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue(chainSwap);

    const res = mockResponse();
    await swapRouter['getChainSwapClaimDetails'](
      mockRequest(null, {}, { id: chainSwap.id }),
      res,
    );

    expect(ChainSwapRepository.getChainSwap).toHaveBeenCalledWith({
      id: chainSwap.id,
    });
    expect(
      service.swapManager.chainSwapSigner.getCooperativeDetails,
    ).toHaveBeenCalledWith(chainSwap);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      pubNonce: '00',
      publicKey: '01',
      transactionHash: '02',
    });
  });

  test.each`
    error                                      | params            | body
    ${'undefined parameter: id'}               | ${{}}             | ${{}}
    ${'undefined parameter: index'}            | ${{ id: 'some' }} | ${{ toSign: {} }}
    ${'undefined parameter: pubNonce'}         | ${{ id: 'some' }} | ${{ toSign: { index: 0 } }}
    ${'undefined parameter: transaction'}      | ${{ id: 'some' }} | ${{ toSign: { index: 0, pubNonce: '00' } }}
    ${'could not parse hex string: preimage'}  | ${{ id: 'some' }} | ${{ preimage: 'notHex', toSign: { index: 0, pubNonce: '00', transaction: '01' } }}
    ${'undefined parameter: pubNonce'}         | ${{ id: 'some' }} | ${{ signature: {}, toSign: { index: 0, pubNonce: '00', transaction: '01' } }}
    ${'undefined parameter: partialSignature'} | ${{ id: 'some' }} | ${{ signature: { pubNonce: '02' }, toSign: { index: 0, pubNonce: '00', transaction: '01' } }}
  `(
    'should not claim chain swaps with invalid parameters ($error)',
    async ({ params, body, error }) => {
      await expect(
        swapRouter['claimChainSwap'](
          mockRequest(body, {}, params),
          mockResponse(),
        ),
      ).rejects.toEqual(error);
    },
  );

  test('should 404 when claiming chain swap that does not exist', async () => {
    ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue(null);

    const id = 'notFound';

    const res = mockResponse();
    await swapRouter['claimChainSwap'](
      mockRequest(
        {
          toSign: {
            index: 1,
            pubNonce: '02',
            transaction: '01',
          },
        },
        {},
        { id },
      ),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: Errors.SWAP_NOT_FOUND(id).message,
    });

    expect(ChainSwapRepository.getChainSwap).toHaveBeenCalledWith({ id });
  });

  test('should claim chain swaps', async () => {
    const chainSwap = { id: '123', some: 'data' };
    ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue(chainSwap);

    const reqBody = {
      preimage: '123321',
      toSign: {
        index: 21,
        pubNonce: '21',
        transaction: '42',
      },
      signature: {
        pubNonce: '98',
        partialSignature: '9800',
      },
    };

    const res = mockResponse();
    await swapRouter['claimChainSwap'](
      mockRequest(reqBody, {}, { id: chainSwap.id }),
      res,
    );

    expect(service.swapManager.chainSwapSigner.signClaim).toHaveBeenCalledWith(
      chainSwap,
      {
        index: reqBody.toSign.index,
        pubNonce: getHexBuffer(reqBody.toSign.pubNonce),
        transaction: getHexBuffer(reqBody.toSign.transaction),
      },
      getHexBuffer(reqBody.preimage),
      {
        pubNonce: getHexBuffer(reqBody.signature.pubNonce),
        signature: getHexBuffer(reqBody.signature.partialSignature),
      },
    );
  });

  describe('Chain Swap renegotiation', () => {
    describe('get quotes', () => {
      test('should return error when no id was set', async () => {
        const res = mockResponse();
        await expect(
          swapRouter['chainSwapQuote'](mockRequest(null, undefined, {}), res),
        ).rejects.toEqual('undefined parameter: id');
      });

      test('should get new quote', async () => {
        const id = 'yo';
        const amount = 321;

        service.swapManager.renegotiator.getQuote = jest
          .fn()
          .mockResolvedValue(amount);

        const res = mockResponse();
        await swapRouter['chainSwapQuote'](
          mockRequest(null, undefined, {
            id,
          }),
          res,
        );

        expect(service.swapManager.renegotiator.getQuote).toHaveBeenCalledTimes(
          1,
        );
        expect(service.swapManager.renegotiator.getQuote).toHaveBeenCalledWith(
          id,
        );

        expect(res.status).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(200);

        expect(res.json).toHaveBeenCalledTimes(1);
        expect(res.json).toHaveBeenCalledWith({ amount });
      });
    });

    describe('accept quotes', () => {
      test.each`
        params          | body                 | error
        ${{}}           | ${{}}                | ${'undefined parameter: id'}
        ${{ id: 1 }}    | ${{}}                | ${'invalid parameter: id'}
        ${{ id: 'id' }} | ${{}}                | ${'undefined parameter: amount'}
        ${{ id: 'id' }} | ${{ amount: '321' }} | ${'invalid parameter: amount'}
      `(
        'should return error for invalid params',
        async ({ params, body, error }) => {
          const res = mockResponse();
          await expect(
            swapRouter['chainSwapAcceptQuote'](
              mockRequest(body, undefined, params),
              res,
            ),
          ).rejects.toEqual(error);
        },
      );

      test('should accept new quotes', async () => {
        const id = 'yo';
        const amount = 321;

        service.swapManager.renegotiator.acceptQuote = jest
          .fn()
          .mockImplementation(async () => {});

        const res = mockResponse();
        await swapRouter['chainSwapAcceptQuote'](
          mockRequest({ amount }, undefined, {
            id,
          }),
          res,
        );

        expect(
          service.swapManager.renegotiator.acceptQuote,
        ).toHaveBeenCalledTimes(1);
        expect(
          service.swapManager.renegotiator.acceptQuote,
        ).toHaveBeenCalledWith(id, amount);

        expect(res.status).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(202);

        expect(res.json).toHaveBeenCalledTimes(1);
        expect(res.json).toHaveBeenCalledWith({});
      });
    });
  });

  describe('parseWebHook', () => {
    test('should parse webhook', () => {
      const data = {
        url: 'asdf',
        hashSwapId: false,
      };

      expect(swapRouter['parseWebHook'](data)).toEqual(data);
    });

    test.each`
      error                              | data
      ${'undefined parameter: url'}      | ${{}}
      ${'invalid parameter: url'}        | ${{ url: 1 }}
      ${'invalid parameter: status'}     | ${{ url: 'http', status: 'correct' }}
      ${'invalid parameter: hashSwapId'} | ${{ url: 'http', hashSwapId: 'correct' }}
    `(
      'should not parse webhook with invalid parameters ($error)',
      ({ error, data }) => {
        expect(() => swapRouter['parseWebHook'](data)).toThrow(error);
      },
    );

    describe('status', () => {
      test.each`
        data
        ${{}}
        ${'status'}
        ${Array.from({ length: 22 }, () => 'something')}
      `('should validate array', ({ data }) => {
        expect(() =>
          swapRouter['parseWebHook']({
            url: 'https://some.domain',
            status: data,
          }),
        ).toThrow(ApiErrors.INVALID_PARAMETER('status'));
      });

      test('should throw when entries that are not a known swap status are provided', () => {
        const status = ['invoice.set', 'not.valid'];
        expect(() =>
          swapRouter['parseWebHook']({
            status,
            url: 'https://some.domain',
          }),
        ).toThrow(ApiErrors.INVALID_SWAP_STATUS(status[1]));
      });

      test('should validate status', () => {
        const data = {
          url: 'asdf',
          hashSwapId: false,
          status: ['transaction.confirmed'],
        };

        expect(swapRouter['parseWebHook'](data)).toEqual(data);
      });
    });
  });

  describe('getReferralFromHeader', () => {
    test('should query referral from header', async () => {
      const referral = {
        ref: 'id',
      };
      ReferralRepository.getReferralById = jest
        .fn()
        .mockResolvedValue(referral);

      const req = mockRequest();
      req.header = jest.fn().mockReturnValue('id');
      await expect(swapRouter['getReferralFromHeader'](req)).resolves.toEqual(
        referral,
      );

      expect(req.header).toHaveBeenCalledWith('referral');
      expect(ReferralRepository.getReferralById).toHaveBeenCalledWith('id');
    });

    test('should not query referral when header is not set', async () => {
      ReferralRepository.getReferralById = jest.fn().mockResolvedValue({});

      await expect(
        swapRouter['getReferralFromHeader'](mockRequest()),
      ).resolves.toEqual(null);

      expect(ReferralRepository.getReferralById).not.toHaveBeenCalled();
    });
  });
});
