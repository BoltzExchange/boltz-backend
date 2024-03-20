import { BaseCurrencyConfig, NotificationConfig, TokenConfig } from '../Config';
import { satoshisToSatcomma } from '../DenominationConverter';
import Logger from '../Logger';
import {
  decodeInvoice,
  formatError,
  getChainCurrency,
  getLightningCurrency,
  getSendingReceivingCurrency,
  minutesToMilliseconds,
  splitPairId,
} from '../Utils';
import BackupScheduler from '../backup/BackupScheduler';
import {
  ClientStatus,
  CurrencyType,
  OrderSide,
  SwapType,
} from '../consts/Enums';
import ChainSwapData from '../db/models/ChainSwapData';
import ReverseSwap from '../db/models/ReverseSwap';
import Swap from '../db/models/Swap';
import { ChainSwapInfo } from '../db/repositories/ChainSwapRepository';
import LndClient from '../lightning/LndClient';
import ClnClient from '../lightning/cln/ClnClient';
import { ChainInfo, LightningInfo } from '../proto/boltzrpc_pb';
import Service from '../service/Service';
import WalletManager from '../wallet/WalletManager';
import BalanceChecker from './BalanceChecker';
import CommandHandler from './CommandHandler';
import DiskUsageChecker from './DiskUsageChecker';
import { Emojis } from './Markup';
import DiscordClient from './clients/DiscordClient';
import MattermostClient from './clients/MattermostClient';
import NotificationClient from './clients/NotificationClient';

// TODO: test balance and service alerts
// TODO: use events instead of intervals to check connections and balances
class NotificationProvider {
  private timer!: any;

  private balanceChecker: BalanceChecker;
  private diskUsageChecker: DiskUsageChecker;

  private client: NotificationClient;

  private disconnected = new Set<string>();

  // This is a Discord hack to add trailing whitespace which is trimmed by default
  private static trailingWhitespace = '\n** **';

  constructor(
    private logger: Logger,
    private service: Service,
    private walletManager: WalletManager,
    private backup: BackupScheduler,
    private config: NotificationConfig,
    currencies: (BaseCurrencyConfig | undefined)[],
    tokenConfigs: TokenConfig[],
  ) {
    if (this.config.mattermostUrl === undefined) {
      this.client = new DiscordClient(this.logger, config);
    } else {
      this.client = new MattermostClient(this.logger, config);
    }

    this.listenToDiscord();
    this.listenToService();

    new CommandHandler(
      this.logger,
      this.config,
      this.client,
      this.service,
      this.backup,
    );

    this.balanceChecker = new BalanceChecker(
      this.logger,
      this.service,
      this.client,
      currencies,
      tokenConfigs,
    );
    this.diskUsageChecker = new DiskUsageChecker(this.logger, this.client);
  }

  public init = async (): Promise<void> => {
    try {
      await this.client.init();

      await this.client.sendMessage('Started Boltz instance');
      this.logger.verbose(`Connected to ${this.client.serviceName}`);

      for (const [symbol, currency] of this.service.currencies) {
        [currency.lndClient, currency.clnClient]
          .filter(
            (client): client is LndClient | ClnClient => client !== undefined,
          )
          .forEach((client) => {
            client.on('status.changed', async (status: ClientStatus) => {
              switch (status) {
                case ClientStatus.Connected:
                  await this.sendReconnected(
                    `${client.serviceName()} ${symbol}`,
                  );
                  break;

                case ClientStatus.Disconnected:
                  await this.sendLostConnection(
                    `${client.serviceName()} ${symbol}`,
                  );
                  break;
              }
            });

            client.on('subscription.error', async (subscription?: string) => {
              await this.sendLostConnection(
                `${client.serviceName()} ${symbol}`,
                subscription,
              );
            });

            client.on(
              'subscription.reconnected',
              async () =>
                await this.sendReconnected(`${client.serviceName()} ${symbol}`),
            );
          });
      }

      const check = async () => {
        await Promise.all([
          this.checkConnections(),
          this.balanceChecker.check(),
          this.diskUsageChecker.checkUsage(),
        ]);
      };

      await check();

      this.logger.debug(
        `Checking balances and connection status every ${this.config.interval} minutes`,
      );

      this.timer = setInterval(async () => {
        await check();
      }, minutesToMilliseconds(this.config.interval));
    } catch (error) {
      this.logger.warn(`Could not start notification service: ${error}`);
    }
  };

  public disconnect = (): void => {
    clearInterval(this.timer);
  };

  private checkConnections = async () => {
    const info = (await this.service.getInfo()).toObject();

    const promises: Promise<void>[] = [];

    info.chainsMap.forEach(([symbol, currency]) => {
      currency.lightningMap.forEach(([service, lnInfo]) => {
        promises.push(this.checkConnection(`${symbol} ${service}`, lnInfo));
      });
      promises.push(this.checkConnection(`${symbol} node`, currency.chain));
    });

    await Promise.all(promises);
  };

  private checkConnection = async (
    service: string,
    object: ChainInfo.AsObject | LightningInfo.AsObject | undefined,
  ) => {
    if (object !== undefined) {
      if (object.error === '') {
        await this.sendReconnected(service);

        return;
      }
    }

    await this.sendLostConnection(service);
  };

  private listenToDiscord = () => {
    this.client.on('error', (error) => {
      this.logger.warn(`Discord client threw: ${formatError(error)}`);
    });
  };

  private listenToService = () => {
    const prefixLightning = (condition: boolean, asset: string) =>
      `${asset}${condition ? ` ${Emojis.Zap}` : ''}`;

    const getSwapTitle = (
      type: SwapType,
      sending: string,
      receiving: string,
    ) => {
      return `${prefixLightning(type === SwapType.ReverseSubmarine, receiving)} -> ${prefixLightning(type === SwapType.Submarine, sending)}`;
    };

    const getBasicSwapInfo = (
      type: SwapType,
      swap: ChainSwapInfo | Swap | ReverseSwap,
      base: string,
      quote: string,
    ) => {
      const message =
        `ID: ${swap.id}\n` +
        `Pair: ${swap.pair}\n` +
        `Order side: ${swap.orderSide === OrderSide.BUY ? 'buy' : 'sell'}`;

      if (type === SwapType.Chain) {
        const chainSwap = swap as ChainSwapInfo;

        return (
          message +
          `\nSending: ${satoshisToSatcomma(chainSwap.sendingData.amount || chainSwap.sendingData.expectedAmount)} ${chainSwap.sendingData.symbol}\n` +
          `Receiving: ${satoshisToSatcomma(chainSwap.receivingData.amount || chainSwap.receivingData.expectedAmount)} ${chainSwap.receivingData.symbol}`
        );
      } else {
        const submarineSwap = swap as Swap | ReverseSwap;
        if (submarineSwap.invoice === undefined) {
          return message;
        }

        const lightningAmount = decodeInvoice(submarineSwap.invoice).satoshis;

        return (
          message +
          `${
            submarineSwap.onchainAmount
              ? `\nOnchain amount: ${satoshisToSatcomma(
                  submarineSwap.onchainAmount,
                )} ${getChainCurrency(base, quote, swap.orderSide, type === SwapType.ReverseSubmarine)}`
              : ''
          }` +
          `\nLightning amount: ${satoshisToSatcomma(
            lightningAmount,
          )} ${getLightningCurrency(base, quote, swap.orderSide, type === SwapType.ReverseSubmarine)}`
        );
      }
    };

    this.service.eventHandler.on(
      'swap.success',
      async ({ type, swap, channelCreation }) => {
        const { base, quote } = splitPairId(swap.pair);
        const { sending, receiving } = getSendingReceivingCurrency(
          base,
          quote,
          swap.orderSide,
        );

        const hasChannelCreation =
          channelCreation !== null &&
          channelCreation !== undefined &&
          channelCreation.fundingTransactionId !== null;

        let message =
          `**Swap ${getSwapTitle(type, sending, receiving)}${
            hasChannelCreation ? ` ${Emojis.ConstructionSite}` : ''
          }**\n` +
          `${getBasicSwapInfo(type, swap, base, quote)}\n` +
          `Fees earned: ${satoshisToSatcomma(swap.fee!)} ${sending}\n` +
          `Miner fees: ${this.getMinerFees(type, swap)}`;

        if (type === SwapType.Submarine) {
          // The routing fees are denominated in millisatoshi
          message += `\nRouting fees: ${
            (swap as Swap).routingFee! / 1000
          } sats`;
        }

        if (hasChannelCreation) {
          message +=
            '\n\n**Channel Creation:**\n' +
            `Private: ${channelCreation!.private}\n` +
            `Inbound: ${channelCreation!.inboundLiquidity}%\n` +
            `Node: ${channelCreation!.nodePublicKey}\n` +
            `Funding: ${channelCreation!.fundingTransactionId}:${
              channelCreation!.fundingTransactionVout
            }`;
        }

        await this.client.sendMessage(
          `${message}${NotificationProvider.trailingWhitespace}`,
        );
      },
    );

    this.service.eventHandler.on(
      'swap.failure',
      async ({ type, swap, reason }) => {
        const { base, quote } = splitPairId(swap.pair);
        const { sending, receiving } = getSendingReceivingCurrency(
          base,
          quote,
          swap.orderSide,
        );

        let message =
          `**Swap ${getSwapTitle(
            type,
            sending,
            receiving,
          )} failed: ${reason}**\n` +
          `${getBasicSwapInfo(type, swap, base, quote)}`;

        if (type === SwapType.Submarine) {
          const submarineSwap = swap as Swap;

          if (submarineSwap.invoice) {
            message += `\nInvoice: ${submarineSwap.invoice}`;
          }
        } else {
          if (
            (type === SwapType.ReverseSubmarine &&
              (swap as ReverseSwap).minerFee) ||
            (type === SwapType.Chain && (swap as ChainSwapInfo).paidMinerFees)
          ) {
            message += `\nMiner fees: ${this.getMinerFees(type, swap)}`;
          }
        }

        await this.client.sendMessage(
          `${message}${NotificationProvider.trailingWhitespace}`,
        );
      },
    );
  };

  private sendLostConnection = async (
    service: string,
    subscription?: string,
  ) => {
    if (this.disconnected.has(service)) {
      return;
    }

    if (subscription === undefined) {
      this.disconnected.add(service);
    }

    await this.client.sendMessage(
      `**Lost connection to ${service}${
        subscription ? ` ${subscription} subscription` : ''
      }**`,
      true,
    );
  };

  private sendReconnected = async (service: string) => {
    if (this.disconnected.has(service)) {
      this.disconnected.delete(service);
      await this.client.sendMessage(`Reconnected to ${service}`, true);
    }
  };

  private getMinerFees = (
    type: SwapType,
    swap: Swap | ReverseSwap | ChainSwapInfo,
  ) => {
    if (type === SwapType.Chain) {
      const chainSwap = swap as ChainSwapInfo;

      let msg = '';

      const appendFees = (prefix: string, data: ChainSwapData) => {
        if (data.fee === undefined) {
          return;
        }

        msg += `\n  - ${prefix}: ${satoshisToSatcomma(data.fee!)} ${data.symbol}`;
      };
      appendFees('Sending', chainSwap.sendingData);
      appendFees('Receiving', chainSwap.receivingData);

      return msg;
    } else {
      const { base, quote } = splitPairId(swap.pair);

      return `${satoshisToSatcomma(
        (swap as Swap | ReverseSwap).minerFee!,
      )} ${this.getMinerFeeSymbol(getChainCurrency(base, quote, swap.orderSide, type === SwapType.ReverseSubmarine))}`;
    }
  };

  private getMinerFeeSymbol = (symbol: string) => {
    if (this.service.currencies.get(symbol)!.type === CurrencyType.ERC20) {
      return (
        this.walletManager.ethereumManagers.find((manager) =>
          manager.hasSymbol(symbol),
        )?.networkDetails.symbol || ''
      );
    } else {
      return symbol;
    }
  };
}

export default NotificationProvider;
