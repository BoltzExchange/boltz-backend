import { Client4, WebSocketClient, WebSocketMessage } from '@mattermost/client';
import ws from 'ws';
import { NotificationConfig } from '../../Config';
import Logger from '../../Logger';
import { codeBlock } from '../Markup';
import NotificationClient, { INotificationClient } from './NotificationClient';

class MattermostClient
  extends NotificationClient
  implements INotificationClient
{
  public static readonly serviceName = 'Mattermost';

  private readonly client: Client4;
  private readonly wsClient: WebSocketClient;

  private userId?: string = undefined;

  private channelId?: string = undefined;
  private channelAlertsId?: string = undefined;

  constructor(logger: Logger, config: NotificationConfig) {
    super(MattermostClient.serviceName, logger, config);

    // Polyfill a WebSocket library
    Object.assign(global, { WebSocket: ws });

    this.client = new Client4();

    if (config.mattermostUrl === undefined) {
      throw 'missing Mattermost URL';
    }
    this.client.setUrl(config.mattermostUrl!);

    if (config.token === '') {
      throw 'missing Mattermost token';
    }
    this.client.setToken(config.token);

    this.wsClient = new WebSocketClient();
  }

  public init = async () => {
    const [user, channels] = await Promise.all([
      this.client.getMe(),
      this.client.getAllTeamsChannels(),
    ]);
    this.userId = user.id;

    this.channelId = channels.find(
      (chan) => chan.name === this.config.channel,
    )?.id;
    if (this.channelId === undefined) {
      throw `Could not find Mattermost channel: ${this.config.channel}`;
    }

    if (this.config.channelAlerts) {
      this.channelAlertsId = channels.find(
        (chan) => chan.name === this.config.channelAlerts,
      )?.id;

      if (this.channelAlertsId === undefined) {
        this.logger.warn(
          `Could not find Mattermost notification channel: ${this.config.channelAlerts}`,
        );
      }
    }

    this.wsClient.initialize(this.client.getWebSocketUrl(), this.config.token);
    this.wsClient.addMessageListener(this.listenForMessages);
    this.wsClient.addErrorListener((error) => {
      this.emit('error', error.type);
    });
  };

  public destroy = () => {
    this.wsClient.close();
  };

  public sendMessage = async (message: string, isAlert?: boolean) => {
    const channel = this.selectChannel(
      this.channelId,
      this.channelAlertsId,
      isAlert,
    );

    if (channel === undefined) {
      return;
    }

    if (message.includes(codeBlock)) {
      message = message.replace(/```/, '```json\n');
      if (!message.startsWith('\n')) {
        message = `\n${message}`;
      }

      message =
        message.substring(0, message.length - codeBlock.length) + '\n```';
    }

    await this.client.createPost({
      channel_id: channel,
      message: `${this.prefix}${message}`,
    } as any);
  };

  private listenForMessages = (msg: WebSocketMessage) => {
    if (msg.event !== 'posted' || msg.broadcast.channel_id !== this.channelId) {
      return;
    }

    const post: { user_id: string; message: string } = JSON.parse(
      msg.data.post,
    );
    // Ignore own messages
    if (post.user_id === this.userId) {
      return;
    }

    this.emit('message', post.message);
  };
}

export default MattermostClient;
