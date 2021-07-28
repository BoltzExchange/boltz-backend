import { Op } from 'sequelize';
import { EventEmitter } from 'events';
import { BigNumber, ContractTransaction } from 'ethers';
import Errors from './Errors';
import Logger from '../Logger';
import Swap from '../db/models/Swap';
import Wallet from '../wallet/Wallet';
import { etherDecimals } from '../consts/Consts';
import SwapRepository from '../db/repositories/SwapRepository';
import ReverseSwap from '../db/models/ReverseSwap';
import WalletManager from '../wallet/WalletManager';
import ReverseSwapRepository from '../db/repositories/ReverseSwapRepository';
import { CurrencyType, SwapUpdateEvent } from '../consts/Enums';
import EthereumManager from '../wallet/ethereum/EthereumManager';
import { ERC20SwapValues, EtherSwapValues } from '../consts/Types';
import { getChainCurrency, getHexString, splitPairId } from '../Utils';
import ERC20WalletProvider from '../wallet/providers/ERC20WalletProvider';

interface EthereumNursery {
  // EtherSwap
  on(event: 'eth.lockup', listener: (swap: Swap, transactionHash: string, etherSwapValues: EtherSwapValues) => void): this;
  emit(event: 'eth.lockup', swap: Swap, transactionHash: string, etherSwapValues: EtherSwapValues): boolean;

  // ERC20Swap
  on(event: 'erc20.lockup', listener: (swap: Swap, transactionHash: string, erc20SwapValues: ERC20SwapValues) => void): this;
  emit(event: 'erc20.lockup', swap: Swap, transactionHash: string, erc20SwapValues: ERC20SwapValues): boolean;

  // Events used for both contracts
  on(event: 'swap.expired', listener: (swap: Swap, isEtherSwap: boolean) => void): this;
  emit(event: 'swap.expired', swap: Swap, isEtherSwap: boolean);

  on(event: 'lockup.failed', listener: (swap: Swap, reason: string) => void): this;
  emit(event: 'lockup.failed', swap: Swap, reason: string): boolean;

  on(event: 'reverseSwap.expired', listener: (reverseSwap: ReverseSwap, isEtherSwap: boolean) => void): this;
  emit(event: 'reverseSwap.expired', reverseSwap: ReverseSwap, isEtherSwap: boolean);

  on(event: 'lockup.failedToSend', listener: (reverseSwap: ReverseSwap, reason: string) => void): this;
  emit(event: 'lockup.failedToSend', reverseSwap: ReverseSwap, reason: string): boolean;

  on(event: 'lockup.confirmed', listener: (reverseSwap: ReverseSwap, transactionHash: string) => void): this;
  emit(event: 'lockup.confirmed', reverseSwap: ReverseSwap, transactionHash: string): boolean;

  on(event: 'claim', listener: (reverseSwap: ReverseSwap, preimage: Buffer) => void): this;
  emit(event: 'claim', reverseSwap: ReverseSwap, preimage: Buffer): boolean;
}

class EthereumNursery extends EventEmitter {
  private ethereumManager: EthereumManager;

  constructor(
    private logger: Logger,
    private walletManager: WalletManager,
    private swapRepository: SwapRepository,
    private reverseSwapRepository: ReverseSwapRepository,
  ) {
    super();

    this.ethereumManager = walletManager.ethereumManager!;

    this.listenBlocks();

    this.listenEtherSwap();
    this.listenERC20Swap();
  }

  public init = async (): Promise<void> => {
    // Fetch all Reverse Swaps with a pending lockup transaction
    const mempoolReverseSwaps = await this.reverseSwapRepository.getReverseSwaps({
      status: {
        [Op.eq]: SwapUpdateEvent.TransactionMempool,
      },
    });

    for (const mempoolReverseSwap of mempoolReverseSwaps) {
      const { base, quote } = splitPairId(mempoolReverseSwap.pair);
      const chainCurrency = getChainCurrency(base, quote, mempoolReverseSwap.orderSide, true);

      // Skip all Reverse Swaps that didn't send coins on the Ethereum chain
      if (this.getEthereumWallet(chainCurrency) === undefined) {
        continue;
      }

      try {
        const transaction = await this.ethereumManager.provider.getTransaction(mempoolReverseSwap.transactionId!);
        this.logger.debug(`Found pending Ethereum lockup transaction of Reverse Swap ${mempoolReverseSwap.id}: ${mempoolReverseSwap.transactionId}`);
        this.listenContractTransaction(mempoolReverseSwap, transaction);
      } catch (error) {
        // TODO: retry finding that transaction
        // If the provider can't find the transaction, it is not on the Ethereum chain
      }
    }
  }

  public listenContractTransaction = (reverseSwap: ReverseSwap, transaction: ContractTransaction): void => {
    transaction.wait(1).then(async () => {
      this.emit(
        'lockup.confirmed',
        await this.reverseSwapRepository.setReverseSwapStatus(reverseSwap, SwapUpdateEvent.TransactionConfirmed),
        transaction.hash,
      );
    }).catch(async (reason) => {
      this.emit(
        'lockup.failedToSend',
        await this.reverseSwapRepository.setReverseSwapStatus(reverseSwap, SwapUpdateEvent.TransactionFailed),
        reason,
      );
    });
  }

  private listenEtherSwap = () => {
    this.ethereumManager.contractEventHandler.on('eth.lockup', async (
      transactionHash,
      etherSwapValues,
    ) => {
      let swap = await this.swapRepository.getSwap({
        preimageHash: {
          [Op.eq]: getHexString(etherSwapValues.preimageHash),
        },
        status: {
          [Op.or]: [
            SwapUpdateEvent.SwapCreated,
            SwapUpdateEvent.InvoiceSet,
          ],
        },
      });

      if (!swap) {
        return;
      }

      const { base, quote } = splitPairId(swap.pair);
      const chainCurrency = getChainCurrency(base, quote, swap.orderSide, false);

      if (chainCurrency !== 'ETH') {
        return;
      }

      this.logger.debug(`Found lockup in EtherSwap contract for Swap ${swap.id}: ${transactionHash}`);

      swap = await this.swapRepository.setLockupTransaction(
        swap,
        transactionHash,
        etherSwapValues.amount.div(etherDecimals).toNumber(),
        true,
      );

      if (etherSwapValues.claimAddress !== this.ethereumManager.address) {
        this.emit(
          'lockup.failed',
          swap,
          Errors.INVALID_CLAIM_ADDRESS(etherSwapValues.claimAddress, this.ethereumManager.address).message,
        );
        return;
      }

      if (etherSwapValues.timelock !== swap.timeoutBlockHeight) {
        this.emit(
          'lockup.failed',
          swap,
          Errors.INVALID_TIMELOCK(etherSwapValues.timelock, swap.timeoutBlockHeight).message,
        );
        return;
      }

      if (swap.expectedAmount) {
        const expectedAmount = BigNumber.from(swap.expectedAmount).mul(etherDecimals);

        if (expectedAmount.gt(etherSwapValues.amount)) {
          this.emit(
            'lockup.failed',
            swap,
            Errors.INSUFFICIENT_AMOUNT(etherSwapValues.amount.div(etherDecimals).toNumber(), swap.expectedAmount).message,
          );
          return;
        }
      }

      this.emit('eth.lockup', swap, transactionHash, etherSwapValues);
    });

    this.ethereumManager.contractEventHandler.on('eth.claim', async (transactionHash, preimageHash, preimage) => {
      const reverseSwap = await this.reverseSwapRepository.getReverseSwap({
        preimageHash: {
          [Op.eq]: getHexString(preimageHash),
        },
        status: {
          [Op.not]: SwapUpdateEvent.InvoiceSettled,
        },
      });

      if (!reverseSwap) {
        return;
      }

      this.logger.debug(`Found claim in EtherSwap contract for Reverse Swap ${reverseSwap.id}: ${transactionHash}`);

      this.emit('claim', reverseSwap, preimage);
    });
  }

  private listenERC20Swap = () => {
    this.ethereumManager.contractEventHandler.on('erc20.lockup', async (
      transactionHash,
      erc20SwapValues,
    ) => {
      let swap = await this.swapRepository.getSwap({
        preimageHash: {
          [Op.eq]: getHexString(erc20SwapValues.preimageHash),
        },
        status: {
          [Op.or]: [
            SwapUpdateEvent.SwapCreated,
            SwapUpdateEvent.InvoiceSet,
          ],
        },
      });

      if (!swap) {
        return;
      }

      const { base, quote } = splitPairId(swap.pair);
      const chainCurrency = getChainCurrency(base, quote, swap.orderSide, false);

      const wallet = this.walletManager.wallets.get(chainCurrency);

      if (wallet === undefined || wallet.type !== CurrencyType.ERC20) {
        return;
      }

      const erc20Wallet = wallet.walletProvider as ERC20WalletProvider;

      this.logger.debug(`Found lockup in ERC20Swap contract for Swap ${swap.id}: ${transactionHash}`);

      swap = await this.swapRepository.setLockupTransaction(
        swap,
        transactionHash,
        erc20Wallet.normalizeTokenAmount(erc20SwapValues.amount),
        true,
      );

      if (erc20SwapValues.claimAddress !== this.ethereumManager.address) {
        this.emit(
          'lockup.failed',
          swap,
          Errors.INVALID_CLAIM_ADDRESS(erc20SwapValues.claimAddress, this.ethereumManager.address).message,
        );
        return;
      }

      if (erc20SwapValues.tokenAddress !== erc20Wallet.getTokenAddress()) {
        this.emit(
          'lockup.failed',
          swap,
          Errors.INVALID_TOKEN_LOCKED(erc20SwapValues.tokenAddress, this.ethereumManager.address).message,
        );
        return;
      }

      if (erc20SwapValues.timelock !== swap.timeoutBlockHeight) {
        this.emit(
          'lockup.failed',
          swap,
          Errors.INVALID_TIMELOCK(erc20SwapValues.timelock, swap.timeoutBlockHeight).message,
        );
        return;
      }

      if (swap.expectedAmount) {
        if (erc20Wallet.formatTokenAmount(swap.expectedAmount).gt(erc20SwapValues.amount)) {
          this.emit(
            'lockup.failed',
            swap,
            Errors.INSUFFICIENT_AMOUNT(erc20Wallet.normalizeTokenAmount(erc20SwapValues.amount), swap.expectedAmount).message,
          );
          return;
        }
      }

      this.emit('erc20.lockup', swap, transactionHash, erc20SwapValues);
    });

    this.ethereumManager.contractEventHandler.on('erc20.claim', async (transactionHash, preimageHash, preimage) => {
      const reverseSwap = await this.reverseSwapRepository.getReverseSwap({
        preimageHash: {
          [Op.eq]: getHexString(preimageHash),
        },
        status: {
          [Op.not]: SwapUpdateEvent.InvoiceSettled,
        },
      });

      if (!reverseSwap) {
        return;
      }

      this.logger.debug(`Found claim in ERC20Swap contract for Reverse Swap ${reverseSwap.id}: ${transactionHash}`);

      this.emit('claim', reverseSwap, preimage);
    });
  }

  private listenBlocks = () => {
    this.ethereumManager.provider.on('block', async (height) => {
      await Promise.all([
        this.checkExpiredSwaps(height),
        this.checkExpiredReverseSwaps(height),
      ]);
    });
  }

  private checkExpiredSwaps = async (height: number) => {
    const expirableSwaps = await this.swapRepository.getSwapsExpirable(height);

    for (const expirableSwap of expirableSwaps) {
      const { base, quote } = splitPairId(expirableSwap.pair);
      const chainCurrency = getChainCurrency(base, quote, expirableSwap.orderSide, false);

      const wallet = this.getEthereumWallet(chainCurrency);

      if (wallet) {
        this.emit('swap.expired', expirableSwap, wallet.symbol === 'ETH');
      }
    }
  }

  private checkExpiredReverseSwaps = async (height: number) => {
    const expirableReverseSwaps = await this.reverseSwapRepository.getReverseSwapsExpirable(height);

    for (const expirableReverseSwap of expirableReverseSwaps) {
      const { base, quote } = splitPairId(expirableReverseSwap.pair);
      const chainCurrency = getChainCurrency(base, quote, expirableReverseSwap.orderSide, true);

      const wallet = this.getEthereumWallet(chainCurrency);

      if (wallet) {
        this.emit('reverseSwap.expired', expirableReverseSwap, wallet.symbol === 'ETH');
      }
    }
  }

  /**
   * Returns a wallet in case there is one with the symbol and it is an Ethereum one
   */
  private getEthereumWallet = (symbol: string): Wallet | undefined => {
    const wallet = this.walletManager.wallets.get(symbol);

    if (!wallet) {
      return;
    }

    if (wallet.type === CurrencyType.Ether || wallet.type === CurrencyType.ERC20) {
      return wallet;
    }

    return;
  }
}

export default EthereumNursery;
