import type Logger from '../Logger';
import { formatError } from '../Utils';
import type Wallet from '../wallet/Wallet';
import type WalletManager from '../wallet/WalletManager';
import type { WalletBalance } from '../wallet/providers/WalletProviderInterface';
import Errors from './Errors';

class BalanceCheck {
  private static readonly updateIntervalMs = 15_000;

  private readonly balanceCache = new Map<string, WalletBalance>();
  private updateInterval?: NodeJS.Timeout;

  constructor(
    private readonly logger: Logger,
    private readonly walletManager: WalletManager,
  ) {}

  public init = async (): Promise<void> => {
    await this.updateBalances();
    this.startPeriodicUpdates();
  };

  public destroy = (): void => {
    if (this.updateInterval !== undefined) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }
  };

  public checkBalance = async (symbol: string, amount: number) => {
    const balance = this.balanceCache.get(symbol);
    if (balance === undefined) {
      throw Errors.CURRENCY_NOT_FOUND(symbol);
    }

    if (balance.confirmedBalance < amount) {
      throw Errors.INSUFFICIENT_LIQUIDITY();
    }
  };

  public refresh = async (symbol?: string): Promise<void> => {
    if (symbol === undefined) {
      await this.updateBalances();
      return;
    }

    const wallet = this.walletManager.wallets.get(symbol);
    if (wallet === undefined) {
      throw Errors.CURRENCY_NOT_FOUND(symbol);
    }

    await this.updateBalance(symbol, wallet);
  };

  private updateBalances = async (): Promise<void> => {
    this.logger.silly('Updating balance cache');

    await Promise.allSettled(
      Array.from(this.walletManager.wallets).map(([symbol, wallet]) =>
        this.updateBalance(symbol, wallet),
      ),
    );
  };

  private updateBalance = async (
    symbol: string,
    wallet: Wallet,
  ): Promise<void> => {
    try {
      this.balanceCache.set(symbol, await wallet.getBalance());
    } catch (error) {
      this.logger.warn(
        `Failed to update balance cache for ${symbol}: ${formatError(error)}`,
      );
      throw error;
    }
  };

  private startPeriodicUpdates = (): void => {
    if (this.updateInterval !== undefined) {
      return;
    }

    this.updateInterval = setInterval(async () => {
      await this.updateBalances();
    }, BalanceCheck.updateIntervalMs);
  };
}

export default BalanceCheck;
