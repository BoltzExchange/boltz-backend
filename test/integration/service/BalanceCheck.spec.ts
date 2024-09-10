import Logger from '../../../lib/Logger';
import BalanceCheck from '../../../lib/service/BalanceCheck';
import Errors from '../../../lib/service/Errors';
import WalletManager from '../../../lib/wallet/WalletManager';
import CoreWalletProvider from '../../../lib/wallet/providers/CoreWalletProvider';
import { bitcoinClient } from '../Nodes';

jest.mock('../../../lib/db/repositories/ChainTipRepository');

describe('BalanceCheck', () => {
  const wallet = new CoreWalletProvider(Logger.disabledLogger, bitcoinClient);
  const balanceCheck = new BalanceCheck({
    wallets: new Map<string, any>([['BTC', wallet]]),
  } as unknown as WalletManager);

  beforeAll(async () => {
    await bitcoinClient.connect();
  });

  afterAll(() => {
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
});
