/* tslint:disable: prefer-template */

import { join } from 'path';
import { unlinkSync, existsSync } from 'fs';
import { wait } from '../../Utils';
import Logger from '../../../lib/Logger';
import Swap from '../../../lib/db/models/Swap';
import Service from '../../../lib/service/Service';
import { getInvoiceAmt } from '../../../lib/Utils';
import ReverseSwap from '../../../lib/db/models/ReverseSwap';
import { swapExample, reverseSwapExample } from './ExampleSwaps';
import BackupScheduler from '../../../lib/backup/BackupScheduler';
import DiscordClient from '../../../lib/notifications/DiscordClient';
import { satoshisToCoins } from '../../../lib/DenominationConverter';
import NotificationProvider from '../../../lib/notifications/NotificationProvider';

type successCallback = (swap: Swap | ReverseSwap, isReverse: boolean) => void;
type failureCallback = (swap: Swap | ReverseSwap, isReverse: boolean, reason: string) => void;

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
        on: (event: string, callback: any) => {
          if (event === 'swap.success') {
            emitSwapSuccess = callback;
          } else {
            emitSwapFailure = callback;
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

  const reverseSwap = {
    ...reverseSwapExample,
  } as any as ReverseSwap;

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
    emitSwapSuccess(swap, false);
    await wait(5);

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      '**Swap BTC -> LTC :zap:**\n' +
      `ID: ${swap.id}\n` +
      `Pair: ${swap.pair}\n` +
      'Order side: buy\n' +
      `Onchain amount: ${satoshisToCoins(swap.onchainAmount!)} BTC\n` +
      `Lightning amount: ${satoshisToCoins(getInvoiceAmt(swap.invoice!))} LTC\n` +
      `Fees earned: ${satoshisToCoins(swap.fee!)} BTC\n` +
      `Miner fees: ${satoshisToCoins(swap.minerFee!)} BTC\n` +
      `Routing fees: ${swap.routingFee! / 1000} litoshi` +
      NotificationProvider['trailingWhitespace'],
    );

    emitSwapSuccess(reverseSwap, true);
    await wait(5);

    expect(mockSendMessage).toHaveBeenCalledTimes(2);
    expect(mockSendMessage).toHaveBeenNthCalledWith(2,
      '**Swap LTC :zap: -> BTC**\n' +
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

    emitSwapFailure(swap, false, failureReason);
    await wait(5);

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      `**Swap BTC -> LTC :zap: failed: ${failureReason}**\n` +
      `ID: ${swap.id}\n` +
      `Pair: ${swap.pair}\n` +
      'Order side: buy\n' +
      `Onchain amount: ${satoshisToCoins(swap.onchainAmount!)} BTC\n` +
      `Lightning amount: ${satoshisToCoins(getInvoiceAmt(swap.invoice!))} LTC\n` +
      `Invoice: ${swap.invoice}` +
      NotificationProvider['trailingWhitespace'],
    );

    emitSwapFailure(reverseSwap, true, failureReason);
    await wait(5);

    expect(mockSendMessage).toHaveBeenCalledTimes(2);
    expect(mockSendMessage).toHaveBeenNthCalledWith(2,
      `**Swap LTC :zap: -> BTC failed: ${failureReason}**\n` +
      `ID: ${reverseSwap.id}\n` +
      `Pair: ${reverseSwap.pair}\n` +
      'Order side: sell\n' +
      `Onchain amount: ${satoshisToCoins(reverseSwap.onchainAmount!)} BTC\n` +
      `Lightning amount: ${satoshisToCoins(getInvoiceAmt(reverseSwap.invoice))} LTC\n` +
      `Miner fees: ${satoshisToCoins(reverseSwap.minerFee)} BTC` +
      NotificationProvider['trailingWhitespace'],
    );

    emitSwapFailure({
      ...reverseSwap,
      minerFee: undefined,
    } as any as ReverseSwap, true, failureReason);
    await wait(5);

    expect(mockSendMessage).toHaveBeenCalledTimes(3);
    expect(mockSendMessage).toHaveBeenNthCalledWith(3,
      `**Swap LTC :zap: -> BTC failed: ${failureReason}**\n` +
      `ID: ${reverseSwap.id}\n` +
      `Pair: ${reverseSwap.pair}\n` +
      'Order side: sell\n' +
      `Onchain amount: ${satoshisToCoins(reverseSwap.onchainAmount!)} BTC\n` +
      `Lightning amount: ${satoshisToCoins(getInvoiceAmt(reverseSwap.invoice))} LTC` +
      NotificationProvider['trailingWhitespace'],
    );
  });

  test('should format failed swaps with no invoice', () => {
    const failureReason = 'because';
    emitSwapFailure({
      ...swap,
      invoice: undefined,
    } as Swap, false, failureReason);

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      '**Swap BTC -> LTC :zap: failed: because**\n' +
      'ID: 123456\n' +
      'Pair: LTC/BTC\n' +
      'Order side: buy\n' +
      '** **',
    );
  });

  test('should format numbers to strings in decimal notation', () => {
    const numberToDecimal = notificationProvider['numberToDecimal'];

    expect(numberToDecimal(1)).toEqual('1');
    expect(numberToDecimal(0.0001)).toEqual('0.0001');
    expect(numberToDecimal(1e-6)).toEqual('0.000001');
    expect(numberToDecimal(1e-7)).toEqual('0.0000001');
    expect(numberToDecimal(10e-8)).toEqual('0.0000001');
    expect(numberToDecimal(12e-8)).toEqual('0.00000012');
  });

  afterAll(() => {
    notificationProvider.disconnect();

    if (existsSync(config.otpsecretpath)) {
      unlinkSync(config.otpsecretpath);
    }

    const uriPath = join(__dirname, 'otpUri.txt');

    if (existsSync(uriPath)) {
      unlinkSync(uriPath);
    }
  });
});
