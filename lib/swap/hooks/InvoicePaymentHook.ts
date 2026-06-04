import type Logger from '../../Logger';
import type NotificationClient from '../../notifications/NotificationClient';
import * as boltzrpc from '../../proto/boltzrpc';
import type DecodedInvoice from '../../sidecar/DecodedInvoice';
import Hook from './Hook';

const enum InvoicePaymentHookAction {
  Continue,
  Hold,
}

type HookResult = {
  action: InvoicePaymentHookAction;
  nodeId?: string;
  timePreference?: number;
};

const defaultHookResult = {
  action: InvoicePaymentHookAction.Continue,
};

class InvoicePaymentHook extends Hook<
  HookResult | undefined,
  boltzrpc.InvoicePaymentHookRequest,
  boltzrpc.InvoicePaymentHookResponse
> {
  constructor(logger: Logger, notificationClient?: NotificationClient) {
    super(
      logger,
      'invoice payment',
      defaultHookResult,
      defaultHookResult,
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

    const msg: boltzrpc.InvoicePaymentHookRequest = {
      id: swapId,
      invoice,
      decoded: decoded.rawRes,
    };

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

    if (res.action === InvoicePaymentHookAction.Hold) {
      this.logger.debug(`Invoice payment hook for ${swapId} returned hold`);
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
    const action = this.parseHookAction(res);
    if (action === undefined) {
      return undefined;
    }

    if (action === InvoicePaymentHookAction.Hold) {
      return {
        action,
      };
    }

    const nodeId = res.nodePubkey || undefined;

    if (res.timePreference !== undefined) {
      const timePreference = res.timePreference;
      if (timePreference < -1 || timePreference > 1) {
        this.logger.warn(
          `Invoice payment hook for ${res.id} returned invalid time preference ${timePreference}`,
        );
        return undefined;
      }

      return {
        action,
        nodeId,
        timePreference,
      };
    }

    return { action, nodeId };
  };

  private parseHookAction = (
    res: boltzrpc.InvoicePaymentHookResponse,
  ): InvoicePaymentHookAction | undefined => {
    switch (res.action ?? boltzrpc.InvoicePaymentHookAction.CONTINUE) {
      case boltzrpc.InvoicePaymentHookAction.CONTINUE:
        return InvoicePaymentHookAction.Continue;

      case boltzrpc.InvoicePaymentHookAction.HOLD:
        return InvoicePaymentHookAction.Hold;

      default:
        this.logger.warn(
          `Invoice payment hook for ${res.id} returned invalid action ${res.action}`,
        );
        return undefined;
    }
  };
}

export default InvoicePaymentHook;
export { InvoicePaymentHookAction };
