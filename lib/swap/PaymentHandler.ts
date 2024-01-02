import Logger from '../Logger';
import {
  formatError,
  getHexBuffer,
  getHexString,
  getLightningCurrency,
  splitPairId,
} from '../Utils';
import { ChannelCreationStatus, SwapUpdateEvent } from '../consts/Enums';
import ChannelCreation from '../db/models/ChannelCreation';
import Swap from '../db/models/Swap';
import SwapRepository from '../db/repositories/SwapRepository';
import ClnClient from '../lightning/ClnClient';
import { LightningClient, PaymentResponse } from '../lightning/LightningClient';
import LndClient from '../lightning/LndClient';
import { Payment, PaymentFailureReason } from '../proto/lnd/rpc_pb';
import TimeoutDeltaProvider from '../service/TimeoutDeltaProvider';
import { Currency } from '../wallet/WalletManager';
import ChannelNursery from './ChannelNursery';
import Errors from './Errors';
import LightningNursery from './LightningNursery';
import NodeSwitch from './NodeSwitch';

class PaymentHandler {
  private static readonly raceTimeout = 15;
  private static readonly errCltvTooSmall = 'CLTV limit too small';

  constructor(
    private readonly logger: Logger,
    private readonly nodeSwitch: NodeSwitch,
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
    const lightningClient = this.nodeSwitch.getSwapNode(
      lightningCurrency,
      swap,
    );

    try {
      return await this.racePayInvoice(
        swap,
        outgoingChannelId,
        lightningClient,
      );
    } catch (error) {
      return this.handlePaymentFailure(
        swap,
        channelCreation,
        lightningCurrency,
        lightningClient,
        error,
        outgoingChannelId,
      );
    }
  };

  private racePayInvoice = async (
    swap: Swap,
    outgoingChannelId: string | undefined,
    lightningClient: LightningClient,
  ): Promise<Buffer | undefined> => {
    const cltvLimit = await this.timeoutDeltaProvider.getCltvLimit(swap);

    if (cltvLimit < 2) {
      throw PaymentHandler.errCltvTooSmall;
    }

    this.logger.debug(
      `Paying invoice of swap ${swap.id} with CLTV limit: ${cltvLimit}`,
    );

    let timeout: NodeJS.Timeout | undefined = undefined;
    const racePromise = new Promise<undefined>((resolve) => {
      timeout = setTimeout(() => {
        resolve(undefined);
      }, PaymentHandler.raceTimeout * 1000);
    });

    try {
      const payResponse = await Promise.race([
        lightningClient.sendPayment(
          swap.invoice!,
          cltvLimit,
          outgoingChannelId,
        ),
        racePromise,
      ]);

      if (timeout !== undefined) {
        clearTimeout(timeout);
      }

      if (payResponse !== undefined) {
        return await this.settleInvoice(swap, payResponse);
      }

      this.logger.verbose(
        `Invoice payment of Swap ${swap.id} is still pending after ${PaymentHandler.raceTimeout} seconds`,
      );
    } catch (e) {
      if (timeout !== undefined) {
        clearTimeout(timeout);
      }

      throw e;
    }

    return undefined;
  };

  private handlePaymentFailure = async (
    swap: Swap,
    channelCreation: ChannelCreation | null,
    lightningCurrency: Currency,
    lightningClient: LightningClient,
    error: unknown,
    outgoingChannelId?: string,
  ): Promise<Buffer | undefined> => {
    if (lightningClient instanceof LndClient) {
      return this.handleLndPaymentFailure(
        swap,
        channelCreation,
        lightningCurrency,
        lightningClient,
        error,
        outgoingChannelId,
      );
    } else if (lightningClient instanceof ClnClient) {
      return this.handleClnPaymentFailure(swap, error);
    }

    throw error;
  };

  private handleLndPaymentFailure = async (
    swap: Swap,
    channelCreation: ChannelCreation | null,
    lightningCurrency: Currency,
    lndClient: LndClient,
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
      errorMessage === PaymentHandler.errCltvTooSmall ||
      LightningNursery.errIsInvoicePaid(error) ||
      LightningNursery.errIsCltvLimitExceeded(error) ||
      LightningNursery.errIsInvoiceExpired(errorMessage)
    ) {
      try {
        const payment = await lndClient.trackPayment(
          getHexBuffer(swap.preimageHash),
        );

        if (payment.status === Payment.PaymentStatus.SUCCEEDED) {
          this.logger.debug(`Invoice of Swap ${swap.id} is paid already`);
          return this.settleInvoice(swap, {
            feeMsat: payment.feeMsat,
            preimage: getHexBuffer(payment.paymentPreimage),
          });
        } else if (payment.status === Payment.PaymentStatus.IN_FLIGHT) {
          this.logger.info(`Invoice of Swap ${swap.id} is still pending`);
          return undefined;
        }
      } catch (e) {
        /* empty */
      }
    }

    this.logPaymentFailure(swap, errorMessage);

    // If the recipient rejects the payment or the invoice expired, the Swap will be abandoned
    if (
      error === PaymentFailureReason.FAILURE_REASON_INCORRECT_PAYMENT_DETAILS ||
      LightningNursery.errIsInvoiceExpired(errorMessage)
    ) {
      await this.abandonSwap(swap, errorMessage);
      return undefined;
    }

    if (
      LightningNursery.errIsPaymentInTransition(error) ||
      LightningNursery.errIsCltvLimitExceeded(error)
    ) {
      return undefined;
    }

    this.logger.debug(
      `Resetting ${lndClient.symbol} lightning mission control`,
    );
    await lndClient.resetMissionControl();

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

  private handleClnPaymentFailure = async (
    swap: Swap,
    error: unknown,
  ): Promise<Buffer | undefined> => {
    const errorMessage = ClnClient.isRpcError(error)
      ? ClnClient.formatPaymentFailureReason(error as any)
      : formatError(error);

    this.logPaymentFailure(swap, errorMessage);

    if (
      ClnClient.errIsIncorrectPaymentDetails(errorMessage) ||
      LightningNursery.errIsInvoiceExpired(errorMessage)
    ) {
      await this.abandonSwap(swap, errorMessage);
      return undefined;
    }

    return undefined;
  };

  private abandonSwap = async (swap: Swap, errorMessage: string) => {
    this.logger.warn(`Abandoning Swap ${swap.id} because: ${errorMessage}`);
    this.emit(
      'invoice.failedToPay',
      await SwapRepository.setSwapStatus(
        swap,
        SwapUpdateEvent.InvoiceFailedToPay,
        Errors.INVOICE_COULD_NOT_BE_PAID().message,
      ),
    );
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

  private logPaymentFailure = (swap: Swap, errorMessage: string) => {
    this.logger.warn(
      `Could not pay invoice of Swap ${swap.id} because: ${errorMessage}`,
    );
  };
}

export default PaymentHandler;
