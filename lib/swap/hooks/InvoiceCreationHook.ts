import type Logger from '../../Logger';
import type NotificationClient from '../../notifications/NotificationClient';
import * as boltzrpc from '../../proto/boltzrpc_pb';
import Hook from './Hook';

type HookResult = {
  nodeId?: string;
};

class InvoiceCreationHook extends Hook<
  HookResult | undefined,
  boltzrpc.InvoiceCreationHookRequest,
  boltzrpc.InvoiceCreationHookResponse
> {
  constructor(logger: Logger, notificationClient?: NotificationClient) {
    super(
      logger,
      'invoice creation',
      undefined,
      undefined,
      2_500,
      notificationClient,
    );
  }

  public hook = async (
    swapId: string,
    invoiceAmount: number,
    referral?: string,
  ): Promise<HookResult | undefined> => {
    if (!this.isConnected()) {
      return undefined;
    }

    const msg = new boltzrpc.InvoiceCreationHookRequest();
    msg.setId(swapId);
    msg.setInvoiceAmount(invoiceAmount);

    if (referral !== undefined) {
      msg.setReferral(referral);
    }

    return this.sendHook(swapId, msg);
  };

  protected parseGrpcAction = (
    res: boltzrpc.InvoiceCreationHookResponse,
  ): HookResult | undefined => {
    const nodeId = res.getNodePubkey()?.trim();

    if (nodeId === undefined || nodeId === '') {
      return undefined;
    }

    return { nodeId };
  };
}

export default InvoiceCreationHook;
