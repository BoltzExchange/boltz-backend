import type { CreateOptions, Order, WhereOptions } from 'sequelize';
import { Op, Transaction } from 'sequelize';
import { SwapUpdateEvent } from '../../consts/Enums';
import Database from '../Database';
import type {
  LockupIdentity,
  LockupTarget,
  LockupWriteResult,
} from '../LockupIdentity';
import {
  LockupWriteOutcome,
  decideLockupWrite,
  ownsLockup,
  shouldWriteZeroConfRejection,
} from '../LockupIdentity';
import type { SwapType } from '../models/Swap';
import Swap from '../models/Swap';

class SwapRepository {
  public static readonly lockupNonUpdatableStatuses = [
    SwapUpdateEvent.InvoicePending,
    SwapUpdateEvent.InvoicePaid,
    SwapUpdateEvent.InvoiceFailedToPay,
    SwapUpdateEvent.TransactionClaimPending,
    SwapUpdateEvent.TransactionClaimed,
    SwapUpdateEvent.SwapExpired,
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

  private static lockSwapForUpdate = (
    id: string,
    transaction: Transaction,
  ): Promise<Swap | null> =>
    Swap.findOne({
      transaction,
      lock: transaction.LOCK.UPDATE,
      where: { id },
    });

  public static setLockupTransaction = async (
    swap: Swap,
    lockupTransactionId: string,
    onchainAmount: number,
    target: LockupTarget,
    lockupTransactionVout?: number,
  ): Promise<LockupWriteResult<Swap>> => {
    const decision = await Database.sequelize.transaction(
      async (transaction) => {
        const current = await SwapRepository.lockSwapForUpdate(
          swap.id,
          transaction,
        );
        if (current === null) {
          return { outcome: LockupWriteOutcome.Rejected, write: false };
        }

        const decision = decideLockupWrite({
          existing:
            current.lockupTransactionId == null
              ? null
              : {
                  transactionId: current.lockupTransactionId,
                  vout: current.lockupTransactionVout,
                },
          incoming: {
            transactionId: lockupTransactionId,
            vout: lockupTransactionVout,
          },
          currentStatus: current.status as SwapUpdateEvent,
          targetStatus: target.status,
          updatable: !SwapRepository.lockupNonUpdatableStatuses.includes(
            current.status as SwapUpdateEvent,
          ),
        });

        if (decision.write) {
          await current.update(
            {
              onchainAmount,
              lockupTransactionId,
              status: target.status,
              lockupTransactionVout: decision.vout,
              // Always written to clear the reason of a lockup that failed before
              failureReason:
                target.status === SwapUpdateEvent.TransactionLockupFailed
                  ? target.failureReason
                  : null,
            },
            { transaction },
          );
        }

        return decision;
      },
    );

    return {
      outcome: decision.outcome,
      written: decision.write,
      swap: (await SwapRepository.getSwap({ id: swap.id })) || swap,
    };
  };

  public static setLockupFailed = async (
    swap: Swap,
    incoming: LockupIdentity,
    failureReason: string,
  ): Promise<LockupWriteResult<Swap>> => {
    const outcome = await Database.sequelize.transaction(
      async (transaction) => {
        const current = await SwapRepository.lockSwapForUpdate(
          swap.id,
          transaction,
        );
        if (
          current === null ||
          current.lockupTransactionId == null ||
          !ownsLockup(
            {
              transactionId: current.lockupTransactionId,
              vout: current.lockupTransactionVout,
            },
            incoming,
          ) ||
          SwapRepository.lockupNonUpdatableStatuses.includes(
            current.status as SwapUpdateEvent,
          )
        ) {
          return LockupWriteOutcome.Rejected;
        }

        await current.update(
          {
            failureReason,
            status: SwapUpdateEvent.TransactionLockupFailed,
          },
          { transaction },
        );

        return LockupWriteOutcome.Acquired;
      },
    );

    return {
      outcome,
      written: outcome === LockupWriteOutcome.Acquired,
      swap: (await SwapRepository.getSwap({ id: swap.id })) || swap,
    };
  };

  public static setZeroConfRejected = async (
    swap: Swap,
    transactionId: string,
    transactionVout?: number,
  ): Promise<Swap> => {
    await Database.sequelize.transaction(async (transaction) => {
      const current = await SwapRepository.lockSwapForUpdate(
        swap.id,
        transaction,
      );
      if (
        current === null ||
        !shouldWriteZeroConfRejection({
          existing:
            current.lockupTransactionId == null
              ? null
              : {
                  transactionId: current.lockupTransactionId,
                  vout: current.lockupTransactionVout,
                },
          incoming: { transactionId, vout: transactionVout },
          currentStatus: current.status as SwapUpdateEvent,
        })
      ) {
        return;
      }

      await current.update(
        { status: SwapUpdateEvent.TransactionZeroConfRejected },
        { transaction },
      );
    });

    return (await SwapRepository.getSwap({ id: swap.id })) || swap;
  };

  public static setRefundAddress = (
    swap: Swap,
    refundAddress: string,
  ): Promise<Swap> => {
    return swap.update({
      refundAddress,
    });
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
