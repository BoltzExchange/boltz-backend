import { WhereOptions, Op } from 'sequelize';
import { SwapUpdateEvent } from '../consts/Enums';
import Swap, { SwapType } from '../db/models/Swap';

class SwapRepository {
  public getSwaps = async (options?: WhereOptions): Promise<Swap[]> => {
    return Swap.findAll({
      where: options,
    });
  }

  public getSwap = async (options: WhereOptions): Promise<Swap | undefined> => {
    return Swap.findOne({
      where: options,
    });
  }

  public getSwapByInvoice = async (invoice: string): Promise<Swap | undefined> => {
    return Swap.findOne({
      where: {
        invoice: {
          [Op.eq]: invoice,
        },
      },
    });
  }

  public addSwap = async (swap: SwapType): Promise<Swap> => {
    return Swap.create(swap);
  }

  public setSwapStatus = async (swap: Swap, status: string): Promise<Swap> => {
    return swap.update({
      status,
    });
  }

  public setLockupTransactionId = async (swap: Swap, lockupTransactionId: string, onchainAmount: number, confirmed: boolean): Promise<Swap> => {
    return swap.update({
      onchainAmount,
      lockupTransactionId,
      status: confirmed ? SwapUpdateEvent.TransactionConfirmed : SwapUpdateEvent.TransactionMempool,
    });
  }

  public setInvoicePaid = async (swap: Swap, routingFee: number): Promise<Swap> => {
    return swap.update({
      routingFee,
      status: SwapUpdateEvent.InvoicePaid,
    });
  }

  public setMinerFee = async (swap: Swap, minerFee: number): Promise<Swap> => {
    return swap.update({
      minerFee,
      status: SwapUpdateEvent.TransactionClaimed,
    });
  }

  public dropTable = async () => {
    return Swap.drop();
  }
}

export default SwapRepository;
