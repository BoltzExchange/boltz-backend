import type Logger from '../../Logger';
import { toProtoInt } from '../../Utils';
import type NotificationClient from '../../notifications/NotificationClient';
import * as boltzrpc from '../../proto/boltzrpc';
import Hook from './Hook';

enum SendApprovalAction {
  Accept,
  Reject,
  Hold,
}

const sendApprovalActions = {
  accept: SendApprovalAction.Accept,
  reject: SendApprovalAction.Reject,
  hold: SendApprovalAction.Hold,
} as const;

type SendApprovalDefaultAction = keyof typeof sendApprovalActions;

const parseDefaultAction = (action?: string): SendApprovalAction => {
  if (action === undefined) {
    return SendApprovalAction.Accept;
  }

  const key = action.toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(sendApprovalActions, key)) {
    throw new Error(`invalid send approval default action: ${action}`);
  }

  return sendApprovalActions[key as SendApprovalDefaultAction];
};

class SendApprovalHook extends Hook<
  SendApprovalAction,
  boltzrpc.SendApprovalHookRequest,
  boltzrpc.SendApprovalHookResponse
> {
  constructor(
    logger: Logger,
    notificationClient?: NotificationClient,
    defaultAction?: string,
  ) {
    const action = parseDefaultAction(defaultAction);
    super(logger, 'send approval', action, action, 60_000, notificationClient);
  }

  public hook = (
    swapId: string,
    pair: string,
    symbol: string,
    amount: number,
    fallback?: SendApprovalAction,
  ): Promise<SendApprovalAction> => {
    const msg: boltzrpc.SendApprovalHookRequest = {
      id: swapId,
      pair,
      symbol,
      amount: toProtoInt(amount),
    };

    return this.sendHook(swapId, msg, fallback);
  };

  protected parseGrpcAction = (
    res: boltzrpc.SendApprovalHookResponse,
  ): SendApprovalAction => {
    switch (res.action) {
      case boltzrpc.SendApprovalAction.SEND_APPROVAL_ACCEPT:
        return SendApprovalAction.Accept;
      case boltzrpc.SendApprovalAction.SEND_APPROVAL_REJECT:
        this.logger.warn(`Hook ${this.name} rejected for ${res.id}`);
        return SendApprovalAction.Reject;
      case boltzrpc.SendApprovalAction.SEND_APPROVAL_HOLD:
        return SendApprovalAction.Hold;
      default:
        throw new Error(`unknown action: ${res.action}`);
    }
  };
}

export default SendApprovalHook;
export { SendApprovalAction };
export type { SendApprovalDefaultAction };
