import { EventEmitter } from 'events';
import { Client, TextChannel, Message } from 'discord.js';

interface DiscordClient {
  on(event: 'message', listener: (message: string) => void): this;
  emit(event: 'message', message: string): boolean;

  on(event: 'error', listener: (error: Error) => void): this;
  emit(event: 'error', error: Error): boolean;
}

class DiscordClient extends EventEmitter {
  private client: Client;

  private channel?: TextChannel = undefined;

  constructor(
    private token: string,
    private channelName: string,
    private prefix: string) {
    super();

    this.client = new Client();
  }

  public init = async () => {
    if (this.token === '') {
      throw 'no API token provided';
    }

    await this.client.login(this.token);

    const { channels } = this.client;

    for (const channel of channels.values()) {
      if (channel instanceof TextChannel) {
        if (channel.name === this.channelName) {
          this.channel = channel;
        }
      }
    }

    if (!this.channel) {
      throw `Could not find Discord channel: ${this.channelName}`;
    }

    await this.listenForMessages();
  }

  public sendMessage = async (message: string) => {
    if (this.channel) {
      await this.channel.send(`[${this.prefix}]: ${message}`);
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
}

export default DiscordClient;
