/* tslint:disable:prefer-template */

import { unlinkSync, existsSync } from 'fs';
import { wait } from '../../Utils';
import Logger from '../../../lib/Logger';
import Swap from '../../../lib/db/models/Swap';
import Service from '../../../lib/service/Service';
import { getInvoiceAmt } from '../../../lib/Utils';
import { SwapType } from '../../../lib/consts/Enums';
import ReverseSwap from '../../../lib/db/models/ReverseSwap';
import { GenericSwap } from '../../../lib/service/EventHandler';
import BackupScheduler from '../../../lib/backup/BackupScheduler';
import DiscordClient from '../../../lib/notifications/DiscordClient';
import { satoshisToCoins } from '../../../lib/DenominationConverter';
import ChainToChainSwap from '../../../lib/db/models/ChainToChainSwap';
import NotificationProvider from '../../../lib/notifications/NotificationProvider';
import { swapExample, reverseSwapExample, chainToChainSwapExample } from './ExampleSwaps';

type successCallback = (swap: GenericSwap, type: SwapType) => void;
type failureCallback = (swap: GenericSwap, type: SwapType, reason: string) => void;

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

  const reverseSwap = {
    ...reverseSwapExample,
  } as any as ReverseSwap;

  const chainToChainSwap = {
    ...chainToChainSwapExample,
  } as any as ChainToChainSwap;

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

  test('should send a notification after successful submarine swaps', async () => {
    emitSwapSuccess(swap, SwapType.Submarine);
    await wait(5);

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      '**Swap BTC -> :zap: LTC**\n' +
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
  });

  test('should send a notification after failed submarine swaps', async () => {
    const failureReason = 'because';

    emitSwapFailure({
      ...swap,
      minerFee: undefined,
    } as Swap, SwapType.Submarine, failureReason);
    await wait(5);

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      `**Swap BTC -> :zap: LTC failed: ${failureReason}**\n` +
      `ID: ${swap.id}\n` +
      `Pair: ${swap.pair}\n` +
      'Order side: buy\n' +
      `Onchain amount: ${satoshisToCoins(swap.onchainAmount!)} BTC\n` +
      `Lightning amount: ${satoshisToCoins(getInvoiceAmt(swap.invoice))} LTC\n` +
      `Invoice: ${swap.invoice}` +
      NotificationProvider['trailingWhitespace'],
    );
  });

  test('should send a notification after successful reverse submarine swaps', async () => {
    emitSwapSuccess(reverseSwap, SwapType.ReverseSubmarine);
    await wait(5);

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      '**Swap :zap: LTC -> BTC**\n' +
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

  test('should send a notification after failed reverse submarine swaps', async () => {
    const failureReason = 'because';

    emitSwapFailure(reverseSwap, SwapType.ReverseSubmarine, failureReason);
    await wait(5);

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      `**Swap :zap: LTC -> BTC failed: ${failureReason}**\n` +
      `ID: ${reverseSwap.id}\n` +
      `Pair: ${reverseSwap.pair}\n` +
      'Order side: sell\n' +
      `Onchain amount: ${satoshisToCoins(reverseSwap.onchainAmount!)} BTC\n` +
      `Lightning amount: ${satoshisToCoins(getInvoiceAmt(reverseSwap.invoice))} LTC\n` +
      `Miner fees: ${satoshisToCoins(reverseSwap.minerFee)} BTC` +
      NotificationProvider['trailingWhitespace'],
    );
  });

  test('should send a notification after successful chain to chain swaps', async () => {
    emitSwapSuccess(chainToChainSwap, SwapType.ChainToChain);
    await wait(5);

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      '**Swap LTC -> BTC**\n' +
      `ID: ${chainToChainSwap.id}\n` +
      `Pair: ${chainToChainSwap.pair}\n` +
      'Order side: sell\n' +
      `Amount sent: ${satoshisToCoins(chainToChainSwap.sendingAmount)} BTC\n` +
      `Amount received: ${satoshisToCoins(chainToChainSwap.receivingAmount)} LTC\n` +
      'Miner fees:\n' +
      `  - ${satoshisToCoins(chainToChainSwap.sendingMinerFee!)} BTC\n` +
      `  - ${satoshisToCoins(chainToChainSwap.receivingMinerFee!)} LTC\n` +
      `Fees earned: ${satoshisToCoins(chainToChainSwap.fee)} LTC` +
      NotificationProvider['trailingWhitespace'],
    );
  });

  test('should send a notification after failed chain to chain swaps', async () => {
    const failureReason = 'because';

    emitSwapFailure(chainToChainSwap, SwapType.ChainToChain, failureReason);
    await wait(5);

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      `**Swap LTC -> BTC failed: ${failureReason}**\n` +
      `ID: ${chainToChainSwap.id}\n` +
      `Pair: ${chainToChainSwap.pair}\n` +
      'Order side: sell\n' +
      `Amount sent: ${satoshisToCoins(chainToChainSwap.sendingAmount)} BTC\n` +
      `Amount received: ${satoshisToCoins(chainToChainSwap.receivingAmount)} LTC\n` +
      'Miner fees:\n' +
      `  - ${satoshisToCoins(chainToChainSwap.sendingMinerFee!)} BTC\n` +
      `  - ${satoshisToCoins(chainToChainSwap.receivingMinerFee!)} LTC` +
      NotificationProvider['trailingWhitespace'],
    );
  });

  afterAll(() => {
    notificationProvider.disconnect();

    if (existsSync(config.otpsecretpath)) {
      unlinkSync(config.otpsecretpath);
      unlinkSync(`${__dirname}/otpUri.txt`);
    }
  });
});
