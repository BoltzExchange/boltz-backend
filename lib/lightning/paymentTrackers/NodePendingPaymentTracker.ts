import type Logger from '../../Logger';
import { getHexString, stringify } from '../../Utils';
import { LightningPaymentStatus } from '../../db/models/LightningPayment';
import type { NodeType } from '../../db/models/ReverseSwap';
import { nodeTypeToPrettyString } from '../../db/models/ReverseSwap';
import LightningPaymentRepository from '../../db/repositories/LightningPaymentRepository';
import type { LightningClient, PaymentResponse } from '../LightningClient';

abstract class NodePendingPaymentTracker {
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
    client: LightningClient,
    preimageHash: string,
    result: PaymentResponse,
  ) => {
    this.logger.debug(
      `${client.id} (${nodeTypeToPrettyString(this.nodeType)}) paid invoice ${preimageHash}: ${stringify(
        {
          feeMsat: result.feeMsat,
          preimage: getHexString(result.preimage),
        },
      )}`,
    );
    await LightningPaymentRepository.setStatus(
      preimageHash,
      client.id,
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
      `${client.id} (${nodeTypeToPrettyString(this.nodeType)}) payment ${preimageHash} failed ${isPermanent ? 'permanently' : 'temporarily'}: ${errorMsg}`,
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
      client.id,
      isPermanent
        ? LightningPaymentStatus.PermanentFailure
        : LightningPaymentStatus.TemporaryFailure,
      isPermanent ? errorMsg : undefined,
    );
  };
}

export default NodePendingPaymentTracker;
