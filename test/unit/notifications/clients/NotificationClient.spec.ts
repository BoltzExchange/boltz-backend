import { randomBytes } from 'crypto';
import Logger from '../../../../lib/Logger';
import { codeBlock } from '../../../../lib/notifications/Markup';
import NotificationClient from '../../../../lib/notifications/clients/NotificationClient';

class TestNotificationClient extends NotificationClient {
  constructor(prefix: string, maxMessageLength: number) {
    super(
      'test',
      Logger.disabledLogger,
      {
        prefix,
      } as any,
      {},
      maxMessageLength,
    );

    this.channel = 'normal channel';
    this.channelAlerts = 'alert channel';
  }

  public init = async () => {};

  public destroy = () => {};

  protected sendRawMessage = jest.fn();
}

const getRandomString = (length: number) => {
  return randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .substring(0, length);
};

describe('NotificationClient', () => {
  const maxMessageLength = 1000;
  const client = new TestNotificationClient('unit', maxMessageLength);
  const prefix = client['prefix'];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    client.destroy();
  });

  test('should send messages with length shorter than or equal to limit in one part', async () => {
    let message = getRandomString(20);

    await client.sendMessage(message);

    expect(client['sendRawMessage']).toHaveBeenCalledTimes(1);
    expect(client['sendRawMessage']).toHaveBeenNthCalledWith(
      1,
      client['channel'],
      prefix + message,
    );

    message = getRandomString(maxMessageLength - prefix.length - 20);

    await client.sendMessage(message);

    expect(client['sendRawMessage']).toHaveBeenCalledTimes(2);
    expect(client['sendRawMessage']).toHaveBeenNthCalledWith(
      2,
      client['channel'],
      prefix + message,
    );
  });

  describe('should send messages with length longer than limit in multiple parts', () => {
    test('should only split prefix when possible', async () => {
      const message = getRandomString(maxMessageLength);
      await client.sendMessage(message);

      expect(client['sendRawMessage']).toHaveBeenCalledTimes(2);
      expect(client['sendRawMessage']).toHaveBeenNthCalledWith(
        1,
        client['channel'],
        prefix,
      );
      expect(client['sendRawMessage']).toHaveBeenNthCalledWith(
        2,
        client['channel'],
        message,
      );
    });

    test('should split message into multiple parts', async () => {
      const message = getRandomString(maxMessageLength + 1);

      await client.sendMessage(message);

      expect(client['sendRawMessage']).toHaveBeenCalledTimes(3);
      expect(client['sendRawMessage']).toHaveBeenNthCalledWith(
        1,
        client['channel'],
        prefix,
      );
      expect(client['sendRawMessage']).toHaveBeenNthCalledWith(
        2,
        client['channel'],
        message.substring(0, maxMessageLength),
      );
      expect(client['sendRawMessage']).toHaveBeenNthCalledWith(
        3,
        client['channel'],
        message.substring(maxMessageLength),
      );
    });

    test('should split code block messages', async () => {
      const message = `${codeBlock}${getRandomString(maxMessageLength + 1)}${codeBlock}`;

      await client.sendMessage(message);

      expect(client['sendRawMessage']).toHaveBeenCalledTimes(3);
      expect(client['sendRawMessage']).toHaveBeenNthCalledWith(
        1,
        client['channel'],
        prefix,
      );
      expect(client['sendRawMessage']).toHaveBeenNthCalledWith(
        2,
        client['channel'],
        `\n${codeBlock}json\n${message.substring(3, maxMessageLength - (codeBlock.length + 10))}\n${codeBlock}`,
      );
      expect(client['sendRawMessage']).toHaveBeenNthCalledWith(
        3,
        client['channel'],
        `\n${codeBlock}json\n${message.substring(maxMessageLength - (codeBlock.length + 10), message.length - 3)}\n${codeBlock}`,
      );
    });
  });

  test('should split strings into parts', () => {
    const splitString = client['splitString'];

    const splitLen = 2000;
    const randomString = getRandomString(splitLen * 21);

    const split = splitString(randomString, splitLen);

    for (let i = 0; i < split.length; i++) {
      const splitPart = split[i];

      expect(splitPart.length).toEqual(splitLen);
      expect(splitPart).toEqual(
        randomString.substring(splitLen * i, splitLen * (i + 1)),
      );
    }
  });

  describe('should send message to correct channel', () => {
    const message = 'msg';

    afterEach(() => {
      client['channelAlerts'] = 'alert channel';
    });

    test('should send message to normal channel by default', async () => {
      await client.sendMessage(message);

      expect(client['sendRawMessage']).toHaveBeenCalledTimes(1);
      expect(client['sendRawMessage']).toHaveBeenLastCalledWith(
        client['channel'],
        prefix + message,
      );
    });

    test('should send messages to normal channel', async () => {
      await client.sendMessage(message, false);

      expect(client['sendRawMessage']).toHaveBeenCalledTimes(1);
      expect(client['sendRawMessage']).toHaveBeenLastCalledWith(
        client['channel'],
        prefix + message,
      );
    });

    test('should send messages to normal channel when alert channel is not set', async () => {
      client['channelAlerts'] = undefined;

      await client.sendMessage(message, true);
      expect(client['sendRawMessage']).toHaveBeenCalledTimes(1);
      expect(client['sendRawMessage']).toHaveBeenLastCalledWith(
        client['channel'],
        prefix + message,
      );
    });

    test('should send messages to alert channel when it is set', async () => {
      await client.sendMessage(message, true);

      expect(client['sendRawMessage']).toHaveBeenCalledTimes(1);
      expect(client['sendRawMessage']).toHaveBeenLastCalledWith(
        client['channelAlerts'],
        prefix + message,
      );
    });
  });
});
