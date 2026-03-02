import type Logger from '../../Logger';
import type NotificationClient from '../../notifications/NotificationClient';
import * as boltzrpc from '../../proto/boltzrpc_pb';
import type DecodedInvoice from '../../sidecar/DecodedInvoice';
import Hook from './Hook';

type HookResult = {
  nodeId?: string;
  timePreference?: number;
};

class InvoicePaymentHook extends Hook<
  HookResult | undefined,
  boltzrpc.InvoicePaymentHookRequest,
  boltzrpc.InvoicePaymentHookResponse
> {
  constructor(logger: Logger, notificationClient?: NotificationClient) {
    super(logger, 'invoice payment', {}, {}, 60_000, notificationClient);
  }

  public hook = async (
    swapId: string,
    invoice: string,
    decoded: DecodedInvoice,
  ): Promise<HookResult | undefined> => {
    if (!this.isConnected()) {
      return undefined;
    }

    const msg = new boltzrpc.InvoicePaymentHookRequest();
    msg.setId(swapId);
    msg.setInvoice(invoice);
    msg.setDecoded(decoded.rawRes);

    const res = await this.sendHook(swapId, msg);
    this.logHookResult(swapId, res);

    return res;
  };

  private logHookResult = (swapId: string, res?: HookResult) => {
    if (res === undefined) {
      this.logger.debug(
        `Invoice payment hook for ${swapId} returned no response`,
      );
      return;
    }

    const preferences: string[] = [];

    if (res.nodeId !== undefined) {
      preferences.push(`node: ${res.nodeId}`);
    }

    if (res.timePreference !== undefined) {
      preferences.push(`time preference: ${res.timePreference}`);
    }

    const info =
      preferences.length > 0 ? preferences.join(', ') : 'no preferences';
    this.logger.debug(`Invoice payment hook for ${swapId} returned ${info}`);
  };

  protected parseGrpcAction = (
    res: boltzrpc.InvoicePaymentHookResponse,
  ): HookResult | undefined => {
    const nodeId = res.getNodePubkey() || undefined;

    if (res.hasTimePreference()) {
      const timePreference = res.getTimePreference();
      if (
        timePreference === undefined ||
        timePreference < -1 ||
        timePreference > 1
      ) {
        this.logger.warn(
          `Invoice payment hook for ${res.getId()} returned invalid time preference ${timePreference}`,
        );
        return undefined;
      }

      return {
        nodeId,
        timePreference,
      };
    }

    return { nodeId };
  };
}

export default InvoicePaymentHook;
