import { Op } from 'sequelize';
import { EventEmitter } from 'events';
import { BigNumber, ContractTransaction } from 'ethers';
import Logger from '../Logger';
import Swap from '../db/models/Swap';
import Wallet from '../wallet/Wallet';
import { etherDecimals } from '../consts/Consts';
import SwapRepository from '../db/SwapRepository';
import { SwapUpdateEvent } from '../consts/Enums';
import ReverseSwap from '../db/models/ReverseSwap';
import WalletManager from '../wallet/WalletManager';
import ReverseSwapRepository from '../db/ReverseSwapRepository';
import EthereumManager from '../wallet/ethereum/EthereumManager';
import { getChainCurrency, getHexString, splitPairId } from '../Utils';
import EtherWalletProvider from '../wallet/providers/EtherWalletProvider';
import ERC20WalletProvider from '../wallet/providers/ERC20WalletProvider';
import { ERC20SwapValues, EtherSwapValues } from '../wallet/ethereum/ContractEventHandler';

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
  private static lockupErrors = {
    wrongToken: 'wrong token',
    wrongClaimAddress: 'wrong claim address',
    wrongAmount: 'wrong amount',
    wrongTimelock: 'wrong timelock',
  };

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
    const mempoolReverseSwaps = await this.reverseSwapRepository.getReverseSwaps({
      status: {
        [Op.eq]: SwapUpdateEvent.TransactionMempool,
      },
    });

    for (const mempoolReverseSwap of mempoolReverseSwaps) {
      try {
        const transaction = await this.ethereumManager.provider.getTransaction(mempoolReverseSwap.transactionId!);
        this.listenContractTransaction(mempoolReverseSwap, transaction);
      } catch (error) {
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
        this.emit('lockup.failed', swap, EthereumNursery.lockupErrors.wrongClaimAddress);
        return;
      }

      if (etherSwapValues.timelock !== swap.timeoutBlockHeight) {
        this.emit('lockup.failed', swap, EthereumNursery.lockupErrors.wrongTimelock);
        return;
      }

      if (swap.expectedAmount) {
        const expectedAmount = BigNumber.from(swap.expectedAmount).mul(etherDecimals);

        if (!etherSwapValues.amount.sub(expectedAmount).isZero()) {
          this.emit('lockup.failed', swap, EthereumNursery.lockupErrors.wrongAmount);
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

      if (wallet === undefined || !(wallet.walletProvider instanceof ERC20WalletProvider)) {
        return;
      }

      const erc20Wallet = wallet.walletProvider as ERC20WalletProvider;

      this.logger.debug(`Found lockup in ERC20Swap contract for Swap ${swap.id}: ${transactionHash}`);

      const normalizedSwapAmount = erc20Wallet.normalizeTokenBalance(erc20SwapValues.amount);

      swap = await this.swapRepository.setLockupTransaction(
        swap,
        transactionHash,
        normalizedSwapAmount,
        true,
      );

      if (erc20SwapValues.claimAddress !== this.ethereumManager.address) {
        this.emit('lockup.failed', swap, EthereumNursery.lockupErrors.wrongClaimAddress);
        return;
      }

      if (erc20SwapValues.tokenAddress !== erc20Wallet.getTokenAddress()) {
        this.emit('lockup.failed', swap, EthereumNursery.lockupErrors.wrongToken);
        return;
      }

      if (erc20SwapValues.timelock !== swap.timeoutBlockHeight) {
        this.emit('lockup.failed', swap, EthereumNursery.lockupErrors.wrongTimelock);
        return;
      }

      if (swap.expectedAmount) {
        if (swap.expectedAmount !== normalizedSwapAmount) {
          this.emit('lockup.failed', swap, EthereumNursery.lockupErrors.wrongAmount);
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

    if (wallet.walletProvider instanceof EtherWalletProvider || wallet.walletProvider instanceof ERC20WalletProvider) {
      return wallet;
    }

    return;
  }
}

export default EthereumNursery;
