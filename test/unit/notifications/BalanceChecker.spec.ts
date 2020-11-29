import Logger from '../../../lib/Logger';
import Service from '../../../lib/service/Service';
import { CurrencyConfig } from '../../../lib/Config';
import DiscordClient from '../../../lib/notifications/DiscordClient';
import BalanceChecker, { BalanceType } from '../../../lib/notifications/BalanceChecker';
import { Balance, GetBalanceResponse, LightningBalance, WalletBalance } from '../../../lib/proto/boltzrpc_pb';

let mockGetBalanceResponse: any = null;
const mockGetBalance = jest.fn().mockImplementation(async () => {
  return mockGetBalanceResponse;
});

jest.mock('../../../lib/service/Service', () => {
  return jest.fn().mockImplementation(() => ({
    getBalance: mockGetBalance,
  }));
});

const MockedService = <jest.Mock<Service>><any>Service;

const mockSendMessage = jest.fn().mockResolvedValue(undefined);

jest.mock('../../../lib/notifications/DiscordClient', () => {
  return jest.fn().mockImplementation(() => ({
    sendMessage: mockSendMessage,
  }));
});

const MockedDiscordClient = <jest.Mock<DiscordClient>><any>DiscordClient;

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
    [
      btcCurrency,
    ],
    [
      usdtCurrency,
    ]
  );

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset the BalanceChecker instance
    checker = new BalanceChecker(
      Logger.disabledLogger,
      new MockedService(),
      new MockedDiscordClient(),
      [
        btcCurrency,
      ],
      [
        usdtCurrency,
      ]
    );
  });

  test('should check all currencies', async () => {
    const mockCheckCurrency = jest.fn().mockResolvedValue(undefined);
    checker['checkCurrency'] = mockCheckCurrency;

    const btcBalance = new Balance();
    btcBalance.setWalletBalance(new WalletBalance().setTotalBalance(1));
    btcBalance.setLightningBalance(new LightningBalance().setLocalBalance(2).setRemoteBalance(3));

    const usdtBalance = new Balance();
    usdtBalance.setWalletBalance(new WalletBalance().setTotalBalance(123));

    mockGetBalanceResponse = new GetBalanceResponse();
    mockGetBalanceResponse.getBalancesMap().set(btcCurrency.symbol, btcBalance);
    mockGetBalanceResponse.getBalancesMap().set(usdtCurrency.symbol, usdtBalance);

    await checker.check();

    expect(mockCheckCurrency).toHaveBeenCalledTimes(2);
    expect(mockCheckCurrency).toHaveBeenNthCalledWith(1, btcCurrency, btcBalance.toObject());
    expect(mockCheckCurrency).toHaveBeenNthCalledWith(2, usdtCurrency, usdtBalance.toObject());
  });

  test('should check balances of currency', async () => {
    const mockCheckBalance = jest.fn().mockResolvedValue(undefined);
    checker['checkBalance'] = mockCheckBalance;

    const checkCurrency = checker['checkCurrency'];

    // Currency with lightning
    await checkCurrency(btcCurrency, {
      walletBalance: {
        totalBalance: 1,
        confirmedBalance: 0,
        unconfirmedBalance: 0,
      },
      lightningBalance: {
        localBalance: 2,
        remoteBalance: 3,
      },
    });

    expect(mockCheckBalance).toHaveBeenCalledTimes(3);
    expect(mockCheckBalance).toHaveBeenNthCalledWith(1,
      btcCurrency,
      BalanceType.Wallet,
      1,
    );
    expect(mockCheckBalance).toHaveBeenNthCalledWith(2,
      btcCurrency,
      BalanceType.ChannelLocal,
      2,
    );
    expect(mockCheckBalance).toHaveBeenNthCalledWith(3,
      btcCurrency,
      BalanceType.ChannelRemote,
      3,
    );

    // Currency without lightning
    await checkCurrency(usdtCurrency, {
      walletBalance: {
        totalBalance: 123,
        confirmedBalance: 0,
        unconfirmedBalance: 0,
      },
    });

    expect(mockCheckBalance).toHaveBeenCalledTimes(4);
    expect(mockCheckBalance).toHaveBeenNthCalledWith(4,
      usdtCurrency,
      BalanceType.Wallet,
      123,
    );
  });

  test('should check balance', () => {
    const checkBalance = checker['checkBalance'];

    /*
     * Wallet alerts
     */

    expect(checker['walletBalanceAlerts'].size).toEqual(0);

    // Should ignore when in bounds
    checkBalance(btcCurrency, BalanceType.Wallet, btcCurrency.minWalletBalance);

    expect(checker['walletBalanceAlerts'].size).toEqual(0);
    expect(mockSendMessage).toHaveBeenCalledTimes(0);

    // Should send message when getting out of bounds
    checkBalance(btcCurrency, BalanceType.Wallet, btcCurrency.minWalletBalance - 1);

    expect(checker['walletBalanceAlerts'].size).toEqual(1);
    expect(checker['walletBalanceAlerts'].has(btcCurrency.symbol)).toEqual(true);
    expect(mockSendMessage).toHaveBeenCalledTimes(1);

    // Should send message when getting in bounds again
    checkBalance(btcCurrency, BalanceType.Wallet, Number.MAX_SAFE_INTEGER - 1);

    expect(checker['walletBalanceAlerts'].size).toEqual(0);
    expect(mockSendMessage).toHaveBeenCalledTimes(2);

    // Should also check upper bounds
    checkBalance(usdtCurrency, BalanceType.Wallet, usdtCurrency.maxWalletBalance! + 1);

    expect(checker['walletBalanceAlerts'].size).toEqual(1);
    expect(checker['walletBalanceAlerts'].has(usdtCurrency.symbol)).toEqual(true);
    expect(mockSendMessage).toHaveBeenCalledTimes(3);

    /*
     * Channel balance alerts
     */

    // Local balances
    checkBalance(btcCurrency, BalanceType.ChannelLocal, btcCurrency.minLocalBalance - 1);
    expect(checker['localBalanceAlerts'].size).toEqual(1);
    expect(checker['localBalanceAlerts'].has(btcCurrency.symbol)).toEqual(true);
    expect(mockSendMessage).toHaveBeenCalledTimes(4);

    checkBalance(btcCurrency, BalanceType.ChannelLocal, btcCurrency.minLocalBalance);
    expect(checker['localBalanceAlerts'].size).toEqual(0);
    expect(mockSendMessage).toHaveBeenCalledTimes(5);

    // Remote balances
    checkBalance(btcCurrency, BalanceType.ChannelRemote, btcCurrency.minRemoteBalance - 1);
    expect(checker['remoteBalanceAlerts'].size).toEqual(1);
    expect(checker['remoteBalanceAlerts'].has(btcCurrency.symbol)).toEqual(true);
    expect(mockSendMessage).toHaveBeenCalledTimes(6);

    checkBalance(btcCurrency, BalanceType.ChannelRemote, btcCurrency.minRemoteBalance);
    expect(checker['remoteBalanceAlerts'].size).toEqual(0);
    expect(mockSendMessage).toHaveBeenCalledTimes(7);
  });

  test('should send alerts', async () => {
    const sendAlert = checker['sendAlert'];

    // Wallet alerts
    await sendAlert(btcCurrency, BalanceType.Wallet, true, 999999999);
    expect(mockSendMessage).toHaveBeenNthCalledWith(1, ':white_check_mark: BTC wallet balance of 9.99999999 is in bounds again :white_check_mark:');

    await sendAlert(btcCurrency, BalanceType.Wallet, false, 99999999);
    expect(mockSendMessage).toHaveBeenNthCalledWith(2,
      ':rotating_light: **BTC wallet balance is out of bounds** :rotating_light:\n' +
      '  Balance: 0.99999999\n' +
      '    Min: 0.1',
    );

    await sendAlert(usdtCurrency, BalanceType.Wallet, true, 150000000000);
    expect(mockSendMessage).toHaveBeenNthCalledWith(3, ':white_check_mark: USDT wallet balance of 1500 is in bounds again :white_check_mark:');

    await sendAlert(usdtCurrency, BalanceType.Wallet, false, 10000000000);
    expect(mockSendMessage).toHaveBeenNthCalledWith(4,
      ':rotating_light: **USDT wallet balance is out of bounds** :rotating_light:\n' +
      '  Balance: 100\n' +
      '    Max: 2000\n' +
      '    Min: 1000',
    );

    // Channel alerts
    await sendAlert(btcCurrency, BalanceType.ChannelLocal, true, 25000001);
    expect(mockSendMessage).toHaveBeenNthCalledWith(5, ':white_check_mark: BTC local channel balance of 0.25000001 is more than expected 0.25 again :white_check_mark:');

    await sendAlert(btcCurrency, BalanceType.ChannelRemote, true, 25000001);
    expect(mockSendMessage).toHaveBeenNthCalledWith(6, ':white_check_mark: BTC remote channel balance of 0.25000001 is more than expected 0.24 again :white_check_mark:');

    await sendAlert(btcCurrency, BalanceType.ChannelLocal, false, 20000000);
    expect(mockSendMessage).toHaveBeenNthCalledWith(7, ':rotating_light: **BTC local channel balance of 0.2 is less than expected 0.25** :rotating_light:');

    await sendAlert(btcCurrency, BalanceType.ChannelRemote, false, 20000000);
    expect(mockSendMessage).toHaveBeenNthCalledWith(8, ':rotating_light: **BTC remote channel balance of 0.2 is less than expected 0.24** :rotating_light:');
  });
});
