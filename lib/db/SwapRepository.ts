import { WhereOptions } from 'sequelize';
import Swap, { SwapType } from './models/Swap';
import { SwapUpdateEvent } from '../consts/Enums';

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

  public addSwap = async (swap: SwapType) => {
    return Swap.create(swap);
  }

  public setSwapStatus = async (swap: Swap, status: string) => {
    return swap.update({
      status,
    });
  }

  public setInvoice = async (swap: Swap, invoice: string, expectedAmount: number, fee: number, acceptZeroConf: boolean) => {
    return swap.update({
      fee,
      invoice,
      acceptZeroConf,
      expectedAmount,
      status: SwapUpdateEvent.InvoiceSet,
    });
  }

  public setLockupTransactionId = async (
    swap: Swap,
    rate: number,
    lockupTransactionId: string,
    onchainAmount: number,
    confirmed: boolean,
  ) => {
    return swap.update({
      rate,
      onchainAmount,
      lockupTransactionId,
      status: confirmed ? SwapUpdateEvent.TransactionConfirmed : SwapUpdateEvent.TransactionMempool,
    });
  }

  public setInvoicePaid = async (swap: Swap, routingFee: number) => {
    return swap.update({
      routingFee,
      status: SwapUpdateEvent.InvoicePaid,
    });
  }

  public setMinerFee = async (swap: Swap, minerFee: number) => {
    return swap.update({
      minerFee,
      status: SwapUpdateEvent.TransactionClaimed,
    });
  }

  public dropTable = () => {
    return Swap.drop();
  }
}

export default SwapRepository;
