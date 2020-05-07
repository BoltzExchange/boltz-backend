import { Op } from 'sequelize';
import bolt11 from '@boltz/bolt11';
import AsyncLock from 'async-lock';
import { EventEmitter } from 'events';
import Logger from '../Logger';
import Swap from '../db/models/Swap';
import { ChannelPoint } from '../proto/lndrpc_pb';
import SwapRepository from '../db/SwapRepository';
import { Currency } from '../wallet/WalletManager';
import ChannelCreation from '../db/models/ChannelCreation';
import ChannelCreationRepository from '../db/ChannelCreationRepository';
import { ChannelCreationStatus, SwapUpdateEvent } from '../consts/Enums';
import { formatError, getChainCurrency, getHexString, getLightningCurrency, reverseBuffer, splitPairId } from '../Utils';

interface ChannelNursery {
  on(event: 'channel.created', listener: (swap: Swap) => void): this;
  emit(event: 'channel.created', swap: Swap): boolean;
}

class ChannelNursery extends EventEmitter {
  private lock = new AsyncLock();

  private currencies = new Map<string, Currency>();

  private static channelCreationLock = 'channelCreation';

  constructor(
    private logger: Logger,
    private swapRepository: SwapRepository,
    private channelCreationRepository: ChannelCreationRepository,
    private settleSwap: (
      currency: Currency,
      swap: Swap,
      outgoingChannelId: string,
    ) => Promise<void>,
  ) {
    super();
  }

  public init = async (currencies: Currency[]) => {
    currencies.forEach((currency) => {
      this.currencies.set(currency.symbol, currency);

      if (!currency.lndClient) {
        return;
      }

      currency.lndClient.on('peer.online', async (nodePublicKey: string) => {
        await this.lock.acquire(ChannelNursery.channelCreationLock, async () => {
          const channelCreations = await this.channelCreationRepository.getChannelCreations({
            status: {
              [Op.eq]: ChannelCreationStatus.Attempted,
            },
            nodePublicKey: {
              [Op.eq]: nodePublicKey,
            },
          });

          for (const channelCreation of channelCreations) {
            const swap = await this.swapRepository.getSwap({
              id: {
                [Op.eq]: channelCreation.swapId,
              },
              status: {
                [Op.not]: SwapUpdateEvent.SwapExpired,
              },
            });

            if (!swap || !this.eligibleForChannel(swap!)) {
              continue;
            }

            const lightningCurrency = this.getCurrency(swap!, true);
            await this.openChannel(this.currencies.get(lightningCurrency)!, swap!, channelCreation);
          }
        });
      });

      currency.lndClient.on('channel.active', async (channelPoint: ChannelPoint.AsObject) => {
        const fundingTransactionId = this.parseFundingTransactionId(channelPoint.fundingTxidBytes);

        const channelCreation = await this.channelCreationRepository.getChannelCreation({
          status: {
            [Op.eq]: ChannelCreationStatus.Created,
          },
          fundingTransactionId: {
            [Op.eq]: fundingTransactionId,
          },
          fundingTransactionVout: {
            [Op.eq]: channelPoint.outputIndex,
          },
        });

        if (!channelCreation) {
          return;
        }

        const swap = await this.swapRepository.getSwap({
          id: {
            [Op.eq]: channelCreation.swapId,
          },
          status: {
            [Op.not]: SwapUpdateEvent.TransactionClaimed,
          },
        });

        if (swap!.status === SwapUpdateEvent.SwapExpired) {
          await this.channelCreationRepository.setAbandoned(channelCreation);
          return;
        }

        await this.settleChannel(swap!, channelCreation);
      });
    });

    await Promise.all([
      this.retryOpeningChannels(),
      this.settleCreatedChannels(),
    ]);
  }

  // TODO: handle errors that say that the max number of (pending) channels exceeded
  public openChannel = async (lightningCurrency: Currency, swap: Swap, channelCreation: ChannelCreation) => {
    const { satoshis, payeeNodeKey } = bolt11.decode(swap.invoice!, lightningCurrency.network);
    this.logger.verbose(`Opening channel for Swap ${swap.id} to ${payeeNodeKey}`);

    if (channelCreation.status !== ChannelCreationStatus.Attempted) {
      await this.channelCreationRepository.setAttempted(channelCreation);
    }

    // TODO: cross chain compatibility
    const channelCapacity = Math.ceil(satoshis! / (1 - (channelCreation.inboundLiquidity / 100)));

    const fee = await lightningCurrency.chainClient.estimateFee();

    // TODO: handle custom errors (c-lightning plugin)?
    try {
      const { fundingTxidBytes, outputIndex } = await lightningCurrency.lndClient!.openChannel(
        payeeNodeKey!,
        channelCapacity,
        channelCreation.private,
        fee,
      );
      const fundingTransactionId = this.parseFundingTransactionId(fundingTxidBytes);

      this.logger.info(`Opened channel for Swap ${swap.id} to ${payeeNodeKey}: ${fundingTransactionId}:${outputIndex}`);
      await this.channelCreationRepository.setFundingTransaction(channelCreation, fundingTransactionId, outputIndex);

      this.emit('channel.created', swap);
    } catch (error) {
      // TODO: emit event?
      this.logger.verbose(`Could not open channel for swap ${swap.id} to ${payeeNodeKey}: ${formatError(error)}`);
    }
  }

  private retryOpeningChannels = async () => {
    await this.lock.acquire(ChannelNursery.channelCreationLock, async () => {
      const channelsToOpen = await this.channelCreationRepository.getChannelCreations({
        status: {
          [Op.eq]: ChannelCreationStatus.Attempted,
        },
      });

      for (const channelToOpen of channelsToOpen) {
        const swap = await this.swapRepository.getSwap({
          id: {
            [Op.eq]: channelToOpen.swapId,
          },
        });

        if (!swap || !this.eligibleForChannel(swap!)) {
          continue;
        }

        const lightningCurrency = this.getCurrency(swap!, true);
        const currency = this.currencies.get(lightningCurrency)!;

        const peers = await currency.lndClient!.listPeers();

        // Only try to open a channel if other side is connected to us
        for (const peer of peers.peersList) {
          if (peer.pubKey === channelToOpen.nodePublicKey) {
            await this.openChannel(currency, swap!, channelToOpen);
            break;
          }
        }
      }
    });
  }

  private settleChannel = async (
    swap: Swap,
    channelCreation: ChannelCreation,
  ) => {
    const chainCurrency = this.currencies.get(this.getCurrency(swap!, false))!;
    const lightningCurrency = this.currencies.get(this.getCurrency(swap!, true))!;

    const activeChannels = await lightningCurrency.lndClient!.listChannels(true);

    for (const channel of activeChannels.channelsList) {
      const channelPoint = this.splitChannelPoint(channel.channelPoint);

      if (
        channelPoint.fundingTransactionId === channelCreation.fundingTransactionId &&
        channelPoint.fundingTransactionVout === channelCreation.fundingTransactionVout
      ) {
        this.logger.verbose(`Attempting to settle Channel Creation Swap: ${swap!.id}`);

        try {
          await this.settleSwap(chainCurrency, swap!, channel.chanId);
          await this.channelCreationRepository.setSettled(channelCreation);
        } catch (error) {
          this.logger.warn(`Could not settle Channel Creation Swap: ${formatError(error)}`);
        }

        break;
      }
    }
  }

  private settleCreatedChannels = async () => {
    const unsettledChannels = await this.channelCreationRepository.getChannelCreations({
      status: {
        [Op.eq]: ChannelCreationStatus.Created,
      },
    });

    for (const unsettledChannel of unsettledChannels) {
      const swap = await this.swapRepository.getSwap({
        id: {
          [Op.eq]: unsettledChannel.swapId,
        },
        status: {
          [Op.not]: SwapUpdateEvent.TransactionClaimed,
        },
      });

      await this.settleChannel(swap!, unsettledChannel);
    }
  }

  private eligibleForChannel = (swap: Swap) => {
    return swap.lockupTransactionId !== null && swap.onchainAmount! >= swap.expectedAmount!;
  }

  private parseFundingTransactionId = (fundingTransactionIddBytes: Uint8Array | string) => {
    return getHexString(reverseBuffer(Buffer.from(fundingTransactionIddBytes as string, 'base64')));
  }

  private splitChannelPoint = (channelPoint: string) => {
    const split = channelPoint.split(':');

    return {
      fundingTransactionId: split[0],
      fundingTransactionVout: Number(split[1]),
    };
  }

  private getCurrency = (swap: Swap, lightning: boolean) => {
    const { base, quote } = splitPairId(swap.pair);
    return lightning ? getLightningCurrency(base, quote, swap.orderSide, false) : getChainCurrency(base, quote, swap.orderSide, false);
  }
}

export default ChannelNursery;
