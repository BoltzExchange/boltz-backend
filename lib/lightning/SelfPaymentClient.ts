import AsyncLock from 'async-lock';
import BaseClient from '../BaseClient';
import type Logger from '../Logger';
import { getHexBuffer } from '../Utils';
import {
  ClientStatus,
  SwapUpdateEvent,
  swapTypeToPrettyString,
} from '../consts/Enums';
import { NodeType } from '../db/models/ReverseSwap';
import type Swap from '../db/models/Swap';
import ReverseSwapRepository from '../db/repositories/ReverseSwapRepository';
import { type WalletBalance } from '../wallet/providers/WalletProviderInterface';
import type {
  ChannelInfo,
  DecodedInvoice,
  EventTypes,
  Invoice,
  LightningClient,
  NodeInfo,
  PaymentResponse,
  Route,
} from './LightningClient';

class SelfPaymentClient
  extends BaseClient<EventTypes>
  implements LightningClient
{
  private static readonly selfPaymentLock = 'self-payment';
  private static readonly notImplementedError = new Error('not implemented');

  private readonly lock = new AsyncLock();

  // TODO: new type for it?
  public type: NodeType = NodeType.LND;
  public maxPaymentFeeRatio: number = 0;

  constructor(logger: Logger) {
    super(logger, 'SelfPayment');
    this.setClientStatus(ClientStatus.Connected);
  }

  public serviceName = (): string => {
    return 'SelfPayment';
  };

  // TODO: check CLTV limit
  public handleSelfPayment = async (
    swap: Swap,
  ): Promise<{
    isSelf: boolean;
    result: PaymentResponse | undefined;
  }> => {
    return await this.lock.acquire(
      SelfPaymentClient.selfPaymentLock,
      async () => {
        const reverseSwap = await ReverseSwapRepository.getReverseSwap({
          preimageHash: swap.preimageHash,
        });

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

  // TODO: implement
  public lookupHoldInvoice = (): Promise<Invoice> => {
    throw SelfPaymentClient.notImplementedError;
  };

  // TODO: implement
  public settleHoldInvoice = (): Promise<void> => {
    throw SelfPaymentClient.notImplementedError;
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
}

export default SelfPaymentClient;
