import type Logger from '../Logger';
import { racePromise } from '../PromiseUtils';
import {
  getHexBuffer,
  getHexString,
  minutesToMilliseconds,
  nullishPipe,
  secondsToMilliseconds,
} from '../Utils';
import DefaultMap from '../consts/DefaultMap';
import type LightningPayment from '../db/models/LightningPayment';
import { LightningPaymentStatus } from '../db/models/LightningPayment';
import { NodeType, nodeTypeToPrettyString } from '../db/models/ReverseSwap';
import type Swap from '../db/models/Swap';
import LightningPaymentRepository from '../db/repositories/LightningPaymentRepository';
import ReferralRepository from '../db/repositories/ReferralRepository';
import type Sidecar from '../sidecar/Sidecar';
import type { Currency } from '../wallet/WalletManager';
import LightningErrors from './Errors';
import type { LightningClient, PaymentResponse } from './LightningClient';
import type LndClient from './LndClient';
import type ClnClient from './cln/ClnClient';
import ClnPendingPaymentTracker from './paymentTrackers/ClnPendingPaymentTracker';
import LndPendingPaymentTracker from './paymentTrackers/LndPendingPaymentTracker';
import type NodePendingPaymentTracker from './paymentTrackers/NodePendingPaymentTracker';

type LightningNodes = Record<
  Exclude<NodeType, NodeType.SelfPayment>,
  LightningClient | undefined
>;

class PendingPaymentTracker {
  public static readonly raceTimeout = 10;

  private static readonly timeoutError = 'payment timed out';

  public readonly lightningTrackers: Record<
    Exclude<NodeType, NodeType.SelfPayment>,
    NodePendingPaymentTracker
  >;

  private readonly lightningNodes = new DefaultMap<string, LightningNodes>(
    () => ({
      [NodeType.LND]: undefined,
      [NodeType.CLN]: undefined,
    }),
  );

  constructor(
    private readonly logger: Logger,
    private readonly sidecar: Sidecar,
    private readonly paymentTimeoutMinutes?: number,
  ) {
    this.lightningTrackers = {
      [NodeType.LND]: new LndPendingPaymentTracker(this.logger),
      [NodeType.CLN]: new ClnPendingPaymentTracker(this.logger),
    };

    if (
      this.paymentTimeoutMinutes === undefined ||
      typeof this.paymentTimeoutMinutes !== 'number'
    ) {
      this.paymentTimeoutMinutes = undefined;
      this.logger.info('Payment timeout not configured');
      return;
    }

    this.logger.info(
      `Payment timeout configured: ${this.paymentTimeoutMinutes} minutes`,
    );
  }

  public init = async (currencies: Currency[]) => {
    currencies.forEach((currency) => {
      this.lightningNodes.set(currency.symbol, {
        [NodeType.LND]: currency.lndClient,
        [NodeType.CLN]: currency.clnClient,
      });
    });

    for (const payment of await LightningPaymentRepository.findByStatus(
      LightningPaymentStatus.Pending,
    )) {
      const client = this.lightningNodes.get(payment.Swap.lightningCurrency)[
        payment.node
      ];
      if (client === undefined) {
        this.logger.warn(
          `Could not track payment ${payment.Swap.id} (${payment.preimageHash}): ${payment.Swap.lightningCurrency} ${nodeTypeToPrettyString(payment.node)} is not available`,
        );
        continue;
      }

      this.logger.debug(
        `Watching pending ${client.symbol} ${nodeTypeToPrettyString(client.type)} payment of ${payment.Swap.id}: ${payment.preimageHash}`,
      );
      this.lightningTrackers[payment.node].watchPayment(
        client,
        payment.Swap.invoice!,
        payment.preimageHash,
      );
    }
  };

  public getRelevantNode = async (
    lightningCurrency: Currency,
    swap: Swap,
    preferredNode: LightningClient,
  ): Promise<{
    paymentHash: string;
    node: LightningClient;
    payments: LightningPayment[];
  }> => {
    const paymentHash = getHexString(
      (await this.sidecar.decodeInvoiceOrOffer(swap.invoice!)).paymentHash!,
    );

    const payments =
      await LightningPaymentRepository.findByPreimageHash(paymentHash);

    const existingRelevantAction = payments.find(
      (p) =>
        p.status === LightningPaymentStatus.Success ||
        p.status === LightningPaymentStatus.Pending ||
        p.status === LightningPaymentStatus.PermanentFailure,
    );
    if (existingRelevantAction === undefined) {
      return {
        payments,
        paymentHash,
        node: preferredNode,
      };
    }

    const node = [
      lightningCurrency.lndClient,
      lightningCurrency.clnClient,
    ].find((n) => n?.type === existingRelevantAction.node);

    return {
      payments,
      paymentHash,
      node: node || preferredNode,
    };
  };

  public sendPayment = async (
    swap: Swap,
    lightningClient: LightningClient,
    paymentHash: string,
    payments: LightningPayment[],
    cltvLimit?: number,
    outgoingChannelId?: string,
    timePreference?: number,
  ): Promise<PaymentResponse | undefined> => {
    for (const status of [
      LightningPaymentStatus.Pending,
      LightningPaymentStatus.Success,
      LightningPaymentStatus.PermanentFailure,
    ]) {
      const relevant = payments.find((p) => p.status === status);
      if (relevant === undefined) {
        continue;
      }

      switch (status) {
        case LightningPaymentStatus.Pending:
          this.logger.verbose(
            `Invoice payment of ${swap.id} (${paymentHash}) still pending with node ${nodeTypeToPrettyString(relevant.node)}`,
          );
          return undefined;

        case LightningPaymentStatus.Success:
          return await this.getSuccessfulPaymentDetails(
            swap.id,
            relevant,
            lightningClient.symbol,
            paymentHash,
            swap.invoice!,
          );

        case LightningPaymentStatus.PermanentFailure:
          return await this.getPermanentFailureDetails(
            swap.id,
            relevant,
            lightningClient.symbol,
          );
      }
    }

    await this.checkInvoiceTimeout(
      swap,
      paymentHash,
      lightningClient.type,
      payments,
    );

    return await this.sendPaymentWithNode(
      swap,
      lightningClient,
      paymentHash,
      cltvLimit,
      outgoingChannelId,
      timePreference,
    );
  };

  private checkInvoiceTimeout = async (
    swap: Pick<Swap, 'id' | 'paymentTimeout'>,
    paymentHash: string,
    lightningClientType: NodeType,
    payments: LightningPayment[],
  ) => {
    // Prefer the payment timeout from the swap, if it exists
    const timeout =
      nullishPipe(swap.paymentTimeout, secondsToMilliseconds) ??
      nullishPipe(this.paymentTimeoutMinutes, minutesToMilliseconds);

    const relevantTimestamps = payments
      .filter(
        (payment) => payment.status === LightningPaymentStatus.TemporaryFailure,
      )
      .map((p) => p.createdAt.getTime());

    if (timeout === undefined || relevantTimestamps.length === 0) {
      return;
    }

    if (Date.now() - Math.min(...relevantTimestamps) > timeout) {
      this.logger.warn(`Payment for ${swap.id} (${paymentHash}) has timed out`);

      const err = LightningErrors.PAYMENT_TIMED_OUT();
      await LightningPaymentRepository.setStatus(
        paymentHash,
        lightningClientType,
        LightningPaymentStatus.PermanentFailure,
        err.message,
      );
      throw err.message;
    }
  };

  private sendPaymentWithNode = async (
    swap: Swap,
    lightningClient: LightningClient,
    preimageHash: string,
    cltvLimit?: number,
    outgoingChannelId?: string,
    timePreference?: number,
  ) => {
    await LightningPaymentRepository.create({
      preimageHash,
      node: lightningClient.type,
    });

    const referral =
      swap.referral !== undefined && swap.referral !== null
        ? await ReferralRepository.getReferralById(swap.referral)
        : null;

    let paymentPromise: Promise<PaymentResponse> | undefined = undefined;
    try {
      paymentPromise = lightningClient.sendPayment(
        swap.invoice!,
        cltvLimit,
        outgoingChannelId,
        referral?.maxRoutingFeeRatio(swap.pair),
        timePreference,
      );
      const res = await racePromise(
        paymentPromise,
        (reject) => reject(PendingPaymentTracker.timeoutError),
        PendingPaymentTracker.raceTimeout * 1_000,
      );
      await LightningPaymentRepository.setStatus(
        preimageHash,
        lightningClient.type,
        LightningPaymentStatus.Success,
      );

      return res;
    } catch (e) {
      if (
        e === PendingPaymentTracker.timeoutError &&
        paymentPromise !== undefined
      ) {
        this.lightningTrackers[lightningClient.type].trackPayment(
          lightningClient,
          preimageHash,
          swap.invoice!,
          paymentPromise,
        );
        this.logger.verbose(
          `Invoice payment of ${swap.id} (${preimageHash}) is still pending with node ${nodeTypeToPrettyString(lightningClient.type)} after ${PendingPaymentTracker.raceTimeout} seconds`,
        );
        return undefined;
      }

      const isPermanentError =
        this.lightningTrackers[lightningClient.type].isPermanentError(e);

      // CLN xpay does throw errors while the payment is still pending
      if (lightningClient.type === NodeType.CLN && !isPermanentError) {
        this.lightningTrackers[lightningClient.type].watchPayment(
          lightningClient,
          swap.invoice!,
          preimageHash,
        );

        return undefined;
      }

      await LightningPaymentRepository.setStatus(
        preimageHash,
        lightningClient.type,
        isPermanentError
          ? LightningPaymentStatus.PermanentFailure
          : LightningPaymentStatus.TemporaryFailure,
        isPermanentError
          ? this.lightningTrackers[lightningClient.type].parseErrorMessage(e)
          : undefined,
      );

      throw e;
    }
  };

  private getSuccessfulPaymentDetails = async (
    swapId: string,
    payment: LightningPayment,
    symbol: string,
    preimageHash: string,
    invoice: string,
  ): Promise<PaymentResponse | undefined> => {
    this.logger.verbose(
      `Invoice payment of ${swapId} (${preimageHash}) has already succeeded on node ${symbol} ${nodeTypeToPrettyString(payment.node)}`,
    );

    const nodeThatPaid = this.lightningNodes.get(symbol)[payment.node];
    if (nodeThatPaid === undefined) {
      this.logger.warn(
        `Could not resolve payment of ${swapId} (${preimageHash}): ${symbol} ${nodeTypeToPrettyString(payment.node)} is not available`,
      );
      return undefined;
    }

    switch (nodeThatPaid.type) {
      case NodeType.LND: {
        const trackedPayment = await (nodeThatPaid as LndClient).trackPayment(
          getHexBuffer(preimageHash),
        );
        return {
          feeMsat: trackedPayment.feeMsat,
          preimage: getHexBuffer(trackedPayment.paymentPreimage),
        };
      }

      case NodeType.CLN:
        return (nodeThatPaid as ClnClient).checkPayStatus(invoice);

      case NodeType.SelfPayment:
        throw new Error('self payments cannot be tracked');
    }

    return undefined;
  };

  private getPermanentFailureDetails = async (
    swapId: string,
    payment: LightningPayment,
    symbol: string,
  ) => {
    this.logger.verbose(
      `Invoice payment of ${swapId} (${payment.preimageHash}) has failed with a permanent error on node ${symbol} ${nodeTypeToPrettyString(payment.node)}`,
    );
    throw payment.error;
  };
}

export default PendingPaymentTracker;
