import AsyncLock from 'async-lock';
import { Job, scheduleJob } from 'node-schedule';
import { SwapConfig } from '../../Config';
import {
  ClaimDetails,
  LiquidClaimDetails,
  calculateTransactionFee,
  constructClaimTransaction,
} from '../../Core';
import Logger from '../../Logger';
import {
  arrayToChunks,
  calculateEthereumTransactionFee,
  formatError,
  getChainCurrency,
  getHexBuffer,
  splitPairId,
} from '../../Utils';
import ElementsClient from '../../chain/ElementsClient';
import DefaultMap from '../../consts/DefaultMap';
import {
  CurrencyType,
  SwapType,
  SwapUpdateEvent,
  SwapVersion,
} from '../../consts/Enums';
import { ERC20SwapValues, EtherSwapValues } from '../../consts/Types';
import ChannelCreation from '../../db/models/ChannelCreation';
import Swap from '../../db/models/Swap';
import ChannelCreationRepository from '../../db/repositories/ChannelCreationRepository';
import SwapRepository from '../../db/repositories/SwapRepository';
import TransactionLabelRepository from '../../db/repositories/TransactionLabelRepository';
import SwapOutputType from '../../swap/SwapOutputType';
import WalletManager, { Currency } from '../../wallet/WalletManager';
import {
  queryERC20SwapValuesFromLock,
  queryEtherSwapValuesFromLock,
} from '../../wallet/ethereum/contracts/ContractUtils';
import Contracts from '../../wallet/ethereum/contracts/Contracts';
import ERC20WalletProvider from '../../wallet/providers/ERC20WalletProvider';
import Errors from '../Errors';
import TimeoutDeltaProvider from '../TimeoutDeltaProvider';
import CoopSignerBase, { SwapToClaim } from './CoopSignerBase';

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

  private static readonly maxBatchClaimChunk = new DefaultMap(
    () => 100,
    [[ElementsClient.symbol, 15]],
  );

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

    try {
      await this.batchClaimLeftovers();
    } catch (e) {
      this.logger.error(`Could not sweep leftovers: ${formatError(e)}`);
    }

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
    const transformMap = (map: Map<string, Map<string, any>>) =>
      new Map<string, string[]>(
        Array.from(map.entries())
          .filter(([, swaps]) => swaps.size > 0)
          .map(([currency, swaps]) => [currency, Array.from(swaps.keys())]),
      );

    return {
      [SwapType.Submarine]: transformMap(this.swapsToClaim),
    };
  };

  public pendingSweepsValues() {
    return new Map<string, SwapToClaimPreimage[]>(
      Array.from(this.swapsToClaim.entries())
        .filter(([, swaps]) => swaps.size > 0)
        .map(([currency, swaps]) => [currency, Array.from(swaps.values())]),
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
    if (!(await this.shouldBeDeferred(chainCurrency, swap))) {
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

  private batchClaim = async (symbol: string): Promise<string[]> => {
    let swapsToClaim: SwapToClaimPreimage[] = [];

    await this.lock.acquire(DeferredClaimer.swapsToClaimLock, async () => {
      const swaps = this.swapsToClaim.get(symbol);
      if (swaps === undefined) {
        return;
      }

      swapsToClaim = Array.from(swaps.values());
      swaps.clear();
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
      DeferredClaimer.maxBatchClaimChunk.get(symbol),
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
        await this.lock.acquire(DeferredClaimer.swapsToClaimLock, async () => {
          const map = this.swapsToClaim.get(symbol)!;

          for (const toClaim of toClaimChunk) {
            map.set(toClaim.swap.id, toClaim);
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
    swaps: SwapToClaimPreimage[],
  ) => {
    let transactionFee: number;
    let claimTransactionId: string;

    const currency = this.currencies.get(symbol)!;

    switch (currency.type) {
      case CurrencyType.BitcoinLike:
      case CurrencyType.Liquid: {
        const wallet = this.walletManager.wallets.get(symbol)!;
        const chainClient = currency!.chainClient!;

        const claimDetails = (await Promise.all(
          swaps.map((swap) =>
            this.constructClaimDetails(
              chainClient,
              wallet,
              swap,
              swap.preimage,
            ),
          ),
        )) as ClaimDetails[] | LiquidClaimDetails[];

        const claimTransaction = constructClaimTransaction(
          wallet,
          claimDetails,
          await wallet.getAddress(
            TransactionLabelRepository.claimBatchLabel(
              swaps.map((s) => s.swap.id),
            ),
          ),
          await chainClient.estimateFee(),
        );

        claimTransactionId = claimTransaction.getId();
        transactionFee = await calculateTransactionFee(
          chainClient,
          claimTransaction,
        );

        await chainClient.sendRawTransaction(claimTransaction.toHex(), true);
        break;
      }

      case CurrencyType.Ether: {
        const manager = this.getEthereumManager(symbol);
        const contracts = manager.highestContractsVersion();

        const swapValues: EtherSwapValues[] = [];
        for (const swap of swaps) {
          swapValues.push(
            await queryEtherSwapValuesFromLock(
              manager.provider,
              contracts.etherSwap,
              swap.swap.lockupTransactionId!,
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
          swapValues.push(
            await queryERC20SwapValuesFromLock(
              manager.provider,
              contracts.erc20Swap,
              swap.swap.lockupTransactionId!,
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
    }

    this.logger.info(
      `Claimed ${symbol} of Swaps ${swaps
        .map((toClaim) => toClaim.swap.id)
        .join(', ')} in: ${claimTransactionId}`,
    );

    const transactionFeePerSwap = Math.ceil(transactionFee / swaps.length);

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

  private shouldBeDeferred = async (chainCurrency: string, swap: Swap) => {
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

    const currency = this.currencies.get(chainCurrency)!;
    if (
      currency.type === CurrencyType.Ether ||
      currency.type === CurrencyType.ERC20
    ) {
      const manager = this.getEthereumManager(chainCurrency);
      const contracts = (await manager.contractsForAddress(
        swap.lockupAddress,
      ))!;

      if (contracts.version !== Contracts.maxVersion) {
        this.logNotDeferringReason(swap, 'not using the latest contracts');
        return false;
      }
    }

    return true;
  };

  private expiryTooSoon = async (chainCurrency: string, swap: Swap) => {
    let blockHeight: number;

    const currency = this.currencies.get(chainCurrency)!;
    switch (currency.type) {
      case CurrencyType.BitcoinLike:
      case CurrencyType.Liquid:
        blockHeight = (await currency.chainClient!.getBlockchainInfo()).blocks;
        break;

      case CurrencyType.Ether:
      case CurrencyType.ERC20:
        blockHeight = await currency.provider!.getBlockNumber();
        break;
    }

    const minutesLeft =
      TimeoutDeltaProvider.blockTimes.get(chainCurrency)! *
      (swap.timeoutBlockHeight - blockHeight);

    return minutesLeft <= this.config.expiryTolerance;
  };

  private logNotDeferringReason = (swap: Swap, reason: string) => {
    this.logger.debug(`Not deferring claim of Swap ${swap.id}: ${reason}`);
  };

  private batchClaimLeftovers = async () => {
    const swapsToClaim = await SwapRepository.getSwapsClaimable();

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
    });

    await this.sweep();
  };

  private getToClaimDetails = async (swap: Swap) => {
    const { base, quote } = splitPairId(swap.pair);
    const chainCurrency = this.currencies.get(
      getChainCurrency(base, quote, swap.orderSide, false),
    )!;

    // EVM based currencies cannot be claimed cooperatively
    if (
      chainCurrency.type !== CurrencyType.BitcoinLike &&
      chainCurrency.type !== CurrencyType.Liquid
    ) {
      return {
        chainCurrency,
      };
    }

    let toClaim: SwapToClaimPreimage | undefined;
    await this.lock.acquire(DeferredClaimer.swapsToClaimLock, async () => {
      toClaim = this.swapsToClaim.get(chainCurrency.symbol)?.get(swap.id);
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
