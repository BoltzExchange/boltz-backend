import type Logger from '../../Logger';
import type NotificationClient from '../../notifications/NotificationClient';
import * as boltzrpc from '../../proto/boltzrpc_pb';
import Hook, { Action } from './Hook';

class TransactionHook extends Hook<
  boltzrpc.TransactionHookRequest,
  boltzrpc.TransactionHookResponse
> {
  constructor(logger: Logger, notificationClient?: NotificationClient) {
    super(logger, 'transaction', Action.Hold, 60_000, notificationClient);
  }

  public hook = (
    symbol: string,
    id: string,
    tx: Buffer,
    confirmed: boolean,
    vout?: number,
  ): Promise<Action> => {
    const msg = new boltzrpc.TransactionHookRequest();
    msg.setSymbol(symbol);
    msg.setId(id);
    msg.setTx(tx);
    msg.setConfirmed(confirmed);
    if (vout !== undefined) {
      msg.setVout(vout);
    }

    return this.sendHook(id, msg);
  };
}

export default TransactionHook;
