import { EventEmitter } from 'events';
import { NotificationConfig } from '../../Config';
import Logger from '../../Logger';

interface INotificationClient {
  on(event: 'message', listener: (message: string) => void): this;
  emit(event: 'message', message: string): boolean;

  on(event: 'error', listener: (error: Error) => void): this;
  emit(event: 'error', error: Error): boolean;
}

abstract class NotificationClient
  extends EventEmitter
  implements INotificationClient
{
  protected readonly prefix: string;

  protected constructor(
    public readonly serviceName: string,
    protected readonly logger: Logger,
    protected readonly config: NotificationConfig,
  ) {
    super();

    this.prefix = `[${this.config.prefix}]: `;
  }

  public abstract init(): Promise<void>;

  public abstract destroy(): void;

  public abstract sendMessage(
    message: string,
    isAlert?: boolean,
  ): Promise<void>;

  protected selectChannel = <T>(
    channel?: T,
    channelAlerts?: T,
    isAlert: boolean = false,
  ): T | undefined => (isAlert ? channelAlerts : channel) || channel;
}

export default NotificationClient;
export { INotificationClient };
