import Logger from '../../Logger';
import { getHexString, stringify } from '../../Utils';
import { LightningPaymentStatus } from '../../db/models/LightningPayment';
import { NodeType, nodeTypeToPrettyString } from '../../db/models/ReverseSwap';
import LightningPaymentRepository from '../../db/repositories/LightningPaymentRepository';
import { LightningClient, PaymentResponse } from '../LightningClient';

abstract class NodePendingPendingTracker {
  protected constructor(
    protected readonly logger: Logger,
    protected readonly nodeType: NodeType,
  ) {}

  public abstract trackPayment(
    client: LightningClient,
    preimageHash: string,
    invoice: string,
    promise: Promise<PaymentResponse>,
  ): void;

  public abstract watchPayment(
    client: LightningClient,
    invoice: string,
    preimageHash: string,
  ): void;

  public abstract isPermanentError(err: unknown): boolean;

  public abstract parseErrorMessage(error: unknown): string;

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

  protected handleFailedPayment = async (
    client: LightningClient,
    preimageHash: string,
    error: any,
  ) => {
    const isPermanent = this.isPermanentError(error);

    const errorMsg = this.parseErrorMessage(error);
    this.logger.debug(
      `${nodeTypeToPrettyString(this.nodeType)} payment ${preimageHash} failed ${isPermanent ? 'permanently' : 'temporarily'}: ${errorMsg}`,
    );

    // Check for "Connection dropped" because the node status might be stale
    if (!client.isConnected() || errorMsg === 'Connection dropped') {
      this.logger.warn(
        `Not failing payment ${preimageHash} because client is not connected`,
      );
      return;
    }

    await LightningPaymentRepository.setStatus(
      preimageHash,
      this.nodeType,
      isPermanent
        ? LightningPaymentStatus.PermanentFailure
        : LightningPaymentStatus.TemporaryFailure,
      isPermanent ? errorMsg : undefined,
    );
  };
}

export default NodePendingPendingTracker;
