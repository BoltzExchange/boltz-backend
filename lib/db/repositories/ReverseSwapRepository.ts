import { Op, WhereOptions } from 'sequelize';
import { SwapUpdateEvent } from '../../consts/Enums';
import ReverseSwap, { ReverseSwapType } from '../models/ReverseSwap';

class ReverseSwapRepository {
  public static getReverseSwaps = (options?: WhereOptions): Promise<ReverseSwap[]> => {
    return ReverseSwap.findAll({
      where: options,
    });
  };

  public static getReverseSwapsExpirable = (height: number): Promise<ReverseSwap[]> => {
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

  public static getReverseSwap = (options: WhereOptions): Promise<ReverseSwap | null> => {
    return ReverseSwap.findOne({
      where: options,
    });
  };

  public static addReverseSwap = (reverseSwap: ReverseSwapType): Promise<ReverseSwap> => {
    return ReverseSwap.create(reverseSwap);
  };

  public static setReverseSwapStatus = (reverseSwap: ReverseSwap, status: string, failureReason?: string): Promise<ReverseSwap> => {
    return reverseSwap.update({
      status,
      failureReason,
    });
  };

  public static setLockupTransaction = (reverseSwap: ReverseSwap, transactionId: string, minerFee: number, vout?: number): Promise<ReverseSwap> => {
    return reverseSwap.update({
      minerFee,
      transactionId,
      transactionVout: vout,
      status: SwapUpdateEvent.TransactionMempool,
    });
  };

  public static setInvoiceSettled = (reverseSwap: ReverseSwap, preimage: string): Promise<ReverseSwap> => {
    return reverseSwap.update({
      preimage,
      status: SwapUpdateEvent.InvoiceSettled,
    });
  };

  public static setTransactionRefunded = (reverseSwap: ReverseSwap, minerFee: number, failureReason: string): Promise<ReverseSwap> => {
    return reverseSwap.update({
      failureReason,
      minerFee: reverseSwap.minerFee + minerFee,
      status: SwapUpdateEvent.TransactionRefunded,
    });
  };

  public static dropTable = (): Promise<void> => {
    return ReverseSwap.drop();
  };
}

export default ReverseSwapRepository;
