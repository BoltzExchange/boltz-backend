import { EventEmitter } from 'events';
import { Client, TextChannel, Message } from 'discord.js';
import { codeBlock } from './Markup';

interface DiscordClient {
  on(event: 'message', listener: (message: string) => void): this;
  emit(event: 'message', message: string): boolean;

  on(event: 'error', listener: (error: Error) => void): this;
  emit(event: 'error', error: Error): boolean;
}

class DiscordClient extends EventEmitter {
  private static readonly maxMessageLen = 2000;

  private readonly client: Client;
  private channel?: TextChannel = undefined;

  constructor(
    private readonly token: string,
    private readonly channelName: string,
    private readonly prefix: string,
  ) {
    super();

    this.client = new Client();
    this.prefix = `[${this.prefix}]: `;
  }

  public init = async (): Promise<void> => {
    if (this.token === '') {
      throw 'no API token provided';
    }

    await this.client.login(this.token);

    const { channels } = this.client;

    return new Promise((resolve, reject) => {
      this.client.on('ready', async () => {
        for (const [, channel] of channels.cache) {
          if (channel instanceof TextChannel) {
            if (channel.name === this.channelName) {
              this.channel = channel;
            }
          }
        }

        if (!this.channel) {
          reject(`Could not find Discord channel: ${this.channelName}`);
        }

        await this.listenForMessages();
        resolve();
      });
    });
  }

  public destroy = (): void => {
    this.channel = undefined;
    this.client.destroy();
  }

  public sendMessage = async (message: string): Promise<void> => {
    if (this.channel) {
      if (message.length + this.prefix.length <= DiscordClient.maxMessageLen) {
        await this.channel.send(`${this.prefix}${message}`);
      } else {
        let toSplit = message;
        let maxPartLen = DiscordClient.maxMessageLen;

        const isCodeBlock = message.startsWith(codeBlock) && message.startsWith(codeBlock);

        if (isCodeBlock) {
          // When splitting code blocks we need to account for the length the code block markup needs
          maxPartLen -= codeBlock.length * 2;

          // Trim the code block markup from the original message that will be split
          toSplit = toSplit.substring(codeBlock.length, toSplit.length - codeBlock.length);
        }

        await this.channel.send(this.prefix);

        for (const part of this.splitString(toSplit, maxPartLen)) {
          const getBlockMarkup = () => isCodeBlock ? codeBlock : '';
          await this.channel.send(`${getBlockMarkup()}${part}${getBlockMarkup()}`);
        }
      }
    }
  }

  private listenForMessages = async () => {
    if (this.channel) {
      this.client.on('message', (message: Message) => {
        if (message.author.bot) return;

        if (message.channel.id === this.channel!.id) {
          this.emit('message', message.content);
        }
      });
    }

    this.client.on('error', (error) => {
      this.emit('error', error);
    });
  }

  private splitString = (toSplit: string, length: number): string[] => {
    const splitRegex = new RegExp(`[\\s\\S]{1,${length}}`, 'g');
    return toSplit.match(splitRegex) || [];
  }
}

export default DiscordClient;
