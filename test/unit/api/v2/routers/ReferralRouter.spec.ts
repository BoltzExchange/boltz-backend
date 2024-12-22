import { Router } from 'express';
import Logger from '../../../../../lib/Logger';
import Bouncer from '../../../../../lib/api/Bouncer';
import ReferralRouter from '../../../../../lib/api/v2/routers/ReferralRouter';
import ReferralStats from '../../../../../lib/data/ReferralStats';
import Stats from '../../../../../lib/data/Stats';
import { mockRequest, mockResponse } from '../../Utils';

const mockedRouter = {
  get: jest.fn(),
};

jest.mock('express', () => {
  return {
    Router: jest.fn().mockImplementation(() => mockedRouter),
  };
});

ReferralStats.getReferralFees = jest.fn().mockResolvedValue({
  2024: {
    1: {
      some: 'data',
    },
  },
});

Stats.generate = jest.fn().mockResolvedValue({
  2023: {
    2: {
      stats: 'up only',
    },
  },
});

let mockValidateAuthResult: any = null;
Bouncer.validateRequestAuthentication = jest.fn().mockImplementation(() => {
  if (mockValidateAuthResult === null) {
    throw 'unauthorized';
  } else {
    return mockValidateAuthResult;
  }
});

describe('ReferralRouter', () => {
  const referralRouter = new ReferralRouter(Logger.disabledLogger);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should get route prefix', () => {
    expect(referralRouter.path).toEqual('referral');
  });

  test('should get router', () => {
    const router = referralRouter.getRouter();
    expect(router).not.toBeUndefined();

    expect(Router).toHaveBeenCalledTimes(1);

    expect(mockedRouter.get).toHaveBeenCalledTimes(3);
    expect(mockedRouter.get).toHaveBeenCalledWith('/', expect.anything());
    expect(mockedRouter.get).toHaveBeenCalledWith('/fees', expect.anything());
    expect(mockedRouter.get).toHaveBeenCalledWith('/stats', expect.anything());
  });

  test('should get name of referral id', async () => {
    mockValidateAuthResult = { id: 'partner', other: 'data' };

    const res = mockResponse();
    await referralRouter['getName'](mockRequest(), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ id: mockValidateAuthResult.id });
  });

  test('should get fees of referral id', async () => {
    mockValidateAuthResult = { id: 'partner', other: 'data' };

    const res = mockResponse();
    await referralRouter['getFees'](mockRequest(), res);

    expect(ReferralStats.getReferralFees).toHaveBeenCalledTimes(1);
    expect(ReferralStats.getReferralFees).toHaveBeenCalledWith(
      mockValidateAuthResult.id,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      await ReferralStats.getReferralFees(''),
    );
  });

  test('should get stats of referral id', async () => {
    mockValidateAuthResult = { id: 'partner', other: 'data' };

    const res = mockResponse();
    await referralRouter['getStats'](mockRequest(), res);

    expect(Stats.generate).toHaveBeenCalledTimes(1);
    expect(Stats.generate).toHaveBeenCalledWith(
      0,
      0,
      mockValidateAuthResult.id,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(await Stats.generate(0, 0, ''));
  });

  test.each`
    name       | func
    ${'name'}  | ${'getName'}
    ${'fees'}  | ${'getFees'}
    ${'stats'} | ${'getStats'}
  `(
    'should not get $name of referral id with invalid auth',
    async ({ func }) => {
      mockValidateAuthResult = null;

      const res = mockResponse();
      await referralRouter[func](mockRequest(), res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'unauthorized' });
    },
  );

  test('should return referral with valid authentication', async () => {
    mockValidateAuthResult = {
      some: 'data',
    };

    const req = mockRequest();
    const res = mockResponse();
    const referral = await referralRouter['checkAuthentication'](req, res);
    expect(referral).toEqual(mockValidateAuthResult);

    expect(Bouncer.validateRequestAuthentication).toHaveBeenCalledWith(req);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  test('should write error response with invalid authentication', async () => {
    mockValidateAuthResult = null;

    const req = mockRequest();
    const res = mockResponse();
    await referralRouter['checkAuthentication'](req, res);

    expect(Bouncer.validateRequestAuthentication).toHaveBeenCalledWith(req);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'unauthorized' });
  });
});
