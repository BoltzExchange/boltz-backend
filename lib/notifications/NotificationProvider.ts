import Logger from '../Logger';
import Swap from '../db/models/Swap';
import Service from '../service/Service';
import DiscordClient from './DiscordClient';
import CommandHandler from './CommandHandler';
import ReverseSwap from '../db/models/ReverseSwap';
import BackupScheduler from '../backup/BackupScheduler';
import { SwapUpdateEvent, OrderSide } from '../consts/Enums';
import { NotificationConfig, CurrencyConfig } from '../Config';
import { OutputType, CurrencyInfo, LndInfo, ChainInfo } from '../proto/boltzrpc_pb';
import {
  splitPairId,
  getInvoiceAmt,
  satoshisToCoins,
  minutesToMilliseconds,
  getChainCurrency,
  getLightningCurrency,
} from '../Utils';

// TODO: use events instead of intervals to check connections and balances
class NotificationProvider {
  private timer!: any;
  private discord: DiscordClient;

  // These Sets contain the symbols for which an alert notification was sent
  private walletAlerts = new Set<string>();

  private localBalanceAlerts = new Set<string>();
  private remoteBalanceAlerts = new Set<string>();

  private disconnected = new Set<string>();

  // This is a Discord hack to add trailing whitespace which is trimmed by default
  private static trailingWhitespace = '\n** **';

  constructor(
    private logger: Logger,
    private service: Service,
    private backup: BackupScheduler,
    private config: NotificationConfig,
    private currencies: CurrencyConfig[]) {

    this.discord = new DiscordClient(
      config.token,
      config.channel,
      config.prefix,
    );

    this.listenToDiscord();
    this.listenToService();

    new CommandHandler(
      this.logger,
      this.discord,
      this.service,
      this.backup,
    );
  }

  public init = async () => {
    try {
      await this.discord.init();

      await this.discord.sendMessage('Started Boltz instance');
      this.logger.verbose('Connected to Discord');

      const check = async () => {
        await this.checkConnections();
        await this.checkBalances();
      };

      await check();

      this.logger.debug(`Checking balances and connection status every ${this.config.interval} minutes`);

      this.timer = setInterval(async () => {
        await check();
      }, minutesToMilliseconds(this.config.interval));
    } catch (error) {
      this.logger.warn(`Could not connect to Discord: ${error}`);
    }
  }

  public disconnect = () => {
    clearInterval(this.timer);
  }

  private checkConnections = async () => {
    const info = await this.service.getInfo();

    info.getChainsMap().forEach(async (currency: CurrencyInfo, symbol: string) => {
      await this.checkConnection(`${symbol} LND`, currency.getLnd());
      await this.checkConnection(`${symbol} node`, currency.getChain());
    });
  }

  private checkConnection = async (service: string, object: ChainInfo | LndInfo | undefined) => {
    if (object !== undefined) {
      if (object.getError() === '') {
        if (this.disconnected.has(service)) {
          this.disconnected.delete(service);
          await this.sendReconnected(service);
        }

        return;
      }
    }

    if (!this.disconnected.has(service)) {
      this.disconnected.add(service);
      await this.sendLostConnection(service);
    }
  }

  private checkBalances = async () => {
    const balances = (await this.service.getBalance()).getBalancesMap();

    for (const currency of this.currencies) {
      const balance = balances.get(currency.symbol);

      if (balance) {
        const { symbol, minWalletBalance, minLocalBalance, minRemoteBalance } = currency;

        await this.checkBalance(symbol, this.walletAlerts, balance.getWalletBalance()!.getTotalBalance(), minWalletBalance, true);

        const lightningBalance = balance.getLightningBalance();

        if (lightningBalance) {
          const channelBalance = lightningBalance.getChannelBalance()!;

          await this.checkBalance(
            symbol,
            this.localBalanceAlerts,
            channelBalance.getLocalBalance(),
            minLocalBalance,
            false,
            true,
          );

          await this.checkBalance(
            symbol,
            this.remoteBalanceAlerts,
            channelBalance.getRemoteBalance(),
            minRemoteBalance,
            false,
            false,
          );
        }
      }
    }
  }

  private checkBalance = async (currency: string, set: Set<string>, balance: number, threshold: number, isWallet: boolean, isLocal?: boolean) => {
    const sentAlert = set.has(currency);

    if (sentAlert) {
      if (balance > threshold) {
        set.delete(currency);
        await this.sendRelief(currency, balance, threshold, isWallet, isLocal);
      }
    } else {
      if (balance <= threshold) {
        set.add(currency);
        await this.sendAlert(currency, balance, threshold, isWallet, isLocal);
      }
    }
  }

  private listenToDiscord = () => {
    this.discord.on('error', (error) => {
      this.logger.warn(`Discord client threw: ${error.message}`);
    });
  }

  private listenToService = () => {
    const getSwapName = (isReverse: boolean) => isReverse ? 'Reverse swap' : 'Swap';

    const getBasicSwapInfo = (swap: Swap | ReverseSwap, onchainSymbol: string, lightningSymbol: string) => {
      const lightningAmount = getInvoiceAmt(swap.invoice);

      // tslint:disable-next-line: prefer-template
      return `ID: ${swap.id}\n` +
        `Pair: ${swap.pair}\n` +
        `Order side: ${swap.orderSide === OrderSide.BUY ? 'buy' : 'sell'}\n` +
        `${swap.onchainAmount ? `Onchain amount: ${satoshisToCoins(swap.onchainAmount)} ${onchainSymbol}\n` : ''}` +
        `Lightning amount: ${satoshisToCoins(lightningAmount)} ${lightningSymbol}\n`;
    };

    const getSymbols = (pairId: string, orderSide: number, isReverse: boolean) => {
      const { base, quote } = splitPairId(pairId);

      return {
        onchainSymbol: getChainCurrency(base, quote, orderSide, isReverse),
        lightningSymbol: getLightningCurrency(base, quote, orderSide, isReverse),
      };
    };

    this.service.eventHandler.on('swap.success', async (swap) => {
      const isReverse = swap.status === SwapUpdateEvent.InvoiceSettled;
      const { onchainSymbol, lightningSymbol } = getSymbols(swap.pair, swap.orderSide, isReverse);

      // tslint:disable-next-line: prefer-template
      let message = `**${getSwapName(isReverse)}**\n` +
       `${getBasicSwapInfo(swap, onchainSymbol, lightningSymbol)}` +
       `Fees earned: ${satoshisToCoins(swap.fee)} ${onchainSymbol}\n` +
       `Miner fees: ${satoshisToCoins(swap.minerFee!)} ${onchainSymbol}`;

      if (!isReverse) {
        // The routing fees are denominated in millisatoshi
        message += `\nRouting fees: ${(swap as Swap).routingFee! / 1000} ${this.getSmallestDenomination(lightningSymbol)}`;
      }

      await this.discord.sendMessage(`${message}${NotificationProvider.trailingWhitespace}`);
    });

    this.service.eventHandler.on('swap.failure', async (swap, reason) => {
      const isReverse = swap.status === SwapUpdateEvent.TransactionRefunded;
      const { onchainSymbol, lightningSymbol } = getSymbols(swap.pair, swap.orderSide, isReverse);

      // tslint:disable-next-line: prefer-template
      let message = `**${getSwapName(isReverse)} failed: ${reason}**\n` +
        `${getBasicSwapInfo(swap, onchainSymbol, lightningSymbol)}`;

      if (isReverse) {
        message += `Miner fees: ${satoshisToCoins(swap.minerFee!)} ${onchainSymbol}`;
      } else {
        message += `Invoice: ${swap.invoice}`;
      }

      await this.discord.sendMessage(`${message}${NotificationProvider.trailingWhitespace}`);
    });
  }

  private sendAlert = async (currency: string, balance: number, threshold: number, isWallet: boolean, isLocal?: boolean) => {
    const { actual, expected } = this.formatBalances(balance, threshold);
    const missing = satoshisToCoins(threshold - balance);

    const balanceName = this.getBalanceName(isWallet, isLocal);

    this.logger.warn(`${currency} ${balanceName} balance is less than ${threshold}: ${balance}`);

    // tslint:disable-next-line:prefer-template
    let message = ':rotating_light: **Alert** :rotating_light:\n\n' +
      `The ${currency} ${balanceName} balance of ${actual} ${currency} is less than expected ${expected} ${currency}\n\n` +
      `Funds missing: **${missing} ${currency}**`;

    if (isWallet) {
      const address = await this.service.newAddress(currency, OutputType.COMPATIBILITY);
      message += `\nDeposit address: **${address}**`;
    }

    await this.discord.sendMessage(message);
  }

  private sendRelief = async (currency: string, balance: number, threshold: number, isWallet: boolean, isLocal?: boolean) => {
    const { actual, expected } = this.formatBalances(balance, threshold);
    const balanceName = this.getBalanceName(isWallet, isLocal);

    this.logger.info(`${currency} ${balanceName} balance is more than expected ${threshold} again: ${balance}`);

    await this.discord.sendMessage(
      `The ${currency} ${balanceName} balance of ${actual} ${currency} is more than expected ${expected} ${currency} again`,
    );
  }

  private sendLostConnection = async (service: string) => {
    await this.discord.sendMessage(`**Lost connection to ${service}**`);
  }

  private sendReconnected = async (service: string) => {
    await this.discord.sendMessage(`Reconnected to ${service}`);
  }

  private formatBalances = (balance: number, threshold: number) => {
    return {
      actual: satoshisToCoins(balance),
      expected: satoshisToCoins(threshold),
    };
  }

  private getBalanceName = (isWallet: boolean, isLocal?: boolean) => {
    if (isWallet) {
      return 'wallet';
    } else {
      return isLocal ? 'local' : 'remote';
    }
  }

  private getSmallestDenomination = (symbol: string): string => {
    switch (symbol) {
      case 'LTC': return 'litoshi';
      default: return 'satoshi';
    }
  }
}

export default NotificationProvider;
export { NotificationConfig };
