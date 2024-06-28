import { Client4, WebSocketClient, WebSocketMessage } from '@mattermost/client';
import ws from 'ws';
import { NotificationConfig } from '../../Config';
import Logger from '../../Logger';
import NotificationClient from './NotificationClient';

class MattermostClient extends NotificationClient<Client4, string> {
  public static readonly serviceName = 'Mattermost';

  private readonly wsClient: WebSocketClient;

  private userId?: string = undefined;

  constructor(logger: Logger, config: NotificationConfig) {
    // Polyfill a WebSocket library
    Object.assign(global, { WebSocket: ws });

    super(MattermostClient.serviceName, logger, config, new Client4(), 4000);

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

    this.channel = channels.find(
      (chan) => chan.name === this.config.channel,
    )?.id;
    if (this.channel === undefined) {
      throw `Could not find Mattermost channel: ${this.config.channel}`;
    }

    if (this.config.channelAlerts) {
      this.channelAlerts = channels.find(
        (chan) => chan.name === this.config.channelAlerts,
      )?.id;

      if (this.channelAlerts === undefined) {
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

  protected sendRawMessage = async (channel: string, message: string) => {
    await this.client.createPost({
      channel_id: channel,
      message: message,
    } as any);
  };

  private listenForMessages = (msg: WebSocketMessage) => {
    if (msg.event !== 'posted' || msg.broadcast.channel_id !== this.channel) {
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
