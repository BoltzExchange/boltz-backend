import { parseTransaction } from '../Core';
import Logger from '../Logger';
import { getChainCurrency, splitPairId } from '../Utils';
import { SwapUpdateEvent } from '../consts/Enums';
import ChainSwapRepository from '../db/repositories/ChainSwapRepository';
import ChannelCreationRepository from '../db/repositories/ChannelCreationRepository';
import ReverseSwapRepository from '../db/repositories/ReverseSwapRepository';
import SwapRepository from '../db/repositories/SwapRepository';
import ServiceErrors from '../service/Errors';
import EventHandler, { SwapUpdate } from '../service/EventHandler';
import Service from '../service/Service';
import { getCurrency } from '../service/Utils';
import SwapNursery from '../swap/SwapNursery';

// TODO: refactor

class SwapInfos {
  private readonly pendingSwapInfos = new Map<string, SwapUpdate>();

  constructor(
    private readonly logger: Logger,
    private readonly service: Service,
  ) {}

  public init = async () => {
    this.logger.verbose('Fetching swaps status from database');
    await Promise.all([
      this.fetchSwaps(),
      this.fetchReverse(),
      this.fetchChainSwaps(),
    ]);
  };

  public has = (id: string) => this.pendingSwapInfos.has(id);

  public get = (id: string) => this.pendingSwapInfos.get(id);

  public set = (id: string, status: SwapUpdate) =>
    this.pendingSwapInfos.set(id, status);

  private fetchSwaps = async () => {
    for (const swap of await SwapRepository.getSwaps()) {
      switch (swap.status) {
        case SwapUpdateEvent.ChannelCreated: {
          const channelCreation =
            await ChannelCreationRepository.getChannelCreation({
              swapId: swap.id,
            });

          this.pendingSwapInfos.set(swap.id, {
            status: swap.status,
            channel: {
              fundingTransactionId: channelCreation!.fundingTransactionId!,
              fundingTransactionVout: channelCreation!.fundingTransactionVout!,
            },
          });

          break;
        }

        case SwapUpdateEvent.TransactionZeroConfRejected: {
          const { base, quote } = splitPairId(swap.pair);
          const chainCurrency = getChainCurrency(
            base,
            quote,
            swap.orderSide,
            false,
          );
          const transactionHex = await this.service.getTransaction(
            chainCurrency,
            swap.lockupTransactionId!,
          );
          this.pendingSwapInfos.set(swap.id, {
            status: SwapUpdateEvent.TransactionMempool,
            zeroConfRejected: true,
            transaction: EventHandler.formatTransaction(
              parseTransaction(
                getCurrency(this.service.currencies, chainCurrency).type,
                transactionHex,
              ),
            ),
          });
          break;
        }

        default:
          this.pendingSwapInfos.set(swap.id, {
            status: swap.status as SwapUpdateEvent,
            failureReason:
              swap.failureReason !== null ? swap.failureReason : undefined,
          });
          break;
      }
    }
  };

  private fetchReverse = async () => {
    for (const swap of await ReverseSwapRepository.getReverseSwaps()) {
      switch (swap.status) {
        case SwapUpdateEvent.TransactionMempool:
        case SwapUpdateEvent.TransactionConfirmed: {
          const { base, quote } = splitPairId(swap.pair);
          const chainCurrency = getChainCurrency(
            base,
            quote,
            swap.orderSide,
            true,
          );

          this.pendingSwapInfos.set(
            swap.id,
            await this.getSwapStatusForServerSentTransaction(
              swap.status,
              chainCurrency,
              swap.transactionId!,
            ),
          );

          break;
        }

        default:
          this.pendingSwapInfos.set(swap.id, {
            status: swap.status as SwapUpdateEvent,
            failureReason:
              swap.failureReason !== null ? swap.failureReason : undefined,
          });
          break;
      }
    }
  };

  private fetchChainSwaps = async () => {
    for (const swap of await ChainSwapRepository.getChainSwaps()) {
      switch (swap.status) {
        case SwapUpdateEvent.TransactionZeroConfRejected: {
          const transactionHex = await this.service.getTransaction(
            swap.receivingData.symbol,
            swap.receivingData.transactionId!,
          );
          this.pendingSwapInfos.set(swap.id, {
            status: SwapUpdateEvent.TransactionMempool,
            zeroConfRejected: true,
            transaction: EventHandler.formatTransaction(
              parseTransaction(
                getCurrency(this.service.currencies, swap.receivingData.symbol)
                  .type,
                transactionHex,
              ),
            ),
          });
          break;
        }

        case SwapUpdateEvent.TransactionServerMempool:
        case SwapUpdateEvent.TransactionServerConfirmed:
          this.pendingSwapInfos.set(
            swap.id,
            await this.getSwapStatusForServerSentTransaction(
              swap.status,
              swap.sendingData.symbol,
              swap.sendingData.transactionId!,
            ),
          );
          break;

        default:
          this.pendingSwapInfos.set(swap.id, {
            status: swap.status as SwapUpdateEvent,
            failureReason:
              swap.failureReason !== null ? swap.failureReason : undefined,
          });
          break;
      }
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
}

export default SwapInfos;
