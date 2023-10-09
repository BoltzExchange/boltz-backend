import Logger from '../Logger';
import { Emojis } from './Markup';
import Service from '../service/Service';
import DiscordClient from './DiscordClient';
import { Balances } from '../proto/boltzrpc_pb';
import { liquidSymbol } from '../consts/LiquidTypes';
import { satoshisToCoins } from '../DenominationConverter';
import { BaseCurrencyConfig, TokenConfig } from '../Config';

enum BalanceType {
  Wallet,
  ChannelLocal,
  ChannelRemote,
}

type CurrenyThresholds = {
  symbol: string;

  minWalletBalance: number;
  maxWalletBalance?: number;

  minLocalBalance?: number;
  minRemoteBalance?: number;
};

class BalanceChecker {
  private currencies: CurrenyThresholds[] = [];

  // These Sets contain the symbols for which an out of bounds alert notification was sent
  private walletBalanceAlerts = new Set<string>();

  private localBalanceAlerts = new Set<string>();
  private remoteBalanceAlerts = new Set<string>();

  constructor(
    private logger: Logger,
    private service: Service,
    private discord: DiscordClient,
    currencyConfigs: (BaseCurrencyConfig | undefined)[],
    tokenConfigs: TokenConfig[],
  ) {
    currencyConfigs
      .filter((config): config is BaseCurrencyConfig => config !== undefined)
      .forEach((config) =>
        this.currencies.push({
          ...config,
          symbol: config.symbol || liquidSymbol,
        }),
      );
    tokenConfigs.forEach((config) => this.currencies.push(config));
  }

  public check = async (): Promise<void> => {
    const balances = (await this.service.getBalance()).getBalancesMap() as Map<
      string,
      Balances
    >;

    for (const currency of this.currencies) {
      const balance = balances.get(currency.symbol);

      if (balance) {
        await this.checkCurrency(currency, balance.toObject());
      }
    }
  };

  private checkCurrency = async (
    currency: CurrenyThresholds,
    balances: Balances.AsObject,
  ) => {
    for (const [service, balance] of balances.walletsMap) {
      await this.checkBalance(
        currency,
        service,
        BalanceType.Wallet,
        balance.confirmed + balance.unconfirmed,
      );
    }

    for (const [service, lightningBalance] of balances.lightningMap) {
      await this.checkBalance(
        currency,
        service,
        BalanceType.ChannelLocal,
        lightningBalance.local,
      );

      await this.checkBalance(
        currency,
        service,
        BalanceType.ChannelRemote,
        lightningBalance.remote,
      );
    }
  };

  private checkBalance = async (
    currency: CurrenyThresholds,
    service: string,
    type: BalanceType,
    balance: number,
  ) => {
    let isInBounds: boolean;
    let notificationSet: Set<string>;

    if (type === BalanceType.Wallet) {
      notificationSet = this.walletBalanceAlerts;

      const { minWalletBalance, maxWalletBalance } = currency;

      isInBounds =
        minWalletBalance <= balance &&
        balance <= (maxWalletBalance || Number.MAX_SAFE_INTEGER);
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
      await this.sendAlert(currency, type, service, isInBounds, balance);
    } else if (notificationSet.has(ident) && isInBounds) {
      notificationSet.delete(ident);
      await this.sendAlert(currency, type, service, isInBounds, balance);
    }
  };

  private sendAlert = async (
    currency: CurrenyThresholds,
    type: BalanceType,
    service: string,
    isInBounds: boolean,
    balance: number,
  ) => {
    const name = `${currency.symbol} ${service}`;

    let message: string;

    if (isInBounds) {
      if (type === BalanceType.Wallet) {
        message = `${
          Emojis.Checkmark
        } ${name} wallet balance of ${satoshisToCoins(
          balance,
        )} is in bounds again ${Emojis.Checkmark}`;
      } else {
        message =
          `${Emojis.Checkmark} ${name} ${
            type === BalanceType.ChannelLocal ? 'local' : 'remote'
          } channel balance ` +
          `of ${satoshisToCoins(balance)} is more than expected ` +
          `${satoshisToCoins(
            type === BalanceType.ChannelLocal
              ? currency.minLocalBalance!
              : currency.minRemoteBalance!,
          )} again ${Emojis.Checkmark}`;
      }
    } else {
      if (type === BalanceType.Wallet) {
        message =
          `${Emojis.RotatingLight} **${name} wallet balance is out of bounds** ${Emojis.RotatingLight}\n` +
          `  Balance: ${satoshisToCoins(balance)}\n` +
          `${
            currency.maxWalletBalance
              ? `    Max: ${satoshisToCoins(currency.maxWalletBalance)}\n`
              : ''
          }` +
          `    Min: ${satoshisToCoins(currency.minWalletBalance)}`;
      } else {
        message =
          `${Emojis.RotatingLight} **${name} ${
            type === BalanceType.ChannelLocal ? 'local' : 'remote'
          } channel balance ` +
          `of ${satoshisToCoins(balance)} is less than expected ` +
          `${satoshisToCoins(
            type === BalanceType.ChannelLocal
              ? currency.minLocalBalance!
              : currency.minRemoteBalance!,
          )}** ${Emojis.RotatingLight}`;
      }
    }

    this.logger.warn(`Balance warning: ${message}`);
    await this.discord.sendMessage(message, true);
  };
}

export default BalanceChecker;
export { BalanceType };
