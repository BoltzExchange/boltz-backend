import Logger from '../../Logger';
import { formatError, getHexBuffer } from '../../Utils';
import { NodeType, nodeTypeToPrettyString } from '../../db/models/ReverseSwap';
import { Payment, PaymentFailureReason } from '../../proto/lnd/rpc_pb';
import LightningNursery from '../../swap/LightningNursery';
import { LightningClient, PaymentResponse } from '../LightningClient';
import LndClient from '../LndClient';
import NodePendingPendingTracker from './NodePendingPaymentTracker';

class LndPendingPaymentTracker extends NodePendingPendingTracker {
  constructor(logger: Logger) {
    super(logger, NodeType.LND);
  }

  public trackPayment = (
    _client: LightningClient,
    preimageHash: string,
    _invoice: string,
    promise: Promise<PaymentResponse>,
  ): void => {
    promise
      .then((result) => this.handleSucceededPayment(preimageHash, result))
      .catch((error) => this.handleFailedPayment(preimageHash, error));
  };

  public watchPayment = (
    client: LightningClient,
    _: string,
    preimageHash: string,
  ) => {
    (client as LndClient)
      .trackPayment(getHexBuffer(preimageHash), true)
      .then(async (res) => {
        switch (res.status) {
          case Payment.PaymentStatus.SUCCEEDED:
            await this.handleSucceededPayment(preimageHash, {
              feeMsat: res.feeMsat,
              preimage: getHexBuffer(res.paymentPreimage),
            });
            break;

          case Payment.PaymentStatus.FAILED:
            await this.handleFailedPayment(preimageHash, res.failureReason);
            break;
        }
      })
      .catch((error) => {
        this.logger.warn(
          `Tracking payment ${preimageHash} with ${client.symbol} ${nodeTypeToPrettyString(this.nodeType)} failed: ${this.parseErrorMessage(error)}`,
        );
      });
  };

  public isPermanentError = (error: unknown) =>
    error === PaymentFailureReason.FAILURE_REASON_INCORRECT_PAYMENT_DETAILS ||
    LightningNursery.errIsInvoiceExpired(this.parseErrorMessage(error));

  public parseErrorMessage = (error: unknown) =>
    typeof error === 'number'
      ? LndClient.formatPaymentFailureReason(error as any)
      : formatError(error);
}

export default LndPendingPaymentTracker;
