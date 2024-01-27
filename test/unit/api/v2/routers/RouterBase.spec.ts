import { Router } from 'express';
import Logger from '../../../../../lib/Logger';
import { errorResponse } from '../../../../../lib/api/Utils';
import RouterBase from '../../../../../lib/api/v2/routers/RouterBase';
import { mockRequest, mockResponse } from '../../Utils';

jest.mock('../../../../../lib/api/Utils', () => ({
  errorResponse: jest.fn(),
}));

class TestRouter extends RouterBase {
  constructor() {
    super(Logger.disabledLogger, 'test');
  }

  public getRouter = () => Router();

  public call = (handler: () => void | Promise<void>) => {
    return this.handleError(handler)(mockRequest(null), mockResponse());
  };
}

describe('RouterBase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should handle synchronous exceptions', async () => {
    const msg = 'no';
    await new TestRouter().call(() => {
      throw msg;
    });

    expect(errorResponse).toHaveBeenCalledTimes(1);
    expect(errorResponse).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      msg,
      400,
    );
  });

  test('should handle asynchronous exceptions', async () => {
    const msg = 'no';
    await new TestRouter().call(() => new Promise((_, reject) => reject(msg)));

    expect(errorResponse).toHaveBeenCalledTimes(1);
    expect(errorResponse).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      msg,
      400,
    );
  });
});
