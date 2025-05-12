import type Logger from '../../Logger';
import { NodeType, nodeTypeToPrettyString } from '../../db/models/ReverseSwap';
import type NotificationClient from '../../notifications/NotificationClient';
import * as boltzrpc from '../../proto/boltzrpc_pb';
import type DecodedInvoice from '../../sidecar/DecodedInvoice';
import Hook, { type HookResponse } from './Hook';

class InvoicePaymentHook extends Hook<
  boltzrpc.Node,
  NodeType,
  boltzrpc.InvoicePaymentHookRequest,
  boltzrpc.InvoicePaymentHookResponse
> {
  constructor(logger: Logger, notificationClient?: NotificationClient) {
    super(
      logger,
      'invoice payment',
      NodeType.CLN,
      NodeType.CLN,
      60_000,
      notificationClient,
    );
  }

  public hook = async (
    swapId: string,
    invoice: string,
    decoded: DecodedInvoice,
  ): Promise<NodeType | undefined> => {
    if (!this.isConnected()) {
      return undefined;
    }

    const msg = new boltzrpc.InvoicePaymentHookRequest();
    msg.setId(swapId);
    msg.setInvoice(invoice);
    msg.setDecoded(decoded.rawRes);

    const res = await this.sendHook(swapId, msg);

    this.logger.debug(
      `Invoice payment hook for ${swapId} returned ${nodeTypeToPrettyString(res)}`,
    );

    return res;
  };

  protected parseGrpcAction = (res: HookResponse<boltzrpc.Node>): NodeType => {
    switch (res.getAction()) {
      case boltzrpc.Node.CLN:
        return NodeType.CLN;
      case boltzrpc.Node.LND:
        return NodeType.LND;
    }
  };
}

export default InvoicePaymentHook;
