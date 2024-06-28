import { NotificationConfig } from '../../Config';
import Logger from '../../Logger';
import TypedEventEmitter from '../../consts/TypedEventEmitter';
import { codeBlock } from '../Markup';

abstract class NotificationClient<K = any, T = any> extends TypedEventEmitter<{
  message: string;
  error: Error | string;
}> {
  protected readonly prefix: string;

  protected channel?: T = undefined;
  protected channelAlerts?: T = undefined;

  protected constructor(
    public readonly serviceName: string,
    protected readonly logger: Logger,
    protected readonly config: NotificationConfig,
    protected readonly client: K,
    private readonly maxMessageLength: number,
  ) {
    super();

    this.prefix = `[${this.config.prefix}]: `;
  }

  public abstract init(): Promise<void>;

  public abstract destroy(): void;

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

    if (message.length + this.prefix.length + 10 > this.maxMessageLength) {
      return this.sendInSplitMessages(channel, message);
    }

    await this.sendRawMessage(
      channel,
      `${this.prefix}${this.isCodeBlock(message) ? this.formatCodeBlock(message) : message}`,
    );
  };

  protected abstract sendRawMessage(channel: T, message: string): Promise<void>;

  private sendInSplitMessages = async (channel: T, message: string) => {
    const isCodeBlock = this.isCodeBlock(message);

    // Trim the code block markup from the original message that will be split
    const toSplit = isCodeBlock
      ? message.substring(codeBlock.length, message.length - codeBlock.length)
      : message;

    // When splitting code blocks, we need to account for the length the code block markup needs
    const maxPartLen = isCodeBlock
      ? this.maxMessageLength - (codeBlock.length * 2 + 10)
      : this.maxMessageLength;

    await this.sendRawMessage(channel, this.prefix);

    for (const part of this.splitString(toSplit, maxPartLen)) {
      await this.sendRawMessage(
        channel,
        isCodeBlock
          ? this.formatCodeBlock(`${codeBlock}${part}${codeBlock}`)
          : part,
      );
    }
  };

  private selectChannel = (
    channel?: T,
    channelAlerts?: T,
    isAlert: boolean = false,
  ): T | undefined => (isAlert ? channelAlerts : channel) || channel;

  private formatCodeBlock = (message: string) => {
    message = message.replace(/```/, '```json\n');
    if (!message.startsWith('\n')) {
      message = `\n${message}`;
    }

    message = message.substring(0, message.length - codeBlock.length) + '\n```';

    return message;
  };

  private isCodeBlock = (message: string) => message.includes(codeBlock);

  private splitString = (toSplit: string, length: number): string[] => {
    const splitRegex = new RegExp(`[\\s\\S]{1,${length}}`, 'g');
    return toSplit.match(splitRegex) || [];
  };
}

export default NotificationClient;
