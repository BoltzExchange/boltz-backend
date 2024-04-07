import { Op, WhereOptions } from 'sequelize';
import {
  getHexString,
  getSendingReceivingCurrency,
  splitPairId,
} from '../../Utils';
import {
  NotPendingChainSwapEvents,
  SwapType,
  SwapUpdateEvent,
  SwapVersion,
} from '../../consts/Enums';
import Database from '../Database';
import ChainSwap, { ChainSwapType } from '../models/ChainSwap';
import ChainSwapData, { ChainSwapDataType } from '../models/ChainSwapData';

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

  get preimageHash() {
    return this.chainSwap.preimageHash;
  }

  get fee() {
    return this.chainSwap.fee;
  }

  get paidMinerFees(): boolean {
    return (
      this.sendingData.fee !== undefined || this.receivingData.fee !== undefined
    );
  }
}

class ChainSwapRepository {
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
  ): Promise<ChainSwapInfo[]> => {
    const chainSwaps = await ChainSwap.findAll({ where: options });
    return Promise.all(chainSwaps.map(this.fetchChainSwapData));
  };

  /**
   * Get a chain swap to with **both** options applies
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
   * Gets all chain swaps to which **either** of the options apply
   */
  public static getChainSwapsByData = async (
    dataOptions: WhereOptions,
    swapOptions: WhereOptions,
  ): Promise<ChainSwapInfo[]> => {
    const matchingData = await ChainSwapData.findAll({
      where: dataOptions,
    });

    const swaps = await Promise.all(
      Array.from(
        new Set<string>(matchingData.map((d) => d.swapId)).values(),
      ).map(async (id) => (await this.getChainSwap({ id: id }))!)!,
    );

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
        [Op.notIn]: NotPendingChainSwapEvents,
      },
    });

    return swaps.filter((s) => symbols.includes(s.sendingData.symbol));
  };

  public static addChainSwap = (args: {
    chainSwap: ChainSwapType;
    sendingData: ChainSwapDataType;
    receivingData: ChainSwapDataType;
  }) =>
    Database.sequelize.transaction(async (transaction) => {
      await ChainSwap.create(args.chainSwap, { transaction });

      await Promise.all([
        ChainSwapData.create(args.sendingData, { transaction }),
        ChainSwapData.create(args.receivingData, { transaction }),
      ]);
    });

  public static setUserLockupTransaction = (
    swap: ChainSwapInfo,
    lockupTransactionId: string,
    onchainAmount: number,
    confirmed: boolean,
    lockupTransactionVout?: number,
  ): Promise<ChainSwapInfo> =>
    Database.sequelize.transaction(async (transaction) => {
      swap.chainSwap = await swap.chainSwap.update(
        {
          status: confirmed
            ? SwapUpdateEvent.TransactionConfirmed
            : SwapUpdateEvent.TransactionMempool,
        },
        { transaction },
      );
      swap.receivingData = await swap.receivingData.update(
        {
          amount: onchainAmount,
          transactionId: lockupTransactionId,
          transactionVout: lockupTransactionVout,
        },
        { transaction },
      );

      return swap;
    });

  public static setServerLockupTransaction = async (
    swap: ChainSwapInfo,
    transactionId: string,
    onchainAmount: number,
    fee: number,
    vout?: number,
  ): Promise<ChainSwapInfo> =>
    Database.sequelize.transaction(async (transaction) => {
      swap.chainSwap = await swap.chainSwap.update(
        {
          status: SwapUpdateEvent.TransactionServerMempool,
        },
        { transaction },
      );
      swap.sendingData = await swap.sendingData.update(
        {
          transactionId,
          fee,
          transactionVout: vout,
          amount: onchainAmount,
        },
        { transaction },
      );

      return swap;
    });

  public static setPreimage = async (swap: ChainSwapInfo, preimage: Buffer) => {
    swap.chainSwap = await swap.chainSwap.update({
      preimage: getHexString(preimage),
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

  public static setTransactionRefunded = (
    swap: ChainSwapInfo,
    minerFee: number,
    failureReason: string,
  ): Promise<ChainSwapInfo> =>
    Database.sequelize.transaction(async (transaction) => {
      swap.chainSwap = await swap.chainSwap.update(
        {
          failureReason,
          status: SwapUpdateEvent.TransactionRefunded,
        },
        { transaction },
      );
      swap.sendingData = await swap.receivingData.update(
        {
          fee: swap.sendingData.fee! + minerFee,
        },
        { transaction },
      );

      return swap;
    });

  public static setSwapStatus = async (
    swap: ChainSwapInfo,
    status: SwapUpdateEvent,
    reason?: string,
  ) => {
    swap.chainSwap = await swap.chainSwap.update({
      status,
      failureReason: reason,
    });
    return swap;
  };

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
export { ChainSwapInfo };
