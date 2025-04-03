import type Logger from './Logger';
import { racePromise } from './PromiseUtils';
import { ClientStatus } from './consts/Enums';
import TypedEventEmitter from './consts/TypedEventEmitter';

export type BaseClientEvents = { 'status.changed': ClientStatus };

abstract class BaseClient<
  T extends BaseClientEvents = BaseClientEvents,
> extends TypedEventEmitter<T> {
  protected readonly RECONNECT_INTERVAL = 5000;
  protected reconnectionTimer?: any;

  private status = ClientStatus.Disconnected;

  protected constructor(
    protected readonly logger: Logger,
    public readonly symbol: string,
  ) {
    super();
  }

  public abstract serviceName(): string;

  public isConnected(): boolean {
    return this.status === ClientStatus.Connected;
  }

  public isDisconnected(): boolean {
    return this.status === ClientStatus.Disconnected;
  }

  public isOutOfSync(): boolean {
    return this.status === ClientStatus.OutOfSync;
  }

  public setClientStatus = (status: ClientStatus): void => {
    if (this.status === status) {
      return;
    }

    this.status = status;

    (status === ClientStatus.Connected ? this.logger.info : this.logger.error)(
      `${this.getName()} status changed: ${status}`,
    );

    this.emit('status.changed', status);
  };

  public raceCall = <T>(
    promise: (() => Promise<T>) | Promise<T>,
    raceHandler: (reason?: any) => void,
    raceTimeout: number,
  ): Promise<T> => {
    return racePromise(
      promise,
      (reject) => {
        this.setClientStatus(ClientStatus.Disconnected);
        raceHandler(reject);
      },
      raceTimeout,
    );
  };

  protected clearReconnectTimer = (): void => {
    if (this.reconnectionTimer) {
      clearInterval(this.reconnectionTimer);
      this.reconnectionTimer = undefined;
    }
  };

  private getName = () => `${this.serviceName()}-${this.symbol}`;
}

export default BaseClient;
