import type { Transporter } from 'nodemailer';
import type { EmailConfig } from '../Config';
import { satoshisToSatcomma } from '../DenominationConverter';
import type Logger from '../Logger';
import {
  formatError,
  getChainCurrency,
  getLightningCurrency,
  getSendingReceivingCurrency,
  splitPairId,
} from '../Utils';
import { CurrencyType, OrderSide, SwapType } from '../consts/Enums';
import type { AnySwap } from '../consts/Types';
import type ChainSwapData from '../db/models/ChainSwapData';
import type ChannelCreation from '../db/models/ChannelCreation';
import type ReverseSwap from '../db/models/ReverseSwap';
import type Swap from '../db/models/Swap';
import type { ChainSwapInfo } from '../db/repositories/ChainSwapRepository';
import { msatToSat } from '../lightning/ChannelUtils';
import type Service from '../service/Service';
import type Sidecar from '../sidecar/Sidecar';
import type WalletManager from '../wallet/WalletManager';

class EmailNotifier {
  private transporter?: Transporter;

  // This is a hack to add trailing whitespace which is trimmed by default in some email clients
  private static trailingWhitespace = '\n\n';

  constructor(
    private readonly config: EmailConfig | undefined,
    private readonly logger: Logger,
    private readonly service: Service,
    private readonly walletManager: WalletManager,
    private readonly sidecar: Sidecar,
  ) {}

  public init = async (): Promise<void> => {
    await this.initializeTransporter();

    if (!this.transporter) {
      this.logger.warn(
        'Email notifier transporter not initialized. Skipping event subscriptions.',
      );
      return;
    }

    this.logger.debug('Subscribing email notifier to service events');

    this.service.eventHandler.on(
      'swap.success',
      async ({ swap, channelCreation }) => {
        try {
          await this.sendSuccessEmail(swap, channelCreation);
        } catch (error) {
          this.logger.error(
            `Failed to send success email for swap ${swap.id}: ${formatError(
              error,
            )}`,
          );
        }
      },
    );

    this.service.eventHandler.on('swap.failure', async ({ swap, reason }) => {
      try {
        await this.sendFailureEmail(swap, reason);
      } catch (error) {
        this.logger.error(
          `Failed to send failure email for swap ${swap.id}: ${formatError(
            error,
          )}`,
        );
      }
    });
  };

  private getSwapTitle = (
    type: SwapType,
    sending: string,
    receiving: string,
  ): string => {
    const prefixLightning = (condition: boolean, asset: string) =>
      `${asset}${condition ? ' ⚡' : ''}`;
    return `${prefixLightning(type === SwapType.ReverseSubmarine, receiving)} -> ${prefixLightning(type === SwapType.Submarine, sending)}`;
  };

  private getBasicSwapInfo = async (
    type: SwapType,
    swap: AnySwap,
    base: string,
    quote: string,
  ): Promise<string> => {
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
      if (
        submarineSwap.invoice === null ||
        submarineSwap.invoice === undefined
      ) {
        return message;
      }

      const decodedInvoice = await this.sidecar.decodeInvoiceOrOffer(
        submarineSwap.invoice,
      );
      const lightningAmount = msatToSat(decodedInvoice.amountMsat);

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

  private getMinerFees = (type: SwapType, swap: AnySwap): string => {
    if (type === SwapType.Chain) {
      const chainSwap = swap as ChainSwapInfo;
      let msg = '';

      const appendFees = (prefix: string, data: ChainSwapData) => {
        if (data.fee === undefined || data.fee === null) {
          return;
        }
        msg += `\n  - ${prefix}: ${satoshisToSatcomma(data.fee)} ${data.symbol}`;
      };
      appendFees('Sending', chainSwap.sendingData);
      appendFees('Receiving', chainSwap.receivingData);

      return msg;
    } else {
      const { base, quote } = splitPairId(swap.pair);
      const minerFee = (swap as Swap | ReverseSwap).minerFee;

      if (minerFee === undefined || minerFee === null) {
        return 'N/A';
      }

      return `${satoshisToSatcomma(minerFee)} ${this.getMinerFeeSymbol(getChainCurrency(base, quote, swap.orderSide, type === SwapType.ReverseSubmarine))}`;
    }
  };

  private getMinerFeeSymbol = (symbol: string): string => {
    const currency = this.service.currencies.get(symbol);
    if (!currency) return symbol; // Fallback

    if (currency.type === CurrencyType.ERC20) {
      return (
        this.walletManager.ethereumManagers.find((manager) =>
          manager.hasSymbol(symbol),
        )?.networkDetails.symbol || symbol // Fallback to original symbol
      );
    } else {
      return symbol;
    }
  };

  private loadNodemailerModule = async () => await import('nodemailer');

  private initializeTransporter = async () => {
    if (
      !this.config?.host ||
      !this.config.port ||
      !this.config.to ||
      !this.config.from
    ) {
      this.logger.warn(
        'Email notifications enabled but missing required configuration (host, port, to, from). Not initializing transporter.',
      );
      return;
    }

    try {
      const nodemailer = await this.loadNodemailerModule();
      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure:
          this.config?.secure === undefined
            ? this.config.port === 465
            : this.config.secure,
        auth: this.config.user
          ? {
              user: this.config.user,
              pass: this.config.pass,
            }
          : undefined,
      });
      this.logger.info(
        `Email notifications enabled. Sending to: ${this.config.to}`,
      );
    } catch (error) {
      this.logger.warn(
        `Could not initialize email notifier. Is "nodemailer" installed? Error: ${formatError(
          error,
        )}`,
      );
    }
  };

  private sendEmail = async (subject: string, body: string) => {
    if (!this.transporter) {
      this.logger.warn(
        'Attempted to send email, but transporter is not initialized.',
      );
      return;
    }

    const mailOptions = {
      from: this.config!.from,
      to: this.config!.to,
      subject: subject,
      text: `${body}${EmailNotifier.trailingWhitespace}`,
    };

    await this.transporter.sendMail(mailOptions);
  };

  private sendSuccessEmail = async (
    swapDetails: AnySwap,
    channelCreation?: ChannelCreation,
  ): Promise<void> => {
    const { base, quote } = splitPairId(swapDetails.pair);
    const { sending, receiving } = getSendingReceivingCurrency(
      base,
      quote,
      swapDetails.orderSide,
    );

    const hasChannelCreation =
      channelCreation !== null &&
      channelCreation !== undefined &&
      channelCreation.fundingTransactionId !== null;

    const subjectPrefix = this.config?.subjectPrefix || '[Boltz]';
    const title = `Swap ${this.getSwapTitle(swapDetails.type, sending, receiving)}${hasChannelCreation ? ' 🏗️' : ''}`;
    const subject = `${subjectPrefix} ${title}: ${swapDetails.id}`;

    let body =
      `${title}\n\n` +
      `${await this.getBasicSwapInfo(swapDetails.type, swapDetails, base, quote)}\n` +
      `Fees earned: ${satoshisToSatcomma(swapDetails.fee!)} ${sending}\n` + // Assuming fee is always in sending currency
      `Miner fees: ${this.getMinerFees(swapDetails.type, swapDetails)}`;

    if (swapDetails.type === SwapType.Submarine) {
      const submarineSwap = swapDetails as Swap;
      // The routing fees are denominated in millisatoshi
      body += `\nRouting fees: ${
        submarineSwap.routingFee ? submarineSwap.routingFee / 1000 : 'N/A'
      } sats`;
    }

    if (hasChannelCreation) {
      body +=
        '\n\nChannel Creation:\n' +
        `Private: ${channelCreation!.private}\n` +
        `Inbound: ${channelCreation!.inboundLiquidity}%\n` +
        `Node: ${channelCreation!.nodePublicKey}\n` +
        `Funding: ${channelCreation!.fundingTransactionId}:${
          channelCreation!.fundingTransactionVout
        }`;
    }

    this.sendEmail(subject, `${body}${EmailNotifier.trailingWhitespace}`);
  };

  private sendFailureEmail = async (
    swapDetails: AnySwap,
    reason: string,
  ): Promise<void> => {
    if (!this.config) {
      return;
    }

    const { base, quote } = splitPairId(swapDetails.pair);
    const { sending, receiving } = getSendingReceivingCurrency(
      base,
      quote,
      swapDetails.orderSide,
    );

    const subjectPrefix = this.config.subjectPrefix || '[Boltz]';
    const title = `Swap ${this.getSwapTitle(swapDetails.type, sending, receiving)} Failed`;
    const subject = `${subjectPrefix} ${title}: ${swapDetails.id}`;

    let body =
      `${title}\n\n` +
      `Reason: ${reason}\n\n` +
      `${await this.getBasicSwapInfo(swapDetails.type, swapDetails, base, quote)}`;

    // Add context, if applicable
    if (
      (swapDetails.type === SwapType.ReverseSubmarine &&
        (swapDetails as ReverseSwap).minerFee) ||
      (swapDetails.type === SwapType.Chain &&
        (swapDetails as ChainSwapInfo).paidMinerFees)
    ) {
      body += `\nMiner fees: ${this.getMinerFees(swapDetails.type, swapDetails)}`;
    }

    this.sendEmail(subject, `${body}${EmailNotifier.trailingWhitespace}`);
  };
}

export default EmailNotifier;
