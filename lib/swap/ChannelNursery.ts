import { Op } from 'sequelize';
import bolt11 from '@boltz/bolt11';
import AsyncLock from 'async-lock';
import { EventEmitter } from 'events';
import Logger from '../Logger';
import Swap from '../db/models/Swap';
import { Currency } from '../wallet/WalletManager';
import { ChannelPoint } from '../proto/lnd/rpc_pb';
import ChannelCreation from '../db/models/ChannelCreation';
import ConnectionHelper from '../lightning/ConnectionHelper';
import SwapRepository from '../db/repositories/SwapRepository';
import { ChannelCreationStatus, SwapUpdateEvent } from '../consts/Enums';
import ChannelCreationRepository from '../db/repositories/ChannelCreationRepository';
import {
  formatError,
  splitPairId,
  getHexString,
  reverseBuffer,
  getChainCurrency,
  getLightningCurrency,
} from '../Utils';

interface IChannelNursery {
  on(event: 'channel.created', listener: (swap: Swap, channelCreation: ChannelCreation) => void): this;
  emit(event: 'channel.created', swap: Swap, channelCreation: ChannelCreation): boolean;
}

class ChannelNursery extends EventEmitter implements IChannelNursery {
  private connectionHelper: ConnectionHelper;

  private lock = new AsyncLock();

  private currencies = new Map<string, Currency>();

  // Map between Channel Creation Swap ids and the number of settling retries
  //
  // This map is needed because when the node on the other side of a Channel Creation Swap
  // is c-lightning, there is a bug in LND that causes the "channel.active" event to fire
  // although the channel is still marked as inactive in "listchannels" and cannot be used yet.
  // Therefore we need to retry after a couple seconds in order to settle the Swap.
  private settleRetries = new Map<string, number>();

  private static channelSettleLock = 'channelSettle';
  private static channelCreationLock = 'channelCreation';

  private static lndNotSyncedTimeout = 1000;

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

    this.connectionHelper = new ConnectionHelper(this.logger);
  }

  public init = async (currencies: Currency[]): Promise<void> => {
    currencies.forEach((currency) => {
      this.currencies.set(currency.symbol, currency);

      if (!currency.lndClient) {
        return;
      }

      currency.lndClient.on('peer.online', async (nodePublicKey: string) => {
        await this.lock.acquire(ChannelNursery.channelCreationLock, async () => {
          const channelCreations = await this.channelCreationRepository.getChannelCreations({
            nodePublicKey,
            status: ChannelCreationStatus.Attempted,
          });

          for (const channelCreation of channelCreations) {
            const swap = await this.swapRepository.getSwap({
              id: channelCreation.swapId,
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
          fundingTransactionId,
          status: ChannelCreationStatus.Created,
          fundingTransactionVout: channelPoint.outputIndex,
        });

        if (!channelCreation) {
          return;
        }

        const swap = await this.swapRepository.getSwap({
          id: channelCreation.swapId,
          status: {
            [Op.not]: SwapUpdateEvent.TransactionClaimed,
          },
        });

        if (swap!.status === SwapUpdateEvent.SwapExpired) {
          await this.channelCreationRepository.setAbandoned(channelCreation);
          return;
        }

        await this.settleChannelWrapper(swap!, channelCreation);
      });
    });

    await Promise.all([
      this.retryOpeningChannels(),
      this.settleCreatedChannels(),
    ]);
  };

  // TODO: show and reject less than min channel size
  // TODO: handle errors that say that the max number of (pending) channels exceeded
  public openChannel = async (lightningCurrency: Currency, swap: Swap, channelCreation: ChannelCreation): Promise<void> => {
    const { satoshis, payeeNodeKey } = bolt11.decode(swap.invoice!, lightningCurrency.network);
    this.logger.verbose(`Opening channel for Swap ${swap.id} to ${payeeNodeKey}`);

    if (channelCreation.status !== ChannelCreationStatus.Attempted) {
      await this.channelCreationRepository.setAttempted(channelCreation);
    }

    const channelCapacity = Math.ceil(satoshis! / (1 - (channelCreation.inboundLiquidity / 100)));

    const feePerVbyte = await lightningCurrency.chainClient!.estimateFee();

    // TODO: handle custom errors (c-lightning plugin)?
    try {
      const { fundingTxidBytes, outputIndex } = await lightningCurrency.lndClient!.routerClient.openChannel(
        payeeNodeKey!,
        channelCapacity,
        channelCreation.private,
        feePerVbyte,
      );
      const fundingTransactionId = this.parseFundingTransactionId(fundingTxidBytes);

      this.logger.info(`Opened channel for Swap ${swap.id} to ${payeeNodeKey}: ${fundingTransactionId}:${outputIndex}`);

      await this.swapRepository.setSwapStatus(swap, SwapUpdateEvent.ChannelCreated);

      this.emit(
        'channel.created',
        swap,
        await this.channelCreationRepository.setFundingTransaction(channelCreation, fundingTransactionId, outputIndex),
      );
    } catch (error) {
      // TODO: emit event?
      const formattedError = formatError(error);

      const retryChannelOpeningAfterTimeout = async () => {
        this.logger.debug(`Retrying in ${ChannelNursery.lndNotSyncedTimeout}ms`);

        // Let's just wait for a second and try again
        await new Promise((resolve) => {
          setTimeout(resolve, ChannelNursery.lndNotSyncedTimeout);
        });

        await this.openChannel(lightningCurrency, swap, channelCreation);
      };

      // The actual error looks like this: "2 UNKNOWN: received funding error from <remote_pukbey>: chan_id=<prposed_channel_id>, err=Synchronizing blockchain"
      // But since we don't know what the "chan_id" would have been, we cannot catch this error in the switch statement
      if (formattedError.endsWith('err=Synchronizing blockchain')) {
        this.logger.warn(`Could not open channel for Swap ${swap.id}: remote LND is not fully synced`);
        await retryChannelOpeningAfterTimeout();
        return;
      }

      switch (formattedError) {
        // This error is thrown when a block is mined with a lockup transaction that triggers a Channel Creation
        // in it. In case Boltz processes the block faster than LND does, it will try to open the channel while
        // LND is still syncing the freshly mined block
        case '2 UNKNOWN: channels cannot be created before the wallet is fully synced':
          this.logger.warn(`Could not open channel for Swap ${swap.id}: our LND is not fully synced`);
          await retryChannelOpeningAfterTimeout();
          return;

        // In case the lightning client to which a channel should be opened is not online or not connected to us,
        // we can try to connect to them
        case `2 UNKNOWN: peer ${payeeNodeKey} is not online`:
          try {
            await this.connectionHelper.connectByPublicKey(lightningCurrency.lndClient!, payeeNodeKey!);
            // The channel opening should *not* be retried here since the "peer.online" subscription of the LND client does handle it already
            return;
          } catch (error) {
            this.logger.warn(`Could not connect to ${lightningCurrency.lndClient!.symbol} LND node ${payeeNodeKey!}: ${formatError(error)}`);
          }
          break;
      }

      this.logger.verbose(`Could not open channel for Swap ${swap.id} to ${payeeNodeKey}: ${formattedError}`);
    }
  };

  private retryOpeningChannels = async () => {
    await this.lock.acquire(ChannelNursery.channelCreationLock, async () => {
      const channelsToOpen = await this.channelCreationRepository.getChannelCreations({
        status: ChannelCreationStatus.Attempted,
      });

      for (const channelToOpen of channelsToOpen) {
        const swap = await this.swapRepository.getSwap({
          id: channelToOpen.swapId,
          status: {
            [Op.not]: SwapUpdateEvent.SwapExpired,
          },
        });

        if (!swap || !this.eligibleForChannel(swap!)) {
          continue;
        }

        const lightningCurrency = this.getCurrency(swap!, true);
        const currency = this.currencies.get(lightningCurrency)!;

        const peers = await currency.lndClient!.routerClient.listPeers();

        // Only try to open a channel if other side is connected to us
        for (const peer of peers.peersList) {
          if (peer.pubKey === channelToOpen.nodePublicKey) {
            await this.openChannel(currency, swap!, channelToOpen);
            break;
          }
        }
      }
    });
  };

  private settleChannel = async (swap: Swap, channelCreation: ChannelCreation): Promise<boolean> => {
    const chainCurrency = this.currencies.get(this.getCurrency(swap!, false))!;
    const lightningCurrency = this.currencies.get(this.getCurrency(swap!, true))!;

    const activeChannels = await lightningCurrency.lndClient!.routerClient.listChannels(true);

    for (const channel of activeChannels.channelsList) {
      const channelPoint = this.splitChannelPoint(channel.channelPoint);

      if (
        channelPoint.id === channelCreation.fundingTransactionId &&
        channelPoint.vout === channelCreation.fundingTransactionVout
      ) {
        this.logger.verbose(`Attempting to settle Channel Creation Swap: ${swap!.id}`);

        try {
          await this.settleSwap(chainCurrency, swap!, channel.chanId);
          await this.channelCreationRepository.setSettled(channelCreation);
          return true;
        } catch (error) {
          const formattedError = formatError(error);
          if (formattedError === 'could not pay invoice: invoice is already paid') {
            this.logger.verbose(`Channel Creation Swap ${swap.id} already settled`);
            await this.channelCreationRepository.setSettled(channelCreation);

            return true;
          } else {
            this.logger.warn(`Could not settle Channel Creation Swap ${swap.id}: ${formattedError}`);
          }
        }
      }
    }

    this.logger.verbose(`Could not settle Channel Creation Swap ${swap.id}: channel is not active`);

    return false;
  };

  private settleChannelWrapper = async (swap: Swap, channelCreation: ChannelCreation, timeoutAmplifier = 1000) => {
    const settleSuccessful = await this.settleChannel(swap, channelCreation);

    if (settleSuccessful) {
      this.settleRetries.delete(swap.id);
    } else {
      let settleTimeout = this.settleRetries.get(swap.id);

      if (!settleTimeout) {
        settleTimeout = 1;
      } else {
        settleTimeout = settleTimeout * 2;
      }

      if (settleTimeout < 8) {
        this.settleRetries.set(swap.id, settleTimeout);

        this.logger.info(`Retrying to settle Channel Creation Swap ${swap.id} in ${settleTimeout} seconds`);

        setTimeout(async () => {
          await this.lock.acquire(ChannelNursery.channelSettleLock, async () => {
            await this.settleChannelWrapper(swap, channelCreation, timeoutAmplifier);
          });
        }, settleTimeout * timeoutAmplifier);
      } else {
        this.logger.warn(`Giving up to retry loop to settle Channel Creation Swap ${swap.id}`);
        this.settleRetries.delete(swap.id);
      }
    }
  };

  private settleCreatedChannels = async () => {
    const unsettledChannels = await this.channelCreationRepository.getChannelCreations({
      status: ChannelCreationStatus.Created,
    });

    for (const unsettledChannel of unsettledChannels) {
      const swap = await this.swapRepository.getSwap({
        id: unsettledChannel.swapId,
        status: {
          [Op.not]: SwapUpdateEvent.TransactionClaimed,
        },
      });

      await this.settleChannel(swap!, unsettledChannel);
    }
  };

  private eligibleForChannel = (swap: Swap) => {
    return swap.lockupTransactionId !== null && swap.onchainAmount! >= swap.expectedAmount!;
  };

  private parseFundingTransactionId = (fundingTransactionIdBytes: Uint8Array | string) => {
    return getHexString(reverseBuffer(Buffer.from(fundingTransactionIdBytes as string, 'base64')));
  };

  private splitChannelPoint = (channelPoint: string) => {
    const split = channelPoint.split(':');

    return {
      id: split[0],
      vout: Number(split[1]),
    };
  };

  private getCurrency = (swap: Swap, lightning: boolean) => {
    const { base, quote } = splitPairId(swap.pair);
    return lightning ? getLightningCurrency(base, quote, swap.orderSide, false) : getChainCurrency(base, quote, swap.orderSide, false);
  };
}

export default ChannelNursery;
