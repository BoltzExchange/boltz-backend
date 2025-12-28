import AsyncLock from 'async-lock';
import BaseClient from '../BaseClient';
import type Logger from '../Logger';
import { racePromise } from '../PromiseUtils';
import {
  formatError,
  getHexBuffer,
  getHexString,
  getLightningCurrency,
  splitPairId,
} from '../Utils';
import {
  ClientStatus,
  SwapUpdateEvent,
  swapTypeToPrettyString,
} from '../consts/Enums';
import type LightningPayment from '../db/models/LightningPayment';
import type ReverseSwap from '../db/models/ReverseSwap';
import { NodeType } from '../db/models/ReverseSwap';
import type Swap from '../db/models/Swap';
import RefundTransactionRepository from '../db/repositories/RefundTransactionRepository';
import ReverseSwapRepository from '../db/repositories/ReverseSwapRepository';
import SwapRepository from '../db/repositories/SwapRepository';
import type DecodedInvoiceSidecar from '../sidecar/DecodedInvoice';
import LightningNursery from '../swap/LightningNursery';
import NodeSwitch from '../swap/NodeSwitch';
import type SwapNursery from '../swap/SwapNursery';
import { type WalletBalance } from '../wallet/providers/WalletProviderInterface';
import { satToMsat } from './ChannelUtils';
import {
  type ChannelInfo,
  type DecodedInvoice,
  type EventTypes,
  type Htlc,
  HtlcState,
  type Invoice,
  InvoiceState,
  type LightningClient,
  type NodeInfo,
  type PaymentResponse,
  type Route,
} from './LightningClient';
import PendingPaymentTracker from './PendingPaymentTracker';

class SelfPaymentClient
  extends BaseClient<EventTypes>
  implements LightningClient
{
  private static readonly selfPaymentLock = 'self-payment';
  private static readonly notImplementedError = new Error('not implemented');

  private readonly lock = new AsyncLock();

  public type: NodeType = NodeType.SelfPayment;

  constructor(
    logger: Logger,
    private readonly swapNursery: SwapNursery,
  ) {
    super(logger, 'SelfPayment');
    this.setClientStatus(ClientStatus.Connected);
  }

  public serviceName = (): string => {
    return 'SelfPayment';
  };

  public handleSelfPayment = async (
    swap: Swap,
    decoded: DecodedInvoiceSidecar,
    cltvLimit: number,
    payments: LightningPayment[],
  ): Promise<{
    isSelf: boolean;
    result: PaymentResponse | undefined;
  }> => {
    // If there have been payment attempts from a lightning node, we don't treat it as self payment
    if (payments.length > 0) {
      return {
        isSelf: false,
        result: undefined,
      };
    }

    return await this.lock.acquire(
      SelfPaymentClient.selfPaymentLock,
      async () => {
        const reverseSwap = await this.getReverseSwap(swap.preimageHash);
        if (reverseSwap === null || reverseSwap === undefined) {
          return {
            isSelf: false,
            result: undefined,
          };
        }

        if (swap.invoice !== reverseSwap.invoice) {
          throw new Error('invoice mismatch');
        }

        this.logger.debug(
          `${swapTypeToPrettyString(swap.type)} Swap ${swap.id} with preimage hash ${swap.preimageHash} is a self payment`,
        );

        if (reverseSwap.status === SwapUpdateEvent.SwapCreated) {
          // Only check the CLTV limit on the first attempt
          if (cltvLimit <= decoded.minFinalCltv) {
            throw new Error('CLTV limit too small');
          }

          if (decoded.isExpired) {
            throw new Error('invoice expired');
          }

          this.emit('htlc.accepted', reverseSwap.invoice);

          this.logger.debug(
            `Cancelling hold invoice of Reverse Swap ${reverseSwap.id} because it is a self payment`,
          );

          // Has to be in a try catch block, else the submarine self payment will fail,
          // when the reverse swap invoice cannot be cancelled by the lightning node
          try {
            const { base, quote } = splitPairId(reverseSwap.pair);
            const receiveCurrency = getLightningCurrency(
              base,
              quote,
              reverseSwap.orderSide,
              true,
            );
            const lightningClient = NodeSwitch.getReverseSwapNode(
              this.swapNursery.currencies.get(receiveCurrency)!,
              reverseSwap,
            );

            await LightningNursery.cancelReverseInvoices(
              lightningClient,
              reverseSwap,
              false,
            );
          } catch (error) {
            this.logger.warn(
              `Could not cancel hold invoice of Reverse Swap ${reverseSwap.id} because: ${formatError(error)}`,
            );
          }

          const res = await this.waitForPreimage(reverseSwap);
          if (res === undefined) {
            this.logger.debug(
              `Self payment for ${swapTypeToPrettyString(swap.type)} Swap ${swap.id} still pending`,
            );
          }

          return {
            isSelf: true,
            result: res,
          };
        }

        return await this.getPreimage(swap, reverseSwap);
      },
    );
  };

  public lookupHoldInvoice = async (preimageHash: Buffer): Promise<Invoice> => {
    const { swap } = await this.lookupSwapsForPreimageHash(
      getHexString(preimageHash),
    );

    const getHtlcs = (state: HtlcState) => {
      return [
        {
          state,
          valueMsat: satToMsat(swap.invoiceAmount!),
        },
      ];
    };

    let state = InvoiceState.Open;
    let htlcs: Htlc[] = [];

    switch (swap.status) {
      case SwapUpdateEvent.InvoicePending:
        state = InvoiceState.Accepted;
        htlcs = getHtlcs(HtlcState.Accepted);
        break;

      case SwapUpdateEvent.InvoicePaid:
      case SwapUpdateEvent.TransactionClaimPending:
      case SwapUpdateEvent.TransactionClaimed:
        state = InvoiceState.Settled;
        htlcs = getHtlcs(HtlcState.Settled);
        break;
    }

    return {
      state,
      htlcs,
    };
  };

  public connect = (): Promise<boolean> => {
    return Promise.resolve(true);
  };

  public disconnect = (): void => {};

  public getInfo = (): Promise<NodeInfo> => {
    throw SelfPaymentClient.notImplementedError;
  };

  public listChannels = (): Promise<ChannelInfo[]> => {
    throw SelfPaymentClient.notImplementedError;
  };

  public addHoldInvoice = (): Promise<string> => {
    throw SelfPaymentClient.notImplementedError;
  };

  public settleHoldInvoice = async (): Promise<void> => {
    throw SelfPaymentClient.notImplementedError;
  };

  public cancelHoldInvoice = (): Promise<void> => {
    throw SelfPaymentClient.notImplementedError;
  };

  public subscribeSingleInvoice = (): void => {
    throw SelfPaymentClient.notImplementedError;
  };

  public decodeInvoice = (): Promise<DecodedInvoice> => {
    throw SelfPaymentClient.notImplementedError;
  };

  public sendPayment = (): Promise<PaymentResponse> => {
    throw SelfPaymentClient.notImplementedError;
  };

  public queryRoutes = (): Promise<Route[]> => {
    throw SelfPaymentClient.notImplementedError;
  };

  public getBalance = (): Promise<WalletBalance> => {
    throw SelfPaymentClient.notImplementedError;
  };

  private waitForPreimage = async (reverseSwap: ReverseSwap) => {
    let handler: ((s: ReverseSwap) => void) | undefined = undefined;

    return await racePromise(
      () => {
        return new Promise<PaymentResponse | undefined>((resolve) => {
          handler = (settledSwap: ReverseSwap) => {
            if (
              settledSwap.id === reverseSwap.id &&
              settledSwap.preimage !== null &&
              settledSwap.preimage !== undefined
            ) {
              this.swapNursery.removeListener('invoice.settled', handler!);
              resolve({
                feeMsat: 0,
                preimage: getHexBuffer(settledSwap.preimage),
              });
            }
          };

          this.swapNursery.on('invoice.settled', handler);
        });
      },
      (_, resolve) => {
        this.swapNursery.removeListener('invoice.settled', handler!);
        resolve(undefined);
      },
      PendingPaymentTracker.raceTimeout * 1_000,
    );
  };

  private getPreimage = async (swap: Swap, reverseSwap: ReverseSwap) => {
    let result: PaymentResponse | undefined = undefined;

    if (reverseSwap.preimage !== null && reverseSwap.preimage !== undefined) {
      this.logger.info(
        `Self payment for ${swapTypeToPrettyString(swap.type)} Swap ${swap.id} succeeded`,
      );

      result = {
        feeMsat: 0,
        preimage: getHexBuffer(reverseSwap.preimage),
      };
    } else if (reverseSwap.status === SwapUpdateEvent.TransactionRefunded) {
      const refundTx = await RefundTransactionRepository.getTransactionForSwap(
        reverseSwap.id,
      );
      if (refundTx !== null && refundTx !== undefined && refundTx.isFinal) {
        this.logger.debug(
          `Self payment for ${swapTypeToPrettyString(swap.type)} Swap ${swap.id} failed`,
        );
        throw new Error('incorrect payment details');
      }
    }

    return {
      result,
      isSelf: true,
    };
  };

  private lookupSwapsForPreimageHash = async (
    preimageHash: string,
  ): Promise<{
    swap: Swap;
    reverseSwap: ReverseSwap;
  }> => {
    const [swap, reverseSwap] = await Promise.all([
      SwapRepository.getSwap({
        preimageHash,
      }),
      this.getReverseSwap(preimageHash),
    ]);
    if ([swap, reverseSwap].some((s) => s === null || s === undefined)) {
      throw new Error('not a self payment');
    }

    return {
      swap: swap!,
      reverseSwap: reverseSwap!,
    };
  };

  private getReverseSwap = async (
    preimageHash: string,
  ): Promise<ReverseSwap | null> => {
    return await ReverseSwapRepository.getReverseSwap({
      preimageHash,
    });
  };
}

export default SelfPaymentClient;
