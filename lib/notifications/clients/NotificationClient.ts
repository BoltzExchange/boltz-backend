import { NotificationConfig } from '../../Config';
import Logger from '../../Logger';
import TypedEventEmitter from '../../consts/TypedEventEmitter';

abstract class NotificationClient extends TypedEventEmitter<{
  message: string;
  error: Error | string;
}> {
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
