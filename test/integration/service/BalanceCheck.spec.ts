import Logger from '../../../lib/Logger';
import BalanceCheck from '../../../lib/service/BalanceCheck';
import Errors from '../../../lib/service/Errors';
import type WalletManager from '../../../lib/wallet/WalletManager';
import CoreWalletProvider from '../../../lib/wallet/providers/CoreWalletProvider';
import { regtest } from '../../Networks';
import { bitcoinClient } from '../Nodes';

jest.mock('../../../lib/db/repositories/ChainTipRepository');

describe('BalanceCheck', () => {
  const wallet = new CoreWalletProvider(
    Logger.disabledLogger,
    bitcoinClient,
    regtest,
  );
  const balanceCheck = new BalanceCheck(Logger.disabledLogger, {
    wallets: new Map<string, any>([['BTC', wallet]]),
  } as unknown as WalletManager);

  beforeAll(async () => {
    await balanceCheck.init();
  });

  afterAll(() => {
    balanceCheck.destroy();
    bitcoinClient.disconnect();
  });

  test('should throw when no wallet can be found', async () => {
    const symbol = 'notFound';
    await expect(balanceCheck.checkBalance(symbol, 1)).rejects.toEqual(
      Errors.CURRENCY_NOT_FOUND(symbol),
    );
  });

  test('should not throw when amount is less than balance', async () => {
    await balanceCheck.checkBalance(
      'BTC',
      (await wallet.getBalance()).confirmedBalance - 1,
    );
  });

  test('should not throw when amount is equal balance', async () => {
    await balanceCheck.checkBalance(
      'BTC',
      (await wallet.getBalance()).confirmedBalance,
    );
  });

  test('should throw when amount is more than balance', async () => {
    await expect(
      balanceCheck.checkBalance(
        'BTC',
        (await wallet.getBalance()).confirmedBalance + 1,
      ),
    ).rejects.toEqual(Errors.INSUFFICIENT_LIQUIDITY());
  });

  test.each`
    symbol
    ${undefined}
    ${'BTC'}
  `('should refresh the cache with symbol $symbol', async ({ symbol }) => {
    const getBalance = jest.spyOn(wallet, 'getBalance');
    getBalance.mockClear();

    await balanceCheck.refresh(symbol);

    expect(getBalance).toHaveBeenCalledTimes(1);
    await balanceCheck.checkBalance(
      'BTC',
      (await wallet.getBalance()).confirmedBalance,
    );

    getBalance.mockRestore();
  });

  test('should throw when refreshing an unknown symbol', async () => {
    const symbol = 'notFound';
    await expect(balanceCheck.refresh(symbol)).rejects.toEqual(
      Errors.CURRENCY_NOT_FOUND(symbol),
    );
  });

  test('should throw and keep the cached balance when refreshing a symbol fails', async () => {
    const getBalance = jest
      .fn()
      .mockResolvedValueOnce({ confirmedBalance: 21, unconfirmedBalance: 0 })
      .mockRejectedValue(new Error('failed to get balance'));
    const check = new BalanceCheck(Logger.disabledLogger, {
      wallets: new Map<string, any>([['BTC', { getBalance }]]),
    } as unknown as WalletManager);

    await check.refresh('BTC');
    await check.checkBalance('BTC', 21);

    await expect(check.refresh('BTC')).rejects.toThrow('failed to get balance');
    await check.checkBalance('BTC', 21);
  });

  test('should not throw when refreshing all balances fails', async () => {
    const check = new BalanceCheck(Logger.disabledLogger, {
      wallets: new Map<string, any>([
        [
          'BTC',
          {
            getBalance: jest
              .fn()
              .mockRejectedValue(new Error('failed to get balance')),
          },
        ],
      ]),
    } as unknown as WalletManager);

    await expect(check.refresh()).resolves.toBeUndefined();
  });
});
