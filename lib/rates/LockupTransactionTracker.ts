import AsyncLock from 'async-lock';
import { Op } from 'sequelize';
import type { ConfigType } from '../Config';
import type Logger from '../Logger';
import {
  bigIntMax,
  formatError,
  getChainCurrency,
  getReceivingChain,
  isTxConfirmed,
  mapToObject,
  splitPairId,
  stringify,
} from '../Utils';
import type { IChainClient } from '../chain/ChainClient';
import ElementsClient from '../chain/ElementsClient';
import DefaultMap from '../consts/DefaultMap';
import { SwapType, swapTypeToPrettyString } from '../consts/Enums';
import TypedEventEmitter from '../consts/TypedEventEmitter';
import type Swap from '../db/models/Swap';
import type { ChainSwapInfo } from '../db/repositories/ChainSwapRepository';
import ChainSwapRepository from '../db/repositories/ChainSwapRepository';
import PendingLockupTransactionRepository from '../db/repositories/PendingLockupTransactionRepository';
import SwapRepository from '../db/repositories/SwapRepository';
import type Sidecar from '../sidecar/Sidecar';
import ErrorsSwap from '../swap/Errors';
import type { Currency } from '../wallet/WalletManager';
import Errors from './Errors';
import type RateProvider from './RateProvider';

class LockupTransactionTracker extends TypedEventEmitter<{
  'zeroConf.disabled': string;
}> {
  private readonly lock = new AsyncLock();

  private readonly risk = new DefaultMap<string, bigint>(() => 0n);
  private readonly maxRisk = new DefaultMap<string, bigint>(() => 0n);

  private readonly zeroConfAcceptedMap = new Map<string, boolean>();

  constructor(
    private readonly logger: Logger,
    config: ConfigType,
    currencies: Map<string, Currency>,
    private readonly rateProvider: RateProvider,
    private readonly sidecar: Sidecar,
  ) {
    super();

    for (const currency of currencies.values()) {
      if (currency.chainClient === undefined) {
        continue;
      }

      this.listenToBlocks(currency.chainClient);
      this.zeroConfAcceptedMap.set(currency.chainClient.symbol, true);
    }

    for (const currency of config.currencies) {
      this.maxRisk.set(
        currency.symbol,
        BigInt(currency.maxZeroConfRisk || currency.maxZeroConfAmount || 0),
      );
    }

    if (config.liquid) {
      this.maxRisk.set(
        ElementsClient.symbol,
        BigInt(
          config.liquid.maxZeroConfRisk || config.liquid.maxZeroConfAmount || 0,
        ),
      );
    }

    this.logger.verbose(
      `Max 0-conf risk limits: ${stringify(mapToObject(this.maxRisk))}`,
    );
  }

  public init = async () => {
    for (const symbol of this.zeroConfAcceptedMap.keys()) {
      const transactionSwapIds = (
        await PendingLockupTransactionRepository.getForChain(symbol)
      ).map((tx) => tx.swapId);
      const swaps = await Promise.all([
        SwapRepository.getSwaps({
          id: {
            [Op.in]: transactionSwapIds,
          },
        }),
        ChainSwapRepository.getChainSwaps({
          id: {
            [Op.in]: transactionSwapIds,
          },
        }),
      ]);

      await this.lock.acquire(symbol, async () => {
        for (const swap of swaps.flat()) {
          this.risk.set(
            symbol,
            this.risk.get(symbol) + this.getReceivingAmount(swap),
          );
        }
      });

      const currentRisk = this.risk.get(symbol);
      if (currentRisk > 0n) {
        this.logger.verbose(
          `${transactionSwapIds.length} ${symbol} transactions still in mempool with total risk of: ${String(currentRisk)}`,
        );
      }
    }
  };

  public maxRisks = () =>
    Array.from(this.maxRisk.entries()).map(([symbol, maxRisk]) => ({
      symbol,
      maxRisk,
    }));

  public risks = () =>
    Array.from(this.risk.entries()).map(([symbol, risk]) => ({ symbol, risk }));

  public zeroConfAccepted = (symbol: string): boolean =>
    this.zeroConfAcceptedMap.get(symbol) || false;

  public isAcceptable = async (
    swap: Swap | ChainSwapInfo,
    transactionHex: string,
  ) => {
    const { base, quote } = splitPairId(swap.pair);
    const chainCurrency =
      swap.type === SwapType.Submarine
        ? getChainCurrency(base, quote, swap.orderSide, false)
        : getReceivingChain(base, quote, swap.orderSide);

    if (!this.zeroConfAcceptedMap.has(chainCurrency)) {
      throw Errors.SYMBOL_LOCKUPS_NOT_BEING_TRACKED(chainCurrency);
    }

    if (!this.zeroConfAccepted(chainCurrency)) {
      throw ErrorsSwap.SWAP_DOES_NOT_ACCEPT_ZERO_CONF().message;
    }

    const isAcceptable = await this.lock.acquire(chainCurrency, async () => {
      const risk = this.risk.get(chainCurrency) + this.getReceivingAmount(swap);
      const isAcceptable = risk <= this.maxRisk.get(chainCurrency);

      if (isAcceptable) {
        this.risk.set(chainCurrency, risk);
      }

      return isAcceptable;
    });

    if (isAcceptable) {
      await PendingLockupTransactionRepository.create(
        swap.id,
        chainCurrency,
        transactionHex,
      );
    }

    return isAcceptable;
  };

  private listenToBlocks = (chainClient: IChainClient) => {
    this.sidecar.on('block', async (block) => {
      if (block.symbol !== chainClient.symbol) {
        return;
      }

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

          this.risk.set(
            chainClient.symbol,
            bigIntMax(
              this.risk.get(chainClient.symbol) - this.getReceivingAmount(swap),
              0n,
            ),
          );
        }
      } catch (e) {
        this.logger.warn(
          `Could not find pending lockup transaction of ${swapTypeToPrettyString(swap.type)} Swap ${swap.id} (${transactionId}): ${formatError(e)}`,
        );

        if (this.zeroConfAcceptedMap.get(chainClient.symbol) === false) {
          continue;
        }

        this.logger.warn(`Disabling 0-conf for ${chainClient.symbol}`);
        this.zeroConfAcceptedMap.set(chainClient.symbol, false);
        await this.rateProvider.setZeroConfAmount(chainClient.symbol, 0);
        this.emit('zeroConf.disabled', chainClient.symbol);
      }
    }
  };

  private getReceivingAmount = (swap: Swap | ChainSwapInfo) => {
    switch (swap.type) {
      case SwapType.Submarine:
        return BigInt((swap as Swap).onchainAmount || 0);

      case SwapType.Chain:
        return BigInt((swap as ChainSwapInfo).receivingData.amount || 0);

      default:
        return 0n;
    }
  };
}

export default LockupTransactionTracker;
