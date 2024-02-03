import { Transaction, TransactionResponse } from 'ethers';
import { EventEmitter } from 'events';
import { Op } from 'sequelize';
import Logger from '../Logger';
import {
  formatError,
  getChainCurrency,
  getHexString,
  splitPairId,
} from '../Utils';
import { etherDecimals } from '../consts/Consts';
import { CurrencyType, SwapUpdateEvent } from '../consts/Enums';
import { ERC20SwapValues, EtherSwapValues } from '../consts/Types';
import ReverseSwap from '../db/models/ReverseSwap';
import Swap from '../db/models/Swap';
import ReverseSwapRepository from '../db/repositories/ReverseSwapRepository';
import SwapRepository from '../db/repositories/SwapRepository';
import Blocks from '../service/Blocks';
import Wallet from '../wallet/Wallet';
import WalletManager from '../wallet/WalletManager';
import EthereumManager from '../wallet/ethereum/EthereumManager';
import ERC20WalletProvider from '../wallet/providers/ERC20WalletProvider';
import Errors from './Errors';

interface IEthereumNursery {
  // EtherSwap
  on(
    event: 'eth.lockup',
    listener: (
      swap: Swap,
      transactionHash: string,
      etherSwapValues: EtherSwapValues,
    ) => void,
  ): this;
  emit(
    event: 'eth.lockup',
    swap: Swap,
    transactionHash: string,
    etherSwapValues: EtherSwapValues,
  ): boolean;

  // ERC20Swap
  on(
    event: 'erc20.lockup',
    listener: (
      swap: Swap,
      transactionHash: string,
      erc20SwapValues: ERC20SwapValues,
    ) => void,
  ): this;
  emit(
    event: 'erc20.lockup',
    swap: Swap,
    transactionHash: string,
    erc20SwapValues: ERC20SwapValues,
  ): boolean;

  // Events used for both contracts
  on(
    event: 'swap.expired',
    listener: (swap: Swap, isEtherSwap: boolean) => void,
  ): this;
  emit(event: 'swap.expired', swap: Swap, isEtherSwap: boolean): boolean;

  on(
    event: 'lockup.failed',
    listener: (swap: Swap, reason: string) => void,
  ): this;
  emit(event: 'lockup.failed', swap: Swap, reason: string): boolean;

  on(
    event: 'reverseSwap.expired',
    listener: (reverseSwap: ReverseSwap, isEtherSwap: boolean) => void,
  ): this;
  emit(
    event: 'reverseSwap.expired',
    reverseSwap: ReverseSwap,
    isEtherSwap: boolean,
  ): boolean;

  on(
    event: 'lockup.failedToSend',
    listener: (reverseSwap: ReverseSwap, reason: string) => void,
  ): this;
  emit(
    event: 'lockup.failedToSend',
    reverseSwap: ReverseSwap,
    reason: string,
  ): boolean;

  on(
    event: 'lockup.confirmed',
    listener: (reverseSwap: ReverseSwap, transactionHash: string) => void,
  ): this;
  emit(
    event: 'lockup.confirmed',
    reverseSwap: ReverseSwap,
    transactionHash: string,
  ): boolean;

  on(
    event: 'claim',
    listener: (reverseSwap: ReverseSwap, preimage: Buffer) => void,
  ): this;
  emit(event: 'claim', reverseSwap: ReverseSwap, preimage: Buffer): boolean;
}

class EthereumNursery extends EventEmitter implements IEthereumNursery {
  constructor(
    private readonly logger: Logger,
    private readonly walletManager: WalletManager,
    public readonly ethereumManager: EthereumManager,
    private readonly blocks: Blocks,
  ) {
    super();

    this.listenBlocks();

    this.listenEtherSwap();
    this.listenERC20Swap();
  }

  public init = async (): Promise<void> => {
    // Fetch all Reverse Swaps with a pending lockup transaction
    const mempoolReverseSwaps = await ReverseSwapRepository.getReverseSwaps({
      status: SwapUpdateEvent.TransactionMempool,
    });

    for (const mempoolReverseSwap of mempoolReverseSwaps) {
      const { base, quote } = splitPairId(mempoolReverseSwap.pair);
      const chainCurrency = getChainCurrency(
        base,
        quote,
        mempoolReverseSwap.orderSide,
        true,
      );

      // Skip all Reverse Swaps that didn't send coins on the Ethereum chain
      if (this.getEthereumWallet(chainCurrency) === undefined) {
        continue;
      }

      try {
        const transaction = await this.ethereumManager.provider.getTransaction(
          mempoolReverseSwap.transactionId!,
        );
        this.logger.debug(
          `Found pending ${this.ethereumManager.networkDetails.name} lockup transaction of Reverse Swap ${mempoolReverseSwap.id}: ${mempoolReverseSwap.transactionId}`,
        );
        this.listenContractTransaction(mempoolReverseSwap, transaction!);
      } catch (error) {
        // TODO: retry finding that transaction
        // If the provider can't find the transaction, it is not on the Ethereum chain
      }
    }
  };

  public listenContractTransaction = (
    reverseSwap: ReverseSwap,
    transaction: TransactionResponse,
  ): void => {
    transaction
      .wait(1)
      .then(async () => {
        this.emit(
          'lockup.confirmed',
          await ReverseSwapRepository.setReverseSwapStatus(
            reverseSwap,
            SwapUpdateEvent.TransactionConfirmed,
          ),
          transaction.hash,
        );
      })
      .catch(async (reason) => {
        this.emit(
          'lockup.failedToSend',
          await ReverseSwapRepository.setReverseSwapStatus(
            reverseSwap,
            SwapUpdateEvent.TransactionFailed,
          ),
          reason,
        );
      });
  };

  private listenEtherSwap = () => {
    this.ethereumManager.contractEventHandler.on(
      'eth.lockup',
      async (transaction: Transaction, etherSwapValues) => {
        let swap = await SwapRepository.getSwap({
          preimageHash: getHexString(etherSwapValues.preimageHash),
          status: {
            [Op.or]: [SwapUpdateEvent.SwapCreated, SwapUpdateEvent.InvoiceSet],
          },
        });

        if (!swap) {
          return;
        }

        const { base, quote } = splitPairId(swap.pair);
        const chainCurrency = getChainCurrency(
          base,
          quote,
          swap.orderSide,
          false,
        );

        if (chainCurrency !== this.ethereumManager.networkDetails.symbol) {
          return;
        }

        this.logger.debug(
          `Found lockup in ${this.ethereumManager.networkDetails.name} EtherSwap contract for Swap ${swap.id}: ${transaction.hash}`,
        );

        swap = await SwapRepository.setLockupTransaction(
          swap,
          transaction.hash!,
          Number(etherSwapValues.amount / etherDecimals),
          true,
        );

        if (etherSwapValues.claimAddress !== this.ethereumManager.address) {
          this.emit(
            'lockup.failed',
            swap,
            Errors.INVALID_CLAIM_ADDRESS(
              etherSwapValues.claimAddress,
              this.ethereumManager.address,
            ).message,
          );
          return;
        }

        if (etherSwapValues.timelock !== swap.timeoutBlockHeight) {
          this.emit(
            'lockup.failed',
            swap,
            Errors.INVALID_TIMELOCK(
              etherSwapValues.timelock,
              swap.timeoutBlockHeight,
            ).message,
          );
          return;
        }

        if (swap.expectedAmount) {
          const expectedAmount =
            BigInt(swap.expectedAmount) *
            this.ethereumManager.networkDetails.decimals;

          if (expectedAmount > etherSwapValues.amount) {
            this.emit(
              'lockup.failed',
              swap,
              Errors.INSUFFICIENT_AMOUNT(
                Number(etherSwapValues.amount / etherDecimals),
                swap.expectedAmount,
              ).message,
            );
            return;
          }
        }

        if (this.blocks.isBlocked(transaction.from!)) {
          this.emit('lockup.failed', swap, Errors.BLOCKED_ADDRESS().message);
          return;
        }

        this.emit('eth.lockup', swap, transaction.hash, etherSwapValues);
      },
    );

    this.ethereumManager.contractEventHandler.on(
      'eth.claim',
      async (transactionHash, preimageHash, preimage) => {
        const reverseSwap = await ReverseSwapRepository.getReverseSwap({
          preimageHash: getHexString(preimageHash),
          status: {
            [Op.not]: SwapUpdateEvent.InvoiceSettled,
          },
        });

        if (!reverseSwap) {
          return;
        }

        this.logger.debug(
          `Found claim in ${this.ethereumManager.networkDetails.name} EtherSwap contract for Reverse Swap ${reverseSwap.id}: ${transactionHash}`,
        );

        this.emit('claim', reverseSwap, preimage);
      },
    );
  };

  private listenERC20Swap = () => {
    this.ethereumManager.contractEventHandler.on(
      'erc20.lockup',
      async (transaction: Transaction, erc20SwapValues) => {
        let swap = await SwapRepository.getSwap({
          preimageHash: getHexString(erc20SwapValues.preimageHash),
          status: {
            [Op.or]: [SwapUpdateEvent.SwapCreated, SwapUpdateEvent.InvoiceSet],
          },
        });

        if (!swap) {
          return;
        }

        const { base, quote } = splitPairId(swap.pair);
        const chainCurrency = getChainCurrency(
          base,
          quote,
          swap.orderSide,
          false,
        );

        const wallet = this.walletManager.wallets.get(chainCurrency);

        if (wallet === undefined || wallet.type !== CurrencyType.ERC20) {
          return;
        }

        const erc20Wallet = wallet.walletProvider as ERC20WalletProvider;

        this.logger.debug(
          `Found lockup in ${this.ethereumManager.networkDetails.name} ERC20Swap contract for Swap ${swap.id}: ${transaction.hash}`,
        );

        swap = await SwapRepository.setLockupTransaction(
          swap,
          transaction.hash!,
          erc20Wallet.normalizeTokenAmount(erc20SwapValues.amount),
          true,
        );

        if (erc20SwapValues.claimAddress !== this.ethereumManager.address) {
          this.emit(
            'lockup.failed',
            swap,
            Errors.INVALID_CLAIM_ADDRESS(
              erc20SwapValues.claimAddress,
              this.ethereumManager.address,
            ).message,
          );
          return;
        }

        if (erc20SwapValues.tokenAddress !== erc20Wallet.getTokenAddress()) {
          this.emit(
            'lockup.failed',
            swap,
            Errors.INVALID_TOKEN_LOCKED(
              erc20SwapValues.tokenAddress,
              this.ethereumManager.address,
            ).message,
          );
          return;
        }

        if (erc20SwapValues.timelock !== swap.timeoutBlockHeight) {
          this.emit(
            'lockup.failed',
            swap,
            Errors.INVALID_TIMELOCK(
              erc20SwapValues.timelock,
              swap.timeoutBlockHeight,
            ).message,
          );
          return;
        }

        if (swap.expectedAmount) {
          if (
            erc20Wallet.formatTokenAmount(swap.expectedAmount) >
            erc20SwapValues.amount
          ) {
            this.emit(
              'lockup.failed',
              swap,
              Errors.INSUFFICIENT_AMOUNT(
                erc20Wallet.normalizeTokenAmount(erc20SwapValues.amount),
                swap.expectedAmount,
              ).message,
            );
            return;
          }
        }

        if (this.blocks.isBlocked(transaction.from!)) {
          this.emit('lockup.failed', swap, Errors.BLOCKED_ADDRESS().message);
          return;
        }

        this.emit('erc20.lockup', swap, transaction.hash, erc20SwapValues);
      },
    );

    this.ethereumManager.contractEventHandler.on(
      'erc20.claim',
      async (transactionHash, preimageHash, preimage) => {
        const reverseSwap = await ReverseSwapRepository.getReverseSwap({
          preimageHash: getHexString(preimageHash),
          status: {
            [Op.not]: SwapUpdateEvent.InvoiceSettled,
          },
        });

        if (!reverseSwap) {
          return;
        }

        this.logger.debug(
          `Found claim in ${this.ethereumManager.networkDetails.name} ERC20Swap contract for Reverse Swap ${reverseSwap.id}: ${transactionHash}`,
        );

        this.emit('claim', reverseSwap, preimage);
      },
    );
  };

  private listenBlocks = () => {
    this.ethereumManager.provider
      .on('block', async (height) => {
        await Promise.all([
          this.checkExpiredSwaps(height),
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
        this.emit(
          'swap.expired',
          expirableSwap,
          wallet.symbol === this.ethereumManager.networkDetails.symbol,
        );
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
        this.emit(
          'reverseSwap.expired',
          expirableReverseSwap,
          wallet.symbol === this.ethereumManager.networkDetails.symbol,
        );
      }
    }
  };

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
}

export default EthereumNursery;
