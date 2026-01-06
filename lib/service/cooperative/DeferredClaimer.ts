import AsyncLock from 'async-lock';
import type { SwapConfig } from '../../Config';
import type Logger from '../../Logger';
import {
  arrayToChunks,
  calculateEthereumTransactionFee,
  formatError,
  getChainCurrency,
  getHexBuffer,
  getHexString,
  splitPairId,
} from '../../Utils';
import {
  CurrencyType,
  SwapType,
  SwapUpdateEvent,
  SwapVersion,
  currencyTypeToString,
  swapTypeToPrettyString,
} from '../../consts/Enums';
import type {
  AnySwap,
  ERC20SwapValues,
  EtherSwapValues,
} from '../../consts/Types';
import type ChannelCreation from '../../db/models/ChannelCreation';
import type Swap from '../../db/models/Swap';
import type { ChainSwapInfo } from '../../db/repositories/ChainSwapRepository';
import ChainSwapRepository from '../../db/repositories/ChainSwapRepository';
import ChannelCreationRepository from '../../db/repositories/ChannelCreationRepository';
import SwapRepository from '../../db/repositories/SwapRepository';
import type RateProvider from '../../rates/RateProvider';
import type Sidecar from '../../sidecar/Sidecar';
import type SwapOutputType from '../../swap/SwapOutputType';
import type { Currency } from '../../wallet/WalletManager';
import type WalletManager from '../../wallet/WalletManager';
import {
  queryERC20SwapValuesFromLock,
  queryEtherSwapValuesFromLock,
} from '../../wallet/ethereum/contracts/ContractUtils';
import type ERC20WalletProvider from '../../wallet/providers/ERC20WalletProvider';
import Errors from '../Errors';
import type { SwapToClaim } from './CoopSignerBase';
import CoopSignerBase, {
  cooperativeSignaturesDisabledMessage,
} from './CoopSignerBase';
import AmountTrigger from './triggers/AmountTrigger';
import ExpiryTrigger from './triggers/ExpiryTrigger';
import IntervalTrigger from './triggers/IntervalTrigger';
import ScheduledAmountTrigger from './triggers/ScheduledAmountTrigger';
import type SweepTrigger from './triggers/SweepTrigger';

const MAX_BATCH_CLAIM_CHUNK = 250;

type AnySwapWithPreimage<T extends AnySwap> = SwapToClaim<T> & {
  preimage: Buffer;
};

type SwapToClaimPreimage = AnySwapWithPreimage<Swap>;
type ChainSwapToClaimPreimage = AnySwapWithPreimage<ChainSwapInfo>;

class DeferredClaimer extends CoopSignerBase<{
  claim: {
    swap: Swap | ChainSwapInfo;
    channelCreation?: ChannelCreation;
  };
  'batch.claim.failure': {
    symbol: string;
    error: string;
  };
}> {
  private static readonly batchClaimLock = 'batchClaim';
  private static readonly swapsToClaimLock = 'swapsToClaim';

  private readonly lock = new AsyncLock();
  private readonly swapsToClaim = new Map<
    string,
    Map<string, SwapToClaimPreimage>
  >();
  private readonly chainSwapsToClaim = new Map<
    string,
    Map<string, ChainSwapToClaimPreimage>
  >();
  private readonly sweepTriggers: SweepTrigger[];

  private disableCooperative = false;

  constructor(
    logger: Logger,
    private readonly sidecar: Sidecar,
    private readonly currencies: Map<string, Currency>,
    private readonly rateProvider: RateProvider,
    walletManager: WalletManager,
    swapOutputType: SwapOutputType,
    private readonly config: SwapConfig,
  ) {
    super(logger, walletManager, swapOutputType);

    for (const symbol of config.deferredClaimSymbols) {
      this.swapsToClaim.set(symbol, new Map<string, SwapToClaimPreimage>());
      this.chainSwapsToClaim.set(
        symbol,
        new Map<string, ChainSwapToClaimPreimage>(),
      );
    }

    this.sweepTriggers = [
      new ExpiryTrigger(this.currencies, this.config.expiryTolerance),
      new AmountTrigger(
        this.logger,
        this.pendingSweepsValues,
        this.config.sweepAmountTrigger,
      ),
      new IntervalTrigger(
        this.logger,
        this.config.batchClaimInterval,
        async () => {
          await this.sweep();
        },
      ),
      new ScheduledAmountTrigger(
        this.logger,
        this.config.scheduleAmountTrigger,
        this.pendingSweepsValues,
        async (symbol: string) => {
          await this.sweepSymbol(symbol);
        },
      ),
    ];
  }

  public setDisableCooperative(disabled: boolean) {
    this.disableCooperative = disabled;
  }

  public init = async () => {
    this.logger.verbose(
      `Using deferred claims for: ${this.config.deferredClaimSymbols.join(', ')}`,
    );
    this.logger.verbose(
      `Expiry tolerance: ${this.config.expiryTolerance} minutes`,
    );

    try {
      await this.batchClaimLeftovers();
    } catch (e) {
      this.logger.error(`Could not sweep leftovers: ${formatError(e)}`);
    }
  };

  public close = () => {
    for (const trigger of this.sweepTriggers) {
      trigger.close();
    }
  };

  public pendingSweeps = () => {
    const transformMap = (map: Map<string, Map<string, any>>) =>
      new Map<string, string[]>(
        Array.from(map.entries())
          .filter(([, swaps]) => swaps.size > 0)
          .map(([currency, swaps]) => [currency, Array.from(swaps.keys())]),
      );

    return {
      [SwapType.Submarine]: transformMap(this.swapsToClaim),
      [SwapType.Chain]: transformMap(this.chainSwapsToClaim),
    };
  };

  public pendingSweepsValues = () => {
    const res = new Map<
      string,
      { type: SwapType; id: string; onchainAmount: number }[]
    >();

    for (const [symbol, swaps] of this.swapsToClaim) {
      if (swaps.size === 0) {
        continue;
      }

      res.set(
        symbol,
        Array.from(swaps.values()).map((s) => ({
          id: s.swap.id,
          type: SwapType.Submarine,
          onchainAmount: s.swap.onchainAmount!,
        })),
      );
    }

    for (const [symbol, swaps] of this.chainSwapsToClaim) {
      if (swaps.size === 0) {
        continue;
      }

      const existing = res.get(symbol) || [];
      res.set(
        symbol,
        existing.concat(
          Array.from(swaps.values()).map((s) => ({
            id: s.swap.id,
            type: SwapType.Chain,
            onchainAmount: s.swap.receivingData.amount!,
          })),
        ),
      );
    }

    return res;
  };

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
    swap: Swap | ChainSwapInfo,
    preimage: Buffer,
  ): Promise<boolean> => {
    const { base, quote } = splitPairId(swap.pair);
    const chainCurrency =
      swap.type === SwapType.Submarine
        ? getChainCurrency(base, quote, swap.orderSide, false)
        : (swap as ChainSwapInfo).receivingData.symbol;

    if (!(await this.shouldBeDeferred(chainCurrency, swap))) {
      return false;
    }

    this.logger.verbose(
      `Deferring claim of ${swapTypeToPrettyString(swap.type)} Swap ${swap.id} to next ${chainCurrency} batch`,
    );

    if (swap.type === SwapType.Submarine) {
      swap = await SwapRepository.setSwapStatus(
        swap as Swap,
        SwapUpdateEvent.TransactionClaimPending,
      );
    } else {
      swap = await ChainSwapRepository.setTransactionClaimPending(
        swap as ChainSwapInfo,
        preimage,
      );
    }

    await this.lock.acquire(DeferredClaimer.swapsToClaimLock, async () => {
      if (swap.type === SwapType.Submarine) {
        this.swapsToClaim.get(chainCurrency)!.set(swap.id, {
          preimage,
          swap: swap as Swap,
        });
      } else {
        this.chainSwapsToClaim.get(chainCurrency)!.set(swap.id, {
          preimage,
          swap: swap as ChainSwapInfo,
        });
      }
    });

    if (
      (
        await Promise.all(
          this.sweepTriggers.map((t) => t.check(chainCurrency, swap)),
        )
      ).some((result) => result)
    ) {
      await this.sweepSymbol(chainCurrency);
    }

    return true;
  };

  public getCooperativeDetails = async (
    swap: Swap | ChainSwapInfo,
  ): Promise<{
    preimage: Buffer;
    pubNonce: Buffer;
    publicKey: Buffer;
    transactionHash: Buffer;
  }> => {
    if (this.disableCooperative) {
      throw Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_CLAIM(
        cooperativeSignaturesDisabledMessage,
      );
    }

    if (this.rateProvider.isBatchOnly(swap)) {
      this.logger.debug(
        `${swapTypeToPrettyString(swap.type)} Swap ${swap.id} is batch-only`,
      );
      throw Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_CLAIM();
    }

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
    swap: Swap | ChainSwapInfo,
    theirPubNonce: Buffer,
    theirPartialSignature: Buffer,
  ) => {
    await this.lock.acquire(DeferredClaimer.batchClaimLock, async () => {
      if (this.disableCooperative) {
        throw Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_CLAIM(
          cooperativeSignaturesDisabledMessage,
        );
      }

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

        if (swap.type === SwapType.Submarine) {
          this.swapsToClaim.get(chainCurrency.symbol)?.delete(swap.id);

          this.emit('claim', {
            swap: await SwapRepository.setMinerFee(toClaim.swap as Swap, fee),
            channelCreation:
              (await ChannelCreationRepository.getChannelCreation({
                swapId: toClaim.swap.id,
              })) || undefined,
          });
        } else {
          this.chainSwapsToClaim.get(chainCurrency.symbol)?.delete(swap.id);

          this.emit('claim', {
            swap: await ChainSwapRepository.setClaimMinerFee(
              toClaim.swap as ChainSwapInfo,
              toClaim.preimage,
              fee,
            ),
          });
        }
      });
    });
  };

  private batchClaim = async (symbol: string): Promise<string[]> => {
    let swapsToClaim: (SwapToClaimPreimage | ChainSwapToClaimPreimage)[] = [];

    await this.lock.acquire(DeferredClaimer.swapsToClaimLock, async () => {
      const swaps = this.swapsToClaim.get(symbol);
      const chainSwaps = this.chainSwapsToClaim.get(symbol);
      if (swaps === undefined && chainSwaps === undefined) {
        return;
      }

      if (swaps !== undefined) {
        swapsToClaim = swapsToClaim.concat(Array.from(swaps.values()));
        swaps.clear();
      }

      if (chainSwaps !== undefined) {
        swapsToClaim = swapsToClaim.concat(Array.from(chainSwaps.values()));
        chainSwaps.clear();
      }
    });

    if (swapsToClaim.length === 0) {
      this.logger.silly(
        `Not batch claiming swaps for currency ${symbol}: no swaps to claim`,
      );
      return [];
    }
    this.logger.verbose(`Batch claiming swaps for currency: ${symbol}`);

    let claimed: string[] = [];
    let lastError: unknown;

    for (const toClaimChunk of arrayToChunks(
      swapsToClaim,
      MAX_BATCH_CLAIM_CHUNK,
    )) {
      try {
        claimed = claimed.concat(
          ...(await this.broadcastClaim(symbol, toClaimChunk)),
        );
      } catch (e) {
        lastError = e;
        this.logger.error(
          `Batch claim for currency ${symbol} failed: ${formatError(e)}`,
        );

        this.emit('batch.claim.failure', {
          symbol,
          error: formatError(e),
        });

        await this.lock.acquire(DeferredClaimer.swapsToClaimLock, async () => {
          const submarineMap = this.swapsToClaim.get(symbol)!;
          const chainMap = this.chainSwapsToClaim.get(symbol)!;

          for (const toClaim of toClaimChunk) {
            if (toClaim.swap.type === SwapType.Submarine) {
              submarineMap.set(toClaim.swap.id, toClaim as SwapToClaimPreimage);
            } else {
              chainMap.set(
                toClaim.swap.id,
                toClaim as ChainSwapToClaimPreimage,
              );
            }
          }
        });
      }
    }

    if (claimed.length === 0 && lastError !== undefined) {
      throw lastError;
    }

    return claimed;
  };

  private broadcastClaim = async (
    symbol: string,
    swaps: (SwapToClaimPreimage | ChainSwapToClaimPreimage)[],
  ) => {
    let transactionFee: number;
    let claimTransactionId: string;

    const currency = this.currencies.get(symbol)!;

    switch (currency.type) {
      case CurrencyType.BitcoinLike:
      case CurrencyType.Liquid: {
        const res = await this.sidecar.claimBatch(swaps.map((s) => s.swap.id));
        transactionFee = res.fee;
        claimTransactionId = res.transactionId;

        await currency!.chainClient!.sendRawTransaction(
          getHexString(res.transaction),
          true,
        );
        break;
      }

      case CurrencyType.Ether: {
        const manager = this.getEthereumManager(symbol);
        const contracts = manager.highestContractsVersion();

        const swapValues: EtherSwapValues[] = [];
        for (const swap of swaps) {
          const transactionId =
            swap.swap.type === SwapType.Submarine
              ? (swap.swap as Swap).lockupTransactionId!
              : (swap.swap as ChainSwapInfo).receivingData.lockupTransactionId!;

          swapValues.push(
            await queryEtherSwapValuesFromLock(
              manager.provider,
              contracts.etherSwap,
              transactionId,
            ),
          );
        }

        const tx = await contracts.contractHandler.claimBatchEther(
          swaps.map((s) => s.swap.id),
          swaps
            .map((s, i) => ({ swap: s, values: swapValues[i] }))
            .map(({ swap, values }) => ({
              amount: values.amount,
              preimage: swap.preimage,
              timelock: values.timelock,
              refundAddress: values.refundAddress,
            })),
        );

        claimTransactionId = tx.hash;
        transactionFee = calculateEthereumTransactionFee(tx);

        break;
      }

      case CurrencyType.ERC20: {
        const manager = this.getEthereumManager(symbol);
        const contracts = manager.highestContractsVersion();

        const swapValues: ERC20SwapValues[] = [];
        for (const swap of swaps) {
          const transactionId =
            swap.swap.type === SwapType.Submarine
              ? (swap.swap as Swap).lockupTransactionId!
              : (swap.swap as ChainSwapInfo).receivingData.lockupTransactionId!;

          swapValues.push(
            await queryERC20SwapValuesFromLock(
              manager.provider,
              contracts.erc20Swap,
              transactionId,
            ),
          );
        }

        const tx = await contracts.contractHandler.claimBatchToken(
          swaps.map((s) => s.swap.id),
          this.walletManager.wallets.get(symbol)!
            .walletProvider as ERC20WalletProvider,
          swaps
            .map((s, i) => ({ swap: s, values: swapValues[i] }))
            .map(({ swap, values }) => ({
              amount: values.amount,
              preimage: swap.preimage,
              timelock: values.timelock,
              refundAddress: values.refundAddress,
            })),
        );

        claimTransactionId = tx.hash;
        transactionFee = calculateEthereumTransactionFee(tx);

        break;
      }

      case CurrencyType.Ark: {
        throw new Error(
          `batched claims not supported on ${currencyTypeToString(currency.type)}`,
        );
      }
    }

    this.logger.info(
      `Claimed ${symbol} of Swaps ${swaps
        .map((toClaim) => toClaim.swap.id)
        .join(', ')} in: ${claimTransactionId}`,
    );

    const transactionFeePerSwap = Math.ceil(transactionFee / swaps.length);

    for (const toClaim of swaps) {
      let updatedSwap: Swap | ChainSwapInfo;
      if (toClaim.swap.type === SwapType.Submarine) {
        updatedSwap = await SwapRepository.setMinerFee(
          toClaim.swap as Swap,
          transactionFeePerSwap,
        );
      } else {
        updatedSwap = await ChainSwapRepository.setClaimMinerFee(
          toClaim.swap as ChainSwapInfo,
          toClaim.preimage,
          transactionFeePerSwap,
        );
      }

      this.emit('claim', {
        swap: updatedSwap,
        channelCreation:
          (await ChannelCreationRepository.getChannelCreation({
            swapId: toClaim.swap.id,
          })) || undefined,
      });
    }

    return swaps.map((toClaim) => toClaim.swap.id);
  };

  private shouldBeDeferred = async (
    chainCurrency: string,
    swap: Swap | ChainSwapInfo,
  ) => {
    if (!this.config.deferredClaimSymbols.includes(chainCurrency)) {
      this.logNotDeferringReason(
        swap.id,
        `${chainCurrency} transactions should not be deferred`,
      );
      return false;
    }

    if (swap.version !== SwapVersion.Taproot) {
      this.logNotDeferringReason(swap.id, 'version is legacy');
      return false;
    }

    const currency = this.currencies.get(chainCurrency)!;
    if (currency.type === CurrencyType.Ark) {
      return false;
    }

    if (
      currency.type === CurrencyType.Ether ||
      currency.type === CurrencyType.ERC20
    ) {
      const manager = this.getEthereumManager(chainCurrency);
      const contracts = (await manager.contractsForAddress(
        swap.type === SwapType.Submarine
          ? (swap as Swap).lockupAddress
          : (swap as ChainSwapInfo).receivingData.lockupAddress,
      ))!;

      if (contracts.version !== manager.highestContractsVersion().version) {
        this.logNotDeferringReason(swap.id, 'not using the latest contracts');
        return false;
      }
    }

    return true;
  };

  private logNotDeferringReason = (id: string, reason: string) => {
    this.logger.debug(`Not deferring claim of Swap ${id}: ${reason}`);
  };

  private batchClaimLeftovers = async () => {
    const [swapsToClaim, chainSwapsToClaim] = await Promise.all([
      SwapRepository.getSwapsClaimable(),
      ChainSwapRepository.getChainSwapsClaimable(),
    ]);

    await this.lock.acquire(DeferredClaimer.swapsToClaimLock, () => {
      for (const swap of swapsToClaim) {
        const { base, quote } = splitPairId(swap.pair);
        this.swapsToClaim
          .get(getChainCurrency(base, quote, swap.orderSide, false))!
          .set(swap.id, {
            swap,
            preimage: getHexBuffer(swap.preimage!),
          });
      }

      for (const swap of chainSwapsToClaim) {
        this.chainSwapsToClaim.get(swap.receivingData.symbol)!.set(swap.id, {
          swap,
          preimage: getHexBuffer(swap.preimage!),
        });
      }
    });

    await this.sweep();
  };

  private getToClaimDetails = async <T extends Swap | ChainSwapInfo>(
    swap: T,
  ): Promise<{
    chainCurrency: Currency;
    toClaim: AnySwapWithPreimage<T> | undefined;
  }> => {
    let receivingSymbol: string;
    if (swap.type === SwapType.Submarine) {
      const { base, quote } = splitPairId(swap.pair);
      receivingSymbol = getChainCurrency(base, quote, swap.orderSide, false);
    } else {
      receivingSymbol = (swap as ChainSwapInfo).receivingData.symbol;
    }

    const chainCurrency = this.currencies.get(receivingSymbol)!;

    // EVM based currencies cannot be claimed cooperatively
    if (
      chainCurrency.type !== CurrencyType.BitcoinLike &&
      chainCurrency.type !== CurrencyType.Liquid
    ) {
      return {
        chainCurrency,
        toClaim: undefined,
      };
    }

    let toClaim: AnySwapWithPreimage<T> | undefined;
    await this.lock.acquire(DeferredClaimer.swapsToClaimLock, async () => {
      if (swap.type === SwapType.Submarine) {
        toClaim = this.swapsToClaim.get(chainCurrency.symbol)?.get(swap.id) as
          | AnySwapWithPreimage<T>
          | undefined;
      } else {
        toClaim = this.chainSwapsToClaim
          .get(chainCurrency.symbol)
          ?.get(swap.id) as AnySwapWithPreimage<T> | undefined;
      }
    });

    return {
      toClaim,
      chainCurrency,
    };
  };

  private getEthereumManager = (symbol: string) =>
    this.walletManager.ethereumManagers.find((m) => m.hasSymbol(symbol))!;
}

export default DeferredClaimer;
export { SwapToClaimPreimage };
