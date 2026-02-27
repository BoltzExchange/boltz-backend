import type Logger from '../Logger';
import type { NodeType } from '../db/models/ReverseSwap';
import type { HopHint, LightningClient } from '../lightning/LightningClient';
import type { Currency } from '../wallet/WalletManager';
import Errors from './Errors';
import type NodeSwitch from './NodeSwitch';
import type RoutingHints from './routing/RoutingHints';

type InvoiceWithRoutingHints = {
  paymentRequest: string;
  routingHints: HopHint[][] | undefined;
};

type HolisticInvoice = InvoiceWithRoutingHints & {
  nodeType: NodeType;
  nodeId: string;
  lightningClient: LightningClient;
};

class NodeFallback {
  private static readonly addInvoiceTimeout = 10_000;
  private static readonly invoiceMemoRegex = new RegExp(
    // Visible ASCII characters, newlines, and the Bitcoin symbol with a maximal length of 500
    // eslint-disable-next-line no-control-regex
    '^[\x20-\x7E\n\r₿]{0,500}$',
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

    const candidates = this.nodeSwitch.getReverseSwapCandidates(
      currency,
      holdInvoiceAmount,
      referralId,
    );

    for (const candidate of candidates) {
      this.logger.debug(
        `Using node ${candidate.nodeId} (${candidate.lightningClient.serviceName()}) for Reverse Swap ${id}`,
      );

      try {
        return {
          ...candidate,
          ...(await this.addHoldInvoice(
            candidate.nodeId,
            candidate.lightningClient,
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
            `${candidate.lightningClient.serviceName()}-${candidate.nodeId} invoice creation timed out after ${NodeFallback.addInvoiceTimeout}ms; trying next node`,
          );
          continue;
        }

        throw e;
      }
    }

    throw Errors.NO_AVAILABLE_LIGHTNING_CLIENT();
  };

  private addHoldInvoice = async (
    nodeId: string,
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
            nodeId,
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
