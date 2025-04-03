import { Router } from 'express';
import Logger from '../../../../../lib/Logger';
import NodesRouter from '../../../../../lib/api/v2/routers/NodesRouter';
import type Service from '../../../../../lib/service/Service';
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
    swapManager: {
      routingHints: {
        getRoutingHints: jest.fn().mockResolvedValue(['hint1']),
      },
    },

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
    expect(mockedRouter.get).toHaveBeenCalledTimes(3);
    expect(mockedRouter.get).toHaveBeenCalledWith('/', expect.anything());
    expect(mockedRouter.get).toHaveBeenCalledWith('/stats', expect.anything());
    expect(mockedRouter.get).toHaveBeenCalledWith(
      '/:currency/:node/hints',
      expect.anything(),
    );
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

  test('should get routing hints', async () => {
    const res = mockResponse();
    await nodesRouter['getRoutingHints'](
      mockRequest(null, undefined, {
        currency: 'BTC',
        node: 'Boltz',
      }),
      res,
    );

    expect(
      service.swapManager.routingHints.getRoutingHints,
    ).toHaveBeenCalledTimes(1);
    expect(
      service.swapManager.routingHints.getRoutingHints,
    ).toHaveBeenCalledWith('BTC', 'Boltz');

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(['hint1']);
  });
});
