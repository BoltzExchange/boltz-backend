import type { BaseCurrencyConfig, TokenConfig } from '../Config';
import { satoshisToSatcomma } from '../DenominationConverter';
import type Logger from '../Logger';
import { fromProtoInt } from '../Utils';
import { liquidSymbol } from '../consts/LiquidTypes';
import type { Balances } from '../proto/boltzrpc';
import type Service from '../service/Service';
import { Emojis } from './Markup';
import type NotificationClient from './NotificationClient';

enum BalanceType {
  Wallet,
  ChannelLocal,
  ChannelRemote,
}

type CurrencyThresholds = {
  symbol: string;

  minWalletBalance: number;
  maxWalletBalance?: number;

  maxUnusedWalletBalance?: number;

  minLocalBalance?: number;
  minRemoteBalance?: number;
};

class BalanceChecker {
  private currencies: CurrencyThresholds[] = [];

  // These Sets contain the symbols for which an out of bounds alert notification was sent
  private walletBalanceAlerts = new Set<string>();

  private localBalanceAlerts = new Set<string>();
  private remoteBalanceAlerts = new Set<string>();

  private static isValidMinWalletBalance(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
  }

  constructor(
    private logger: Logger,
    private service: Service,
    private notificationClient: NotificationClient,
    currencyConfigs: (BaseCurrencyConfig | undefined)[],
    tokenConfigs: TokenConfig[],
  ) {
    currencyConfigs
      .filter((config): config is BaseCurrencyConfig => config !== undefined)
      .forEach((config) => {
        if (!BalanceChecker.isValidMinWalletBalance(config.minWalletBalance)) {
          this.logger.warn(
            `Ignoring ${config.symbol || liquidSymbol} balance checker config because minWalletBalance is invalid`,
          );
          return;
        }

        this.currencies.push({
          ...config,
          symbol: config.symbol || liquidSymbol,
          minWalletBalance: config.minWalletBalance,
        });
      });

    tokenConfigs.forEach((config) => {
      if (!BalanceChecker.isValidMinWalletBalance(config.minWalletBalance)) {
        this.logger.warn(
          `Ignoring ${config.symbol} balance checker config because minWalletBalance is invalid`,
        );
        return;
      }

      this.currencies.push({
        ...config,
        minWalletBalance: config.minWalletBalance,
      });
    });
  }

  public check = async (): Promise<void> => {
    const balances = (await this.service.getBalance()).balances;

    for (const currency of this.currencies) {
      const balance = balances[currency.symbol];

      if (balance) {
        await this.checkCurrency(currency, balance);
      }
    }
  };

  private checkCurrency = async (
    currency: CurrencyThresholds,
    balances: Balances,
  ) => {
    const walletEntries = Object.entries(balances.wallets);
    const lightningEntries = Object.entries(balances.lightning);
    const isOnlyWallet = walletEntries.length === 1;
    const lightningServices = new Set(
      lightningEntries.map(([service]) => service),
    );

    for (const [service, balance] of walletEntries) {
      const isMainWallet = isOnlyWallet || !lightningServices.has(service);
      await this.checkBalance(
        currency,
        service,
        BalanceType.Wallet,
        fromProtoInt(balance.confirmed) + fromProtoInt(balance.unconfirmed),
        isMainWallet,
      );
    }

    for (const [service, lightningBalance] of lightningEntries) {
      await this.checkBalance(
        currency,
        service,
        BalanceType.ChannelLocal,
        fromProtoInt(lightningBalance.local),
      );

      await this.checkBalance(
        currency,
        service,
        BalanceType.ChannelRemote,
        fromProtoInt(lightningBalance.remote),
      );
    }
  };

  private checkBalance = async (
    currency: CurrencyThresholds,
    service: string,
    type: BalanceType,
    balance: number,
    isMainWallet = true,
  ) => {
    let isInBounds: boolean;
    let notificationSet: Set<string>;

    if (type === BalanceType.Wallet) {
      notificationSet = this.walletBalanceAlerts;

      const { minWalletBalance, maxWalletBalance, maxUnusedWalletBalance } =
        currency;

      if (isMainWallet) {
        isInBounds =
          minWalletBalance <= balance &&
          balance <= (maxWalletBalance || Number.MAX_SAFE_INTEGER);
      } else if (maxUnusedWalletBalance !== undefined) {
        isInBounds = balance <= maxUnusedWalletBalance;
      } else {
        // Wallet does not need to be checked
        return;
      }
    } else {
      notificationSet =
        type === BalanceType.ChannelLocal
          ? this.localBalanceAlerts
          : this.remoteBalanceAlerts;

      const minThreshold =
        type === BalanceType.ChannelLocal
          ? currency.minLocalBalance
          : currency.minRemoteBalance;

      isInBounds = minThreshold! <= balance;
    }

    const ident = `${currency.symbol}${service}`;

    if (!notificationSet.has(ident) && !isInBounds) {
      notificationSet.add(ident);
      await this.sendAlert(
        currency,
        type,
        service,
        isInBounds,
        isMainWallet,
        balance,
      );
    } else if (notificationSet.has(ident) && isInBounds) {
      notificationSet.delete(ident);
      await this.sendAlert(
        currency,
        type,
        service,
        isInBounds,
        isMainWallet,
        balance,
      );
    }
  };

  private sendAlert = async (
    currency: CurrencyThresholds,
    type: BalanceType,
    service: string,
    isInBounds: boolean,
    isMainWallet: boolean,
    balance: number,
  ) => {
    const name = `${currency.symbol} ${service}`;

    let message: string;

    if (isInBounds) {
      if (type === BalanceType.Wallet) {
        message = `${
          Emojis.Checkmark
        } ${name} wallet balance of ${satoshisToSatcomma(
          balance,
        )} is in bounds again ${Emojis.Checkmark}`;
      } else {
        message =
          `${Emojis.Checkmark} ${name} ${
            type === BalanceType.ChannelLocal ? 'local' : 'remote'
          } channel balance ` +
          `of ${satoshisToSatcomma(balance)} is more than expected ` +
          `${satoshisToSatcomma(
            type === BalanceType.ChannelLocal
              ? currency.minLocalBalance!
              : currency.minRemoteBalance!,
          )} again ${Emojis.Checkmark}`;
      }
    } else {
      if (type === BalanceType.Wallet) {
        const limits = isMainWallet
          ? `${
              currency.maxWalletBalance
                ? `    Max: ${satoshisToSatcomma(currency.maxWalletBalance)}\n`
                : ''
            }` + `    Min: ${satoshisToSatcomma(currency.minWalletBalance)}`
          : `    Max: ${satoshisToSatcomma(currency.maxUnusedWalletBalance!)}`;
        message =
          `${Emojis.RotatingLight} **${name} wallet balance is out of bounds** ${Emojis.RotatingLight}\n` +
          `  Balance: ${satoshisToSatcomma(balance)}\n` +
          limits;
      } else {
        message =
          `${Emojis.RotatingLight} **${name} ${
            type === BalanceType.ChannelLocal ? 'local' : 'remote'
          } channel balance ` +
          `of ${satoshisToSatcomma(balance)} is less than expected ` +
          `${satoshisToSatcomma(
            type === BalanceType.ChannelLocal
              ? currency.minLocalBalance!
              : currency.minRemoteBalance!,
          )}** ${Emojis.RotatingLight}`;
      }
    }

    this.logger.warn(`Balance warning: ${message}`);
    await this.notificationClient.sendMessage(message, true, !isInBounds);
  };
}

export default BalanceChecker;
export { BalanceType };
