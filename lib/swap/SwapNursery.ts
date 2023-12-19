import { Op } from 'sequelize';
import AsyncLock from 'async-lock';
import { EventEmitter } from 'events';
import { detectSwap } from 'boltz-core';
import { Transaction } from 'bitcoinjs-lib';
import { ContractTransactionResponse } from 'ethers';
import { Transaction as LiquidTransaction } from 'liquidjs-lib';
import Errors from './Errors';
import Logger from '../Logger';
import Swap from '../db/models/Swap';
import Wallet from '../wallet/Wallet';
import NodeSwitch from './NodeSwitch';
import UtxoNursery from './UtxoNursery';
import SwapOutputType from './SwapOutputType';
import ChannelNursery from './ChannelNursery';
import InvoiceNursery from './InvoiceNursery';
import PaymentHandler from './PaymentHandler';
import FeeProvider from '../rates/FeeProvider';
import ChainClient from '../chain/ChainClient';
import EthereumNursery from './EthereumNursery';
import RateProvider from '../rates/RateProvider';
import LightningNursery from './LightningNursery';
import ReverseSwap from '../db/models/ReverseSwap';
import ChannelCreation from '../db/models/ChannelCreation';
import SwapRepository from '../db/repositories/SwapRepository';
import { CurrencyType, SwapUpdateEvent } from '../consts/Enums';
import ContractHandler from '../wallet/ethereum/ContractHandler';
import WalletManager, { Currency } from '../wallet/WalletManager';
import TimeoutDeltaProvider from '../service/TimeoutDeltaProvider';
import { ERC20SwapValues, EtherSwapValues } from '../consts/Types';
import { etherDecimals, ReverseSwapOutputType } from '../consts/Consts';
import ERC20WalletProvider from '../wallet/providers/ERC20WalletProvider';
import ReverseSwapRepository from '../db/repositories/ReverseSwapRepository';
import {
  HtlcState,
  InvoiceState,
  LightningClient,
} from '../lightning/LightningClient';
import ChannelCreationRepository from '../db/repositories/ChannelCreationRepository';
import {
  queryERC20SwapValuesFromLock,
  queryEtherSwapValuesFromLock,
} from '../wallet/ethereum/ContractUtils';
import {
  calculateEthereumTransactionFee,
  decodeInvoice,
  formatError,
  getChainCurrency,
  getHexBuffer,
  getHexString,
  getLightningCurrency,
  getRate,
  splitPairId,
} from '../Utils';
import {
  calculateTransactionFee,
  ClaimDetails,
  constructClaimTransaction,
  constructRefundTransaction,
  getAssetHash,
  LiquidClaimDetails,
  LiquidRefundDetails,
  parseTransaction,
  RefundDetails,
} from '../Core';
import EthereumManager from '../wallet/ethereum/EthereumManager';

interface ISwapNursery {
  // UTXO based chains emit the "Transaction" object and Ethereum based ones just the transaction hash
  on(
    event: 'transaction',
    listener: (
      swap: Swap | ReverseSwap,
      transaction: Transaction | LiquidTransaction | string,
      confirmed: boolean,
      isReverse: boolean,
    ) => void,
  ): this;
  emit(
    event: 'transaction',
    swap: Swap | ReverseSwap,
    transaction: Transaction | LiquidTransaction | string,
    confirmed: boolean,
    isReverse: boolean,
  ): boolean;

  on(
    event: 'expiration',
    listener: (swap: Swap | ReverseSwap, isReverse: boolean) => void,
  ): this;
  emit(
    event: 'expiration',
    swap: Swap | ReverseSwap,
    isReverse: boolean,
  ): boolean;

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

  on(
    event: 'claim',
    listener: (swap: Swap, channelCreation?: ChannelCreation) => void,
  ): this;
  emit(event: 'claim', swap: Swap, channelCreation?: ChannelCreation): boolean;

  // Reverse swap related events
  on(
    event: 'minerfee.paid',
    listener: (reverseSwap: ReverseSwap) => void,
  ): this;
  emit(event: 'minerfee.paid', reverseSwap: ReverseSwap): boolean;

  on(
    event: 'invoice.expired',
    listener: (reverseSwap: ReverseSwap) => void,
  ): this;
  emit(event: 'invoice.expired', reverseSwap: ReverseSwap): boolean;

  // UTXO based chains emit the "Transaction" object and Ethereum based ones just the transaction hash
  on(
    event: 'coins.sent',
    listener: (
      reverseSwap: ReverseSwap,
      transaction: Transaction | LiquidTransaction | string,
    ) => void,
  ): this;
  emit(
    event: 'coins.sent',
    reverseSwap: ReverseSwap,
    transaction: Transaction | LiquidTransaction | string,
  ): boolean;

  on(
    event: 'coins.failedToSend',
    listener: (reverseSwap: ReverseSwap) => void,
  ): this;
  emit(event: 'coins.failedToSend', reverseSwap: ReverseSwap): boolean;

  on(
    event: 'refund',
    listener: (reverseSwap: ReverseSwap, refundTransaction: string) => void,
  ): this;
  emit(
    event: 'refund',
    reverseSwap: ReverseSwap,
    refundTransaction: string,
  ): boolean;

  on(
    event: 'invoice.settled',
    listener: (reverseSwap: ReverseSwap) => void,
  ): this;
  emit(event: 'invoice.settled', reverseSwap: ReverseSwap): boolean;
}

class SwapNursery extends EventEmitter implements ISwapNursery {
  // Constants
  public static reverseSwapMempoolEta = 2;

  // Nurseries
  private readonly utxoNursery: UtxoNursery;
  public readonly channelNursery: ChannelNursery;
  private readonly invoiceNursery: InvoiceNursery;
  private readonly paymentHandler: PaymentHandler;
  private readonly lightningNursery: LightningNursery;

  private readonly ethereumNurseries: EthereumNursery[];

  // Maps
  private currencies = new Map<string, Currency>();

  // Locks
  public readonly lock = new AsyncLock();

  public static swapLock = 'swap';

  private static retryLock = 'retry';
  private static reverseSwapLock = 'reverseSwap';

  constructor(
    private logger: Logger,
    private nodeSwitch: NodeSwitch,
    private rateProvider: RateProvider,
    timeoutDeltaProvider: TimeoutDeltaProvider,
    private walletManager: WalletManager,
    private swapOutputType: SwapOutputType,
    private retryInterval: number,
  ) {
    super();

    this.logger.info(`Setting Swap retry interval to ${retryInterval} seconds`);

    this.utxoNursery = new UtxoNursery(this.logger, this.walletManager);
    this.lightningNursery = new LightningNursery(this.logger);
    this.invoiceNursery = new InvoiceNursery(this.logger);
    this.channelNursery = new ChannelNursery(
      this.logger,
      this.attemptSettleSwap,
    );

    this.ethereumNurseries = this.walletManager.ethereumManagers.map(
      (manager) =>
        new EthereumNursery(this.logger, this.walletManager, manager),
    );

    this.paymentHandler = new PaymentHandler(
      this.logger,
      this.nodeSwitch,
      this.currencies,
      this.channelNursery,
      timeoutDeltaProvider,
      (eventName: string, ...args: any[]) => {
        this.emit(eventName, ...args);
      },
    );
  }

  public init = async (currencies: Currency[]): Promise<void> => {
    currencies.forEach((currency) => {
      this.currencies.set(currency.symbol, currency);
    });

    await Promise.all(
      this.ethereumNurseries.map((nursery) =>
        this.listenEthereumNursery(nursery),
      ),
    );

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

    this.utxoNursery.on(
      'swap.lockup.zeroconf.rejected',
      async (swap, transaction, reason) => {
        await this.lock.acquire(SwapNursery.swapLock, async () => {
          this.logger.warn(
            `Rejected 0-conf lockup transaction (${transaction.getId()}:${
              swap.lockupTransactionVout
            }) of ${swap.id}: ${reason}`,
          );

          if (!swap.invoice) {
            await this.setSwapRate(swap);
          }

          this.emit(
            'zeroconf.rejected',
            await SwapRepository.setSwapStatus(
              swap,
              SwapUpdateEvent.TransactionZeroConfRejected,
            ),
          );
        });
      },
    );

    this.utxoNursery.on('swap.lockup', async (swap, transaction, confirmed) => {
      await this.lock.acquire(SwapNursery.swapLock, async () => {
        this.emit('transaction', swap, transaction, confirmed, false);

        if (swap.invoice) {
          const { base, quote } = splitPairId(swap.pair);
          const chainSymbol = getChainCurrency(
            base,
            quote,
            swap.orderSide,
            false,
          );

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

    this.utxoNursery.on(
      'reverseSwap.lockup.confirmed',
      async (reverseSwap, transaction) => {
        await this.lock.acquire(SwapNursery.reverseSwapLock, async () => {
          this.emit('transaction', reverseSwap, transaction, true, true);
        });
      },
    );

    this.lightningNursery.on('minerfee.invoice.paid', async (reverseSwap) => {
      await this.lock.acquire(SwapNursery.reverseSwapLock, async () => {
        this.emit('minerfee.paid', reverseSwap);
      });
    });

    this.lightningNursery.on('invoice.paid', async (reverseSwap) => {
      await this.lock.acquire(SwapNursery.reverseSwapLock, async () => {
        const { base, quote } = splitPairId(reverseSwap.pair);
        const chainSymbol = getChainCurrency(
          base,
          quote,
          reverseSwap.orderSide,
          true,
        );
        const lightningSymbol = getLightningCurrency(
          base,
          quote,
          reverseSwap.orderSide,
          true,
        );

        const chainCurrency = this.currencies.get(chainSymbol)!;
        const lightningClient = NodeSwitch.getReverseSwapNode(
          this.currencies.get(lightningSymbol)!,
          reverseSwap,
        );

        const wallet = this.walletManager.wallets.get(chainSymbol)!;

        switch (chainCurrency.type) {
          case CurrencyType.BitcoinLike:
          case CurrencyType.Liquid:
            await this.lockupUtxo(
              chainCurrency.chainClient!,
              this.walletManager.wallets.get(chainSymbol)!,
              lightningClient,
              reverseSwap,
            );
            break;

          case CurrencyType.Ether:
            await this.lockupEther(wallet, lightningClient, reverseSwap);
            break;

          case CurrencyType.ERC20:
            await this.lockupERC20(wallet, lightningClient, reverseSwap);
            break;
        }
      });
    });

    this.utxoNursery.on(
      'reverseSwap.claimed',
      async (reverseSwap: ReverseSwap, preimage: Buffer) => {
        await this.lock.acquire(SwapNursery.reverseSwapLock, async () => {
          await this.settleReverseSwapInvoice(reverseSwap, preimage);
        });
      },
    );

    this.invoiceNursery.on(
      'invoice.expired',
      async (reverseSwap: ReverseSwap) => {
        await this.lock.acquire(SwapNursery.reverseSwapLock, async () => {
          const { base, quote } = splitPairId(reverseSwap.pair);
          const receiveCurrency = getLightningCurrency(
            base,
            quote,
            reverseSwap.orderSide,
            true,
          );
          const lightningClient = NodeSwitch.getReverseSwapNode(
            this.currencies.get(receiveCurrency)!,
            reverseSwap,
          );

          const plural =
            reverseSwap.minerFeeInvoicePreimage === null ? '' : 's';

          try {
            // Check if the hold invoice has pending HTLCs before actually cancelling
            const { htlcs, state } = await lightningClient.raceCall(
              lightningClient.lookupHoldInvoice(
                getHexBuffer(reverseSwap.preimageHash),
              ),
              (reject) => reject('lookup for HTLCs of hold invoice timed out'),
              LightningNursery.lightningClientCallTimeout,
            );

            if (state === InvoiceState.Cancelled) {
              this.logger.debug(
                `Invoice${plural} of Reverse Swap ${reverseSwap.id} already cancelled`,
              );
            } else {
              if (
                htlcs.length !== 0 &&
                htlcs.some((htlc) => htlc.state !== HtlcState.Cancelled)
              ) {
                this.logger.info(
                  `Not cancelling expired hold invoice${plural} of Reverse Swap ${reverseSwap.id} because it has pending HTLCs`,
                );
                return;
              }

              this.logger.debug(
                `Cancelling expired hold invoice${plural} of Reverse Swap ${reverseSwap.id}`,
              );

              await LightningNursery.cancelReverseInvoices(
                lightningClient,
                reverseSwap,
                true,
              );
            }
          } catch (error) {
            // In case the LND client could not find the invoice(s) of the Reverse Swap, we just ignore the error and mark them as cancelled regardless
            // This happens quite a lot on regtest environments where the LND client is reset without the database being deleted
            if (
              typeof error !== 'object' ||
              ((error as any).details !== 'unable to locate invoice' &&
                (error as any).details !== 'there are no existing invoices' &&
                (error as any).message !== 'hold invoice not found')
            ) {
              this.logger.error(
                `Could not cancel invoice${plural} of Reverse Swap ${
                  reverseSwap.id
                }: ${formatError(error)}`,
              );
              return;
            } else {
              this.logger.silly(
                `Cancelling invoice${plural} of Reverse Swap ${
                  reverseSwap.id
                } failed because they could not be found: ${formatError(
                  error,
                )}`,
              );
            }
          }

          this.emit(
            'invoice.expired',
            await ReverseSwapRepository.setReverseSwapStatus(
              reverseSwap,
              SwapUpdateEvent.InvoiceExpired,
            ),
          );
        });
      },
    );

    this.utxoNursery.bindCurrency(currencies);
    this.lightningNursery.bindCurrencies(currencies);

    await this.invoiceNursery.init();
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
            const pendingInvoiceSwaps = await SwapRepository.getSwaps({
              status: {
                [Op.in]: [
                  SwapUpdateEvent.InvoicePending,
                  SwapUpdateEvent.InvoicePaid,
                ],
              },
            });

            for (const pendingInvoiceSwap of pendingInvoiceSwaps) {
              const { base, quote } = splitPairId(pendingInvoiceSwap.pair);
              const chainCurrency = this.currencies.get(
                getChainCurrency(
                  base,
                  quote,
                  pendingInvoiceSwap.orderSide,
                  false,
                ),
              )!;

              await this.attemptSettleSwap(chainCurrency, pendingInvoiceSwap);
            }
          });
        });
      }, this.retryInterval * 1000);
    }
  };

  public attemptSettleSwap = async (
    currency: Currency,
    swap: Swap,
    outgoingChannelId?: string,
  ): Promise<void> => {
    switch (currency.type) {
      case CurrencyType.BitcoinLike:
      case CurrencyType.Liquid: {
        const lockupTransactionHex =
          await currency.chainClient!.getRawTransaction(
            swap.lockupTransactionId!,
          );

        await this.claimUtxo(
          currency.chainClient!,
          this.walletManager.wallets.get(currency.symbol)!,
          swap,
          parseTransaction(currency.type, lockupTransactionHex),
          outgoingChannelId,
        );
        break;
      }

      case CurrencyType.Ether: {
        const manager = this.findEthereumNursery(
          currency.symbol,
        )!.ethereumManager;

        await this.claimEther(
          manager,
          swap,
          await queryEtherSwapValuesFromLock(
            manager.provider,
            manager.etherSwap,
            swap.lockupTransactionId!,
          ),
          outgoingChannelId,
        );
        break;
      }

      case CurrencyType.ERC20: {
        const manager = this.findEthereumNursery(
          currency.symbol,
        )!.ethereumManager;

        await this.claimERC20(
          manager.contractHandler,
          swap,
          await queryERC20SwapValuesFromLock(
            manager.provider,
            manager.erc20Swap,
            swap.lockupTransactionId!,
          ),
          outgoingChannelId,
        );
        break;
      }
    }
  };

  private listenEthereumNursery = async (ethereumNursery: EthereumNursery) => {
    const contractHandler = ethereumNursery.ethereumManager.contractHandler;

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

    ethereumNursery.on(
      'eth.lockup',
      async (swap, transactionHash, etherSwapValues) => {
        await this.lock.acquire(SwapNursery.swapLock, async () => {
          this.emit('transaction', swap, transactionHash, true, false);

          if (swap.invoice) {
            await this.claimEther(
              ethereumNursery.ethereumManager,
              swap,
              etherSwapValues,
            );
          } else {
            await this.setSwapRate(swap);
          }
        });
      },
    );

    ethereumNursery.on(
      'erc20.lockup',
      async (swap, transactionHash, erc20SwapValues) => {
        await this.lock.acquire(SwapNursery.swapLock, async () => {
          this.emit('transaction', swap, transactionHash, true, false);

          if (swap.invoice) {
            await this.claimERC20(contractHandler, swap, erc20SwapValues);
          } else {
            await this.setSwapRate(swap);
          }
        });
      },
    );

    // Reverse Swap events
    ethereumNursery.on('reverseSwap.expired', async (reverseSwap) => {
      await this.lock.acquire(SwapNursery.reverseSwapLock, async () => {
        await this.expireReverseSwap(reverseSwap);
      });
    });

    ethereumNursery.on(
      'lockup.failedToSend',
      async (reverseSwap: ReverseSwap, reason) => {
        await this.lock.acquire(SwapNursery.reverseSwapLock, async () => {
          const { base, quote } = splitPairId(reverseSwap.pair);
          const chainSymbol = getChainCurrency(
            base,
            quote,
            reverseSwap.orderSide,
            true,
          );
          const lightningSymbol = getLightningCurrency(
            base,
            quote,
            reverseSwap.orderSide,
            true,
          );

          await this.handleReverseSwapSendFailed(
            reverseSwap,
            chainSymbol,
            NodeSwitch.getReverseSwapNode(
              this.currencies.get(lightningSymbol)!,
              reverseSwap,
            ),
            reason,
          );
        });
      },
    );

    ethereumNursery.on(
      'lockup.confirmed',
      async (reverseSwap, transactionHash) => {
        await this.lock.acquire(SwapNursery.reverseSwapLock, async () => {
          this.emit('transaction', reverseSwap, transactionHash, true, true);
        });
      },
    );

    ethereumNursery.on('claim', async (reverseSwap, preimage) => {
      await this.lock.acquire(SwapNursery.reverseSwapLock, async () => {
        await this.settleReverseSwapInvoice(reverseSwap, preimage);
      });
    });

    await ethereumNursery.init();
  };

  /**
   * Sets the rate for a Swap that doesn't have an invoice yet
   */
  private setSwapRate = async (swap: Swap) => {
    if (!swap.rate) {
      const rate = getRate(
        this.rateProvider.pairs.get(swap.pair)!.rate,
        swap.orderSide,
        false,
      );

      await SwapRepository.setRate(swap, rate);
    }
  };

  private lockupUtxo = async (
    chainClient: ChainClient,
    wallet: Wallet,
    lightningClient: LightningClient,
    reverseSwap: ReverseSwap,
  ) => {
    try {
      let feePerVbyte: number;

      if (reverseSwap.minerFeeInvoice) {
        // TODO: how does this behave cross chain
        feePerVbyte = Math.round(
          decodeInvoice(reverseSwap.minerFeeInvoice).satoshis /
            FeeProvider.transactionSizes.reverseLockup,
        );
        this.logger.debug(
          `Using prepay minerfee for lockup of Reverse Swap ${reverseSwap.id}: ${feePerVbyte} sat/vbyte`,
        );
      } else {
        feePerVbyte = await chainClient.estimateFee(
          SwapNursery.reverseSwapMempoolEta,
        );
      }

      const { transaction, transactionId, vout, fee } =
        await wallet.sendToAddress(
          reverseSwap.lockupAddress,
          reverseSwap.onchainAmount,
          feePerVbyte,
        );
      this.logger.verbose(
        `Locked up ${reverseSwap.onchainAmount} ${
          wallet.symbol
        } for Reverse Swap ${reverseSwap.id}: ${transactionId}:${vout!}`,
      );

      chainClient.addInputFilter(transaction!.getHash());

      // For the "transaction.confirmed" event of the lockup transaction
      chainClient.addOutputFilter(
        wallet.decodeAddress(reverseSwap.lockupAddress),
      );

      this.emit(
        'coins.sent',
        await ReverseSwapRepository.setLockupTransaction(
          reverseSwap,
          transactionId,
          fee!,
          vout!,
        ),
        transaction!,
      );
    } catch (error) {
      await this.handleReverseSwapSendFailed(
        reverseSwap,
        wallet.symbol,
        lightningClient,
        error,
      );
    }
  };

  private lockupEther = async (
    wallet: Wallet,
    lightningClient: LightningClient,
    reverseSwap: ReverseSwap,
  ) => {
    try {
      const nursery = this.findEthereumNursery(wallet.symbol)!;

      let contractTransaction: ContractTransactionResponse;

      if (reverseSwap.minerFeeOnchainAmount) {
        contractTransaction =
          await nursery.ethereumManager.contractHandler.lockupEtherPrepayMinerfee(
            getHexBuffer(reverseSwap.preimageHash),
            BigInt(reverseSwap.onchainAmount) * etherDecimals,
            BigInt(reverseSwap.minerFeeOnchainAmount) * etherDecimals,
            reverseSwap.claimAddress!,
            reverseSwap.timeoutBlockHeight,
          );
      } else {
        contractTransaction =
          await nursery.ethereumManager.contractHandler.lockupEther(
            getHexBuffer(reverseSwap.preimageHash),
            BigInt(reverseSwap.onchainAmount) * etherDecimals,
            reverseSwap.claimAddress!,
            reverseSwap.timeoutBlockHeight,
          );
      }

      nursery.listenContractTransaction(reverseSwap, contractTransaction);
      this.logger.verbose(
        `Locked up ${reverseSwap.onchainAmount} ${wallet.symbol} for Reverse Swap ${reverseSwap.id}: ${contractTransaction.hash}`,
      );

      this.emit(
        'coins.sent',
        await ReverseSwapRepository.setLockupTransaction(
          reverseSwap,
          contractTransaction.hash,
          calculateEthereumTransactionFee(contractTransaction),
        ),
        contractTransaction.hash,
      );
    } catch (error) {
      await this.handleReverseSwapSendFailed(
        reverseSwap,
        wallet.symbol,
        lightningClient,
        error,
      );
    }
  };

  private lockupERC20 = async (
    wallet: Wallet,
    lightningClient: LightningClient,
    reverseSwap: ReverseSwap,
  ) => {
    try {
      const nursery = this.findEthereumNursery(wallet.symbol)!;
      const walletProvider = wallet.walletProvider as ERC20WalletProvider;

      let contractTransaction: ContractTransactionResponse;

      if (reverseSwap.minerFeeOnchainAmount) {
        contractTransaction =
          await nursery.ethereumManager.contractHandler.lockupTokenPrepayMinerfee(
            walletProvider,
            getHexBuffer(reverseSwap.preimageHash),
            walletProvider.formatTokenAmount(reverseSwap.onchainAmount),
            BigInt(reverseSwap.minerFeeOnchainAmount) * etherDecimals,
            reverseSwap.claimAddress!,
            reverseSwap.timeoutBlockHeight,
          );
      } else {
        contractTransaction =
          await nursery.ethereumManager.contractHandler.lockupToken(
            walletProvider,
            getHexBuffer(reverseSwap.preimageHash),
            walletProvider.formatTokenAmount(reverseSwap.onchainAmount),
            reverseSwap.claimAddress!,
            reverseSwap.timeoutBlockHeight,
          );
      }

      nursery.listenContractTransaction(reverseSwap, contractTransaction);
      this.logger.verbose(
        `Locked up ${reverseSwap.onchainAmount} ${wallet.symbol} for Reverse Swap ${reverseSwap.id}: ${contractTransaction.hash}`,
      );

      this.emit(
        'coins.sent',
        await ReverseSwapRepository.setLockupTransaction(
          reverseSwap,
          contractTransaction.hash,
          calculateEthereumTransactionFee(contractTransaction),
        ),
        contractTransaction.hash,
      );
    } catch (error) {
      await this.handleReverseSwapSendFailed(
        reverseSwap,
        wallet.symbol,
        lightningClient,
        error,
      );
    }
  };

  private claimUtxo = async (
    chainClient: ChainClient,
    wallet: Wallet,
    swap: Swap,
    transaction: Transaction | LiquidTransaction,
    outgoingChannelId?: string,
  ) => {
    const channelCreation = await ChannelCreationRepository.getChannelCreation({
      swapId: swap.id,
    });
    const preimage = await this.paymentHandler.payInvoice(
      swap,
      channelCreation,
      outgoingChannelId,
    );

    if (!preimage) {
      return;
    }

    const destinationAddress = await wallet.getAddress();

    // Compatibility mode with database schema version 0 in which this column didn't exist
    if (swap.lockupTransactionVout === undefined) {
      swap.lockupTransactionVout = detectSwap(
        getHexBuffer(swap.redeemScript!),
        transaction,
      )!.vout;
    }

    const output = transaction.outs[swap.lockupTransactionVout!];
    const claimTransaction = constructClaimTransaction(
      wallet,
      [
        {
          ...output,
          preimage,
          vout: swap.lockupTransactionVout!,
          type: this.swapOutputType.get(wallet.type),
          txHash: transaction.getHash(),
          keys: wallet.getKeysByIndex(swap.keyIndex!),
          redeemScript: getHexBuffer(swap.redeemScript!),
        },
      ] as ClaimDetails[] | LiquidClaimDetails[],
      destinationAddress,
      await chainClient.estimateFee(),
      getAssetHash(chainClient.currencyType, wallet.network),
    );

    const claimTransactionFee = await calculateTransactionFee(
      chainClient,
      claimTransaction,
    );

    await chainClient.sendRawTransaction(claimTransaction.toHex());

    this.logger.info(
      `Claimed ${wallet.symbol} of Swap ${
        swap.id
      } in: ${claimTransaction.getId()}`,
    );

    this.emit(
      'claim',
      await SwapRepository.setMinerFee(swap, claimTransactionFee),
      channelCreation || undefined,
    );
  };

  private claimEther = async (
    manager: EthereumManager,
    swap: Swap,
    etherSwapValues: EtherSwapValues,
    outgoingChannelId?: string,
  ) => {
    const channelCreation = await ChannelCreationRepository.getChannelCreation({
      swapId: swap.id,
    });
    const preimage = await this.paymentHandler.payInvoice(
      swap,
      channelCreation,
      outgoingChannelId,
    );

    if (!preimage) {
      return;
    }

    const contractTransaction = await manager.contractHandler.claimEther(
      preimage,
      etherSwapValues.amount,
      etherSwapValues.refundAddress,
      etherSwapValues.timelock,
    );

    this.logger.info(
      `Claimed ${manager.networkDetails.name} of Swap ${swap.id} in: ${contractTransaction.hash}`,
    );
    this.emit(
      'claim',
      await SwapRepository.setMinerFee(
        swap,
        calculateEthereumTransactionFee(contractTransaction),
      ),
      channelCreation || undefined,
    );
  };

  private claimERC20 = async (
    contractHandler: ContractHandler,
    swap: Swap,
    erc20SwapValues: ERC20SwapValues,
    outgoingChannelId?: string,
  ) => {
    const channelCreation = await ChannelCreationRepository.getChannelCreation({
      swapId: swap.id,
    });
    const preimage = await this.paymentHandler.payInvoice(
      swap,
      channelCreation,
      outgoingChannelId,
    );

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

    this.logger.info(
      `Claimed ${chainCurrency} of Swap ${swap.id} in: ${contractTransaction.hash}`,
    );
    this.emit(
      'claim',
      await SwapRepository.setMinerFee(
        swap,
        calculateEthereumTransactionFee(contractTransaction),
      ),
      channelCreation || undefined,
    );
  };

  private settleReverseSwapInvoice = async (
    reverseSwap: ReverseSwap,
    preimage: Buffer,
  ) => {
    const { base, quote } = splitPairId(reverseSwap.pair);
    const lightningCurrency = getLightningCurrency(
      base,
      quote,
      reverseSwap.orderSide,
      true,
    );

    const lightningClient = NodeSwitch.getReverseSwapNode(
      this.currencies.get(lightningCurrency)!,
      reverseSwap,
    );
    try {
      await lightningClient.raceCall(
        lightningClient.settleHoldInvoice(preimage),
        (reject) => {
          reject('invoice settlement timed out');
        },
        LightningNursery.lightningClientCallTimeout,
      );

      this.logger.info(`Settled Reverse Swap ${reverseSwap.id}`);

      this.emit(
        'invoice.settled',
        await ReverseSwapRepository.setInvoiceSettled(
          reverseSwap,
          getHexString(preimage),
        ),
      );
    } catch (e) {
      this.logger.error(`Could not settle invoice: ${formatError(e)}`);
    }
  };

  private handleReverseSwapSendFailed = async (
    reverseSwap: ReverseSwap,
    chainSymbol: string,
    lightningClient: LightningClient,
    error: unknown,
  ) => {
    await LightningNursery.cancelReverseInvoices(
      lightningClient,
      reverseSwap,
      false,
    );

    this.logger.warn(
      `Failed to lockup ${
        reverseSwap.onchainAmount
      } ${chainSymbol} for Reverse Swap ${reverseSwap.id}: ${formatError(
        error,
      )}`,
    );
    this.emit(
      'coins.failedToSend',
      await ReverseSwapRepository.setReverseSwapStatus(
        reverseSwap,
        SwapUpdateEvent.TransactionFailed,
        Errors.COINS_COULD_NOT_BE_SENT().message,
      ),
    );
  };

  private lockupFailed = async (swap: Swap, reason: string) => {
    this.logger.warn(`Lockup of Swap ${swap.id} failed: ${reason}`);
    this.emit(
      'lockup.failed',
      await SwapRepository.setSwapStatus(
        swap,
        SwapUpdateEvent.TransactionLockupFailed,
        reason,
      ),
    );
  };

  private expireSwap = async (swap: Swap) => {
    // Check "expireReverseSwap" for reason
    const queriedSwap = await SwapRepository.getSwap({
      id: swap.id,
    });

    if (queriedSwap!.status === SwapUpdateEvent.SwapExpired) {
      return;
    }

    this.emit(
      'expiration',
      await SwapRepository.setSwapStatus(
        swap,
        SwapUpdateEvent.SwapExpired,
        Errors.ONCHAIN_HTLC_TIMED_OUT().message,
      ),
      false,
    );
  };

  private expireReverseSwap = async (reverseSwap: ReverseSwap) => {
    // Sometimes, when blocks are mined quickly (realistically just regtest), it can happen that the
    // nurseries, which are not in the async lock, send the expiration event of a Swap multiple times.
    // To handle this scenario, the Swap is queried again to ensure that it should actually be expired or refunded
    const queriedReverseSwap = await ReverseSwapRepository.getReverseSwap({
      id: reverseSwap.id,
    });

    if (
      queriedReverseSwap!.status === SwapUpdateEvent.SwapExpired ||
      queriedReverseSwap!.status === SwapUpdateEvent.TransactionRefunded
    ) {
      return;
    }

    const { base, quote } = splitPairId(reverseSwap.pair);
    const chainSymbol = getChainCurrency(
      base,
      quote,
      reverseSwap.orderSide,
      true,
    );
    const lightningSymbol = getLightningCurrency(
      base,
      quote,
      reverseSwap.orderSide,
      true,
    );

    const chainCurrency = this.currencies.get(chainSymbol)!;
    const lightningCurrency = this.currencies.get(lightningSymbol)!;

    if (reverseSwap.transactionId) {
      switch (chainCurrency.type) {
        case CurrencyType.BitcoinLike:
        case CurrencyType.Liquid:
          await this.refundUtxo(reverseSwap, chainSymbol);
          break;

        case CurrencyType.Ether:
          await this.refundEther(reverseSwap, chainSymbol);
          break;

        case CurrencyType.ERC20:
          await this.refundERC20(reverseSwap, chainSymbol);
          break;
      }
    } else {
      this.emit(
        'expiration',
        await ReverseSwapRepository.setReverseSwapStatus(
          reverseSwap,
          SwapUpdateEvent.SwapExpired,
          Errors.ONCHAIN_HTLC_TIMED_OUT().message,
        ),
        true,
      );
    }

    const lightningClient = NodeSwitch.getReverseSwapNode(
      lightningCurrency,
      reverseSwap,
    );

    try {
      await LightningNursery.cancelReverseInvoices(
        lightningClient,
        reverseSwap,
        true,
      );
    } catch (e) {
      this.logger.debug(
        `Could not cancel invoices of Reverse Swap ${
          reverseSwap.id
        } because: ${formatError(e)}`,
      );
    }
  };

  private refundUtxo = async (
    reverseSwap: ReverseSwap,
    chainSymbol: string,
  ) => {
    const chainCurrency = this.currencies.get(chainSymbol)!;
    const chainClient = chainCurrency.chainClient!;
    const wallet = this.walletManager.wallets.get(chainSymbol)!;

    const rawLockupTransaction =
      await chainCurrency.chainClient!.getRawTransaction(
        reverseSwap.transactionId!,
      );
    const lockupTransaction = parseTransaction(
      chainClient.currencyType,
      rawLockupTransaction,
    );

    const lockupOutput = lockupTransaction.outs[reverseSwap.transactionVout!];
    const refundTransaction = constructRefundTransaction(
      wallet,
      [
        {
          ...lockupOutput,
          type: ReverseSwapOutputType,
          vout: reverseSwap.transactionVout!,
          txHash: lockupTransaction.getHash(),
          keys: wallet.getKeysByIndex(reverseSwap.keyIndex!),
          redeemScript: getHexBuffer(reverseSwap.redeemScript!),
        },
      ] as RefundDetails[] | LiquidRefundDetails[],
      await wallet.getAddress(),
      reverseSwap.timeoutBlockHeight,
      await chainCurrency.chainClient!.estimateFee(),
      getAssetHash(chainClient.currencyType, wallet.network),
    );
    const minerFee = await calculateTransactionFee(
      chainCurrency.chainClient!,
      refundTransaction,
    );

    await chainClient.sendRawTransaction(refundTransaction.toHex());

    this.logger.info(
      `Refunded ${chainSymbol} of Reverse Swap ${
        reverseSwap.id
      } in: ${refundTransaction.getId()}`,
    );
    this.emit(
      'refund',
      await ReverseSwapRepository.setTransactionRefunded(
        reverseSwap,
        minerFee,
        Errors.REFUNDED_COINS(reverseSwap.transactionId!).message,
      ),
      refundTransaction.getId(),
    );
  };

  private refundEther = async (
    reverseSwap: ReverseSwap,
    chainSymbol: string,
  ) => {
    const nursery = this.findEthereumNursery(chainSymbol)!;

    const etherSwapValues = await queryEtherSwapValuesFromLock(
      nursery.ethereumManager!.provider,
      nursery.ethereumManager.etherSwap,
      reverseSwap.transactionId!,
    );
    const contractTransaction =
      await nursery.ethereumManager.contractHandler.refundEther(
        getHexBuffer(reverseSwap.preimageHash),
        etherSwapValues.amount,
        etherSwapValues.claimAddress,
        etherSwapValues.timelock,
      );

    this.logger.info(
      `Refunded ${nursery.ethereumManager.networkDetails.name} of Reverse Swap ${reverseSwap.id} in: ${contractTransaction.hash}`,
    );
    this.emit(
      'refund',
      await ReverseSwapRepository.setTransactionRefunded(
        reverseSwap,
        calculateEthereumTransactionFee(contractTransaction),
        Errors.REFUNDED_COINS(reverseSwap.transactionId!).message,
      ),
      contractTransaction.hash,
    );
  };

  private refundERC20 = async (
    reverseSwap: ReverseSwap,
    chainSymbol: string,
  ) => {
    const nursery = this.findEthereumNursery(chainSymbol)!;
    const walletProvider = this.walletManager.wallets.get(chainSymbol)!
      .walletProvider as ERC20WalletProvider;

    const erc20SwapValues = await queryERC20SwapValuesFromLock(
      nursery.ethereumManager.provider,
      nursery.ethereumManager.erc20Swap,
      reverseSwap.transactionId!,
    );
    const contractTransaction =
      await nursery.ethereumManager.contractHandler.refundToken(
        walletProvider,
        getHexBuffer(reverseSwap.preimageHash),
        erc20SwapValues.amount,
        erc20SwapValues.claimAddress,
        erc20SwapValues.timelock,
      );

    this.logger.info(
      `Refunded ${chainSymbol} of Reverse Swap ${reverseSwap.id} in: ${contractTransaction.hash}`,
    );
    this.emit(
      'refund',
      await ReverseSwapRepository.setTransactionRefunded(
        reverseSwap,
        calculateEthereumTransactionFee(contractTransaction),
        Errors.REFUNDED_COINS(reverseSwap.transactionId!).message,
      ),
      contractTransaction.hash,
    );
  };

  private findEthereumNursery = (
    symbol: string,
  ): EthereumNursery | undefined => {
    for (const nursery of this.ethereumNurseries) {
      if (nursery.ethereumManager.hasSymbol(symbol)) {
        return nursery;
      }
    }

    return undefined;
  };
}

export default SwapNursery;
