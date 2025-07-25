import type { Transaction } from 'bitcoinjs-lib';
import type { Transaction as LiquidTransaction } from 'liquidjs-lib/src/transaction';
import type Logger from '../Logger';
import {
  formatError,
  getHexBuffer,
  getHexString,
  getLightningCurrency,
  getTsString,
  splitPairId,
} from '../Utils';
import { ChannelCreationStatus, SwapUpdateEvent } from '../consts/Enums';
import type { AnySwap } from '../consts/Types';
import type ChannelCreation from '../db/models/ChannelCreation';
import type ReverseSwap from '../db/models/ReverseSwap';
import type Swap from '../db/models/Swap';
import type { ChainSwapInfo } from '../db/repositories/ChainSwapRepository';
import SwapRepository from '../db/repositories/SwapRepository';
import type {
  LightningClient,
  PaymentResponse,
} from '../lightning/LightningClient';
import LndClient from '../lightning/LndClient';
import type PendingPaymentTracker from '../lightning/PendingPaymentTracker';
import SelfPaymentClient from '../lightning/SelfPaymentClient';
import ClnClient from '../lightning/cln/ClnClient';
import { Payment, PaymentFailureReason } from '../proto/lnd/rpc_pb';
import type TimeoutDeltaProvider from '../service/TimeoutDeltaProvider';
import type DecodedInvoice from '../sidecar/DecodedInvoice';
import type Sidecar from '../sidecar/Sidecar';
import type { Currency } from '../wallet/WalletManager';
import type ChannelNursery from './ChannelNursery';
import Errors from './Errors';
import LightningNursery from './LightningNursery';
import type NodeSwitch from './NodeSwitch';
import type SwapNursery from './SwapNursery';

type SwapNurseryEvents = {
  // UTXO based chains emit the "Transaction" object and Ethereum based ones just the transaction hash
  transaction: {
    swap: AnySwap;
    transaction: Transaction | LiquidTransaction | string;
    confirmed: boolean;
  };
  expiration: AnySwap;

  // Swap related events
  'lockup.failed': Swap | ChainSwapInfo;
  'zeroconf.rejected': {
    swap: Swap | ChainSwapInfo;
    transaction: Transaction | LiquidTransaction;
  };
  'invoice.pending': Swap;
  'invoice.failedToPay': Swap;
  'invoice.paid': Swap;
  'claim.pending': Swap | ChainSwapInfo;
  claim: {
    swap: Swap | ChainSwapInfo;
    channelCreation?: ChannelCreation;
  };

  // Reverse swap related events
  'minerfee.paid': ReverseSwap;
  'invoice.expired': ReverseSwap;

  // UTXO based chains emit the "Transaction" object and Ethereum based ones just the transaction hash
  'coins.sent': {
    swap: ReverseSwap | ChainSwapInfo;
    transaction: Transaction | LiquidTransaction | string;
  };
  'coins.failedToSend': ReverseSwap | ChainSwapInfo;
  refund: {
    swap: ReverseSwap | ChainSwapInfo;
    refundTransaction: string;
  };
  'invoice.settled': ReverseSwap;
};

class PaymentHandler {
  private static readonly resetMissionControlInterval = 10 * 60 * 1000;
  private static readonly errCltvTooSmall = 'CLTV limit too small';

  public readonly selfPaymentClient: SelfPaymentClient;

  private lastResetMissionControl: number | undefined = undefined;

  constructor(
    private readonly logger: Logger,
    private readonly sidecar: Sidecar,
    private readonly nodeSwitch: NodeSwitch,
    private readonly currencies: Map<string, Currency>,
    public readonly channelNursery: ChannelNursery,
    private readonly timeoutDeltaProvider: TimeoutDeltaProvider,
    private readonly pendingPaymentTracker: PendingPaymentTracker,
    private readonly swapNursery: SwapNursery,
  ) {
    this.selfPaymentClient = new SelfPaymentClient(this.logger, swapNursery);
  }

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
      this.swapNursery.emit(
        'invoice.pending',
        await SwapRepository.setSwapStatus(
          swap,
          SwapUpdateEvent.InvoicePending,
        ),
      );
    }

    const cltvLimit = await this.timeoutDeltaProvider.getCltvLimit(swap);
    const decoded = await this.sidecar.decodeInvoiceOrOffer(swap.invoice!);

    const { base, quote } = splitPairId(swap.pair);
    const lightningSymbol = getLightningCurrency(
      base,
      quote,
      swap.orderSide,
      false,
    );

    const lightningCurrency = this.currencies.get(lightningSymbol)!;

    const preferredNode = await this.getPreferredNode(
      lightningCurrency,
      swap,
      decoded,
    );

    const { node, paymentHash, payments } =
      await this.pendingPaymentTracker.getRelevantNode(
        lightningCurrency,
        swap,
        preferredNode?.client,
      );

    try {
      const res = await this.selfPaymentClient.handleSelfPayment(
        swap,
        decoded,
        cltvLimit,
        payments,
      );
      if (res.isSelf) {
        if (res.result !== undefined) {
          return await this.settleInvoice(swap, res.result);
        }

        return undefined;
      }
    } catch (error) {
      const msg = formatError(error);
      this.logPaymentFailure(swap, msg);
      await this.abandonSwap(swap, msg);
      return undefined;
    }

    try {
      if (cltvLimit < 2) {
        throw PaymentHandler.errCltvTooSmall;
      }

      this.logger.debug(
        `Paying invoice of swap ${swap.id} with CLTV limit: ${cltvLimit}`,
      );
      const payResponse = await this.pendingPaymentTracker.sendPayment(
        swap,
        node,
        paymentHash,
        payments,
        cltvLimit,
        outgoingChannelId,
        preferredNode?.timePreference,
      );

      if (payResponse !== undefined) {
        return await this.settleInvoice(swap, payResponse);
      }
    } catch (error) {
      return this.handlePaymentFailure(
        swap,
        channelCreation,
        lightningCurrency,
        node,
        error,
        outgoingChannelId,
      );
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        /* empty */
      }
    }

    this.logPaymentFailure(swap, errorMessage);

    // If the recipient rejects the payment or the invoice expired, the Swap will be abandoned
    if (
      error === PaymentFailureReason.FAILURE_REASON_INCORRECT_PAYMENT_DETAILS ||
      error ===
        LndClient.formatPaymentFailureReason(
          PaymentFailureReason.FAILURE_REASON_INCORRECT_PAYMENT_DETAILS,
        ) ||
      LightningNursery.errIsInvoiceExpired(errorMessage) ||
      LightningNursery.errIsPaymentTimedOut(errorMessage)
    ) {
      await this.abandonSwap(swap, errorMessage);
      return undefined;
    }

    if (
      errorMessage === PaymentHandler.errCltvTooSmall ||
      LightningNursery.errIsInvoicePaid(error) ||
      LightningNursery.errIsPaymentInTransition(error) ||
      LightningNursery.errIsCltvLimitExceeded(error)
    ) {
      return undefined;
    }

    if (
      this.lastResetMissionControl === undefined ||
      Date.now() - this.lastResetMissionControl >=
        PaymentHandler.resetMissionControlInterval
    ) {
      this.logger.debug(
        `Resetting ${lndClient.symbol} ${LndClient.serviceName} mission control`,
      );
      this.lastResetMissionControl = Date.now();
      await lndClient.resetMissionControl();
    } else {
      this.logger.debug(
        `Not resetting ${lndClient.symbol} ${LndClient.serviceName} mission control because last reset was at ${getTsString(new Date(this.lastResetMissionControl))}`,
      );
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
      LightningNursery.errIsInvoiceExpired(errorMessage) ||
      LightningNursery.errIsPaymentTimedOut(errorMessage)
    ) {
      await this.abandonSwap(swap, errorMessage);
      return undefined;
    }

    return undefined;
  };

  private abandonSwap = async (swap: Swap, errorMessage: string) => {
    this.logger.warn(`Abandoning Swap ${swap.id} because: ${errorMessage}`);
    this.swapNursery.emit(
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
      `Paid invoice of Swap ${swap.id} (${swap.preimageHash}): ${getHexString(response.preimage)}`,
    );

    this.swapNursery.emit(
      'invoice.paid',
      await SwapRepository.setInvoicePaid(
        swap,
        response.feeMsat,
        getHexString(response.preimage),
      ),
    );

    return response.preimage;
  };

  private getPreferredNode = async (
    lightningCurrency: Currency,
    swap: Swap,
    decoded: DecodedInvoice,
  ) => {
    const hookNode = await this.nodeSwitch.invoicePaymentHook(
      lightningCurrency,
      { id: swap.id, invoice: swap.invoice! },
      decoded,
    );
    if (hookNode !== undefined) {
      return hookNode;
    }

    return {
      client: await this.nodeSwitch.getSwapNode(
        lightningCurrency,
        decoded,
        swap,
      ),
    };
  };

  private logPaymentFailure = (swap: Swap, errorMessage: string) => {
    this.logger.warn(
      `Could not pay invoice of Swap ${swap.id} because: ${errorMessage}`,
    );
  };
}

export default PaymentHandler;
export { SwapNurseryEvents };
