import { ServerDuplexStream, status } from '@grpc/grpc-js';
import Logger from '../../Logger';
import { formatError } from '../../Utils';
import NotificationClient from '../../notifications/NotificationClient';
import * as boltzrpc from '../../proto/boltzrpc_pb';

interface HookResponse {
  getId(): string;
  getAction(): boltzrpc.Action;
}

class Hook<Req, Res extends HookResponse> {
  private readonly pendingHooks = new Map<string, (action: boolean) => void>();

  private stream?: ServerDuplexStream<Res, Req> = undefined;

  constructor(
    private readonly logger: Logger,
    private readonly name: string,
    private readonly defaultAction: boolean,
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
        hook(data.getAction() === boltzrpc.Action.ACCEPT);
      }
    });
  };

  protected sendHook = (id: string, request: Req): Promise<boolean> => {
    if (this.stream === undefined) {
      this.logger.silly(
        `gRPC ${this.name} hook is not connected, returning default action`,
      );
      return Promise.resolve(this.defaultAction);
    }

    const hook = new Promise<boolean>((resolve) => {
      const resolver = (action: boolean) => {
        this.pendingHooks.delete(id);
        if (!action) {
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

      this.pendingHooks.set(id, (action: boolean) => {
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
}

export default Hook;
