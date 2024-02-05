import http from 'http';
import ws from 'ws';
import WebSocketHandler, {
  Operation,
  SubscriptionChannel,
} from '../../../../lib/api/v2/WebSocketHandler';
import { SwapUpdateEvent } from '../../../../lib/consts/Enums';
import { SwapUpdate } from '../../../../lib/service/EventHandler';

type SwapUpdateCallback = (args: { id: string; status: SwapUpdate }) => void;
let emitSwapUpdate: SwapUpdateCallback;

describe('WebSocket', () => {
  const service = {
    eventHandler: {
      on: jest.fn().mockImplementation((name, cb) => {
        if (name === 'swap.update') {
          emitSwapUpdate = cb;
        }
      }),
    },
  } as any;
  const controller = {
    pendingSwapInfos: new Map<string, SwapUpdate>([
      ['swap', { status: SwapUpdateEvent.InvoiceSet }],
      ['reverse', { status: SwapUpdateEvent.SwapCreated }],
    ]),
  } as any;

  const server = http.createServer();
  const wsHandler = new WebSocketHandler(service, controller);

  const createWs = async (waitForInit: boolean = true) => {
    const socket = new ws(
      `ws://127.0.0.1:${(server.address() as any).port}/v2/ws`,
    );

    if (waitForInit) {
      await new Promise<void>((resolve) => {
        socket.on('open', () => {
          resolve();
        });
      });
    }

    return socket;
  };

  const waitForMessage = (socket: ws, message: any) =>
    new Promise<void>((resolve) => {
      socket.on('message', (msg) => {
        expect(JSON.parse(msg.toString('utf-8'))).toStrictEqual(message);
        resolve();
      });
    });

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        resolve();
      });
    });

    wsHandler.register(server);
  });

  afterAll(() => {
    wsHandler.close();
    server.close();
  });

  test('should upgrade connections', async () => {
    const socket = await createWs(false);
    await new Promise<void>((resolve) => {
      socket.on('open', () => {
        resolve();
      });
    });

    socket.close();
  });

  test('should respond to pings', async () => {
    const socket = await createWs();

    const pongPromise = new Promise<void>((resolve) => {
      socket.on('pong', () => resolve());
    });

    socket.ping();
    await pongPromise;

    socket.close();
  });

  test('should respond with error when message cannot be parsed', async () => {
    const socket = await createWs();
    const resPromise = waitForMessage(socket, {
      error:
        'could not parse message: Unexpected token \'o\', "not json" is not valid JSON',
    });

    socket.send('not json');
    await resPromise;

    socket.close();
  });

  test('should respond with error for unknown operations', async () => {
    const socket = await createWs();
    const resPromise = waitForMessage(socket, {
      error: 'unknown operation',
    });

    socket.send(
      JSON.stringify({
        op: 'unknown',
      }),
    );
    await resPromise;

    socket.close();
  });

  test('should respond with error for unknown subscription channels', async () => {
    const socket = await createWs();
    const resPromise = waitForMessage(socket, {
      error: 'unknown channel',
    });

    socket.send(
      JSON.stringify({
        op: Operation.Subscribe,
        channel: 'notachannel',
      }),
    );
    await resPromise;

    socket.close();
  });

  test('should ignore swap events with no socket', () => {
    emitSwapUpdate({
      id: 'noSocket',
      status: {
        status: SwapUpdateEvent.SwapCreated,
      },
    });
  });

  test('should subscribe to swap events and send latest status', async () => {
    const swapIds = ['swap', 'reverse', 'notFound'];

    const socket = await createWs();

    const resPromise = new Promise<void>((resolve) => {
      let msgCount = 0;

      socket.on('message', (msg) => {
        const parsedMsg = JSON.parse(msg.toString('utf-8'));
        expect(parsedMsg).toStrictEqual(
          msgCount === 0
            ? {
                event: Operation.Subscribe,
                channel: SubscriptionChannel.SwapUpdate,
                args: swapIds,
              }
            : {
                event: Operation.Update,
                channel: SubscriptionChannel.SwapUpdate,
                args: [
                  [
                    'swap',
                    {
                      status: SwapUpdateEvent.InvoiceSet,
                    },
                  ],
                  [
                    'reverse',
                    {
                      status: SwapUpdateEvent.SwapCreated,
                    },
                  ],
                ],
              },
        );

        msgCount++;
        if (msgCount == 2) {
          socket.removeAllListeners('message');
          resolve();
        }
      });
    });

    socket.send(
      JSON.stringify({
        op: Operation.Subscribe,
        channel: SubscriptionChannel.SwapUpdate,
        args: swapIds,
      }),
    );

    await resPromise;

    socket.send(
      JSON.stringify({
        op: Operation.Subscribe,
        channel: SubscriptionChannel.SwapUpdate,
        args: swapIds,
      }),
    );

    expect(wsHandler['swapToSockets'].size).toEqual(3);
    for (const id of swapIds) {
      expect(wsHandler['swapToSockets'].get(id)).not.toBeUndefined();
      expect(wsHandler['swapToSockets'].get(id)!.length).toEqual(1);
    }

    expect(wsHandler['socketToSwaps'].size).toEqual(1);
    expect(Array.from(wsHandler['socketToSwaps'].values())).toEqual([swapIds]);

    socket.close();
  });

  test('should subscribe to swap events and send swap updates', async () => {
    const swapId = 'updateId';
    const status = {
      status: SwapUpdateEvent.TransactionClaimPending,
    };

    const sockets = await Promise.all([createWs(), createWs()]);

    const setupPromises = sockets.map(
      (sock) =>
        new Promise<void>((resolve) => {
          sock.on('message', (msg) => {
            const parsedMsg = JSON.parse(msg.toString('utf-8'));
            if (parsedMsg.event === Operation.Update) {
              resolve();
            }
          });
        }),
    );

    sockets.forEach((sock) =>
      sock.send(
        JSON.stringify({
          op: Operation.Subscribe,
          channel: SubscriptionChannel.SwapUpdate,
          args: [swapId],
        }),
      ),
    );

    await Promise.all(setupPromises);

    const resPromises = sockets.map(
      (sock) =>
        new Promise<void>((resolve) => {
          sock.on('message', (msg) => {
            const parsedMsg = JSON.parse(msg.toString('utf-8'));
            if (
              parsedMsg.event !== Operation.Update &&
              parsedMsg.args.length > 0
            ) {
              return;
            }

            expect(parsedMsg).toStrictEqual({
              event: Operation.Update,
              channel: SubscriptionChannel.SwapUpdate,
              args: [[swapId, status]],
            });
            resolve();
          });
        }),
    );

    emitSwapUpdate({
      status,
      id: swapId,
    });

    await Promise.all(resPromises);

    sockets.forEach((sock) => sock.close());
  });
});
