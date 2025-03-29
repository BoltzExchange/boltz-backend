import { parseTransaction } from '../Core';
import Logger from '../Logger';
import { formatError, getChainCurrency, splitPairId } from '../Utils';
import {
  SwapType,
  SwapUpdateEvent,
  swapTypeToPrettyString,
} from '../consts/Enums';
import { AnySwap } from '../consts/Types';
import Redis from '../db/Redis';
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
import { MapCache, RedisCache, SwapUpdateCache } from './SwapUpdateCache';

class SwapInfos {
  public readonly cache: SwapUpdateCache;

  constructor(
    private readonly logger: Logger,
    private readonly service: Service,
    redis?: Redis,
  ) {
    this.cache = redis !== undefined ? new RedisCache(redis) : new MapCache();

    this.service.eventHandler.on('swap.update', async ({ id, status }) => {
      await this.cache.set(id, status);
    });
  }

  public has = async (id: string): Promise<boolean> =>
    (await this.get(id)) !== undefined;

  public get = async (id: string): Promise<SwapUpdate | undefined> => {
    try {
      const cachedUpdate = await this.cache.get(id);
      if (cachedUpdate !== undefined) {
        return cachedUpdate;
      }
    } catch (e) {
      this.logger.warn(
        `Error getting cached swap update for ${id}: ${formatError(e)}`,
      );
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
    await this.cache.set(id, status);
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

  private handleSubmarineSwapStatus = async (
    swap: Swap,
  ): Promise<SwapUpdate> => {
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

      case SwapUpdateEvent.TransactionMempool:
      case SwapUpdateEvent.TransactionConfirmed:
      case SwapUpdateEvent.TransactionZeroConfRejected: {
        const { base, quote } = splitPairId(swap.pair);
        return this.fetchUserTransaction(
          swap,
          getChainCurrency(base, quote, swap.orderSide, false),
          swap.lockupTransactionId,
        );
      }

      case SwapUpdateEvent.TransactionLockupFailed:
        return {
          status: swap.status as SwapUpdateEvent,
          failureReason: swap.failureReason,
          failureDetails: swap.failureDetails,
        };

      default:
        return this.handleSwapStatusDefault(swap);
    }
  };

  private handleReverseSwapStatus = async (
    swap: ReverseSwap,
  ): Promise<SwapUpdate> => {
    switch (swap.status) {
      case SwapUpdateEvent.TransactionMempool:
      case SwapUpdateEvent.TransactionConfirmed: {
        const { base, quote } = splitPairId(swap.pair);
        return await this.getSwapStatusForServerSentTransaction(
          swap.status,
          getChainCurrency(base, quote, swap.orderSide, true),
          swap.transactionId!,
        );
      }

      default:
        return this.handleSwapStatusDefault(swap);
    }
  };

  private handleChainSwapStatus = async (
    swap: ChainSwapInfo,
  ): Promise<SwapUpdate> => {
    switch (swap.status) {
      case SwapUpdateEvent.TransactionMempool:
      case SwapUpdateEvent.TransactionConfirmed:
      case SwapUpdateEvent.TransactionZeroConfRejected:
        return this.fetchUserTransaction(
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

      case SwapUpdateEvent.TransactionLockupFailed:
        return {
          status: swap.status as SwapUpdateEvent,
          failureReason: swap.failureReason,
          failureDetails: swap.failureDetails,
        };

      default:
        return this.handleSwapStatusDefault(swap);
    }
  };

  private handleSwapStatusDefault = (swap: AnySwap): SwapUpdate => {
    const hasFailureReason = swap.failureReason !== null;

    return {
      status: swap.status as SwapUpdateEvent,
      failureReason: hasFailureReason ? swap.failureReason : undefined,
      failureDetails: hasFailureReason ? swap.failureDetails : undefined,
    };
  };

  private getSwapStatusForServerSentTransaction = async (
    status: SwapUpdateEvent,
    chainCurrency: string,
    transactionId: string,
  ) => {
    try {
      const transactionHex = (
        await this.service.getTransaction(chainCurrency, transactionId!)
      ).hex;
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
      // If the transaction can't be queried with the service, it's either a transaction on the Ethereum network,
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

  private fetchUserTransaction = async (
    swap: Swap | ChainSwapInfo,
    chainCurrency: string,
    transactionId?: string,
  ): Promise<SwapUpdate> => {
    const status =
      swap.status === SwapUpdateEvent.TransactionZeroConfRejected
        ? SwapUpdateEvent.TransactionMempool
        : (swap.status as SwapUpdateEvent);
    const zeroConfRejected =
      swap.status === SwapUpdateEvent.TransactionZeroConfRejected
        ? true
        : undefined;

    if (transactionId !== undefined) {
      try {
        const transactionHex = (
          await this.service.getTransaction(chainCurrency, transactionId)
        ).hex;

        return {
          status,
          zeroConfRejected,
          transaction: EventHandler.formatTransaction(
            parseTransaction(
              getCurrency(this.service.currencies, chainCurrency).type,
              transactionHex,
            ),
          ),
        };
      } catch (e) {
        this.logger.warn(
          `Could not find ${zeroConfRejected ? 'un' : ''}confirmed ${chainCurrency} user lockup transaction of ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}: ${formatError(e)}`,
        );
      }
    }

    return {
      status,
      zeroConfRejected,
    };
  };
}

export default SwapInfos;
