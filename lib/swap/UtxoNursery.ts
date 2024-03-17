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
import ChainSwap from '../db/models/ChainSwap';
import ReverseSwap from '../db/models/ReverseSwap';
import Swap from '../db/models/Swap';
import ChainSwapRepository, {
  ChainSwapInfo,
} from '../db/repositories/ChainSwapRepository';
import ReverseSwapRepository from '../db/repositories/ReverseSwapRepository';
import SwapRepository from '../db/repositories/SwapRepository';
import Blocks from '../service/Blocks';
import Wallet from '../wallet/Wallet';
import WalletLiquid from '../wallet/WalletLiquid';
import WalletManager, { Currency } from '../wallet/WalletManager';
import Errors from './Errors';

// TODO: chain swap expiries

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

  // Chain swap
  'chain.lockup': {
    swap: ChainSwapInfo;
    transaction: Transaction | LiquidTransaction;
    confirmed: boolean;
  };
  'chain.lockup.failed': {
    swap: ChainSwapInfo;
    reason: string;
  };
  'chain.lockup.zeroconf.rejected': {
    swap: ChainSwapInfo;
    transaction: Transaction | LiquidTransaction;
    reason: string;
  };
  'chain.claimed': {
    swap: ChainSwapInfo;
    preimage: Buffer;
  };
}> {
  private static readonly maxParallelRequests = 6;

  // Locks
  private lock = new AsyncLock();

  private static lockupLock = 'lockupLock';
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
        this.checkOutputs(chainClient, wallet, transaction, confirmed),

        this.checkSwapClaims(chainClient, transaction),

        // TODO: chain swaps
        this.checkReverseSwapLockupsConfirmed(
          chainClient,
          wallet,
          transaction,
          confirmed,
        ),
      ]);
    });
  };

  private checkOutputs = async (
    chainClient: ChainClient,
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
    };

    const checkChainSwap = async (script: Buffer, address: string) => {
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

      if (
        !swap ||
        wallet.symbol !== swap.receivingData.symbol ||
        !wallet.decodeAddress(swap.receivingData.lockupAddress).equals(script)
      ) {
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

        await Promise.all([
          checkSwap(address),
          checkChainSwap(output.script, address),
        ]);
      }
    });
  };

  private checkSwapClaims = async (
    chainClient: ChainClient,
    transaction: Transaction | LiquidTransaction,
  ) => {
    for (let vin = 0; vin < transaction.ins.length; vin += 1) {
      const input = transaction.ins[vin];
      const transactionId = transactionHashToId(input.hash);

      await Promise.all([
        this.checkReverseSwapClaim(
          chainClient,
          transaction,
          vin,
          transactionId,
          input.hash,
        ),
        this.checkChainSwapClaim(
          chainClient,
          transaction,
          vin,
          transactionId,
          input.hash,
        ),
      ]);
    }
  };

  private checkReverseSwapClaim = async (
    chainClient: ChainClient,
    transaction: Transaction | LiquidTransaction,
    inputIndex: number,
    inputTransactionId: string,
    inputTransactionHash: Buffer,
  ) => {
    const reverseSwap = await ReverseSwapRepository.getReverseSwap({
      status: {
        [Op.or]: [
          SwapUpdateEvent.TransactionMempool,
          SwapUpdateEvent.TransactionConfirmed,
        ],
      },
      transactionVout: inputIndex,
      transactionId: inputTransactionId,
    });

    if (!reverseSwap) {
      return;
    }

    this.logger.verbose(
      `Found ${chainClient.symbol} claim transaction of Reverse Swap ${
        reverseSwap.id
      }: ${transaction.getId()}`,
    );

    chainClient.removeInputFilter(inputTransactionHash);
    this.emit('reverseSwap.claimed', {
      reverseSwap,
      preimage: detectPreimage(inputIndex, transaction),
    });
  };

  private checkChainSwapClaim = async (
    chainClient: ChainClient,
    transaction: Transaction | LiquidTransaction,
    inputIndex: number,
    inputTransactionId: string,
    inputTransactionHash: Buffer,
  ) => {
    const swap = await ChainSwapRepository.getChainSwapByData(
      {
        transactionVout: inputIndex,
        transactionId: inputTransactionId,
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

    chainClient.removeInputFilter(inputTransactionHash);
    this.emit('chain.claimed', {
      swap,
      preimage: detectPreimage(inputIndex, transaction),
    });
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
        this.checkUserLockupsInMempool(chainClient, wallet),

        // TODO: chain swaps
        this.checkReverseSwapMempoolTransactions(chainClient, wallet),

        this.checkExpiredSwaps(chainClient, height),
        this.checkExpiredReverseSwaps(chainClient, height),
      ]);
    });
  };

  private checkUserLockupsInMempool = async (
    chainClient: ChainClient,
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
            `Could not find lockup transaction of Swap ${swap.id}: ${swap.lockupTransactionId}`,
          );
        }
      }
    };

    const checkChainSwapLockups = async () => {
      const mempoolSwaps = await ChainSwapRepository.getChainSwaps({
        status: {
          [Op.or]: [
            SwapUpdateEvent.TransactionMempool,
            SwapUpdateEvent.TransactionZeroConfRejected,
          ],
        },
      });

      for (const swap of mempoolSwaps) {
        if (swap.receivingData.symbol !== chainClient.symbol) {
          continue;
        }

        try {
          const lockupTransaction = await chainClient.getRawTransactionVerbose(
            swap.receivingData.transactionId!,
          );

          if (
            lockupTransaction.confirmations &&
            lockupTransaction.confirmations !== 0
          ) {
            await this.checkChainSwapTransaction(
              swap,
              chainClient,
              wallet,
              parseTransaction(wallet.type, lockupTransaction.hex),
              true,
            );
          }
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

  private checkChainSwapTransaction = async (
    swap: ChainSwapInfo,
    chainClient: ChainClient,
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
      swap.chainSwap,
      true,
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
      this.emit('chain.lockup.failed', {
        swap,
        reason: Errors.INSUFFICIENT_AMOUNT(
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
      this.emit('chain.lockup.failed', {
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
        this.emit('chain.lockup.zeroconf.rejected', {
          swap,
          transaction,
          reason: zeroConfRejectedReason,
        });
        return;
      }

      this.logZeroConfAccepted(swap.chainSwap, transaction, swapOutput);
    }

    chainClient.removeOutputFilter(swapOutput.script);
    this.emit('chain.lockup', { swap, transaction, confirmed });
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

    this.logFoundTransaction(
      wallet.symbol,
      swap,
      false,
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

  private acceptsZeroConf = async (
    swap: Swap | ChainSwap,
    chainClient: ChainClient,
    transaction: Transaction | LiquidTransaction,
  ) => {
    if (swap.acceptZeroConf !== true) {
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

  private logFoundTransaction = (
    symbol: string,
    swap: Swap | ChainSwap,
    isChainSwap: boolean,
    confirmed: boolean,
    transaction: Transaction | LiquidTransaction,
    swapOutput: ReturnType<typeof detectSwap>,
  ) =>
    this.logger.verbose(
      `Found ${confirmed ? '' : 'un'}confirmed ${symbol} lockup transaction for ${isChainSwap ? 'Chain ' : ''}Swap ${
        swap.id
      }: ${transaction.getId()}:${swapOutput.vout}`,
    );

  private logZeroConfAccepted = (
    swap: Swap | ChainSwap,
    transaction: Transaction | LiquidTransaction,
    swapOutput: ReturnType<typeof detectSwap>,
  ) =>
    this.logger.debug(
      `Accepted 0-conf lockup transaction for Swap ${
        swap.id
      }: ${transaction.getId()}:${swapOutput.vout}`,
    );
}

export default UtxoNursery;
