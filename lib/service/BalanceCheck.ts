import type WalletManager from '../wallet/WalletManager';
import Errors from './Errors';

class BalanceCheck {
  constructor(private readonly walletManager: WalletManager) {}

  public checkBalance = async (symbol: string, amount: number) => {
    const wallet = this.walletManager.wallets.get(symbol);
    if (wallet === undefined) {
      throw Errors.CURRENCY_NOT_FOUND(symbol);
    }

    const balance = await wallet.getBalance();
    if (balance.confirmedBalance < amount) {
      throw Errors.INSUFFICIENT_LIQUIDITY();
    }
  };
}

export default BalanceCheck;
