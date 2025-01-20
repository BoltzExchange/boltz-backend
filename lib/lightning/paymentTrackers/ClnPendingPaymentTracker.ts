import Logger from '../../Logger';
import { formatError } from '../../Utils';
import { NodeType } from '../../db/models/ReverseSwap';
import LightningNursery from '../../swap/LightningNursery';
import { LightningClient, PaymentResponse } from '../LightningClient';
import ClnClient from '../cln/ClnClient';
import NodePendingPendingTracker from './NodePendingPaymentTracker';

class ClnPendingPaymentTracker extends NodePendingPendingTracker {
  private static readonly checkInterval = 15;

  private readonly checkInterval: NodeJS.Timer;

  private readonly paymentsToWatch = new Map<
    string,
    { invoice: string; client: ClnClient }
  >();

  constructor(logger: Logger) {
    super(logger, NodeType.CLN);
    // CLN does not have a streaming endpoint for existing pending payments.
    // We have to poll on an interval
    this.logger.debug(
      `Checking for updates on pending CLN payments every ${ClnPendingPaymentTracker.checkInterval} seconds`,
    );
    this.checkInterval = setInterval(
      this.checkPendingPayments,
      ClnPendingPaymentTracker.checkInterval * 1_000,
    );
  }

  public stop = () => {
    clearInterval(this.checkInterval as unknown as number);
  };

  public trackPayment = (
    client: LightningClient,
    preimageHash: string,
    invoice: string,
    promise: Promise<PaymentResponse>,
  ): void => {
    promise
      .then((result) => this.handleSucceededPayment(preimageHash, result))
      .catch((error) => {
        const msg = formatError(error);

        // CLN xpay throws errors while the payment is still pending
        if (
          !this.isPermanentError(error) &&
          (msg.includes('xpay') || msg === 'Connection dropped')
        ) {
          this.watchPayment(client, invoice, preimageHash);
        } else {
          this.handleFailedPayment(client, preimageHash, error);
        }
      });
  };

  public watchPayment = (
    client: LightningClient,
    invoice: string,
    preimageHash: string,
  ) => {
    this.paymentsToWatch.set(preimageHash, {
      invoice,
      client: client as ClnClient,
    });
  };

  public isPermanentError = (error: unknown) => {
    const errorMessage = this.parseErrorMessage(error);
    return (
      ClnClient.errIsIncorrectPaymentDetails(errorMessage) ||
      LightningNursery.errIsInvoiceExpired(errorMessage)
    );
  };

  public parseErrorMessage = (error: unknown) =>
    ClnClient.isRpcError(error)
      ? ClnClient.formatPaymentFailureReason(error as any)
      : formatError(error);

  private checkPendingPayments = async () => {
    for (const [
      preimageHash,
      { client, invoice },
    ] of this.paymentsToWatch.entries()) {
      try {
        const res = await client.checkPayStatus(invoice);
        if (res === undefined) {
          continue;
        }

        await this.handleSucceededPayment(preimageHash, res);
      } catch (e) {
        // Ignore when the payment is pending; it's not a payment error
        if (e === ClnClient.paymentPendingError) {
          continue;
        }

        await this.handleFailedPayment(client, preimageHash, e);
      }

      this.paymentsToWatch.delete(preimageHash);
    }
  };
}

export default ClnPendingPaymentTracker;
