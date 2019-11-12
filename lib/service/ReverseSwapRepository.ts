import { WhereOptions } from 'sequelize';
import { SwapUpdateEvent } from '../consts/Enums';
import ReverseSwap, { ReverseSwapType } from '../db/models/ReverseSwap';

class ReverseSwapRepository {
  public getReverseSwaps = async (options?: WhereOptions): Promise<ReverseSwap[]> => {
    return ReverseSwap.findAll({
      where: options,
    });
  }

  public getReverseSwap = async (options: WhereOptions): Promise<ReverseSwap | undefined> => {
    return ReverseSwap.findOne({
      where: options,
    });
  }

  public addReverseSwap = async (reverseSwap: ReverseSwapType): Promise<ReverseSwap> => {
    return ReverseSwap.create(reverseSwap);
  }

  public setReverseSwapStatus = async (reverseSwap: ReverseSwap, status: string): Promise<ReverseSwap> => {
    return reverseSwap.update({
      status,
    });
  }

  public setInvoiceSettled = async (reverseSwap: ReverseSwap, preimage: string): Promise<ReverseSwap> => {
    return reverseSwap.update({
      preimage,
      status: SwapUpdateEvent.InvoiceSettled,
    });
  }

  public setTransactionRefunded = async (reverseSwap: ReverseSwap, minerFee: number): Promise<ReverseSwap> => {
    return reverseSwap.update({
      minerFee: reverseSwap.minerFee + minerFee,
      status: SwapUpdateEvent.BoltzTransactionRefunded,
    });
  }

  public dropTable = async () => {
    return ReverseSwap.drop();
  }
}

export default ReverseSwapRepository;
