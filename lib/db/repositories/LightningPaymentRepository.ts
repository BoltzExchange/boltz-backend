import type { LightningPaymentType } from '../models/LightningPayment';
import LightningPayment, {
  LightningPaymentStatus,
} from '../models/LightningPayment';
import Swap from '../models/Swap';

enum Errors {
  PaymentExistsAlready = 'payment exists already',
  ErrorMissingPermanentFailure = 'payment error has to be set for permanent failures',
  ErrorSetNonPermanentFailure = 'payment error can only be set for permanent failures',
}

class LightningPaymentRepository {
  public static create = async (
    data: Omit<Omit<Omit<LightningPaymentType, 'status'>, 'error'>, 'retries'>,
  ) => {
    const existing = await LightningPayment.findOne({
      where: {
        nodeId: data.nodeId,
        preimageHash: data.preimageHash,
      },
    });
    if (existing === null) {
      return LightningPayment.create({
        ...data,
        retries: 1,
        status: LightningPaymentStatus.Pending,
      });
    }

    if (existing.status !== LightningPaymentStatus.TemporaryFailure) {
      throw Errors.PaymentExistsAlready;
    }

    return existing.update({
      retries: (existing.retries || 0) + 1,
      status: LightningPaymentStatus.Pending,
    });
  };

  public static setStatus = (
    preimageHash: string,
    nodeId: string,
    status: LightningPaymentStatus,
    error?: string,
  ) => {
    if (
      error == undefined &&
      status === LightningPaymentStatus.PermanentFailure
    ) {
      throw Errors.ErrorMissingPermanentFailure;
    } else if (
      error !== undefined &&
      status !== LightningPaymentStatus.PermanentFailure
    ) {
      throw Errors.ErrorSetNonPermanentFailure;
    }

    return LightningPayment.update(
      { status, error },
      {
        where: {
          preimageHash,
          nodeId,
        },
      },
    );
  };

  public static findByPreimageHash = (preimageHash: string) =>
    LightningPayment.findAll({ where: { preimageHash } });

  public static findByPreimageHashAndNodeId = (
    preimageHash: string,
    nodeId: string,
  ) => LightningPayment.findOne({ where: { preimageHash, nodeId } });

  public static findByStatus = (status: LightningPaymentStatus) =>
    LightningPayment.findAll({
      where: { status },
      include: Swap,
    }) as Promise<(LightningPayment & { Swap: Swap })[]>;
}

export default LightningPaymentRepository;
export { Errors };
