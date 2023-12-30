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

describe('ApiV2', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should register routes', () => {
    const app = {
      use: jest.fn(),
    } as any;

    new ApiV2(Logger.disabledLogger, {} as any).registerRoutes(app);

    expect(mockNodesGetRouter).toHaveBeenCalledTimes(1);
    expect(app.use).toHaveBeenCalledTimes(1);
    expect(app.use).toHaveBeenCalledWith(
      `${apiPrefix}/nodes`,
      mockNodesGetRouter(),
    );
  });
});
