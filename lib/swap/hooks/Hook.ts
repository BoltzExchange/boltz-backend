import type { ServerDuplexStream } from '@grpc/grpc-js';
import { status } from '@grpc/grpc-js';
import type Logger from '../../Logger';
import { formatError } from '../../Utils';
import type NotificationClient from '../../notifications/NotificationClient';

interface HookResponse {
  id: string;
}

abstract class Hook<P, Req, Res extends HookResponse> {
  private readonly pendingHooks = new Map<
    string,
    { resolve: (parsed: P) => void; fallback: P }
  >();

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
        `Received gRPC ${this.name} hook response for ${data.id}`,
      );

      const hook = this.pendingHooks.get(data.id);
      if (hook !== undefined) {
        hook.resolve(this.parseGrpcAction(data));
      }
    });
  };

  protected isConnected = (): boolean => this.stream !== undefined;

  protected sendHook = (id: string, request: Req, fallback?: P): Promise<P> => {
    const onNotConnected = fallback ?? this.notConnectedAction;
    const onTimeout = fallback ?? this.defaultAction;

    if (!this.isConnected()) {
      this.logger.silly(
        `gRPC ${this.name} hook is not connected, returning default action`,
      );
      return Promise.resolve(onNotConnected);
    }

    const hook = new Promise<P>((resolve) => {
      const resolver = (parsed: P) => {
        this.pendingHooks.delete(id);
        resolve(parsed);
      };

      const timeout = setTimeout(() => {
        if (this.pendingHooks.has(id)) {
          this.logger.warn(`Hook ${this.name} timed out for ${id}`);
          resolver(onTimeout);
        }
      }, this.hookResolveTimeout);

      this.pendingHooks.set(id, {
        resolve: (parsed: P) => {
          clearTimeout(timeout);
          resolver(parsed);
        },
        fallback: onTimeout,
      });
    });

    this.logger.silly(`Sending gRPC ${this.name} hook request for ${id}`);
    this.stream?.write(request);

    return hook;
  };

  protected abstract parseGrpcAction(res: Res): P;

  private closeStream = () => {
    this.stream?.removeAllListeners();
    this.stream?.end();
    this.stream = undefined;

    this.pendingHooks.forEach((hook) => {
      hook.resolve(hook.fallback);
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
