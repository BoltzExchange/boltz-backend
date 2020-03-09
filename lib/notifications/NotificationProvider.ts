import Logger from '../Logger';
import Swap from '../db/models/Swap';
import Service from '../service/Service';
import { OrderSide } from '../consts/Enums';
import DiscordClient from './DiscordClient';
import CommandHandler from './CommandHandler';
import DiskUsageChecker from './DiskUsageChecker';
import ReverseSwap from '../db/models/ReverseSwap';
import BackupScheduler from '../backup/BackupScheduler';
import { satoshisToCoins } from '../DenominationConverter';
import { NotificationConfig, CurrencyConfig } from '../Config';
import { CurrencyInfo, LndInfo, ChainInfo } from '../proto/boltzrpc_pb';
import {
  splitPairId,
  getInvoiceAmt,
  minutesToMilliseconds,
  getChainCurrency,
  getLightningCurrency,
  getSendingReceivingCurrency,
} from '../Utils';

// TODO: test balance and service alerts
// TODO: use events instead of intervals to check connections and balances
class NotificationProvider {
  private timer!: any;
  private discord: DiscordClient;
  private diskUsageChecker: DiskUsageChecker;

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
      this.config,
      this.discord,
      this.service,
      this.backup,
    );

    this.diskUsageChecker = new DiskUsageChecker(this.logger, this.discord);
  }

  public init = async () => {
    try {
      await this.discord.init();

      await this.discord.sendMessage('Started Boltz instance');
      this.logger.verbose('Connected to Discord');

      const check = async () => {
        await Promise.all([
          this.checkBalances(),
          this.checkConnections(),
          this.diskUsageChecker.checkUsage(),
        ]);
      };

      await check();

      this.logger.debug(`Checking balances and connection status every ${this.config.interval} minutes`);

      this.timer = setInterval(async () => {
        await check();
      }, minutesToMilliseconds(this.config.interval));
    } catch (error) {
      this.logger.warn(`Could start notification service: ${error}`);
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
          await this.checkBalance(
            symbol,
            this.localBalanceAlerts,
            lightningBalance.getLocalBalance(),
            minLocalBalance,
            false,
            true,
          );

          await this.checkBalance(
            symbol,
            this.remoteBalanceAlerts,
            lightningBalance.getRemoteBalance(),
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
    const getSwapTitle = (pair: string, orderSide: OrderSide, isReverse: boolean) => {
      const { base, quote } = splitPairId(pair);
      const { sending, receiving } = getSendingReceivingCurrency(base, quote, orderSide);

      return `${receiving}${isReverse ? ' :zap:' : ''} -> ${sending}${!isReverse ? ' :zap:' : ''}`;
    };

    const getBasicSwapInfo = (swap: Swap | ReverseSwap, onchainSymbol: string, lightningSymbol: string) => {
      // tslint:disable-next-line: prefer-template
      let message = `ID: ${swap.id}\n` +
        `Pair: ${swap.pair}\n` +
        `Order side: ${swap.orderSide === OrderSide.BUY ? 'buy' : 'sell'}`;

      if (swap.invoice) {
        const lightningAmount = getInvoiceAmt(swap.invoice);

        message += `${swap.onchainAmount ? `\nOnchain amount: ${satoshisToCoins(swap.onchainAmount)} ${onchainSymbol}` : ''}` +
          `\nLightning amount: ${satoshisToCoins(lightningAmount)} ${lightningSymbol}`;
      }

      return message;
    };

    const getSymbols = (pairId: string, orderSide: number, isReverse: boolean) => {
      const { base, quote } = splitPairId(pairId);

      return {
        onchainSymbol: getChainCurrency(base, quote, orderSide, isReverse),
        lightningSymbol: getLightningCurrency(base, quote, orderSide, isReverse),
      };
    };

    this.service.eventHandler.on('swap.success', async (swap, isReverse) => {
      const { onchainSymbol, lightningSymbol } = getSymbols(swap.pair, swap.orderSide, isReverse);

      // tslint:disable-next-line: prefer-template
      let message = `**Swap ${getSwapTitle(swap.pair, swap.orderSide, isReverse)}**\n` +
       `${getBasicSwapInfo(swap, onchainSymbol, lightningSymbol)}\n` +
       `Fees earned: ${this.numberToDecimal(satoshisToCoins(swap.fee!))} ${onchainSymbol}\n` +
       `Miner fees: ${satoshisToCoins(swap.minerFee!)} ${onchainSymbol}`;

      if (!isReverse) {
        // The routing fees are denominated in millisatoshi
        message += `\nRouting fees: ${(swap as Swap).routingFee! / 1000} ${this.getSmallestDenomination(lightningSymbol)}`;
      }

      await this.discord.sendMessage(`${message}${NotificationProvider.trailingWhitespace}`);
    });

    this.service.eventHandler.on('swap.failure', async (swap, isReverse, reason) => {
      const { onchainSymbol, lightningSymbol } = getSymbols(swap.pair, swap.orderSide, isReverse);

      // tslint:disable-next-line: prefer-template
      let message = `**Swap ${getSwapTitle(swap.pair, swap.orderSide, isReverse)} failed: ${reason}**\n` +
        `${getBasicSwapInfo(swap, onchainSymbol, lightningSymbol)}`;

      if (isReverse) {
        if (swap.minerFee) {
          message += `\nMiner fees: ${satoshisToCoins(swap.minerFee)} ${onchainSymbol}`;
        }
      } else if (swap.invoice) {
        message += `\nInvoice: ${swap.invoice}`;
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
    let message = `The ${currency} ${balanceName} balance of ${actual} ${currency} is less than expected ${expected} ${currency}\n\n` +
      `Funds missing: **${missing} ${currency}**`;

    if (isWallet) {
      const address = await this.service.getAddress(currency);

      message += `\nDeposit address: **${address}**`;
    }

    await this.discord.sendAlert(message);
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

  private numberToDecimal = (toFormat: number) => {
    // Numbers smaller 1e-6 are formatted in the scientific notation when converted to a string
    if (toFormat < 1e-6) {
      let format = toFormat.toFixed(8);

      // Trim the leading 0 if it exists
      const lastZero = format.lastIndexOf('0');

      if (lastZero === format.length - 1) {
        format = format.slice(0, format.length - 1);
      }

      return format;
    } else {
      return toFormat.toString();
    }
  }
}

export default NotificationProvider;
