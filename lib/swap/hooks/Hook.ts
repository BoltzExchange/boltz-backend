import type { ServerDuplexStream } from '@grpc/grpc-js';
import { status } from '@grpc/grpc-js';
import type Logger from '../../Logger';
import { formatError } from '../../Utils';
import type NotificationClient from '../../notifications/NotificationClient';
import * as boltzrpc from '../../proto/boltzrpc_pb';

interface HookResponse {
  getId(): string;
  getAction(): boltzrpc.Action;
}

const enum Action {
  Accept,
  Reject,
  Hold,
}

class Hook<Req, Res extends HookResponse> {
  private readonly pendingHooks = new Map<string, (action: Action) => void>();

  private stream?: ServerDuplexStream<Res, Req> = undefined;

  constructor(
    protected readonly logger: Logger,
    private readonly name: string,
    private readonly defaultAction: Action,
    private readonly hookResolveTimeout: number,
    private readonly notificationClient?: NotificationClient,
  ) {}

  public connectToStream = (stream: ServerDuplexStream<Res, Req>) => {
    this.logger.info(`Connected gRPC ${this.name} hook`);
    if (this.stream !== undefined) {
      this.logger.warn(
        `gRPC ${this.name} hook is already connected, disconnecting from previous connection`,
      );
      this.stream.emit('error', {
        code: status.RESOURCE_EXHAUSTED,
        details: 'received new connection',
      });
      this.closeStream();
    }

    this.stream = stream;

    this.stream.on('error', (error) => {
      const msg = `gRPC ${this.name} hook error ${formatError(error)}`;
      this.logger.error(msg);
      this.sendNotification(msg);
      this.closeStream();
    });

    this.stream.on('end', () => {
      const msg = `gRPC ${this.name} hook disconnected`;
      this.logger.warn(msg);
      this.sendNotification(msg);
      this.closeStream();
    });

    this.stream.on('data', (data: Res) => {
      this.logger.silly(
        `Received gRPC ${this.name} hook response for ${data.getId()}: ${data.getAction().toString()}`,
      );

      const hook = this.pendingHooks.get(data.getId());
      if (hook !== undefined) {
        hook(this.parseGrpcAction(data.getAction()));
      }
    });
  };

  protected sendHook = (id: string, request: Req): Promise<Action> => {
    if (this.stream === undefined) {
      this.logger.silly(
        `gRPC ${this.name} hook is not connected, returning accept action`,
      );
      return Promise.resolve(Action.Accept);
    }

    const hook = new Promise<Action>((resolve) => {
      const resolver = (action: Action) => {
        this.pendingHooks.delete(id);
        if (action === Action.Reject) {
          this.logger.warn(`Hook ${this.name} rejected for ${id}`);
        }
        resolve(action);
      };

      const timeout = setTimeout(() => {
        if (this.pendingHooks.has(id)) {
          this.logger.warn(`Hook ${this.name} timed out for ${id}`);
          resolver(this.defaultAction);
        }
      }, this.hookResolveTimeout);

      this.pendingHooks.set(id, (action: Action) => {
        clearTimeout(timeout);
        resolver(action);
      });
    });

    this.logger.silly(`Sending gRPC ${this.name} hook request for ${id}`);
    this.stream.write(request);

    return hook;
  };

  private closeStream = () => {
    this.stream?.removeAllListeners();
    this.stream?.end();
    this.stream = undefined;

    this.pendingHooks.forEach((resolve) => {
      resolve(this.defaultAction);
    });
    this.pendingHooks.clear();
  };

  private sendNotification = (message: string) => {
    if (this.notificationClient === undefined) {
      return;
    }

    this.notificationClient.sendMessage(message, true, true);
  };

  private parseGrpcAction = (action: boltzrpc.Action): Action => {
    switch (action) {
      case boltzrpc.Action.ACCEPT:
        return Action.Accept;
      case boltzrpc.Action.REJECT:
        return Action.Reject;
      case boltzrpc.Action.HOLD:
        return Action.Hold;
      default:
        throw new Error(`unknown action: ${action}`);
    }
  };
}

export default Hook;
export { Action };
