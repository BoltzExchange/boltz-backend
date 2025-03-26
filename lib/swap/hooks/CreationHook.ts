import Logger from '../../Logger';
import { SwapType } from '../../consts/Enums';
import NotificationClient from '../../notifications/NotificationClient';
import * as boltzrpc from '../../proto/boltzrpc_pb';
import Hook from './Hook';

type RequestParamsBase = {
  id: string;
  symbolSending: string;
  symbolReceiving: string;
  referral?: string;
};

type RequestParamsSubmarine = RequestParamsBase & {
  invoiceAmount: number;
};

type RequestParamsReverse = RequestParamsBase & {
  invoiceAmount: number;
};

type RequestParamsChain = RequestParamsBase & {
  userLockAmount: number;
};

type RequestParams =
  | RequestParamsSubmarine
  | RequestParamsReverse
  | RequestParamsChain;

class CreationHook extends Hook<
  boltzrpc.SwapCreation,
  boltzrpc.SwapCreationResponse
> {
  constructor(logger: Logger, notificationClient?: NotificationClient) {
    super(logger, 'swap creation', true, 2_500, notificationClient);
  }

  public hook = (type: SwapType, params: RequestParams): Promise<boolean> => {
    const msg = new boltzrpc.SwapCreation();
    msg.setId(params.id);
    msg.setSymbolSending(params.symbolSending);
    msg.setSymbolReceiving(params.symbolReceiving);

    if (params.referral !== undefined) {
      msg.setReferral(params.referral);
    }

    switch (type) {
      case SwapType.Submarine: {
        const submarine = new boltzrpc.SwapCreation.Submarine();
        submarine.setInvoiceAmount(
          (params as RequestParamsSubmarine).invoiceAmount,
        );
        msg.setSubmarine(submarine);
        break;
      }

      case SwapType.ReverseSubmarine: {
        const reverse = new boltzrpc.SwapCreation.Reverse();
        reverse.setInvoiceAmount(
          (params as RequestParamsReverse).invoiceAmount,
        );
        msg.setReverse(reverse);
        break;
      }

      case SwapType.Chain: {
        const chain = new boltzrpc.SwapCreation.Chain();
        chain.setUserLockAmount((params as RequestParamsChain).userLockAmount);
        msg.setChain(chain);
        break;
      }
    }

    return this.sendHook(params.id, msg);
  };
}

export default CreationHook;
