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
  // BOLT11 limits the length of the description field to 639 bytes
  private static readonly invoiceMemoMaxBytes = 639;
  private static readonly invoiceMemoBlockedCharsRegex = new RegExp(
    // Unicode control characters except newlines, and bidirectional
    // control characters that can spoof how the memo is displayed
    // eslint-disable-next-line no-control-regex
    '[\\u0000-\\u0009\\u000B\\u000C\\u000E-\\u001F\\u007F-\\u009F\\u061C\\u200E\\u200F\\u202A-\\u202E\\u2066-\\u2069]',
    'u',
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
    preferredNodeId?: string,
  ): Promise<HolisticInvoice> => {
    this.checkInvoiceMemo(memo);

    const candidates = this.nodeSwitch.getReverseSwapCandidates(
      currency,
      holdInvoiceAmount,
      referralId,
      preferredNodeId,
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

    if (!memo.isWellFormed()) {
      throw Errors.INVALID_INVOICE_MEMO('not a well-formed string');
    }

    if (Buffer.byteLength(memo, 'utf8') > NodeFallback.invoiceMemoMaxBytes) {
      throw Errors.INVALID_INVOICE_MEMO(
        `exceeds maximum length of ${NodeFallback.invoiceMemoMaxBytes} bytes`,
      );
    }

    if (NodeFallback.invoiceMemoBlockedCharsRegex.test(memo)) {
      throw Errors.INVALID_INVOICE_MEMO('contains blocked characters');
    }
  };
}

export default NodeFallback;
