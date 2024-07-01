import LightningPayment, {
  LightningPaymentStatus,
  LightningPaymentType,
} from '../models/LightningPayment';
import { NodeType } from '../models/ReverseSwap';
import Swap from '../models/Swap';

enum Errors {
  PaymentExistsAlready = 'payment exists already',
  ErrorMissingPermanentFailure = 'payment error has to be set for permanent failures',
  ErrorSetNonPermanentFailure = 'payment error can only be set for permanent failures',
}

class LightningPaymentRepository {
  public static create = async (
    data: Omit<Omit<LightningPaymentType, 'status'>, 'error'>,
  ) => {
    const existing = await LightningPayment.findOne({
      where: {
        node: data.node,
        preimageHash: data.preimageHash,
      },
    });
    if (existing === null) {
      return LightningPayment.create({
        ...data,
        status: LightningPaymentStatus.Pending,
      });
    }

    if (existing.status !== LightningPaymentStatus.TemporaryFailure) {
      throw Errors.PaymentExistsAlready;
    }

    return existing.update({
      status: LightningPaymentStatus.Pending,
    });
  };

  public static setStatus = (
    preimageHash: string,
    node: NodeType,
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
          node,
        },
      },
    );
  };

  public static findByPreimageHash = (preimageHash: string) =>
    LightningPayment.findAll({ where: { preimageHash } });

  public static findByStatus = (status: LightningPaymentStatus) =>
    LightningPayment.findAll({
      where: { status },
      include: Swap,
    }) as Promise<(LightningPayment & { Swap: Swap })[]>;
}

export default LightningPaymentRepository;
export { Errors };
