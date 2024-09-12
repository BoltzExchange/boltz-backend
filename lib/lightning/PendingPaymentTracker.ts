import Logger from '../Logger';
import { racePromise } from '../PromiseUtils';
import { getHexBuffer, getHexString } from '../Utils';
import DefaultMap from '../consts/DefaultMap';
import LightningPayment, {
  LightningPaymentStatus,
} from '../db/models/LightningPayment';
import { NodeType, nodeTypeToPrettyString } from '../db/models/ReverseSwap';
import LightningPaymentRepository from '../db/repositories/LightningPaymentRepository';
import Sidecar from '../sidecar/Sidecar';
import { Currency } from '../wallet/WalletManager';
import { LightningClient, PaymentResponse } from './LightningClient';
import LndClient from './LndClient';
import ClnClient from './cln/ClnClient';
import ClnPendingPaymentTracker from './paymentTrackers/ClnPendingPaymentTracker';
import LndPendingPaymentTracker from './paymentTrackers/LndPendingPaymentTracker';
import NodePendingPendingTracker from './paymentTrackers/NodePendingPaymentTracker';

type LightningNodes = Record<NodeType, LightningClient | undefined>;

class PendingPaymentTracker {
  private static readonly raceTimeout = 10;
  private static readonly timeoutError = 'payment timed out';

  public readonly lightningTrackers: Record<
    NodeType,
    NodePendingPendingTracker
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
  ) {
    this.lightningTrackers = {
      [NodeType.LND]: new LndPendingPaymentTracker(this.logger),
      [NodeType.CLN]: new ClnPendingPaymentTracker(this.logger),
    };
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

  public sendPayment = async (
    swapId: string,
    lightningClient: LightningClient,
    invoice: string,
    cltvLimit?: number,
    outgoingChannelId?: string,
  ): Promise<PaymentResponse | undefined> => {
    const paymentHash = getHexString(
      (await this.sidecar.decodeInvoiceOrOffer(invoice)).paymentHash!,
    );

    const payments =
      await LightningPaymentRepository.findByPreimageHash(paymentHash);

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
            `Invoice payment of ${swapId} (${paymentHash}) still pending with node ${nodeTypeToPrettyString(relevant.node)}`,
          );
          return undefined;

        case LightningPaymentStatus.Success:
          return this.getSuccessfulPaymentDetails(
            swapId,
            relevant,
            lightningClient.symbol,
            paymentHash,
            invoice,
          );

        case LightningPaymentStatus.PermanentFailure:
          return await this.getPermanentFailureDetails(
            swapId,
            relevant,
            lightningClient.symbol,
          );
      }
    }

    return this.sendPaymentWithNode(
      swapId,
      lightningClient,
      paymentHash,
      invoice,
      cltvLimit,
      outgoingChannelId,
    );
  };

  private sendPaymentWithNode = async (
    swapId: string,
    lightningClient: LightningClient,
    preimageHash: string,
    invoice: string,
    cltvLimit?: number,
    outgoingChannelId?: string,
  ) => {
    await LightningPaymentRepository.create({
      preimageHash,
      node: lightningClient.type,
    });

    let paymentPromise: Promise<PaymentResponse> | undefined = undefined;
    try {
      paymentPromise = lightningClient.sendPayment(
        invoice,
        cltvLimit,
        outgoingChannelId,
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
          preimageHash,
          paymentPromise,
        );
        this.logger.verbose(
          `Invoice payment of ${swapId} (${preimageHash}) is still pending with node ${nodeTypeToPrettyString(lightningClient.type)} after ${PendingPaymentTracker.raceTimeout} seconds`,
        );
        return undefined;
      }

      const isPermanentError =
        this.lightningTrackers[lightningClient.type].isPermanentError(e);
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
    }
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
