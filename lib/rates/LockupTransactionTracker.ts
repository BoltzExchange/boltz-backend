import AsyncLock from 'async-lock';
import { Op } from 'sequelize';
import Logger from '../Logger';
import {
  formatError,
  getChainCurrency,
  getReceivingChain,
  isTxConfirmed,
  splitPairId,
} from '../Utils';
import { IChainClient } from '../chain/ChainClient';
import { SwapType, swapTypeToPrettyString } from '../consts/Enums';
import TypedEventEmitter from '../consts/TypedEventEmitter';
import Swap from '../db/models/Swap';
import ChainSwapRepository, {
  ChainSwapInfo,
} from '../db/repositories/ChainSwapRepository';
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

  public addPendingTransactionToTrack = async (swap: Swap | ChainSwapInfo) => {
    const { base, quote } = splitPairId(swap.pair);
    const chainCurrency =
      swap.type === SwapType.Submarine
        ? getChainCurrency(base, quote, swap.orderSide, false)
        : getReceivingChain(base, quote, swap.orderSide);

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
    const swaps = await Promise.all([
      SwapRepository.getSwaps({
        id: {
          [Op.in]: pendingLockups.map((p) => p.swapId),
        },
      }),
      ChainSwapRepository.getChainSwaps({
        id: {
          [Op.in]: pendingLockups.map((p) => p.swapId),
        },
      }),
    ]);

    for (const swap of swaps.flat()) {
      const transactionId =
        swap.type === SwapType.Submarine
          ? (swap as Swap).lockupTransactionId!
          : (swap as ChainSwapInfo).receivingData.transactionId!;

      try {
        const info = await chainClient.getRawTransactionVerbose(transactionId);
        if (isTxConfirmed(info)) {
          this.logger.debug(
            `Pending lockup transaction of ${swapTypeToPrettyString(swap.type)} Swap ${swap.id} (${transactionId}) confirmed`,
          );
          await PendingLockupTransactionRepository.destroy(swap.id);
        }
      } catch (e) {
        this.logger.warn(
          `Could not find pending lockup transaction of ${swapTypeToPrettyString(swap.type)} Swap ${swap.id} (${transactionId}): ${formatError(e)}`,
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
