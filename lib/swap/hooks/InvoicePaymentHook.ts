import type Logger from '../../Logger';
import { NodeType, nodeTypeToPrettyString } from '../../db/models/ReverseSwap';
import type NotificationClient from '../../notifications/NotificationClient';
import * as boltzrpc from '../../proto/boltzrpc_pb';
import type DecodedInvoice from '../../sidecar/DecodedInvoice';
import Hook from './Hook';

type HookResult = {
  node?: NodeType;
  timePreference?: number;
};

class InvoicePaymentHook extends Hook<
  boltzrpc.Node | undefined,
  HookResult | undefined,
  boltzrpc.InvoicePaymentHookRequest,
  boltzrpc.InvoicePaymentHookResponse
> {
  constructor(logger: Logger, notificationClient?: NotificationClient) {
    super(
      logger,
      'invoice payment',
      { node: NodeType.CLN },
      { node: NodeType.CLN },
      60_000,
      notificationClient,
    );
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

  private logHookResult = (swapId: string, res: HookResult | undefined) => {
    const info =
      res !== undefined
        ? [
            res.node !== undefined &&
              `node: ${nodeTypeToPrettyString(res.node)}`,
            res.timePreference !== undefined &&
              `time preference: ${res.timePreference}`,
          ]
            .filter(Boolean)
            .join(', ') || 'no preferences'
        : 'no response';

    this.logger.debug(`Invoice payment hook for ${swapId} returned ${info}`);
  };

  protected parseGrpcAction = (
    res: boltzrpc.InvoicePaymentHookResponse,
  ): HookResult | undefined => {
    let node: NodeType | undefined;

    if (res.hasAction()) {
      switch (res.getAction()) {
        case boltzrpc.Node.CLN:
          node = NodeType.CLN;
          break;
        case boltzrpc.Node.LND:
          node = NodeType.LND;
          break;
        default:
          return undefined;
      }
    }

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
        node,
        timePreference,
      };
    }

    return { node };
  };
}

export default InvoicePaymentHook;
