import { Router } from 'express';
import Logger from '../../../../lib/Logger';
import ApiV2 from '../../../../lib/api/v2/ApiV2';
import { apiPrefix } from '../../../../lib/api/v2/Consts';

const mockNodesGetRouter = jest.fn().mockReturnValue(Router());

jest.mock('../../../../lib/api/v2/routers/NodesRouter', () => {
  return jest.fn().mockImplementation(() => {
    return {
      path: 'nodes',
      getRouter: mockNodesGetRouter,
    };
  });
});

const mockSwapGetRouter = jest.fn().mockReturnValue(Router());

jest.mock('../../../../lib/api/v2/routers/SwapRouter', () => {
  return jest.fn().mockImplementation(() => {
    return {
      path: 'swap',
      getRouter: mockSwapGetRouter,
    };
  });
});

const mockGetInfoRouter = jest.fn().mockReturnValue(Router());

jest.mock('../../../../lib/api/v2/routers/InfoRouter', () => {
  return jest.fn().mockImplementation(() => {
    return {
      path: '',
      getRouter: mockGetInfoRouter,
    };
  });
});

const mockGetChainRouter = jest.fn().mockReturnValue(Router());

jest.mock('../../../../lib/api/v2/routers/ChainRouter', () => {
  return jest.fn().mockImplementation(() => {
    return {
      path: 'chain',
      getRouter: mockGetChainRouter,
    };
  });
});

const mockGetReferralRouter = jest.fn().mockReturnValue(Router());

jest.mock('../../../../lib/api/v2/routers/ReferralRouter', () => {
  return jest.fn().mockImplementation(() => {
    return {
      path: 'referral',
      getRouter: mockGetReferralRouter,
    };
  });
});

describe('ApiV2', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should register routes', () => {
    const app = {
      use: jest.fn(),
    } as any;

    new ApiV2(
      Logger.disabledLogger,
      {} as any,
      {} as any,
      {} as any,
    ).registerRoutes(app);

    expect(mockGetInfoRouter).toHaveBeenCalledTimes(1);
    expect(mockSwapGetRouter).toHaveBeenCalledTimes(1);
    expect(mockNodesGetRouter).toHaveBeenCalledTimes(1);
    expect(mockGetChainRouter).toHaveBeenCalledTimes(1);

    expect(app.use).toHaveBeenCalledTimes(5);
    expect(app.use).toHaveBeenCalledWith(`${apiPrefix}/`, mockGetInfoRouter());
    expect(app.use).toHaveBeenCalledWith(
      `${apiPrefix}/swap`,
      mockSwapGetRouter(),
    );
    expect(app.use).toHaveBeenCalledWith(
      `${apiPrefix}/chain`,
      mockGetChainRouter(),
    );
    expect(app.use).toHaveBeenCalledWith(
      `${apiPrefix}/nodes`,
      mockNodesGetRouter(),
    );
    expect(app.use).toHaveBeenCalledWith(
      `${apiPrefix}/referral`,
      mockGetReferralRouter(),
    );
  });
});
