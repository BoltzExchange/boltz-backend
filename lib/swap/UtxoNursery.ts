import AsyncLock from 'async-lock';
import { Transaction } from 'bitcoinjs-lib';
import { SwapTreeSerializer, detectPreimage, detectSwap } from 'boltz-core';
import { Transaction as LiquidTransaction } from 'liquidjs-lib';
import { Op } from 'sequelize';
import {
  calculateTransactionFee,
  createMusig,
  getOutputValue,
  parseTransaction,
  tweakMusig,
} from '../Core';
import Logger from '../Logger';
import {
  getChainCurrency,
  getHexBuffer,
  getHexString,
  reverseBuffer,
  splitPairId,
  transactionHashToId,
  transactionSignalsRbfExplicitly,
} from '../Utils';
import ChainClient from '../chain/ChainClient';
import { CurrencyType, SwapUpdateEvent, SwapVersion } from '../consts/Enums';
import TypedEventEmitter from '../consts/TypedEventEmitter';
import ReverseSwap from '../db/models/ReverseSwap';
import Swap from '../db/models/Swap';
import ReverseSwapRepository from '../db/repositories/ReverseSwapRepository';
import SwapRepository from '../db/repositories/SwapRepository';
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
  'reverseSwap.lockup.confirmed': {
    reverseSwap: ReverseSwap;
    transaction: Transaction | LiquidTransaction;
  };
  'reverseSwap.claimed': {
    reverseSwap: ReverseSwap;
    preimage: Buffer;
  };
}> {
  private static readonly maxParallelRequests = 6;

  // Locks
  private lock = new AsyncLock();

  private static swapLockupLock = 'swapLockupLock';
  private static reverseSwapLockupConfirmationLock =
    'reverseSwapLockupConfirmation';

  constructor(
    private readonly logger: Logger,
    private readonly walletManager: WalletManager,
    private readonly blocks: Blocks,
  ) {
    super();
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

  private listenTransactions = (chainClient: ChainClient, wallet: Wallet) => {
    chainClient.on('transaction', async ({ transaction, confirmed }) => {
      await Promise.all([
        this.checkSwapOutputs(chainClient, wallet, transaction, confirmed),

        this.checkReverseSwapClaims(chainClient, transaction),
        this.checkReverseSwapLockupsConfirmed(
          chainClient,
          wallet,
          transaction,
          confirmed,
        ),
      ]);
    });
  };

  private checkSwapOutputs = async (
    chainClient: ChainClient,
    wallet: Wallet,
    transaction: Transaction | LiquidTransaction,
    confirmed: boolean,
  ) => {
    await this.lock.acquire(UtxoNursery.swapLockupLock, async () => {
      for (let vout = 0; vout < transaction.outs.length; vout += 1) {
        const output = transaction.outs[vout];

        const swap = await SwapRepository.getSwap({
          status: {
            [Op.or]: [
              SwapUpdateEvent.SwapCreated,
              SwapUpdateEvent.InvoiceSet,
              SwapUpdateEvent.TransactionMempool,
              SwapUpdateEvent.TransactionZeroConfRejected,
            ],
          },
          lockupAddress: wallet.encodeAddress(output.script),
        });

        if (!swap) {
          continue;
        }

        await this.checkSwapTransaction(
          swap,
          chainClient,
          wallet,
          transaction,
          confirmed,
        );
      }
    });
  };

  private checkReverseSwapClaims = async (
    chainClient: ChainClient,
    transaction: Transaction | LiquidTransaction,
  ) => {
    for (let vin = 0; vin < transaction.ins.length; vin += 1) {
      const input = transaction.ins[vin];

      const reverseSwap = await ReverseSwapRepository.getReverseSwap({
        status: {
          [Op.or]: [
            SwapUpdateEvent.TransactionMempool,
            SwapUpdateEvent.TransactionConfirmed,
          ],
        },
        transactionId: transactionHashToId(input.hash),
        transactionVout: input.index,
      });

      if (!reverseSwap) {
        continue;
      }

      this.logger.verbose(
        `Found claim transaction of Reverse Swap ${
          reverseSwap.id
        }: ${transaction.getId()}`,
      );

      chainClient.removeInputFilter(input.hash);
      this.emit('reverseSwap.claimed', {
        reverseSwap,
        preimage: detectPreimage(vin, transaction),
      });
    }
  };

  private checkReverseSwapLockupsConfirmed = async (
    chainClient: ChainClient,
    wallet: Wallet,
    transaction: Transaction | LiquidTransaction,
    confirmed: boolean,
  ) => {
    await this.lock.acquire(
      UtxoNursery.reverseSwapLockupConfirmationLock,
      async () => {
        if (!confirmed) {
          return;
        }

        const reverseSwap = await ReverseSwapRepository.getReverseSwap({
          status: SwapUpdateEvent.TransactionMempool,
          transactionId: transaction.getId(),
        });

        if (reverseSwap) {
          await this.reverseSwapLockupConfirmed(
            chainClient,
            wallet,
            reverseSwap,
            transaction,
          );
        }
      },
    );
  };

  private listenBlocks = (chainClient: ChainClient, wallet: Wallet) => {
    chainClient.on('block', async (height) => {
      await Promise.all([
        this.checkSwapMempoolTransactions(chainClient, wallet),
        this.checkReverseSwapMempoolTransactions(chainClient, wallet),

        this.checkExpiredSwaps(chainClient, height),
        this.checkExpiredReverseSwaps(chainClient, height),
      ]);
    });
  };

  private checkSwapMempoolTransactions = async (
    chainClient: ChainClient,
    wallet: Wallet,
  ) => {
    await this.lock.acquire(UtxoNursery.swapLockupLock, async () => {
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

          if (
            lockupTransaction.confirmations &&
            lockupTransaction.confirmations !== 0
          ) {
            await this.checkSwapTransaction(
              swap,
              chainClient,
              wallet,
              parseTransaction(wallet.type, lockupTransaction.hex),
              true,
            );
          }
        } catch (e) {
          this.logger.silly(
            `Could not find lockup transaction of swap ${swap.id}: ${swap.lockupTransactionId}`,
          );
        }
      }
    });
  };

  // This method is a fallback for "checkReverseSwapLockupsConfirmed" because that method sometimes misses transactions on mainnet for an unknown reason
  private checkReverseSwapMempoolTransactions = async (
    chainClient: ChainClient,
    wallet: Wallet,
  ) => {
    await this.lock.acquire(
      UtxoNursery.reverseSwapLockupConfirmationLock,
      async () => {
        const mempoolReverseSwaps = await ReverseSwapRepository.getReverseSwaps(
          {
            status: SwapUpdateEvent.TransactionMempool,
          },
        );

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

          if (transaction.confirmations && transaction.confirmations !== 0) {
            await this.reverseSwapLockupConfirmed(
              chainClient,
              wallet,
              reverseSwap,
              parseTransaction(wallet.type, transaction.hex),
            );
          }
        }
      },
    );
  };

  private checkExpiredSwaps = async (
    chainClient: ChainClient,
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
    chainClient: ChainClient,
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

  private reverseSwapLockupConfirmed = async (
    chainClient: ChainClient,
    wallet: Wallet,
    reverseSwap: ReverseSwap,
    transaction: Transaction | LiquidTransaction,
  ) => {
    this.logger.debug(
      `Lockup transaction of Reverse Swap ${
        reverseSwap.id
      } confirmed: ${transaction.getId()}`,
    );

    chainClient.removeOutputFilter(
      wallet.decodeAddress(reverseSwap.lockupAddress),
    );
    this.emit('reverseSwap.lockup.confirmed', {
      transaction,
      reverseSwap: await ReverseSwapRepository.setReverseSwapStatus(
        reverseSwap,
        SwapUpdateEvent.TransactionConfirmed,
      ),
    });
  };

  private checkSwapTransaction = async (
    swap: Swap,
    chainClient: ChainClient,
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

    this.logger.verbose(
      `Found ${confirmed ? '' : 'un'}confirmed ${wallet.symbol} lockup transaction for Swap ${
        swap.id
      }: ${transaction.getId()}:${swapOutput.vout}`,
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
    }

    const prevAddreses = await this.getPreviousAddresses(
      transaction,
      chainClient,
      wallet,
    );
    if (prevAddreses.some(this.blocks.isBlocked)) {
      this.emit('swap.lockup.failed', {
        swap: updatedSwap,
        reason: Errors.BLOCKED_ADDRESS().message,
      });
      return;
    }

    // Confirmed transactions do not have to be checked for 0-conf criteria
    if (!confirmed) {
      if (updatedSwap.acceptZeroConf !== true) {
        this.emit('swap.lockup.zeroconf.rejected', {
          transaction,
          swap: updatedSwap,
          reason: Errors.SWAP_DOES_NOT_ACCEPT_ZERO_CONF().message,
        });
        return;
      }

      const signalsRBF = await this.transactionSignalsRbf(
        chainClient,
        transaction,
      );

      if (signalsRBF) {
        this.emit('swap.lockup.zeroconf.rejected', {
          transaction,
          swap: updatedSwap,
          reason: Errors.LOCKUP_TRANSACTION_SIGNALS_RBF().message,
        });
        return;
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
        this.emit('swap.lockup.zeroconf.rejected', {
          transaction,
          swap: updatedSwap,
          reason: Errors.LOCKUP_TRANSACTION_FEE_TOO_LOW().message,
        });
        return;
      }

      this.logger.debug(
        `Accepted 0-conf lockup transaction for Swap ${
          updatedSwap.id
        }: ${transaction.getId()}:${swapOutput.vout}`,
      );
    }

    chainClient.removeOutputFilter(swapOutput.script);

    this.emit('swap.lockup', { transaction, confirmed, swap: updatedSwap });
  };

  /**
   * Detects whether the transaction signals RBF explicitly or inherently
   */
  private transactionSignalsRbf = async (
    chainClient: ChainClient,
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

      if (!inputTransaction.confirmations) {
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

  private getPreviousAddresses = async (
    transaction: Transaction | LiquidTransaction,
    chainClient: ChainClient,
    wallet: Wallet,
  ) => {
    const inputTxsIds = this.chunkArray(
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

  private getTransactions = async (chainClient: ChainClient, ids: string[]) => {
    const txs: string[] = [];

    for (const id of ids) {
      txs.push(await chainClient.getRawTransaction(id));
    }

    return txs;
  };

  private chunkArray = <T>(array: T[], size: number) => {
    const chunks: T[][] = Array.from({ length: size }, () => []);

    for (let i = 0; i < array.length; i++) {
      chunks[i % size].push(array[i]);
    }

    return chunks.filter((chunk) => chunk.length !== 0);
  };
}

export default UtxoNursery;
