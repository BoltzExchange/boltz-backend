import type { TransactionReceipt, TransactionResponse } from 'ethers';
import { Transaction } from 'ethers';
import { Op } from 'sequelize';
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
import type ReverseSwap from '../db/models/ReverseSwap';
import type Swap from '../db/models/Swap';
import type { ChainSwapInfo } from '../db/repositories/ChainSwapRepository';
import ChainSwapRepository from '../db/repositories/ChainSwapRepository';
import ReverseSwapRepository from '../db/repositories/ReverseSwapRepository';
import SwapRepository from '../db/repositories/SwapRepository';
import WrappedSwapRepository from '../db/repositories/WrappedSwapRepository';
import type Wallet from '../wallet/Wallet';
import type WalletManager from '../wallet/WalletManager';
import type EthereumManager from '../wallet/ethereum/EthereumManager';
import type ERC20WalletProvider from '../wallet/providers/ERC20WalletProvider';
import Errors from './Errors';
import type OverpaymentProtector from './OverpaymentProtector';
import { Action } from './hooks/Hook';
import type TransactionHook from './hooks/TransactionHook';

class EthereumNursery extends TypedEventEmitter<{
  // EtherSwap
  'eth.lockup': {
    swap: Swap | ChainSwapInfo;
    transactionHash: string;
    etherSwapValues: EtherSwapValues;
  };

  // ERC20Swap
  'erc20.lockup': {
    swap: Swap | ChainSwapInfo;
    transactionHash: string;
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
  };
}> {
  constructor(
    private readonly logger: Logger,
    private readonly walletManager: WalletManager,
    public readonly ethereumManager: EthereumManager,
    private readonly transactionHook: TransactionHook,
    private readonly overpaymentProtector: OverpaymentProtector,
  ) {
    super();

    this.listenBlocks();

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
  };

  public listenContractTransaction = (
    swap: ReverseSwap | ChainSwapInfo,
    transaction: TransactionResponse,
  ): void => {
    transaction
      .wait(1)
      .then(async () => {
        this.emit('lockup.confirmed', {
          transactionHash: transaction.hash,
          swap: await WrappedSwapRepository.setStatus(
            swap,
            swap.type === SwapType.ReverseSubmarine
              ? SwapUpdateEvent.TransactionConfirmed
              : SwapUpdateEvent.TransactionServerConfirmed,
          ),
        });
      })
      .catch(async (reason) => {
        this.emit('lockup.failedToSend', {
          reason,
          swap: await WrappedSwapRepository.setStatus(
            swap,
            SwapUpdateEvent.TransactionFailed,
          ),
        });
      });
  };

  public checkEtherSwapLockup = async (
    swap: Swap | ChainSwapInfo,
    transaction: Transaction | TransactionResponse | TransactionReceipt,
    etherSwapValues: EtherSwapValues,
  ) => {
    if (
      this.getSwapReceivingCurrency(swap) !==
      this.ethereumManager.networkDetails.symbol
    ) {
      return;
    }

    this.logger.debug(
      `Found lockup in ${this.ethereumManager.networkDetails.name} EtherSwap contract for ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}: ${transaction.hash}`,
    );

    const lockupAmount = Number(etherSwapValues.amount / etherDecimals);
    swap =
      swap.type === SwapType.Submarine
        ? await SwapRepository.setLockupTransaction(
            swap as Swap,
            transaction.hash!,
            lockupAmount,
            true,
          )
        : await ChainSwapRepository.setUserLockupTransaction(
            swap as ChainSwapInfo,
            transaction.hash!,
            lockupAmount,
            true,
          );

    if (etherSwapValues.claimAddress !== this.ethereumManager.address) {
      this.emit('lockup.failed', {
        swap,
        reason: Errors.INVALID_CLAIM_ADDRESS(
          etherSwapValues.claimAddress,
          this.ethereumManager.address,
        ).message,
      });
      return;
    }

    const timeoutBlockHeight =
      swap.type === SwapType.Submarine
        ? (swap as Swap).timeoutBlockHeight
        : (swap as ChainSwapInfo).receivingData.timeoutBlockHeight;
    if (etherSwapValues.timelock !== timeoutBlockHeight) {
      this.emit('lockup.failed', {
        swap,
        reason: Errors.INVALID_TIMELOCK(
          etherSwapValues.timelock,
          timeoutBlockHeight,
        ).message,
      });
      return;
    }

    const expectedAmount = this.getSwapExpectedReceivingAmount(swap);
    if (expectedAmount) {
      const actualAmountSat = Number(etherSwapValues.amount / etherDecimals);

      if (
        BigInt(expectedAmount) * this.ethereumManager.networkDetails.decimals >
        etherSwapValues.amount
      ) {
        this.emit('lockup.failed', {
          swap,
          reason: Errors.INSUFFICIENT_AMOUNT(actualAmountSat, expectedAmount)
            .message,
        });
        return;
      }

      if (
        this.overpaymentProtector.isUnacceptableOverpay(
          swap.type,
          expectedAmount,
          actualAmountSat,
        )
      ) {
        this.emit('lockup.failed', {
          swap,
          reason: Errors.OVERPAID_AMOUNT(actualAmountSat, expectedAmount)
            .message,
        });
        return;
      }
    }

    {
      const action = await this.transactionHook.hook(
        this.ethereumManager.networkDetails.name,
        transaction.hash!,
        getHexBuffer(
          removeHexPrefix(Transaction.from(transaction).serialized!),
        ),
        true,
      );

      switch (action) {
        case Action.Hold:
          this.logger.warn(
            `Holding lockup in ${this.ethereumManager.networkDetails.name} EtherSwap contract for ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}: ${transaction.hash}`,
          );
          return;

        case Action.Reject:
          this.emit('lockup.failed', {
            swap,
            reason: Errors.BLOCKED_ADDRESS().message,
          });
          return;
      }
    }

    this.emit('eth.lockup', {
      swap,
      etherSwapValues,
      transactionHash: transaction.hash!,
    });
  };

  public checkErc20SwapLockup = async (
    swap: Swap | ChainSwapInfo,
    transaction: Transaction | TransactionResponse | TransactionReceipt,
    erc20SwapValues: ERC20SwapValues,
  ) => {
    const wallet = this.walletManager.wallets.get(
      this.getSwapReceivingCurrency(swap),
    );
    if (wallet === undefined || wallet.type !== CurrencyType.ERC20) {
      return;
    }

    const erc20Wallet = wallet.walletProvider as ERC20WalletProvider;

    this.logger.debug(
      `Found lockup in ${this.ethereumManager.networkDetails.name} ERC20Swap contract for ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}: ${transaction.hash}`,
    );

    const lockupAmount = erc20Wallet.normalizeTokenAmount(
      erc20SwapValues.amount,
    );
    swap =
      swap.type === SwapType.Submarine
        ? await SwapRepository.setLockupTransaction(
            swap as Swap,
            transaction.hash!,
            lockupAmount,
            true,
          )
        : await ChainSwapRepository.setUserLockupTransaction(
            swap as ChainSwapInfo,
            transaction.hash!,
            lockupAmount,
            true,
          );

    if (erc20SwapValues.claimAddress !== this.ethereumManager.address) {
      this.emit('lockup.failed', {
        swap,
        reason: Errors.INVALID_CLAIM_ADDRESS(
          erc20SwapValues.claimAddress,
          this.ethereumManager.address,
        ).message,
      });
      return;
    }

    if (erc20SwapValues.tokenAddress !== erc20Wallet.tokenAddress) {
      this.emit('lockup.failed', {
        swap,
        reason: Errors.INVALID_TOKEN_LOCKED(
          erc20SwapValues.tokenAddress,
          this.ethereumManager.address,
        ).message,
      });
      return;
    }

    const timeoutBlockHeight =
      swap.type === SwapType.Submarine
        ? (swap as Swap).timeoutBlockHeight
        : (swap as ChainSwapInfo).receivingData.timeoutBlockHeight;
    if (erc20SwapValues.timelock !== timeoutBlockHeight) {
      this.emit('lockup.failed', {
        swap,
        reason: Errors.INVALID_TIMELOCK(
          erc20SwapValues.timelock,
          timeoutBlockHeight,
        ).message,
      });
      return;
    }

    const expectedAmount = this.getSwapExpectedReceivingAmount(swap);
    if (expectedAmount) {
      const actualAmount = erc20Wallet.normalizeTokenAmount(
        erc20SwapValues.amount,
      );

      if (
        erc20Wallet.formatTokenAmount(expectedAmount) > erc20SwapValues.amount
      ) {
        this.emit('lockup.failed', {
          swap,
          reason: Errors.INSUFFICIENT_AMOUNT(actualAmount, expectedAmount)
            .message,
        });
        return;
      }

      if (
        this.overpaymentProtector.isUnacceptableOverpay(
          swap.type,
          expectedAmount,
          actualAmount,
        )
      ) {
        this.emit('lockup.failed', {
          swap,
          reason: Errors.OVERPAID_AMOUNT(actualAmount, expectedAmount).message,
        });
        return;
      }
    }

    {
      const action = await this.transactionHook.hook(
        wallet.symbol,
        transaction.hash!,
        getHexBuffer(
          removeHexPrefix(Transaction.from(transaction).serialized!),
        ),
        true,
      );

      switch (action) {
        case Action.Hold:
          this.logger.debug(
            `Holding lockup in ${this.ethereumManager.networkDetails.name} ERC20Swap contract for ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}: ${transaction.hash}`,
          );
          return;

        case Action.Reject:
          this.emit('lockup.failed', {
            swap,
            reason: Errors.BLOCKED_ADDRESS().message,
          });
          return;
      }
    }

    this.emit('erc20.lockup', {
      swap,
      erc20SwapValues,
      transactionHash: transaction.hash!,
    });
  };

  private listenEtherSwap = () => {
    this.ethereumManager.contractEventHandler.on(
      'eth.lockup',
      async ({ transaction, etherSwapValues }) => {
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
          await this.checkEtherSwapLockup(swap!, transaction, etherSwapValues);
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
          this.logger.debug(
            `Found claim in ${this.ethereumManager.networkDetails.name} EtherSwap contract for ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}: ${transactionHash}`,
          );

          this.emit('claim', { swap, preimage, isEtherSwap: true });
        }
      },
    );
  };

  private listenERC20Swap = () => {
    this.ethereumManager.contractEventHandler.on(
      'erc20.lockup',
      async ({ transaction, erc20SwapValues }) => {
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
          await this.checkErc20SwapLockup(swap!, transaction, erc20SwapValues);
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
          this.logger.debug(
            `Found claim in ${this.ethereumManager.networkDetails.name} ERC20Swap contract for ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}: ${transactionHash}`,
          );

          this.emit('claim', { swap, preimage, isEtherSwap: false });
        }
      },
    );
  };

  private listenBlocks = () => {
    this.ethereumManager.provider
      .on('block', async (height) => {
        await Promise.all([
          this.checkExpiredSwaps(height),
          this.checkExpiredChainSwaps(height),
          this.checkExpiredReverseSwaps(height),
        ]);
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

  private getSwapExpectedReceivingAmount = (swap: Swap | ChainSwapInfo) =>
    swap.type === SwapType.Submarine
      ? (swap as Swap).expectedAmount
      : (swap as ChainSwapInfo).receivingData.expectedAmount;

  /**
   * Returns a wallet in case there is one with the symbol, and it is an Ethereum one
   */
  private getEthereumWallet = (symbol: string): Wallet | undefined => {
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
        (w) => w.type === CurrencyType.Ether || w.type === CurrencyType.ERC20,
      )
      .map((w) => w.symbol);
}

export default EthereumNursery;
