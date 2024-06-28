import { GatewayIntentBits } from 'discord-api-types/v10';
import { Client, Message, TextChannel } from 'discord.js';
import { NotificationConfig } from '../../Config';
import Logger from '../../Logger';
import NotificationClient from './NotificationClient';

class DiscordClient extends NotificationClient<Client, TextChannel> {
  public static readonly serviceName = 'Discord';

  constructor(logger: Logger, config: NotificationConfig) {
    super(
      DiscordClient.serviceName,
      logger,
      config,
      new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent,
        ],
      }),
      2000,
    );
  }

  public init = async (): Promise<void> => {
    if (this.config.token === '') {
      throw 'no API token provided';
    }

    return new Promise((resolve, reject) => {
      this.client.on('ready', () => {
        for (const [, channel] of this.client.channels.cache) {
          if (channel instanceof TextChannel) {
            switch (channel.name) {
              case this.config.channel:
                this.channel = channel;
                break;

              case this.config.channelAlerts:
                this.channelAlerts = channel;
                break;
            }
          }
        }

        if (!this.channel) {
          reject(`Could not find Discord channel: ${this.config.channel}`);
        }

        if (
          this.config.channelAlerts !== undefined &&
          this.channelAlerts === undefined
        ) {
          this.logger.warn(
            `Discord alert channel "${this.config.channelAlerts}" configured but could not be found`,
          );
        }

        this.listenForMessages();
        resolve();
      });

      this.client.login(this.config.token).catch((error) => reject(error));
    });
  };

  public destroy = (): void => {
    this.channel = undefined;
    this.channelAlerts = undefined;

    if (this.client.isReady()) {
      this.client.destroy().then();
    }
  };

  protected sendRawMessage = async (channel: TextChannel, message: string) => {
    await channel.send(message);
  };

  private listenForMessages = () => {
    if (this.channel) {
      this.client.on('messageCreate', (message: Message) => {
        if (message.author.bot) return;

        if (message.channel.id === this.channel!.id) {
          this.emit('message', message.content);
        }
      });
    }

    this.client.on('error', (error) => {
      this.emit('error', error);
    });
  };
}

export default DiscordClient;
