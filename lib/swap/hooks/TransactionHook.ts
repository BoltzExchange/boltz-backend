import Logger from '../../Logger';
import NotificationClient from '../../notifications/NotificationClient';
import * as boltzrpc from '../../proto/boltzrpc_pb';
import Hook from './Hook';

class TransactionHook extends Hook<
  boltzrpc.TransactionHookRequest,
  boltzrpc.TransactionHookResponse
> {
  constructor(logger: Logger, notificationClient?: NotificationClient) {
    super(logger, 'transaction', true, 20_000, notificationClient);
  }

  public hook = (symbol: string, id: string, tx: Buffer, vout?: number) => {
    const msg = new boltzrpc.TransactionHookRequest();
    msg.setSymbol(symbol);
    msg.setId(id);
    msg.setTx(tx);
    if (vout !== undefined) {
      msg.setVout(vout);
    }

    return this.sendHook(id, msg);
  };
}

export default TransactionHook;
