import { Router } from 'express';
import Logger from '../../../../../lib/Logger';
import Bouncer from '../../../../../lib/api/Bouncer';
import ReferralRouter from '../../../../../lib/api/v2/routers/ReferralRouter';
import ReferralStats from '../../../../../lib/data/ReferralStats';
import Stats from '../../../../../lib/data/Stats';
import ExtraFeeRepository from '../../../../../lib/db/repositories/ExtraFeeRepository';
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

    expect(mockedRouter.get).toHaveBeenCalledTimes(4);
    expect(mockedRouter.get).toHaveBeenCalledWith('/', expect.anything());
    expect(mockedRouter.get).toHaveBeenCalledWith('/fees', expect.anything());
    expect(mockedRouter.get).toHaveBeenCalledWith('/stats', expect.anything());
    expect(mockedRouter.get).toHaveBeenCalledWith(
      '/stats/extra',
      expect.anything(),
    );
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
    const mockExtraStats = [
      {
        year: '2024',
        month: '1',
        id: 'test',
        pair: 'BTC/BTC',
        swap_count: 10,
        volume: '1000000',
        failure_rate_submarine: 0.1,
        failure_rate_reverse: 0.05,
        failure_rate_chain: 0.02,
      },
    ];

    ExtraFeeRepository.getStatsByReferral = jest
      .fn()
      .mockResolvedValue(mockExtraStats);
    ExtraFeeRepository.mergeStats = jest.fn().mockReturnValue({
      2024: {
        1: {
          merged: 'data',
        },
      },
    });

    mockValidateAuthResult = { id: 'partner', other: 'data' };

    const res = mockResponse();
    await referralRouter['getStats'](mockRequest(), res);

    expect(Stats.generate).toHaveBeenCalledTimes(1);
    expect(Stats.generate).toHaveBeenCalledWith(
      0,
      0,
      mockValidateAuthResult.id,
    );
    expect(ExtraFeeRepository.getStatsByReferral).toHaveBeenCalledTimes(1);
    expect(ExtraFeeRepository.getStatsByReferral).toHaveBeenCalledWith(
      mockValidateAuthResult.id,
    );

    // Should merge results
    expect(ExtraFeeRepository.mergeStats).toHaveBeenCalledTimes(1);
    expect(ExtraFeeRepository.mergeStats).toHaveBeenCalledWith(
      await Stats.generate(0, 0, ''),
      mockExtraStats,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      2024: {
        1: {
          merged: 'data',
        },
      },
    });
  });

  test('should get extra fees of referral id', async () => {
    ExtraFeeRepository.getFeesByReferral = jest.fn().mockResolvedValue({
      some: 'data',
    });

    mockValidateAuthResult = { id: 'partner', other: 'data' };

    const res = mockResponse();
    await referralRouter['getExtraFees'](mockRequest(), res);

    expect(ExtraFeeRepository.getFeesByReferral).toHaveBeenCalledTimes(1);
    expect(ExtraFeeRepository.getFeesByReferral).toHaveBeenCalledWith(
      mockValidateAuthResult.id,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      await ExtraFeeRepository.getFeesByReferral(''),
    );
  });

  test('should handle errors in stats generation', async () => {
    const statsError = new Error('Stats generation failed');
    Stats.generate = jest.fn().mockRejectedValue(statsError);
    ExtraFeeRepository.getStatsByReferral = jest.fn().mockResolvedValue([]);

    mockValidateAuthResult = { id: 'partner', other: 'data' };

    const res = mockResponse();

    await expect(
      referralRouter['getStats'](mockRequest(), res),
    ).rejects.toThrow('Stats generation failed');

    expect(Stats.generate).toHaveBeenCalledTimes(1);
    expect(ExtraFeeRepository.getStatsByReferral).toHaveBeenCalledTimes(1);
  });

  test('should handle errors in extra stats generation', async () => {
    const extraStatsError = new Error('Extra stats generation failed');
    Stats.generate = jest.fn().mockResolvedValue({});
    ExtraFeeRepository.getStatsByReferral = jest
      .fn()
      .mockRejectedValue(extraStatsError);

    mockValidateAuthResult = { id: 'partner', other: 'data' };

    const res = mockResponse();

    await expect(
      referralRouter['getStats'](mockRequest(), res),
    ).rejects.toThrow('Extra stats generation failed');

    expect(Stats.generate).toHaveBeenCalledTimes(1);
    expect(ExtraFeeRepository.getStatsByReferral).toHaveBeenCalledTimes(1);
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
