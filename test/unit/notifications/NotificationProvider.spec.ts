import bolt11 from 'bolt11';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { satoshisToSatcomma } from '../../../lib/DenominationConverter';
import Logger from '../../../lib/Logger';
import { CurrencyType, SwapType } from '../../../lib/consts/Enums';
import ChannelCreation from '../../../lib/db/models/ChannelCreation';
import ReverseSwap from '../../../lib/db/models/ReverseSwap';
import Swap from '../../../lib/db/models/Swap';
import { satToMsat } from '../../../lib/lightning/ChannelUtils';
import { Emojis } from '../../../lib/notifications/Markup';
import NotificationClient from '../../../lib/notifications/NotificationClient';
import NotificationProvider from '../../../lib/notifications/NotificationProvider';
import Service from '../../../lib/service/Service';
import Sidecar from '../../../lib/sidecar/Sidecar';
import WalletManager from '../../../lib/wallet/WalletManager';
import { Rsk } from '../../../lib/wallet/ethereum/EvmNetworks';
import { wait } from '../../Utils';
import {
  channelCreationExample,
  reverseSwapExample,
  swapExample,
} from './ExampleSwaps';

type successCallback = (args: {
  swap: Swap | ReverseSwap;
  channelCreation?: ChannelCreation;
}) => void;
type failureCallback = (args: {
  swap: Swap | ReverseSwap;
  reason: string;
}) => void;

let emitSwapSuccess: successCallback;
let emitSwapFailure: failureCallback;
let emitZeroConfDisabled: (symbol: string) => void;

const mockGetInfo = jest.fn().mockImplementation(() =>
  Promise.resolve({
    getChainsMap: () => [],
  }),
);

const mockGetBalance = jest.fn().mockImplementation(() =>
  Promise.resolve({
    getBalancesMap: () => {},
  }),
);

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
      currencies: new Map<string, any>([
        ['BTC', { type: CurrencyType.BitcoinLike }],
        ['LTC', { type: CurrencyType.BitcoinLike }],
        ['USDT', { type: CurrencyType.ERC20 }],
        ['somethingElse', { type: CurrencyType.ERC20 }],
      ]),
      lockupTransactionTracker: {
        on: (event: string, callback: any) => {
          switch (event) {
            case 'zeroConf.disabled':
              emitZeroConfDisabled = callback;
          }
        },
      },
      getInfo: mockGetInfo,
      getBalance: mockGetBalance,
    };
  });
});

const mockedService = <jest.Mock<Service>>(<any>Service);

const mockSendMessage = jest.fn().mockImplementation(async () => {});

jest.mock('../../../lib/notifications/NotificationClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      on: () => {},
      init: () => Promise.resolve(),
      sendMessage: mockSendMessage,
    };
  });
});

const mockedNotificationClient = <jest.Mock<NotificationClient>>(
  (<any>NotificationClient)
);

jest.mock('../../../lib/wallet/WalletManager', () => {
  return jest.fn().mockImplementation(() => {
    return {
      ethereumManagers: [
        {
          networkDetails: Rsk,
          hasSymbol: jest
            .fn()
            .mockImplementation((symbol) => symbol === 'USDT'),
        },
      ],
    };
  });
});

const MockedWalletManager = <jest.Mock<WalletManager>>(<any>WalletManager);

describe('NotificationProvider', () => {
  const swap = {
    type: SwapType.Submarine,
    ...swapExample,
  } as any as Swap;

  const channelCreation = {
    ...channelCreationExample,
  } as any as ChannelCreation;

  const reverseSwap = {
    type: SwapType.ReverseSubmarine,
    ...reverseSwapExample,
  } as any as ReverseSwap;

  const sidecar = {
    decodeInvoiceOrOffer: jest
      .fn()
      .mockImplementation(async (invoice: string) => {
        const dec = bolt11.decode(invoice);
        return { amountMsat: satToMsat(dec.satoshis!) };
      }),
  } as unknown as Sidecar;

  const config = {
    mattermostUrl: '',
    token: '',
    interval: 60,
    prefix: 'test',
    channel: 'test',
    otpsecretpath: `${__dirname}/otpSecret.dat`,
  };

  const walletManager = MockedWalletManager();
  const notificationProvider = new NotificationProvider(
    Logger.disabledLogger,
    sidecar,
    mockedService(),
    walletManager,
    config,
    mockedNotificationClient(),
    [],
    [],
  );

  beforeEach(() => {
    jest.clearAllMocks();
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

  test('should init', async () => {
    await notificationProvider.init();

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith('Started Boltz instance');

    expect(mockGetInfo).toHaveBeenCalledTimes(1);
    expect(mockGetBalance).toHaveBeenCalledTimes(1);
  });

  test('should send a notification after successful Swaps', async () => {
    emitSwapSuccess({ swap });
    await wait(5);

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      '**Swap BTC -> LTC :zap:**\n' +
        `ID: ${swap.id}\n` +
        `Pair: ${swap.pair}\n` +
        'Order side: buy\n' +
        `Onchain amount: ${satoshisToSatcomma(swap.onchainAmount!)} BTC\n` +
        `Lightning amount: ${satoshisToSatcomma(
          bolt11.decode(swap.invoice!).satoshis!,
        )} LTC\n` +
        `Fees earned: ${satoshisToSatcomma(swap.fee!)} LTC\n` +
        `Miner fees: ${satoshisToSatcomma(swap.minerFee!)} BTC\n` +
        `Routing fees: ${swap.routingFee! / 1000} sats` +
        NotificationProvider['trailingWhitespace'],
    );
  });

  test('should send a notification after failed Swaps', async () => {
    const failureReason = 'because';

    emitSwapFailure({ swap, reason: failureReason });
    await wait(5);

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      `**Swap BTC -> LTC :zap: failed: ${failureReason}**\n` +
        `ID: ${swap.id}\n` +
        `Pair: ${swap.pair}\n` +
        'Order side: buy\n' +
        `Onchain amount: ${satoshisToSatcomma(swap.onchainAmount!)} BTC\n` +
        `Lightning amount: ${satoshisToSatcomma(
          bolt11.decode(swap.invoice!).satoshis!,
        )} LTC\n` +
        `Invoice: ${swap.invoice}` +
        NotificationProvider['trailingWhitespace'],
    );
  });

  test('should send a notification after successful Reverse Swaps', async () => {
    emitSwapSuccess({ swap: reverseSwap });
    await wait(5);

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      '**Swap LTC :zap: -> BTC**\n' +
        `ID: ${reverseSwap.id}\n` +
        `Pair: ${reverseSwap.pair}\n` +
        'Order side: sell\n' +
        `Onchain amount: ${satoshisToSatcomma(
          reverseSwap.onchainAmount!,
        )} BTC\n` +
        `Lightning amount: ${satoshisToSatcomma(
          bolt11.decode(reverseSwap.invoice).satoshis!,
        )} LTC\n` +
        `Fees earned: ${satoshisToSatcomma(reverseSwap.fee)} BTC\n` +
        `Miner fees: ${satoshisToSatcomma(reverseSwap.minerFee!)} BTC` +
        NotificationProvider['trailingWhitespace'],
    );
  });

  test('should send a notification after failed Reverse Swaps', async () => {
    const failureReason = 'becauseReverse';

    emitSwapFailure({
      swap: reverseSwap,
      reason: failureReason,
    });
    await wait(5);

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenNthCalledWith(
      1,
      `**Swap LTC :zap: -> BTC failed: ${failureReason}**\n` +
        `ID: ${reverseSwap.id}\n` +
        `Pair: ${reverseSwap.pair}\n` +
        'Order side: sell\n' +
        `Onchain amount: ${satoshisToSatcomma(
          reverseSwap.onchainAmount!,
        )} BTC\n` +
        `Lightning amount: ${satoshisToSatcomma(
          bolt11.decode(reverseSwap.invoice).satoshis!,
        )} LTC\n` +
        `Miner fees: ${satoshisToSatcomma(reverseSwap.minerFee)} BTC` +
        NotificationProvider['trailingWhitespace'],
    );

    emitSwapFailure({
      swap: {
        ...reverseSwap,
        minerFee: undefined,
      } as any as ReverseSwap,
      reason: failureReason,
    });
    await wait(5);

    expect(mockSendMessage).toHaveBeenCalledTimes(2);
    expect(mockSendMessage).toHaveBeenNthCalledWith(
      2,
      `**Swap LTC :zap: -> BTC failed: ${failureReason}**\n` +
        `ID: ${reverseSwap.id}\n` +
        `Pair: ${reverseSwap.pair}\n` +
        'Order side: sell\n' +
        `Onchain amount: ${satoshisToSatcomma(
          reverseSwap.onchainAmount!,
        )} BTC\n` +
        `Lightning amount: ${satoshisToSatcomma(
          bolt11.decode(reverseSwap.invoice).satoshis!,
        )} LTC` +
        NotificationProvider['trailingWhitespace'],
    );
  });

  test('should send notification after successful Channel Creation Swap', async () => {
    emitSwapSuccess({ swap, channelCreation });
    await wait(5);

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      '**Swap BTC -> LTC :zap: :construction_site:**\n' +
        `ID: ${swap.id}\n` +
        `Pair: ${swap.pair}\n` +
        'Order side: buy\n' +
        `Onchain amount: ${satoshisToSatcomma(swap.onchainAmount!)} BTC\n` +
        `Lightning amount: ${satoshisToSatcomma(
          bolt11.decode(swap.invoice!).satoshis!,
        )} LTC\n` +
        `Fees earned: ${satoshisToSatcomma(swap.fee!)} LTC\n` +
        `Miner fees: ${satoshisToSatcomma(swap.minerFee!)} BTC\n` +
        `Routing fees: ${swap.routingFee! / 1000} sats\n\n` +
        '**Channel Creation:**\n' +
        `Private: ${channelCreation.private}\n` +
        `Inbound: ${channelCreation.inboundLiquidity}%\n` +
        `Node: ${channelCreation.nodePublicKey}\n` +
        `Funding: ${channelCreation.fundingTransactionId}:${channelCreation.fundingTransactionVout}` +
        NotificationProvider['trailingWhitespace'],
    );

    // Should skip the Channel Creation part in case no channel was opened
    emitSwapSuccess({
      swap,
      channelCreation: {
        ...channelCreation,
        // tslint:disable-next-line:no-null-keyword
        fundingTransactionId: null,
      } as any as ChannelCreation,
    });
    await wait(5);

    expect(mockSendMessage).toHaveBeenCalledTimes(2);
    expect(mockSendMessage).toHaveBeenNthCalledWith(
      2,
      '**Swap BTC -> LTC :zap:**\n' +
        `ID: ${swap.id}\n` +
        `Pair: ${swap.pair}\n` +
        'Order side: buy\n' +
        `Onchain amount: ${satoshisToSatcomma(swap.onchainAmount!)} BTC\n` +
        `Lightning amount: ${satoshisToSatcomma(
          bolt11.decode(swap.invoice!).satoshis!,
        )} LTC\n` +
        `Fees earned: ${satoshisToSatcomma(swap.fee!)} LTC\n` +
        `Miner fees: ${satoshisToSatcomma(swap.minerFee!)} BTC\n` +
        `Routing fees: ${swap.routingFee! / 1000} sats` +
        NotificationProvider['trailingWhitespace'],
    );
  });

  test('should send notification when 0-conf is disabled', async () => {
    const symbol = 'BTC';

    emitZeroConfDisabled(symbol);
    await wait(5);

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      `${Emojis.RotatingLight} **Disabled 0-conf for ${symbol}** ${Emojis.RotatingLight}`,
      true,
      true,
    );
  });

  test('should format failed swaps with no invoice', async () => {
    const failureReason = 'because';
    emitSwapFailure({
      swap: {
        ...swap,
        invoice: undefined,
      } as Swap,
      reason: failureReason,
    });
    await wait(5);

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      '**Swap BTC -> LTC :zap: failed: because**\n' +
        'ID: 123456\n' +
        'Pair: LTC/BTC\n' +
        'Order side: buy\n' +
        '** **',
    );
  });

  test.each`
    symbol             | expected
    ${'BTC'}           | ${'BTC'}
    ${'LTC'}           | ${'LTC'}
    ${'USDT'}          | ${'RBTC'}
    ${'somethingElse'} | ${''}
  `('should get miner fee symbol for $symbol', ({ symbol, expected }) => {
    expect(notificationProvider['getMinerFeeSymbol'](symbol)).toEqual(expected);
  });
});
