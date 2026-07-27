import type { Order, WhereOptions } from 'sequelize';
import { Op, Transaction } from 'sequelize';
import {
  getHexString,
  getSendingReceivingCurrency,
  splitPairId,
} from '../../Utils';
import {
  FinalChainSwapEvents,
  SwapType,
  SwapUpdateEvent,
  SwapVersion,
} from '../../consts/Enums';
import type { IncorrectAmountDetails } from '../../consts/Types';
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
import type { ChainSwapType } from '../models/ChainSwap';
import ChainSwap from '../models/ChainSwap';
import type { ChainSwapDataType } from '../models/ChainSwapData';
import ChainSwapData from '../models/ChainSwapData';
import ScriptPubKeyRepository from './ScriptPubKeyRepository';

type ChainSwapDataTypeInsert = ChainSwapDataType & {
  scriptPubKey?: Buffer;
};

type UserLockupTransactionOptions = {
  allowLockupFailedUpdate?: boolean;
};

class ChainSwapInfo {
  constructor(
    public chainSwap: ChainSwap,
    public sendingData: ChainSwapData,
    public receivingData: ChainSwapData,
  ) {}

  get type() {
    return SwapType.Chain;
  }

  get version() {
    return SwapVersion.Taproot;
  }

  get id() {
    return this.chainSwap.id;
  }

  get status() {
    return this.chainSwap.status as SwapUpdateEvent;
  }

  get acceptZeroConf() {
    return this.chainSwap.acceptZeroConf;
  }

  get createdRefundSignature() {
    return this.chainSwap.createdRefundSignature;
  }

  get failureReason() {
    return this.chainSwap.failureReason;
  }

  get isSettled() {
    return this.chainSwap.status === SwapUpdateEvent.TransactionClaimed;
  }

  get pair() {
    return this.chainSwap.pair;
  }

  get orderSide() {
    return this.chainSwap.orderSide;
  }

  get preimage() {
    return this.chainSwap.preimage;
  }

  get preimageHash() {
    return this.chainSwap.preimageHash;
  }

  get fee() {
    return this.chainSwap.fee;
  }

  get paidMinerFees(): boolean {
    return [this.sendingData.fee, this.receivingData.fee].some(
      (val) => val !== undefined && val !== null,
    );
  }

  get refundCurrency() {
    return this.sendingData.symbol;
  }

  get serverLockupTransactionId() {
    return this.sendingData.transactionId;
  }

  get failureDetails(): IncorrectAmountDetails | undefined {
    if (
      this.status === SwapUpdateEvent.TransactionLockupFailed &&
      [this.receivingData.expectedAmount, this.receivingData.amount].every(
        (val) => val !== undefined && val !== null,
      )
    ) {
      if (this.receivingData.amount! !== this.receivingData.expectedAmount!) {
        return {
          actual: this.receivingData.amount!,
          expected: this.receivingData.expectedAmount!,
        };
      }
    }

    return undefined;
  }

  get theirRefundPublicKey() {
    return this.receivingData.theirPublicKey;
  }
}

class ChainSwapRepository {
  private static readonly defaultUserLockupTransactionStatuses = [
    SwapUpdateEvent.SwapCreated,
    SwapUpdateEvent.TransactionMempool,
    SwapUpdateEvent.TransactionZeroConfRejected,
    SwapUpdateEvent.TransactionConfirmed,
  ];

  public static getUserLockupTransactionStatuses = (
    options?: UserLockupTransactionOptions,
  ) => {
    const statuses = [
      ...ChainSwapRepository.defaultUserLockupTransactionStatuses,
    ];
    if (options?.allowLockupFailedUpdate) {
      statuses.push(SwapUpdateEvent.TransactionLockupFailed);
    }

    return statuses;
  };

  public static canActOnUserLockup = (
    swap: ChainSwapInfo,
    options?: UserLockupTransactionOptions,
  ): boolean =>
    swap.status !== SwapUpdateEvent.TransactionLockupFailed ||
    options?.allowLockupFailedUpdate === true;

  public static getChainSwap = async (
    options: WhereOptions,
  ): Promise<ChainSwapInfo | null> => {
    const chainSwap = await ChainSwap.findOne({
      where: options,
    });
    if (chainSwap === null) {
      return null;
    }

    return ChainSwapRepository.fetchChainSwapData(chainSwap);
  };

  public static getChainSwaps = async (
    options?: WhereOptions,
    order?: Order,
    limit?: number,
  ): Promise<ChainSwapInfo[]> => {
    const chainSwaps = await ChainSwap.findAll({
      limit,
      order,
      where: options,
    });
    return Promise.all(chainSwaps.map(this.fetchChainSwapData));
  };

  /**
   * Get a chain swap to with **both** options apply
   */
  public static getChainSwapByData = async (
    dataOptions: WhereOptions,
    swapOptions: WhereOptions = {},
  ): Promise<ChainSwapInfo | null> => {
    const matchingData = await ChainSwapData.findOne({
      where: dataOptions,
    });
    if (matchingData === null) {
      return null;
    }

    return this.getChainSwap({
      ...swapOptions,
      id: matchingData.swapId,
    });
  };

  /**
   * Gets all chain swaps to which **either** of the options applies
   */
  public static getChainSwapsByData = async (
    dataOptions: WhereOptions,
    swapOptions?: WhereOptions,
  ): Promise<ChainSwapInfo[]> => {
    const matchingData = await ChainSwapData.findAll({
      where: dataOptions,
    });

    const swaps = await Promise.all(
      Array.from(
        new Set<string>(matchingData.map((d) => d.swapId)).values(),
      ).map(async (id) => (await this.getChainSwap({ id: id }))!)!,
    );

    if (swapOptions === undefined) {
      return swaps;
    }

    const deduplicateOptions = { [Op.notIn]: swaps.map((swap) => swap.id) };
    if ('id' in swapOptions) {
      swapOptions.id = {
        [Op.and]: [deduplicateOptions, swapOptions.id],
      };
    } else {
      swapOptions['id'] = deduplicateOptions;
    }

    return swaps.concat(await this.getChainSwaps(swapOptions));
  };

  public static getChainSwapsExpirable = async (
    symbols: string[],
    blockHeight: number,
  ) => {
    const data = await ChainSwapData.findAll({
      where: {
        symbol: symbols,
        timeoutBlockHeight: {
          [Op.lte]: blockHeight,
        },
      },
    });

    const swaps = await this.getChainSwaps({
      id: data.map((d) => d.swapId),
      status: {
        // TransactionClaimPending is only set after we received the preimage
        // from the user's claim of our sending leg, so there is nothing left
        // to refund - leave the swap to the deferred claimer.
        [Op.notIn]: [
          ...FinalChainSwapEvents,
          SwapUpdateEvent.TransactionClaimPending,
        ],
      },
    });

    return swaps.filter((s) => symbols.includes(s.sendingData.symbol));
  };

  public static getChainSwapsClaimable = () =>
    this.getChainSwaps({
      status: SwapUpdateEvent.TransactionClaimPending,
    });

  public static addChainSwap = (args: {
    chainSwap: ChainSwapType;
    sendingData: ChainSwapDataTypeInsert;
    receivingData: ChainSwapDataTypeInsert;
  }) =>
    Database.sequelize.transaction(
      {
        isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
      },
      async (transaction) => {
        await ChainSwap.create(args.chainSwap, { transaction });

        await Promise.all([
          ChainSwapData.create(args.sendingData, { transaction }),
          ChainSwapData.create(args.receivingData, { transaction }),
        ]);

        if (args.receivingData.scriptPubKey !== undefined) {
          await ScriptPubKeyRepository.add(
            args.chainSwap.id,
            args.receivingData.symbol,
            args.receivingData.scriptPubKey,
            { transaction },
          );
        }
      },
    );

  public static destroy = (id: string) =>
    Database.sequelize.transaction(async (transaction) => {
      await ChainSwapData.destroy({
        transaction,
        where: {
          swapId: id,
        },
      });
      await ChainSwap.destroy({
        transaction,
        where: {
          id,
        },
      });
    });

  public static disableZeroConf = async (swaps: ChainSwapInfo[]) => {
    if (swaps.length === 0) {
      return;
    }

    await ChainSwap.update(
      {
        acceptZeroConf: false,
      },
      {
        where: {
          id: swaps.map((s) => s.id),
        },
      },
    );
  };

  public static setRefundSignatureCreated = (id: string) =>
    ChainSwap.update(
      {
        createdRefundSignature: true,
      },
      {
        where: {
          id,
        },
      },
    );

  // Locks the rows in a fixed order to keep concurrent writers from deadlocking
  private static lockChainSwapForUpdate = async (
    swap: ChainSwapInfo,
    transaction: Transaction,
  ): Promise<{ current: ChainSwap; currentData: ChainSwapData } | null> => {
    const current = await ChainSwap.findOne({
      transaction,
      lock: transaction.LOCK.UPDATE,
      where: { id: swap.id },
    });
    if (current === null) {
      return null;
    }

    const currentData = await ChainSwapData.findOne({
      transaction,
      lock: transaction.LOCK.UPDATE,
      where: { swapId: swap.id, symbol: swap.receivingData.symbol },
    });
    if (currentData === null) {
      return null;
    }

    return { current, currentData };
  };

  public static setUserLockupTransaction = async (
    swap: ChainSwapInfo,
    lockupTransactionId: string,
    onchainAmount: number,
    target: LockupTarget,
    lockupTransactionVout?: number,
    options?: UserLockupTransactionOptions,
  ): Promise<LockupWriteResult<ChainSwapInfo>> => {
    const decision = await Database.sequelize.transaction(
      async (transaction) => {
        const locked = await ChainSwapRepository.lockChainSwapForUpdate(
          swap,
          transaction,
        );
        if (locked === null) {
          return { outcome: LockupWriteOutcome.Rejected, write: false };
        }
        const { current, currentData } = locked;

        const updatable = ChainSwapRepository.getUserLockupTransactionStatuses(
          options,
        ).includes(current.status as SwapUpdateEvent);

        const decision = decideLockupWrite({
          existing:
            currentData.transactionId == null
              ? null
              : {
                  transactionId: currentData.transactionId,
                  vout: currentData.transactionVout,
                },
          incoming: {
            transactionId: lockupTransactionId,
            vout: lockupTransactionVout,
          },
          currentStatus: current.status as SwapUpdateEvent,
          targetStatus: target.status,
          updatable,
        });

        if (decision.write) {
          await current.update(
            {
              status: target.status,
              // Always written to clear the reason of a lockup that failed before
              failureReason:
                target.status === SwapUpdateEvent.TransactionLockupFailed
                  ? target.failureReason
                  : null,
            },
            { transaction },
          );
          await currentData.update(
            {
              amount: onchainAmount,
              transactionId: lockupTransactionId,
              transactionVout: decision.vout,
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
      swap: (await ChainSwapRepository.getChainSwap({ id: swap.id }))!,
    };
  };

  public static setUserLockupFailed = async (
    swap: ChainSwapInfo,
    incoming: LockupIdentity,
    failureReason: string,
    options?: UserLockupTransactionOptions,
  ): Promise<LockupWriteResult<ChainSwapInfo>> => {
    const outcome = await Database.sequelize.transaction(
      async (transaction) => {
        const locked = await ChainSwapRepository.lockChainSwapForUpdate(
          swap,
          transaction,
        );
        if (locked === null) {
          return LockupWriteOutcome.Rejected;
        }
        const { current, currentData } = locked;

        if (
          currentData.transactionId == null ||
          !ownsLockup(
            {
              transactionId: currentData.transactionId,
              vout: currentData.transactionVout,
            },
            incoming,
          ) ||
          !ChainSwapRepository.getUserLockupTransactionStatuses(
            options,
          ).includes(current.status as SwapUpdateEvent)
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
      swap: (await ChainSwapRepository.getChainSwap({ id: swap.id }))!,
    };
  };

  public static setZeroConfRejected = async (
    swap: ChainSwapInfo,
    transactionId: string,
    transactionVout?: number,
  ): Promise<ChainSwapInfo> => {
    await Database.sequelize.transaction(async (transaction) => {
      const locked = await ChainSwapRepository.lockChainSwapForUpdate(
        swap,
        transaction,
      );
      if (locked === null) {
        return;
      }
      const { current, currentData } = locked;

      if (
        !shouldWriteZeroConfRejection({
          existing:
            currentData.transactionId == null
              ? null
              : {
                  transactionId: currentData.transactionId,
                  vout: currentData.transactionVout,
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

    return (await ChainSwapRepository.getChainSwap({ id: swap.id }))!;
  };

  public static setExpectedAmounts = (
    swap: ChainSwapInfo,
    fee: number,
    userLockAmount: number,
    serverLockAmount: number,
    acceptZeroConf?: boolean,
  ): Promise<ChainSwapInfo> =>
    Database.sequelize.transaction(async (transaction) => {
      const chainSwapUpdate: {
        fee: number;
        failureReason: null;
        acceptZeroConf?: boolean;
      } = {
        fee,
        failureReason: null,
      };
      if (acceptZeroConf !== undefined) {
        chainSwapUpdate.acceptZeroConf = acceptZeroConf;
      }

      swap.chainSwap = await swap.chainSwap.update(chainSwapUpdate, {
        transaction,
      });
      swap.receivingData = await swap.receivingData.update(
        {
          expectedAmount: userLockAmount,
        },
        { transaction },
      );
      swap.sendingData = await swap.sendingData.update(
        {
          expectedAmount: serverLockAmount,
        },
        { transaction },
      );

      return swap;
    });

  public static setTransactionClaimPending = async (
    swap: ChainSwapInfo,
    preimage: Buffer,
  ) => {
    swap.chainSwap = await swap.chainSwap.update({
      preimage: getHexString(preimage),
      status: SwapUpdateEvent.TransactionClaimPending,
    });
    return swap;
  };

  public static setClaimMinerFee = async (
    swap: ChainSwapInfo,
    preimage: Buffer,
    minerFee: number,
  ) =>
    Database.sequelize.transaction(async (transaction) => {
      swap.chainSwap = await swap.chainSwap.update(
        {
          status: SwapUpdateEvent.TransactionClaimed,
          preimage: getHexString(preimage),
        },
        { transaction },
      );
      swap.receivingData = await swap.receivingData.update(
        {
          fee: minerFee,
        },
        { transaction },
      );

      return swap;
    });

  private static fetchChainSwapData = async (chainSwap: ChainSwap) => {
    const data = await ChainSwapData.findAll({
      where: {
        swapId: chainSwap.id,
      },
    });
    const { base, quote } = splitPairId(chainSwap.pair);
    const { sending, receiving } = getSendingReceivingCurrency(
      base,
      quote,
      chainSwap.orderSide,
    );

    return new ChainSwapInfo(
      chainSwap,
      data.find((d) => d.symbol === sending)!,
      data.find((d) => d.symbol === receiving)!,
    );
  };
}

export default ChainSwapRepository;
export { ChainSwapInfo, ChainSwapDataTypeInsert, UserLockupTransactionOptions };
