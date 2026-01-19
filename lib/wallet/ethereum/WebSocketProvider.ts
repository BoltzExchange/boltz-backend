import {
  WebSocketProvider as EthersWebSocketProvider,
  type Listener,
  type ProviderEvent,
  type WebSocketLike,
} from 'ethers';
import type Logger from '../../Logger';
import { formatError } from '../../Utils';
import TypedEventEmitter from '../../consts/TypedEventEmitter';

type BlockEvent = {
  number: number;
  l1BlockNumber?: number;
};

class ReconnectingWebSocket
  extends TypedEventEmitter<{
    reconnected: void;
    block: BlockEvent;
  }>
  implements WebSocketLike
{
  private static readonly reconnectDelay = 1_000;

  public onopen: null | ((...args: Array<any>) => any) = null;
  public onmessage: null | ((...args: Array<any>) => any) = null;
  public onerror: null | ((...args: Array<any>) => any) = null;

  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimeout?: NodeJS.Timeout;
  private isDestroyed = false;

  constructor(
    private readonly endpoint: string,
    private readonly logger: Logger,
    private readonly symbol: string,
    private readonly name: string,
  ) {
    super();
    this.connect();
  }

  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  public send = (payload: any): void => {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }
    this.ws.send(payload);
  };

  public close = (code?: number, reason?: string): void => {
    this.isDestroyed = true;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }

    if (this.ws) {
      this.ws.close(code, reason);
      this.ws = null;
    }
  };

  private connect = (): void => {
    if (this.isDestroyed) {
      return;
    }

    const isReconnecting = this.reconnectAttempts > 0;

    try {
      this.ws = new WebSocket(this.endpoint);

      this.ws.onopen = (event) => {
        this.reconnectAttempts = 0;
        this.logger.info(`${this.symbol} WebSocket ${this.name} connected`);

        if (isReconnecting) {
          this.emit('reconnected', undefined);
        }

        if (this.onopen) {
          this.onopen(event);
        }
      };

      this.ws.onmessage = (event) => {
        this.emitBlock(event);

        if (this.onmessage) {
          this.onmessage(event);
        }
      };

      this.ws.onerror = (event) => {
        this.logger.error(
          `${this.symbol} WebSocket ${this.name} error: ${event?.error?.name}${event?.error?.message ? `: ${event.error.message}` : ''}`,
        );
        if (this.onerror) {
          this.onerror(event);
        }
      };

      this.ws.onclose = (event) => {
        if (this.isDestroyed) {
          this.logger.debug(`${this.symbol} WebSocket ${this.name} closed`);
          return;
        }

        this.logger.warn(
          `${this.symbol} WebSocket ${this.name} closed (code: ${event.code}${event.reason ? `, reason: ${event.reason}` : ''})`,
        );
        this.scheduleReconnect();
      };
    } catch (error) {
      this.logger.error(
        `${this.symbol} WebSocket ${this.name} connection failed: ${formatError(error)}`,
      );
      this.scheduleReconnect();
    }
  };

  private scheduleReconnect = (): void => {
    if (this.isDestroyed || this.reconnectTimeout !== undefined) {
      return;
    }

    this.reconnectAttempts++;

    this.logger.debug(
      `${this.symbol} WebSocket ${this.name} reconnecting (attempt ${this.reconnectAttempts})`,
    );

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = undefined;
      this.connect();
    }, ReconnectingWebSocket.reconnectDelay);
  };

  private emitBlock = (event: MessageEvent) => {
    try {
      const parsed = JSON.parse(event.data);
      if (parsed.method === 'eth_blockNumber') {
        return;
      }

      const data = parsed.params?.result;

      if (data && 'number' in data && 'stateRoot' in data) {
        const res: BlockEvent = {
          number: Number(data.number),
        };

        if ('l1BlockNumber' in data) {
          res.l1BlockNumber = Number(data.l1BlockNumber);
        }

        this.emit('block', res);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      // Ignored; there might be other messages coming in
    }
  };
}

class WebSocketProvider extends EthersWebSocketProvider {
  public ws: ReconnectingWebSocket;

  private registeredListeners = new Map<ProviderEvent, Set<Listener>>();
  private registeredOnceListeners = new Map<ProviderEvent, Set<Listener>>();
  private onceWrappedListeners = new Map<Listener, Listener>();

  constructor(logger: Logger, symbol: string, name: string, endpoint: string) {
    const ws = new ReconnectingWebSocket(endpoint, logger, symbol, name);

    super(ws, undefined, {
      staticNetwork: true,
    });

    this.ws = ws;
    this.ws.on('reconnected', this.reregisterListeners);
  }

  public override async on(
    event: ProviderEvent,
    listener: Listener,
  ): Promise<this> {
    if (!this.registeredListeners.has(event)) {
      this.registeredListeners.set(event, new Set());
    }
    this.registeredListeners.get(event)!.add(listener);

    await super.on(event, listener);
    return this;
  }

  public override async once(
    event: ProviderEvent,
    listener: Listener,
  ): Promise<this> {
    if (!this.registeredOnceListeners.has(event)) {
      this.registeredOnceListeners.set(event, new Set());
    }
    this.registeredOnceListeners.get(event)!.add(listener);

    const wrappedListener = (...args: any[]) => {
      this.registeredOnceListeners.get(event)?.delete(listener);
      this.onceWrappedListeners.delete(listener);
      listener(...args);
    };
    this.onceWrappedListeners.set(listener, wrappedListener);

    await super.once(event, wrappedListener);
    return this;
  }

  public override async off(
    event: ProviderEvent,
    listener?: Listener,
  ): Promise<this> {
    if (listener) {
      this.registeredListeners.get(event)?.delete(listener);
      this.registeredOnceListeners.get(event)?.delete(listener);

      // For once listeners, we need to remove the wrapped version from parent
      const wrappedListener = this.onceWrappedListeners.get(listener);
      if (wrappedListener) {
        this.onceWrappedListeners.delete(listener);
        await super.off(event, wrappedListener);
      }

      await super.off(event, listener);
    } else {
      // Clear all wrapped listener mappings for this event
      for (const l of this.registeredOnceListeners.get(event) ?? []) {
        this.onceWrappedListeners.delete(l);
      }
      this.registeredListeners.delete(event);
      this.registeredOnceListeners.delete(event);
      await super.off(event, listener);
    }

    return this;
  }

  public override async removeAllListeners(
    event?: ProviderEvent,
  ): Promise<this> {
    if (event) {
      for (const l of this.registeredOnceListeners.get(event) ?? []) {
        this.onceWrappedListeners.delete(l);
      }
      this.registeredListeners.delete(event);
      this.registeredOnceListeners.delete(event);
    } else {
      this.registeredListeners.clear();
      this.registeredOnceListeners.clear();
      this.onceWrappedListeners.clear();
    }

    await super.removeAllListeners(event);
    return this;
  }

  public async destroy(): Promise<void> {
    try {
      await this.removeAllListeners();
      await super.destroy();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Ignored; fails with Anvil
    }

    this.registeredListeners.clear();
    this.registeredOnceListeners.clear();
    this.onceWrappedListeners.clear();
    this.ws.close();
  }

  private reregisterListeners = async (): Promise<void> => {
    await super.removeAllListeners();

    for (const [event, listenerSet] of this.registeredListeners) {
      for (const listener of listenerSet) {
        await super.on(event, listener);
      }
    }

    // Re-wrap once listeners so they properly clean up when fired
    for (const [event, listenerSet] of this.registeredOnceListeners) {
      for (const listener of listenerSet) {
        const wrappedListener = (...args: any[]) => {
          this.registeredOnceListeners.get(event)?.delete(listener);
          this.onceWrappedListeners.delete(listener);
          listener(...args);
        };
        this.onceWrappedListeners.set(listener, wrappedListener);
        await super.once(event, wrappedListener);
      }
    }

    this.resume();
  };
}

export default WebSocketProvider;
export { BlockEvent };
