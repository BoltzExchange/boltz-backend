import type Logger from '../../Logger';
import { type SwapType, swapTypeToGrpcSwapType } from '../../consts/Enums';
import type NotificationClient from '../../notifications/NotificationClient';
import * as boltzrpc from '../../proto/boltzrpc_pb';
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
    const msg = new boltzrpc.TransactionHookRequest();
    msg.setId(swapId);
    msg.setSwapType(swapTypeToGrpcSwapType(swapType));
    msg.setSymbol(symbol);
    msg.setTx(tx);
    msg.setTxId(txId);
    msg.setConfirmed(confirmed);
    if (vout !== undefined) {
      msg.setVout(vout);
    }

    return this.sendHook(swapId, msg);
  };

  protected parseGrpcAction = (res: boltzrpc.TransactionHookResponse): Action =>
    parseGrpcAction(this.logger, this.name, res.getId(), res.getAction());
}

export default TransactionHook;
