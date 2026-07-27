import type { TransactionResponse } from 'ethers';
import { Transaction } from 'ethers';
import { Op } from 'sequelize';
import InstrumentedLock from '../InstrumentedLock';
import type Logger from '../Logger';
import {
  formatError,
  getChainCurrency,
  getHexBuffer,
  getHexString,
  removeHexPrefix,
  splitPairId,
} from '../Utils';
import { etherDecimals } from '../consts/Consts';
import {
  CurrencyType,
  SwapType,
  SwapUpdateEvent,
  swapTypeToPrettyString,
} from '../consts/Enums';
import TypedEventEmitter from '../consts/TypedEventEmitter';
import type { ERC20SwapValues, EtherSwapValues } from '../consts/Types';
import type { LockupIdentity, LockupTarget } from '../db/LockupIdentity';
import { LockupWriteOutcome, formatLockupIdentity } from '../db/LockupIdentity';
import type ReverseSwap from '../db/models/ReverseSwap';
import type Swap from '../db/models/Swap';
import type {
  ChainSwapInfo,
  UserLockupTransactionOptions,
} from '../db/repositories/ChainSwapRepository';
import ChainSwapRepository from '../db/repositories/ChainSwapRepository';
import ClaimTransactionRepository from '../db/repositories/ClaimTransactionRepository';
import ReverseSwapRepository from '../db/repositories/ReverseSwapRepository';
import SwapRepository from '../db/repositories/SwapRepository';
import type Wallet from '../wallet/Wallet';
import type WalletManager from '../wallet/WalletManager';
import type EthereumManager from '../wallet/ethereum/EthereumManager';
import type ERC20WalletProvider from '../wallet/providers/ERC20WalletProvider';
import {
  getLockupIdentity,
  shouldIgnoreCompetingLockup,
} from './CompetingLockup';
import Errors from './Errors';
import EthereumTransactionConfirmationTracker from './EthereumConfirmationTracker';
import type OverpaymentProtector from './OverpaymentProtector';
import { Action } from './hooks/CreationHook';
import type TransactionHook from './hooks/TransactionHook';

class EthereumNursery extends TypedEventEmitter<{
  // EtherSwap
  'eth.lockup': {
    swap: Swap | ChainSwapInfo;
    lockup: LockupIdentity;
    etherSwapValues: EtherSwapValues;
  };

  // ERC20Swap
  'erc20.lockup': {
    swap: Swap | ChainSwapInfo;
    lockup: LockupIdentity;
    erc20SwapValues: ERC20SwapValues;
  };

  // Events used for both contracts
  'swap.expired': { swap: Swap; isEtherSwap: boolean };
  'lockup.failed': { swap: Swap | ChainSwapInfo; reason: string };
  'reverseSwap.expired': { reverseSwap: ReverseSwap; isEtherSwap: boolean };
  'chainSwap.expired': { chainSwap: ChainSwapInfo; isEtherSwap: boolean };
  'lockup.failedToSend': { swap: ReverseSwap | ChainSwapInfo; reason: string };
  'lockup.confirmed': {
    swap: ReverseSwap | ChainSwapInfo;
    transactionHash: string;
  };
  claim: {
    swap: ReverseSwap | ChainSwapInfo;
    preimage: Buffer;
    isEtherSwap: boolean;
    transactionHash: string;
  };
}> {
  private readonly contractTransactionTracker: EthereumTransactionConfirmationTracker;
  private readonly lock = new InstrumentedLock('ethereumNursery');

  constructor(
    private readonly logger: Logger,
    private readonly walletManager: WalletManager,
    public readonly ethereumManager: EthereumManager,
    private readonly transactionHook: TransactionHook,
    private readonly overpaymentProtector: OverpaymentProtector,
  ) {
    super();

    this.contractTransactionTracker =
      new EthereumTransactionConfirmationTracker(
        this.logger,
        this.ethereumManager.networkDetails,
        this.ethereumManager.provider,
      );
    this.contractTransactionTracker.on('confirmed', (data) => {
      this.emit('lockup.confirmed', data);
    });
    this.contractTransactionTracker.on('failedToSend', (data) => {
      this.emit('lockup.failedToSend', data);
    });

    this.listenEtherSwap();
    this.listenERC20Swap();
  }

  public init = async (): Promise<void> => {
    // Fetch all Swaps with a pending server lockup transaction
    const mempoolSwaps: (ReverseSwap | ChainSwapInfo)[][] = await Promise.all([
      ReverseSwapRepository.getReverseSwaps({
        status: SwapUpdateEvent.TransactionMempool,
      }),
      ChainSwapRepository.getChainSwaps({
        status: SwapUpdateEvent.TransactionServerMempool,
      }),
    ]);

    for (const swap of mempoolSwaps.flatMap((s) => s)) {
      let chainCurrency: string;

      if (swap.type === SwapType.ReverseSubmarine) {
        const { base, quote } = splitPairId(swap.pair);
        chainCurrency = getChainCurrency(base, quote, swap.orderSide, true);
      } else {
        chainCurrency = (swap as ChainSwapInfo).sendingData.symbol;
      }

      // Skip all Swaps that didn't send coins on the Ethereum chain
      if (this.getEthereumWallet(chainCurrency) === undefined) {
        continue;
      }

      const transactionId =
        swap.type === SwapType.ReverseSubmarine
          ? (swap as ReverseSwap).transactionId
          : (swap as ChainSwapInfo).sendingData.transactionId;

      try {
        const transaction = await this.ethereumManager.provider.getTransaction(
          transactionId!,
        );
        this.logger.debug(
          `Found ${this.ethereumManager.networkDetails.name} lockup transaction of ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}: ${transactionId}`,
        );
        this.listenContractTransaction(swap, transaction!);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // TODO: retry finding that transaction
        // If the provider can't find the transaction, it is not on the Ethereum chain
      }
    }

    this.listenBlocks();
  };

  public listenContractTransaction = (
    swap: ReverseSwap | ChainSwapInfo,
    transaction: TransactionResponse,
  ) => {
    this.contractTransactionTracker.trackTransaction(swap, transaction.hash);
  };

  private validateEtherSwapLockup = async (
    swap: Swap | ChainSwapInfo,
    transaction: Transaction | TransactionResponse,
    etherSwapValues: EtherSwapValues,
  ): Promise<string | undefined> => {
    if (etherSwapValues.claimAddress !== this.ethereumManager.address) {
      return Errors.INVALID_CLAIM_ADDRESS(
        etherSwapValues.claimAddress,
        this.ethereumManager.address,
      ).message;
    }

    const timeoutBlockHeight =
      swap.type === SwapType.Submarine
        ? (swap as Swap).timeoutBlockHeight
        : (swap as ChainSwapInfo).receivingData.timeoutBlockHeight;

    // Commitment swaps can have timelocks longer than the swap timeout
    if (etherSwapValues.timelock < timeoutBlockHeight) {
      return Errors.INVALID_TIMELOCK(
        etherSwapValues.timelock,
        timeoutBlockHeight,
      ).message;
    }

    const expectedAmount = this.getSwapExpectedReceivingAmount(swap);
    if (this.shouldValidateAmount(swap, expectedAmount)) {
      const actualAmountSat = Number(etherSwapValues.amount / etherDecimals);

      if (
        BigInt(expectedAmount) * this.ethereumManager.networkDetails.decimals >
        etherSwapValues.amount
      ) {
        return Errors.INSUFFICIENT_AMOUNT(actualAmountSat, expectedAmount)
          .message;
      }

      if (
        this.overpaymentProtector.isUnacceptableOverpay(
          swap.type,
          expectedAmount,
          actualAmountSat,
        )
      ) {
        return Errors.OVERPAID_AMOUNT(actualAmountSat, expectedAmount).message;
      }
    }

    const action = await this.transactionHook.hook(
      swap.id,
      this.ethereumManager.networkDetails.name,
      transaction.hash!,
      getHexBuffer(removeHexPrefix(Transaction.from(transaction).serialized!)),
      true,
      swap.type,
    );
    if (action === Action.Reject) {
      return Errors.BLOCKED_ADDRESS().message;
    }

    return undefined;
  };

  private processLockup = async ({
    swap,
    lockup,
    lockReason,
    contractName,
    lockupAmount,
    refundAddress,
    validate,
    emitLockup,
    options,
  }: {
    swap: Swap | ChainSwapInfo;
    lockup: LockupIdentity & { vout: number };
    lockReason: string;
    contractName: string;
    lockupAmount: number;
    refundAddress: string;
    validate: () => Promise<string | undefined>;
    emitLockup: (swap: Swap | ChainSwapInfo) => void;
    options?: UserLockupTransactionOptions;
  }) =>
    this.lock.acquire(swap.id, lockReason, async () => {
      this.logger.debug(
        `Found lockup in ${this.ethereumManager.networkDetails.name} ${contractName} contract for ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}: ${lockup.transactionId}`,
      );

      if (
        shouldIgnoreCompetingLockup({
          incoming: lockup,
          recorded: getLockupIdentity(swap),
          recordedStatus: swap.status as SwapUpdateEvent,
        })
      ) {
        this.logger.debug(
          `Ignoring competing lockup transaction ${lockup.transactionId} of ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}`,
        );
        return;
      }

      const reason = await validate();
      const target: LockupTarget =
        reason === undefined
          ? { status: SwapUpdateEvent.TransactionConfirmed }
          : {
              status: SwapUpdateEvent.TransactionLockupFailed,
              failureReason: reason,
            };

      const result =
        swap.type === SwapType.Submarine
          ? await SwapRepository.setLockupTransaction(
              swap as Swap,
              lockup.transactionId,
              lockupAmount,
              target,
              lockup.vout,
            )
          : await ChainSwapRepository.setUserLockupTransaction(
              swap as ChainSwapInfo,
              lockup.transactionId,
              lockupAmount,
              target,
              lockup.vout,
              options,
            );

      if (result.outcome === LockupWriteOutcome.Rejected) {
        this.logger.warn(
          `Ignoring lockup transaction ${formatLockupIdentity(lockup)} of ${swapTypeToPrettyString(swap.type)} Swap ${swap.id} because another lockup owns it`,
        );
        return;
      }

      let updated = result.swap;

      if (
        updated.type === SwapType.Submarine &&
        (updated as Swap).refundAddress == null
      ) {
        updated = await SwapRepository.setRefundAddress(
          updated as Swap,
          refundAddress,
        );
      }

      if (reason !== undefined) {
        if (result.written) {
          this.emit('lockup.failed', { swap: updated, reason });
        } else {
          this.logger.debug(
            `Not failing lockup ${formatLockupIdentity(lockup)} of ${swapTypeToPrettyString(swap.type)} Swap ${swap.id} because the Swap moved on: ${reason}`,
          );
        }
        return;
      }

      if (
        updated.type === SwapType.Chain &&
        !ChainSwapRepository.canActOnUserLockup(
          updated as ChainSwapInfo,
          options,
        )
      ) {
        this.logger.debug(
          `Not acting on lockup transaction of ${swapTypeToPrettyString(updated.type)} Swap ${updated.id} because lockup failed already`,
        );
        return;
      }

      if (
        updated.type === SwapType.Submarine &&
        (updated as Swap).refundAddress !== refundAddress
      ) {
        updated = await SwapRepository.setRefundAddress(
          updated as Swap,
          refundAddress,
        );
      }

      emitLockup(updated);
    });

  public checkEtherSwapLockup = async (
    swap: Swap | ChainSwapInfo,
    transaction: Transaction | TransactionResponse,
    etherSwapValues: EtherSwapValues,
    logIndex: number,
    options?: UserLockupTransactionOptions,
  ) => {
    if (
      this.getSwapReceivingCurrency(swap) !==
      this.ethereumManager.networkDetails.symbol
    ) {
      return;
    }

    const lockup = { transactionId: transaction.hash!, vout: logIndex };

    await this.processLockup({
      swap,
      lockup,
      options,
      lockReason: 'checkEtherSwapLockup',
      contractName: 'EtherSwap',
      lockupAmount: Number(etherSwapValues.amount / etherDecimals),
      refundAddress: etherSwapValues.refundAddress,
      validate: () =>
        this.validateEtherSwapLockup(swap, transaction, etherSwapValues),
      emitLockup: (updated) => {
        this.emit('eth.lockup', {
          lockup,
          etherSwapValues,
          swap: updated,
        });
      },
    });
  };

  private validateErc20SwapLockup = async (
    swap: Swap | ChainSwapInfo,
    transaction: Transaction | TransactionResponse,
    erc20SwapValues: ERC20SwapValues,
    symbol: string,
    erc20Wallet: ERC20WalletProvider,
  ): Promise<string | undefined> => {
    if (erc20SwapValues.claimAddress !== this.ethereumManager.address) {
      return Errors.INVALID_CLAIM_ADDRESS(
        erc20SwapValues.claimAddress,
        this.ethereumManager.address,
      ).message;
    }

    if (erc20SwapValues.tokenAddress !== erc20Wallet.tokenAddress) {
      return Errors.INVALID_TOKEN_LOCKED(
        erc20SwapValues.tokenAddress,
        this.ethereumManager.address,
      ).message;
    }

    const timeoutBlockHeight =
      swap.type === SwapType.Submarine
        ? (swap as Swap).timeoutBlockHeight
        : (swap as ChainSwapInfo).receivingData.timeoutBlockHeight;

    // Commitment swaps can have timelocks longer than the swap timeout
    if (erc20SwapValues.timelock < timeoutBlockHeight) {
      return Errors.INVALID_TIMELOCK(
        erc20SwapValues.timelock,
        timeoutBlockHeight,
      ).message;
    }

    const expectedAmount = this.getSwapExpectedReceivingAmount(swap);
    if (this.shouldValidateAmount(swap, expectedAmount)) {
      const actualAmount = erc20Wallet.normalizeTokenAmount(
        erc20SwapValues.amount,
      );

      if (
        erc20Wallet.formatTokenAmount(expectedAmount) > erc20SwapValues.amount
      ) {
        return Errors.INSUFFICIENT_AMOUNT(actualAmount, expectedAmount).message;
      }

      if (
        this.overpaymentProtector.isUnacceptableOverpay(
          swap.type,
          expectedAmount,
          actualAmount,
        )
      ) {
        return Errors.OVERPAID_AMOUNT(actualAmount, expectedAmount).message;
      }
    }

    const action = await this.transactionHook.hook(
      swap.id,
      symbol,
      transaction.hash!,
      getHexBuffer(removeHexPrefix(Transaction.from(transaction).serialized!)),
      true,
      swap.type,
    );
    if (action === Action.Reject) {
      return Errors.BLOCKED_ADDRESS().message;
    }

    return undefined;
  };

  public checkErc20SwapLockup = async (
    swap: Swap | ChainSwapInfo,
    transaction: Transaction | TransactionResponse,
    erc20SwapValues: ERC20SwapValues,
    logIndex: number,
    options?: UserLockupTransactionOptions,
  ) => {
    const wallet = this.walletManager.wallets.get(
      this.getSwapReceivingCurrency(swap),
    );
    if (wallet === undefined || wallet.type !== CurrencyType.ERC20) {
      return;
    }

    const erc20Wallet = wallet.walletProvider as ERC20WalletProvider;

    const lockup = { transactionId: transaction.hash!, vout: logIndex };

    await this.processLockup({
      swap,
      lockup,
      options,
      lockReason: 'checkErc20SwapLockup',
      contractName: 'ERC20Swap',
      lockupAmount: erc20Wallet.normalizeTokenAmount(erc20SwapValues.amount),
      refundAddress: erc20SwapValues.refundAddress,
      validate: () =>
        this.validateErc20SwapLockup(
          swap,
          transaction,
          erc20SwapValues,
          wallet.symbol,
          erc20Wallet,
        ),
      emitLockup: (updated) => {
        this.emit('erc20.lockup', {
          lockup,
          erc20SwapValues,
          swap: updated,
        });
      },
    });
  };

  private listenEtherSwap = () => {
    this.ethereumManager.contractEventHandler.on(
      'eth.lockup',
      async ({ transaction, etherSwapValues, logIndex }) => {
        const swaps = await Promise.all([
          SwapRepository.getSwap({
            preimageHash: getHexString(etherSwapValues.preimageHash),
            status: {
              [Op.or]: [
                SwapUpdateEvent.SwapCreated,
                SwapUpdateEvent.InvoiceSet,
              ],
            },
          }),
          ChainSwapRepository.getChainSwap({
            status: SwapUpdateEvent.SwapCreated,
            preimageHash: getHexString(etherSwapValues.preimageHash),
          }),
        ]);

        for (const swap of swaps.filter((s) => s !== null)) {
          await this.checkEtherSwapLockup(
            swap!,
            transaction,
            etherSwapValues,
            logIndex,
          );
        }
      },
    );

    this.ethereumManager.contractEventHandler.on(
      'eth.claim',
      async ({ transactionHash, preimageHash, preimage }) => {
        const swaps = await Promise.all([
          ReverseSwapRepository.getReverseSwap({
            preimageHash: getHexString(preimageHash),
            status: {
              [Op.not]: SwapUpdateEvent.InvoiceSettled,
            },
          }),
          ChainSwapRepository.getChainSwap({
            preimageHash: getHexString(preimageHash),
            status: {
              [Op.not]: SwapUpdateEvent.TransactionClaimed,
            },
          }),
        ]);

        for (const swap of swaps.filter(
          (s): s is ReverseSwap | ChainSwapInfo => s !== null,
        )) {
          if (!this.shouldHandleClaim(swap, true)) {
            continue;
          }

          this.logger.debug(
            `Found claim in ${this.ethereumManager.networkDetails.name} EtherSwap contract for ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}: ${transactionHash}`,
          );

          this.emit('claim', {
            swap,
            preimage,
            isEtherSwap: true,
            transactionHash,
          });

          await ClaimTransactionRepository.persistTransaction(this.logger, {
            swapId: swap.id,
            symbol: this.ethereumManager.networkDetails.symbol,
            id: transactionHash,
          });
        }
      },
    );
  };

  private listenERC20Swap = () => {
    this.ethereumManager.contractEventHandler.on(
      'erc20.lockup',
      async ({ transaction, erc20SwapValues, logIndex }) => {
        const swaps = await Promise.all([
          SwapRepository.getSwap({
            preimageHash: getHexString(erc20SwapValues.preimageHash),
            status: {
              [Op.or]: [
                SwapUpdateEvent.SwapCreated,
                SwapUpdateEvent.InvoiceSet,
              ],
            },
          }),
          ChainSwapRepository.getChainSwap({
            status: SwapUpdateEvent.SwapCreated,
            preimageHash: getHexString(erc20SwapValues.preimageHash),
          }),
        ]);

        for (const swap of swaps.filter((s) => s !== null)) {
          await this.checkErc20SwapLockup(
            swap!,
            transaction,
            erc20SwapValues,
            logIndex,
          );
        }
      },
    );

    this.ethereumManager.contractEventHandler.on(
      'erc20.claim',
      async ({ transactionHash, preimageHash, preimage }) => {
        const swaps: (ReverseSwap | ChainSwapInfo | null)[] = await Promise.all(
          [
            ReverseSwapRepository.getReverseSwap({
              preimageHash: getHexString(preimageHash),
              status: {
                [Op.not]: SwapUpdateEvent.InvoiceSettled,
              },
            }),
            ChainSwapRepository.getChainSwap({
              preimageHash: getHexString(preimageHash),
              status: {
                [Op.not]: SwapUpdateEvent.TransactionClaimed,
              },
            }),
          ],
        );

        for (const swap of swaps.filter(
          (s): s is ReverseSwap | ChainSwapInfo => s !== null,
        )) {
          if (!this.shouldHandleClaim(swap, false)) {
            continue;
          }

          this.logger.debug(
            `Found claim in ${this.ethereumManager.networkDetails.name} ERC20Swap contract for ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}: ${transactionHash}`,
          );

          this.emit('claim', {
            swap,
            preimage,
            isEtherSwap: false,
            transactionHash,
          });

          await ClaimTransactionRepository.persistTransaction(this.logger, {
            swapId: swap.id,
            symbol: this.getUserClaimChainSymbol(swap),
            id: transactionHash,
          });
        }
      },
    );
  };

  private listenBlocks = () => {
    let lastKnownBlock = 0;

    this.ethereumManager.provider
      .onBlock(async ({ number, l1BlockNumber }) => {
        const latest = l1BlockNumber ?? number;

        // Always check for confirmed transactions, even when there is no new L1 block
        const confirmationCheck =
          this.contractTransactionTracker.scanPendingTransactions();

        if (latest > lastKnownBlock) {
          lastKnownBlock = latest;

          await Promise.all([
            confirmationCheck,
            this.checkExpiredSwaps(latest),
            this.checkExpiredChainSwaps(latest),
            this.checkExpiredReverseSwaps(latest),
          ]);
        } else {
          await confirmationCheck;
        }
      })
      .catch((err) => {
        this.logger.error(
          `Could not subscribe to ${
            this.ethereumManager.networkDetails.name
          } blocks: ${formatError(err)}`,
        );
      });
  };

  private checkExpiredSwaps = async (height: number) => {
    const expirableSwaps = await SwapRepository.getSwapsExpirable(height);

    for (const expirableSwap of expirableSwaps) {
      const { base, quote } = splitPairId(expirableSwap.pair);
      const chainCurrency = getChainCurrency(
        base,
        quote,
        expirableSwap.orderSide,
        false,
      );

      const wallet = this.getEthereumWallet(chainCurrency);

      if (wallet) {
        this.emit('swap.expired', {
          swap: expirableSwap,
          isEtherSwap:
            wallet.symbol === this.ethereumManager.networkDetails.symbol,
        });
      }
    }
  };

  private checkExpiredReverseSwaps = async (height: number) => {
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

      const wallet = this.getEthereumWallet(chainCurrency);

      if (wallet) {
        this.emit('reverseSwap.expired', {
          reverseSwap: expirableReverseSwap,
          isEtherSwap:
            wallet.symbol === this.ethereumManager.networkDetails.symbol,
        });
      }
    }
  };

  private checkExpiredChainSwaps = async (height: number) => {
    for (const swap of await ChainSwapRepository.getChainSwapsExpirable(
      this.getEthereumWalletSymbols(),
      height,
    )) {
      const wallet = this.getEthereumWallet(swap.sendingData.symbol);

      if (wallet) {
        this.emit('chainSwap.expired', {
          chainSwap: swap,
          isEtherSwap:
            wallet.symbol === this.ethereumManager.networkDetails.symbol,
        });
      }
    }
  };

  private getSwapReceivingCurrency = (swap: Swap | ChainSwapInfo) => {
    if (swap.type === SwapType.Submarine) {
      const { base, quote } = splitPairId(swap.pair);
      return getChainCurrency(base, quote, swap.orderSide, false);
    }

    return (swap as ChainSwapInfo).receivingData.symbol;
  };

  private getUserClaimChainSymbol = (
    swap: ReverseSwap | ChainSwapInfo,
  ): string => {
    if (swap.type === SwapType.ReverseSubmarine) {
      const { base, quote } = splitPairId(swap.pair);
      return getChainCurrency(base, quote, swap.orderSide, true);
    }

    return (swap as ChainSwapInfo).sendingData.symbol;
  };

  private getSwapExpectedReceivingAmount = (swap: Swap | ChainSwapInfo) =>
    swap.type === SwapType.Submarine
      ? (swap as Swap).expectedAmount
      : (swap as ChainSwapInfo).receivingData.expectedAmount;

  private shouldValidateAmount = (
    swap: Swap | ChainSwapInfo,
    expectedAmount: number | null | undefined,
  ): expectedAmount is number => {
    // Submarine swaps can be locked up before the invoice is set; amount
    // validation happens after the invoice populates the expected amount.
    if (typeof expectedAmount !== 'number') {
      return false;
    }

    return swap.type === SwapType.Chain || expectedAmount > 0;
  };

  private shouldHandleClaim = (
    swap: ReverseSwap | ChainSwapInfo,
    isEtherSwap: boolean,
  ) => {
    if (swap.type !== SwapType.Chain) {
      return true;
    }

    const chainSwap = swap as ChainSwapInfo;
    const sendingWallet = this.getEthereumWallet(chainSwap.sendingData.symbol);
    if (sendingWallet === undefined) {
      return false;
    }

    return isEtherSwap
      ? sendingWallet.symbol === this.ethereumManager.networkDetails.symbol
      : sendingWallet.type === CurrencyType.ERC20;
  };

  /**
   * Returns a wallet in case there is one with the symbol, and it is an Ethereum one
   */
  private getEthereumWallet = (symbol: string): Wallet | undefined => {
    if (!this.ethereumManager.hasSymbol(symbol)) {
      return;
    }

    const wallet = this.walletManager.wallets.get(symbol);

    if (!wallet) {
      return;
    }

    if (
      wallet.type === CurrencyType.Ether ||
      wallet.type === CurrencyType.ERC20
    ) {
      return wallet;
    }

    return;
  };

  private getEthereumWalletSymbols = () =>
    Array.from(this.walletManager.wallets.values())
      .filter(
        (w) =>
          (w.type === CurrencyType.Ether || w.type === CurrencyType.ERC20) &&
          this.ethereumManager.hasSymbol(w.symbol),
      )
      .map((w) => w.symbol);
}

export default EthereumNursery;
