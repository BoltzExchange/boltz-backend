import AsyncLock from 'async-lock';
import { Transaction } from 'bitcoinjs-lib';
import { OutputType, SwapTreeSerializer } from 'boltz-core';
import { ContractTransactionResponse } from 'ethers';
import { Transaction as LiquidTransaction } from 'liquidjs-lib';
import { Op } from 'sequelize';
import { OverPaymentConfig } from '../Config';
import {
  ClaimDetails,
  LiquidClaimDetails,
  LiquidRefundDetails,
  RefundDetails,
  calculateTransactionFee,
  constructClaimDetails,
  constructClaimTransaction,
  constructRefundTransaction,
  createMusig,
  parseTransaction,
} from '../Core';
import Logger from '../Logger';
import {
  calculateEthereumTransactionFee,
  formatError,
  getChainCurrency,
  getHexBuffer,
  getHexString,
  getLightningCurrency,
  getRate,
  splitPairId,
} from '../Utils';
import { IChainClient } from '../chain/ChainClient';
import { LegacyReverseSwapOutputType, etherDecimals } from '../consts/Consts';
import {
  CurrencyType,
  FinalChainSwapEvents,
  SwapType,
  SwapUpdateEvent,
  SwapVersion,
  swapTypeToPrettyString,
} from '../consts/Enums';
import TypedEventEmitter from '../consts/TypedEventEmitter';
import { AnySwap, ERC20SwapValues, EtherSwapValues } from '../consts/Types';
import ChannelCreation from '../db/models/ChannelCreation';
import ReverseSwap, { nodeTypeToPrettyString } from '../db/models/ReverseSwap';
import Swap from '../db/models/Swap';
import ChainSwapRepository, {
  ChainSwapInfo,
} from '../db/repositories/ChainSwapRepository';
import ChannelCreationRepository from '../db/repositories/ChannelCreationRepository';
import ReverseSwapRepository from '../db/repositories/ReverseSwapRepository';
import SwapRepository from '../db/repositories/SwapRepository';
import TransactionLabelRepository from '../db/repositories/TransactionLabelRepository';
import WrappedSwapRepository from '../db/repositories/WrappedSwapRepository';
import { msatToSat } from '../lightning/ChannelUtils';
import {
  HtlcState,
  InvoiceState,
  LightningClient,
} from '../lightning/LightningClient';
import PendingPaymentTracker from '../lightning/PendingPaymentTracker';
import NotificationClient from '../notifications/NotificationClient';
import FeeProvider from '../rates/FeeProvider';
import LockupTransactionTracker from '../rates/LockupTransactionTracker';
import RateProvider from '../rates/RateProvider';
import Blocks from '../service/Blocks';
import TimeoutDeltaProvider from '../service/TimeoutDeltaProvider';
import ChainSwapSigner from '../service/cooperative/ChainSwapSigner';
import DeferredClaimer from '../service/cooperative/DeferredClaimer';
import Sidecar from '../sidecar/Sidecar';
import Wallet from '../wallet/Wallet';
import WalletManager, { Currency } from '../wallet/WalletManager';
import EthereumManager from '../wallet/ethereum/EthereumManager';
import ContractHandler from '../wallet/ethereum/contracts/ContractHandler';
import {
  queryERC20SwapValuesFromLock,
  queryEtherSwapValuesFromLock,
} from '../wallet/ethereum/contracts/ContractUtils';
import Contracts from '../wallet/ethereum/contracts/Contracts';
import ERC20WalletProvider from '../wallet/providers/ERC20WalletProvider';
import ChannelNursery from './ChannelNursery';
import Errors from './Errors';
import EthereumNursery from './EthereumNursery';
import InvoiceNursery from './InvoiceNursery';
import LightningNursery from './LightningNursery';
import NodeSwitch from './NodeSwitch';
import OverpaymentProtector from './OverpaymentProtector';
import PaymentHandler, { SwapNurseryEvents } from './PaymentHandler';
import SwapOutputType from './SwapOutputType';
import UtxoNursery from './UtxoNursery';

type PaidSwapInvoice = {
  preimage: Buffer;
  channelCreation: ChannelCreation | null;
};

class SwapNursery extends TypedEventEmitter<SwapNurseryEvents> {
  // Constants
  public static reverseSwapMempoolEta = 2;

  // Nurseries
  public readonly utxoNursery: UtxoNursery;
  public readonly channelNursery: ChannelNursery;
  public readonly ethereumNurseries: EthereumNursery[];

  private readonly invoiceNursery: InvoiceNursery;
  private readonly paymentHandler: PaymentHandler;
  private readonly lightningNursery: LightningNursery;
  private readonly pendingPaymentTracker: PendingPaymentTracker;

  // Maps
  public currencies = new Map<string, Currency>();

  // Locks
  public readonly lock = new AsyncLock({
    maxPending: 10_000,
  });

  public static readonly swapLock = 'swap';
  public static readonly chainSwapLock = 'chainSwap';
  public static readonly reverseSwapLock = 'reverseSwap';

  private static retryLock = 'retry';

  constructor(
    private logger: Logger,
    private readonly sidecar: Sidecar,
    private readonly notifications: NotificationClient | undefined,
    private nodeSwitch: NodeSwitch,
    private rateProvider: RateProvider,
    timeoutDeltaProvider: TimeoutDeltaProvider,
    public walletManager: WalletManager,
    private swapOutputType: SwapOutputType,
    private retryInterval: number,
    blocks: Blocks,
    private readonly claimer: DeferredClaimer,
    private readonly chainSwapSigner: ChainSwapSigner,
    lockupTransactionTracker: LockupTransactionTracker,
    overPaymentConfig?: OverPaymentConfig,
  ) {
    super();

    this.logger.info(`Setting Swap retry interval to ${retryInterval} seconds`);

    const overpaymentProtector = new OverpaymentProtector(
      this.logger,
      overPaymentConfig,
    );
    this.utxoNursery = new UtxoNursery(
      this.logger,
      this.sidecar,
      this.walletManager,
      blocks,
      lockupTransactionTracker,
      overpaymentProtector,
    );
    this.lightningNursery = new LightningNursery(this.logger, this.sidecar);
    this.invoiceNursery = new InvoiceNursery(this.logger, this.sidecar);
    this.channelNursery = new ChannelNursery(
      this.logger,
      this.attemptSettleSwap,
    );

    this.ethereumNurseries = this.walletManager.ethereumManagers.map(
      (manager) =>
        new EthereumNursery(
          this.logger,
          this.walletManager,
          manager,
          blocks,
          overpaymentProtector,
        ),
    );

    this.pendingPaymentTracker = new PendingPaymentTracker(
      this.logger,
      this.sidecar,
    );
    this.paymentHandler = new PaymentHandler(
      this.logger,
      this.sidecar,
      this.nodeSwitch,
      this.currencies,
      this.channelNursery,
      timeoutDeltaProvider,
      this.pendingPaymentTracker,
      (
        eventName: keyof SwapNurseryEvents,
        arg: SwapNurseryEvents[keyof SwapNurseryEvents],
      ) => {
        this.emit(eventName, arg);
      },
    );

    this.claimer.on('claim', ({ swap, channelCreation }) => {
      this.emit('claim', {
        swap,
        channelCreation,
      });
    });

    this.chainSwapSigner.setAttemptSettle(this.attemptSettleSwap);
    this.chainSwapSigner.on('claim', (swap) => {
      this.emit('claim', {
        swap,
      });
    });
  }

  public init = async (currencies: Currency[]): Promise<void> => {
    currencies.forEach((currency) => {
      this.currencies.set(currency.symbol, currency);
    });

    await this.pendingPaymentTracker.init(currencies);

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

    this.utxoNursery.on('swap.lockup.failed', async ({ swap, reason }) => {
      await this.lock.acquire(SwapNursery.swapLock, async () => {
        await this.lockupFailed(swap, reason);
      });
    });

    this.utxoNursery.on(
      'swap.lockup.zeroconf.rejected',
      async ({ swap, transaction, reason }) => {
        await this.lock.acquire(SwapNursery.swapLock, async () => {
          this.logger.warn(
            `Rejected 0-conf lockup transaction (${transaction.getId()}:${
              swap.lockupTransactionVout
            }) of ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}: ${reason}`,
          );

          if (!swap.invoice) {
            await this.setSwapRate(swap);
          }

          this.emit('zeroconf.rejected', {
            transaction,
            swap: await SwapRepository.setSwapStatus(
              swap,
              SwapUpdateEvent.TransactionZeroConfRejected,
            ),
          });
        });
      },
    );

    this.utxoNursery.on(
      'swap.lockup',
      async ({ swap, transaction, confirmed }) => {
        await this.lock.acquire(SwapNursery.swapLock, async () => {
          this.emit('transaction', {
            swap,
            confirmed,
            transaction,
          });

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

            const payRes = await this.payInvoice(swap);
            if (payRes === undefined) {
              return;
            }

            await this.claimUtxo(
              swap,
              chainClient!,
              wallet,
              transaction,
              payRes.preimage,
              payRes.channelCreation,
            );
          } else {
            await this.setSwapRate(swap);
          }
        });
      },
    );

    // Reverse Swap events
    this.utxoNursery.on('reverseSwap.expired', async (reverseSwap) => {
      await this.lock.acquire(SwapNursery.reverseSwapLock, async () => {
        await this.expireReverseSwap(reverseSwap);
      });
    });

    this.utxoNursery.on(
      'server.lockup.confirmed',
      async ({ swap, transaction }) => {
        await this.lock.acquire(
          swap.type === SwapType.ReverseSubmarine
            ? SwapNursery.reverseSwapLock
            : SwapNursery.chainSwapLock,
          async () => {
            this.emit('transaction', {
              swap,
              transaction,
              confirmed: true,
            });
          },
        );
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
              reverseSwap,
              chainCurrency.chainClient!,
              wallet,
              lightningClient,
            );
            break;

          case CurrencyType.Ether:
            await this.lockupEther(reverseSwap, wallet, lightningClient);
            break;

          case CurrencyType.ERC20:
            await this.lockupERC20(reverseSwap, wallet, lightningClient);
            break;
        }
      });
    });

    this.utxoNursery.on(
      'reverseSwap.claimed',
      async ({ reverseSwap, preimage }) => {
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
            await WrappedSwapRepository.setStatus(
              reverseSwap,
              SwapUpdateEvent.InvoiceExpired,
            ),
          );
        });
      },
    );

    // Chain swap events
    this.utxoNursery.on(
      'chainSwap.lockup.zeroconf.rejected',
      async ({ swap, transaction, reason }) => {
        await this.lock.acquire(SwapNursery.swapLock, async () => {
          this.logger.warn(
            `Rejected 0-conf lockup transaction (${transaction.getId()}:${
              swap.receivingData.transactionVout
            }) of ${swapTypeToPrettyString(swap.type)} Swap ${swap.chainSwap.id}: ${reason}`,
          );

          this.emit('zeroconf.rejected', {
            transaction,
            swap: await WrappedSwapRepository.setStatus(
              swap,
              SwapUpdateEvent.TransactionZeroConfRejected,
            ),
          });
        });
      },
    );

    this.utxoNursery.on(
      'chainSwap.lockup',
      async ({ swap, transaction, confirmed }) => {
        await this.lock.acquire(SwapNursery.chainSwapLock, async () => {
          const fetchedSwap = await ChainSwapRepository.getChainSwap({
            id: swap.id,
          });
          if (fetchedSwap === null) {
            return;
          }

          if (
            fetchedSwap.sendingData.transactionId !== null &&
            fetchedSwap.sendingData.transactionId !== undefined
          ) {
            this.logger.warn(
              `Prevented ${swapTypeToPrettyString(swap.type)} Swap ${fetchedSwap.id} from sending a second lockup transaction`,
            );
            return;
          }

          this.emit('transaction', {
            confirmed,
            transaction,
            swap: fetchedSwap,
          });

          await this.handleChainSwapLockup(fetchedSwap);
        });
      },
    );

    this.utxoNursery.on('chainSwap.lockup.failed', async ({ swap, reason }) => {
      await this.lock.acquire(SwapNursery.chainSwapLock, async () => {
        await this.lockupFailed(swap, reason);
      });
    });

    this.utxoNursery.on('chainSwap.claimed', async ({ swap, preimage }) => {
      await this.lock.acquire(SwapNursery.chainSwapLock, async () => {
        await this.attemptSettleSwap(
          this.currencies.get(swap.receivingData.symbol)!,
          swap,
          undefined,
          preimage,
        );
        await this.chainSwapSigner.removeFromClaimable(swap.id);
      });
    });

    this.utxoNursery.on('chainSwap.expired', async (chainSwap) => {
      await this.lock.acquire(SwapNursery.chainSwapLock, async () => {
        await this.expireChainSwap(chainSwap);
      });
    });

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
    swap: Swap | ChainSwapInfo,
    outgoingChannelId?: string,
    preimage?: Buffer,
  ): Promise<void> => {
    let payRes: PaidSwapInvoice | undefined;

    if (swap.type === SwapType.Submarine) {
      payRes = await this.payInvoice(swap as Swap, outgoingChannelId);
    } else {
      payRes = { preimage: preimage!, channelCreation: null };
    }

    if (payRes === undefined) {
      return;
    }

    if (await this.claimer.deferClaim(swap, payRes.preimage)) {
      this.emit('claim.pending', swap);
      return;
    }

    const txToClaim =
      swap.type === SwapType.Submarine
        ? (swap as Swap).lockupTransactionId
        : (swap as ChainSwapInfo).receivingData.transactionId;

    switch (currency.type) {
      case CurrencyType.BitcoinLike:
      case CurrencyType.Liquid: {
        const lockupTransactionHex =
          await currency.chainClient!.getRawTransaction(txToClaim!);

        await this.claimUtxo(
          swap,
          currency.chainClient!,
          this.walletManager.wallets.get(currency.symbol)!,
          parseTransaction(currency.type, lockupTransactionHex),
          payRes.preimage,
          payRes.channelCreation,
        );
        break;
      }

      case CurrencyType.Ether: {
        const manager = this.findEthereumNursery(
          currency.symbol,
        )!.ethereumManager;
        const lockupAddress =
          swap.type === SwapType.Submarine
            ? (swap as Swap).lockupAddress
            : (swap as ChainSwapInfo).receivingData.lockupAddress;
        const contracts = (await manager.contractsForAddress(lockupAddress))!;

        await this.claimEther(
          manager,
          contracts,
          swap,
          await queryEtherSwapValuesFromLock(
            manager.provider,
            contracts.etherSwap,
            txToClaim!,
          ),
          payRes.preimage,
          payRes.channelCreation,
        );
        break;
      }

      case CurrencyType.ERC20: {
        const manager = this.findEthereumNursery(
          currency.symbol,
        )!.ethereumManager;
        const lockupAddress =
          swap.type === SwapType.Submarine
            ? (swap as Swap).lockupAddress
            : (swap as ChainSwapInfo).receivingData.lockupAddress;
        const contracts = (await manager.contractsForAddress(lockupAddress))!;

        await this.claimERC20(
          contracts.contractHandler,
          swap,
          await queryERC20SwapValuesFromLock(
            manager.provider,
            contracts.erc20Swap,
            txToClaim!,
          ),
          payRes.preimage,
          payRes.channelCreation,
        );
        break;
      }
    }
  };

  public settleReverseSwapInvoice = async (
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
      const message = `Could not settle ${nodeTypeToPrettyString(reverseSwap.node)} invoice of ${reverseSwap.id}: ${formatError(e)}`;
      this.logger.error(message);
      await this.notifications?.sendMessage(message, true);
    }
  };

  private handleChainSwapLockup = async (swap: ChainSwapInfo) => {
    const sendingCurrency = this.currencies.get(swap.sendingData.symbol)!;
    const wallet = this.walletManager.wallets.get(swap.sendingData.symbol)!;

    switch (sendingCurrency.type) {
      case CurrencyType.BitcoinLike:
      case CurrencyType.Liquid:
        await this.lockupUtxo(swap, sendingCurrency.chainClient!, wallet);
        await this.chainSwapSigner.registerForClaim(swap);
        break;

      case CurrencyType.Ether:
        await this.lockupEther(swap, wallet);
        break;

      case CurrencyType.ERC20:
        await this.lockupERC20(swap, wallet);
        break;
    }
  };

  private listenEthereumNursery = async (ethereumNursery: EthereumNursery) => {
    // Swap events
    ethereumNursery.on('swap.expired', async ({ swap }) => {
      await this.lock.acquire(SwapNursery.swapLock, async () => {
        await this.expireSwap(swap);
      });
    });

    ethereumNursery.on('lockup.failed', async ({ swap, reason }) => {
      await this.lock.acquire(SwapNursery.swapLock, async () => {
        await this.lockupFailed(swap, reason);
      });
    });

    const handleLockup = async (
      swap: Swap | ChainSwapInfo,
      transactionHash: string,
    ) => {
      await this.lock.acquire(
        swap.type === SwapType.Submarine
          ? SwapNursery.swapLock
          : SwapNursery.chainSwapLock,
        async () => {
          this.emit('transaction', {
            swap,
            confirmed: true,
            transaction: transactionHash,
          });

          if (swap.type === SwapType.Chain) {
            await this.handleChainSwapLockup(swap as ChainSwapInfo);
          } else {
            if ((swap as Swap).invoice) {
              const { base, quote } = splitPairId(swap.pair);
              await this.attemptSettleSwap(
                this.currencies.get(
                  getChainCurrency(base, quote, swap.orderSide, false),
                )!,
                swap as Swap,
              );
            } else {
              await this.setSwapRate(swap as Swap);
            }
          }
        },
      );
    };

    ethereumNursery.on('eth.lockup', async ({ swap, transactionHash }) => {
      await handleLockup(swap, transactionHash);
    });

    ethereumNursery.on('erc20.lockup', async ({ swap, transactionHash }) => {
      await handleLockup(swap, transactionHash);
    });

    // Reverse Swap events
    ethereumNursery.on('reverseSwap.expired', async ({ reverseSwap }) => {
      await this.lock.acquire(SwapNursery.reverseSwapLock, async () => {
        await this.expireReverseSwap(reverseSwap);
      });
    });

    ethereumNursery.on('lockup.failedToSend', async ({ swap, reason }) => {
      if (swap.type === SwapType.ReverseSubmarine) {
        await this.lock.acquire(SwapNursery.reverseSwapLock, async () => {
          const { base, quote } = splitPairId(swap.pair);
          const chainSymbol = getChainCurrency(
            base,
            quote,
            swap.orderSide,
            true,
          );
          const lightningSymbol = getLightningCurrency(
            base,
            quote,
            swap.orderSide,
            true,
          );

          await this.handleSwapSendFailed(
            swap,
            chainSymbol,
            reason,
            NodeSwitch.getReverseSwapNode(
              this.currencies.get(lightningSymbol)!,
              swap as ReverseSwap,
            ),
          );
        });
      } else {
        await this.lock.acquire(SwapNursery.chainSwapLock, async () => {
          await this.handleSwapSendFailed(
            swap,
            (swap as ChainSwapInfo).sendingData.symbol,
            reason,
          );
        });
      }
    });

    ethereumNursery.on(
      'lockup.confirmed',
      async ({ swap, transactionHash }) => {
        await this.lock.acquire(
          swap.type === SwapType.ReverseSubmarine
            ? SwapNursery.reverseSwapLock
            : SwapNursery.chainSwapLock,
          async () => {
            this.emit('transaction', {
              swap,
              confirmed: true,
              transaction: transactionHash,
            });
          },
        );
      },
    );

    ethereumNursery.on('claim', async ({ swap, preimage }) => {
      await this.lock.acquire(
        swap.type === SwapType.ReverseSubmarine
          ? SwapNursery.reverseSwapLock
          : SwapNursery.chainSwapLock,
        async () => {
          if (swap.type === SwapType.ReverseSubmarine) {
            await this.settleReverseSwapInvoice(swap as ReverseSwap, preimage);
          } else {
            const chainSwap = swap as ChainSwapInfo;
            await this.attemptSettleSwap(
              this.currencies.get(chainSwap.receivingData.symbol)!,
              chainSwap,
              undefined,
              preimage,
            );
          }
        },
      );
    });

    ethereumNursery.on('chainSwap.expired', async ({ chainSwap }) => {
      await this.lock.acquire(SwapNursery.chainSwapLock, async () => {
        await this.expireChainSwap(chainSwap);
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
        this.rateProvider.providers[swap.version].getRate(
          swap.pair,
          swap.type,
        )!,
        swap.orderSide,
        false,
      );

      await SwapRepository.setRate(swap, rate);
    }
  };

  private lockupUtxo = async (
    swap: ReverseSwap | ChainSwapInfo,
    chainClient: IChainClient,
    wallet: Wallet,
    lightningClient?: LightningClient,
  ) => {
    try {
      let feePerVbyte: number;

      if (
        swap.type === SwapType.ReverseSubmarine &&
        (swap as ReverseSwap).minerFeeInvoice
      ) {
        const decoded = await this.sidecar.decodeInvoiceOrOffer(
          (swap as ReverseSwap).minerFeeInvoice!,
        );
        const minerFeeAmountSat = msatToSat(decoded.amountMsat);

        // TODO: how does this behave cross chain
        feePerVbyte = Math.round(
          minerFeeAmountSat /
            FeeProvider.transactionSizes[CurrencyType.BitcoinLike][
              SwapVersion.Legacy
            ].reverseLockup,
        );
        this.logger.debug(
          `Using prepay minerfee for lockup of Reverse Swap ${swap.id}: ${feePerVbyte} sat/vbyte`,
        );
      } else {
        feePerVbyte = await chainClient.estimateFee(
          SwapNursery.reverseSwapMempoolEta,
        );
      }

      const onchainAmount =
        swap.type === SwapType.ReverseSubmarine
          ? (swap as ReverseSwap).onchainAmount
          : (swap as ChainSwapInfo).sendingData.expectedAmount;
      const lockupAddress =
        swap.type === SwapType.ReverseSubmarine
          ? (swap as ReverseSwap).lockupAddress
          : (swap as ChainSwapInfo).sendingData.lockupAddress;

      const { transaction, transactionId, vout, fee } =
        await wallet.sendToAddress(
          lockupAddress,
          onchainAmount,
          feePerVbyte,
          TransactionLabelRepository.lockupLabel(swap),
        );
      this.logger.verbose(
        `Locked up ${onchainAmount} ${
          wallet.symbol
        } for ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}: ${transactionId}:${vout!}`,
      );

      chainClient.addInputFilter(transaction!.getHash());

      // For the "transaction.confirmed" event of the lockup transaction
      chainClient.addOutputFilter(wallet.decodeAddress(lockupAddress));

      this.emit('coins.sent', {
        transaction: transaction!,
        swap: await WrappedSwapRepository.setServerLockupTransaction(
          swap,
          transactionId,
          onchainAmount,
          fee!,
          vout!,
        ),
      });
    } catch (error) {
      await this.handleSwapSendFailed(
        swap,
        wallet.symbol,
        error,
        lightningClient,
      );
    }
  };

  private lockupEther = async (
    swap: ReverseSwap | ChainSwapInfo,
    wallet: Wallet,
    lightningClient?: LightningClient,
  ) => {
    try {
      const nursery = this.findEthereumNursery(wallet.symbol)!;
      const lockupDetails =
        swap.type === SwapType.ReverseSubmarine
          ? (swap as ReverseSwap)
          : (swap as ChainSwapInfo).sendingData;
      const contracts = (await nursery.ethereumManager.contractsForAddress(
        lockupDetails.lockupAddress,
      ))!;

      let contractTransaction: ContractTransactionResponse;

      if (
        swap.type === SwapType.ReverseSubmarine &&
        (swap as ReverseSwap).minerFeeOnchainAmount
      ) {
        contractTransaction =
          await contracts.contractHandler.lockupEtherPrepayMinerfee(
            swap,
            getHexBuffer(swap.preimageHash),
            BigInt(lockupDetails.expectedAmount) * etherDecimals,
            BigInt((swap as ReverseSwap).minerFeeOnchainAmount!) *
              etherDecimals,
            lockupDetails.claimAddress!,
            lockupDetails.timeoutBlockHeight,
          );
      } else {
        contractTransaction = await contracts.contractHandler.lockupEther(
          swap,
          getHexBuffer(swap.preimageHash),
          BigInt(lockupDetails.expectedAmount) * etherDecimals,
          lockupDetails.claimAddress!,
          lockupDetails.timeoutBlockHeight,
        );
      }

      nursery.listenContractTransaction(swap, contractTransaction);
      this.logger.verbose(
        `Locked up ${lockupDetails.expectedAmount} ${wallet.symbol} for ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}: ${contractTransaction.hash}`,
      );

      const transactionFee =
        calculateEthereumTransactionFee(contractTransaction);

      this.emit('coins.sent', {
        transaction: contractTransaction.hash,
        swap: await WrappedSwapRepository.setServerLockupTransaction(
          swap,
          contractTransaction.hash,
          lockupDetails.expectedAmount,
          transactionFee,
        ),
      });
    } catch (error) {
      await this.handleSwapSendFailed(
        swap,
        wallet.symbol,
        error,
        lightningClient,
      );
    }
  };

  private lockupERC20 = async (
    swap: ReverseSwap | ChainSwapInfo,
    wallet: Wallet,
    lightningClient?: LightningClient,
  ) => {
    try {
      const nursery = this.findEthereumNursery(wallet.symbol)!;
      const walletProvider = wallet.walletProvider as ERC20WalletProvider;

      const lockupDetails =
        swap.type === SwapType.ReverseSubmarine
          ? (swap as ReverseSwap)
          : (swap as ChainSwapInfo).sendingData;
      const contracts = (await nursery.ethereumManager.contractsForAddress(
        lockupDetails.lockupAddress,
      ))!;

      let contractTransaction: ContractTransactionResponse;

      if (
        swap.type === SwapType.ReverseSubmarine &&
        (swap as ReverseSwap).minerFeeOnchainAmount
      ) {
        contractTransaction =
          await contracts.contractHandler.lockupTokenPrepayMinerfee(
            swap,
            walletProvider,
            getHexBuffer(swap.preimageHash),
            walletProvider.formatTokenAmount(lockupDetails.expectedAmount),
            BigInt((swap as ReverseSwap).minerFeeOnchainAmount!) *
              etherDecimals,
            lockupDetails.claimAddress!,
            lockupDetails.timeoutBlockHeight,
          );
      } else {
        contractTransaction = await contracts.contractHandler.lockupToken(
          swap,
          walletProvider,
          getHexBuffer(swap.preimageHash),
          walletProvider.formatTokenAmount(lockupDetails.expectedAmount),
          lockupDetails.claimAddress!,
          lockupDetails.timeoutBlockHeight,
        );
      }

      nursery.listenContractTransaction(swap, contractTransaction);
      this.logger.verbose(
        `Locked up ${lockupDetails.expectedAmount} ${wallet.symbol} for ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}: ${contractTransaction.hash}`,
      );

      const transactionFee =
        calculateEthereumTransactionFee(contractTransaction);

      this.emit('coins.sent', {
        transaction: contractTransaction.hash,
        swap: await WrappedSwapRepository.setServerLockupTransaction(
          swap,
          contractTransaction.hash,
          lockupDetails.expectedAmount,
          transactionFee,
        ),
      });
    } catch (error) {
      await this.handleSwapSendFailed(
        swap,
        wallet.symbol,
        error,
        lightningClient,
      );
    }
  };

  private payInvoice = async (
    swap: Swap,
    outgoingChannelId?: string,
  ): Promise<PaidSwapInvoice | undefined> => {
    const channelCreation = await ChannelCreationRepository.getChannelCreation({
      swapId: swap.id,
    });
    const preimage = await this.paymentHandler.payInvoice(
      swap,
      channelCreation,
      outgoingChannelId,
    );

    if (preimage === undefined) {
      return undefined;
    }

    return {
      preimage,
      channelCreation,
    };
  };

  private claimUtxo = async (
    swap: Swap | ChainSwapInfo,
    chainClient: IChainClient,
    wallet: Wallet,
    transaction: Transaction | LiquidTransaction,
    preimage: Buffer,
    channelCreation: ChannelCreation | null,
  ) => {
    if (await this.claimer.deferClaim(swap, preimage)) {
      this.emit('claim.pending', swap);
      return;
    }

    const claimTransaction = constructClaimTransaction(
      wallet,
      [
        constructClaimDetails(
          this.swapOutputType,
          wallet,
          swap.type === SwapType.Submarine
            ? (swap as Swap)
            : (swap as ChainSwapInfo).receivingData,
          transaction,
          preimage,
        ),
      ] as ClaimDetails[] | LiquidClaimDetails[],
      await wallet.getAddress(TransactionLabelRepository.claimLabel(swap)),
      await chainClient.estimateFee(),
    );

    const claimTransactionFee = await calculateTransactionFee(
      chainClient,
      claimTransaction,
    );

    await chainClient.sendRawTransaction(claimTransaction.toHex(), true);

    this.logger.info(
      `Claimed ${wallet.symbol} of ${swapTypeToPrettyString(swap.type)} Swap ${swap.id} in: ${claimTransaction.getId()}`,
    );

    this.emit('claim', {
      channelCreation: channelCreation || undefined,
      swap:
        swap.type === SwapType.Submarine
          ? await SwapRepository.setMinerFee(swap as Swap, claimTransactionFee)
          : await ChainSwapRepository.setClaimMinerFee(
              swap as ChainSwapInfo,
              preimage,
              claimTransactionFee,
            ),
    });
  };

  private claimEther = async (
    manager: EthereumManager,
    contracts: Contracts,
    swap: Swap | ChainSwapInfo,
    etherSwapValues: EtherSwapValues,
    preimage: Buffer,
    channelCreation?: ChannelCreation | null,
  ) => {
    const contractTransaction = await contracts.contractHandler.claimEther(
      swap,
      preimage,
      etherSwapValues.amount,
      etherSwapValues.refundAddress,
      etherSwapValues.timelock,
    );

    this.logger.info(
      `Claimed ${manager.networkDetails.name} of ${swapTypeToPrettyString(swap.type)} Swap ${swap.id} in: ${contractTransaction.hash}`,
    );
    const transactionFee = calculateEthereumTransactionFee(contractTransaction);
    this.emit('claim', {
      channelCreation: channelCreation || undefined,
      swap:
        swap.type === SwapType.Submarine
          ? await SwapRepository.setMinerFee(swap as Swap, transactionFee)
          : await ChainSwapRepository.setClaimMinerFee(
              swap as ChainSwapInfo,
              preimage,
              transactionFee,
            ),
    });
  };

  private claimERC20 = async (
    contractHandler: ContractHandler,
    swap: Swap | ChainSwapInfo,
    erc20SwapValues: ERC20SwapValues,
    preimage: Buffer,
    channelCreation?: ChannelCreation | null,
  ) => {
    const { base, quote } = splitPairId(swap.pair);
    const chainCurrency = getChainCurrency(base, quote, swap.orderSide, false);

    const wallet = this.walletManager.wallets.get(chainCurrency)!;

    const contractTransaction = await contractHandler.claimToken(
      swap,
      wallet.walletProvider as ERC20WalletProvider,
      preimage,
      erc20SwapValues.amount,
      erc20SwapValues.refundAddress,
      erc20SwapValues.timelock,
    );

    this.logger.info(
      `Claimed ${chainCurrency} of ${swapTypeToPrettyString(swap.type)} Swap ${swap.id} in: ${contractTransaction.hash}`,
    );
    const transactionFee = calculateEthereumTransactionFee(contractTransaction);
    this.emit('claim', {
      channelCreation: channelCreation || undefined,
      swap:
        swap.type === SwapType.Submarine
          ? await SwapRepository.setMinerFee(swap as Swap, transactionFee)
          : await ChainSwapRepository.setClaimMinerFee(
              swap as ChainSwapInfo,
              preimage,
              transactionFee,
            ),
    });
  };

  private handleSwapSendFailed = async (
    swap: ReverseSwap | ChainSwapInfo,
    chainSymbol: string,
    error: unknown,
    lightningClient?: LightningClient,
  ) => {
    if (lightningClient !== undefined) {
      await LightningNursery.cancelReverseInvoices(
        lightningClient,
        swap as ReverseSwap,
        false,
      );
    }

    const onchainAmount =
      swap.type === SwapType.ReverseSubmarine
        ? (swap as ReverseSwap).onchainAmount
        : (swap as ChainSwapInfo).sendingData.expectedAmount;

    this.logger.warn(
      `Failed to lockup ${onchainAmount} ${chainSymbol} for ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}: ${formatError(
        error,
      )}`,
    );
    this.emit(
      'coins.failedToSend',
      await WrappedSwapRepository.setStatus(
        swap,
        SwapUpdateEvent.TransactionFailed,
        Errors.COINS_COULD_NOT_BE_SENT().message,
      ),
    );
  };

  private lockupFailed = async (swap: Swap | ChainSwapInfo, reason: string) => {
    this.logger.warn(
      `Lockup of ${swapTypeToPrettyString(swap.type)} Swap ${swap.id} failed: ${reason}`,
    );
    this.emit(
      'lockup.failed',
      swap.type === SwapType.Submarine
        ? await SwapRepository.setSwapStatus(
            swap as Swap,
            SwapUpdateEvent.TransactionLockupFailed,
            reason,
          )
        : await WrappedSwapRepository.setStatus(
            swap as ChainSwapInfo,
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

    try {
      if (reverseSwap.transactionId) {
        switch (chainCurrency.type) {
          case CurrencyType.BitcoinLike:
          case CurrencyType.Liquid:
            await this.refundUtxo(chainCurrency, reverseSwap);
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
          await WrappedSwapRepository.setStatus(
            reverseSwap,
            SwapUpdateEvent.SwapExpired,
            Errors.ONCHAIN_HTLC_TIMED_OUT().message,
          ),
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
    } catch (e) {
      await this.handleFailedRefund(reverseSwap, e);
    }
  };

  private expireChainSwap = async (chainSwap: ChainSwapInfo) => {
    // Sometimes, when blocks are mined quickly (realistically just regtest), it can happen that the
    // nurseries, which are not in the async lock, send the expiration event of a Swap multiple times.
    // To handle this scenario, the Swap is queried again to ensure that it should actually be expired or refunded
    chainSwap = (await ChainSwapRepository.getChainSwap({ id: chainSwap.id }))!;

    if (FinalChainSwapEvents.includes(chainSwap.status)) {
      return;
    }

    const chainCurrency = this.currencies.get(chainSwap.sendingData.symbol)!;

    try {
      if (chainSwap.sendingData.transactionId) {
        switch (chainCurrency.type) {
          case CurrencyType.BitcoinLike:
          case CurrencyType.Liquid:
            await this.chainSwapSigner.removeFromClaimable(chainSwap.id);
            await this.refundUtxo(chainCurrency, chainSwap);

            break;

          case CurrencyType.Ether:
            await this.refundEther(chainSwap, chainCurrency.symbol);
            break;

          case CurrencyType.ERC20:
            await this.refundERC20(chainSwap, chainCurrency.symbol);
            break;
        }
      } else {
        this.emit(
          'expiration',
          await WrappedSwapRepository.setStatus(
            chainSwap,
            SwapUpdateEvent.SwapExpired,
            Errors.ONCHAIN_HTLC_TIMED_OUT().message,
          ),
        );
      }
    } catch (e) {
      await this.handleFailedRefund(chainSwap, e);
    }
  };

  private refundUtxo = async (
    chainCurrency: Currency,
    swap: ReverseSwap | ChainSwapInfo,
  ) => {
    const chainClient = chainCurrency.chainClient!;
    const wallet = this.walletManager.wallets.get(chainCurrency.symbol)!;

    const sendingData =
      swap.type === SwapType.ReverseSubmarine
        ? (swap as ReverseSwap)
        : (swap as ChainSwapInfo).sendingData;

    const rawLockupTransaction =
      await chainCurrency.chainClient!.getRawTransaction(
        sendingData.transactionId!,
      );
    const lockupTransaction = parseTransaction(
      chainClient.currencyType,
      rawLockupTransaction,
    );

    const lockupOutput = lockupTransaction.outs[sendingData.transactionVout!];
    const refundDetails = {
      ...lockupOutput,
      vout: sendingData.transactionVout,
      txHash: lockupTransaction.getHash(),
      keys: wallet.getKeysByIndex(sendingData.keyIndex!),
    } as RefundDetails | LiquidRefundDetails;

    switch (swap.version) {
      case SwapVersion.Taproot: {
        refundDetails.type = OutputType.Taproot;
        refundDetails.cooperative = false;
        refundDetails.swapTree = SwapTreeSerializer.deserializeSwapTree(
          sendingData.redeemScript!,
        );
        refundDetails.internalKey = createMusig(
          refundDetails.keys,
          getHexBuffer(sendingData.theirPublicKey!),
        ).getAggregatedPublicKey();
        break;
      }

      default: {
        refundDetails.type = LegacyReverseSwapOutputType;
        refundDetails.redeemScript = getHexBuffer(
          (swap as ReverseSwap).redeemScript!,
        );
        break;
      }
    }

    const refundTransaction = constructRefundTransaction(
      wallet,
      [refundDetails] as RefundDetails[] | LiquidRefundDetails[],
      await wallet.getAddress(TransactionLabelRepository.refundLabel(swap)),
      sendingData.timeoutBlockHeight,
      await chainCurrency.chainClient!.estimateFee(),
    );
    const minerFee = await calculateTransactionFee(
      chainCurrency.chainClient!,
      refundTransaction,
    );

    await chainClient.sendRawTransaction(refundTransaction.toHex(), true);

    this.logger.info(
      `Refunded ${chainClient.symbol} of ${swapTypeToPrettyString(swap.type)} Swap ${
        swap.id
      } in: ${refundTransaction.getId()}`,
    );

    this.emit('refund', {
      refundTransaction: refundTransaction.getId(),
      swap: await WrappedSwapRepository.setTransactionRefunded(
        swap,
        minerFee,
        Errors.REFUNDED_COINS(sendingData.transactionId!).message,
      ),
    });
  };

  private refundEther = async (
    swap: ReverseSwap | ChainSwapInfo,
    chainSymbol: string,
  ) => {
    const nursery = this.findEthereumNursery(chainSymbol)!;
    const contracts = (await nursery.ethereumManager.contractsForAddress(
      swap.type === SwapType.ReverseSubmarine
        ? (swap as ReverseSwap).lockupAddress
        : (swap as ChainSwapInfo).sendingData.lockupAddress,
    ))!;

    const lockupTransactionId =
      swap.type === SwapType.ReverseSubmarine
        ? (swap as ReverseSwap).transactionId
        : (swap as ChainSwapInfo).sendingData.transactionId;

    const etherSwapValues = await queryEtherSwapValuesFromLock(
      nursery.ethereumManager!.provider,
      contracts.etherSwap,
      lockupTransactionId!,
    );
    const contractTransaction = await contracts.contractHandler.refundEther(
      swap,
      getHexBuffer(swap.preimageHash),
      etherSwapValues.amount,
      etherSwapValues.claimAddress,
      etherSwapValues.timelock,
    );

    this.logger.info(
      `Refunded ${nursery.ethereumManager.networkDetails.name} of ${swapTypeToPrettyString(swap.type)} Swap ${swap.id} in: ${contractTransaction.hash}`,
    );

    this.emit('refund', {
      refundTransaction: contractTransaction.hash,
      swap: await WrappedSwapRepository.setTransactionRefunded(
        swap,
        calculateEthereumTransactionFee(contractTransaction),
        Errors.REFUNDED_COINS(lockupTransactionId!).message,
      ),
    });
  };

  private refundERC20 = async (
    swap: ReverseSwap | ChainSwapInfo,
    chainSymbol: string,
  ) => {
    const nursery = this.findEthereumNursery(chainSymbol)!;
    const contracts = (await nursery.ethereumManager.contractsForAddress(
      swap.type === SwapType.ReverseSubmarine
        ? (swap as ReverseSwap).lockupAddress
        : (swap as ChainSwapInfo).sendingData.lockupAddress,
    ))!;

    const walletProvider = this.walletManager.wallets.get(chainSymbol)!
      .walletProvider as ERC20WalletProvider;

    const lockupTransactionId =
      swap.type === SwapType.ReverseSubmarine
        ? (swap as ReverseSwap).transactionId
        : (swap as ChainSwapInfo).sendingData.transactionId;

    const erc20SwapValues = await queryERC20SwapValuesFromLock(
      nursery.ethereumManager.provider,
      contracts.erc20Swap,
      lockupTransactionId!,
    );
    const contractTransaction = await contracts.contractHandler.refundToken(
      swap,
      walletProvider,
      getHexBuffer(swap.preimageHash),
      erc20SwapValues.amount,
      erc20SwapValues.claimAddress,
      erc20SwapValues.timelock,
    );

    this.logger.info(
      `Refunded ${chainSymbol} of ${swapTypeToPrettyString(swap.type)} Swap ${swap.id} in: ${contractTransaction.hash}`,
    );

    this.emit('refund', {
      refundTransaction: contractTransaction.hash,
      swap: await WrappedSwapRepository.setTransactionRefunded(
        swap,
        calculateEthereumTransactionFee(contractTransaction),
        Errors.REFUNDED_COINS(lockupTransactionId!).message,
      ),
    });
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

  private handleFailedRefund = async (swap: AnySwap, error: unknown) => {
    const msg = `Refunding ${swapTypeToPrettyString(swap.type)} Swap ${swap.id} failed: ${formatError(error)}`;
    this.logger.error(msg);
    await this.notifications?.sendMessage(msg, true, true);
  };
}

export default SwapNursery;
