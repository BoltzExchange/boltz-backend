import type Logger from '../../Logger';
import { SwapType } from '../../consts/Enums';
import type NotificationClient from '../../notifications/NotificationClient';
import * as boltzrpc from '../../proto/boltzrpc_pb';
import Hook from './Hook';

const enum Action {
  Accept,
  Reject,
  Hold,
}

type RequestParamsBase = {
  id: string;
  symbolSending: string;
  symbolReceiving: string;
  referral?: string;
};

type RequestParamsSubmarine = RequestParamsBase & {
  invoiceAmount: number;
  invoice: string;
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
  Action,
  boltzrpc.SwapCreation,
  boltzrpc.SwapCreationResponse
> {
  constructor(logger: Logger, notificationClient?: NotificationClient) {
    super(
      logger,
      'swap creation',
      Action.Accept,
      Action.Accept,
      2_500,
      notificationClient,
    );
  }

  public hook = async (
    type: SwapType,
    params: RequestParams,
  ): Promise<boolean> => {
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

        submarine.setInvoice((params as RequestParamsSubmarine).invoice);

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

    return this.handleAction(await this.sendHook(params.id, msg));
  };

  protected parseGrpcAction = (res: boltzrpc.SwapCreationResponse): Action =>
    parseGrpcAction(this.logger, this.name, res.getId(), res.getAction());

  private handleAction = (action: Action) => {
    if (action === Action.Hold) {
      this.logger.warn('Hold not implemented for swap creation hook');
    }

    return action !== Action.Reject;
  };
}

const parseGrpcAction = (
  logger: Logger,
  name: string,
  id: string,
  action: boltzrpc.Action,
): Action => {
  switch (action) {
    case boltzrpc.Action.ACCEPT:
      return Action.Accept;
    case boltzrpc.Action.REJECT:
      logger.warn(`Hook ${name} rejected for ${id}`);
      return Action.Reject;
    case boltzrpc.Action.HOLD:
      return Action.Hold;
    default:
      throw new Error(`unknown action: ${action}`);
  }
};

export default CreationHook;
export { Action, parseGrpcAction };
