import AsyncLock from 'async-lock';
import crypto from 'crypto';
import BaseClient from '../BaseClient';
import type Logger from '../Logger';
import { getHexBuffer, getHexString } from '../Utils';
import {
  ClientStatus,
  SwapUpdateEvent,
  swapTypeToPrettyString,
} from '../consts/Enums';
import type ReverseSwap from '../db/models/ReverseSwap';
import { NodeType } from '../db/models/ReverseSwap';
import type Swap from '../db/models/Swap';
import ReverseSwapRepository from '../db/repositories/ReverseSwapRepository';
import SwapRepository from '../db/repositories/SwapRepository';
import type DecodedInvoiceSidecar from '../sidecar/DecodedInvoice';
import { type WalletBalance } from '../wallet/providers/WalletProviderInterface';
import {
  type ChannelInfo,
  type DecodedInvoice,
  type EventTypes,
  type Invoice,
  InvoiceState,
  type LightningClient,
  type NodeInfo,
  type PaymentResponse,
  type Route,
} from './LightningClient';

class SelfPaymentClient
  extends BaseClient<EventTypes>
  implements LightningClient
{
  private static readonly selfPaymentLock = 'self-payment';
  private static readonly notImplementedError = new Error('not implemented');

  private readonly lock = new AsyncLock();

  public type: NodeType = NodeType.SelfPayment;
  public maxPaymentFeeRatio: number = 0;

  constructor(logger: Logger) {
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
  ): Promise<{
    isSelf: boolean;
    result: PaymentResponse | undefined;
  }> => {
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

        this.logger.debug(
          `${swapTypeToPrettyString(swap.type)} Swap ${swap.id} with preimage hash ${swap.preimageHash} is a self payment`,
        );

        if (reverseSwap.status === SwapUpdateEvent.SwapCreated) {
          // Only check the CLTV limit on the first attempt
          if (cltvLimit <= decoded.minFinalCltv) {
            throw new Error('CLTV limit too small');
          }

          this.emit('htlc.accepted', reverseSwap.invoice);
        }

        let result: PaymentResponse | undefined = undefined;

        if (
          reverseSwap.preimage !== null &&
          reverseSwap.preimage !== undefined
        ) {
          this.logger.info(
            `Self payment for ${swapTypeToPrettyString(swap.type)} Swap ${swap.id} succeeded`,
          );

          result = {
            feeMsat: 0,
            preimage: getHexBuffer(reverseSwap.preimage),
          };
        }

        return {
          result,
          isSelf: true,
        };
      },
    );
  };

  public lookupHoldInvoice = async (preimageHash: Buffer): Promise<Invoice> => {
    const { swap } = await this.lookupSwapsForPreimageHash(
      getHexString(preimageHash),
    );

    let state = InvoiceState.Open;
    switch (swap.status) {
      case SwapUpdateEvent.InvoicePending:
        state = InvoiceState.Accepted;
        break;

      case SwapUpdateEvent.InvoicePaid:
      case SwapUpdateEvent.TransactionClaimPending:
      case SwapUpdateEvent.TransactionClaimed:
        state = InvoiceState.Settled;
        break;
    }

    return {
      state,
      htlcs: [],
    };
  };

  public settleHoldInvoice = async (preimage: Buffer): Promise<void> => {
    const { reverseSwap } = await this.lookupSwapsForPreimageHash(
      getHexString(crypto.createHash('sha256').update(preimage).digest()),
    );

    await ReverseSwapRepository.setInvoiceSettled(
      reverseSwap!,
      getHexString(preimage),
    );
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
