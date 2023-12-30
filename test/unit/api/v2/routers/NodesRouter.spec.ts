import { Router } from 'express';
import Logger from '../../../../../lib/Logger';
import NodesRouter from '../../../../../lib/api/v2/routers/NodesRouter';
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

describe('NodesRouter', () => {
  const service = {
    getNodes: jest.fn().mockReturnValue(
      new Map([
        [
          'BTC',
          new Map([
            [
              'LND',
              {
                nodeKey: 'lndNode',
                uris: ['123.321', '::'],
              },
            ],
            [
              'CLN',
              {
                nodeKey: 'clnNode',
                uris: ['.onion'],
              },
            ],
          ]),
        ],
      ]),
    ),

    getNodeStats: jest.fn().mockReturnValue(
      new Map([
        [
          'BTC',
          new Map([
            ['total', { some: 'stats' }],
            ['CLN', { more: 'statistics' }],
          ]),
        ],
      ]),
    ),
  } as any as Service;
  const nodesRouter = new NodesRouter(Logger.disabledLogger, service);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should get route prefix', () => {
    const router = new NodesRouter(Logger.disabledLogger, service);
    expect(router.path).toEqual('nodes');
  });

  test('should get router', () => {
    const nodesRouter = new NodesRouter(Logger.disabledLogger, service);

    const router = nodesRouter.getRouter();
    expect(router).not.toBeUndefined();

    expect(Router).toHaveBeenCalledTimes(1);
    expect(mockedRouter.get).toHaveBeenCalledTimes(2);
    expect(mockedRouter.get).toHaveBeenCalledWith('/', expect.anything());
    expect(mockedRouter.get).toHaveBeenCalledWith('/stats', expect.anything());
  });

  test('should get nodes', () => {
    const res = mockResponse();
    nodesRouter['getNodes'](mockRequest(null), res);

    expect(service.getNodes).toHaveBeenCalledTimes(1);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      BTC: {
        LND: {
          publicKey: 'lndNode',
          uris: ['123.321', '::'],
        },
        CLN: {
          publicKey: 'clnNode',
          uris: ['.onion'],
        },
      },
    });
  });

  test('should get node stats', () => {
    const res = mockResponse();
    nodesRouter['getNodeStats'](mockRequest(null), res);

    expect(service.getNodeStats).toHaveBeenCalledTimes(1);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      BTC: {
        total: {
          some: 'stats',
        },
        CLN: {
          more: 'statistics',
        },
      },
    });
  });
});
