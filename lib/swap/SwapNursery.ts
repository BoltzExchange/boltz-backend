import type { Transaction } from '@scure/btc-signer';
import type { Types } from 'boltz-core';
import { OutputType, SwapTreeSerializer } from 'boltz-core';
import type { ContractTransactionResponse } from 'ethers';
import type {
  Transaction as LiquidTransaction,
  TxOutput as LiquidTxOutput,
} from 'liquidjs-lib';
import { Op } from 'sequelize';
import type {
  ClaimDetails,
  LiquidClaimDetails,
  LiquidRefundDetails,
  RefundDetails,
} from '../Core';
import {
  calculateTransactionFee,
  constructClaimDetails,
  constructClaimTransaction,
  constructRefundTransaction,
  createMusig,
  parseTransaction,
} from '../Core';
import InstrumentedLock from '../InstrumentedLock';
import type Logger from '../Logger';
import { racePromise } from '../PromiseUtils';
import { TxView } from '../TxView';
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
import type ArkClient from '../chain/ArkClient';
import type { IChainClient } from '../chain/ChainClient';
import { LegacyReverseSwapOutputType, etherDecimals } from '../consts/Consts';
import {
  CurrencyType,
  FinalChainSwapEvents,
  SuccessSwapUpdateEvents,
  SwapType,
  SwapUpdateEvent,
  SwapVersion,
  swapTypeToPrettyString,
} from '../consts/Enums';
import TypedEventEmitter from '../consts/TypedEventEmitter';
import type {
  AnySwap,
  ERC20SwapValues,
  EtherSwapValues,
} from '../consts/Types';
import { RefundStatus } from '../db/models/RefundTransaction';
import type ReverseSwap from '../db/models/ReverseSwap';
import type SendApprovalHold from '../db/models/SendApprovalHold';
import type Swap from '../db/models/Swap';
import type { ChainSwapInfo } from '../db/repositories/ChainSwapRepository';
import ChainSwapRepository from '../db/repositories/ChainSwapRepository';
import RefundTransactionRepository from '../db/repositories/RefundTransactionRepository';
import ReverseSwapRepository from '../db/repositories/ReverseSwapRepository';
import SendApprovalHoldRepository from '../db/repositories/SendApprovalHoldRepository';
import SwapRepository from '../db/repositories/SwapRepository';
import TransactionLabelRepository from '../db/repositories/TransactionLabelRepository';
import WrappedSwapRepository from '../db/repositories/WrappedSwapRepository';
import { msatToSat } from '../lightning/ChannelUtils';
import type { LightningClient } from '../lightning/LightningClient';
import { HtlcState, InvoiceState } from '../lightning/LightningClient';
import PendingPaymentTracker from '../lightning/PendingPaymentTracker';
import type NotificationClient from '../notifications/NotificationClient';
import { Signer } from '../proto/boltzrpc';
import FeeProvider from '../rates/FeeProvider';
import type LockupTransactionTracker from '../rates/LockupTransactionTracker';
import type RateProvider from '../rates/RateProvider';
import SignerControlRegistry from '../service/SignerControlRegistry';
import { disabledSignerMessage } from '../service/SignerControlUtils';
import type TimeoutDeltaProvider from '../service/TimeoutDeltaProvider';
import type ChainSwapSigner from '../service/cooperative/ChainSwapSigner';
import type DeferredClaimer from '../service/cooperative/DeferredClaimer';
import type Sidecar from '../sidecar/Sidecar';
import type Wallet from '../wallet/Wallet';
import type { Currency } from '../wallet/WalletManager';
import type WalletManager from '../wallet/WalletManager';
import type EthereumManager from '../wallet/ethereum/EthereumManager';
import type ContractHandler from '../wallet/ethereum/contracts/ContractHandler';
import {
  queryERC20SwapValuesFromLock,
  queryEtherSwapValuesFromLock,
} from '../wallet/ethereum/contracts/ContractUtils';
import type Contracts from '../wallet/ethereum/contracts/Contracts';
import type ERC20WalletProvider from '../wallet/providers/ERC20WalletProvider';
import ArkNursery from './ArkNursery';
import Errors from './Errors';
import EthereumNursery from './EthereumNursery';
import InvoiceNursery from './InvoiceNursery';
import LightningNursery from './LightningNursery';
import NodeSwitch, { ReverseSwapNodeResolutionStatus } from './NodeSwitch';
import type OverpaymentProtector from './OverpaymentProtector';
import type { SwapNurseryEvents } from './PaymentHandler';
import PaymentHandler from './PaymentHandler';
import RefundWatcher from './RefundWatcher';
import {
  persistSendApprovalDecision,
  resolveSendApprovalDecision,
} from './SendApprovalGuard';
import type SwapOutputType from './SwapOutputType';
import UtxoNursery from './UtxoNursery';
import SendApprovalHook, { SendApprovalAction } from './hooks/SendApprovalHook';
import TransactionHook from './hooks/TransactionHook';

type PaidSwapInvoice = {
  preimage: Buffer;
};

class SwapNursery extends TypedEventEmitter<SwapNurseryEvents> {
  // Constants
  public static reverseSwapMempoolEta = 2;
  private static readonly actionableChainSwapLockupStatuses = [
    SwapUpdateEvent.SwapCreated,
    SwapUpdateEvent.TransactionMempool,
    SwapUpdateEvent.TransactionConfirmed,
  ];

  // Nurseries
  public readonly arkNursery: ArkNursery;
  public readonly utxoNursery: UtxoNursery;
  public readonly ethereumNurseries: EthereumNursery[];

  private readonly invoiceNursery: InvoiceNursery;
  private readonly paymentHandler: PaymentHandler;
  private readonly lightningNursery: LightningNursery;
  private readonly pendingPaymentTracker: PendingPaymentTracker;
  private readonly refundWatcher: RefundWatcher;

  // Maps
  public currencies = new Map<string, Currency>();

  // Locks
  public readonly lock = new InstrumentedLock('swapNursery', {
    maxPending: 10_000,
  });

  public static readonly swapLock = 'swap';
  public static readonly chainSwapLock = 'chainSwap';
  public static readonly reverseSwapLock = 'reverseSwap';

  // The full three-way mapping is intentional: the two-way call sites only ever
  // pass the two types they can encounter, and this agrees with them on those
  private static readonly lockForSwapType = (type: SwapType): string =>
    type === SwapType.Submarine
      ? SwapNursery.swapLock
      : type === SwapType.ReverseSubmarine
        ? SwapNursery.reverseSwapLock
        : SwapNursery.chainSwapLock;

  private static retryLock = 'retry';
  private static readonly refundTransactionUpdateTimeout = 1_000;

  public readonly transactionHook: TransactionHook;
  public readonly sendApprovalHook: SendApprovalHook;

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
    private readonly claimer: DeferredClaimer,
    private readonly chainSwapSigner: ChainSwapSigner,
    lockupTransactionTracker: LockupTransactionTracker,
    overpaymentProtector: OverpaymentProtector,
    paymentTimeoutMinutes?: number,
    sendApprovalDefaultAction?: string,
  ) {
    super();

    this.logger.info(`Setting Swap retry interval to ${retryInterval} seconds`);

    this.transactionHook = new TransactionHook(this.logger, notifications);
    this.sendApprovalHook = new SendApprovalHook(
      this.logger,
      notifications,
      sendApprovalDefaultAction,
    );

    this.arkNursery = new ArkNursery(this.logger, overpaymentProtector);
    this.utxoNursery = new UtxoNursery(
      this.logger,
      this.sidecar,
      this.walletManager,
      lockupTransactionTracker,
      this.transactionHook,
      overpaymentProtector,
    );
    this.invoiceNursery = new InvoiceNursery(this.logger, this.sidecar);

    this.ethereumNurseries = this.walletManager.ethereumManagers.map(
      (manager) =>
        new EthereumNursery(
          this.logger,
          this.walletManager,
          manager,
          this.transactionHook,
          overpaymentProtector,
        ),
    );

    this.pendingPaymentTracker = new PendingPaymentTracker(
      this.logger,
      this.sidecar,
      paymentTimeoutMinutes,
    );
    this.paymentHandler = new PaymentHandler(
      this.logger,
      this.sidecar,
      this.nodeSwitch,
      this.currencies,
      timeoutDeltaProvider,
      this.pendingPaymentTracker,
      this,
      this.sendApprovalHook,
    );
    this.lightningNursery = new LightningNursery(
      this.logger,
      this.sidecar,
      this.paymentHandler.selfPaymentClient,
    );

    this.claimer.on('claim', ({ swap }) => {
      this.emit('claim', {
        swap,
      });
    });

    this.chainSwapSigner.setAttemptSettle(this.attemptSettleSwap);
    this.chainSwapSigner.on('claim', (swap) => {
      this.emit('claim', {
        swap,
      });
    });

    this.refundWatcher = new RefundWatcher(this.logger, this.sidecar);
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

    this.refundWatcher.init(this.currencies);

    // Swap events
    this.utxoNursery.on('swap.expired', async (swap) => {
      await this.lock.acquire(
        SwapNursery.swapLock,
        'swap.expired',
        async () => {
          await this.expireSwap(swap);
        },
      );
    });

    this.arkNursery.on('swap.expired', async (swap) => {
      await this.lock.acquire(
        SwapNursery.swapLock,
        'swap.expired',
        async () => {
          await this.expireSwap(swap);
        },
      );
    });

    this.utxoNursery.on('swap.lockup.failed', async ({ swap, reason }) => {
      await this.lock.acquire(
        SwapNursery.swapLock,
        'swap.lockup.failed',
        async () => {
          await this.lockupFailed(swap, reason);
        },
      );
    });

    this.utxoNursery.on(
      'swap.lockup.zeroconf.rejected',
      async ({ swap, transaction, reason }) => {
        await this.lock.acquire(
          SwapNursery.swapLock,
          'swap.lockup.zeroconf.rejected',
          async () => {
            this.logger.warn(
              `Rejected 0-conf lockup transaction (${TxView.of(transaction).id}:${
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
          },
        );
      },
    );

    this.utxoNursery.on(
      'swap.lockup',
      async ({ swap, transaction, confirmed }) => {
        await this.lock.acquire(
          SwapNursery.swapLock,
          'swap.lockup',
          async () => {
            const fetchedSwap = await SwapRepository.getSwap({
              id: swap.id,
            });
            if (fetchedSwap === null) {
              return;
            }
            swap = fetchedSwap;

            if (swap.createdRefundSignature) {
              this.logger.warn(
                `Prevented ${swapTypeToPrettyString(swap.type)} Swap ${swap.id} from paying an invoice because it already signed a refund`,
              );
              return;
            }

            if (
              swap.status === SwapUpdateEvent.TransactionClaimPending ||
              SuccessSwapUpdateEvents.includes(swap.status as SwapUpdateEvent)
            ) {
              this.logger.debug(
                `Not acting on lockup of Submarine Swap ${swap.id} because it succeeded already`,
              );
              return;
            }

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
              );
            } else {
              await this.setSwapRate(swap);
            }
          },
        );
      },
    );

    this.arkNursery.on('swap.lockup', async ({ swap, lockupTransactionId }) => {
      await this.lock.acquire(SwapNursery.swapLock, 'swap.lockup', async () => {
        const fetchedSwap = await SwapRepository.getSwap({
          id: swap.id,
        });
        if (fetchedSwap === null) {
          return;
        }
        swap = fetchedSwap;

        if (swap.createdRefundSignature) {
          this.logger.warn(
            `Prevented ${swapTypeToPrettyString(swap.type)} Swap ${swap.id} from paying an invoice because it already signed a refund`,
          );
          return;
        }

        if (swap.status !== SwapUpdateEvent.TransactionConfirmed) {
          this.logger.debug(
            `Not acting on ARK lockup of Submarine Swap ${swap.id} because it is already being processed with status ${swap.status}`,
          );
          return;
        }

        this.emit('transaction', {
          swap,
          confirmed: true,
          transaction: lockupTransactionId,
        });

        if (swap.invoice) {
          const payRes = await this.payInvoice(swap);
          if (payRes === undefined) {
            return;
          }

          const { base, quote } = splitPairId(swap.pair);
          const chainSymbol = getChainCurrency(
            base,
            quote,
            swap.orderSide,
            false,
          );

          const { arkNode } = this.currencies.get(chainSymbol)!;
          await this.claimVtxo(swap, arkNode!, payRes.preimage);
        } else {
          await this.setSwapRate(swap);
        }
      });
    });

    this.arkNursery.on('swap.lockup.failed', async ({ swap, reason }) => {
      await this.lock.acquire(
        SwapNursery.swapLock,
        'swap.lockup.failed',
        async () => {
          await this.lockupFailed(swap, reason);
        },
      );
    });

    this.arkNursery.on('reverseSwap.expired', async (reverseSwap) => {
      await this.lock.acquire(
        SwapNursery.reverseSwapLock,
        'reverseSwap.expired',
        async () => {
          await this.expireReverseSwap(reverseSwap);
        },
      );
    });

    this.arkNursery.on(
      'reverseSwap.claimed',
      async ({ reverseSwap, preimage }) => {
        await this.lock.acquire(
          SwapNursery.reverseSwapLock,
          'reverseSwap.claimed',
          async () => {
            await this.settleReverseSwapInvoice(reverseSwap, preimage);
          },
        );
      },
    );

    // Reverse Swap events
    this.utxoNursery.on('reverseSwap.expired', async (reverseSwap) => {
      await this.lock.acquire(
        SwapNursery.reverseSwapLock,
        'reverseSwap.expired',
        async () => {
          await this.expireReverseSwap(reverseSwap);
        },
      );
    });

    this.utxoNursery.on('server.lockup.confirmed', async (data) => {
      await this.lock.acquire(
        SwapNursery.lockForSwapType(data.swap.type),
        'server.lockup.confirmed',
        async () => {
          let swap: typeof data.swap | null;

          // Fetch the swap from database again to make sure we have the latest state
          if (data.swap.type === SwapType.ReverseSubmarine) {
            swap = await ReverseSwapRepository.getReverseSwap({
              id: data.swap.id,
            });
          } else {
            swap = await ChainSwapRepository.getChainSwap({ id: data.swap.id });
          }

          if (swap === null || swap === undefined) {
            this.logger.warn(`Could not find swap with id: ${data.swap.id}`);
            return;
          }

          if (
            swap.status === SwapUpdateEvent.TransactionClaimPending ||
            SuccessSwapUpdateEvents.includes(swap.status as SwapUpdateEvent)
          ) {
            this.logger.debug(
              `Not acting on confirmed server lockup transaction of ${swapTypeToPrettyString(swap.type)} Swap ${swap.id} because it succeeded already`,
            );
            return;
          }

          if (
            swap.type === SwapType.Chain &&
            (swap as ChainSwapInfo).preimage !== null &&
            (swap as ChainSwapInfo).preimage !== undefined
          ) {
            this.logger.debug(
              `Not acting on confirmed server lockup transaction of ${swapTypeToPrettyString(swap.type)} Swap ${swap.id} because it is being claimed already`,
            );
            return;
          }

          this.emit('transaction', {
            confirmed: true,
            transaction: data.transaction,
            swap: await WrappedSwapRepository.setStatus(
              swap,
              swap.type === SwapType.ReverseSubmarine
                ? SwapUpdateEvent.TransactionConfirmed
                : SwapUpdateEvent.TransactionServerConfirmed,
            ),
          });
        },
      );
    });

    this.lightningNursery.on('minerfee.invoice.paid', async (reverseSwap) => {
      await this.lock.acquire(
        SwapNursery.reverseSwapLock,
        'minerfee.invoice.paid',
        async () => {
          this.emit('minerfee.paid', reverseSwap);
        },
      );
    });

    this.lightningNursery.on('invoice.paid', async ({ id }) => {
      await this.withSendApproval<ReverseSwap>({
        id,
        symbolFor: (swap) => {
          const { base, quote } = splitPairId(swap.pair);
          return getChainCurrency(base, quote, swap.orderSide, true);
        },
        lock: SwapNursery.reverseSwapLock,
        lockReason: 'invoice.paid',
        loadEligible: () => this.loadEligibleReverseSwap(id),
        proceed: (swap, approval) => this.lockupReverseSwap(swap, approval),
      });
    });

    this.utxoNursery.on(
      'reverseSwap.claimed',
      async ({ reverseSwap, preimage }) => {
        await this.lock.acquire(
          SwapNursery.reverseSwapLock,
          'reverseSwap.claimed',
          async () => {
            await this.settleReverseSwapInvoice(reverseSwap, preimage);
          },
        );
      },
    );

    this.invoiceNursery.on('invoice.expired', async ({ id }) => {
      await this.lock.acquire(
        SwapNursery.reverseSwapLock,
        'invoice.expired',
        async () => {
          const reverseSwap = await ReverseSwapRepository.getReverseSwap({
            id,
          });
          if (reverseSwap === null || reverseSwap === undefined) {
            this.logger.warn(`Could not find Reverse Swap with id: ${id}`);
            return;
          }

          if (reverseSwap.status !== SwapUpdateEvent.SwapCreated) {
            this.logger.debug(
              `Not acting on expired invoice of Reverse Swap ${reverseSwap.id} because it does not have status ${SwapUpdateEvent.SwapCreated}`,
            );
            return;
          }

          const { base, quote } = splitPairId(reverseSwap.pair);
          const receiveCurrency = getLightningCurrency(
            base,
            quote,
            reverseSwap.orderSide,
            true,
          );
          const resolved = NodeSwitch.tryResolveReverseSwapNode(
            this.currencies.get(receiveCurrency)!,
            reverseSwap,
          );
          if (resolved.status !== ReverseSwapNodeResolutionStatus.Resolved) {
            this.logger.warn(
              `Skipping invoice expiry handling of Reverse Swap ${reverseSwap.id}: ${resolved.reason}`,
            );
            return;
          }
          const lightningClient = resolved.lightningClient;

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
                } failed because they could not be found: ${formatError(error)}`,
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
        },
      );
    });

    // Chain swap events
    this.utxoNursery.on(
      'chainSwap.lockup.zeroconf.rejected',
      async ({ swap, transaction, reason }) => {
        await this.lock.acquire(
          SwapNursery.chainSwapLock,
          'chainSwap.lockup.zeroconf.rejected',
          async () => {
            this.logger.warn(
              `Rejected 0-conf lockup transaction (${TxView.of(transaction).id}:${
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
          },
        );
      },
    );

    const handleIncomingChainSwapLockup = async (
      swap: ChainSwapInfo,
      transaction: Transaction | LiquidTransaction | string,
      confirmed: boolean,
    ) => {
      await this.withSendApproval<ChainSwapInfo>({
        id: swap.id,
        symbolFor: (fetchedSwap) => fetchedSwap.sendingData.symbol,
        lock: SwapNursery.chainSwapLock,
        lockReason: 'chainSwap.lockup',
        loadEligible: () => this.getChainSwapForLockup(swap),
        emitTransaction: { transaction, confirmed },
        proceed: (fetchedSwap, approval) =>
          this.handleChainSwapLockup(fetchedSwap, approval),
      });
    };

    this.utxoNursery.on(
      'chainSwap.lockup',
      async ({ swap, transaction, confirmed }) => {
        await handleIncomingChainSwapLockup(swap, transaction, confirmed);
      },
    );

    this.arkNursery.on(
      'chainSwap.lockup',
      async ({ swap, lockupTransactionId }) => {
        await handleIncomingChainSwapLockup(swap, lockupTransactionId, true);
      },
    );

    this.utxoNursery.on('chainSwap.lockup.failed', async ({ swap, reason }) => {
      await this.lock.acquire(
        SwapNursery.chainSwapLock,
        'chainSwap.lockup.failed',
        async () => {
          await this.lockupFailed(swap, reason);
        },
      );
    });

    this.arkNursery.on('chainSwap.lockup.failed', async ({ swap, reason }) => {
      await this.lock.acquire(
        SwapNursery.chainSwapLock,
        'chainSwap.lockup.failed',
        async () => {
          await this.lockupFailed(swap, reason);
        },
      );
    });

    const handleChainSwapClaim = async (
      swap: ChainSwapInfo,
      preimage: Buffer,
    ) => {
      await this.lock.acquire(
        SwapNursery.chainSwapLock,
        'chainSwap.claimed',
        async () => {
          await this.attemptSettleSwap(
            this.currencies.get(swap.receivingData.symbol)!,
            swap,
            preimage,
          );
          await this.chainSwapSigner.removeFromClaimable(swap.id);
        },
      );
    };

    this.utxoNursery.on('chainSwap.claimed', async ({ swap, preimage }) => {
      await handleChainSwapClaim(swap, preimage);
    });

    this.arkNursery.on('chainSwap.claimed', async ({ swap, preimage }) => {
      await handleChainSwapClaim(swap, preimage);
    });

    this.utxoNursery.on('chainSwap.expired', async (chainSwap) => {
      await this.lock.acquire(
        SwapNursery.chainSwapLock,
        'chainSwap.expired',
        async () => {
          await this.expireChainSwap(chainSwap);
        },
      );
    });

    this.arkNursery.on('chainSwap.expired', async (chainSwap) => {
      await this.lock.acquire(
        SwapNursery.chainSwapLock,
        'chainSwap.expired',
        async () => {
          await this.expireChainSwap(chainSwap);
        },
      );
    });

    this.refundWatcher.on('refund.confirmed', async (args) => {
      const refundTransaction = racePromise(
        this.getRefundTransactionForUpdate(args.swap, args.refundTransaction),
        (_reject, resolve) => {
          this.logger.warn(
            `Timeout while getting refund transaction of ${swapTypeToPrettyString(args.swap.type)} Swap ${args.swap.id}: ${args.refundTransaction}`,
          );
          resolve(args.refundTransaction);
        },
        SwapNursery.refundTransactionUpdateTimeout,
      );

      const { swap } = args;
      this.emit('refund', {
        swap,
        confirmed: true,
        emitFailure: false,
        refundTransaction: await refundTransaction,
      });

      if (swap.type !== SwapType.ReverseSubmarine) {
        return;
      }

      await this.lock.acquire(
        SwapNursery.reverseSwapLock,
        'refund.confirmed',
        async () => {
          const lightningCurrency = this.currencies.get(
            (swap as ReverseSwap).lightningCurrency,
          );
          const resolved = NodeSwitch.tryResolveReverseSwapNode(
            lightningCurrency!,
            swap as ReverseSwap,
          );
          if (resolved.status !== ReverseSwapNodeResolutionStatus.Resolved) {
            this.logger.warn(
              `Skipping refund cleanup of Reverse Swap ${swap.id}: ${resolved.reason}`,
            );
            return;
          }
          const lightningClient = resolved.lightningClient;

          try {
            await LightningNursery.cancelReverseInvoices(
              lightningClient,
              swap as ReverseSwap,
              true,
            );
          } catch (e) {
            this.logger.debug(
              `Could not cancel invoices of Reverse Swap ${
                swap.id
              } because: ${formatError(e)}`,
            );
          }
        },
      );
    });

    this.arkNursery.init(currencies);
    this.utxoNursery.bindCurrency(currencies);
    this.lightningNursery.bindCurrencies(currencies);

    await this.invoiceNursery.init();

    if (this.retryInterval !== 0) {
      setInterval(async () => {
        // Skip this iteration if the last one is still running
        if (this.lock.isBusy(SwapNursery.retryLock)) {
          return;
        }

        this.logger.silly('Retrying settling Swaps with pending invoices');

        await this.lock.acquire(SwapNursery.retryLock, 'retry', async () => {
          await this.lock.acquire(SwapNursery.swapLock, 'retry', async () => {
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

          await this.retryHeldSendApprovals();
        });
      }, this.retryInterval * 1000);
    }
  };

  public attemptSettleSwap = async (
    currency: Currency,
    swap: Swap | ChainSwapInfo,
    preimage?: Buffer,
  ): Promise<void> => {
    let payRes: PaidSwapInvoice | undefined;

    if (swap.type === SwapType.Submarine) {
      payRes = await this.payInvoice(swap as Swap);
    } else {
      payRes = { preimage: preimage! };
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
            swap,
            manager.provider,
            contracts.etherSwap,
            txToClaim!,
            true,
          ),
          payRes.preimage,
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
            swap,
            manager.provider,
            contracts.erc20Swap,
            txToClaim!,
            true,
          ),
          payRes.preimage,
        );
        break;
      }

      case CurrencyType.Ark: {
        await this.claimVtxo(swap, currency.arkNode!, payRes.preimage);
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

    try {
      const { lightningClient } = NodeSwitch.requireReverseSwapNode(
        this.currencies.get(lightningCurrency)!,
        reverseSwap,
      );
      const submarine = await SwapRepository.getSwap({
        preimageHash: reverseSwap.preimageHash,
        status: {
          [Op.in]: [
            SwapUpdateEvent.InvoicePending,
            SwapUpdateEvent.InvoicePaid,
            SwapUpdateEvent.TransactionClaimPending,
            SwapUpdateEvent.TransactionClaimed,
          ],
        },
      });

      if (
        submarine !== null &&
        submarine !== undefined &&
        submarine.invoice === reverseSwap.invoice
      ) {
        try {
          await LightningNursery.cancelReverseInvoices(
            lightningClient,
            reverseSwap,
            true,
          );
        } catch (e) {
          this.logger.debug(
            `Could not cancel invoice of Reverse Swap ${
              reverseSwap.id
            } because: ${formatError(e)}`,
          );
        }
      } else {
        await lightningClient.raceCall(
          lightningClient.settleHoldInvoice(preimage),
          (reject) => {
            reject('invoice settlement timed out');
          },
          LightningNursery.lightningClientCallTimeout,
        );
      }

      this.logger.info(`Settled Reverse Swap ${reverseSwap.id}`);

      this.emit(
        'invoice.settled',
        await ReverseSwapRepository.setInvoiceSettled(
          reverseSwap,
          getHexString(preimage),
        ),
      );
    } catch (e) {
      const message = `Could not settle invoice of ${reverseSwap.id} on node ${reverseSwap.nodeId}: ${formatError(e)}`;
      this.logger.error(message);
      await this.notifications?.sendMessage(message, true);
    }
  };

  private refundSwap = async (
    chainCurrency: Currency,
    swap: ReverseSwap | ChainSwapInfo,
    fee?: number,
  ) => {
    // TODO: fee parameter for ether and erc20s
    switch (chainCurrency.type) {
      case CurrencyType.BitcoinLike:
      case CurrencyType.Liquid:
        await this.refundUtxo(chainCurrency, swap, fee);
        break;

      case CurrencyType.Ark:
        await this.refundVtxo(chainCurrency, swap);
        break;

      case CurrencyType.Ether:
        await this.refundEther(swap, chainCurrency.symbol);
        break;

      case CurrencyType.ERC20:
        await this.refundERC20(swap, chainCurrency.symbol);
        break;
    }
  };

  private handleChainSwapLockup = async (
    swap: ChainSwapInfo,
    approval: SendApprovalAction,
  ) => {
    const sendingCurrency = this.currencies.get(swap.sendingData.symbol)!;
    const wallet = this.walletManager.wallets.get(swap.sendingData.symbol)!;

    switch (sendingCurrency.type) {
      case CurrencyType.BitcoinLike:
      case CurrencyType.Liquid:
        await this.lockupUtxo(
          swap,
          sendingCurrency.chainClient!,
          wallet,
          approval,
        );
        break;

      case CurrencyType.Ether:
        await this.lockupEther(swap, wallet, approval);
        break;

      case CurrencyType.ERC20:
        await this.lockupERC20(swap, wallet, approval);
        break;

      case CurrencyType.Ark:
        await this.lockupVtxo(swap, wallet, approval);
        break;
    }
  };

  private getRefundTransactionForUpdate = async (
    swap: ReverseSwap | ChainSwapInfo,
    refundTransactionId: string,
  ): Promise<Transaction | LiquidTransaction | string> => {
    const refundCurrency = this.currencies.get(swap.refundCurrency);
    if (refundCurrency === undefined) {
      return refundTransactionId;
    }

    switch (refundCurrency.type) {
      case CurrencyType.BitcoinLike:
      case CurrencyType.Liquid:
        try {
          return parseTransaction(
            refundCurrency.type,
            await refundCurrency.chainClient!.getRawTransaction(
              refundTransactionId,
            ),
          );
        } catch (error) {
          this.logger.warn(
            `Could not fetch refund transaction ${refundTransactionId} of ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}: ${formatError(error)}`,
          );
          return refundTransactionId;
        }

      default:
        return refundTransactionId;
    }
  };

  private getChainSwapForLockup = async (
    swap: ChainSwapInfo,
  ): Promise<ChainSwapInfo | undefined> => {
    const fetchedSwap = await ChainSwapRepository.getChainSwap({
      id: swap.id,
    });
    if (fetchedSwap === null) {
      return undefined;
    }

    if (FinalChainSwapEvents.includes(fetchedSwap.status as SwapUpdateEvent)) {
      this.logger.warn(
        `Prevented ${swapTypeToPrettyString(fetchedSwap.type)} Swap ${fetchedSwap.id} from sending a lockup transaction because it has final status ${fetchedSwap.status}`,
      );
      return undefined;
    }

    if (
      !SwapNursery.actionableChainSwapLockupStatuses.includes(
        fetchedSwap.status as SwapUpdateEvent,
      )
    ) {
      this.logger.warn(
        `Prevented ${swapTypeToPrettyString(fetchedSwap.type)} Swap ${fetchedSwap.id} from sending a lockup transaction because it has non-actionable status ${fetchedSwap.status}`,
      );
      return undefined;
    }

    if (fetchedSwap.createdRefundSignature) {
      this.logger.warn(
        `Prevented ${swapTypeToPrettyString(fetchedSwap.type)} Swap ${fetchedSwap.id} from sending a lockup transaction because it already signed a refund`,
      );
      return undefined;
    }

    if (
      fetchedSwap.sendingData.transactionId !== null &&
      fetchedSwap.sendingData.transactionId !== undefined
    ) {
      this.logger.warn(
        `Prevented ${swapTypeToPrettyString(fetchedSwap.type)} Swap ${fetchedSwap.id} from sending a second lockup transaction`,
      );
      return undefined;
    }

    return fetchedSwap;
  };

  private listenEthereumNursery = async (ethereumNursery: EthereumNursery) => {
    // Swap events
    ethereumNursery.on('swap.expired', async ({ swap }) => {
      await this.lock.acquire(
        SwapNursery.swapLock,
        'swap.expired',
        async () => {
          await this.expireSwap(swap);
        },
      );
    });

    ethereumNursery.on('lockup.failed', async ({ swap, reason }) => {
      await this.lock.acquire(
        SwapNursery.lockForSwapType(swap.type),
        'lockup.failed',
        async () => {
          await this.lockupFailed(swap, reason);
        },
      );
    });

    const handleLockup = async (
      swap: Swap | ChainSwapInfo,
      transactionHash: string,
    ) => {
      if (swap.type === SwapType.Chain) {
        await this.withSendApproval<ChainSwapInfo>({
          id: swap.id,
          symbolFor: (fetchedSwap) => fetchedSwap.sendingData.symbol,
          lock: SwapNursery.chainSwapLock,
          lockReason: 'lockup',
          loadEligible: () => this.getChainSwapForLockup(swap as ChainSwapInfo),
          emitTransaction: { confirmed: true, transaction: transactionHash },
          proceed: (fetchedSwap, approval) =>
            this.handleChainSwapLockup(fetchedSwap, approval),
        });
        return;
      }

      await this.lock.acquire(SwapNursery.swapLock, 'lockup', async () => {
        const updatedSwap = await SwapRepository.getSwap({ id: swap.id });
        if (updatedSwap === null || updatedSwap === undefined) {
          return;
        }

        if (updatedSwap.status === SwapUpdateEvent.TransactionLockupFailed) {
          this.logger.warn(
            `Lockup already failed for ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}: ${transactionHash}`,
          );
          return;
        }

        this.emit('transaction', {
          swap: updatedSwap,
          confirmed: true,
          transaction: transactionHash,
        });

        if (updatedSwap.invoice) {
          const { base, quote } = splitPairId(updatedSwap.pair);

          if (updatedSwap.createdRefundSignature) {
            this.logger.warn(
              `Prevented ${swapTypeToPrettyString(swap.type)} Swap ${swap.id} from paying an invoice because it already signed a refund`,
            );
            return;
          }

          await this.attemptSettleSwap(
            this.currencies.get(
              getChainCurrency(base, quote, updatedSwap.orderSide, false),
            )!,
            updatedSwap,
          );
        } else {
          await this.setSwapRate(updatedSwap);
        }
      });
    };

    ethereumNursery.on('eth.lockup', async ({ swap, transactionHash }) => {
      await handleLockup(swap, transactionHash);
    });

    ethereumNursery.on('erc20.lockup', async ({ swap, transactionHash }) => {
      await handleLockup(swap, transactionHash);
    });

    // Reverse Swap events
    ethereumNursery.on('reverseSwap.expired', async ({ reverseSwap }) => {
      await this.lock.acquire(
        SwapNursery.reverseSwapLock,
        'reverseSwap.expired',
        async () => {
          await this.expireReverseSwap(reverseSwap);
        },
      );
    });

    ethereumNursery.on('lockup.failedToSend', async ({ swap, reason }) => {
      if (swap.type === SwapType.ReverseSubmarine) {
        await this.lock.acquire(
          SwapNursery.reverseSwapLock,
          'lockup.failedToSend',
          async () => {
            const { base, quote } = splitPairId(swap.pair);
            const chainSymbol = getChainCurrency(
              base,
              quote,
              swap.orderSide,
              true,
            );
            await this.handleSwapSendFailed(
              swap,
              chainSymbol,
              reason,
              (() => {
                const { base, quote } = splitPairId(swap.pair);
                const lightningSymbol = getLightningCurrency(
                  base,
                  quote,
                  swap.orderSide,
                  true,
                );
                const resolved = NodeSwitch.tryResolveReverseSwapNode(
                  this.currencies.get(lightningSymbol)!,
                  swap as ReverseSwap,
                );
                if (
                  resolved.status !== ReverseSwapNodeResolutionStatus.Resolved
                ) {
                  this.logger.warn(
                    `Skipping failed lockup cleanup of Reverse Swap ${swap.id}: ${resolved.reason}`,
                  );
                  return undefined;
                }

                return resolved.lightningClient;
              })(),
            );
          },
        );
      } else {
        await this.lock.acquire(
          SwapNursery.chainSwapLock,
          'lockup.failedToSend',
          async () => {
            await this.handleSwapSendFailed(
              swap,
              (swap as ChainSwapInfo).sendingData.symbol,
              reason,
            );
          },
        );
      }
    });

    ethereumNursery.on(
      'lockup.confirmed',
      async ({ swap, transactionHash }) => {
        await this.lock.acquire(
          SwapNursery.lockForSwapType(swap.type),
          'lockup.confirmed',
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
        SwapNursery.lockForSwapType(swap.type),
        'claim',
        async () => {
          if (swap.type === SwapType.ReverseSubmarine) {
            await this.settleReverseSwapInvoice(swap as ReverseSwap, preimage);
          } else {
            const chainSwap = swap as ChainSwapInfo;
            await this.attemptSettleSwap(
              this.currencies.get(chainSwap.receivingData.symbol)!,
              chainSwap,
              preimage,
            );
          }
        },
      );
    });

    ethereumNursery.on('chainSwap.expired', async ({ chainSwap }) => {
      await this.lock.acquire(
        SwapNursery.chainSwapLock,
        'chainSwap.expired',
        async () => {
          await this.expireChainSwap(chainSwap);
        },
      );
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

  private assertLockupSignerEnabled = (swap: ReverseSwap | ChainSwapInfo) => {
    const signer =
      swap.type === SwapType.ReverseSubmarine
        ? Signer.SIGNER_REVERSE_LOCKUP
        : Signer.SIGNER_CHAIN_LOCKUP;

    if (SignerControlRegistry.getInstance().isDisabled(signer)) {
      throw new Error(
        `${disabledSignerMessage(signer)} for ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}`,
      );
    }
  };

  private lockupAmount = (swap: ReverseSwap | ChainSwapInfo): number =>
    swap.type === SwapType.ReverseSubmarine
      ? (swap as ReverseSwap).onchainAmount
      : (swap as ChainSwapInfo).sendingData.expectedAmount;

  private readonly pendingSendApprovals = new Map<
    string,
    Promise<SendApprovalAction>
  >();

  private resolveSendApproval = (
    swap: ReverseSwap | ChainSwapInfo,
    symbol: string,
  ): Promise<SendApprovalAction> => {
    const existing = this.pendingSendApprovals.get(swap.id);
    if (existing !== undefined) {
      return existing;
    }

    const approval = resolveSendApprovalDecision(
      this.sendApprovalHook,
      swap.id,
      swap.pair,
      symbol,
      this.lockupAmount(swap),
    );
    approval.catch(() => this.pendingSendApprovals.delete(swap.id));

    this.pendingSendApprovals.set(swap.id, approval);
    return approval;
  };

  private assertSendApproved = (action: SendApprovalAction) => {
    if (action !== SendApprovalAction.Accept) {
      throw new Error(Errors.HOOK_REJECTED().message);
    }
  };

  private handleSendApproval = async (
    swap: ReverseSwap | ChainSwapInfo,
    approval: SendApprovalAction,
  ): Promise<boolean> => {
    const mayProceed = await persistSendApprovalDecision(
      swap.id,
      swap.type,
      approval,
    );
    this.pendingSendApprovals.delete(swap.id);
    if (!mayProceed) {
      this.logger.verbose(
        `Holding lockup of ${swapTypeToPrettyString(swap.type)} Swap ${swap.id} per send approval hook`,
      );
    }

    return mayProceed;
  };

  private loadEligibleReverseSwap = async (
    id: string,
  ): Promise<ReverseSwap | undefined> => {
    const reverseSwap = await ReverseSwapRepository.getReverseSwap({ id });
    if (reverseSwap === null || reverseSwap === undefined) {
      this.logger.warn(`Could not find Reverse Swap with id: ${id}`);
      return undefined;
    }

    if (
      ![SwapUpdateEvent.SwapCreated, SwapUpdateEvent.MinerFeePaid].includes(
        reverseSwap.status as SwapUpdateEvent,
      )
    ) {
      return undefined;
    }

    return reverseSwap;
  };

  // Shared skeleton for every outgoing send: load the eligible swap, resolve the
  // approval outside the lock, then re-load inside the lock before emitting,
  // persisting the decision and proceeding. A swap that is no longer eligible
  // drops any held row (at either the outer or inner check)
  private withSendApproval = async <T extends ReverseSwap | ChainSwapInfo>({
    id,
    symbolFor,
    lock,
    lockReason,
    loadEligible,
    emitTransaction,
    proceed,
  }: {
    id: string;
    symbolFor: (swap: T) => string;
    lock: string;
    lockReason: string;
    loadEligible: () => Promise<T | undefined>;
    emitTransaction?: {
      transaction: Transaction | LiquidTransaction | string;
      confirmed: boolean;
    };
    proceed: (swap: T, approval: SendApprovalAction) => Promise<void>;
  }) => {
    const eligible = await loadEligible();
    if (eligible === undefined) {
      await SendApprovalHoldRepository.remove(id);
      return;
    }

    const approval = await this.resolveSendApproval(
      eligible,
      symbolFor(eligible),
    );

    try {
      await this.lock.acquire(lock, lockReason, async () => {
        const fresh = await loadEligible();
        if (fresh === undefined) {
          await SendApprovalHoldRepository.remove(id);
          return;
        }

        if (emitTransaction !== undefined) {
          this.emit('transaction', { ...emitTransaction, swap: fresh });
        }

        if (!(await this.handleSendApproval(fresh, approval))) {
          return;
        }

        await proceed(fresh, approval);
      });
    } finally {
      this.pendingSendApprovals.delete(id);
    }
  };

  private retryHeldSendApprovals = async () => {
    for (const hold of await SendApprovalHoldRepository.getAll()) {
      await this.retryHeldLockup(hold);
    }
  };

  private retryHeldLockup = async (hold: SendApprovalHold) => {
    if (hold.type === SwapType.Submarine) {
      await this.lock.acquire(SwapNursery.swapLock, 'retry', () =>
        this.pruneStaleSubmarineHolds(hold),
      );
      return;
    }

    if (hold.type === SwapType.Chain) {
      await this.withSendApproval<ChainSwapInfo>({
        id: hold.swapId,
        symbolFor: (swap) => swap.sendingData.symbol,
        lock: SwapNursery.chainSwapLock,
        lockReason: 'retry',
        loadEligible: async () => {
          const swap = await ChainSwapRepository.getChainSwap({
            id: hold.swapId,
          });
          return swap === null ? undefined : this.getChainSwapForLockup(swap);
        },
        proceed: (swap, approval) => this.handleChainSwapLockup(swap, approval),
      });
      return;
    }

    await this.withSendApproval<ReverseSwap>({
      id: hold.swapId,
      symbolFor: (swap) => {
        const { base, quote } = splitPairId(swap.pair);
        return getChainCurrency(base, quote, swap.orderSide, true);
      },
      lock: SwapNursery.reverseSwapLock,
      lockReason: 'retry',
      loadEligible: () => this.loadEligibleReverseSwap(hold.swapId),
      proceed: (swap, approval) => this.lockupReverseSwap(swap, approval),
    });
  };

  // Held submarine sends are re-driven by the main retry loop, which re-runs
  // payInvoice for every InvoicePending swap (payInvoice reads the hold via the
  // repository to keep holding on a non-resolution). Here we only prune the hold
  // row once the swap is gone or no longer InvoicePending; the row must persist
  // while InvoicePending so the hook fallback keeps holding
  private pruneStaleSubmarineHolds = async (hold: SendApprovalHold) => {
    const swap = await SwapRepository.getSwap({ id: hold.swapId });
    if (swap === null || swap.status !== SwapUpdateEvent.InvoicePending) {
      await SendApprovalHoldRepository.remove(hold.swapId);
    }
  };

  private lockupReverseSwap = async (
    reverseSwap: ReverseSwap,
    approval: SendApprovalAction,
  ) => {
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
    const resolved = NodeSwitch.tryResolveReverseSwapNode(
      this.currencies.get(lightningSymbol)!,
      reverseSwap,
    );
    if (resolved.status !== ReverseSwapNodeResolutionStatus.Resolved) {
      this.logger.warn(
        `Skipping lockup of Reverse Swap ${reverseSwap.id}: ${resolved.reason}`,
      );
      return;
    }
    const lightningClient = resolved.lightningClient;

    const wallet = this.walletManager.wallets.get(chainSymbol)!;

    switch (chainCurrency.type) {
      case CurrencyType.BitcoinLike:
      case CurrencyType.Liquid:
        await this.lockupUtxo(
          reverseSwap,
          chainCurrency.chainClient!,
          wallet,
          approval,
          lightningClient,
        );
        break;

      case CurrencyType.Ether:
        await this.lockupEther(reverseSwap, wallet, approval, lightningClient);
        break;

      case CurrencyType.ERC20:
        await this.lockupERC20(reverseSwap, wallet, approval, lightningClient);
        break;

      case CurrencyType.Ark:
        await this.lockupVtxo(reverseSwap, wallet, approval, lightningClient);
        break;
    }
  };

  private lockupUtxo = async (
    swap: ReverseSwap | ChainSwapInfo,
    chainClient: IChainClient,
    wallet: Wallet,
    approval: SendApprovalAction,
    lightningClient?: LightningClient,
  ) => {
    try {
      this.assertLockupSignerEnabled(swap);
      this.assertSendApproved(approval);

      const onchainAmount = this.lockupAmount(swap);

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
        feePerVbyte = await chainClient.estimateFee();
      }

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
      return;
    }

    if (swap.type === SwapType.Chain) {
      await this.chainSwapSigner.registerForClaim(swap as ChainSwapInfo);
    }
  };

  private lockupVtxo = async (
    swap: ReverseSwap | ChainSwapInfo,
    wallet: Wallet,
    approval: SendApprovalAction,
    lightningClient?: LightningClient,
  ) => {
    try {
      this.assertLockupSignerEnabled(swap);
      this.assertSendApproved(approval);

      const lockupAddress =
        swap.type === SwapType.ReverseSubmarine
          ? (swap as ReverseSwap).lockupAddress
          : (swap as ChainSwapInfo).sendingData.lockupAddress;
      const onchainAmount = this.lockupAmount(swap);

      const { transactionId, vout, fee } = await wallet.sendToAddress(
        lockupAddress,
        onchainAmount!,
        undefined,
        TransactionLabelRepository.lockupLabel(swap),
      );

      this.logger.verbose(
        `Locked up ${onchainAmount!} ${
          wallet.symbol
        } in vHTLC for ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}: ${transactionId}:${vout}`,
      );

      this.emit('coins.sent', {
        transaction: transactionId!,
        swap: await WrappedSwapRepository.setServerLockupTransaction(
          swap,
          transactionId!,
          onchainAmount!,
          fee || 0,
          vout,
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
    approval: SendApprovalAction,
    lightningClient?: LightningClient,
  ) => {
    try {
      this.assertLockupSignerEnabled(swap);
      this.assertSendApproved(approval);

      const lockupDetails =
        swap.type === SwapType.ReverseSubmarine
          ? (swap as ReverseSwap)
          : (swap as ChainSwapInfo).sendingData;

      const nursery = this.findEthereumNursery(wallet.symbol)!;
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

      const updatedSwap =
        await WrappedSwapRepository.setServerLockupTransaction(
          swap,
          contractTransaction.hash,
          lockupDetails.expectedAmount,
          calculateEthereumTransactionFee(contractTransaction),
        );

      nursery.listenContractTransaction(updatedSwap, contractTransaction);
      this.logger.verbose(
        `Locked up ${lockupDetails.expectedAmount} ${wallet.symbol} for ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}: ${contractTransaction.hash}`,
      );

      this.emit('coins.sent', {
        transaction: contractTransaction.hash,
        swap: updatedSwap,
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
    approval: SendApprovalAction,
    lightningClient?: LightningClient,
  ) => {
    try {
      this.assertLockupSignerEnabled(swap);
      this.assertSendApproved(approval);

      const lockupDetails =
        swap.type === SwapType.ReverseSubmarine
          ? (swap as ReverseSwap)
          : (swap as ChainSwapInfo).sendingData;

      const nursery = this.findEthereumNursery(wallet.symbol)!;
      const walletProvider = wallet.walletProvider as ERC20WalletProvider;
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

      const updatedSwap =
        await WrappedSwapRepository.setServerLockupTransaction(
          swap,
          contractTransaction.hash,
          lockupDetails.expectedAmount,
          calculateEthereumTransactionFee(contractTransaction),
        );

      nursery.listenContractTransaction(updatedSwap, contractTransaction);
      this.logger.verbose(
        `Locked up ${lockupDetails.expectedAmount} ${wallet.symbol} for ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}: ${contractTransaction.hash}`,
      );

      this.emit('coins.sent', {
        transaction: contractTransaction.hash,
        swap: updatedSwap,
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
  ): Promise<PaidSwapInvoice | undefined> => {
    const preimage = await this.paymentHandler.payInvoice(swap);

    if (preimage === undefined) {
      return undefined;
    }

    return {
      preimage,
    };
  };

  private claimUtxo = async (
    swap: Swap | ChainSwapInfo,
    chainClient: IChainClient,
    wallet: Wallet,
    transaction: Transaction | LiquidTransaction,
    preimage: Buffer,
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

    await chainClient.sendRawTransaction(TxView.of(claimTransaction).hex);

    this.logger.info(
      `Claimed ${wallet.symbol} of ${swapTypeToPrettyString(swap.type)} Swap ${swap.id} in: ${TxView.of(claimTransaction).id}`,
    );

    this.emit('claim', {
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

  private claimVtxo = async (
    swap: Swap | ChainSwapInfo,
    arkClient: ArkClient,
    preimage: Buffer,
  ) => {
    const txId =
      swap.type === SwapType.Submarine
        ? (swap as Swap).lockupTransactionId
        : (swap as ChainSwapInfo).receivingData.transactionId;
    const vout =
      swap.type === SwapType.Submarine
        ? (swap as Swap).lockupTransactionVout
        : (swap as ChainSwapInfo).receivingData.transactionVout;

    const claimTransaction = await arkClient.claimVHtlc(
      preimage,
      getHexBuffer(swap.theirRefundPublicKey!),
      arkClient.pubkey,
      { txId: txId!, vout: vout! },
      TransactionLabelRepository.claimLabel(swap),
    );
    this.logger.info(
      `Claimed ${arkClient.symbol} vHTLC of ${swapTypeToPrettyString(swap.type)} Swap ${swap.id} in: ${claimTransaction}`,
    );

    this.emit('claim', {
      swap:
        swap.type === SwapType.Submarine
          ? await SwapRepository.setMinerFee(swap as Swap, 0)
          : await ChainSwapRepository.setClaimMinerFee(
              swap as ChainSwapInfo,
              preimage,
              0,
            ),
    });
  };

  private claimEther = async (
    manager: EthereumManager,
    contracts: Contracts,
    swap: Swap | ChainSwapInfo,
    etherSwapValues: EtherSwapValues,
    preimage: Buffer,
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
      try {
        await LightningNursery.cancelReverseInvoices(
          lightningClient,
          swap as ReverseSwap,
          false,
        );
      } catch (e) {
        this.logger.warn(
          `Could not cancel invoices of ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}: ${formatError(e)}`,
        );
      }
    }

    const onchainAmount = this.lockupAmount(swap);

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
    if (swap.type === SwapType.Submarine) {
      const loaded = await SwapRepository.getSwap({ id: swap.id });
      if (loaded!.status === SwapUpdateEvent.InvoicePending) {
        this.logger.warn(
          `Prevented lockup race of ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}`,
        );
        return;
      }
    } else if (swap.type === SwapType.Chain) {
      const loaded = await ChainSwapRepository.getChainSwap({ id: swap.id });
      if (
        loaded!.sendingData.transactionId !== null &&
        loaded!.sendingData.transactionId !== undefined
      ) {
        this.logger.warn(
          `Prevented lockup race of ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}`,
        );
        return;
      }
    }

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

    const chainCurrency = this.currencies.get(chainSymbol)!;

    try {
      if (reverseSwap.transactionId) {
        await this.refundSwap(chainCurrency, reverseSwap);
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
        await this.refundSwap(chainCurrency, chainSwap);
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
    fee?: number,
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

    const isLiquid = chainClient.currencyType === CurrencyType.Liquid;
    const vout = sendingData.transactionVout!;
    const liquidOut = isLiquid
      ? ((lockupTransaction as LiquidTransaction).outs[vout] as LiquidTxOutput)
      : undefined;
    const lockupScript = liquidOut
      ? liquidOut.script
      : Buffer.from((lockupTransaction as Transaction).getOutput(vout).script!);
    const keys = wallet.getKeysByIndex(sendingData.keyIndex!);
    const baseDetails = {
      ...(liquidOut
        ? {
            asset: liquidOut.asset,
            value: liquidOut.value,
            nonce: liquidOut.nonce,
            rangeProof: liquidOut.rangeProof,
            surjectionProof: liquidOut.surjectionProof,
          }
        : {
            amount: (lockupTransaction as Transaction).getOutput(vout).amount!,
          }),
      vout,
      script: lockupScript,
      transactionId: TxView.of(lockupTransaction).id,
      privateKey: keys.privateKey!,
    };

    let refundDetails: RefundDetails | LiquidRefundDetails;
    switch (swap.version) {
      case SwapVersion.Taproot: {
        refundDetails = {
          ...baseDetails,
          type: OutputType.Taproot,
          cooperative: false,
          swapTree: SwapTreeSerializer.deserializeSwapTree(
            sendingData.redeemScript!,
          ) as Types.SwapTree,
          internalKey: Buffer.from(
            createMusig(keys, getHexBuffer(sendingData.theirPublicKey!))
              .aggPubkey,
          ),
        } as RefundDetails | LiquidRefundDetails;
        break;
      }

      default: {
        refundDetails = {
          ...baseDetails,
          type: LegacyReverseSwapOutputType,
          redeemScript: getHexBuffer((swap as ReverseSwap).redeemScript!),
        } as RefundDetails | LiquidRefundDetails;
        break;
      }
    }

    const refundTransaction = constructRefundTransaction(
      wallet,
      [refundDetails] as RefundDetails[] | LiquidRefundDetails[],
      await wallet.getAddress(TransactionLabelRepository.refundLabel(swap)),
      sendingData.timeoutBlockHeight,
      fee ?? (await chainCurrency.chainClient!.estimateFee()),
    );
    const minerFee = await calculateTransactionFee(
      chainCurrency.chainClient!,
      refundTransaction,
    );

    await RefundTransactionRepository.addTransaction({
      swapId: swap.id,
      symbol: chainCurrency.symbol,
      id: TxView.of(refundTransaction).id,
      vin: 0,
    });

    await chainClient.sendRawTransaction(TxView.of(refundTransaction).hex);

    this.logger.info(
      `Broadcast ${chainClient.symbol} refund of ${swapTypeToPrettyString(swap.type)} Swap ${
        swap.id
      } in: ${TxView.of(refundTransaction).id}`,
    );

    this.emit('refund', {
      confirmed: false,
      emitFailure: true,
      refundTransaction,
      swap: await WrappedSwapRepository.setTransactionRefunded(
        swap,
        minerFee,
        Errors.REFUNDED_COINS(sendingData.transactionId!).message,
      ),
    });
  };

  private refundVtxo = async (
    chainCurrency: Currency,
    swap: ReverseSwap | ChainSwapInfo,
  ) => {
    const arkClient = chainCurrency.arkNode;
    if (arkClient === undefined) {
      this.logger.error(`Ark node not found for ${chainCurrency.symbol}`);
      return;
    }

    const outpointTxId =
      swap.type === SwapType.ReverseSubmarine
        ? (swap as ReverseSwap).transactionId
        : (swap as ChainSwapInfo).sendingData.transactionId;
    const outpointVout =
      swap.type === SwapType.ReverseSubmarine
        ? (swap as ReverseSwap).transactionVout
        : (swap as ChainSwapInfo).sendingData.transactionVout;

    const txId = await arkClient.refundVHtlc(
      getHexBuffer(swap.preimageHash),
      arkClient.pubkey,
      getHexBuffer(
        swap.type === SwapType.ReverseSubmarine
          ? (swap as ReverseSwap).claimPublicKey!
          : (swap as ChainSwapInfo).sendingData.theirPublicKey!,
      ),
      { txId: outpointTxId!, vout: outpointVout! },
      TransactionLabelRepository.refundLabel(swap),
    );

    this.logger.info(
      `Refunded ${chainCurrency.symbol} of ${swapTypeToPrettyString(swap.type)} Swap ${
        swap.id
      } in: ${txId}`,
    );

    await RefundTransactionRepository.addTransaction({
      swapId: swap.id,
      symbol: chainCurrency.symbol,
      id: txId,
      vin: null,
      status: RefundStatus.Confirmed,
    });

    this.emit('refund', {
      confirmed: true,
      emitFailure: true,
      refundTransaction: txId,
      swap: await WrappedSwapRepository.setTransactionRefunded(
        swap,
        0,
        Errors.REFUNDED_COINS(txId).message,
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
      swap,
      nursery.ethereumManager!.provider,
      contracts.etherSwap,
      lockupTransactionId!,
      false,
    );
    const contractTransaction = await contracts.contractHandler.refundEther(
      swap,
      getHexBuffer(swap.preimageHash),
      etherSwapValues.amount,
      etherSwapValues.claimAddress,
      etherSwapValues.timelock,
    );

    this.logger.info(
      `Broadcast ${nursery.ethereumManager.networkDetails.name} refund of ${swapTypeToPrettyString(swap.type)} Swap ${swap.id} in: ${contractTransaction.hash}`,
    );

    await RefundTransactionRepository.addTransaction({
      swapId: swap.id,
      symbol: chainSymbol,
      id: contractTransaction.hash,
      vin: null,
    });

    this.emit('refund', {
      confirmed: false,
      emitFailure: true,
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
      swap,
      nursery.ethereumManager.provider,
      contracts.erc20Swap,
      lockupTransactionId!,
      false,
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
      `Broadcast ${chainSymbol} refund of ${swapTypeToPrettyString(swap.type)} Swap ${swap.id} in: ${contractTransaction.hash}`,
    );

    await RefundTransactionRepository.addTransaction({
      swapId: swap.id,
      symbol: chainSymbol,
      id: contractTransaction.hash,
      vin: null,
    });

    this.emit('refund', {
      confirmed: false,
      emitFailure: true,
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
