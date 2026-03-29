import type Logger from '../../Logger';
import { toOptionalProtoInt } from '../../Utils';
import { type SwapType, swapTypeToGrpcSwapType } from '../../consts/Enums';
import type NotificationClient from '../../notifications/NotificationClient';
import type * as boltzrpc from '../../proto/boltzrpc';
import { Action, parseGrpcAction } from './CreationHook';
import Hook from './Hook';

class TransactionHook extends Hook<
  Action,
  boltzrpc.TransactionHookRequest,
  boltzrpc.TransactionHookResponse
> {
  constructor(logger: Logger, notificationClient?: NotificationClient) {
    super(
      logger,
      'transaction',
      Action.Hold,
      Action.Accept,
      60_000,
      notificationClient,
    );
  }

  public hook = (
    swapId: string,
    symbol: string,
    txId: string,
    tx: Buffer,
    confirmed: boolean,
    swapType: SwapType,
    vout?: number,
  ): Promise<Action> => {
    const msg: boltzrpc.TransactionHookRequest = {
      id: swapId,
      swapType: swapTypeToGrpcSwapType(swapType),
      symbol,
      tx,
      txId,
      confirmed,
      vout: toOptionalProtoInt(vout),
    };

    return this.sendHook(swapId, msg);
  };

  protected parseGrpcAction = (res: boltzrpc.TransactionHookResponse): Action =>
    parseGrpcAction(this.logger, this.name, res.id, res.action);
}

export default TransactionHook;
