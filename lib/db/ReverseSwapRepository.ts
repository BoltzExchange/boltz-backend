import { WhereOptions } from 'sequelize';
import { SwapUpdateEvent } from '../consts/Enums';
import ReverseSwap, { ReverseSwapType } from './models/ReverseSwap';

class ReverseSwapRepository {

  public getReverseSwaps = async (options?: WhereOptions): Promise<ReverseSwap[]> => {
    return ReverseSwap.findAll({
      where: options,
    });
  }

  public getReverseSwap = async (options: WhereOptions): Promise<ReverseSwap> => {
    return ReverseSwap.findOne({
      where: options,
    });
  }

  public addReverseSwap = async (reverseSwap: ReverseSwapType) => {
    return ReverseSwap.create(reverseSwap);
  }

  public setReverseSwapStatus = async (reverseSwap: ReverseSwap, status: string) => {
    return reverseSwap.update({
      status,
    });
  }

  public setLockupTransaction = (reverseSwap: ReverseSwap, transactionId: string, minerFee: number) => {
    return reverseSwap.update({
      minerFee,
      transactionId,
      status: SwapUpdateEvent.TransactionMempool,
    });
  }

  public setInvoiceSettled = async (reverseSwap: ReverseSwap, preimage: string) => {
    return reverseSwap.update({
      preimage,
      status: SwapUpdateEvent.InvoiceSettled,
    });
  }

  public setTransactionRefunded = async (reverseSwap: ReverseSwap, minerFee: number) => {
    return reverseSwap.update({
      minerFee: reverseSwap.minerFee + minerFee,
      status: SwapUpdateEvent.TransactionRefunded,
    });
  }

  public dropTable = async () => {
    return ReverseSwap.drop();
  }
}

export default ReverseSwapRepository;
