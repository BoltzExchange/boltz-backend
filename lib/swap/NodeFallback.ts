import Logger from '../Logger';
import { NodeType } from '../db/models/ReverseSwap';
import { HopHint, LightningClient } from '../lightning/LightningClient';
import { Currency } from '../wallet/WalletManager';
import Errors from './Errors';
import NodeSwitch from './NodeSwitch';
import RoutingHints from './routing/RoutingHints';

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
  private static readonly invoiceMemoRegex = new RegExp(
    // Visible ASCII characters with a maximal length of 60
    '^[\x20-\x7E]{0,60}$',
  );

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
    descriptionHash?: Buffer,
    routingHints?: HopHint[][],
  ): Promise<HolisticInvoice> => {
    this.checkInvoiceMemo(memo);
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
            descriptionHash,
            routingHints,
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
    descriptionHash?: Buffer,
    externalHints?: HopHint[][],
  ): Promise<InvoiceWithRoutingHints> => {
    const nodeHints =
      routingNode !== undefined
        ? await this.routingHints.getRoutingHints(
            currency.symbol,
            routingNode,
            nodeType,
          )
        : undefined;

    const routingHints: HopHint[][] = [nodeHints, externalHints]
      .filter((hints): hints is HopHint[][] => hints !== undefined)
      .flat();

    return lightningClient.raceCall<InvoiceWithRoutingHints>(
      async (): Promise<InvoiceWithRoutingHints> => ({
        routingHints,
        paymentRequest: await lightningClient.addHoldInvoice(
          holdInvoiceAmount,
          preimageHash,
          cltvExpiry,
          expiry,
          memo,
          descriptionHash,
          routingHints,
        ),
      }),
      (reject) => reject(Errors.LIGHTNING_CLIENT_CALL_TIMEOUT()),
      NodeFallback.addInvoiceTimeout,
    );
  };

  private checkInvoiceMemo = (memo?: string) => {
    if (memo === undefined) {
      return;
    }

    if (!NodeFallback.invoiceMemoRegex.test(memo)) {
      throw Errors.INVALID_INVOICE_MEMO();
    }
  };
}

export default NodeFallback;
