import type Logger from '../Logger';
import { formatError } from '../Utils';
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

  private updateBalances = async (): Promise<void> => {
    this.logger.silly('Updating balance cache');

    const updatePromises: Promise<void>[] = [];

    for (const [symbol, wallet] of this.walletManager.wallets) {
      updatePromises.push(
        wallet
          .getBalance()
          .then((balance) => {
            this.balanceCache.set(symbol, balance);
          })
          .catch((error) => {
            this.balanceCache.delete(symbol);
            this.logger.warn(
              `Failed to update balance cache for ${symbol}: ${formatError(error)}`,
            );
          }),
      );
    }

    await Promise.allSettled(updatePromises);
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
