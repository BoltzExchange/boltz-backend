import AsyncLock from 'async-lock';
import type { Transaction } from 'bitcoinjs-lib';
import { SwapTreeSerializer, detectPreimage, detectSwap } from 'boltz-core';
import type { Transaction as LiquidTransaction } from 'liquidjs-lib';
import { Op } from 'sequelize';
import {
  calculateTransactionFee,
  createMusig,
  getOutputValue,
  parseTransaction,
  tweakMusig,
} from '../Core';
import type Logger from '../Logger';
import {
  formatError,
  getChainCurrency,
  getHexBuffer,
  isTxConfirmed,
  splitPairId,
  transactionHashToId,
  transactionSignalsRbfExplicitly,
} from '../Utils';
import type { IChainClient } from '../chain/ChainClient';
import ElementsClient from '../chain/ElementsClient';
import ElementsWrapper from '../chain/ElementsWrapper';
import {
  SwapUpdateEvent,
  SwapVersion,
  swapTypeToPrettyString,
} from '../consts/Enums';
import TypedEventEmitter from '../consts/TypedEventEmitter';
import type ReverseSwap from '../db/models/ReverseSwap';
import type Swap from '../db/models/Swap';
import type { ChainSwapInfo } from '../db/repositories/ChainSwapRepository';
import ChainSwapRepository from '../db/repositories/ChainSwapRepository';
import RefundTransactionRepository from '../db/repositories/RefundTransactionRepository';
import ReverseSwapRepository from '../db/repositories/ReverseSwapRepository';
import SwapRepository from '../db/repositories/SwapRepository';
import type LockupTransactionTracker from '../rates/LockupTransactionTracker';
import type Sidecar from '../sidecar/Sidecar';
import { TransactionStatus } from '../sidecar/Sidecar';
import type Wallet from '../wallet/Wallet';
import type { Currency } from '../wallet/WalletManager';
import type WalletManager from '../wallet/WalletManager';
import Errors from './Errors';
import type OverpaymentProtector from './OverpaymentProtector';
import { Action } from './hooks/CreationHook';
import type TransactionHook from './hooks/TransactionHook';

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
  private static lockupLock = 'lockupLock';
  private static swapLockupConfirmationLock = 'swapLockupConfirmation';

  private lock = new AsyncLock();

  constructor(
    private readonly logger: Logger,
    private readonly sidecar: Sidecar,
    private readonly walletManager: WalletManager,
    private readonly lockupTransactionTracker: LockupTransactionTracker,
    private readonly transactionHook: TransactionHook,
    private readonly overpaymentProtector: OverpaymentProtector,
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

  public checkChainSwapTransaction = async (
    swap: ChainSwapInfo,
    chainClient: IChainClient,
    wallet: Wallet,
    transaction: Transaction | LiquidTransaction,
    status: TransactionStatus,
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
      status === TransactionStatus.Confirmed,
      transaction,
      swapOutput,
    );

    const outputValue = getOutputValue(wallet, swapOutput);
    swap = await ChainSwapRepository.setUserLockupTransaction(
      swap,
      transaction.getId(),
      outputValue,
      status === TransactionStatus.Confirmed,
      swapOutput.vout,
    );

    if (swap.receivingData.expectedAmount > outputValue || outputValue === 0) {
      let reason: string;

      if (outputValue === 0) {
        reason = Errors.INCORRECT_ASSET_SENT().message;
      } else {
        reason = Errors.INSUFFICIENT_AMOUNT(
          outputValue,
          swap.receivingData.expectedAmount,
        ).message;
      }

      this.emit('chainSwap.lockup.failed', {
        swap,
        reason,
      });

      return;
    }

    if (
      this.overpaymentProtector.isUnacceptableOverpay(
        swap.type,
        swap.receivingData.expectedAmount,
        outputValue,
      )
    ) {
      this.emit('chainSwap.lockup.failed', {
        swap,
        reason: Errors.OVERPAID_AMOUNT(
          outputValue,
          swap.receivingData.expectedAmount,
        ).message,
      });

      return;
    }

    {
      const action = await this.transactionHook.hook(
        swap.id,
        wallet.symbol,
        transaction.getId(),
        transaction.toBuffer(),
        status === TransactionStatus.Confirmed,
        swap.type,
        swapOutput.vout,
      );

      switch (action) {
        case Action.Hold:
          this.logHoldingTransaction(
            wallet.symbol,
            swap,
            transaction,
            swapOutput,
          );
          return;

        case Action.Reject:
          this.emit('chainSwap.lockup.failed', {
            swap,
            reason: Errors.BLOCKED_ADDRESS().message,
          });
          return;
      }
    }

    if (status !== TransactionStatus.Confirmed) {
      const zeroConfRejectedReason = await this.acceptsZeroConf(
        swap,
        chainClient,
        transaction,
        status,
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
    }

    this.emit('chainSwap.lockup', {
      swap,
      transaction,
      confirmed: status === TransactionStatus.Confirmed,
    });
  };

  private listenTransactions = (chainClient: IChainClient, wallet: Wallet) => {
    // Transaction updates come from the Rust sidecar via the TransactionFound stream
    // Manual checkTransaction calls also go through the sidecar and emit via this stream
    this.sidecar.on('transaction', async (event) => {
      if (event.symbol !== chainClient.symbol) {
        return;
      }

      await Promise.all([
        this.checkSwapClaims(chainClient, event.transaction),
        this.checkOutputs(chainClient, wallet, event.transaction, event.status),
      ]);
    });
  };

  private checkOutputs = async (
    chainClient: IChainClient,
    wallet: Wallet,
    transaction: Transaction | LiquidTransaction,
    status: TransactionStatus,
  ) => {
    const checkSwap = async (address: string) => {
      const swap = await SwapRepository.getSwap({
        status: {
          [Op.or]: [
            SwapUpdateEvent.SwapCreated,
            SwapUpdateEvent.InvoiceSet,
            SwapUpdateEvent.TransactionMempool,
            SwapUpdateEvent.TransactionZeroConfRejected,
            SwapUpdateEvent.TransactionConfirmed,
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
        status,
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
              SwapUpdateEvent.TransactionLockupFailed,
              SwapUpdateEvent.TransactionZeroConfRejected,
              SwapUpdateEvent.TransactionConfirmed,
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
        status,
      );
    };

    await this.lock.acquire(UtxoNursery.lockupLock, async () => {
      for (let vout = 0; vout < transaction.outs.length; vout += 1) {
        const output = transaction.outs[vout];
        const encoded = wallet.encodeAddress(output.script);

        await Promise.all([checkSwap(encoded), checkChainSwap(encoded)]);
      }
    });
  };

  private checkSwapClaims = async (
    chainClient: IChainClient,
    transaction: Transaction | LiquidTransaction,
  ) => {
    {
      const refundTx = await RefundTransactionRepository.getTransaction(
        transaction.getId(),
      );
      if (refundTx !== null && refundTx !== undefined) {
        this.logger.debug(
          `Not scanning ${chainClient.symbol} transaction ${transaction.getId()} for claims because it is our refund transaction`,
        );
        return;
      }
    }

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
          SwapUpdateEvent.TransactionRefunded,
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
            SwapUpdateEvent.TransactionRefunded,
          ],
        },
      },
    );
    if (swap === null) {
      return;
    }

    if (transaction.ins[inputIndex].witness.length !== 4) {
      this.logger.debug(
        `Not scanning ${chainClient.symbol} transaction ${transaction.getId()} for claims because it is a cooperative claim or refund transaction`,
      );
      return;
    }

    this.logger.verbose(
      `Found ${chainClient.symbol} claim transaction of Chain Swap ${
        swap.chainSwap.id
      }: ${transaction.getId()}`,
    );

    this.emit('chainSwap.claimed', {
      swap,
      preimage: swap.preimage
        ? getHexBuffer(swap.preimage)
        : detectPreimage(inputIndex, transaction),
    });
  };

  private listenBlocks = (chainClient: IChainClient, wallet: Wallet) => {
    this.sidecar.on('block', async ({ symbol, height }) => {
      if (symbol !== chainClient.symbol) {
        return;
      }

      await Promise.all([
        this.checkServerLockupMempoolTransactions(chainClient, wallet),

        this.checkExpiredSwaps(chainClient, height),
        this.checkExpiredReverseSwaps(chainClient, height),
        this.checkExpiredChainSwaps(chainClient, height),
      ]);
    });
  };

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
      this.emit('chainSwap.expired', swap);
    }
  };

  private serverLockupConfirmed = async (
    swap: ReverseSwap | ChainSwapInfo,
    transaction: Transaction | LiquidTransaction,
  ) => {
    this.logger.debug(
      `Server lockup transaction of ${swapTypeToPrettyString(swap.type)} Swap ${
        swap.id
      } confirmed: ${transaction.getId()}`,
    );

    this.emit('server.lockup.confirmed', {
      swap,
      transaction,
    });
  };

  private checkSwapTransaction = async (
    swap: Swap,
    chainClient: IChainClient,
    wallet: Wallet,
    transaction: Transaction | LiquidTransaction,
    status: TransactionStatus,
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
      status === TransactionStatus.Confirmed,
      transaction,
      swapOutput,
    );

    const outputValue = getOutputValue(wallet, swapOutput);
    const updatedSwap = await SwapRepository.setLockupTransaction(
      swap,
      transaction.getId(),
      outputValue,
      status === TransactionStatus.Confirmed,
      swapOutput.vout,
    );

    if (updatedSwap.expectedAmount) {
      if (updatedSwap.expectedAmount > outputValue) {
        let reason: string;

        if (outputValue === 0) {
          reason = Errors.INCORRECT_ASSET_SENT().message;
        } else {
          reason = Errors.INSUFFICIENT_AMOUNT(
            outputValue,
            updatedSwap.expectedAmount,
          ).message;
        }

        this.emit('swap.lockup.failed', {
          reason,
          swap: updatedSwap,
        });

        return;
      }

      if (
        this.overpaymentProtector.isUnacceptableOverpay(
          swap.type,
          updatedSwap.expectedAmount,
          outputValue,
        )
      ) {
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

    {
      const action = await this.transactionHook.hook(
        swap.id,
        wallet.symbol,
        transaction.getId(),
        transaction.toBuffer(),
        status === TransactionStatus.Confirmed,
        swap.type,
        swapOutput.vout,
      );

      switch (action) {
        case Action.Hold:
          this.logHoldingTransaction(
            wallet.symbol,
            updatedSwap,
            transaction,
            swapOutput,
          );
          return;

        case Action.Reject:
          this.emit('swap.lockup.failed', {
            swap: updatedSwap,
            reason: Errors.BLOCKED_ADDRESS().message,
          });
          return;
      }
    }

    // Confirmed transactions do not have to be checked for 0-conf criteria
    if (status !== TransactionStatus.Confirmed) {
      const zeroConfRejectedReason = await this.acceptsZeroConf(
        updatedSwap,
        chainClient,
        transaction,
        status,
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

    this.emit('swap.lockup', {
      transaction,
      confirmed: status === TransactionStatus.Confirmed,
      swap: updatedSwap,
    });
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
    swap: Swap | ChainSwapInfo,
    chainClient: IChainClient,
    transaction: Transaction | LiquidTransaction,
    status: TransactionStatus,
  ) => {
    if (status === TransactionStatus.NotSafe) {
      return Errors.SWAP_DOES_NOT_ACCEPT_ZERO_CONF().message;
    }

    if (
      swap.acceptZeroConf !== true ||
      !this.lockupTransactionTracker.zeroConfAccepted(chainClient.symbol)
    ) {
      return Errors.SWAP_DOES_NOT_ACCEPT_ZERO_CONF().message;
    }

    if (await this.transactionSignalsRbf(chainClient, transaction)) {
      return Errors.LOCKUP_TRANSACTION_SIGNALS_RBF().message;
    }

    // Check if the transaction has a fee high enough to be confirmed in a timely manner
    const [feeEstimation, absoluteTransactionFee] = await Promise.all([
      chainClient.estimateFee(),
      calculateTransactionFee(chainClient, transaction),
    ]);

    const transactionFeePerVbyte =
      absoluteTransactionFee / transaction.virtualSize(true);

    // If the transaction fee is less than 80% of the estimation, Boltz will wait for a confirmation
    //
    // Special case: if the fee estimation is at the lowest possible (fee floor),
    // every fee paid by the transaction will be accepted
    if (
      transactionFeePerVbyte / feeEstimation < 0.8 &&
      feeEstimation !== chainClient.feeFloor
    ) {
      return Errors.LOCKUP_TRANSACTION_FEE_TOO_LOW().message;
    }

    // Make sure all clients accept the transaction
    if (
      chainClient.symbol === ElementsClient.symbol &&
      !ElementsClient.needsLowball(transaction as LiquidTransaction)
    ) {
      if (chainClient instanceof ElementsWrapper) {
        const wrapper = chainClient as ElementsWrapper;

        try {
          await wrapper.sendRawTransactionAll(transaction.toHex());
        } catch (e) {
          this.logger.debug(
            `Rejecting 0-conf for ${chainClient.symbol} lockup transaction ${transaction.getId()} of ${swapTypeToPrettyString(swap.type)} ${swap.id} because not all nodes accept it: ${formatError(e)}`,
          );
          return Errors.SWAP_DOES_NOT_ACCEPT_ZERO_CONF().message;
        }
      }
    }

    if (
      !(await this.lockupTransactionTracker.isAcceptable(
        swap,
        transaction.toHex(),
      ))
    ) {
      return Errors.SWAP_DOES_NOT_ACCEPT_ZERO_CONF().message;
    }

    return undefined;
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

  private logHoldingTransaction = (
    symbol: string,
    swap: Swap | ChainSwapInfo,
    transaction: Transaction | LiquidTransaction,
    swapOutput: ReturnType<typeof detectSwap>,
  ) =>
    this.logger.warn(
      `Holding ${symbol} lockup transaction for ${swapTypeToPrettyString(swap.type)} Swap ${
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
}

export default UtxoNursery;
