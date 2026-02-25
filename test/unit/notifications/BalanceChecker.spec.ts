import type { BaseCurrencyConfig, CurrencyConfig } from '../../../lib/Config';
import { satoshisToSatcomma } from '../../../lib/DenominationConverter';
import Logger from '../../../lib/Logger';
import { liquidSymbol } from '../../../lib/consts/LiquidTypes';
import BalanceChecker, {
  BalanceType,
} from '../../../lib/notifications/BalanceChecker';
import { Emojis } from '../../../lib/notifications/Markup';
import NotificationClient from '../../../lib/notifications/NotificationClient';
import { Balances, GetBalanceResponse } from '../../../lib/proto/boltzrpc_pb';
import Service from '../../../lib/service/Service';

let mockGetBalanceResponse: any = null;
const lndNodeId = 'lnd-1';
const clnNodeId = 'cln-1';
const mockCurrencies = new Map<string, any>();
const mockGetBalance = jest.fn().mockImplementation(async () => {
  return mockGetBalanceResponse;
});

jest.mock('../../../lib/service/Service', () => {
  return jest.fn().mockImplementation(() => ({
    getBalance: mockGetBalance,
    currencies: mockCurrencies,
  }));
});

const MockedService = <jest.Mock<Service>>(<any>Service);

const mockSendMessage = jest.fn().mockResolvedValue(undefined);

jest.mock('../../../lib/notifications/NotificationClient', () => {
  return jest.fn().mockImplementation(() => ({
    sendMessage: mockSendMessage,
  }));
});

const MockedNotificationClient = <jest.Mock<NotificationClient>>(
  (<any>NotificationClient)
);

describe('BalanceChecker', () => {
  const btcCurrency = {
    symbol: 'BTC',

    minWalletBalance: 10000000,

    minLocalBalance: 25000000,
    minRemoteBalance: 24000000,
  } as any as CurrencyConfig;

  const usdtCurrency = {
    symbol: 'USDT',

    maxWalletBalance: 200000000000,
    minWalletBalance: 100000000000,
  } as any as CurrencyConfig;

  let checker = new BalanceChecker(
    Logger.disabledLogger,
    new MockedService(),
    new MockedNotificationClient(),
    [btcCurrency],
    [usdtCurrency],
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrencies.clear();
    mockCurrencies.set('BTC', {
      lndClients: new Map([[lndNodeId, { id: lndNodeId }]]),
      clnClient: { id: clnNodeId },
    });

    // Reset the BalanceChecker instance
    checker = new BalanceChecker(
      Logger.disabledLogger,
      new MockedService(),
      new MockedNotificationClient(),
      [btcCurrency],
      [usdtCurrency],
    );
  });

  test('should sanitize the liquid config', () => {
    const liquidConfig = {
      minWalletBalance: 1_000,
      some: 'liquidRelatedStuff',
    } as unknown as BaseCurrencyConfig;
    const check = new BalanceChecker(
      Logger.disabledLogger,
      new MockedService(),
      new MockedNotificationClient(),
      [btcCurrency, liquidConfig],
      [],
    );

    expect(check['currencies'].length).toEqual(2);
    expect(check['currencies'][0]).toEqual(btcCurrency);
    expect(check['currencies'][1]).toEqual({
      ...liquidConfig,
      symbol: liquidSymbol,
    });
  });

  test('should ignore undefined configs', () => {
    const check = new BalanceChecker(
      Logger.disabledLogger,
      new MockedService(),
      new MockedNotificationClient(),
      [
        undefined,
        btcCurrency,
        undefined,
        {},
        { minWalletBalance: undefined } as any,
      ],
      [],
    );
    expect(check['currencies'].length).toEqual(1);
    expect(check['currencies'][0]).toEqual(btcCurrency);
  });

  test('should check all currencies', async () => {
    const mockCheckCurrency = jest.fn().mockResolvedValue(undefined);
    checker['checkCurrency'] = mockCheckCurrency;

    const btcWalletBalance = new Balances.WalletBalance();
    btcWalletBalance.setConfirmed(1);

    const btcLightningBalance = new Balances.LightningBalance();
    btcLightningBalance.setLocal(2);
    btcLightningBalance.setRemote(3);

    const btcBalance = new Balances();
    btcBalance.getWalletsMap().set('Core', btcWalletBalance);
    btcBalance.getLightningMap().set(lndNodeId, btcLightningBalance);

    const usdtWalletBalance = new Balances.WalletBalance();
    usdtWalletBalance.setConfirmed(123);

    const usdtBalance = new Balances();
    usdtBalance.getWalletsMap().set('USDT', usdtWalletBalance);

    mockGetBalanceResponse = new GetBalanceResponse();
    mockGetBalanceResponse.getBalancesMap().set(btcCurrency.symbol, btcBalance);
    mockGetBalanceResponse
      .getBalancesMap()
      .set(usdtCurrency.symbol, usdtBalance);

    await checker.check();

    expect(mockCheckCurrency).toHaveBeenCalledTimes(2);
    expect(mockCheckCurrency).toHaveBeenNthCalledWith(
      1,
      btcCurrency,
      btcBalance.toObject(),
    );
    expect(mockCheckCurrency).toHaveBeenNthCalledWith(
      2,
      usdtCurrency,
      usdtBalance.toObject(),
    );
  });

  test('should check balances of currency', async () => {
    const mockCheckBalance = jest.fn().mockResolvedValue(undefined);
    checker['checkBalance'] = mockCheckBalance;

    const checkCurrency = checker['checkCurrency'];

    // Currency with lightning
    await checkCurrency(btcCurrency, {
      walletsMap: [
        [
          'Core',
          {
            confirmed: 1,
            unconfirmed: 0,
          },
        ],
      ],
      lightningMap: [
        [
          lndNodeId,
          {
            local: 2,
            remote: 3,
          },
        ],
      ],
    });

    expect(mockCheckBalance).toHaveBeenCalledTimes(3);
    expect(mockCheckBalance).toHaveBeenNthCalledWith(
      1,
      btcCurrency,
      'Core',
      BalanceType.Wallet,
      1,
      true,
    );
    expect(mockCheckBalance).toHaveBeenNthCalledWith(
      2,
      btcCurrency,
      lndNodeId,
      BalanceType.ChannelLocal,
      2,
    );
    expect(mockCheckBalance).toHaveBeenNthCalledWith(
      3,
      btcCurrency,
      lndNodeId,
      BalanceType.ChannelRemote,
      3,
    );

    // Currency without lightning
    await checkCurrency(usdtCurrency, {
      walletsMap: [
        [
          'Core',
          {
            confirmed: 123,
            unconfirmed: 0,
          },
        ],
      ],
      lightningMap: [],
    });

    expect(mockCheckBalance).toHaveBeenCalledTimes(4);
    expect(mockCheckBalance).toHaveBeenNthCalledWith(
      4,
      usdtCurrency,
      'Core',
      BalanceType.Wallet,
      123,
      true,
    );
  });

  test('should check balance', () => {
    const service = 'Core';
    const currency = { ...btcCurrency, preferredWallet: 'core' } as any;
    const checkBalance = checker['checkBalance'];

    /*
     * Wallet alerts
     */

    expect(checker['walletBalanceAlerts'].size).toEqual(0);

    // Should ignore when in bounds
    checkBalance(
      currency,
      service,
      BalanceType.Wallet,
      btcCurrency.minWalletBalance,
    );

    expect(checker['walletBalanceAlerts'].size).toEqual(0);
    expect(mockSendMessage).not.toHaveBeenCalled();

    // Should send message when getting out of bounds
    checkBalance(
      currency,
      service,
      BalanceType.Wallet,
      btcCurrency.minWalletBalance - 1,
    );

    expect(checker['walletBalanceAlerts'].size).toEqual(1);
    expect(
      checker['walletBalanceAlerts'].has(`${btcCurrency.symbol}${service}`),
    ).toEqual(true);
    expect(mockSendMessage).toHaveBeenCalledTimes(1);

    // Should send message when getting in bounds again
    checkBalance(
      currency,
      service,
      BalanceType.Wallet,
      Number.MAX_SAFE_INTEGER - 1,
    );

    expect(checker['walletBalanceAlerts'].size).toEqual(0);
    expect(mockSendMessage).toHaveBeenCalledTimes(2);

    // Should also check upper bounds
    checkBalance(
      usdtCurrency,
      service,
      BalanceType.Wallet,
      usdtCurrency.maxWalletBalance! + 1,
      true,
    );

    expect(checker['walletBalanceAlerts'].size).toEqual(1);
    expect(
      checker['walletBalanceAlerts'].has(`${usdtCurrency.symbol}${service}`),
    ).toEqual(true);
    expect(mockSendMessage).toHaveBeenCalledTimes(3);

    /*
     * Channel balance alerts
     */

    // Local balances
    checkBalance(
      btcCurrency,
      service,
      BalanceType.ChannelLocal,
      btcCurrency.minLocalBalance - 1,
    );
    expect(checker['localBalanceAlerts'].size).toEqual(1);
    expect(
      checker['localBalanceAlerts'].has(`${btcCurrency.symbol}${service}`),
    ).toEqual(true);
    expect(mockSendMessage).toHaveBeenCalledTimes(4);

    checkBalance(
      btcCurrency,
      service,
      BalanceType.ChannelLocal,
      btcCurrency.minLocalBalance,
    );
    expect(checker['localBalanceAlerts'].size).toEqual(0);
    expect(mockSendMessage).toHaveBeenCalledTimes(5);

    // Remote balances
    checkBalance(
      btcCurrency,
      service,
      BalanceType.ChannelRemote,
      btcCurrency.minRemoteBalance - 1,
    );
    expect(checker['remoteBalanceAlerts'].size).toEqual(1);
    expect(
      checker['remoteBalanceAlerts'].has(`${btcCurrency.symbol}${service}`),
    ).toEqual(true);
    expect(mockSendMessage).toHaveBeenCalledTimes(6);

    checkBalance(
      btcCurrency,
      service,
      BalanceType.ChannelRemote,
      btcCurrency.minRemoteBalance,
    );
    expect(checker['remoteBalanceAlerts'].size).toEqual(0);
    expect(mockSendMessage).toHaveBeenCalledTimes(7);
  });

  test('should send alerts', async () => {
    const service = 'Core';
    const sendAlert = checker['sendAlert'];

    // Wallet alerts
    await sendAlert(
      btcCurrency,
      BalanceType.Wallet,
      service,
      true,
      true,
      999999999,
    );
    expect(mockSendMessage).toHaveBeenNthCalledWith(
      1,
      `:white_check_mark: BTC ${service} wallet balance of 9.99,999,999 is in bounds again :white_check_mark:`,
      true,
      false,
    );

    await sendAlert(
      btcCurrency,
      BalanceType.Wallet,
      service,
      false,
      true,
      99999999,
    );
    expect(mockSendMessage).toHaveBeenNthCalledWith(
      2,
      `:rotating_light: **BTC ${service} wallet balance is out of bounds** :rotating_light:\n` +
        '  Balance: 0.99,999,999\n' +
        '    Min: 0.10,000,000',
      true,
      true,
    );

    await sendAlert(
      usdtCurrency,
      BalanceType.Wallet,
      service,
      true,
      true,
      150000000000,
    );
    expect(mockSendMessage).toHaveBeenNthCalledWith(
      3,
      `:white_check_mark: USDT ${service} wallet balance of 1500.00,000,000 is in bounds again :white_check_mark:`,
      true,
      false,
    );

    await sendAlert(
      usdtCurrency,
      BalanceType.Wallet,
      service,
      false,
      true,

      10000000000,
    );
    expect(mockSendMessage).toHaveBeenNthCalledWith(
      4,
      `:rotating_light: **USDT ${service} wallet balance is out of bounds** :rotating_light:\n` +
        '  Balance: 100.00,000,000\n' +
        '    Max: 2000.00,000,000\n' +
        '    Min: 1000.00,000,000',
      true,
      true,
    );

    // Channel alerts
    await sendAlert(
      btcCurrency,
      BalanceType.ChannelLocal,
      service,
      true,
      true,

      25000001,
    );
    expect(mockSendMessage).toHaveBeenNthCalledWith(
      5,
      `:white_check_mark: BTC ${service} local channel balance of 0.25,000,001 is more than expected 0.25,000,000 again :white_check_mark:`,
      true,
      false,
    );

    await sendAlert(
      btcCurrency,
      BalanceType.ChannelRemote,
      service,
      true,
      true,
      25000001,
    );
    expect(mockSendMessage).toHaveBeenNthCalledWith(
      6,
      `:white_check_mark: BTC ${service} remote channel balance of 0.25,000,001 is more than expected 0.24,000,000 again :white_check_mark:`,
      true,
      false,
    );

    await sendAlert(
      btcCurrency,
      BalanceType.ChannelLocal,
      service,
      false,
      true,
      20000000,
    );
    expect(mockSendMessage).toHaveBeenNthCalledWith(
      7,
      `:rotating_light: **BTC ${service} local channel balance of 0.20,000,000 is less than expected 0.25,000,000** :rotating_light:`,
      true,
      true,
    );

    await sendAlert(
      btcCurrency,
      BalanceType.ChannelRemote,
      service,
      false,
      true,
      20000000,
    );
    expect(mockSendMessage).toHaveBeenNthCalledWith(
      8,
      `:rotating_light: **BTC ${service} remote channel balance of 0.20,000,000 is less than expected 0.24,000,000** :rotating_light:`,
      true,
      true,
    );
  });

  test('should detect if it is the only wallet', async () => {
    const mockedCheckBalance = jest.fn();
    checker['checkBalance'] = mockedCheckBalance;

    await checker['checkCurrency'](btcCurrency, {
      walletsMap: [
        [
          'Core',
          {
            confirmed: 1,
            unconfirmed: 0,
          },
        ],
      ],
      lightningMap: [],
    });

    expect(mockedCheckBalance).toHaveBeenCalledTimes(1);
    expect(mockedCheckBalance).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      true,
    );

    await checker['checkCurrency'](btcCurrency, {
      walletsMap: [
        [
          'Core',
          {
            confirmed: 1,
            unconfirmed: 0,
          },
        ],
        [
          lndNodeId,
          {
            confirmed: 2,
            unconfirmed: 1,
          },
        ],
      ],
      lightningMap: [],
    });

    expect(mockedCheckBalance).toHaveBeenCalledTimes(3);
    expect(mockedCheckBalance).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      false,
    );
  });

  test('should ignore unused wallets when no max unused wallet balance is defined', async () => {
    await checker['checkBalance'](
      { ...btcCurrency, maxUnusedWalletBalance: undefined },
      clnNodeId,
      BalanceType.Wallet,
      btcCurrency.maxWalletBalance! + 1,
      false,
    );

    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  test('should check for max unused wallet balance for unused wallets', async () => {
    const maxUnusedWalletBalance = 1_012_000;
    await checker['checkBalance'](
      { ...btcCurrency, maxUnusedWalletBalance },
      clnNodeId,
      BalanceType.Wallet,
      maxUnusedWalletBalance + 1,
      false,
    );
    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      `${Emojis.RotatingLight} **${
        btcCurrency.symbol
      } ${clnNodeId} wallet balance is out of bounds** ${Emojis.RotatingLight}
  Balance: ${satoshisToSatcomma(maxUnusedWalletBalance + 1)}
    Max: ${satoshisToSatcomma(maxUnusedWalletBalance)}`,
      true,
      true,
    );
  });
});
