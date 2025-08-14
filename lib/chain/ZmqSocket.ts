import { Subscriber } from 'zeromq';
import type Logger from '../Logger';
import { sleep } from '../PromiseUtils';
import { formatError } from '../Utils';
import TypedEventEmitter from '../consts/TypedEventEmitter';

class ZmqSocket extends TypedEventEmitter<{
  data: Buffer;
  reconnected: unknown;
}> {
  private static readonly reconnectTimeoutMs = 1_000;

  private socket: Subscriber;
  private disconnected = false;
  private shouldReconnect = true;
  private inactivityTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private readonly logger: Logger,
    private readonly symbol: string,
    private readonly filter: string,
    private readonly address: string,
    private readonly inactivityTimeoutMs: number,
  ) {
    super();

    this.socket = new Subscriber();
  }

  public connect = () => {
    this.logger.debug(
      `Connecting to ${this.symbol} ZMQ filter ${this.filter}: ${this.address}`,
    );

    this.socket = new Subscriber();
    this.socket.connect(this.address);
    this.socket.subscribe(this.filter);

    this.resetInactivityTimer();
    void this.listen();
  };

  public disconnect = () => {
    this.logger.silly(
      `Disconnecting ${this.symbol} ZMQ filter ${this.filter}: ${this.address}`,
    );

    this.shouldReconnect = false;
    this.clearInactivityTimer();
    this.socket.close();
  };

  private listen = async () => {
    try {
      for await (const [, data] of this.socket) {
        this.resetInactivityTimer();
        if (this.disconnected) {
          this.logger.info(
            `${this.symbol} ZMQ filter ${this.filter} reconnected on ${this.address}`,
          );

          this.disconnected = false;
          this.emit('reconnected', undefined);
        }

        this.emit('data', data);
      }
    } finally {
      this.clearInactivityTimer();
    }
  };

  private clearInactivityTimer = () => {
    if (this.inactivityTimer !== undefined) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = undefined;
    }
  };

  private resetInactivityTimer = () => {
    this.clearInactivityTimer();

    this.inactivityTimer = setTimeout(async () => {
      this.logger.warn(
        `${this.symbol} ZMQ filter ${this.filter} inactive for ${this.inactivityTimeoutMs}ms on ${this.address}; reconnecting`,
      );
      this.disconnected = true;

      try {
        this.socket.close();
      } catch (error) {
        this.logger.debug(
          `Error closing ${this.symbol} ZMQ socket (${this.filter} @ ${this.address}) after inactivity: ${formatError(error)}`,
        );
      }

      await sleep(ZmqSocket.reconnectTimeoutMs);
      if (!this.shouldReconnect) {
        return;
      }

      this.connect();
    }, this.inactivityTimeoutMs);
  };
}

export default ZmqSocket;
