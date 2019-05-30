import { EventEmitter } from 'events';
import { ClientStatus } from './consts/Enums';

class BaseClient extends EventEmitter {
  protected status = ClientStatus.Disconnected;

  protected readonly RECONNECT_INTERVAL = 1000;
  protected reconnectionTimer?: any;

  constructor() {
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

  protected setClientStatus = (status: ClientStatus): void => {
    this.status = status;
  }

  protected clearReconnectTimer = () => {
    if (this.reconnectionTimer) {
      clearInterval(this.reconnectionTimer);
      this.reconnectionTimer = undefined;
    }
  }
}

export default BaseClient;
