import AsyncLock from 'async-lock';
import { Job, scheduleJob } from 'node-schedule';
import {
  ClaimDetails,
  LiquidClaimDetails,
  calculateTransactionFee,
  constructClaimTransaction,
} from '../../Core';
import Logger from '../../Logger';
import {
  formatError,
  getChainCurrency,
  getHexBuffer,
  getLightningCurrency,
  splitPairId,
} from '../../Utils';
import { SwapType, SwapUpdateEvent, SwapVersion } from '../../consts/Enums';
import ChannelCreation from '../../db/models/ChannelCreation';
import Swap from '../../db/models/Swap';
import ChannelCreationRepository from '../../db/repositories/ChannelCreationRepository';
import SwapRepository from '../../db/repositories/SwapRepository';
import SwapOutputType from '../../swap/SwapOutputType';
import WalletManager, { Currency } from '../../wallet/WalletManager';
import Errors from '../Errors';
import TimeoutDeltaProvider from '../TimeoutDeltaProvider';
import CoopSignerBase, { SwapToClaim } from './CoopSignerBase';

type SwapConfig = {
  deferredClaimSymbols: string[];
  batchClaimInterval: string;
  expiryTolerance: number;
};

type SwapToClaimPreimage = SwapToClaim<Swap> & { preimage: Buffer };

class DeferredClaimer extends CoopSignerBase<
  Swap,
  {
    claim: {
      swap: Swap;
      channelCreation?: ChannelCreation;
    };
  }
> {
  private static readonly batchClaimLock = 'batchClaim';
  private static readonly swapsToClaimLock = 'swapsToClaim';

  private readonly lock = new AsyncLock();

  private readonly swapsToClaim = new Map<
    string,
    Map<string, SwapToClaimPreimage>
  >();

  private batchClaimSchedule?: Job;

  constructor(
    logger: Logger,
    private readonly currencies: Map<string, Currency>,
    walletManager: WalletManager,
    swapOutputType: SwapOutputType,
    private readonly config: SwapConfig,
  ) {
    super(logger, walletManager, swapOutputType);

    for (const symbol of config.deferredClaimSymbols) {
      this.swapsToClaim.set(symbol, new Map<string, SwapToClaimPreimage>());
    }
  }

  public init = async () => {
    this.logger.verbose(
      `Using deferred claims for: ${this.config.deferredClaimSymbols.join(', ')}`,
    );
    this.logger.verbose(
      `Batch claim interval: ${this.config.batchClaimInterval} with expiry tolerance of ${this.config.expiryTolerance} minutes`,
    );

    await this.batchClaimLeftovers();

    this.batchClaimSchedule = scheduleJob(
      this.config.batchClaimInterval,
      async () => {
        await this.sweep();
      },
    );
  };

  public close = () => {
    this.batchClaimSchedule?.cancel();
    this.batchClaimSchedule = undefined;
  };

  public pendingSweeps = () => {
    const transFormMap = (map: Map<string, Map<string, any>>) =>
      new Map<string, string[]>(
        Array.from(map.entries()).map(([currency, swaps]) => [
          currency,
          Array.from(swaps.keys()),
        ]),
      );

    return {
      [SwapType.Submarine]: transFormMap(this.swapsToClaim),
    };
  };

  public pendingSweepsValues() {
    return new Map<string, SwapToClaimPreimage[]>(
      Array.from(this.swapsToClaim.entries()).map(([currency, swaps]) => [
        currency,
        Array.from(swaps.values()),
      ]),
    );
  }

  public sweep = async () => {
    const claimed = new Map<string, string[]>();

    for (const symbol of this.config.deferredClaimSymbols) {
      const ids = await this.sweepSymbol(symbol);

      if (ids.length > 0) {
        claimed.set(symbol, ids);
      }
    }

    return claimed;
  };

  public sweepSymbol = async (symbol: string) => {
    let claimedSwaps: string[] = [];

    await this.lock.acquire(DeferredClaimer.batchClaimLock, async () => {
      claimedSwaps = await this.batchClaim(symbol);
    });

    return claimedSwaps;
  };

  public deferClaim = async (
    swap: Swap,
    preimage: Buffer,
  ): Promise<boolean> => {
    const { base, quote } = splitPairId(swap.pair);
    const chainCurrency = getChainCurrency(base, quote, swap.orderSide, false);
    if (!this.shouldBeDeferred(chainCurrency, swap)) {
      return false;
    }

    this.logger.verbose(
      `Deferring claim of ${swap.id} to next ${chainCurrency} batch`,
    );

    swap = await SwapRepository.setSwapStatus(
      swap,
      SwapUpdateEvent.TransactionClaimPending,
    );

    await this.lock.acquire(DeferredClaimer.swapsToClaimLock, async () => {
      this.swapsToClaim.get(chainCurrency)!.set(swap.id, {
        swap,
        preimage,
      });
    });

    if (await this.expiryTooSoon(chainCurrency, swap)) {
      await this.sweepSymbol(chainCurrency);
    }

    return true;
  };

  public getCooperativeDetails = async (
    swap: Swap,
  ): Promise<{
    preimage: Buffer;
    pubNonce: Buffer;
    publicKey: Buffer;
    transactionHash: Buffer;
  }> => {
    const { toClaim, chainCurrency } = await this.getToClaimDetails(swap);
    if (toClaim === undefined) {
      throw Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_CLAIM();
    }

    const details = await this.createCoopDetails(chainCurrency, toClaim);
    return {
      ...details,
      preimage: toClaim.preimage,
    };
  };

  public broadcastCooperative = async (
    swap: Swap,
    theirPubNonce: Buffer,
    theirPartialSignature: Buffer,
  ) => {
    await this.lock.acquire(DeferredClaimer.batchClaimLock, async () => {
      const { toClaim, chainCurrency } = await this.getToClaimDetails(swap);
      if (toClaim === undefined || toClaim.cooperative === undefined) {
        throw Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_CLAIM_BROADCAST();
      }

      await this.lock.acquire(DeferredClaimer.swapsToClaimLock, async () => {
        const { fee } = await this.broadcastCooperativeTransaction(
          swap,
          chainCurrency,
          toClaim.cooperative!.musig,
          toClaim.cooperative!.transaction,
          theirPubNonce,
          theirPartialSignature,
        );

        this.swapsToClaim.get(chainCurrency.symbol)?.delete(swap.id);

        this.emit('claim', {
          swap: await SwapRepository.setMinerFee(toClaim.swap, fee),
          channelCreation:
            (await ChannelCreationRepository.getChannelCreation({
              swapId: toClaim.swap.id,
            })) || undefined,
        });
      });
    });
  };

  private batchClaim = async (symbol: string) => {
    let swapsToClaim: SwapToClaimPreimage[] = [];

    await this.lock.acquire(DeferredClaimer.swapsToClaimLock, async () => {
      const swaps = this.swapsToClaim.get(symbol);
      if (swaps === undefined) {
        return;
      }

      swapsToClaim = Array.from(swaps.values());
      swaps.clear();
    });

    try {
      if (swapsToClaim.length === 0) {
        this.logger.silly(
          `Not batch claiming swaps for currency ${symbol}: no swaps to claim`,
        );
        return [];
      }

      this.logger.verbose(`Batch claiming swaps for currency: ${symbol}`);
      return await this.broadcastClaim(symbol, swapsToClaim);
    } catch (e) {
      this.logger.warn(
        `Batch claim for currency ${symbol} failed: ${formatError(e)}`,
      );
      await this.lock.acquire(DeferredClaimer.swapsToClaimLock, async () => {
        const map = this.swapsToClaim.get(symbol)!;

        for (const toClaim of swapsToClaim) {
          map.set(toClaim.swap.id, toClaim);
        }
      });

      throw e;
    }
  };

  private broadcastClaim = async (
    currency: string,
    swaps: SwapToClaimPreimage[],
  ) => {
    const chainClient = this.currencies.get(currency)!.chainClient!;
    const wallet = this.walletManager.wallets.get(currency)!;

    const claimDetails = (await Promise.all(
      swaps.map((swap) =>
        this.constructClaimDetails(chainClient, wallet, swap, swap.preimage),
      ),
    )) as ClaimDetails[] | LiquidClaimDetails[];

    const claimTransaction = constructClaimTransaction(
      wallet,
      claimDetails,
      await wallet.getAddress(),
      await chainClient.estimateFee(),
    );

    const transactionFeePerSwap = Math.ceil(
      (await calculateTransactionFee(chainClient, claimTransaction)) /
        swaps.length,
    );

    await chainClient.sendRawTransaction(claimTransaction.toHex(), true);

    this.logger.info(
      `Claimed ${wallet.symbol} of Swaps ${swaps
        .map((toClaim) => toClaim.swap.id)
        .join(', ')} in: ${claimTransaction.getId()}`,
    );

    for (const toClaim of swaps) {
      this.emit('claim', {
        swap: await SwapRepository.setMinerFee(
          toClaim.swap,
          transactionFeePerSwap,
        ),
        channelCreation:
          (await ChannelCreationRepository.getChannelCreation({
            swapId: toClaim.swap.id,
          })) || undefined,
      });
    }

    return swaps.map((toClaim) => toClaim.swap.id);
  };

  private shouldBeDeferred = (chainCurrency: string, swap: Swap) => {
    if (!this.config.deferredClaimSymbols.includes(chainCurrency)) {
      this.logNotDeferringReason(
        swap,
        `${chainCurrency} transactions should not be deferred`,
      );
      return false;
    }

    if (swap.version !== SwapVersion.Taproot) {
      this.logNotDeferringReason(swap, 'version is legacy');
      return false;
    }

    return true;
  };

  private expiryTooSoon = async (chainCurrency: string, swap: Swap) => {
    const chainClient = this.currencies.get(chainCurrency)!.chainClient!;
    const { blocks } = await chainClient.getBlockchainInfo();

    const minutesLeft =
      TimeoutDeltaProvider.blockTimes.get(chainCurrency)! *
      (swap.timeoutBlockHeight - blocks);

    return minutesLeft <= this.config.expiryTolerance;
  };

  private logNotDeferringReason = (swap: Swap, reason: string) => {
    this.logger.debug(`Not deferring claim of Swap ${swap.id}: ${reason}`);
  };

  private batchClaimLeftovers = async () => {
    const swapsToClaim = await SwapRepository.getSwapsClaimable();

    for (const swap of swapsToClaim) {
      const { base, quote } = splitPairId(swap.pair);
      const { lndClient, clnClient } = this.currencies.get(
        getLightningCurrency(base, quote, swap.orderSide, false),
      )!;

      const paymentRes = (
        await Promise.allSettled([
          lndClient
            ?.trackPayment(getHexBuffer(swap.preimageHash))
            .then((res) => getHexBuffer(res.paymentPreimage)),
          clnClient?.checkPayStatus(swap.invoice!).then((res) => res?.preimage),
        ])
      )
        .filter(
          (res): res is PromiseFulfilledResult<Buffer | undefined> =>
            res.status === 'fulfilled',
        )
        .map((res) => res.value)
        .filter((res): res is Buffer => res !== undefined);

      if (paymentRes.length === 0) {
        this.logger.warn(
          `Could not prepare claim of Swap ${swap.id}: no lightning client has preimage`,
        );
        continue;
      }

      await this.lock.acquire(DeferredClaimer.swapsToClaimLock, async () => {
        this.swapsToClaim
          .get(getChainCurrency(base, quote, swap.orderSide, false))!
          .set(swap.id, {
            swap,
            preimage: paymentRes[0],
          });
      });
    }

    await this.sweep();
  };

  private getToClaimDetails = async (swap: Swap) => {
    const { base, quote } = splitPairId(swap.pair);
    const chainCurrency = this.currencies.get(
      getChainCurrency(base, quote, swap.orderSide, false),
    )!;

    let toClaim: SwapToClaimPreimage | undefined;
    await this.lock.acquire(DeferredClaimer.swapsToClaimLock, async () => {
      toClaim = this.swapsToClaim.get(chainCurrency.symbol)?.get(swap.id);
    });

    return {
      toClaim,
      chainCurrency,
    };
  };
}

export default DeferredClaimer;
export { SwapConfig, SwapToClaimPreimage };
