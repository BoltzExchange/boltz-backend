import Logger from '../Logger';
import TypedEventEmitter from '../consts/TypedEventEmitter';
import type * as sidecarrpc from '../proto/sidecar/boltzr_pb';
import Sidecar from '../sidecar/Sidecar';

class NotificationClient extends TypedEventEmitter<{
  message: string;
  error: Error | string;
}> {
  private disabled = false;

  constructor(
    private readonly logger: Logger,
    private readonly sidecar: Sidecar,
  ) {
    super();
  }

  public init = async () => {
    if (this.disabled) {
      return;
    }

    const messageStream = this.sidecar.getMessages();
    const endStream = () => {
      messageStream.removeAllListeners();
      messageStream.destroy();
    };

    messageStream.on('data', (data: sidecarrpc.GetMessagesResponse) => {
      this.emit('message', data.getMessage());
    });

    messageStream.on('close', endStream);

    messageStream.on('error', (error: Error) => {
      this.emit('error', error);
      endStream();

      if ((error as any).details === 'Notification client not enabled') {
        this.logger.warn(
          'Disabling notification client because sidecar does not have it enabled',
        );
        this.disabled = true;
      }
    });
  };

  public sendMessage = async (
    message: string,
    isImportant?: boolean,
    sendAlert?: boolean,
  ): Promise<void> => {
    if (this.disabled) {
      return;
    }

    return this.sidecar.sendMessage(message, isImportant, sendAlert);
  };
}

export default NotificationClient;
