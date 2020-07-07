import { WhereOptions } from 'sequelize';
import Swap, { SwapType } from './models/Swap';
import { SwapUpdateEvent } from '../consts/Enums';

class SwapRepository {
  public getSwaps = (options?: WhereOptions): Promise<Swap[]> => {
    return Swap.findAll({
      where: options,
    });
  }

  public getSwap = (options: WhereOptions): Promise<Swap | null> => {
    return Swap.findOne({
      where: options,
    });
  }

  public addSwap = (swap: SwapType): Promise<Swap> => {
    return Swap.create(swap);
  }

  public setSwapStatus = (swap: Swap, status: string): Promise<Swap> => {
    return swap.update({
      status,
    });
  }

  public setInvoice = (swap: Swap, invoice: string, expectedAmount: number, fee: number, acceptZeroConf: boolean): Promise<Swap> => {
    return swap.update({
      fee,
      invoice,
      acceptZeroConf,
      expectedAmount,
      status: SwapUpdateEvent.InvoiceSet,
    });
  }

  public setLockupTransactionId = (
    swap: Swap,
    rate: number,
    lockupTransactionId: string,
    onchainAmount: number,
    confirmed: boolean,
  ): Promise<Swap> => {
    return swap.update({
      rate,
      onchainAmount,
      lockupTransactionId,
      status: confirmed ? SwapUpdateEvent.TransactionConfirmed : SwapUpdateEvent.TransactionMempool,
    });
  }

  public setInvoicePaid = (swap: Swap, routingFee: number): Promise<Swap> => {
    return swap.update({
      routingFee,
      status: SwapUpdateEvent.InvoicePaid,
    });
  }

  public setMinerFee = (swap: Swap, minerFee: number): Promise<Swap> => {
    return swap.update({
      minerFee,
      status: SwapUpdateEvent.TransactionClaimed,
    });
  }

  public dropTable = (): Promise<void> => {
    return Swap.drop();
  }
}

export default SwapRepository;
