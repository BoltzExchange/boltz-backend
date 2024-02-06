import { randomBytes } from 'crypto';
import { Router } from 'express';
import Logger from '../../../../../lib/Logger';
import { getHexBuffer, getHexString } from '../../../../../lib/Utils';
import Controller from '../../../../../lib/api/Controller';
import SwapRouter from '../../../../../lib/api/v2/routers/SwapRouter';
import { OrderSide, SwapVersion } from '../../../../../lib/consts/Enums';
import MarkedSwapRepository from '../../../../../lib/db/repositories/MarkedSwapRepository';
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
          submarinePairs: new Map<string, Map<string, any>>([
            [
              'L-BTC',
              new Map<string, any>([['BTC', { some: 'submarine data' }]]),
            ],
          ]),
          reversePairs: new Map<string, Map<string, any>>([
            [
              'BTC',
              new Map<string, any>([['L-BTC', { some: 'reverse data' }]]),
            ],
          ]),
        },
      },
    },

    musigSigner: {
      signSwapRefund: jest.fn().mockResolvedValue({
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
    },

    convertToPairAndSide: jest
      .fn()
      .mockReturnValue({ pairId: 'L-BTC/BTC', orderSide: OrderSide.BUY }),
    createSwap: jest.fn().mockResolvedValue({ id: 'randomIdPreimageHash' }),
    createSwapWithInvoice: jest.fn().mockResolvedValue({ id: 'randomId' }),
    createReverseSwap: jest.fn().mockResolvedValue({ id: 'reverseId' }),
    getSwapTransaction: jest.fn().mockResolvedValue({
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
  } as unknown as Service;

  const controller = {
    pendingSwapInfos: new Map([['swapId', { some: 'statusData' }]]),
  } as unknown as Controller;

  const countryCodes = {
    isRelevantCountry: jest.fn().mockReturnValue(true),
    getCountryCode: jest.fn().mockReturnValue('TOR'),
  } as unknown as CountryCodes;

  const swapRouter = new SwapRouter(
    Logger.disabledLogger,
    service,
    controller,
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

    expect(mockedRouter.get).toHaveBeenCalledTimes(7);
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
      '/submarine/:id/claim',
      expect.anything(),
    );
    expect(mockedRouter.get).toHaveBeenCalledWith(
      '/reverse',
      expect.anything(),
    );
    expect(mockedRouter.get).toHaveBeenCalledWith(
      '/reverse/:id/transaction',
      expect.anything(),
    );

    expect(mockedRouter.post).toHaveBeenCalledTimes(6);
    expect(mockedRouter.post).toHaveBeenCalledWith(
      '/submarine',
      expect.anything(),
    );
    expect(mockedRouter.post).toHaveBeenCalledWith(
      '/submarine/refund',
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
  });

  test.each`
    error                        | params
    ${'undefined parameter: id'} | ${{}}
    ${'invalid parameter: id'}   | ${{ id: 1 }}
  `(
    'should not get status of swaps with invalid parameters ($error)',
    ({ params, error }) => {
      expect(() =>
        swapRouter['getSwapStatus'](
          mockRequest(undefined, undefined, params),
          mockResponse(),
        ),
      ).toThrow(error);
    },
  );

  test('should get status of swaps', () => {
    const id = 'swapId';

    const res = mockResponse();
    swapRouter['getSwapStatus'](mockRequest(undefined, undefined, { id }), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(controller.pendingSwapInfos.get(id));
  });

  test('should return 404 as status when swap id cannot be found', () => {
    const id = 'notFound';

    const res = mockResponse();
    swapRouter['getSwapStatus'](mockRequest(undefined, undefined, { id }), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: `could not find swap with id: ${id}`,
    });
  });

  test('should get submarine pairs', () => {
    const res = mockResponse();
    swapRouter['getSubmarine'](mockRequest(), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      RateProviderTaproot.serializePairs(
        service.rateProvider.providers[SwapVersion.Taproot].submarinePairs,
      ),
    );
  });

  test.each`
    error                                            | body
    ${'undefined parameter: to'}                     | ${{}}
    ${'undefined parameter: from'}                   | ${{ to: 'BTC' }}
    ${'undefined parameter: refundPublicKey'}        | ${{ to: 'BTC', from: 'L-BTC', invoice: 'lnbc1' }}
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
    );

    expect(MarkedSwapRepository.addMarkedSwap).toHaveBeenCalledTimes(1);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 'randomId' });
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

    expect(service.getSwapTransaction).toHaveBeenCalledTimes(1);
    expect(service.getSwapTransaction).toHaveBeenCalledWith(id);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      id: 'txId',
      hex: 'txHex',
      timeoutBlockHeight: 21,
      timeoutEta: 210987,
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
        swapRouter['refundSubmarine'](mockRequest(body), mockResponse()),
      ).rejects.toEqual(error);
    },
  );

  test('should refund submarine swaps', async () => {
    const reqBody = {
      id: 'someId',
      index: 1,
      pubNonce: '0011',
      transaction: '0021',
    };
    const res = mockResponse();

    await swapRouter['refundSubmarine'](mockRequest(reqBody), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      pubNonce: '1111',
      partialSignature: '1112',
    });

    expect(service.musigSigner.signSwapRefund).toHaveBeenCalledTimes(1);
    expect(service.musigSigner.signSwapRefund).toHaveBeenCalledWith(
      reqBody.id,
      getHexBuffer(reqBody.pubNonce),
      getHexBuffer(reqBody.transaction),
      reqBody.index,
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

  test('should get reverse pairs', () => {
    const res = mockResponse();
    swapRouter['getReverse'](mockRequest(), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      RateProviderTaproot.serializePairs(
        service.rateProvider.providers[SwapVersion.Taproot].reversePairs,
      ),
    );
  });

  test.each`
    error                                           | body
    ${'undefined parameter: to'}                    | ${{}}
    ${'undefined parameter: from'}                  | ${{ to: 'L-BTC' }}
    ${'undefined parameter: preimageHash'}          | ${{ to: 'L-BTC', from: 'BTC' }}
    ${'could not parse hex string: preimageHash'}   | ${{ to: 'L-BTC', from: 'BTC', preimageHash: 'notHex' }}
    ${'undefined parameter: claimPublicKey'}        | ${{ to: 'L-BTC', from: 'BTC', preimageHash: '00' }}
    ${'could not parse hex string: claimPublicKey'} | ${{ to: 'L-BTC', from: 'BTC', preimageHash: '00', claimPublicKey: 'notHex' }}
    ${'could not parse hex string: claimPublicKey'} | ${{ to: 'L-BTC', from: 'BTC', preimageHash: '00', claimPublicKey: 'notHex' }}
  `(
    'should not create reverse swaps with invalid parameters ($error)',
    async ({ body, error }) => {
      await expect(
        swapRouter['createReverse'](mockRequest(body), mockResponse()),
      ).rejects.toEqual(error);
    },
  );

  test.each([1, 2, 3, 21, 31, 33, 64])(
    'should not create reverse swaps preimage hash length != 32',
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

  test('should get lockup transactions of reverse swaps', async () => {
    const id = 'asdf';

    const res = mockResponse();
    await swapRouter['getReverseTransaction'](
      mockRequest(undefined, undefined, { id }),
      res,
    );

    expect(service.getReverseSwapTransaction).toHaveBeenCalledTimes(1);
    expect(service.getReverseSwapTransaction).toHaveBeenCalledWith(id);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      id: 'txIdReverse',
      hex: 'txHexReverse',
      timeoutBlockHeight: 42,
    });
  });

  test.each`
    error                                        | body
    ${'undefined parameter: id'}                 | ${{}}
    ${'undefined parameter: index'}              | ${{ id: 'someId' }}
    ${'invalid parameter: index'}                | ${{ id: 'someId', index: 'yo' }}
    ${'undefined parameter: preimage'}           | ${{ id: 'someId', index: 0 }}
    ${'could not parse hex string: preimage'}    | ${{ id: 'someId', index: 0, preimage: 'notHex' }}
    ${'undefined parameter: pubNonce'}           | ${{ id: 'someId', index: 0, preimage: '21' }}
    ${'could not parse hex string: pubNonce'}    | ${{ id: 'someId', index: 0, preimage: '21', pubNonce: 'notHex' }}
    ${'undefined parameter: transaction'}        | ${{ id: 'someId', index: 0, preimage: '21', pubNonce: '0011' }}
    ${'could not parse hex string: transaction'} | ${{ id: 'someId', index: 0, preimage: '21', pubNonce: '0011', transaction: 'notHex' }}
  `(
    'should not claim reverse swaps with invalid parameters ($error)',
    async ({ body, error }) => {
      await expect(
        swapRouter['claimReverse'](mockRequest(body), mockResponse()),
      ).rejects.toEqual(error);
    },
  );

  test('should claim reverse swaps', async () => {
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
      getHexBuffer(reqBody.pubNonce),
      getHexBuffer(reqBody.transaction),
      reqBody.index,
    );
  });
});
