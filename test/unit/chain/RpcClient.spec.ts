import EventEmitter from 'events';
import http from 'http';
import Logger from '../../../lib/Logger';
import RpcClient from '../../../lib/chain/RpcClient';

type MockRequest = EventEmitter & {
  end: jest.Mock;
  setHeader: jest.Mock;
  write: jest.Mock;
};

describe('RpcClient', () => {
  const baseConfig = {
    host: '127.0.0.1',
    password: 'password',
    port: 18443,
    user: 'backend',
  };

  const mockHttpResponse = (
    statusCode: number,
    body: string,
    statusMessage?: string,
    emitAsync: boolean = false,
  ) => {
    jest.spyOn(http, 'request').mockImplementation(((_options, callback) => {
      const response = new EventEmitter() as EventEmitter & {
        statusCode?: number;
        statusMessage?: string;
      };
      response.statusCode = statusCode;
      response.statusMessage = statusMessage;

      const request = new EventEmitter() as MockRequest;
      request.setHeader = jest.fn();
      request.write = jest.fn();
      request.end = jest.fn(() => {
        callback(response as any);
        const emitResponse = () => {
          response.emit('data', Buffer.from(body));
          response.emit('end');
        };

        if (emitAsync) {
          setImmediate(emitResponse);
          return;
        }

        emitResponse();
      });

      return request as any;
    }) as typeof http.request);
  };

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('should reject plain text RPC errors without JSON parse exceptions', async () => {
    mockHttpResponse(500, 'Work queue depth exceeded', 'Internal Server Error');

    const client = new RpcClient(
      Logger.disabledLogger,
      'BTC',
      baseConfig as any,
    );

    await expect(client.request('getblockcount')).rejects.toThrow(
      'BTC RPC returned a non-JSON response (500 Internal Server Error): Work queue depth exceeded',
    );
  });

  test('should reject plain text RPC errors emitted asynchronously', async () => {
    mockHttpResponse(
      500,
      'Work queue depth exceeded',
      'Internal Server Error',
      true,
    );

    const client = new RpcClient(
      Logger.disabledLogger,
      'BTC',
      baseConfig as any,
    );

    await expect(client.request('getblockcount')).rejects.toThrow(
      'BTC RPC returned a non-JSON response (500 Internal Server Error): Work queue depth exceeded',
    );
  });

  test('should reject JSON-RPC errors', async () => {
    mockHttpResponse(
      500,
      JSON.stringify({
        error: {
          code: -32603,
          message: 'Work queue depth exceeded',
        },
        result: null,
      }),
      'Internal Server Error',
    );

    const client = new RpcClient(
      Logger.disabledLogger,
      'BTC',
      baseConfig as any,
    );

    await expect(client.request('getblockcount')).rejects.toEqual({
      code: -32603,
      message: 'Work queue depth exceeded',
    });
  });

  test("should mark JSON-RPC errors as the node's, and only those", async () => {
    const client = new RpcClient(
      Logger.disabledLogger,
      'BTC',
      baseConfig as any,
    );

    mockHttpResponse(
      500,
      JSON.stringify({
        error: { code: -6, message: 'Insufficient funds' },
        result: null,
      }),
    );
    const nodeError = await client.request('sendtoaddress').catch((e) => e);
    expect(RpcClient.isNodeError(nodeError)).toEqual(true);
    // The mark does not show in what is logged or compared
    expect(JSON.stringify(nodeError)).toEqual(
      '{"code":-6,"message":"Insufficient funds"}',
    );

    mockHttpResponse(502, 'Bad Gateway');
    const proxyError = await client.request('sendtoaddress').catch((e) => e);
    expect(RpcClient.isNodeError(proxyError)).toEqual(false);

    expect(RpcClient.isNodeError({ code: -6, message: 'lookalike' })).toEqual(
      false,
    );
    expect(RpcClient.isNodeError(undefined)).toEqual(false);
    expect(RpcClient.isNodeError('-6')).toEqual(false);
  });

  test('should reject responses without a result field', async () => {
    mockHttpResponse(200, JSON.stringify({}));

    const client = new RpcClient(
      Logger.disabledLogger,
      'BTC',
      baseConfig as any,
    );

    await expect(client.request('getblockcount')).rejects.toBe(
      'no result in RPC response',
    );
  });
});
