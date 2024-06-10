import LightningPayment, {
  LightningPaymentStatus,
  LightningPaymentType,
} from '../models/LightningPayment';
import { NodeType } from '../models/ReverseSwap';
import Swap from '../models/Swap';

class LightningPaymentRepository {
  public static create = async (data: Omit<LightningPaymentType, 'status'>) => {
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
      throw 'payment exists already';
    }

    return existing.update({
      status: LightningPaymentStatus.Pending,
    });
  };

  public static setStatus = (
    preimageHash: string,
    node: NodeType,
    status: LightningPaymentStatus,
  ) =>
    LightningPayment.update(
      { status },
      {
        where: {
          preimageHash,
          node,
        },
      },
    );

  public static findByPreimageHash = (preimageHash: string) =>
    LightningPayment.findAll({ where: { preimageHash } });

  public static findByStatus = (status: LightningPaymentStatus) =>
    LightningPayment.findAll({
      where: { status },
      include: Swap,
    }) as Promise<(LightningPayment & { Swap: Swap })[]>;
}

export default LightningPaymentRepository;
