import Logger from '../../../lib/Logger';
import Service from '../../../lib/service/Service';
import { liquidSymbol } from '../../../lib/consts/LiquidTypes';
import DiscordClient from '../../../lib/notifications/DiscordClient';
import { BaseCurrencyConfig, CurrencyConfig } from '../../../lib/Config';
import { Balances, GetBalanceResponse } from '../../../lib/proto/boltzrpc_pb';
import BalanceChecker, {
  BalanceType,
} from '../../../lib/notifications/BalanceChecker';

let mockGetBalanceResponse: any = null;
const mockGetBalance = jest.fn().mockImplementation(async () => {
  return mockGetBalanceResponse;
});

jest.mock('../../../lib/service/Service', () => {
  return jest.fn().mockImplementation(() => ({
    getBalance: mockGetBalance,
  }));
});

const MockedService = <jest.Mock<Service>>(<any>Service);

const mockSendMessage = jest.fn().mockResolvedValue(undefined);

jest.mock('../../../lib/notifications/DiscordClient', () => {
  return jest.fn().mockImplementation(() => ({
    sendMessage: mockSendMessage,
  }));
});

const MockedDiscordClient = <jest.Mock<DiscordClient>>(<any>DiscordClient);

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
    new MockedDiscordClient(),
    [btcCurrency],
    [usdtCurrency],
  );

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset the BalanceChecker instance
    checker = new BalanceChecker(
      Logger.disabledLogger,
      new MockedService(),
      new MockedDiscordClient(),
      [btcCurrency],
      [usdtCurrency],
    );
  });

  test('should sanitize the liquid config', () => {
    const liquidConfig = {
      some: 'liquidRelatedStuff',
    } as unknown as BaseCurrencyConfig;
    const check = new BalanceChecker(
      Logger.disabledLogger,
      new MockedService(),
      new MockedDiscordClient(),
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
      new MockedDiscordClient(),
      [undefined, btcCurrency, undefined],
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
    btcBalance.getLightningMap().set('LND', btcLightningBalance);

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
          'LND',
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
    );
    expect(mockCheckBalance).toHaveBeenNthCalledWith(
      2,
      btcCurrency,
      'LND',
      BalanceType.ChannelLocal,
      2,
    );
    expect(mockCheckBalance).toHaveBeenNthCalledWith(
      3,
      btcCurrency,
      'LND',
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
    );
  });

  test('should check balance', () => {
    const service = 'Core';
    const checkBalance = checker['checkBalance'];

    /*
     * Wallet alerts
     */

    expect(checker['walletBalanceAlerts'].size).toEqual(0);

    // Should ignore when in bounds
    checkBalance(
      btcCurrency,
      service,
      BalanceType.Wallet,
      btcCurrency.minWalletBalance,
    );

    expect(checker['walletBalanceAlerts'].size).toEqual(0);
    expect(mockSendMessage).toHaveBeenCalledTimes(0);

    // Should send message when getting out of bounds
    checkBalance(
      btcCurrency,
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
      btcCurrency,
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
    await sendAlert(btcCurrency, BalanceType.Wallet, service, true, 999999999);
    expect(mockSendMessage).toHaveBeenNthCalledWith(
      1,
      `:white_check_mark: BTC ${service} wallet balance of 9.99999999 is in bounds again :white_check_mark:`,
      true,
    );

    await sendAlert(btcCurrency, BalanceType.Wallet, service, false, 99999999);
    expect(mockSendMessage).toHaveBeenNthCalledWith(
      2,
      `:rotating_light: **BTC ${service} wallet balance is out of bounds** :rotating_light:\n` +
        '  Balance: 0.99999999\n' +
        '    Min: 0.1',
      true,
    );

    await sendAlert(
      usdtCurrency,
      BalanceType.Wallet,
      service,
      true,
      150000000000,
    );
    expect(mockSendMessage).toHaveBeenNthCalledWith(
      3,
      `:white_check_mark: USDT ${service} wallet balance of 1500 is in bounds again :white_check_mark:`,
      true,
    );

    await sendAlert(
      usdtCurrency,
      BalanceType.Wallet,
      service,
      false,
      10000000000,
    );
    expect(mockSendMessage).toHaveBeenNthCalledWith(
      4,
      `:rotating_light: **USDT ${service} wallet balance is out of bounds** :rotating_light:\n` +
        '  Balance: 100\n' +
        '    Max: 2000\n' +
        '    Min: 1000',
      true,
    );

    // Channel alerts
    await sendAlert(
      btcCurrency,
      BalanceType.ChannelLocal,
      service,
      true,
      25000001,
    );
    expect(mockSendMessage).toHaveBeenNthCalledWith(
      5,
      `:white_check_mark: BTC ${service} local channel balance of 0.25000001 is more than expected 0.25 again :white_check_mark:`,
      true,
    );

    await sendAlert(
      btcCurrency,
      BalanceType.ChannelRemote,
      service,
      true,
      25000001,
    );
    expect(mockSendMessage).toHaveBeenNthCalledWith(
      6,
      `:white_check_mark: BTC ${service} remote channel balance of 0.25000001 is more than expected 0.24 again :white_check_mark:`,
      true,
    );

    await sendAlert(
      btcCurrency,
      BalanceType.ChannelLocal,
      service,
      false,
      20000000,
    );
    expect(mockSendMessage).toHaveBeenNthCalledWith(
      7,
      `:rotating_light: **BTC ${service} local channel balance of 0.2 is less than expected 0.25** :rotating_light:`,
      true,
    );

    await sendAlert(
      btcCurrency,
      BalanceType.ChannelRemote,
      service,
      false,
      20000000,
    );
    expect(mockSendMessage).toHaveBeenNthCalledWith(
      8,
      `:rotating_light: **BTC ${service} remote channel balance of 0.2 is less than expected 0.24** :rotating_light:`,
      true,
    );
  });
});
