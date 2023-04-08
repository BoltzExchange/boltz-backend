import { Op, WhereOptions } from 'sequelize';
import Swap, { SwapType } from '../models/Swap';
import { SwapUpdateEvent } from '../../consts/Enums';

class SwapRepository {
  public static getSwaps = (options?: WhereOptions): Promise<Swap[]> => {
    return Swap.findAll({
      where: options,
    });
  };

  public static getSwapsExpirable = (height: number): Promise<Swap[]> => {
    return Swap.findAll({
      where: {
        status: {
          [Op.notIn]: [
            SwapUpdateEvent.SwapExpired,
            SwapUpdateEvent.InvoiceFailedToPay,
            SwapUpdateEvent.TransactionClaimed,
          ],
        },
        timeoutBlockHeight: {
          [Op.lte]: height,
        },
      },
    });
  };

  public static getSwap = (options: WhereOptions): Promise<Swap | null> => {
    return Swap.findOne({
      where: options,
    });
  };

  public static addSwap = (swap: SwapType): Promise<Swap> => {
    return Swap.create(swap);
  };

  public static setSwapStatus = (swap: Swap, status: string, failureReason?: string,): Promise<Swap> => {
    return swap.update({
      status,
      failureReason,
    });
  };

  public static setInvoice = (
    swap: Swap,
    invoice: string,
    invoiceAmount: number,
    expectedAmount: number,
    fee: number,
    acceptZeroConf: boolean,
  ): Promise<Swap> => {
    return swap.update({
      fee,
      invoice,
      invoiceAmount,
      acceptZeroConf,
      expectedAmount,
      status: SwapUpdateEvent.InvoiceSet,
    });
  };

  public static setLockupTransaction = (
    swap: Swap,
    lockupTransactionId: string,
    onchainAmount: number,
    confirmed: boolean,
    lockupTransactionVout?: number,
  ): Promise<Swap> => {
    return swap.update({
      onchainAmount,
      lockupTransactionId,
      lockupTransactionVout,
      status: confirmed ? SwapUpdateEvent.TransactionConfirmed : SwapUpdateEvent.TransactionMempool,
    });
  };

  public static setRate = (swap: Swap, rate: number): Promise<Swap> => {
    return swap.update({
      rate,
    });
  };

  public static setInvoicePaid = (swap: Swap, routingFee: number): Promise<Swap> => {
    return swap.update({
      routingFee,
      status: SwapUpdateEvent.InvoicePaid,
    });
  };

  public static setMinerFee = (swap: Swap, minerFee: number): Promise<Swap> => {
    return swap.update({
      minerFee,
      status: SwapUpdateEvent.TransactionClaimed,
    });
  };

  public static dropTable = (): Promise<void> => {
    return Swap.drop();
  };
}

export default SwapRepository;
