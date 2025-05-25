import type Logger from '../../Logger';
import { NodeType, nodeTypeToPrettyString } from '../../db/models/ReverseSwap';
import type NotificationClient from '../../notifications/NotificationClient';
import * as boltzrpc from '../../proto/boltzrpc_pb';
import type DecodedInvoice from '../../sidecar/DecodedInvoice';
import Hook from './Hook';

class InvoicePaymentHook extends Hook<
  boltzrpc.Node | undefined,
  NodeType | undefined,
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

    if (res !== undefined) {
      this.logger.debug(
        `Invoice payment hook for ${swapId} returned ${nodeTypeToPrettyString(res)}`,
      );
    } else {
      this.logger.debug(
        `Invoice payment hook for ${swapId} returned without preference`,
      );
    }

    return res;
  };

  protected parseGrpcAction = (
    res: boltzrpc.InvoicePaymentHookResponse,
  ): NodeType | undefined => {
    if (!res.hasAction()) {
      return undefined;
    }

    switch (res.getAction()) {
      case boltzrpc.Node.CLN:
        return NodeType.CLN;
      case boltzrpc.Node.LND:
        return NodeType.LND;
      default:
        return undefined;
    }
  };
}

export default InvoicePaymentHook;
