import { Router } from 'express';
import Logger from '../../../../../lib/Logger';
import { getVersion } from '../../../../../lib/Utils';
import InfoRouter from '../../../../../lib/api/v2/routers/InfoRouter';
import Service from '../../../../../lib/service/Service';
import { mockRequest, mockResponse } from '../../Utils';

const mockedRouter = {
  get: jest.fn(),
};

jest.mock('express', () => {
  return {
    Router: jest.fn().mockImplementation(() => mockedRouter),
  };
});

describe('InfoRouter', () => {
  const service = {
    getInfos: jest.fn().mockReturnValue(['some', 'info']),
    getWarnings: jest
      .fn()
      .mockReturnValue(['really', 'concerning', 'warnings']),
  } as unknown as Service;

  const infoRouter = new InfoRouter(Logger.disabledLogger, service);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should get route prefix', () => {
    expect(infoRouter.path).toEqual('');
  });

  test('should get router', () => {
    const router = infoRouter.getRouter();
    expect(router).not.toBeUndefined();

    expect(Router).toHaveBeenCalledTimes(1);
    expect(mockedRouter.get).toHaveBeenCalledTimes(3);
    expect(mockedRouter.get).toHaveBeenCalledWith('/infos', expect.anything());
    expect(mockedRouter.get).toHaveBeenCalledWith(
      '/version',
      expect.anything(),
    );
    expect(mockedRouter.get).toHaveBeenCalledWith(
      '/warnings',
      expect.anything(),
    );
  });

  test('should get version', () => {
    const res = mockResponse();
    infoRouter['getVersion'](mockRequest(null), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ version: getVersion() });
  });

  test('should get infos', () => {
    const res = mockResponse();
    infoRouter['getInfos'](mockRequest(), res);

    expect(service.getInfos).toHaveBeenCalledTimes(1);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(service.getInfos());
  });

  test('should get warnings', () => {
    const res = mockResponse();
    infoRouter['getWarnings'](mockRequest(), res);

    expect(service.getWarnings).toHaveBeenCalledTimes(1);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(service.getWarnings());
  });
});
