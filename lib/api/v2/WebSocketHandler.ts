import http from 'http';
import ws from 'ws';
import { formatError } from '../../Utils';
import DefaultMap from '../../consts/DefaultMap';
import Errors from '../../service/Errors';
import Service from '../../service/Service';
import SwapInfos from '../SwapInfos';

enum Operation {
  // TODO: unsubscribe
  Subscribe = 'subscribe',
  Update = 'update',
}

enum SubscriptionChannel {
  SwapUpdate = 'swap.update',
}

type WsRequest = {
  op: Operation;
};

type WsSubscribeRequest = WsRequest & {
  channel: SubscriptionChannel;
  args: string[];
};

type WsResponse = {
  event: Operation;
};

type WsErrorResponse = {
  error: string;
};

class WebSocketHandler {
  private static readonly pingIntervalMs = 15_000;

  private readonly ws: ws.Server;
  private pingInterval?: NodeJS.Timer;

  private readonly swapToSockets = new DefaultMap<string, Set<ws>>(
    () => new Set<ws>(),
  );
  private readonly socketToSwaps = new DefaultMap<ws, Set<string>>(
    () => new Set<string>(),
  );

  constructor(
    private readonly service: Service,
    private readonly swapInfos: SwapInfos,
  ) {
    this.ws = new ws.Server({
      noServer: true,
    });
    this.listenConnections();
    this.listenSwapUpdates();
  }

  public register = (server: http.Server) => {
    server.on('upgrade', (request, socket, head) => {
      this.ws.handleUpgrade(request, socket, head, (ws) => {
        this.ws.emit('connection', ws, request);
      });
    });

    this.pingInterval = setInterval(() => {
      this.ws.clients.forEach((ws) => ws.ping());
    }, WebSocketHandler.pingIntervalMs);
  };

  public close = () => {
    this.ws.close();
    clearInterval(this.pingInterval);
  };

  private listenConnections = () => {
    this.ws.on('connection', (socket) => {
      socket.on('message', (msg) => this.handleMessage(socket, msg));
      socket.on('close', () => {
        const ids = this.socketToSwaps.get(socket);
        this.socketToSwaps.delete(socket);

        for (const id of ids) {
          const set = this.swapToSockets.get(id);
          set.delete(socket);

          if (set.size === 0) {
            this.swapToSockets.delete(id);
          }
        }
      });
    });
  };

  private handleMessage = (socket: ws, message: ws.RawData) => {
    try {
      const data = JSON.parse(message.toString('utf-8')) as WsRequest;

      switch (data.op) {
        case Operation.Subscribe:
          this.handleSubscribe(socket, data);
          break;

        default:
          this.sendToSocket(socket, { error: 'unknown operation' });
          break;
      }
    } catch (e) {
      this.sendToSocket(socket, {
        error: `could not parse message: ${formatError(e)}`,
      });
    }
  };

  private handleSubscribe = (socket: ws, data: WsRequest) => {
    const subscribeData = data as WsSubscribeRequest;
    switch (subscribeData.channel) {
      case SubscriptionChannel.SwapUpdate: {
        const idsWithSwaps = subscribeData.args.filter((id) =>
          this.swapInfos.has(id),
        );

        const existingSet = this.socketToSwaps.get(socket);
        for (const id of idsWithSwaps) {
          existingSet.add(id);
        }

        this.sendToSocket(socket, {
          event: Operation.Subscribe,
          channel: subscribeData.channel,
          args: subscribeData.args,
        });

        const args = subscribeData.args.map((id) => {
          const status = this.swapInfos.get(id);
          if (status === undefined) {
            return {
              id,
              error: Errors.SWAP_NOT_FOUND(id).message,
            };
          }

          this.swapToSockets.get(id).add(socket);

          return {
            id,
            ...status,
          };
        });

        this.sendToSocket(socket, {
          event: Operation.Update,
          channel: SubscriptionChannel.SwapUpdate,
          args: args,
        });

        break;
      }

      default:
        this.sendToSocket(socket, { error: 'unknown channel' });
        return;
    }
  };

  private listenSwapUpdates = () => {
    this.service.eventHandler.on('swap.update', ({ id, status }) => {
      const sockets = this.swapToSockets.getNoDefault(id);
      if (sockets === undefined) {
        return;
      }

      for (const socket of sockets) {
        this.sendToSocket(socket, {
          event: Operation.Update,
          channel: SubscriptionChannel.SwapUpdate,
          args: [{ id, ...status }],
        });
      }
    });
  };

  private sendToSocket = <T extends WsResponse>(
    socket: ws,
    msg: T | WsErrorResponse,
  ) => {
    if (socket.readyState !== socket.OPEN) {
      return;
    }

    socket.send(JSON.stringify(msg));
  };
}

export default WebSocketHandler;
export { Operation, SubscriptionChannel };
