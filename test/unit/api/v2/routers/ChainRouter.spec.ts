import { Router } from 'express';
import Logger from '../../../../../lib/Logger';
import { mapToObject } from '../../../../../lib/Utils';
import ChainRouter from '../../../../../lib/api/v2/routers/ChainRouter';
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

describe('ChainRouter', () => {
  const service = {
    getTransaction: jest.fn().mockResolvedValue('txHex'),
    broadcastTransaction: jest.fn().mockResolvedValue('txId'),
    getFeeEstimation: jest
      .fn()
      .mockImplementation(async (currency?: string) => {
        if (currency) {
          return new Map([['BTC', 42]]);
        }
        return new Map([
          ['BTC', 21],
          ['L-BTC', 0.11],
          ['RBTC', 23.121212312],
        ]);
      }),
    getBlockHeights: jest.fn().mockImplementation(async (currency?: string) => {
      if (currency) {
        return new Map([['BTC', 210_00]]);
      }

      return new Map([
        ['BTC', 210_00],
        ['L-BTC', 2_100_000],
        ['RBTC', 5_000_000],
      ]);
    }),
  } as unknown as Service;

  const chainRouter = new ChainRouter(Logger.disabledLogger, service);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should get route prefix', () => {
    expect(chainRouter.path).toEqual('chain');
  });

  test('should get router', () => {
    const router = chainRouter.getRouter();
    expect(router).not.toBeUndefined();

    expect(Router).toHaveBeenCalledTimes(1);

    expect(mockedRouter.get).toHaveBeenCalledTimes(5);
    expect(mockedRouter.get).toHaveBeenCalledWith('/fees', expect.anything());
    expect(mockedRouter.get).toHaveBeenCalledWith(
      '/heights',
      expect.anything(),
    );
    expect(mockedRouter.get).toHaveBeenCalledWith(
      '/:currency/fee',
      expect.anything(),
    );
    expect(mockedRouter.get).toHaveBeenCalledWith(
      '/:currency/height',
      expect.anything(),
    );
    expect(mockedRouter.get).toHaveBeenCalledWith(
      '/:currency/transaction/:id',
      expect.anything(),
    );

    expect(mockedRouter.post).toHaveBeenCalledTimes(1);
    expect(mockedRouter.post).toHaveBeenCalledWith(
      '/:currency/transaction',
      expect.anything(),
    );
  });

  test('should get fee estimations', async () => {
    const res = mockResponse();
    await chainRouter['getFees'](mockRequest(), res);

    expect(service.getFeeEstimation).toHaveBeenCalledTimes(1);
    expect(service.getFeeEstimation).toHaveBeenCalledWith();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      mapToObject(await service.getFeeEstimation()),
    );
  });

  test('should get block heights', async () => {
    const res = mockResponse();
    await chainRouter['getHeights'](mockRequest(), res);

    expect(service.getBlockHeights).toHaveBeenCalledTimes(1);
    expect(service.getBlockHeights).toHaveBeenCalledWith();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      mapToObject(await service.getBlockHeights()),
    );
  });

  test('should get fee estimation for chain', async () => {
    const currency = 'BTC';

    const res = mockResponse();
    await chainRouter['getFeeForChain'](
      mockRequest(undefined, undefined, {
        currency,
      }),
      res,
    );

    expect(service.getFeeEstimation).toHaveBeenCalledTimes(1);
    expect(service.getFeeEstimation).toHaveBeenCalledWith(currency);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      fee: (await service.getFeeEstimation(currency)).get(currency),
    });
  });

  test('should get block height for chain', async () => {
    const currency = 'BTC';

    const res = mockResponse();
    await chainRouter['getHeightForChain'](
      mockRequest(undefined, undefined, {
        currency,
      }),
      res,
    );

    expect(service.getBlockHeights).toHaveBeenCalledTimes(1);
    expect(service.getBlockHeights).toHaveBeenCalledWith(currency);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      height: (await service.getBlockHeights(currency)).get(currency),
    });
  });

  test('should get transaction', async () => {
    const currency = 'BTC';
    const id = '1234567890';

    const res = mockResponse();
    await chainRouter['getTransaction'](
      mockRequest(undefined, undefined, {
        id,
        currency,
      }),
      res,
    );

    expect(service.getTransaction).toHaveBeenCalledTimes(1);
    expect(service.getTransaction).toHaveBeenCalledWith(currency, id);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      hex: await service.getTransaction(currency, id),
    });
  });

  test('should broadcast transaction', async () => {
    const currency = 'BTC';
    const hex = 'rawTx';

    const res = mockResponse();
    await chainRouter['postTransaction'](
      mockRequest({ hex }, undefined, {
        currency,
      }),
      res,
    );

    expect(service.broadcastTransaction).toHaveBeenCalledTimes(1);
    expect(service.broadcastTransaction).toHaveBeenCalledWith(currency, hex);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      id: await service.broadcastTransaction(currency, hex),
    });
  });

  test.each`
    error                              | params
    ${'undefined parameter: currency'} | ${{}}
    ${'invalid parameter: currency'}   | ${{ currency: 1 }}
    ${'invalid parameter: currency'}   | ${{ currency: { some: 'data' } }}
  `(
    'should throw when extracting currency from path with invalid parameters ($error)',
    ({ params, error }) => {
      expect(() =>
        chainRouter['getCurrencyFromPath'](
          mockRequest(undefined, undefined, params),
        ),
      ).toThrow(error);
    },
  );

  test('should extract currency from path', () => {
    const currency = 'BTC';
    expect(
      chainRouter['getCurrencyFromPath'](
        mockRequest(undefined, undefined, { currency }),
      ),
    ).toEqual(currency);
  });
});
