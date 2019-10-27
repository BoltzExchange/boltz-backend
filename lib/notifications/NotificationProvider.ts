/* tslint:disable:prefer-template */

import { OutputType } from 'boltz-core/dist/consts/Enums';
import Logger from '../Logger';
import Swap from '../db/models/Swap';
import Errors from '../wallet/Errors';
import Service from '../service/Service';
import DiscordClient from './DiscordClient';
import CommandHandler from './CommandHandler';
import DiskUsageChecker from './DiskUsageChecker';
import ReverseSwap from '../db/models/ReverseSwap';
import { GenericSwap } from '../service/EventHandler';
import { OrderSide, SwapType } from '../consts/Enums';
import BackupScheduler from '../backup/BackupScheduler';
import { satoshisToCoins } from '../DenominationConverter';
import ChainToChainSwap from '../db/models/ChainToChainSwap';
import { NotificationConfig, CurrencyConfig } from '../Config';
import { CurrencyInfo, LndInfo, ChainInfo } from '../proto/boltzrpc_pb';
import {
  splitPairId,
  getInvoiceAmt,
  getChainCurrency,
  getLightningCurrency,
  minutesToMilliseconds,
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
    const getSymbols = (pairId: string, orderSide: number, isReverse: boolean) => {
      const { base, quote } = splitPairId(pairId);

      return {
        onchainSymbol: getChainCurrency(base, quote, orderSide, isReverse),
        lightningSymbol: getLightningCurrency(base, quote, orderSide, isReverse),
      };
    };

    const getSwapTitle = (pair: string, orderSide: OrderSide, type: SwapType) => {
      const getPrefix = (type: SwapType, isBase: boolean) => {
        if (
          (!isBase && type === SwapType.Submarine) ||
          (isBase && type === SwapType.ReverseSubmarine)
        ) {
          return ':zap: ';
        } else {
          return '';
        }
      };

      const { base, quote } = splitPairId(pair);
      const { sending, receiving } = getSendingReceivingCurrency(base, quote, orderSide);

      return `${getPrefix(type, true)}${receiving} -> ${getPrefix(type, false)}${sending}`;
    };

    const getSwapInfo = (swap: GenericSwap, type: SwapType, swapSucceeded: boolean) => {
      let message = `ID: ${swap.id}\n` +
      `Pair: ${swap.pair}\n` +
      `Order side: ${swap.orderSide === OrderSide.BUY ? 'buy' : 'sell'}\n`;

      if (type !== SwapType.ChainToChain) {
        const submarineSwap = swap as Swap | ReverseSwap;
        const lightningAmount = getInvoiceAmt(submarineSwap.invoice);
        const { lightningSymbol, onchainSymbol } = getSymbols(swap.pair, swap.orderSide, type === SwapType.ReverseSubmarine);

        message += `${submarineSwap.onchainAmount ? `Onchain amount: ${satoshisToCoins(submarineSwap.onchainAmount!)} ${onchainSymbol}\n` : ''}` +
        `Lightning amount: ${satoshisToCoins(lightningAmount)} ${lightningSymbol}\n` +
        `${swapSucceeded ? `Fees earned: ${satoshisToCoins(submarineSwap.fee)} ${onchainSymbol}\n` : ''}` +
        `${submarineSwap.minerFee ? `Miner fees: ${satoshisToCoins(submarineSwap.minerFee)} ${onchainSymbol}` : ''}`;

        if (swapSucceeded && type === SwapType.Submarine) {
          message += `\nRouting fees: ${(swap as Swap).routingFee! / 1000} ${this.getSmallestDenomination(lightningSymbol)}`;
        }

      } else {
        const chainToChainSwap = swap as ChainToChainSwap;
        const { base, quote } = splitPairId(chainToChainSwap.pair);
        const { sending, receiving } = getSendingReceivingCurrency(base, quote, swap.orderSide);

        const showMinerFees = chainToChainSwap.sendingMinerFee !== null || chainToChainSwap.receivingMinerFee !== null;

        message += `Amount sent: ${satoshisToCoins(chainToChainSwap.sendingAmount)} ${sending}\n` +
        `Amount received: ${satoshisToCoins(chainToChainSwap.receivingAmount)} ${receiving}` +
        `${showMinerFees ? '\nMiner fees:\n' : ''}` +
        `${chainToChainSwap.sendingMinerFee ? `  - ${satoshisToCoins(chainToChainSwap.sendingMinerFee)} ${sending}` : ''}` +
        `${chainToChainSwap.receivingMinerFee ? `\n  - ${satoshisToCoins(chainToChainSwap.receivingMinerFee)} ${receiving}` : ''}` +
        `${swapSucceeded ? `\nFees earned: ${satoshisToCoins(chainToChainSwap.fee)} ${receiving}` : ''}`;
      }

      return message;
    };

    this.service.eventHandler.on('swap.success', async (swap, type) => {
      const message = `**Swap ${getSwapTitle(swap.pair, swap.orderSide, type)}**\n${getSwapInfo(swap, type, true)}`;

      await this.discord.sendMessage(`${message}${NotificationProvider.trailingWhitespace}`);
    });

    this.service.eventHandler.on('swap.failure', async (swap, type, reason) => {
      let message = `**Swap ${getSwapTitle(swap.pair, swap.orderSide, type)} failed: ${reason}**\n` +
        `${getSwapInfo(swap, type, false)}`;

      if (type === SwapType.Submarine) {
        const submarineSwap = swap as Swap | ReverseSwap;
        message += `Invoice: ${submarineSwap.invoice}`;
      }

      await this.discord.sendMessage(`${message}${NotificationProvider.trailingWhitespace}`);
    });
  }

  private sendAlert = async (currency: string, balance: number, threshold: number, isWallet: boolean, isLocal?: boolean) => {
    const { actual, expected } = this.formatBalances(balance, threshold);
    const missing = satoshisToCoins(threshold - balance);

    const balanceName = this.getBalanceName(isWallet, isLocal);

    this.logger.warn(`${currency} ${balanceName} balance is less than ${threshold}: ${balance}`);

    let message = `The ${currency} ${balanceName} balance of ${actual} ${currency} is less than expected ${expected} ${currency}\n\n` +
      `Funds missing: **${missing} ${currency}**`;

    if (isWallet) {
      let address = '';

      // Try to generate a SegWit compatibility address and fall back to a legacy one
      try {
        address = await this.service.newAddress(currency, OutputType.Compatibility);
      } catch (error) {
        if (error.code === Errors.OUTPUTTYPE_NOT_SUPPORTED('', 0).code) {
          address = await this.service.newAddress(currency, OutputType.Legacy);
        } else {
          throw error;
        }
      }

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
}

export default NotificationProvider;
