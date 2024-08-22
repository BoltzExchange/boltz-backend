import AsyncLock from 'async-lock';
import { Transaction } from 'bitcoinjs-lib';
import { SwapTreeSerializer, detectPreimage, detectSwap } from 'boltz-core';
import { Transaction as LiquidTransaction } from 'liquidjs-lib';
import { Op } from 'sequelize';
import { OverPaymentConfig } from '../Config';
import {
  calculateTransactionFee,
  createMusig,
  getOutputValue,
  parseTransaction,
  tweakMusig,
} from '../Core';
import Logger from '../Logger';
import {
  chunkArray,
  getChainCurrency,
  getHexBuffer,
  getHexString,
  isTxConfirmed,
  reverseBuffer,
  splitPairId,
  transactionHashToId,
  transactionSignalsRbfExplicitly,
} from '../Utils';
import { IChainClient } from '../chain/ChainClient';
import {
  CurrencyType,
  SwapType,
  SwapUpdateEvent,
  SwapVersion,
  swapTypeToPrettyString,
} from '../consts/Enums';
import TypedEventEmitter from '../consts/TypedEventEmitter';
import ChainSwap from '../db/models/ChainSwap';
import ReverseSwap from '../db/models/ReverseSwap';
import Swap from '../db/models/Swap';
import ChainSwapRepository, {
  ChainSwapInfo,
} from '../db/repositories/ChainSwapRepository';
import ReverseSwapRepository from '../db/repositories/ReverseSwapRepository';
import SwapRepository from '../db/repositories/SwapRepository';
import WrappedSwapRepository from '../db/repositories/WrappedSwapRepository';
import LockupTransactionTracker from '../rates/LockupTransactionTracker';
import Blocks from '../service/Blocks';
import Wallet from '../wallet/Wallet';
import WalletLiquid from '../wallet/WalletLiquid';
import WalletManager, { Currency } from '../wallet/WalletManager';
import Errors from './Errors';

class UtxoNursery extends TypedEventEmitter<{
  // Swap
  'swap.expired': Swap;
  'swap.lockup.failed': { swap: Swap; reason: string };
  'swap.lockup.zeroconf.rejected': {
    swap: Swap;
    transaction: Transaction | LiquidTransaction;
    reason: string;
  };
  'swap.lockup': {
    swap: Swap;
    transaction: Transaction | LiquidTransaction;
    confirmed: boolean;
  };

  // Reverse Swap
  'reverseSwap.expired': ReverseSwap;
  'server.lockup.confirmed': {
    swap: ReverseSwap | ChainSwapInfo;
    transaction: Transaction | LiquidTransaction;
  };
  'reverseSwap.claimed': {
    reverseSwap: ReverseSwap;
    preimage: Buffer;
  };

  // Chain swap
  'chainSwap.lockup': {
    swap: ChainSwapInfo;
    transaction: Transaction | LiquidTransaction;
    confirmed: boolean;
  };
  'chainSwap.lockup.failed': {
    swap: ChainSwapInfo;
    reason: string;
  };
  'chainSwap.lockup.zeroconf.rejected': {
    swap: ChainSwapInfo;
    transaction: Transaction | LiquidTransaction;
    reason: string;
  };
  'chainSwap.claimed': {
    swap: ChainSwapInfo;
    preimage: Buffer;
  };
  'chainSwap.expired': ChainSwapInfo;
}> {
  private static readonly maxParallelRequests = 6;

  private static readonly defaultConfig = {
    exemptAmount: 10_000,
    maxPercentage: 2,
  };

  private static lockupLock = 'lockupLock';
  private static swapLockupConfirmationLock = 'swapLockupConfirmation';

  private lock = new AsyncLock();

  private readonly overPaymentExemptAmount: number;
  private readonly overPaymentMaxPercentage: number;

  constructor(
    private readonly logger: Logger,
    private readonly walletManager: WalletManager,
    private readonly blocks: Blocks,
    private readonly lockupTransactionTracker: LockupTransactionTracker,
    config?: OverPaymentConfig,
  ) {
    super();

    this.overPaymentExemptAmount =
      config?.exemptAmount || UtxoNursery.defaultConfig.exemptAmount;
    this.logger.debug(
      `Onchain payment overpayment exempt amount: ${this.overPaymentExemptAmount}`,
    );

    this.overPaymentMaxPercentage =
      (config?.maxPercentage || UtxoNursery.defaultConfig.maxPercentage) / 100;
    this.logger.debug(
      `Maximal accepted onchain overpayment: ${this.overPaymentMaxPercentage * 100}%`,
    );
  }

  public bindCurrency = (currencies: Currency[]): void => {
    currencies.forEach((currency) => {
      if (currency.chainClient) {
        const wallet = this.walletManager.wallets.get(currency.symbol)!;

        this.listenBlocks(currency.chainClient, wallet);
        this.listenTransactions(currency.chainClient, wallet);
      }
    });
  };

  private listenTransactions = (chainClient: IChainClient, wallet: Wallet) => {
    chainClient.on('transaction', async ({ transaction, confirmed }) => {
      await Promise.all([
        this.checkSwapClaims(chainClient, transaction),
        this.checkOutputs(chainClient, wallet, transaction, confirmed),
      ]);
    });
  };

  private checkOutputs = async (
    chainClient: IChainClient,
    wallet: Wallet,
    transaction: Transaction | LiquidTransaction,
    confirmed: boolean,
  ) => {
    const checkSwap = async (address: string) => {
      const swap = await SwapRepository.getSwap({
        status: {
          [Op.or]: [
            SwapUpdateEvent.SwapCreated,
            SwapUpdateEvent.InvoiceSet,
            SwapUpdateEvent.TransactionMempool,
            SwapUpdateEvent.TransactionZeroConfRejected,
          ],
        },
        lockupAddress: address,
      });

      if (!swap) {
        return;
      }

      await this.checkSwapTransaction(
        swap,
        chainClient,
        wallet,
        transaction,
        confirmed,
      );
    };

    const checkChainSwap = async (address: string) => {
      const swap = await ChainSwapRepository.getChainSwapByData(
        {
          lockupAddress: address,
        },
        {
          status: {
            [Op.or]: [
              SwapUpdateEvent.SwapCreated,
              SwapUpdateEvent.TransactionMempool,
              SwapUpdateEvent.TransactionZeroConfRejected,
            ],
          },
        },
      );

      if (!swap || wallet.symbol !== swap.receivingData.symbol) {
        return;
      }

      await this.checkChainSwapTransaction(
        swap,
        chainClient,
        wallet,
        transaction,
        confirmed,
      );
    };

    await this.lock.acquire(UtxoNursery.lockupLock, async () => {
      for (let vout = 0; vout < transaction.outs.length; vout += 1) {
        const output = transaction.outs[vout];
        const address = wallet.encodeAddress(output.script);

        await Promise.all([checkSwap(address), checkChainSwap(address)]);
      }
    });
  };

  private checkSwapClaims = async (
    chainClient: IChainClient,
    transaction: Transaction | LiquidTransaction,
  ) => {
    for (let vin = 0; vin < transaction.ins.length; vin += 1) {
      const input = transaction.ins[vin];

      await Promise.all([
        this.checkReverseSwapClaim(chainClient, transaction, vin, input),
        this.checkChainSwapClaim(chainClient, transaction, vin, input),
      ]);
    }
  };

  private checkReverseSwapClaim = async (
    chainClient: IChainClient,
    transaction: Transaction | LiquidTransaction,
    inputIndex: number,
    input: { hash: Buffer; index: number },
  ) => {
    const reverseSwap = await ReverseSwapRepository.getReverseSwap({
      status: {
        [Op.or]: [
          SwapUpdateEvent.TransactionMempool,
          SwapUpdateEvent.TransactionConfirmed,
        ],
      },
      transactionVout: input.index,
      transactionId: transactionHashToId(input.hash),
    });

    if (!reverseSwap) {
      return;
    }

    this.logger.verbose(
      `Found ${chainClient.symbol} claim transaction of Reverse Swap ${
        reverseSwap.id
      }: ${transaction.getId()}`,
    );

    chainClient.removeInputFilter(input.hash);
    this.emit('reverseSwap.claimed', {
      reverseSwap,
      preimage: reverseSwap.preimage
        ? getHexBuffer(reverseSwap.preimage)
        : detectPreimage(inputIndex, transaction),
    });
  };

  private checkChainSwapClaim = async (
    chainClient: IChainClient,
    transaction: Transaction | LiquidTransaction,
    inputIndex: number,
    input: { hash: Buffer; index: number },
  ) => {
    const swap = await ChainSwapRepository.getChainSwapByData(
      {
        transactionVout: input.index,
        transactionId: transactionHashToId(input.hash),
      },
      {
        status: {
          [Op.or]: [
            SwapUpdateEvent.TransactionServerMempool,
            SwapUpdateEvent.TransactionServerConfirmed,
          ],
        },
      },
    );
    if (swap === null) {
      return;
    }

    this.logger.verbose(
      `Found ${chainClient.symbol} claim transaction of Chain Swap ${
        swap.chainSwap.id
      }: ${transaction.getId()}`,
    );

    chainClient.removeInputFilter(input.hash);
    this.emit('chainSwap.claimed', {
      swap,
      preimage: swap.preimage
        ? getHexBuffer(swap.preimage)
        : detectPreimage(inputIndex, transaction),
    });
  };

  private listenBlocks = (chainClient: IChainClient, wallet: Wallet) => {
    chainClient.on('block', async (height) => {
      await Promise.all([
        this.checkUserLockupsInMempool(chainClient, wallet),

        this.checkServerLockupMempoolTransactions(chainClient, wallet),

        this.checkExpiredSwaps(chainClient, height),
        this.checkExpiredReverseSwaps(chainClient, height),
        this.checkExpiredChainSwaps(chainClient, height),
      ]);
    });
  };

  private checkUserLockupsInMempool = async (
    chainClient: IChainClient,
    wallet: Wallet,
  ) => {
    const checkSwapLockups = async () => {
      const mempoolSwaps = await SwapRepository.getSwaps({
        status: {
          [Op.or]: [
            SwapUpdateEvent.TransactionMempool,
            SwapUpdateEvent.TransactionZeroConfRejected,
          ],
        },
      });

      for (const swap of mempoolSwaps) {
        const { base, quote } = splitPairId(swap.pair);
        const chainCurrency = getChainCurrency(
          base,
          quote,
          swap.orderSide,
          false,
        );

        if (chainCurrency !== chainClient.symbol) {
          continue;
        }

        try {
          const lockupTransaction = await chainClient.getRawTransactionVerbose(
            swap.lockupTransactionId!,
          );

          if (isTxConfirmed(lockupTransaction)) {
            await this.checkSwapTransaction(
              swap,
              chainClient,
              wallet,
              parseTransaction(wallet.type, lockupTransaction.hex),
              true,
            );
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          this.logger.silly(
            `Could not find lockup transaction of Swap ${swap.id}: ${swap.lockupTransactionId}`,
          );
        }
      }
    };

    const checkChainSwapLockups = async () => {
      const mempoolSwaps = await ChainSwapRepository.getChainSwaps({
        status: {
          symbol: chainClient.symbol,
          [Op.or]: [
            SwapUpdateEvent.TransactionMempool,
            SwapUpdateEvent.TransactionZeroConfRejected,
          ],
        },
      });

      for (const swap of mempoolSwaps) {
        try {
          const lockupTransaction = await chainClient.getRawTransactionVerbose(
            swap.receivingData.transactionId!,
          );

          if (isTxConfirmed(lockupTransaction)) {
            await this.checkChainSwapTransaction(
              swap,
              chainClient,
              wallet,
              parseTransaction(wallet.type, lockupTransaction.hex),
              true,
            );
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          this.logger.silly(
            `Could not find lockup transaction of Chain Swap ${swap.chainSwap.id}: ${swap.receivingData.transactionId}`,
          );
        }
      }
    };

    await this.lock.acquire(UtxoNursery.lockupLock, async () => {
      await Promise.all([checkSwapLockups(), checkChainSwapLockups()]);
    });
  };

  // This method is a fallback for "checkReverseSwapLockupsConfirmed" because that method sometimes misses transactions on mainnet for an unknown reason
  private checkServerLockupMempoolTransactions = async (
    chainClient: IChainClient,
    wallet: Wallet,
  ) => {
    const checkReverse = async () => {
      const mempoolReverseSwaps = await ReverseSwapRepository.getReverseSwaps({
        status: SwapUpdateEvent.TransactionMempool,
      });

      for (const reverseSwap of mempoolReverseSwaps) {
        const { base, quote } = splitPairId(reverseSwap.pair);
        const chainCurrency = getChainCurrency(
          base,
          quote,
          reverseSwap.orderSide,
          true,
        );

        if (chainCurrency !== chainClient.symbol) {
          continue;
        }

        const transaction = await chainClient.getRawTransactionVerbose(
          reverseSwap.transactionId!,
        );

        if (isTxConfirmed(transaction)) {
          await this.serverLockupConfirmed(
            chainClient,
            wallet,
            reverseSwap,
            parseTransaction(wallet.type, transaction.hex),
          );
        }
      }
    };

    const checkChain = async () => {
      const mempoolSwaps = await ChainSwapRepository.getChainSwaps({
        status: SwapUpdateEvent.TransactionServerMempool,
      });

      for (const swap of mempoolSwaps) {
        if (swap.sendingData.symbol !== chainClient.symbol) {
          continue;
        }

        const transaction = await chainClient.getRawTransactionVerbose(
          swap.sendingData.transactionId!,
        );

        if (isTxConfirmed(transaction)) {
          await this.serverLockupConfirmed(
            chainClient,
            wallet,
            swap,
            parseTransaction(wallet.type, transaction.hex),
          );
        }
      }
    };

    await this.lock.acquire(UtxoNursery.swapLockupConfirmationLock, () =>
      Promise.all([checkReverse(), checkChain()]),
    );
  };

  private checkExpiredSwaps = async (
    chainClient: IChainClient,
    height: number,
  ) => {
    const expirableSwaps = await SwapRepository.getSwapsExpirable(height);

    for (const expirableSwap of expirableSwaps) {
      const { base, quote } = splitPairId(expirableSwap.pair);
      const chainCurrency = getChainCurrency(
        base,
        quote,
        expirableSwap.orderSide,
        false,
      );

      if (chainCurrency === chainClient.symbol) {
        const wallet = this.walletManager.wallets.get(chainCurrency)!;
        chainClient.removeOutputFilter(
          wallet.decodeAddress(expirableSwap.lockupAddress),
        );

        this.emit('swap.expired', expirableSwap);
      }
    }
  };

  private checkExpiredReverseSwaps = async (
    chainClient: IChainClient,
    height: number,
  ) => {
    const expirableReverseSwaps =
      await ReverseSwapRepository.getReverseSwapsExpirable(height);

    for (const expirableReverseSwap of expirableReverseSwaps) {
      const { base, quote } = splitPairId(expirableReverseSwap.pair);
      const chainCurrency = getChainCurrency(
        base,
        quote,
        expirableReverseSwap.orderSide,
        true,
      );

      if (chainCurrency === chainClient.symbol) {
        const wallet = this.walletManager.wallets.get(chainCurrency)!;
        chainClient.removeOutputFilter(
          wallet.decodeAddress(expirableReverseSwap.lockupAddress),
        );

        if (expirableReverseSwap.transactionId) {
          chainClient.removeInputFilter(
            reverseBuffer(getHexBuffer(expirableReverseSwap.transactionId)),
          );
        }

        this.emit('reverseSwap.expired', expirableReverseSwap);
      }
    }
  };

  private checkExpiredChainSwaps = async (
    chainClient: IChainClient,
    height: number,
  ) => {
    const expirable = await ChainSwapRepository.getChainSwapsExpirable(
      [chainClient.symbol],
      height,
    );

    for (const swap of expirable) {
      if (swap.sendingData.transactionId) {
        chainClient.removeInputFilter(
          reverseBuffer(getHexBuffer(swap.sendingData.transactionId)),
        );
      }
      this.emit('chainSwap.expired', swap);
    }
  };

  private serverLockupConfirmed = async (
    chainClient: IChainClient,
    wallet: Wallet,
    swap: ReverseSwap | ChainSwapInfo,
    transaction: Transaction | LiquidTransaction,
  ) => {
    this.logger.debug(
      `Server lockup transaction of ${swapTypeToPrettyString(swap.type)} Swap ${
        swap.id
      } confirmed: ${transaction.getId()}`,
    );

    chainClient.removeOutputFilter(
      wallet.decodeAddress(
        swap.type === SwapType.ReverseSubmarine
          ? (swap as ReverseSwap).lockupAddress
          : (swap as ChainSwapInfo).sendingData.lockupAddress,
      ),
    );
    this.emit('server.lockup.confirmed', {
      transaction,
      swap: await WrappedSwapRepository.setStatus(
        swap,
        swap.type === SwapType.ReverseSubmarine
          ? SwapUpdateEvent.TransactionConfirmed
          : SwapUpdateEvent.TransactionServerConfirmed,
      ),
    });
  };

  private checkChainSwapTransaction = async (
    swap: ChainSwapInfo,
    chainClient: IChainClient,
    wallet: Wallet,
    transaction: Transaction | LiquidTransaction,
    confirmed: boolean,
  ) => {
    const tweakedKey = tweakMusig(
      wallet.type,
      createMusig(
        wallet.getKeysByIndex(swap.receivingData.keyIndex!),
        getHexBuffer(swap.receivingData.theirPublicKey!),
      ),
      SwapTreeSerializer.deserializeSwapTree(swap.receivingData.swapTree!),
    );
    const swapOutput = detectSwap(tweakedKey, transaction)!;

    this.logFoundTransaction(
      wallet.symbol,
      swap,
      confirmed,
      transaction,
      swapOutput,
    );

    const outputValue = getOutputValue(wallet, swapOutput);
    swap = await ChainSwapRepository.setUserLockupTransaction(
      swap,
      transaction.getId(),
      outputValue,
      confirmed,
      swapOutput.vout,
    );

    if (swap.receivingData.expectedAmount > outputValue) {
      chainClient.removeOutputFilter(swapOutput.script);
      this.emit('chainSwap.lockup.failed', {
        swap,
        reason: Errors.INSUFFICIENT_AMOUNT(
          outputValue,
          swap.receivingData.expectedAmount,
        ).message,
      });

      return;
    }

    if (
      this.isUnacceptableOverpay(swap.receivingData.expectedAmount, outputValue)
    ) {
      chainClient.removeOutputFilter(swapOutput.script);
      this.emit('chainSwap.lockup.failed', {
        swap,
        reason: Errors.OVERPAID_AMOUNT(
          outputValue,
          swap.receivingData.expectedAmount,
        ).message,
      });

      return;
    }

    const prevAddresses = await this.getPreviousAddresses(
      transaction,
      chainClient,
      wallet,
    );
    if (prevAddresses.some(this.blocks.isBlocked)) {
      this.emit('chainSwap.lockup.failed', {
        swap,
        reason: Errors.BLOCKED_ADDRESS().message,
      });
      return;
    }

    if (!confirmed) {
      const zeroConfRejectedReason = await this.acceptsZeroConf(
        swap.chainSwap,
        chainClient,
        transaction,
      );
      if (zeroConfRejectedReason !== undefined) {
        this.emit('chainSwap.lockup.zeroconf.rejected', {
          swap,
          transaction,
          reason: zeroConfRejectedReason,
        });
        return;
      }

      this.logZeroConfAccepted(swap, transaction, swapOutput);
      await this.lockupTransactionTracker.addPendingTransactionToTrack(
        swap,
        transaction.toHex(),
      );
    }

    chainClient.removeOutputFilter(swapOutput.script);
    this.emit('chainSwap.lockup', { swap, transaction, confirmed });
  };

  private checkSwapTransaction = async (
    swap: Swap,
    chainClient: IChainClient,
    wallet: Wallet,
    transaction: Transaction | LiquidTransaction,
    confirmed: boolean,
  ) => {
    let redeemScriptOrTweakedKey: Buffer;

    switch (swap.version) {
      case SwapVersion.Taproot: {
        const tree = SwapTreeSerializer.deserializeSwapTree(swap.redeemScript!);
        const musig = createMusig(
          wallet.getKeysByIndex(swap.keyIndex!),
          getHexBuffer(swap.refundPublicKey!),
        );
        redeemScriptOrTweakedKey = tweakMusig(wallet.type, musig, tree);

        break;
      }

      default: {
        redeemScriptOrTweakedKey = getHexBuffer(swap.redeemScript!);
        break;
      }
    }

    const swapOutput = detectSwap(redeemScriptOrTweakedKey, transaction)!;

    this.logFoundTransaction(
      wallet.symbol,
      swap,
      confirmed,
      transaction,
      swapOutput,
    );

    const outputValue = getOutputValue(wallet, swapOutput);
    const updatedSwap = await SwapRepository.setLockupTransaction(
      swap,
      transaction.getId(),
      outputValue,
      confirmed,
      swapOutput.vout,
    );

    if (updatedSwap.expectedAmount) {
      if (updatedSwap.expectedAmount > outputValue) {
        chainClient.removeOutputFilter(swapOutput.script);
        this.emit('swap.lockup.failed', {
          swap: updatedSwap,
          reason: Errors.INSUFFICIENT_AMOUNT(
            outputValue,
            updatedSwap.expectedAmount,
          ).message,
        });

        return;
      }

      if (this.isUnacceptableOverpay(updatedSwap.expectedAmount, outputValue)) {
        chainClient.removeOutputFilter(swapOutput.script);
        this.emit('swap.lockup.failed', {
          swap: updatedSwap,
          reason: Errors.OVERPAID_AMOUNT(
            outputValue,
            updatedSwap.expectedAmount,
          ).message,
        });

        return;
      }
    }

    const prevAddresses = await this.getPreviousAddresses(
      transaction,
      chainClient,
      wallet,
    );
    if (prevAddresses.some(this.blocks.isBlocked)) {
      this.emit('swap.lockup.failed', {
        swap: updatedSwap,
        reason: Errors.BLOCKED_ADDRESS().message,
      });
      return;
    }

    // Confirmed transactions do not have to be checked for 0-conf criteria
    if (!confirmed) {
      const zeroConfRejectedReason = await this.acceptsZeroConf(
        updatedSwap,
        chainClient,
        transaction,
      );
      if (zeroConfRejectedReason !== undefined) {
        this.emit('swap.lockup.zeroconf.rejected', {
          transaction,
          swap: updatedSwap,
          reason: zeroConfRejectedReason,
        });
        return;
      }

      this.logZeroConfAccepted(swap, transaction, swapOutput);
      await this.lockupTransactionTracker.addPendingTransactionToTrack(
        swap,
        transaction.toHex(),
      );
    }

    chainClient.removeOutputFilter(swapOutput.script);
    this.emit('swap.lockup', { transaction, confirmed, swap: updatedSwap });
  };

  /**
   * Detects whether the transaction signals RBF explicitly or inherently
   */
  private transactionSignalsRbf = async (
    chainClient: IChainClient,
    transaction: Transaction | LiquidTransaction,
  ) => {
    // Check for explicit signalling
    if (transactionSignalsRbfExplicitly(transaction)) {
      return true;
    }

    // Check for inherited signalling from unconfirmed inputs
    for (const input of transaction.ins) {
      const inputId = transactionHashToId(input.hash);
      const inputTransaction =
        await chainClient.getRawTransactionVerbose(inputId);

      if (!isTxConfirmed(inputTransaction)) {
        const inputSignalsRbf = await this.transactionSignalsRbf(
          chainClient,
          parseTransaction(chainClient.currencyType, inputTransaction.hex),
        );

        if (inputSignalsRbf) {
          return true;
        }
      }
    }

    return false;
  };

  private acceptsZeroConf = async (
    swap: Swap | ChainSwap,
    chainClient: IChainClient,
    transaction: Transaction | LiquidTransaction,
  ) => {
    if (
      swap.acceptZeroConf !== true ||
      !this.lockupTransactionTracker.zeroConfAccepted(chainClient.symbol)
    ) {
      return Errors.SWAP_DOES_NOT_ACCEPT_ZERO_CONF().message;
    }

    const signalsRBF = await this.transactionSignalsRbf(
      chainClient,
      transaction,
    );

    if (signalsRBF) {
      return Errors.LOCKUP_TRANSACTION_SIGNALS_RBF().message;
    }

    // Check if the transaction has a fee high enough to be confirmed in a timely manner
    const [feeEstimation, absoluteTransactionFee] = await Promise.all([
      chainClient.estimateFee(),
      calculateTransactionFee(chainClient, transaction),
    ]);

    const transactionFeePerVbyte =
      absoluteTransactionFee / transaction.virtualSize();

    // If the transaction fee is less than 80% of the estimation, Boltz will wait for a confirmation
    //
    // Special case: if the fee estimation is the lowest possible of 2 sat/vbyte,
    // every fee paid by the transaction will be accepted
    if (transactionFeePerVbyte / feeEstimation < 0.8 && feeEstimation !== 2) {
      return Errors.LOCKUP_TRANSACTION_FEE_TOO_LOW().message;
    }

    return undefined;
  };

  private getPreviousAddresses = async (
    transaction: Transaction | LiquidTransaction,
    chainClient: IChainClient,
    wallet: Wallet,
  ) => {
    const inputTxsIds = chunkArray(
      Array.from(
        new Set<string>(
          transaction.ins.map((input) =>
            getHexString(reverseBuffer(input.hash)),
          ),
        ).values(),
      ),
      UtxoNursery.maxParallelRequests,
    );

    const inputTxs = (
      await Promise.all(
        inputTxsIds.map((ids) => this.getTransactions(chainClient, ids)),
      )
    )
      .flat()
      .map((txHex) => parseTransaction(wallet.type, txHex));

    return inputTxs
      .map((tx) => tx.outs)
      .flat()
      .map((output) =>
        wallet.type === CurrencyType.Liquid
          ? (wallet as WalletLiquid).encodeAddress(output.script, false)
          : wallet.encodeAddress(output.script),
      );
  };

  private getTransactions = async (
    chainClient: IChainClient,
    ids: string[],
  ) => {
    const txs: string[] = [];

    for (const id of ids) {
      txs.push(await chainClient.getRawTransaction(id));
    }

    return txs;
  };

  private logFoundTransaction = (
    symbol: string,
    swap: Swap | ChainSwapInfo,
    confirmed: boolean,
    transaction: Transaction | LiquidTransaction,
    swapOutput: ReturnType<typeof detectSwap>,
  ) =>
    this.logger.verbose(
      `Found ${confirmed ? '' : 'un'}confirmed ${symbol} lockup transaction for ${swapTypeToPrettyString(swap.type)} Swap ${
        swap.id
      }: ${transaction.getId()}:${swapOutput.vout}`,
    );

  private logZeroConfAccepted = (
    swap: Swap | ChainSwapInfo,
    transaction: Transaction | LiquidTransaction,
    swapOutput: ReturnType<typeof detectSwap>,
  ) =>
    this.logger.debug(
      `Accepted 0-conf lockup transaction for ${swapTypeToPrettyString(swap.type)} Swap ${
        swap.id
      }: ${transaction.getId()}:${swapOutput.vout}`,
    );

  private isUnacceptableOverpay = (expected: number, actual: number): boolean =>
    actual - expected >
    Math.max(
      this.overPaymentExemptAmount,
      actual * this.overPaymentMaxPercentage,
    );
}

export default UtxoNursery;
