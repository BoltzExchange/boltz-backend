import { Op } from 'sequelize';
import AsyncLock from 'async-lock';
import { BigNumber } from 'ethers';
import { EventEmitter } from 'events';
import { Transaction } from 'bitcoinjs-lib';
import { constructClaimTransaction, constructRefundTransaction, detectSwap, OutputType } from 'boltz-core';
import Errors from './Errors';
import Logger from '../Logger';
import Swap from '../db/models/Swap';
import Wallet from '../wallet/Wallet';
import UtxoNursery from './UtxoNursery';
import ChannelNursery from './ChannelNursery';
import FeeProvider from '../rates/FeeProvider';
import LndClient from '../lightning/LndClient';
import ChainClient from '../chain/ChainClient';
import EthereumNursery from './EthereumNursery';
import RateProvider from '../rates/RateProvider';
import SwapRepository from '../db/SwapRepository';
import LightningNursery from './LightningNursery';
import ReverseSwap from '../db/models/ReverseSwap';
import { PaymentFailureReason } from '../proto/lnd/rpc_pb';
import ChannelCreation from '../db/models/ChannelCreation';
import ReverseSwapRepository from '../db/ReverseSwapRepository';
import ContractHandler from '../wallet/ethereum/ContractHandler';
import WalletManager, { Currency } from '../wallet/WalletManager';
import { ERC20SwapValues, EtherSwapValues } from '../consts/Types';
import ChannelCreationRepository from '../db/ChannelCreationRepository';
import { etherDecimals, ReverseSwapOutputType } from '../consts/Consts';
import ERC20WalletProvider from '../wallet/providers/ERC20WalletProvider';
import { ChannelCreationStatus, CurrencyType, SwapUpdateEvent } from '../consts/Enums';
import { queryERC20SwapValuesFromLock, queryEtherSwapValuesFromLock } from '../wallet/ethereum/ContractUtils';
import {
  calculateEthereumTransactionFee,
  calculateUtxoTransactionFee,
  decodeInvoice,
  formatError,
  getChainCurrency,
  getHexBuffer,
  getHexString,
  getLightningCurrency,
  getRate,
  splitPairId,
} from '../Utils';

interface SwapNursery {
  // UTXO based chains emit the "Transaction" object and Ethereum based ones just the transaction hash
  on(event: 'transaction', listener: (swap: Swap | ReverseSwap, transaction: Transaction | string, confirmed: boolean, isReverse: boolean) => void): this;
  emit(event: 'transaction', swap: Swap | ReverseSwap, transaction: Transaction | string, confirmed: boolean, isReverse: boolean): boolean;

  on(event: 'expiration', listener: (swap: Swap | ReverseSwap, isReverse: boolean) => void): this;
  emit(event: 'expiration', swap: Swap | ReverseSwap, isReverse: boolean): boolean;

  // Swap related events
  on(event: 'lockup.failed', listener: (swap: Swap) => void): this;
  emit(event: 'lockup.failed', swap: Swap): boolean;

  on(event: 'zeroconf.rejected', listener: (swap: Swap) => void): this;
  emit(event: 'zeroconf.rejected', swap: Swap): boolean;

  on(event: 'invoice.pending', listener: (swap: Swap) => void): this;
  emit(even: 'invoice.pending', swap: Swap): boolean;

  on(event: 'invoice.failedToPay', listener: (swap: Swap) => void): this;
  emit(event: 'invoice.failedToPay', swap: Swap): boolean;

  on(event: 'invoice.paid', listener: (swap: Swap) => void): this;
  emit(event: 'invoice.paid', swap: Swap): boolean;

  on(event: 'claim', listener: (swap: Swap, channelCreation?: ChannelCreation) => void): this;
  emit(event: 'claim', swap: Swap, channelCreation?: ChannelCreation): boolean;

  // Reverse swap related events
  on(event: 'minerfee.paid', listener: (reverseSwap: ReverseSwap) => void): this;
  emit(event: 'minerfee.paid', reverseSwap: ReverseSwap): boolean;

  // UTXO based chains emit the "Transaction" object and Ethereum based ones just the transaction hash
  on(event: 'coins.sent', listener: (reverseSwap: ReverseSwap, transaction: Transaction | string) => void): this;
  emit(event: 'coins.sent', reverseSwap: ReverseSwap, transaction: Transaction | string): boolean;

  on(event: 'coins.failedToSend', listener: (reverseSwap: ReverseSwap) => void): this;
  emit(event: 'coins.failedToSend', reverseSwap: ReverseSwap): boolean;

  on(event: 'refund', listener: (reverseSwap: ReverseSwap, refundTransaction: string) => void): this;
  emit(event: 'refund', reverseSwap: ReverseSwap, refundTransaction: string): boolean;

  on(event: 'invoice.settled', listener: (reverseSwap: ReverseSwap) => void): this;
  emit(event: 'invoice.settled', reverseSwap: ReverseSwap): boolean;
}

class SwapNursery extends EventEmitter {
  // Constants
  public static reverseSwapMempoolEta = 2;

  // Nurseries
  public readonly channelNursery: ChannelNursery;

  private readonly utxoNursery: UtxoNursery;
  private readonly lightningNursery: LightningNursery;

  private readonly ethereumNursery?: EthereumNursery;

  // Maps
  private currencies = new Map<string, Currency>();

  // Locks
  private lock = new AsyncLock();

  private static retryLock = 'retry';

  private static swapLock = 'swap';
  private static reverseSwapLock = 'reverseSwap';

  constructor(
    private logger: Logger,
    private rateProvider: RateProvider,
    private walletManager: WalletManager,
    private swapRepository: SwapRepository,
    private reverseSwapRepository: ReverseSwapRepository,
    private channelCreationRepository: ChannelCreationRepository,
    private swapOutputType: OutputType,
    private retryInterval: number,
    prepayMinerFee: boolean,
  ) {
    super();

    this.logger.info(`Setting Swap retry interval to ${retryInterval} seconds`);

    this.utxoNursery = new UtxoNursery(
      this.logger,
      this.walletManager,
      this.swapRepository,
      this.reverseSwapRepository,
    );

    this.lightningNursery = new LightningNursery(
      this.logger,
      prepayMinerFee,
      this.reverseSwapRepository,
    );

    if (this.walletManager.ethereumManager) {
      this.ethereumNursery = new EthereumNursery(
        this.logger,
        this.walletManager,
        this.swapRepository,
        this.reverseSwapRepository,
      );
    }

    this.channelNursery = new ChannelNursery(
      this.logger,
      this.swapRepository,
      this.channelCreationRepository,
      this.attemptSettleSwap,
    );
  }

  public init = async (currencies: Currency[]): Promise<void> => {
    currencies.forEach((currency) => {
      this.currencies.set(currency.symbol, currency);
    });

    if (this.ethereumNursery) {
      await this.listenEthereumNursery(this.ethereumNursery);
    }

    // Swap events
    this.utxoNursery.on('swap.expired', async (swap) => {
      await this.lock.acquire(SwapNursery.swapLock, async () => {
        await this.expireSwap(swap);
      });
    });

    this.utxoNursery.on('swap.lockup.failed', async (swap, reason) => {
      await this.lock.acquire(SwapNursery.swapLock, async () => {
        await this.lockupFailed(swap, reason);
      });
    });

      this.utxoNursery.on('swap.lockup.zeroconf.rejected', async (swap, transaction, reason) => {
      await this.lock.acquire(SwapNursery.swapLock, async () => {
        this.logger.warn(`Rejected 0-conf lockup transaction (${transaction.getId()}) of ${swap.id}: ${reason}`);

        if (!swap.invoice) {
          await this.setSwapRate(swap);
        }

        this.emit('zeroconf.rejected', await this.swapRepository.setSwapStatus(swap, SwapUpdateEvent.TransactionZeroConfRejected));
      });
    });

    this.utxoNursery.on('swap.lockup', async (swap, transaction, confirmed) => {
      await this.lock.acquire(SwapNursery.swapLock, async () => {
        this.emit('transaction', swap, transaction, confirmed, false);

        if (swap.invoice) {
          const { base, quote } = splitPairId(swap.pair);
          const chainSymbol = getChainCurrency(base, quote, swap.orderSide, false);

          const { chainClient } = this.currencies.get(chainSymbol)!;
          const wallet = this.walletManager.wallets.get(chainSymbol)!;

          await this.claimUtxo(chainClient!, wallet, swap, transaction);
        } else {
          await this.setSwapRate(swap);
        }
      });
    });

    // Reverse Swap events
    this.utxoNursery.on('reverseSwap.expired', async (reverseSwap) => {
      await this.lock.acquire(SwapNursery.reverseSwapLock, async () => {
        await this.expireReverseSwap(reverseSwap);
      });
    });

    this.utxoNursery.on('reverseSwap.lockup.confirmed', async (reverseSwap, transaction) => {
      await this.lock.acquire(SwapNursery.reverseSwapLock, async () => {
        this.emit('transaction', reverseSwap, transaction, true, true);
      });
    });

    this.lightningNursery.on('minerfee.invoice.paid', async (reverseSwap) => {
      await this.lock.acquire(SwapNursery.reverseSwapLock, async () => {
        this.emit('minerfee.paid', reverseSwap);
      });
    });

    this.lightningNursery.on('invoice.paid', async (reverseSwap) => {
      await this.lock.acquire(SwapNursery.reverseSwapLock, async () => {
        const { base, quote } = splitPairId(reverseSwap.pair);
        const chainSymbol = getChainCurrency(base, quote, reverseSwap.orderSide, true);
        const lightningSymbol = getLightningCurrency(base, quote, reverseSwap.orderSide, true);

        const chainCurrency = this.currencies.get(chainSymbol)!;
        const { lndClient } = this.currencies.get(lightningSymbol)!;

        const wallet = this.walletManager.wallets.get(chainSymbol)!;

          switch (chainCurrency.type) {
          case CurrencyType.BitcoinLike:
            await this.lockupUtxo(
              chainCurrency.chainClient!,
              this.walletManager.wallets.get(chainSymbol)!,
              lndClient!,
              reverseSwap
            );
            break;

          case CurrencyType.Ether:
            await this.lockupEther(
              wallet,
              lndClient!,
              reverseSwap,
            );
            break;

          case CurrencyType.ERC20:
            await this.lockupERC20(
              wallet,
              lndClient!,
              reverseSwap,
            );
            break;
        }
      });
    });

    this.utxoNursery.on('reverseSwap.claimed', async (reverseSwap: ReverseSwap, preimage: Buffer) => {
      await this.lock.acquire(SwapNursery.reverseSwapLock, async () => {
        await this.settleReverseSwapInvoice(reverseSwap, preimage);
      });
    });

    this.utxoNursery.bindCurrency(currencies);
    this.lightningNursery.bindCurrencies(currencies);

    await this.channelNursery.init(currencies);

    if (this.retryInterval !== 0) {
      setInterval(async () => {
        // Skip this iteration if the last one is still running
        if (this.lock.isBusy(SwapNursery.retryLock)) {
          return;
        }

        this.logger.silly('Retrying settling Swaps with pending invoices');

        await this.lock.acquire(SwapNursery.retryLock, async () => {
          await this.lock.acquire(SwapNursery.swapLock, async () => {
            const pendingInvoiceSwaps = await this.swapRepository.getSwaps({
              status: {
                [Op.eq]: SwapUpdateEvent.InvoicePending,
              },
            });

            for (const pendingInvoiceSwap of pendingInvoiceSwaps) {
              const { base, quote } = splitPairId(pendingInvoiceSwap.pair);
              const chainCurrency = this.currencies.get(getChainCurrency(base, quote, pendingInvoiceSwap.orderSide, false))!;

              await this.attemptSettleSwap(chainCurrency, pendingInvoiceSwap);
            }
          });
        });
      }, this.retryInterval * 1000);
    }
  }

  public attemptSettleSwap = async (currency: Currency, swap: Swap, outgoingChannelId?: string): Promise<void> => {
    switch (currency.type) {
      case CurrencyType.BitcoinLike: {
        const lockupTransactionHex = await currency.chainClient!.getRawTransaction(swap.lockupTransactionId!);

        await this.claimUtxo(
          currency.chainClient!,
          this.walletManager.wallets.get(currency.symbol)!,
          swap,
          Transaction.fromHex(lockupTransactionHex),
          outgoingChannelId,
        );
        break;
      }

      case CurrencyType.Ether:
        await this.claimEther(
          this.walletManager.ethereumManager!.contractHandler,
          swap,
          await queryEtherSwapValuesFromLock(this.walletManager.ethereumManager!.etherSwap, swap.lockupTransactionId!),
          outgoingChannelId,
        );
        break;

      case CurrencyType.ERC20:
        await this.claimERC20(
          this.walletManager.ethereumManager!.contractHandler,
          swap,
          await queryERC20SwapValuesFromLock(this.walletManager.ethereumManager!.erc20Swap, swap.lockupTransactionId!),
          outgoingChannelId,
        );
        break;
    }
  }

  private listenEthereumNursery = async (ethereumNursery: EthereumNursery) => {
    const contractHandler = this.walletManager.ethereumManager!.contractHandler;

    // Swap events
    ethereumNursery.on('swap.expired', async (swap) => {
      await this.lock.acquire(SwapNursery.swapLock, async () => {
        await this.expireSwap(swap);
      });
    });

    ethereumNursery.on('lockup.failed', async (swap, reason) => {
      await this.lock.acquire(SwapNursery.swapLock, async () => {
        await this.lockupFailed(swap, reason);
      });
    });

    ethereumNursery.on('eth.lockup', async (swap, transactionHash, etherSwapValues) => {
      await this.lock.acquire(SwapNursery.swapLock, async () => {
        this.emit('transaction', swap, transactionHash, true, false);

        if (swap.invoice) {
          await this.claimEther(contractHandler, swap, etherSwapValues);
        } else {
          await this.setSwapRate(swap);
        }
      });
    });

    ethereumNursery.on('erc20.lockup', async (swap, transactionHash, erc20SwapValues) => {
      await this.lock.acquire(SwapNursery.swapLock, async () => {
        this.emit('transaction', swap, transactionHash, true, false);

        if (swap.invoice) {
          await this.claimERC20(contractHandler, swap, erc20SwapValues);
        } else {
          await this.setSwapRate(swap);
        }
      });
    });

    // Reverse Swap events
    ethereumNursery.on('reverseSwap.expired', async (reverseSwap) => {
      await this.lock.acquire(SwapNursery.reverseSwapLock, async () => {
        await this.expireReverseSwap(reverseSwap);
      });
    });

    ethereumNursery.on('lockup.failedToSend', async (reverseSwap: ReverseSwap, reason ) => {
      await this.lock.acquire(SwapNursery.reverseSwapLock, async () => {
        const { base, quote } = splitPairId(reverseSwap.pair);
        const chainSymbol = getChainCurrency(base, quote, reverseSwap.orderSide, true);
        const lightningSymbol = getLightningCurrency(base, quote, reverseSwap.orderSide, true);

        await this.handleReverseSwapSendFailed(
          reverseSwap,
          chainSymbol,
          this.currencies.get(lightningSymbol)!.lndClient!,
          reason);
      });
    });

    ethereumNursery.on('lockup.confirmed', async (reverseSwap, transactionHash) => {
      await this.lock.acquire(SwapNursery.reverseSwapLock, async () => {
        this.emit('transaction', reverseSwap, transactionHash, true, true);
      });
    });

    ethereumNursery.on('claim', async (reverseSwap, preimage) => {
      await this.lock.acquire(SwapNursery.reverseSwapLock, async () => {
        await this.settleReverseSwapInvoice(reverseSwap, preimage);
      });
    });

    await ethereumNursery.init();
  }

  /**
   * Sets the rate for a Swap that doesn't have an invoice yet
   */
  private setSwapRate = async (swap: Swap) => {
    if (!swap.rate) {
      const rate = getRate(
        this.rateProvider.pairs.get(swap.pair)!.rate,
        swap.orderSide,
        false
      );

      await this.swapRepository.setRate(swap, rate);
    }
  }

  private lockupUtxo = async (
    chainClient: ChainClient,
    wallet: Wallet,
    lndClient: LndClient,
    reverseSwap: ReverseSwap,
  ) => {
    try {
      let feePerVbyte: number;

      if (reverseSwap.minerFeeInvoice) {
        // TODO: how does this behave cross chain
        feePerVbyte = Math.round(decodeInvoice(reverseSwap.minerFeeInvoice).satoshis / FeeProvider.transactionSizes.reverseLockup);
        this.logger.debug(`Using prepay minerfee for lockups of Reverse Swap ${reverseSwap.id}: ${feePerVbyte} sat/vbyte`);
      } else {
        feePerVbyte = await chainClient.estimateFee(SwapNursery.reverseSwapMempoolEta);
      }

      const { transaction, transactionId, vout, fee } = await wallet.sendToAddress(reverseSwap.lockupAddress, reverseSwap.onchainAmount, feePerVbyte);
      this.logger.verbose(`Locked up ${reverseSwap.onchainAmount} ${wallet.symbol} for Reverse Swap ${reverseSwap.id}: ${transactionId}:${vout!}`);

      chainClient.addInputFilter(transaction!.getHash());

      // For the "transaction.confirmed" event of the lockup transaction
      chainClient.addOutputFilter(wallet.decodeAddress(reverseSwap.lockupAddress));

      this.emit('coins.sent', await this.reverseSwapRepository.setLockupTransaction(reverseSwap, transactionId, fee!, vout!), transaction!);
    } catch (error) {
      await this.handleReverseSwapSendFailed(reverseSwap, wallet.symbol, lndClient, error);
    }
  }

  // TODO: use prepay miner fee for Ethereum
  private lockupEther = async (
    wallet: Wallet,
    lndClient: LndClient,
    reverseSwap: ReverseSwap,
  ) => {
    try {
      const contractTransaction = await this.walletManager.ethereumManager!.contractHandler.lockupEther(
        getHexBuffer(reverseSwap.preimageHash),
        BigNumber.from(reverseSwap.onchainAmount).mul(etherDecimals),
        reverseSwap.claimAddress!,
        reverseSwap.timeoutBlockHeight,
      );

      this.ethereumNursery!.listenContractTransaction(reverseSwap, contractTransaction);
      this.logger.verbose(`Locked up ${reverseSwap.onchainAmount} Ether for Reverse Swap ${reverseSwap.id}: ${contractTransaction.hash}`);

      this.emit(
        'coins.sent',
        await this.reverseSwapRepository.setLockupTransaction(
          reverseSwap,
          contractTransaction.hash,
          calculateEthereumTransactionFee(contractTransaction),
        ),
        contractTransaction.hash,
      );
    } catch (error) {
      await this.handleReverseSwapSendFailed(reverseSwap, wallet.symbol, lndClient, error);
    }
  }

  private lockupERC20 = async (
    wallet: Wallet,
    lndClient: LndClient,
    reverseSwap: ReverseSwap,
  ) => {
    try {
      const walletProvider = wallet.walletProvider as ERC20WalletProvider;

      const contractTransaction = await this.walletManager.ethereumManager!.contractHandler.lockupToken(
        walletProvider,
        getHexBuffer(reverseSwap.preimageHash),
        walletProvider.formatTokenAmount(reverseSwap.onchainAmount),
        reverseSwap.claimAddress!,
        reverseSwap.timeoutBlockHeight,
      );

      this.ethereumNursery!.listenContractTransaction(reverseSwap, contractTransaction);
      this.logger.verbose(`Locked up ${reverseSwap.onchainAmount} ${wallet.symbol} for Reverse Swap ${reverseSwap.id}: ${contractTransaction.hash}`);

      this.emit(
        'coins.sent',
        await this.reverseSwapRepository.setLockupTransaction(
          reverseSwap,
          contractTransaction.hash,
          calculateEthereumTransactionFee(contractTransaction),
        ),
        contractTransaction.hash,
      );
    } catch (error) {
      await this.handleReverseSwapSendFailed(reverseSwap, wallet.symbol, lndClient, error);
    }
  }

  private claimUtxo = async (
    chainClient: ChainClient,
    wallet: Wallet,
    swap: Swap,
    transaction: Transaction,
    outgoingChannelId?: string,
  ) => {
    const channelCreation = await this.channelCreationRepository.getChannelCreation({
      swapId: {
        [Op.eq]: swap.id,
      },
    });
    const preimage = await this.paySwapInvoice(swap, channelCreation, outgoingChannelId);

    if (!preimage) {
      return;
    }

    const destinationAddress = await wallet.getAddress();

    // Compatibility mode with database schema version 0 in which this column didn't exist
    if (swap.lockupTransactionVout === undefined) {
      swap.lockupTransactionVout = detectSwap(getHexBuffer(swap.redeemScript!), transaction)!.vout;
    }

    const output = transaction.outs[swap.lockupTransactionVout!];

    const claimTransaction = await constructClaimTransaction(
      [
        {
          preimage,
          vout: swap.lockupTransactionVout!,
          value: output.value,
          script: output.script,
          type: this.swapOutputType,
          txHash: transaction.getHash(),
          keys: wallet.getKeysByIndex(swap.keyIndex!),
          redeemScript: getHexBuffer(swap.redeemScript!),
        }
      ],
      wallet.decodeAddress(destinationAddress),
      await chainClient.estimateFee(),
      true,
    );
    const claimTransactionFee = await calculateUtxoTransactionFee(chainClient, claimTransaction);

    await chainClient.sendRawTransaction(claimTransaction.toHex());

    this.logger.info(`Claimed ${wallet.symbol} of Swap ${swap.id} in: ${claimTransaction.getId()}`);

    this.emit(
      'claim',
      await this.swapRepository.setMinerFee(swap, claimTransactionFee),
      channelCreation || undefined,
    );
  }

  private claimEther = async (contractHandler: ContractHandler, swap: Swap, etherSwapValues: EtherSwapValues, outgoingChannelId?: string) => {
    const channelCreation = await this.channelCreationRepository.getChannelCreation({
      swapId: {
        [Op.eq]: swap.id,
      },
    });
    const preimage = await this.paySwapInvoice(swap, channelCreation, outgoingChannelId);

    if (!preimage) {
      return;
    }

    const contractTransaction = await contractHandler.claimEther(
      preimage,
      etherSwapValues.amount,
      etherSwapValues.refundAddress,
      etherSwapValues.timelock,
    );

    this.logger.info(`Claimed Ether of Swap ${swap.id} in: ${contractTransaction.hash}`);
    this.emit('claim', await this.swapRepository.setMinerFee(swap, calculateEthereumTransactionFee(contractTransaction)), channelCreation || undefined);
  }

  private claimERC20 = async (contractHandler: ContractHandler, swap: Swap, erc20SwapValues: ERC20SwapValues, outgoingChannelId?: string) => {
    const channelCreation = await this.channelCreationRepository.getChannelCreation({
      swapId: {
        [Op.eq]: swap.id,
      },
    });
    const preimage = await this.paySwapInvoice(swap, channelCreation, outgoingChannelId);

    if (!preimage) {
      return;
    }

    const { base, quote } = splitPairId(swap.pair);
    const chainCurrency = getChainCurrency(base, quote, swap.orderSide, false);

    const wallet = this.walletManager.wallets.get(chainCurrency)!;

    const contractTransaction = await contractHandler.claimToken(
      wallet.walletProvider as ERC20WalletProvider,
      preimage,
      erc20SwapValues.amount,
      erc20SwapValues.refundAddress,
      erc20SwapValues.timelock,
    );

    this.logger.info(`Claimed ${chainCurrency} of Swap ${swap.id} in: ${contractTransaction.hash}`);
    this.emit('claim', await this.swapRepository.setMinerFee(swap, calculateEthereumTransactionFee(contractTransaction)), channelCreation || undefined);
  }

  /**
   * "paySwapInvoice" takes care of paying invoices and handling the errors that can occur by doing that
   * This effectively means logging errors, opening channels and abandoning Swaps
   */
  private paySwapInvoice = async (swap: Swap, channelCreation: ChannelCreation | null, outgoingChannelId?: string): Promise<Buffer | undefined> => {
    this.logger.verbose(`Paying invoice of Swap ${swap.id}`);

    if (swap.status !== SwapUpdateEvent.InvoicePending && swap.status !== SwapUpdateEvent.ChannelCreated) {
      this.emit('invoice.pending', await this.swapRepository.setSwapStatus(swap, SwapUpdateEvent.InvoicePending));
    }

    const { base, quote } = splitPairId(swap.pair);
    const lightningSymbol = getLightningCurrency(base, quote, swap.orderSide, false);

    const lightningCurrency = this.currencies.get(lightningSymbol)!;

    try {
      const payResponse = await lightningCurrency.lndClient!.sendPayment(swap.invoice!, outgoingChannelId);

      this.logger.debug(`Got preimage of Swap ${swap.id}: ${getHexString(payResponse.preimage)}`);
      this.emit('invoice.paid', await this.swapRepository.setInvoicePaid(swap, payResponse.feeMsat));

      return payResponse.preimage;
    } catch (error) {
      // TODO: what error is thrown for expired invoices?

      const errorMessage = typeof error === 'number' ? LndClient.formatPaymentFailureReason(error) : formatError(error);
      this.logger.warn(`Could not pay invoice of Swap ${swap.id} because: ${errorMessage}`);

      // If the recipient rejects the payment or the invoice expired, the Swap will be abandoned
      if (
        error === PaymentFailureReason.FAILURE_REASON_INCORRECT_PAYMENT_DETAILS ||
        errorMessage.includes('invoice expired')
      ) {
        this.logger.warn(`Abandoning Swap ${swap.id} because: ${errorMessage}`);
        this.emit(
          'invoice.failedToPay',
          await this.swapRepository.setSwapStatus(
            swap,
            SwapUpdateEvent.InvoiceFailedToPay,
            Errors.INVOICE_COULD_NOT_BE_PAID().message,
          ),
        );

      // If the invoice could not be paid but the Swap has a Channel Creation attached to it, a channel will be opened
      } else if (
        typeof error === 'number' &&
        channelCreation &&
        channelCreation.status !== ChannelCreationStatus.Created
      ) {
        switch (error) {
          case PaymentFailureReason.FAILURE_REASON_TIMEOUT:
          case PaymentFailureReason.FAILURE_REASON_NO_ROUTE:
          case PaymentFailureReason.FAILURE_REASON_INSUFFICIENT_BALANCE:
            // TODO: !formattedError.startsWith('unable to route payment to destination: UnknownNextPeer')
            await this.channelNursery.openChannel(lightningCurrency, swap, channelCreation);
        }
      }
    }

    return;
  }

  private settleReverseSwapInvoice = async (reverseSwap: ReverseSwap, preimage: Buffer) => {
    const { base, quote } = splitPairId(reverseSwap.pair);
    const lightningCurrency = getLightningCurrency(base, quote, reverseSwap.orderSide, true);

    const { lndClient } = this.currencies.get(lightningCurrency)!;
    await lndClient!.settleInvoice(preimage);

    this.logger.info(`Settled Reverse Swap ${reverseSwap.id}`);

    this.emit('invoice.settled', await this.reverseSwapRepository.setInvoiceSettled(reverseSwap, getHexString(preimage)));
  }

  private handleReverseSwapSendFailed = async (reverseSwap: ReverseSwap, chainSymbol: string, lndClient: LndClient, error: unknown) => {
    await lndClient.cancelInvoice(getHexBuffer(reverseSwap.preimageHash));

    this.logger.warn(`Failed to lockup ${reverseSwap.onchainAmount} ${chainSymbol} for Reverse Swap ${reverseSwap.id}: ${formatError(error)}`);
    this.emit('coins.failedToSend', await this.reverseSwapRepository.setReverseSwapStatus(
      reverseSwap,
      SwapUpdateEvent.TransactionFailed,
      Errors.COINS_COULD_NOT_BE_SENT().message,
    ));
  }

  private lockupFailed = async (swap: Swap, reason: string) => {
    this.logger.warn(`Lockup of Swap ${swap.id} failed: ${reason}`);
    this.emit('lockup.failed', await this.swapRepository.setSwapStatus(swap, SwapUpdateEvent.TransactionLockupFailed, reason));
  }

  private expireSwap = async (swap: Swap) =>  {
    // Check "expireReverseSwap" for reason
    const queriedSwap = await this.swapRepository.getSwap({
      id: {
        [Op.eq]: swap.id,
      },
    });

    if (queriedSwap!.status === SwapUpdateEvent.SwapExpired) {
      return;
    }

    this.emit(
      'expiration',
      await this.swapRepository.setSwapStatus(swap, SwapUpdateEvent.SwapExpired, Errors.ONCHAIN_HTLC_TIMED_OUT().message),
      false,
    );
  }

  private expireReverseSwap = async (reverseSwap: ReverseSwap) => {
    // Sometimes, when blocks are mined quickly (realistically just regtest), it can happen that the
    // nurseries, which are not in the async lock, send the expiration event of a Swap multiple times.
    // To handle this scenario, the Swap is queried again to ensure that it should actually be expired or refunded
    const queriedReverseSwap = await this.reverseSwapRepository.getReverseSwap({
      id: {
        [Op.eq]: reverseSwap.id,
      },
    });

    if (queriedReverseSwap!.status === SwapUpdateEvent.SwapExpired || queriedReverseSwap!.status === SwapUpdateEvent.TransactionRefunded) {
      return;
    }

    const { base, quote } = splitPairId(reverseSwap.pair);
    const chainSymbol = getChainCurrency(base, quote, reverseSwap.orderSide, true);
    const lightningSymbol = getLightningCurrency(base, quote, reverseSwap.orderSide, true);

    const chainCurrency = this.currencies.get(chainSymbol)!;
    const lightningCurrency = this.currencies.get(lightningSymbol)!;

    if (reverseSwap.transactionId) {
      switch (chainCurrency.type) {
        case CurrencyType.BitcoinLike:
          await this.refundUtxo(reverseSwap, chainSymbol);
          break;

        case CurrencyType.Ether:
          await this.refundEther(reverseSwap);
          break;

        case CurrencyType.ERC20:
          await this.refundERC20(reverseSwap, chainSymbol);
          break;
      }
    } else {
      this.emit(
        'expiration',
        await this.reverseSwapRepository.setReverseSwapStatus(
          reverseSwap,
          SwapUpdateEvent.SwapExpired,
          Errors.ONCHAIN_HTLC_TIMED_OUT().message,
        ),
        true,
      );
    }

    await lightningCurrency.lndClient!.cancelInvoice(getHexBuffer(reverseSwap.preimageHash));

    if (reverseSwap.minerFeeInvoice) {
      await lightningCurrency.lndClient!.cancelInvoice(getHexBuffer(decodeInvoice(reverseSwap.minerFeeInvoice).paymentHash!));
    }
  }

  private refundUtxo = async (reverseSwap: ReverseSwap, chainSymbol: string) => {
    const chainCurrency = this.currencies.get(chainSymbol)!;
    const wallet = this.walletManager.wallets.get(chainSymbol)!;

    const rawLockupTransaction = await chainCurrency.chainClient!.getRawTransaction(reverseSwap.transactionId!);
    const lockupTransaction = Transaction.fromHex(rawLockupTransaction);

    const lockupOutput = lockupTransaction.outs[reverseSwap.transactionVout!];

    const destinationAddress = await wallet.getAddress();
    const refundTransaction = constructRefundTransaction(
      [{
        ...lockupOutput,
        type: ReverseSwapOutputType,
        vout: reverseSwap.transactionVout!,
        txHash: lockupTransaction.getHash(),
        keys: wallet.getKeysByIndex(reverseSwap.keyIndex!),
        redeemScript: getHexBuffer(reverseSwap.redeemScript!),
      }],
      wallet.decodeAddress(destinationAddress),
      reverseSwap.timeoutBlockHeight,
      await chainCurrency.chainClient!.estimateFee(),
    );
    const minerFee = await calculateUtxoTransactionFee(chainCurrency.chainClient!, refundTransaction);

    await chainCurrency.chainClient!.sendRawTransaction(refundTransaction.toHex());

    this.logger.info(`Refunded ${chainSymbol} of Reverse Swap ${reverseSwap.id} in: ${refundTransaction.getId()}`);
    this.emit(
      'refund',
      await this.reverseSwapRepository.setTransactionRefunded(reverseSwap, minerFee, Errors.REFUNDED_COINS(reverseSwap.transactionId!).message),
      refundTransaction.getId(),
    );
  }

  private refundEther = async (reverseSwap: ReverseSwap) => {
    const ethereumManager = this.walletManager.ethereumManager!;

    const etherSwapValues = await queryEtherSwapValuesFromLock(ethereumManager.etherSwap, reverseSwap.transactionId!);
    const contractTransaction = await ethereumManager.contractHandler.refundEther(
      getHexBuffer(reverseSwap.preimageHash),
      etherSwapValues.amount,
      etherSwapValues.claimAddress,
      etherSwapValues.timelock,
    );

    this.logger.info(`Refunded Ether of Reverse Swap ${reverseSwap.id} in: ${contractTransaction.hash}`);
    this.emit(
      'refund',
      await this.reverseSwapRepository.setTransactionRefunded(
        reverseSwap,
        calculateEthereumTransactionFee(contractTransaction),
        Errors.REFUNDED_COINS(reverseSwap.transactionId!).message,
      ),
      contractTransaction.hash,
    );
  }

  private refundERC20 = async (reverseSwap: ReverseSwap, chainSymbol: string) => {
    const ethereumManager = this.walletManager.ethereumManager!;
    const walletProvider = this.walletManager.wallets.get(chainSymbol)!.walletProvider as ERC20WalletProvider;

    const erc20SwapValues = await queryERC20SwapValuesFromLock(ethereumManager.erc20Swap, reverseSwap.transactionId!);
    const contractTransaction = await ethereumManager.contractHandler.refundToken(
      walletProvider,
      getHexBuffer(reverseSwap.preimageHash),
      erc20SwapValues.amount,
      erc20SwapValues.claimAddress,
      erc20SwapValues.timelock,
    );

    this.logger.info(`Refunded ${chainSymbol} of Reverse Swap ${reverseSwap.id} in: ${contractTransaction.hash}`);
    this.emit(
      'refund',
      await this.reverseSwapRepository.setTransactionRefunded(
        reverseSwap,
        calculateEthereumTransactionFee(contractTransaction),
        Errors.REFUNDED_COINS(reverseSwap.transactionId!).message,
      ),
      contractTransaction.hash,
    );
  }
}

export default SwapNursery;
