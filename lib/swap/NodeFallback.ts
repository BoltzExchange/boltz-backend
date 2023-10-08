import Errors from './Errors';
import Logger from '../Logger';
import NodeSwitch from './NodeSwitch';
import { racePromise } from '../PromiseUtils';
import { ClientStatus } from '../consts/Enums';
import RoutingHints from './routing/RoutingHints';
import { Currency } from '../wallet/WalletManager';
import { NodeType } from '../db/models/ReverseSwap';
import { HopHint, LightningClient } from '../lightning/LightningClient';

type InvoiceWithRoutingHints = {
  paymentRequest: string;
  routingHints: HopHint[][] | undefined;
};

type HolisticInvoice = InvoiceWithRoutingHints & {
  nodeType: NodeType;
  lightningClient: LightningClient;
};

class NodeFallback {
  private static readonly addInvoiceTimeout = 10_000;

  constructor(
    private logger: Logger,
    private nodeSwitch: NodeSwitch,
    private routingHints: RoutingHints,
  ) {}

  public getReverseSwapInvoice = async (
    id: string,
    referralId: string | undefined,
    routingNode: string | undefined,
    currency: Currency,
    holdInvoiceAmount: number,
    preimageHash: Buffer,
    cltvExpiry?: number,
    expiry?: number,
    memo?: string,
  ): Promise<HolisticInvoice> => {
    let nodeForSwap = this.nodeSwitch.getNodeForReverseSwap(
      id,
      currency,
      holdInvoiceAmount,
      referralId,
    );

    while (nodeForSwap.lightningClient !== undefined) {
      try {
        return {
          ...nodeForSwap,
          ...(await this.addHoldInvoice(
            nodeForSwap.nodeType,
            nodeForSwap.lightningClient,
            routingNode,
            currency,
            holdInvoiceAmount,
            preimageHash,
            cltvExpiry,
            expiry,
            memo,
          )),
        };
      } catch (e) {
        if (
          (e as any).message === Errors.LIGHTNING_CLIENT_CALL_TIMEOUT().message
        ) {
          this.logger.warn(
            `${nodeForSwap.lightningClient.serviceName()} invoice creation timed out after ${
              NodeFallback.addInvoiceTimeout
            }ms; trying next node`,
          );
          nodeForSwap.lightningClient.setClientStatus(
            ClientStatus.Disconnected,
          );
          nodeForSwap = this.nodeSwitch.getNodeForReverseSwap(
            id,
            currency,
            holdInvoiceAmount,
            referralId,
          );

          continue;
        }

        throw e;
      }
    }

    throw Errors.NO_AVAILABLE_LIGHTNING_CLIENT();
  };

  private addHoldInvoice = async (
    nodeType: NodeType,
    lightningClient: LightningClient,
    routingNode: string | undefined,
    currency: Currency,
    holdInvoiceAmount: number,
    preimageHash: Buffer,
    cltvExpiry?: number,
    expiry?: number,
    memo?: string,
  ): Promise<InvoiceWithRoutingHints> => {
    const routingHints =
      routingNode !== undefined
        ? await this.routingHints.getRoutingHints(
            currency.symbol,
            routingNode,
            nodeType,
          )
        : undefined;

    return racePromise<InvoiceWithRoutingHints>(
      async (): Promise<InvoiceWithRoutingHints> => ({
        routingHints,
        paymentRequest: await lightningClient.addHoldInvoice(
          holdInvoiceAmount,
          preimageHash,
          cltvExpiry,
          expiry,
          memo,
          routingHints,
        ),
      }),
      (reject) => reject(Errors.LIGHTNING_CLIENT_CALL_TIMEOUT()),
      NodeFallback.addInvoiceTimeout,
    );
  };
}

export default NodeFallback;
