import { Op, WhereOptions } from 'sequelize';
import { getSendingReceivingCurrency, splitPairId } from '../../Utils';
import { SwapType, SwapUpdateEvent } from '../../consts/Enums';
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

  get id() {
    return this.chainSwap.id;
  }

  get status() {
    return this.chainSwap.status as SwapUpdateEvent;
  }

  get pair() {
    return this.chainSwap.pair;
  }

  get orderSide() {
    return this.chainSwap.orderSide;
  }

  get fee() {
    return this.chainSwap.fee;
  }

  get timeoutBlockHeight() {
    return this.sendingData.timeoutBlockHeight;
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
    options: WhereOptions,
  ): Promise<ChainSwapInfo[]> => {
    const chainSwaps = await ChainSwap.findAll({ where: options });
    return Promise.all(chainSwaps.map(this.fetchChainSwapData));
  };

  // Get a chain swap to with **both** options applies
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

  // Gets all chain swaps to which **either** of the options apply
  public static getChainSwapsByData = async (
    dataOptions: WhereOptions,
    swapOptions: WhereOptions = {},
  ): Promise<ChainSwapInfo[]> => {
    const matchingData = await ChainSwapData.findAll({
      where: dataOptions,
    });

    const swaps = await Promise.all(
      matchingData.map(
        async (data) => (await this.getChainSwap({ id: data.swapId }))!,
      )!,
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
    vout: number,
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

  public static setClaimMinerFee = async (
    swap: ChainSwapInfo,
    minerFee: number,
  ) =>
    Database.sequelize.transaction(async (transaction) => {
      swap.chainSwap = await swap.chainSwap.update(
        {
          status: SwapUpdateEvent.TransactionClaimed,
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

  public static setSwapStatus = async (
    swap: ChainSwapInfo,
    status: SwapUpdateEvent,
    reason?: string,
  ) => {
    swap.chainSwap = await swap.chainSwap.update({
      status,
      reason,
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
