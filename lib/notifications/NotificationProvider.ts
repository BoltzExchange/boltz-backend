import Logger from '../Logger';
import Swap from '../db/models/Swap';
import Service from '../service/Service';
import DiscordClient from './DiscordClient';
import BalanceChecker from './BalanceChecker';
import CommandHandler from './CommandHandler';
import DiskUsageChecker from './DiskUsageChecker';
import ReverseSwap from '../db/models/ReverseSwap';
import BackupScheduler from '../backup/BackupScheduler';
import { CurrencyType, OrderSide } from '../consts/Enums';
import { satoshisToCoins } from '../DenominationConverter';
import { ChainInfo, CurrencyInfo, LndInfo } from '../proto/boltzrpc_pb';
import { CurrencyConfig, NotificationConfig, TokenConfig } from '../Config';
import {
  splitPairId,
  decodeInvoice,
  getChainCurrency,
  getLightningCurrency,
  minutesToMilliseconds,
  getSendingReceivingCurrency,
} from '../Utils';

// TODO: test balance and service alerts
// TODO: use events instead of intervals to check connections and balances
class NotificationProvider {
  private timer!: any;

  private balanceChecker: BalanceChecker;
  private diskUsageChecker: DiskUsageChecker;

  private discord: DiscordClient;

  private disconnected = new Set<string>();

  // This is a Discord hack to add trailing whitespace which is trimmed by default
  private static trailingWhitespace = '\n** **';

  constructor(
    private logger: Logger,
    private service: Service,
    private backup: BackupScheduler,
    private config: NotificationConfig,
    private currencies: CurrencyConfig[],
    private tokenConfigs: TokenConfig[],
  ) {
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

    this.balanceChecker = new BalanceChecker(this.logger, this.service, this.discord, this.currencies, this.tokenConfigs);
    this.diskUsageChecker = new DiskUsageChecker(this.logger, this.discord);
  }

  public init = async (): Promise<void> => {
    try {
      await this.discord.init();

      await this.discord.sendMessage('Started Boltz instance');
      this.logger.verbose('Connected to Discord');

      for (const [, currency] of this.service.currencies) {
        if (currency.lndClient) {
          currency.lndClient.on('subscription.error', async () => await this.sendLostConnection(`LND ${currency.symbol}`));
          currency.lndClient.on('subscription.reconnected', async () => await this.sendReconnected(`LND ${currency.symbol}`));
        }
      }

      const check = async () => {
        await Promise.all([
          this.checkConnections(),
          this.balanceChecker.check(),
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

  public disconnect = (): void => {
    clearInterval(this.timer);
  }

  private checkConnections = async () => {
    const info = await this.service.getInfo();

    const promises: Promise<any>[] = [];

    info.getChainsMap().forEach((currency: CurrencyInfo, symbol: string) => {
      promises.push(this.checkConnection(`LND ${symbol}`, currency.getLnd()));
      promises.push(this.checkConnection(`${symbol} node`, currency.getChain()));
    });

    await Promise.all(promises);
  }

  private checkConnection = async (service: string, object: ChainInfo | LndInfo | undefined) => {
    if (object !== undefined) {
      if (object.getError() === '') {
        await this.sendReconnected(service);

        return;
      }
    }

    await this.sendLostConnection(service);
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
        const lightningAmount = decodeInvoice(swap.invoice).satoshis;

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

    const getMinerFeeSymbol = (symbol: string) => {
      if (this.service.currencies.get(symbol)!.type === CurrencyType.ERC20) {
        return 'ETH';
      } else {
        return symbol;
      }
    };

    this.service.eventHandler.on('swap.success', async (swap, isReverse, channelCreation) => {
      const { onchainSymbol, lightningSymbol } = getSymbols(swap.pair, swap.orderSide, isReverse);

      const hasChannelCreation =
        channelCreation !== null &&
        channelCreation !== undefined &&
        channelCreation.fundingTransactionId !== null;

      // tslint:disable-next-line: prefer-template
      let message = `**Swap ${getSwapTitle(swap.pair, swap.orderSide, isReverse)}${hasChannelCreation ? ' :construction_site:' : ''}**\n` +
        `${getBasicSwapInfo(swap, onchainSymbol, lightningSymbol)}\n` +
        `Fees earned: ${this.numberToDecimal(satoshisToCoins(swap.fee!))} ${onchainSymbol}\n` +
        `Miner fees: ${satoshisToCoins(swap.minerFee!)} ${getMinerFeeSymbol(onchainSymbol)}`;

      if (!isReverse) {
        // The routing fees are denominated in millisatoshi
        message += `\nRouting fees: ${(swap as Swap).routingFee! / 1000} ${this.getSmallestDenomination(lightningSymbol)}`;
      }

      if (hasChannelCreation) {
        // tslint:disable-next-line:prefer-template
        message += '\n\n**Channel Creation:**\n' +
          `Private: ${channelCreation!.private}\n` +
          `Inbound: ${channelCreation!.inboundLiquidity}%\n` +
          `Node: ${channelCreation!.nodePublicKey}\n` +
          `Funding: ${channelCreation!.fundingTransactionId}:${channelCreation!.fundingTransactionVout}`;
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

  private sendLostConnection = async (service: string) => {
    if (!this.disconnected.has(service)) {
      this.disconnected.add(service);
      await this.discord.sendMessage(`**Lost connection to ${service}**`);
    }
  }

  private sendReconnected = async (service: string) => {
    if (this.disconnected.has(service)) {
      this.disconnected.delete(service);
      await this.discord.sendMessage(`Reconnected to ${service}`);
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

      // Trim the trailing zeros if they exist
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
