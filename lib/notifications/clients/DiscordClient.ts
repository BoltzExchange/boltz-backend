import { GatewayIntentBits } from 'discord-api-types/v10';
import { Client, Message, TextChannel } from 'discord.js';
import { NotificationConfig } from '../../Config';
import Logger from '../../Logger';
import { codeBlock } from '../Markup';
import NotificationClient from './NotificationClient';

class DiscordClient extends NotificationClient {
  public static readonly serviceName = 'Discord';

  private static readonly maxMessageLen = 2000;

  private readonly client: Client;

  private channel?: TextChannel = undefined;
  private channelAlerts?: TextChannel = undefined;

  constructor(logger: Logger, config: NotificationConfig) {
    super(DiscordClient.serviceName, logger, config);

    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });
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

  public sendMessage = async (
    message: string,
    isAlert?: boolean,
  ): Promise<void> => {
    const channel = this.selectChannel(
      this.channel,
      this.channelAlerts,
      isAlert,
    );

    if (channel === undefined) {
      return;
    }

    if (message.length + this.prefix.length <= DiscordClient.maxMessageLen) {
      await channel.send(`${this.prefix}${message}`);
    } else {
      let toSplit = message;
      let maxPartLen = DiscordClient.maxMessageLen;

      const isCodeBlock =
        message.startsWith(codeBlock) && message.endsWith(codeBlock);

      if (isCodeBlock) {
        // When splitting code blocks we need to account for the length the code block markup needs
        maxPartLen -= codeBlock.length * 2;

        // Trim the code block markup from the original message that will be split
        toSplit = toSplit.substring(
          codeBlock.length,
          toSplit.length - codeBlock.length,
        );
      }

      await channel.send(this.prefix);

      for (const part of this.splitString(toSplit, maxPartLen)) {
        const getBlockMarkup = () => (isCodeBlock ? codeBlock : '');
        await channel.send(`${getBlockMarkup()}${part}${getBlockMarkup()}`);
      }
    }
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

  private splitString = (toSplit: string, length: number): string[] => {
    const splitRegex = new RegExp(`[\\s\\S]{1,${length}}`, 'g');
    return toSplit.match(splitRegex) || [];
  };
}

export default DiscordClient;
