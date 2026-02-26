import type { CreateOptions, Order, WhereOptions } from 'sequelize';
import { Op, Transaction } from 'sequelize';
import { SwapUpdateEvent } from '../../consts/Enums';
import Database from '../Database';
import type { SwapType } from '../models/Swap';
import Swap from '../models/Swap';

class SwapRepository {
  public static readonly lockupNonUpdatableStatuses = [
    SwapUpdateEvent.InvoicePaid,
    SwapUpdateEvent.TransactionClaimPending,
    SwapUpdateEvent.TransactionClaimed,
  ];

  public static getSwaps = (
    options?: WhereOptions,
    order?: Order,
    limit?: number,
  ): Promise<Swap[]> => {
    return Swap.findAll({
      limit,
      order,
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

  public static getSwapsClaimable = () => {
    return Swap.findAll({
      where: {
        status: SwapUpdateEvent.TransactionClaimPending,
      },
    });
  };

  public static getSwap = (options: WhereOptions): Promise<Swap | null> => {
    return Swap.findOne({
      where: options,
    });
  };

  public static addSwap = async (
    swap: SwapType,
    options?: CreateOptions<Swap>,
  ): Promise<Swap> => {
    if (options !== undefined) {
      return await Swap.create(swap, options);
    }

    return await Database.sequelize.transaction(
      {
        isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
      },
      async (transaction) => {
        return await Swap.create(swap, { transaction });
      },
    );
  };

  public static disableZeroConf = async (swaps: Swap[]) => {
    if (swaps.length === 0) {
      return;
    }

    await Swap.update(
      { acceptZeroConf: false },
      { where: { id: swaps.map((s) => s.id) } },
    );
  };

  public static setSwapStatus = (
    swap: Swap,
    status: string,
    failureReason?: string,
  ): Promise<Swap> =>
    swap.update({
      status,
      failureReason: swap.failureReason || failureReason,
    });

  public static setInvoice = (
    swap: Swap,
    invoice: string,
    invoiceAmount: number,
    expectedAmount: number,
    fee: number,
    acceptZeroConf: boolean,
  ): Promise<Swap> => {
    return Database.sequelize.transaction(
      {
        isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
      },
      async (transaction) => {
        return await swap.update(
          {
            fee,
            invoice,
            invoiceAmount,
            acceptZeroConf,
            expectedAmount,
            status: SwapUpdateEvent.InvoiceSet,
          },
          { transaction },
        );
      },
    );
  };

  public static setLockupTransaction = async (
    swap: Swap,
    lockupTransactionId: string,
    onchainAmount: number,
    confirmed: boolean,
    lockupTransactionVout?: number,
  ): Promise<Swap> => {
    await Swap.update(
      {
        onchainAmount,
        lockupTransactionId,
        lockupTransactionVout,
        status: confirmed
          ? SwapUpdateEvent.TransactionConfirmed
          : SwapUpdateEvent.TransactionMempool,
      },
      {
        where: {
          id: swap.id,
          status: {
            [Op.notIn]: SwapRepository.lockupNonUpdatableStatuses,
          },
        },
      },
    );

    return (await SwapRepository.getSwap({ id: swap.id })) || swap;
  };

  public static setRate = (swap: Swap, rate: number): Promise<Swap> => {
    return swap.update({
      rate,
    });
  };

  public static setInvoicePaid = (
    swap: Swap,
    routingFee: number,
    preimage: string,
  ): Promise<Swap> => {
    return swap.update({
      preimage,
      routingFee,
      failureReason: null,
      status: SwapUpdateEvent.InvoicePaid,
    });
  };

  public static setMinerFee = (swap: Swap, minerFee: number): Promise<Swap> => {
    return swap.update({
      minerFee,
      status: SwapUpdateEvent.TransactionClaimed,
    });
  };

  public static setRefundSignatureCreated = (id: string) =>
    Swap.update(
      {
        createdRefundSignature: true,
      },
      {
        where: {
          id,
        },
      },
    );

  public static dropTable = (): Promise<void> => {
    return Swap.drop();
  };
}

export default SwapRepository;
