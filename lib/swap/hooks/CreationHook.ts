import type Logger from '../../Logger';
import { toProtoInt } from '../../Utils';
import { SwapType } from '../../consts/Enums';
import type NotificationClient from '../../notifications/NotificationClient';
import * as boltzrpc from '../../proto/boltzrpc';
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
    const msg: boltzrpc.SwapCreation = {
      id: params.id,
      symbolSending: params.symbolSending,
      symbolReceiving: params.symbolReceiving,
      referral: params.referral,
      submarine: undefined,
      reverse: undefined,
      chain: undefined,
    };

    switch (type) {
      case SwapType.Submarine: {
        msg.submarine = {
          invoiceAmount: toProtoInt(
            (params as RequestParamsSubmarine).invoiceAmount,
          ),
          invoice: (params as RequestParamsSubmarine).invoice,
        };
        break;
      }

      case SwapType.ReverseSubmarine: {
        msg.reverse = {
          invoiceAmount: toProtoInt(
            (params as RequestParamsReverse).invoiceAmount,
          ),
        };
        break;
      }

      case SwapType.Chain: {
        msg.chain = {
          userLockAmount: toProtoInt(
            (params as RequestParamsChain).userLockAmount,
          ),
        };
        break;
      }
      default: {
        const exhaustiveType: never = type;
        throw new Error(`unsupported swap type: ${exhaustiveType}`);
      }
    }

    return this.handleAction(await this.sendHook(params.id, msg));
  };

  protected parseGrpcAction = (res: boltzrpc.SwapCreationResponse): Action =>
    parseGrpcAction(this.logger, this.name, res.id, res.action);

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
