import Errors from './Errors';
import Logger from '../Logger';
import Swap from '../db/models/Swap';
import ChannelNursery from './ChannelNursery';
import LndClient from '../lightning/LndClient';
import LightningNursery from './LightningNursery';
import { Currency } from '../wallet/WalletManager';
import ChannelCreation from '../db/models/ChannelCreation';
import SwapRepository from '../db/repositories/SwapRepository';
import { PaymentResponse } from '../lightning/LightningClient';
import TimeoutDeltaProvider from '../service/TimeoutDeltaProvider';
import { Payment, PaymentFailureReason } from '../proto/lnd/rpc_pb';
import { ChannelCreationStatus, SwapUpdateEvent } from '../consts/Enums';
import {
  formatError,
  getHexBuffer,
  getHexString,
  getLightningCurrency,
  splitPairId,
} from '../Utils';
import NodeSwitch from './NodeSwitch';

class PaymentHandler {
  private static readonly raceTimeout = 15;

  constructor(
    private readonly logger: Logger,
    private readonly currencies: Map<string, Currency>,
    public readonly channelNursery: ChannelNursery,
    private readonly timeoutDeltaProvider: TimeoutDeltaProvider,
    private emit: (eventName: string, ...args: any[]) => void,
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
    const lightningSymbol = getLightningCurrency(
      base,
      quote,
      swap.orderSide,
      false,
    );

    const lightningCurrency = this.currencies.get(lightningSymbol)!;

    try {
      return await this.racePayInvoice(
        swap,
        outgoingChannelId,
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
    lightningCurrency: Currency,
  ): Promise<Buffer | undefined> => {
    const cltvLimit = await this.timeoutDeltaProvider.getCltvLimit(swap);

    if (cltvLimit < 2) {
      throw 'CLTV limit to small';
    }

    this.logger.debug(
      `Paying invoice of swap ${swap.id} with cltvLimit: ${cltvLimit}`,
    );
    const payResponse = await Promise.race([
      NodeSwitch.getSwapNode(this.logger, lightningCurrency, swap).sendPayment(
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

  // TODO: adjust for CLN compatibility
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
        const payment =
          await (lightningCurrency.lndClient as LndClient)!.trackPayment(
            getHexBuffer(swap.preimageHash),
          );
        if (payment.status === Payment.PaymentStatus.SUCCEEDED) {
          this.logger.debug(`Invoice of Swap ${swap.id} is paid already`);
          return this.settleInvoice(swap, {
            feeMsat: payment.feeMsat,
            preimage: getHexBuffer(payment.paymentPreimage),
          });
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

    if (lightningCurrency.lndClient instanceof LndClient) {
      this.logger.debug(
        `Resetting ${lightningCurrency.symbol} lightning mission control`,
      );
      await lightningCurrency.lndClient!.resetMissionControl();
    }

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
    response: PaymentResponse,
  ): Promise<Buffer> => {
    this.logger.verbose(
      `Paid invoice of Swap ${swap.id}: ${getHexString(response.preimage)}`,
    );

    this.emit(
      'invoice.paid',
      await SwapRepository.setInvoicePaid(swap, response.feeMsat),
    );

    return response.preimage;
  };
}

export default PaymentHandler;
