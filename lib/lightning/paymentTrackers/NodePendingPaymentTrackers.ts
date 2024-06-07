import Logger from '../../Logger';
import { formatError, getHexString, stringify } from '../../Utils';
import { LightningPaymentStatus } from '../../db/models/LightningPayment';
import { NodeType, nodeTypeToPrettyString } from '../../db/models/ReverseSwap';
import LightningPaymentRepository from '../../db/repositories/LightningPaymentRepository';
import { LightningClient, PaymentResponse } from '../LightningClient';
import LndClient from '../LndClient';

abstract class NodePendingPendingTracker {
  protected constructor(
    protected readonly logger: Logger,
    protected readonly nodeType: NodeType,
  ) {}

  public abstract watchPayment(
    client: LightningClient,
    invoice: string,
    preimageHash: string,
  ): void;

  public abstract isPermanentError(err: unknown): boolean;

  public trackPayment = (
    preimageHash: string,
    promise: Promise<PaymentResponse>,
  ) => {
    promise
      .then((result) => this.handleSucceededPayment(preimageHash, result))
      .catch((error) => this.handleFailedPayment(preimageHash, error));
  };

  protected handleSucceededPayment = async (
    preimageHash: string,
    result: PaymentResponse,
  ) => {
    this.logger.debug(
      `${nodeTypeToPrettyString(this.nodeType)} paid invoice ${preimageHash}: ${stringify(
        {
          feeMsat: result.feeMsat,
          preimage: getHexString(result.preimage),
        },
      )}`,
    );
    await LightningPaymentRepository.setStatus(
      preimageHash,
      this.nodeType,
      LightningPaymentStatus.Success,
    );
  };

  protected handleFailedPayment = async (preimageHash: string, error: any) => {
    const isPermanent = this.isPermanentError(error);

    const errorMsg =
      typeof error === 'number' && this.nodeType === NodeType.LND
        ? LndClient.formatPaymentFailureReason(error)
        : formatError(error);
    this.logger.debug(
      `${nodeTypeToPrettyString(this.nodeType)} payment ${preimageHash} failed ${isPermanent ? 'permanently' : 'temporarily'}: ${errorMsg}`,
    );
    await LightningPaymentRepository.setStatus(
      preimageHash,
      this.nodeType,
      isPermanent
        ? LightningPaymentStatus.PermanentFailure
        : LightningPaymentStatus.TemporaryFailure,
    );
  };
}

export default NodePendingPendingTracker;
