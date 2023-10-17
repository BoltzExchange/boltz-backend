import { EventEmitter } from 'events';
import Logger from './Logger';
import { racePromise } from './PromiseUtils';
import { ClientStatus } from './consts/Enums';

interface IBaseClient {
  on(event: 'status.changed', listener: (status: ClientStatus) => void): void;
  emit(event: 'status.changed', status: ClientStatus): void;
}

class BaseClient extends EventEmitter implements IBaseClient {
  private status = ClientStatus.Disconnected;

  protected readonly RECONNECT_INTERVAL = 5000;
  protected reconnectionTimer?: any;

  constructor(
    protected readonly logger: Logger,
    private readonly name: string,
  ) {
    super();
  }

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
      `${this.name} status changed: ${status}`,
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
}

export default BaseClient;
export { IBaseClient };
