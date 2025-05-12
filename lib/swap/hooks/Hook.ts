import type { ServerDuplexStream } from '@grpc/grpc-js';
import { status } from '@grpc/grpc-js';
import type Logger from '../../Logger';
import { formatError } from '../../Utils';
import type NotificationClient from '../../notifications/NotificationClient';

interface Action {
  toString(): string;
}

interface HookResponse<T> {
  getId(): string;
  getAction(): T;
}

abstract class Hook<T extends Action, P, Req, Res extends HookResponse<T>> {
  private readonly pendingHooks = new Map<string, (parsed: P) => void>();

  private stream?: ServerDuplexStream<Res, Req> = undefined;

  constructor(
    protected readonly logger: Logger,
    protected readonly name: string,
    private readonly defaultAction: P,
    private readonly notConnectedAction: P,
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
        hook(this.parseGrpcAction(data));
      }
    });
  };

  protected isConnected = (): boolean => this.stream !== undefined;

  protected sendHook = (id: string, request: Req): Promise<P> => {
    if (!this.isConnected()) {
      this.logger.silly(
        `gRPC ${this.name} hook is not connected, returning accept action`,
      );
      return Promise.resolve(this.notConnectedAction);
    }

    const hook = new Promise<P>((resolve) => {
      const resolver = (parsed: P) => {
        this.pendingHooks.delete(id);
        resolve(parsed);
      };

      const timeout = setTimeout(() => {
        if (this.pendingHooks.has(id)) {
          this.logger.warn(`Hook ${this.name} timed out for ${id}`);
          resolver(this.defaultAction);
        }
      }, this.hookResolveTimeout);

      this.pendingHooks.set(id, (parsed: P) => {
        clearTimeout(timeout);
        resolver(parsed);
      });
    });

    this.logger.silly(`Sending gRPC ${this.name} hook request for ${id}`);
    this.stream?.write(request);

    return hook;
  };

  protected abstract parseGrpcAction(res: HookResponse<T>): P;

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
export { HookResponse };
