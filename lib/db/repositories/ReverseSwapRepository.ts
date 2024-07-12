import { Op, Order, WhereOptions } from 'sequelize';
import { SwapUpdateEvent } from '../../consts/Enums';
import ReverseSwap, { ReverseSwapType } from '../models/ReverseSwap';

class ReverseSwapRepository {
  public static getReverseSwaps = (
    options?: WhereOptions,
    order?: Order,
    limit?: number,
  ): Promise<ReverseSwap[]> => {
    return ReverseSwap.findAll({
      limit,
      order,
      where: options,
    });
  };

  public static getReverseSwapsExpirable = (
    height: number,
  ): Promise<ReverseSwap[]> => {
    return ReverseSwap.findAll({
      where: {
        status: {
          [Op.notIn]: [
            SwapUpdateEvent.SwapExpired,
            SwapUpdateEvent.TransactionFailed,
            SwapUpdateEvent.TransactionRefunded,
            SwapUpdateEvent.InvoiceSettled,
          ],
        },
        timeoutBlockHeight: {
          [Op.lte]: height,
        },
      },
    });
  };

  public static getReverseSwap = (
    options: WhereOptions,
  ): Promise<ReverseSwap | null> => {
    return ReverseSwap.findOne({
      where: options,
    });
  };

  public static addReverseSwap = (
    reverseSwap: ReverseSwapType,
  ): Promise<ReverseSwap> => {
    return ReverseSwap.create(reverseSwap);
  };

  public static setInvoiceSettled = (
    reverseSwap: ReverseSwap,
    preimage: string,
  ): Promise<ReverseSwap> => {
    return reverseSwap.update({
      preimage,
      status: SwapUpdateEvent.InvoiceSettled,
    });
  };

  public static dropTable = (): Promise<void> => {
    return ReverseSwap.drop();
  };
}

export default ReverseSwapRepository;
