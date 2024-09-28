import { Router } from 'express';
import Logger from '../../../../../lib/Logger';
import LightningRouter from '../../../../../lib/api/v2/routers/LightningRouter';
import Sidecar from '../../../../../lib/sidecar/Sidecar';
import { mockRequest, mockResponse } from '../../Utils';

const mockedRouter = {
  post: jest.fn(),
};

jest.mock('express', () => {
  return {
    Router: jest.fn().mockImplementation(() => mockedRouter),
  };
});

describe('LightningRouter', () => {
  const sidecar = {
    fetchOffer: jest.fn().mockResolvedValue('bolt12'),
  } as unknown as Sidecar;

  const lightningRouter = new LightningRouter(Logger.disabledLogger, sidecar);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should get route prefix', () => {
    expect(lightningRouter.path).toEqual('lightning');
  });

  test('should get router', () => {
    const router = lightningRouter.getRouter();
    expect(router).not.toBeUndefined();

    expect(Router).toHaveBeenCalledTimes(1);
    expect(mockedRouter.post).toHaveBeenCalledTimes(1);
    expect(mockedRouter.post).toHaveBeenCalledWith(
      '/:currency/bolt12/fetch',
      expect.anything(),
    );
  });

  test('should fetch Bolt12 invoices', async () => {
    const res = mockResponse();

    const body = {
      offer: 'offer',
      amount: 10_000,
    };

    await lightningRouter['fetchBolt12'](
      mockRequest(body, undefined, {
        currency: 'BTC',
      }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ invoice: 'bolt12' });

    expect(sidecar.fetchOffer).toHaveBeenCalledTimes(1);
    expect(sidecar.fetchOffer).toHaveBeenCalledWith(
      'BTC',
      body.offer,
      body.amount,
    );
  });
});
