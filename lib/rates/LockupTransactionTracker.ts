import AsyncLock from 'async-lock';
import { Op } from 'sequelize';
import Logger from '../Logger';
import { formatError, getChainCurrency, splitPairId } from '../Utils';
import { IChainClient } from '../chain/ChainClient';
import TypedEventEmitter from '../consts/TypedEventEmitter';
import Swap from '../db/models/Swap';
import PendingLockupTransactionRepository from '../db/repositories/PendingLockupTransactionRepository';
import SwapRepository from '../db/repositories/SwapRepository';
import { Currency } from '../wallet/WalletManager';
import Errors from './Errors';
import RateProvider from './RateProvider';

class LockupTransactionTracker extends TypedEventEmitter<{
  'zeroConf.disabled': string;
}> {
  private readonly lock = new AsyncLock();
  private readonly zeroConfAcceptedMap = new Map<string, boolean>();

  constructor(
    private readonly logger: Logger,
    currencies: Map<string, Currency>,
    private readonly rateProvider: RateProvider,
  ) {
    super();

    for (const currency of currencies.values()) {
      if (currency.chainClient === undefined) {
        continue;
      }

      this.listenToBlocks(currency.chainClient);
      this.zeroConfAcceptedMap.set(currency.chainClient.symbol, true);
    }
  }

  public zeroConfAccepted = (symbol: string): boolean =>
    this.zeroConfAcceptedMap.get(symbol) || false;

  public addPendingTransactionToTrack = async (swap: Swap) => {
    const { base, quote } = splitPairId(swap.pair);
    const chainCurrency = getChainCurrency(base, quote, swap.orderSide, false);

    if (!this.zeroConfAcceptedMap.has(chainCurrency)) {
      throw Errors.SYMBOL_LOCKUPS_NOT_BEING_TRACKED(chainCurrency);
    }

    await PendingLockupTransactionRepository.create(swap.id, chainCurrency);
  };

  private listenToBlocks = (chainClient: IChainClient) => {
    chainClient.on('block', async () => {
      await this.lock.acquire(chainClient.symbol, () =>
        this.checkPendingLockupsForChain(chainClient),
      );
    });
  };

  private checkPendingLockupsForChain = async (chainClient: IChainClient) => {
    const pendingLockups = await PendingLockupTransactionRepository.getForChain(
      chainClient.symbol,
    );
    const swaps = await SwapRepository.getSwaps({
      id: {
        [Op.in]: pendingLockups.map((p) => p.swapId),
      },
    });

    for (const swap of swaps) {
      try {
        const info = await chainClient.getRawTransactionVerbose(
          swap.lockupTransactionId!,
        );
        if (info.confirmations !== undefined && info.confirmations > 0) {
          this.logger.debug(
            `Pending lockup transaction of Submarine Swap ${swap.id} (${swap.lockupTransactionId}) confirmed`,
          );
          await PendingLockupTransactionRepository.destroy(swap.id);
        }
      } catch (e) {
        this.logger.warn(
          `Could not find pending lockup transaction of Submarine Swap ${swap.id} (${swap.lockupTransactionId}): ${formatError(e)}`,
        );
        this.logger.warn(`Disabling 0-conf for ${chainClient.symbol}`);
        this.zeroConfAcceptedMap.set(chainClient.symbol, false);
        await this.rateProvider.setZeroConfAmount(chainClient.symbol, 0);
        this.emit('zeroConf.disabled', chainClient.symbol);
      }
    }
  };
}

export default LockupTransactionTracker;
