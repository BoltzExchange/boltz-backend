import http from 'http';
import ws from 'ws';
import { formatError } from '../../Utils';
import Service from '../../service/Service';
import Controller from '../Controller';
import { apiPrefix } from './Consts';

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

  private readonly swapToSockets = new Map<string, ws[]>();
  private readonly socketToSwaps = new Map<ws, string[]>();

  constructor(
    private readonly service: Service,
    private readonly controller: Controller,
  ) {
    this.ws = new ws.Server({
      noServer: true,
    });
    this.listenConnections();
    this.listenSwapUpdates();
  }

  public register = (server: http.Server) => {
    server.on('upgrade', (request, socket, head) => {
      if (request.url !== `${apiPrefix}/ws`) {
        request.destroy();
        socket.destroy();
        return;
      }

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
        if (ids === undefined) {
          return;
        }

        this.socketToSwaps.delete(socket);

        for (const id of ids) {
          const sockets = this.swapToSockets
            .get(id)
            ?.filter((s) => s !== socket);
          if (sockets === undefined || sockets.length === 0) {
            this.swapToSockets.delete(id);
            continue;
          }

          this.swapToSockets.set(id, sockets);
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
        const existingIds = this.socketToSwaps.get(socket) || [];
        this.socketToSwaps.set(
          socket,
          existingIds.concat(
            subscribeData.args.filter((id) => !existingIds.includes(id)),
          ),
        );

        for (const id of subscribeData.args) {
          const existingSockets = this.swapToSockets.get(id) || [];
          if (existingSockets.includes(socket)) {
            continue;
          }

          this.swapToSockets.set(id, existingSockets.concat(socket));
        }

        break;
      }

      default:
        this.sendToSocket(socket, { error: 'unknown channel' });
        return;
    }

    this.sendToSocket(socket, {
      event: Operation.Subscribe,
      channel: subscribeData.channel,
      args: subscribeData.args,
    });

    if (subscribeData.channel === SubscriptionChannel.SwapUpdate) {
      const args = subscribeData.args
        .map((id) => [id, this.controller.pendingSwapInfos.get(id)])
        .filter(([, data]) => data !== undefined);

      this.sendToSocket(socket, {
        event: Operation.Update,
        channel: SubscriptionChannel.SwapUpdate,
        args: args,
      });
    }
  };

  private listenSwapUpdates = () => {
    this.service.eventHandler.on('swap.update', ({ id, status }) => {
      const sockets = this.swapToSockets.get(id);
      if (sockets === undefined) {
        return;
      }

      for (const socket of sockets) {
        this.sendToSocket(socket, {
          event: Operation.Update,
          channel: SubscriptionChannel.SwapUpdate,
          args: [[id, status]],
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
