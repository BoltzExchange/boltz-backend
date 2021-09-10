import { Op } from 'sequelize';
import AsyncLock from 'async-lock';
import { EventEmitter } from 'events';
import { Transaction } from 'bitcoinjs-lib';
import { detectPreimage, detectSwap } from 'boltz-core';
import Errors from './Errors';
import Logger from '../Logger';
import Swap from '../db/models/Swap';
import Wallet from '../wallet/Wallet';
import ChainClient from '../chain/ChainClient';
import SwapRepository from '../db/repositories/SwapRepository';
import { SwapUpdateEvent } from '../consts/Enums';
import ReverseSwap from '../db/models/ReverseSwap';
import ReverseSwapRepository from '../db/repositories/ReverseSwapRepository';
import WalletManager, { Currency } from '../wallet/WalletManager';
import {
  calculateUtxoTransactionFee,
  getChainCurrency,
  getHexBuffer,
  reverseBuffer,
  splitPairId,
  transactionHashToId,
  transactionSignalsRbfExplicitly
} from '../Utils';

interface UtxoNursery {
  // Swap
  on(event: 'swap.expired', listener: (swap: Swap) => void): this;
  emit(event: 'swap.expired', swap: Swap);

  on(event: 'swap.lockup.failed', listener: (swap: Swap, reason: string) => void): this;
  emit(event: 'swap.lockup.failed', swap: Swap, reason: string): boolean;

  on(event: 'swap.lockup.zeroconf.rejected', listener: (swap: Swap, transaction: Transaction, reason: string) => void): this;
  emit(event: 'swap.lockup.zeroconf.rejected', swap: Swap, transaction: Transaction, reason: string): boolean;

  on(event: 'swap.lockup', listener: (swap: Swap, transaction: Transaction, confirmed: boolean) => void): this;
  emit(event: 'swap.lockup', swap: Swap, transaction: Transaction, confirmed: boolean): boolean;

  // Reverse Swap
  on(event: 'reverseSwap.expired', listener: (reverseSwap: ReverseSwap) => void): this;
  emit(event: 'reverseSwap.expired', reverseSwap: ReverseSwap);

  on(event: 'reverseSwap.lockup.confirmed', listener: (reverseSwap: ReverseSwap, transaction: Transaction) => void): this;
  emit(event: 'reverseSwap.lockup.confirmed', reverseSwap: ReverseSwap, transaction: Transaction): boolean;

  on(event: 'reverseSwap.claimed', listener: (reverseSwap: ReverseSwap, preimage: Buffer) => void): this;
  emit(event: 'reverseSwap.claimed', reverseSwap: ReverseSwap, preimage: Buffer): boolean;
}

class UtxoNursery extends EventEmitter {
  // Locks
  private lock = new AsyncLock();

  private static swapLockupLock = 'swapLockupLock';
  private static reverseSwapLockupConfirmationLock = 'reverseSwapLockupConfirmation';

  constructor(
    private logger: Logger,
    private walletManager: WalletManager,
    private swapRepository: SwapRepository,
    private reverseSwapRepository: ReverseSwapRepository,
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
  }

  private listenTransactions = (chainClient: ChainClient, wallet: Wallet) => {
    chainClient.on('transaction', async (transaction, confirmed) => {
      await Promise.all([
        this.checkSwapOutputs(chainClient, wallet, transaction, confirmed),

        this.checkReverseSwapClaims(chainClient, transaction),
        this.checkReverseSwapLockupsConfirmed(chainClient, wallet, transaction, confirmed),
      ]);
    });
  }

  private checkSwapOutputs = async (chainClient: ChainClient, wallet: Wallet, transaction: Transaction, confirmed: boolean) => {
    await this.lock.acquire(UtxoNursery.swapLockupLock, async () => {
      for (let vout = 0; vout < transaction.outs.length; vout += 1) {
        const output = transaction.outs[vout];

        const swap = await this.swapRepository.getSwap({
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

        await this.checkSwapTransaction(swap, chainClient, transaction, confirmed);
      }
    });
  }

  private checkReverseSwapClaims = async (chainClient: ChainClient, transaction: Transaction) => {
    for (let vin = 0; vin < transaction.ins.length; vin += 1) {
      const input = transaction.ins[vin];

      const reverseSwap = await this.reverseSwapRepository.getReverseSwap({
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

      this.logger.verbose(`Found claim transaction of Reverse Swap ${reverseSwap.id}: ${transaction.getId()}`);

      chainClient.removeInputFilter(input.hash);
      this.emit('reverseSwap.claimed', reverseSwap, detectPreimage(vin, transaction));
    }
  }

  private checkReverseSwapLockupsConfirmed = async (chainClient: ChainClient, wallet: Wallet, transaction: Transaction, confirmed: boolean) => {
    await this.lock.acquire(UtxoNursery.reverseSwapLockupConfirmationLock, async () => {
      if (!confirmed) {
        return;
      }

      const reverseSwap = await this.reverseSwapRepository.getReverseSwap({
        status: SwapUpdateEvent.TransactionMempool,
        transactionId: transaction.getId(),
      });

      if (reverseSwap) {
        await this.reverseSwapLockupConfirmed(chainClient, wallet, reverseSwap, transaction);
      }
    });
  }

  private listenBlocks = (chainClient: ChainClient, wallet: Wallet) => {
    chainClient.on('block', async (height) => {
      await Promise.all([
        this.checkSwapMempoolTransactions(chainClient),
        this.checkReverseSwapMempoolTransactions(chainClient, wallet),

        this.checkExpiredSwaps(chainClient, height),
        this.checkExpiredReverseSwaps(chainClient, height),
      ]);
    });
  }

  private checkSwapMempoolTransactions = async (chainClient: ChainClient) => {
    await this.lock.acquire(UtxoNursery.swapLockupLock, async () => {
      const mempoolSwaps = await this.swapRepository.getSwaps({
        status: {
          [Op.or]: [
            SwapUpdateEvent.TransactionMempool,
            SwapUpdateEvent.TransactionZeroConfRejected,
          ],
        },
      });

      for (const swap of mempoolSwaps) {
        const { base, quote } = splitPairId(swap.pair);
        const chainCurrency = getChainCurrency(base, quote, swap.orderSide, false);

        if (chainCurrency !== chainClient.symbol) {
          continue;
        }

        const lockupTransaction = await chainClient.getRawTransactionVerbose(swap.lockupTransactionId!);

        if (lockupTransaction.confirmations && lockupTransaction.confirmations !== 0) {
          await this.checkSwapTransaction(swap, chainClient, Transaction.fromHex(lockupTransaction.hex), true);
        }
      }
    });
  }

  // This method is a fallback for "checkReverseSwapLockupsConfirmed" because that method sometimes misses transactions on mainnet for an unknown reason
  private checkReverseSwapMempoolTransactions = async (chainClient: ChainClient, wallet: Wallet) => {
    await this.lock.acquire(UtxoNursery.reverseSwapLockupConfirmationLock, async () => {
      const mempoolReverseSwaps = await this.reverseSwapRepository.getReverseSwaps({
        status: SwapUpdateEvent.TransactionMempool,
      });

      for (const reverseSwap of mempoolReverseSwaps) {
        const { base, quote } = splitPairId(reverseSwap.pair);
        const chainCurrency = getChainCurrency(base, quote, reverseSwap.orderSide, true);

        if (chainCurrency !== chainClient.symbol) {
          continue;
        }

        const transaction = await chainClient.getRawTransactionVerbose(reverseSwap.transactionId!);

        if (transaction.confirmations && transaction.confirmations !== 0) {
          await this.reverseSwapLockupConfirmed(chainClient, wallet, reverseSwap, Transaction.fromHex(transaction.hex));
        }
      }
    });
  }


  private checkExpiredSwaps = async (chainClient: ChainClient, height: number) => {
    const expirableSwaps = await this.swapRepository.getSwapsExpirable(height);

    for (const expirableSwap of expirableSwaps) {
      const { base, quote } = splitPairId(expirableSwap.pair);
      const chainCurrency = getChainCurrency(base, quote, expirableSwap.orderSide, false);

      if (chainCurrency === chainClient.symbol) {
        const wallet = this.walletManager.wallets.get(chainCurrency)!;
        chainClient.removeOutputFilter(wallet.decodeAddress(expirableSwap.lockupAddress));

        this.emit('swap.expired', expirableSwap);
      }
    }
  }

  private checkExpiredReverseSwaps = async (chainClient: ChainClient, height: number) => {
    const expirableReverseSwaps = await this.reverseSwapRepository.getReverseSwapsExpirable(height);

    for (const expirableReverseSwap of expirableReverseSwaps) {
      const { base, quote } = splitPairId(expirableReverseSwap.pair);
      const chainCurrency = getChainCurrency(base, quote, expirableReverseSwap.orderSide, true);

      if (chainCurrency === chainClient.symbol) {
        const wallet = this.walletManager.wallets.get(chainCurrency)!;
        chainClient.removeOutputFilter(wallet.decodeAddress(expirableReverseSwap.lockupAddress));

        if (expirableReverseSwap.transactionId) {
          chainClient.removeInputFilter(reverseBuffer(getHexBuffer(expirableReverseSwap.transactionId)));
        }

        this.emit('reverseSwap.expired', expirableReverseSwap);
      }
    }
  }

  private reverseSwapLockupConfirmed = async (chainClient: ChainClient, wallet: Wallet, reverseSwap: ReverseSwap, transaction: Transaction) => {
    this.logger.debug(`Lockup transaction of Reverse Swap ${reverseSwap.id} confirmed: ${transaction.getId()}`);

    chainClient.removeOutputFilter(wallet.decodeAddress(reverseSwap.lockupAddress));
    this.emit(
      'reverseSwap.lockup.confirmed',
      await this.reverseSwapRepository.setReverseSwapStatus(reverseSwap, SwapUpdateEvent.TransactionConfirmed),
      transaction,
    );
  }

  private checkSwapTransaction = async (swap: Swap, chainClient: ChainClient, transaction: Transaction, confirmed: boolean) => {
    this.logger.verbose(`Found ${confirmed ? '' : 'un'}confirmed lockup transaction for Swap ${swap.id}: ${transaction.getId()}`);

    const swapOutput = detectSwap(getHexBuffer(swap.redeemScript!), transaction)!;

    const updatedSwap = await this.swapRepository.setLockupTransaction(
      swap,
      transaction.getId(),
      swapOutput.value,
      confirmed,
      swapOutput.vout,
    );

    if (updatedSwap.expectedAmount) {
      if (updatedSwap.expectedAmount > swapOutput.value) {
        chainClient.removeOutputFilter(swapOutput.script);
        this.emit('swap.lockup.failed', updatedSwap, Errors.INSUFFICIENT_AMOUNT(swapOutput.value, updatedSwap.expectedAmount).message);

        return;
      }
    }

    // Confirmed transactions do not have to be checked for 0-conf criteria
    if (!confirmed) {
      if (updatedSwap.acceptZeroConf !== true) {
        this.emit('swap.lockup.zeroconf.rejected', updatedSwap, transaction, Errors.SWAP_DOES_NOT_ACCEPT_ZERO_CONF().message);
        return;
      }

      const signalsRBF = await this.transactionSignalsRbf(chainClient, transaction);

      if (signalsRBF) {
        this.emit('swap.lockup.zeroconf.rejected', updatedSwap, transaction, Errors.LOCKUP_TRANSACTION_SIGNALS_RBF().message);
        return;
      }

      // Check if the transaction has a fee high enough to be confirmed in a timely manner
      const feeEstimation = await chainClient.estimateFee();

      const absoluteTransactionFee = await calculateUtxoTransactionFee(chainClient, transaction);
      const transactionFeePerVbyte = absoluteTransactionFee / transaction.virtualSize();

      // If the transaction fee is less than 80% of the estimation, Boltz will wait for a confirmation
      //
      // Special case: if the fee estimation is the lowest possible of 2 sat/vbyte,
      // every fee paid by the transaction will be accepted
      if (
        transactionFeePerVbyte / feeEstimation < 0.8 &&
        feeEstimation !== 2
      ) {
        this.emit('swap.lockup.zeroconf.rejected', updatedSwap, transaction, Errors.LOCKUP_TRANSACTION_FEE_TOO_LOW().message);
        return;
      }

      this.logger.debug(`Accepted 0-conf lockup transaction for Swap ${updatedSwap.id}: ${transaction.getId()}`);
    }

    chainClient.removeOutputFilter(swapOutput.script);

    this.emit('swap.lockup', updatedSwap, transaction, confirmed);
  }

  /**
   * Detects whether the transaction signals RBF explicitly or inherently
   */
  private transactionSignalsRbf = async (chainClient: ChainClient, transaction: Transaction) => {
    // Check for explicit signalling
    if (transactionSignalsRbfExplicitly(transaction)) {
      return true;
    }

    // Check for inherited signalling from unconfirmed inputs
    for (const input of transaction.ins) {
      const inputId = transactionHashToId(input.hash);
      const inputTransaction = await chainClient.getRawTransactionVerbose(inputId);

      if (!inputTransaction.confirmations) {
        const inputSignalsRbf = await this.transactionSignalsRbf(
          chainClient,
          Transaction.fromHex(inputTransaction.hex),
        );

        if (inputSignalsRbf) {
          return true;
        }
      }
    }

    return false;
  }
}

export default UtxoNursery;
