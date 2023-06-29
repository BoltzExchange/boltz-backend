import Errors from './Errors';
import Logger from '../Logger';
import Swap from '../db/models/Swap';
import ChannelNursery from './ChannelNursery';
import LndClient from '../lightning/LndClient';
import EthereumNursery from './EthereumNursery';
import LightningNursery from './LightningNursery';
import { Currency } from '../wallet/WalletManager';
import ChannelCreation from '../db/models/ChannelCreation';
import SwapRepository from '../db/repositories/SwapRepository';
import TimeoutDeltaProvider from '../service/TimeoutDeltaProvider';
import { Payment, PaymentFailureReason } from '../proto/lnd/rpc_pb';
import { ChannelCreationStatus, SwapUpdateEvent } from '../consts/Enums';
import {
  formatError,
  splitPairId,
  getHexBuffer,
  getChainCurrency,
  getLightningCurrency,
} from '../Utils';

class PaymentHandler {
  private static readonly raceTimeout = 15;

  constructor(
    private readonly logger: Logger,
    private readonly currencies: Map<string, Currency>,
    public readonly channelNursery: ChannelNursery,
    private emit: (eventName: string, ...args: any[]) => void,
    private readonly ethereumNursery?: EthereumNursery,
  ) {}

  public payInvoice = async (
    swap: Swap,
    channelCreation: ChannelCreation | null,
    outgoingChannelId?: string,
  ): Promise<Buffer | undefined> => {
    this.logger.verbose(`Paying invoice of Swap ${swap.id}`);

    if (
      swap.status !== SwapUpdateEvent.InvoicePending &&
      swap.status !== SwapUpdateEvent.ChannelCreated
    ) {
      this.emit(
        'invoice.pending',
        await SwapRepository.setSwapStatus(
          swap,
          SwapUpdateEvent.InvoicePending,
        ),
      );
    }

    const { base, quote } = splitPairId(swap.pair);
    const chainSymbol = getChainCurrency(base, quote, swap.orderSide, false);
    const lightningSymbol = getLightningCurrency(
      base,
      quote,
      swap.orderSide,
      false,
    );

    const chainCurrency = this.currencies.get(chainSymbol)!;
    const lightningCurrency = this.currencies.get(lightningSymbol)!;

    try {
      return await this.racePayInvoice(
        swap,
        outgoingChannelId,
        chainCurrency,
        lightningCurrency,
      );
    } catch (error) {
      return this.handlePaymentFailure(
        swap,
        channelCreation,
        lightningCurrency,
        error,
        outgoingChannelId,
      );
    }
  };

  private racePayInvoice = async (
    swap: Swap,
    outgoingChannelId: string | undefined,
    chainCurrency: Currency,
    lightningCurrency: Currency,
  ): Promise<Buffer | undefined> => {
    const currentBlock = chainCurrency.chainClient
      ? (await chainCurrency.chainClient.getBlockchainInfo()).blocks
      : await this.ethereumNursery!.ethereumManager.provider.getBlockNumber();

    const blockLeft = TimeoutDeltaProvider.convertBlocks(
      chainCurrency.symbol,
      lightningCurrency.symbol,
      swap.timeoutBlockHeight - currentBlock,
    );
    const cltvLimit = Math.floor(blockLeft - 2);

    if (cltvLimit < 2) {
      throw 'CLTV limit to small';
    }

    const payResponse = await Promise.race([
      lightningCurrency.lndClient!.sendPayment(
        swap.invoice!,
        cltvLimit,
        outgoingChannelId,
      ),
      new Promise<undefined>((resolve) => {
        setTimeout(() => {
          resolve(undefined);
        }, PaymentHandler.raceTimeout * 1000);
      }),
    ]);

    if (payResponse !== undefined) {
      return await this.settleInvoice(swap, payResponse);
    } else {
      this.logger.verbose(
        `Invoice payment of Swap ${swap.id} is still pending after ${PaymentHandler.raceTimeout} seconds`,
      );
    }

    return undefined;
  };

  private handlePaymentFailure = async (
    swap: Swap,
    channelCreation: ChannelCreation | null,
    lightningCurrency: Currency,
    error: unknown,
    outgoingChannelId?: string,
  ): Promise<Buffer | undefined> => {
    const errorMessage =
      typeof error === 'number'
        ? LndClient.formatPaymentFailureReason(error as any)
        : formatError(error);

    if (outgoingChannelId !== undefined) {
      throw errorMessage;
    }

    if (
      LightningNursery.errIsInvoicePaid(error) ||
      LightningNursery.errIsCltvLimitExceeded(error)
    ) {
      try {
        const payment = await lightningCurrency.lndClient!.trackPayment(
          getHexBuffer(swap.preimageHash),
        );
        if (payment.status === Payment.PaymentStatus.SUCCEEDED) {
          this.logger.debug(`Invoice of Swap ${swap.id} is paid already`);
          return this.settleInvoice(swap, payment);
        }
      } catch (e) {
        /* empty */
      }
    }

    this.logger.warn(
      `Could not pay invoice of Swap ${swap.id} because: ${errorMessage}`,
    );

    // If the recipient rejects the payment or the invoice expired, the Swap will be abandoned
    if (
      error === PaymentFailureReason.FAILURE_REASON_INCORRECT_PAYMENT_DETAILS ||
      errorMessage.includes('invoice expired')
    ) {
      this.logger.warn(`Abandoning Swap ${swap.id} because: ${errorMessage}`);
      this.emit(
        'invoice.failedToPay',
        await SwapRepository.setSwapStatus(
          swap,
          SwapUpdateEvent.InvoiceFailedToPay,
          Errors.INVOICE_COULD_NOT_BE_PAID().message,
        ),
      );

      return undefined;
    }

    if (
      LightningNursery.errIsPaymentInTransition(error) ||
      LightningNursery.errIsCltvLimitExceeded(error)
    ) {
      return undefined;
    }

    await lightningCurrency.lndClient!.resetMissionControl();

    // If the invoice could not be paid but the Swap has a Channel Creation attached to it, a channel will be opened
    if (
      typeof error === 'number' &&
      channelCreation &&
      channelCreation.status !== ChannelCreationStatus.Created
    ) {
      switch (error) {
        case PaymentFailureReason.FAILURE_REASON_TIMEOUT:
        case PaymentFailureReason.FAILURE_REASON_NO_ROUTE:
        case PaymentFailureReason.FAILURE_REASON_INSUFFICIENT_BALANCE:
          await this.channelNursery.openChannel(
            lightningCurrency,
            swap,
            channelCreation,
          );
      }
    }

    return undefined;
  };

  private settleInvoice = async (
    swap: Swap,
    response: {
      paymentPreimage: string;
      feeMsat: number;
    },
  ): Promise<Buffer> => {
    this.logger.verbose(
      `Paid invoice of Swap ${swap.id}: ${response.paymentPreimage}`,
    );

    this.emit(
      'invoice.paid',
      await SwapRepository.setInvoicePaid(swap, response.feeMsat),
    );

    return getHexBuffer(response.paymentPreimage);
  };
}

export default PaymentHandler;
