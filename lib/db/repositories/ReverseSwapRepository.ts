import { Op, WhereOptions } from 'sequelize';
import { SwapUpdateEvent } from '../../consts/Enums';
import ReverseSwap, { ReverseSwapType } from '../models/ReverseSwap';

class ReverseSwapRepository {
  public getReverseSwaps = (options?: WhereOptions): Promise<ReverseSwap[]> => {
    return ReverseSwap.findAll({
      where: options,
    });
  }

  public getReverseSwapsExpirable = (height: number): Promise<ReverseSwap[]> => {
    return ReverseSwap.findAll({
      where: {
        status: {
          [Op.not]: [
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
  }

  public getReverseSwap = (options: WhereOptions): Promise<ReverseSwap | null> => {
    return ReverseSwap.findOne({
      where: options,
    });
  }

  public addReverseSwap = (reverseSwap: ReverseSwapType): Promise<ReverseSwap> => {
    return ReverseSwap.create(reverseSwap);
  }

  public setReverseSwapStatus = (reverseSwap: ReverseSwap, status: string, failureReason?: string): Promise<ReverseSwap> => {
    return reverseSwap.update({
      status,
      failureReason,
    });
  }

  public setLockupTransaction = (reverseSwap: ReverseSwap, transactionId: string, minerFee: number, vout?: number): Promise<ReverseSwap> => {
    return reverseSwap.update({
      minerFee,
      transactionId,
      transactionVout: vout,
      status: SwapUpdateEvent.TransactionMempool,
    });
  }

  public setInvoiceSettled = (reverseSwap: ReverseSwap, preimage: string): Promise<ReverseSwap> => {
    return reverseSwap.update({
      preimage,
      status: SwapUpdateEvent.InvoiceSettled,
    });
  }

  public setTransactionRefunded = (reverseSwap: ReverseSwap, minerFee: number, failureReason: string): Promise<ReverseSwap> => {
    return reverseSwap.update({
      failureReason,
      minerFee: reverseSwap.minerFee + minerFee,
      status: SwapUpdateEvent.TransactionRefunded,
    });
  }

  public dropTable = (): Promise<void> => {
    return ReverseSwap.drop();
  }
}

export default ReverseSwapRepository;
