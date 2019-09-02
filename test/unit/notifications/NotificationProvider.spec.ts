import { unlinkSync, existsSync } from 'fs';
import { wait } from '../../Utils';
import Logger from '../../../lib/Logger';
import Swap from '../../../lib/db/models/Swap';
import Service from '../../../lib/service/Service';
import { getInvoiceAmt } from '../../../lib/Utils';
import { SwapUpdateEvent } from '../../../lib/consts/Enums';
import ReverseSwap from '../../../lib/db/models/ReverseSwap';
import { swapExample, reverseSwapExample } from './ExampleSwaps';
import BackupScheduler from '../../../lib/backup/BackupScheduler';
import DiscordClient from '../../../lib/notifications/DiscordClient';
import { satoshisToCoins } from '../../../lib/DenominationConverter';
import NotificationProvider from '../../../lib/notifications/NotificationProvider';

type successCallback = (swap: Swap | ReverseSwap) => void;
type failureCallback = (swap: Swap | ReverseSwap, reason: string) => void;

let emitSwapSuccess: successCallback;
let emitSwapFailure: failureCallback;

const mockGetInfo = jest.fn().mockImplementation(() => Promise.resolve({
  getChainsMap: () => [],
}));

const mockGetBalance = jest.fn().mockImplementation(() => Promise.resolve({
  getBalancesMap: () => {},
}));

jest.mock('../../../lib/service/Service', () => {
  return jest.fn().mockImplementation(() => {
    return {
      eventHandler: {
        on: (event: string, callback: successCallback | failureCallback) => {
          if (event === 'swap.success') {
            emitSwapSuccess = callback as successCallback;
          } else {
            emitSwapFailure = callback as failureCallback;
          }
        },
      },
      getInfo: mockGetInfo,
      getBalance: mockGetBalance,
    };
  });
});

const mockedService = <jest.Mock<Service>><any>Service;

jest.mock('../../../lib/backup/BackupScheduler', () => {
  return jest.fn().mockImplementation(() => {
    return {};
  });
});

const mockedBackupScheduler = <jest.Mock<BackupScheduler>><any>BackupScheduler;

const mockSendMessage = jest.fn().mockImplementation(() => Promise.resolve());

jest.mock('../../../lib/notifications/DiscordClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      on: () => {},
      init: () => Promise.resolve(),
      sendMessage: mockSendMessage,
    };
  });
});

const mockedDiscordClient = <jest.Mock<DiscordClient>><any>DiscordClient;

describe('NotificationProvider', () => {
  const swap = {
    ...swapExample,
  } as any as Swap;

  const mockReverseSwap = (status: SwapUpdateEvent) => {
    return {
      ...reverseSwapExample,
      status,
    } as any as ReverseSwap;
  };

  const config = {
    token: '',
    interval: 60,
    prefix: 'test',
    channel: 'test',
    otpsecretpath: `${__dirname}/otpSecret.dat`,
  };

  const notificationProvider = new NotificationProvider(
    Logger.disabledLogger,
    mockedService(),
    mockedBackupScheduler(),
    config,
    [],
  );

  notificationProvider['discord'] = mockedDiscordClient();

  beforeEach(() => {
    mockSendMessage.mockClear();
  });

  test('should init', async () => {
    await notificationProvider.init();

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith('Started Boltz instance');

    expect(mockGetInfo).toHaveBeenCalledTimes(1);
    expect(mockGetBalance).toHaveBeenCalledTimes(1);
  });

  test('should send a notification after successful (reverse) swaps', async () => {
    emitSwapSuccess(swap);
    await wait(5);

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      // tslint:disable-next-line: prefer-template
      '**Swap**\n' +
      `ID: ${swap.id}\n` +
      `Pair: ${swap.pair}\n` +
      'Order side: buy\n' +
      `Onchain amount: ${satoshisToCoins(swap.onchainAmount!)} BTC\n` +
      `Lightning amount: ${satoshisToCoins(getInvoiceAmt(swap.invoice))} LTC\n` +
      `Fees earned: ${satoshisToCoins(swap.fee)} BTC\n` +
      `Miner fees: ${satoshisToCoins(swap.minerFee!)} BTC\n` +
      `Routing fees: ${swap.routingFee! / 1000} litoshi` +
      NotificationProvider['trailingWhitespace'],
    );

    const reverseSwap = mockReverseSwap(reverseSwapExample.status);

    emitSwapSuccess(reverseSwap);
    await wait(5);

    expect(mockSendMessage).toHaveBeenCalledTimes(2);
    expect(mockSendMessage).toHaveBeenNthCalledWith(2,
      // tslint:disable-next-line: prefer-template
      '**Reverse swap**\n' +
      `ID: ${reverseSwap.id}\n` +
      `Pair: ${reverseSwap.pair}\n` +
      'Order side: sell\n' +
      `Onchain amount: ${satoshisToCoins(reverseSwap.onchainAmount!)} BTC\n` +
      `Lightning amount: ${satoshisToCoins(getInvoiceAmt(reverseSwap.invoice))} LTC\n` +
      `Fees earned: ${satoshisToCoins(reverseSwap.fee)} BTC\n` +
      `Miner fees: ${satoshisToCoins(reverseSwap.minerFee!)} BTC` +
      NotificationProvider['trailingWhitespace'],
    );
  });

  test('should send a notification after failed (reverse) swaps', async () => {
    const failureReason = 'because';

    emitSwapFailure(swap, failureReason);
    await wait(5);

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      // tslint:disable-next-line: prefer-template
      `**Swap failed: ${failureReason}**\n` +
      `ID: ${swap.id}\n` +
      `Pair: ${swap.pair}\n` +
      'Order side: buy\n' +
      `Onchain amount: ${satoshisToCoins(swap.onchainAmount!)} BTC\n` +
      `Lightning amount: ${satoshisToCoins(getInvoiceAmt(swap.invoice))} LTC\n` +
      `Invoice: ${swap.invoice}` +
      NotificationProvider['trailingWhitespace'],
    );

    const reverseSwap = mockReverseSwap(SwapUpdateEvent.TransactionRefunded);

    emitSwapFailure(reverseSwap, failureReason);
    await wait(5);

    expect(mockSendMessage).toHaveBeenCalledTimes(2);
    expect(mockSendMessage).toHaveBeenNthCalledWith(2,
      // tslint:disable-next-line: prefer-template
      `**Reverse swap failed: ${failureReason}**\n` +
      `ID: ${reverseSwap.id}\n` +
      `Pair: ${reverseSwap.pair}\n` +
      'Order side: sell\n' +
      `Onchain amount: ${satoshisToCoins(reverseSwap.onchainAmount!)} BTC\n` +
      `Lightning amount: ${satoshisToCoins(getInvoiceAmt(reverseSwap.invoice))} LTC\n` +
      `Miner fees: ${satoshisToCoins(reverseSwap.minerFee)} BTC` +
      NotificationProvider['trailingWhitespace'],
    );
  });

  afterAll(() => {
    notificationProvider.disconnect();

    if (existsSync(config.otpsecretpath)) {
      unlinkSync(config.otpsecretpath);
    }
  });
});
