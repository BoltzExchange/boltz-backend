import { Op } from 'sequelize';
import bolt11 from '@boltz/bolt11';
import AsyncLock from 'async-lock';
import Logger from '../Logger';
import Swap from '../db/models/Swap';
import SwapRepository from '../db/SwapRepository';
import { Currency } from '../wallet/WalletManager';
import ChannelCreation from '../db/models/ChannelCreation';
import ChannelCreationRepository from '../db/ChannelCreationRepository';
import { ChannelCreationStatus, ChannelCreationType, SwapUpdateEvent } from '../consts/Enums';
import { formatError, getHexString, getLightningCurrency, reverseBuffer, splitPairId, stringify } from '../Utils';

class ChannelNursery {
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
      outgoingChannelId: number,
    ) => Promise<Boolean>,
    channelsInterval: number,
  ) {
    this.logger.info(`Starting Channel Creation loop at interval: ${channelsInterval} seconds`);
    setInterval(async () => {
      await Promise.all([
        this.retryOpeningChannels(),
        this.settleCreatedChannels(),
      ]);
    }, channelsInterval * 1000);
  }

  public bindCurrency = (currency: Currency) => {
    this.currencies.set(currency.symbol, currency);
  }

  public openChannel = async (currency: Currency, swap: Swap, channelCreation: ChannelCreation) => {
    await this.lock.acquire(ChannelNursery.channelCreationLock, async () => {
      const { satoshis, payeeNodeKey } = bolt11.decode(swap.invoice!, currency.network);
      this.logger.verbose(`Opening channel for Swap ${swap.id} to ${payeeNodeKey}`);

      // TODO: cross chain compatibility
      const channelCapacity = Math.ceil(satoshis! / (1 - (channelCreation.inboundLiquidity / 100)));

      const fee = await currency.chainClient.estimateFee();

      // TODO: handle custom errors (c-lightning plugin)?
      try {
        const { fundingTxidBytes, outputIndex } = await currency.lndClient!.openChannel(payeeNodeKey!, channelCapacity, channelCreation.private, fee);
        const fundingTransactionId = getHexString(reverseBuffer(Buffer.from(fundingTxidBytes as string, 'base64')));

        this.logger.info(`Opened channel for Swap ${swap.id} to ${payeeNodeKey}: ${fundingTransactionId}:${outputIndex}`);

        await this.channelCreationRepository.setFundingTransaction(channelCreation, fundingTransactionId, outputIndex);
      } catch (error) {
        // TODO: emit event?
        this.logger.verbose(`Could not open channel for swap ${swap.id} to ${payeeNodeKey}: ${formatError(error)}`);
      }
    });
  }

  private retryOpeningChannels = async () => {
    const channelsToOpen = await this.channelCreationRepository.getChannelCreations({
      type: {
        [Op.eq]: ChannelCreationType.Create,
      },
      status: {
        // tslint:disable-next-line:no-null-keyword
        [Op.eq]: null,
      },
    });

    for (const channelToOpen of channelsToOpen) {
      const swap = await this.swapRepository.getSwap({
        id: {
          [Op.eq]: channelToOpen.swapId,
        },
      });

      if (swap!.lockupTransactionId === null || swap!.onchainAmount! < swap!.expectedAmount!) {
        continue;
      }

      const lightningCurrency = this.getLightningCurrency(swap!);
      const currency = this.currencies.get(lightningCurrency)!;

      const { payeeNodeKey } = bolt11.decode(swap!.invoice!, currency.network);
      const peers = await currency.lndClient!.listPeers();

      // Only try to open a channel if other side is connected to us
      for (const peer of peers.peersList) {
        if (peer.pubKey === payeeNodeKey) {
          await this.openChannel(currency, swap!, channelToOpen);
          break;
        }
      }
    }
  }

  // TODO: use this logic after startup and switch to "SubscribeChannelEvents" afterwards
  /**
   * Settle Swaps that have created a channel which has become active
   */
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
      });

      const lightningCurrency = this.getLightningCurrency(swap!);

      const currency = this.currencies!.get(lightningCurrency)!;
      const activeChannels = await currency.lndClient!.listChannels(true);

      for (const activeChannel of activeChannels.channelsList) {
        const channelPoint = this.splitChannelPoint(activeChannel.channelPoint);

        if (
          channelPoint.fundingTransactionId === unsettledChannel.fundingTransactionId &&
          channelPoint.fundingTransactionVout === unsettledChannel.fundingTransactionVout
        ) {
          try {
            if (swap!.status  !== SwapUpdateEvent.TransactionClaimed) {
              this.logger.verbose(`Attempting to settle Channel Creation Swap: ${swap!.id}`);
              // TODO: cross chain compatibility
              if (await this.settleSwap(currency, swap!, activeChannel.chanId)) {
                await this.channelCreationRepository.setSettled(unsettledChannel);
              }
            }
          } catch (error) {
            this.logger.warn(`Could not settle Channel Creation Swap: ${formatError(error)}`);
          }

          break;
        }
      }
    }
  }

  private splitChannelPoint = (channelPoint: string) => {
    const split = channelPoint.split(':');

    return {
      fundingTransactionId: split[0],
      fundingTransactionVout: Number(split[1]),
    };
  }

  private getLightningCurrency = (swap: Swap) => {
    const { base, quote } = splitPairId(swap!.pair);
    return getLightningCurrency(base, quote, swap!.orderSide, false);
  }
}

export default ChannelNursery;
