import { parseTransaction } from '../Core';
import Logger from '../Logger';
import { formatError, getChainCurrency, splitPairId } from '../Utils';
import {
  SwapType,
  SwapUpdateEvent,
  swapTypeToPrettyString,
} from '../consts/Enums';
import { AnySwap } from '../consts/Types';
import ReverseSwap from '../db/models/ReverseSwap';
import Swap from '../db/models/Swap';
import ChainSwapRepository, {
  ChainSwapInfo,
} from '../db/repositories/ChainSwapRepository';
import ChannelCreationRepository from '../db/repositories/ChannelCreationRepository';
import ReverseSwapRepository from '../db/repositories/ReverseSwapRepository';
import SwapRepository from '../db/repositories/SwapRepository';
import ServiceErrors from '../service/Errors';
import EventHandler, { SwapUpdate } from '../service/EventHandler';
import Service from '../service/Service';
import { getCurrency } from '../service/Utils';
import SwapNursery from '../swap/SwapNursery';

class SwapInfos {
  private readonly cachedSwapInfos = new Map<string, SwapUpdate>();

  constructor(
    private readonly logger: Logger,
    private readonly service: Service,
  ) {}

  public get cacheSize() {
    return this.cachedSwapInfos.size;
  }

  public set = (id: string, status: SwapUpdate) =>
    this.cachedSwapInfos.set(id, status);

  public has = async (id: string): Promise<boolean> =>
    (await this.get(id)) !== undefined;

  public get = async (id: string): Promise<SwapUpdate | undefined> => {
    const cachedUpdate = this.cachedSwapInfos.get(id);
    if (cachedUpdate !== undefined) {
      return cachedUpdate;
    }

    const fetchedSwaps = await Promise.all([
      SwapRepository.getSwap({
        id,
      }),
      ReverseSwapRepository.getReverseSwap({ id }),
      ChainSwapRepository.getChainSwap({
        id,
      }),
    ]);
    const swap = fetchedSwaps.find((s): s is AnySwap => s !== null);
    if (swap === undefined) {
      return undefined;
    }

    const status = await this.handleSwapStatus(swap);
    this.cachedSwapInfos.set(id, status);
    return status;
  };

  private handleSwapStatus = (swap: AnySwap): Promise<SwapUpdate> => {
    switch (swap.type) {
      case SwapType.Submarine:
        return this.handleSubmarineSwapStatus(swap as Swap);

      case SwapType.ReverseSubmarine:
        return this.handleReverseSwapStatus(swap as ReverseSwap);

      case SwapType.Chain:
        return this.handleChainSwapStatus(swap as ChainSwapInfo);
    }
  };

  private handleSubmarineSwapStatus = async (swap: Swap) => {
    switch (swap.status) {
      case SwapUpdateEvent.ChannelCreated: {
        const channelCreation =
          await ChannelCreationRepository.getChannelCreation({
            swapId: swap.id,
          });

        return {
          status: swap.status,
          channel: {
            fundingTransactionId: channelCreation!.fundingTransactionId!,
            fundingTransactionVout: channelCreation!.fundingTransactionVout!,
          },
        };
      }

      case SwapUpdateEvent.TransactionZeroConfRejected: {
        const { base, quote } = splitPairId(swap.pair);
        return this.fetchUnconfirmedUserTransaction(
          swap,
          getChainCurrency(base, quote, swap.orderSide, false),
          swap.lockupTransactionId,
        );
      }

      default:
        return {
          status: swap.status as SwapUpdateEvent,
          failureReason:
            swap.failureReason !== null ? swap.failureReason : undefined,
        };
    }
  };

  private handleReverseSwapStatus = async (swap: ReverseSwap) => {
    switch (swap.status) {
      case SwapUpdateEvent.TransactionMempool:
      case SwapUpdateEvent.TransactionConfirmed: {
        const { base, quote } = splitPairId(swap.pair);
        return this.getSwapStatusForServerSentTransaction(
          swap.status,
          getChainCurrency(base, quote, swap.orderSide, true),
          swap.transactionId!,
        );
      }

      default:
        return {
          status: swap.status as SwapUpdateEvent,
          failureReason:
            swap.failureReason !== null ? swap.failureReason : undefined,
        };
    }
  };

  private handleChainSwapStatus = async (swap: ChainSwapInfo) => {
    switch (swap.status) {
      case SwapUpdateEvent.TransactionZeroConfRejected:
        return this.fetchUnconfirmedUserTransaction(
          swap,
          swap.receivingData.symbol,
          swap.receivingData.transactionId,
        );

      case SwapUpdateEvent.TransactionServerMempool:
      case SwapUpdateEvent.TransactionServerConfirmed:
        return this.getSwapStatusForServerSentTransaction(
          swap.status,
          swap.sendingData.symbol,
          swap.sendingData.transactionId!,
        );

      default:
        return {
          status: swap.status as SwapUpdateEvent,
          failureReason:
            swap.failureReason !== null ? swap.failureReason : undefined,
        };
    }
  };

  private getSwapStatusForServerSentTransaction = async (
    status: SwapUpdateEvent,
    chainCurrency: string,
    transactionId: string,
  ) => {
    try {
      const transactionHex = await this.service.getTransaction(
        chainCurrency,
        transactionId!,
      );
      return {
        status,
        transaction: {
          id: transactionId,
          hex: transactionHex,
          eta:
            status === SwapUpdateEvent.TransactionMempool ||
            status === SwapUpdateEvent.TransactionServerMempool
              ? SwapNursery.reverseSwapMempoolEta
              : undefined,
        },
      };
    } catch (error) {
      // If the transaction can't be queried with the service it's either a transaction on the Ethereum network,
      // or something is terribly wrong
      if (
        (error as any).message !==
        ServiceErrors.NOT_SUPPORTED_BY_SYMBOL(chainCurrency).message
      ) {
        throw error;
      }
    }

    return {
      status: status,
      transaction: {
        id: transactionId,
      },
    };
  };

  private fetchUnconfirmedUserTransaction = async (
    swap: Swap | ChainSwapInfo,
    chainCurrency: string,
    transactionId?: string,
  ) => {
    if (transactionId !== undefined) {
      try {
        const transactionHex = await this.service.getTransaction(
          chainCurrency,
          transactionId,
        );

        return {
          status: SwapUpdateEvent.TransactionMempool,
          zeroConfRejected: true,
          transaction: EventHandler.formatTransaction(
            parseTransaction(
              getCurrency(this.service.currencies, chainCurrency).type,
              transactionHex,
            ),
          ),
        };
      } catch (e) {
        this.logger.warn(
          `Could not find unconfirmed ${chainCurrency} user lockup transaction of ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}: ${formatError(e)}`,
        );
      }
    }

    return {
      status: SwapUpdateEvent.TransactionMempool,
      zeroConfRejected: true,
    };
  };
}

export default SwapInfos;
