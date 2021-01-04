import Logger from '../Logger';
import { Emojis } from './Markup';
import Service from '../service/Service';
import { CurrencyConfig, TokenConfig } from '../Config';
import DiscordClient  from './DiscordClient';
import { Balance } from '../proto/boltzrpc_pb';
import { satoshisToCoins } from '../DenominationConverter';

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
    currencyConfigs: CurrencyConfig[],
    tokenConfigs: TokenConfig[],
  ) {
    currencyConfigs.forEach((config) => this.currencies.push(config));
    tokenConfigs.forEach((config) => this.currencies.push(config));
  }

  public check = async (): Promise<void> => {
    const balances = (await this.service.getBalance()).getBalancesMap() as Map<string, Balance>;

    for (const currency of this.currencies) {
      const balance = balances.get(currency.symbol);

      if (balance) {
        await this.checkCurrency(currency, balance.toObject());
      }
    }
  };

  private checkCurrency = async (currency: CurrenyThresholds, balance: Balance.AsObject) => {
    const walletBalance = balance.walletBalance;

    if (walletBalance) {
      await this.checkBalance(
        currency,
        BalanceType.Wallet,
        walletBalance.totalBalance,
      );
    }

    const lightningBalance = balance.lightningBalance;

    if (lightningBalance) {
      await this.checkBalance(
        currency,
        BalanceType.ChannelLocal,
        lightningBalance.localBalance,
      );

      await this.checkBalance(
        currency,
        BalanceType.ChannelRemote,
        lightningBalance.remoteBalance,
      );
    }
  };

  private checkBalance = async (currency: CurrenyThresholds, type: BalanceType, balance: number) => {
    let isInBounds: boolean;
    let notificationSet: Set<string>;

    if (type === BalanceType.Wallet) {
      notificationSet = this.walletBalanceAlerts;

      const { minWalletBalance, maxWalletBalance } = currency;

      isInBounds = minWalletBalance <= balance && balance <= (maxWalletBalance || Number.MAX_SAFE_INTEGER);
    } else {
      notificationSet = type === BalanceType.ChannelLocal ?
        this.localBalanceAlerts :
        this.remoteBalanceAlerts;

      const minThreshold = type === BalanceType.ChannelLocal ?
        currency.minLocalBalance :
        currency.minRemoteBalance;

      isInBounds = minThreshold! <= balance;
    }

    if (!notificationSet.has(currency.symbol)) {
      if (!isInBounds) {
        notificationSet.add(currency.symbol);
        await this.sendAlert(currency, type, isInBounds, balance);
      }
    } else {
      if (isInBounds) {
        notificationSet.delete(currency.symbol);
        await this.sendAlert(currency, type, isInBounds, balance);
      }
    }
  };

  private sendAlert = async (currency: CurrenyThresholds, type: BalanceType, isInBounds: boolean, balance: number) => {
    let message: string;

    if (isInBounds) {
      if (type === BalanceType.Wallet) {
        message = `${Emojis.Checkmark} ${currency.symbol} wallet balance of ${satoshisToCoins(balance)} is in bounds again ${Emojis.Checkmark}`;
      } else {
        message = `${Emojis.Checkmark} ${currency.symbol} ${type === BalanceType.ChannelLocal ? 'local' : 'remote'} channel balance ` +
          `of ${satoshisToCoins(balance)} is more than expected ` +
          `${satoshisToCoins(type === BalanceType.ChannelLocal ? currency.minLocalBalance! : currency.minRemoteBalance!)} again ${Emojis.Checkmark}`;
      }
    } else {
      if (type === BalanceType.Wallet) {
        message = `${Emojis.RotatingLight} **${currency.symbol} wallet balance is out of bounds** ${Emojis.RotatingLight}\n` +
          `  Balance: ${satoshisToCoins(balance)}\n` +
          `${currency.maxWalletBalance ? `    Max: ${satoshisToCoins(currency.maxWalletBalance)}\n` : ''}` +
          `    Min: ${satoshisToCoins(currency.minWalletBalance)}`;
      } else {
        message = `${Emojis.RotatingLight} **${currency.symbol} ${type === BalanceType.ChannelLocal ? 'local' : 'remote'} channel balance ` +
          `of ${satoshisToCoins(balance)} is less than expected ` +
          `${satoshisToCoins(type === BalanceType.ChannelLocal ? currency.minLocalBalance! : currency.minRemoteBalance!)}** ${Emojis.RotatingLight}`;
      }
    }

    this.logger.warn(`Balance warning: ${message}`);
    await this.discord.sendMessage(message);
  }
}

export default BalanceChecker;
export { BalanceType };
