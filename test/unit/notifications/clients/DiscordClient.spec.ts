import { randomBytes } from 'crypto';
import { NotificationConfig } from '../../../../lib/Config';
import Logger from '../../../../lib/Logger';
import { codeBlock } from '../../../../lib/notifications/Markup';
import DiscordClient from '../../../../lib/notifications/clients/DiscordClient';

const mockSend = jest.fn().mockImplementation(async () => {});

describe('DiscordClient', () => {
  const client = new DiscordClient(Logger.disabledLogger, {
    prefix: 'unit',
  } as NotificationConfig);

  const prefix = client['prefix'];
  const maxMessageLen = DiscordClient['maxMessageLen'];

  beforeAll(() => {
    client['channel'] = {
      send: mockSend,
    } as any;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send messages with length shorter than or equal to limit in one part', async () => {
    let message = getRandomString(20);

    await client.sendMessage(message);

    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend).toHaveBeenNthCalledWith(1, prefix + message);

    message = getRandomString(maxMessageLen - prefix.length);

    await client.sendMessage(message);

    expect(mockSend).toHaveBeenCalledTimes(2);
    expect(mockSend).toHaveBeenNthCalledWith(2, prefix + message);
  });

  it('should send messages with length longer than limit in multiple parts', async () => {
    let message = getRandomString(maxMessageLen);

    await client.sendMessage(message);

    expect(mockSend).toHaveBeenCalledTimes(2);
    expect(mockSend).toHaveBeenNthCalledWith(1, prefix);
    expect(mockSend).toHaveBeenNthCalledWith(2, message);

    message = getRandomString(maxMessageLen + 1);

    await client.sendMessage(message);

    expect(mockSend).toHaveBeenCalledTimes(5);
    expect(mockSend).toHaveBeenNthCalledWith(3, prefix);
    expect(mockSend).toHaveBeenNthCalledWith(
      4,
      message.substring(0, maxMessageLen),
    );
    expect(mockSend).toHaveBeenNthCalledWith(
      5,
      message.substring(maxMessageLen),
    );

    // Code blocks
    message = `${codeBlock}${getRandomString(maxMessageLen + 1)}${codeBlock}`;

    await client.sendMessage(message);

    expect(mockSend).toHaveBeenCalledTimes(8);
    expect(mockSend).toHaveBeenNthCalledWith(6, prefix);
    expect(mockSend).toHaveBeenNthCalledWith(
      7,
      `${message.substring(0, maxMessageLen - codeBlock.length)}${codeBlock}`,
    );
    expect(mockSend).toHaveBeenNthCalledWith(
      8,
      `${codeBlock}${message.substring(maxMessageLen - codeBlock.length)}`,
    );
  });

  it('should split strings into parts', () => {
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

  it('should send message to correct channel', async () => {
    const message = 'msg';

    await client.sendMessage(message);
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend).toHaveBeenLastCalledWith(prefix + message);

    await client.sendMessage(message, false);
    expect(mockSend).toHaveBeenCalledTimes(2);
    expect(mockSend).toHaveBeenLastCalledWith(prefix + message);

    await client.sendMessage(message, true);
    expect(mockSend).toHaveBeenCalledTimes(3);
    expect(mockSend).toHaveBeenLastCalledWith(prefix + message);

    client['channelAlerts'] = {
      send: jest.fn(),
    } as any;

    await client.sendMessage(message, false);
    expect(mockSend).toHaveBeenCalledTimes(4);
    expect(mockSend).toHaveBeenLastCalledWith(prefix + message);

    await client.sendMessage(message, true);
    expect(mockSend).toHaveBeenCalledTimes(4);
    expect(client['channelAlerts']?.send).toHaveBeenCalledTimes(1);
    expect(client['channelAlerts']?.send).toHaveBeenLastCalledWith(
      prefix + message,
    );

    client['channelAlerts'] = undefined;
  });

  afterAll(() => {
    client.destroy();
  });
});

const getRandomString = (length: number) => {
  return randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .substring(0, length);
};
