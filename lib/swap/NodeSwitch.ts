import type Logger from '../Logger';
import { getHexString, stringify } from '../Utils';
import { SwapType, swapTypeToPrettyString } from '../consts/Enums';
import type ReverseSwap from '../db/models/ReverseSwap';
import { NodeType, nodeTypeToPrettyString } from '../db/models/ReverseSwap';
import LightningPaymentRepository from '../db/repositories/LightningPaymentRepository';
import { msatToSat } from '../lightning/ChannelUtils';
import type { LightningClient } from '../lightning/LightningClient';
import type DecodedInvoice from '../sidecar/DecodedInvoice';
import { InvoiceType } from '../sidecar/DecodedInvoice';
import type { Currency } from '../wallet/WalletManager';
import Errors from './Errors';

type NodeAmountThreshold = {
  submarine: number;
  reverse: number;
};

type NodeSwitchConfig = {
  clnAmountThreshold?: number | Partial<NodeAmountThreshold>;

  swapNode?: string;
  referralsIds?: Record<string, string>;

  preferredForNode?: Record<string, string>;
};

class NodeSwitch {
  public readonly clnAmountThreshold: {
    [SwapType.Submarine]: number;
    [SwapType.ReverseSubmarine]: number;
  };

  private static readonly defaultClnAmountThreshold = 1_000_000;
  private static readonly maxClnRetries = 1;

  private readonly referralIds = new Map<string, NodeType>();

  private readonly swapNode?: NodeType;
  private readonly preferredForNode = new Map<string, NodeType>();

  constructor(
    private readonly logger: Logger,
    cfg?: NodeSwitchConfig,
  ) {
    if (cfg?.clnAmountThreshold !== undefined) {
      if (typeof cfg.clnAmountThreshold === 'number') {
        this.clnAmountThreshold = {
          [SwapType.Submarine]: cfg.clnAmountThreshold,
          [SwapType.ReverseSubmarine]: cfg.clnAmountThreshold,
        };
      } else {
        this.clnAmountThreshold = {
          [SwapType.Submarine]:
            cfg.clnAmountThreshold.submarine ||
            NodeSwitch.defaultClnAmountThreshold,
          [SwapType.ReverseSubmarine]:
            cfg.clnAmountThreshold.reverse ||
            NodeSwitch.defaultClnAmountThreshold,
        };
      }
    } else {
      this.clnAmountThreshold = {
        [SwapType.Submarine]: NodeSwitch.defaultClnAmountThreshold,
        [SwapType.ReverseSubmarine]: NodeSwitch.defaultClnAmountThreshold,
      };
    }

    this.logClnThresholds();

    const swapNode =
      cfg?.swapNode !== undefined
        ? this.parseNodeType(cfg.swapNode, 'swap node')
        : undefined;
    if (swapNode !== undefined) {
      this.logger.info(`Using ${cfg?.swapNode} for paying invoices of Swaps`);
      this.swapNode = swapNode;
    }

    for (const [referralId, nodeType] of Object.entries(
      cfg?.referralsIds || {},
    )) {
      const nt = this.parseNodeType(nodeType, `referral id ${referralId}`);
      if (nt === undefined) {
        continue;
      }

      this.referralIds.set(referralId, nt);
    }

    for (const [node, nodeType] of Object.entries(
      cfg?.preferredForNode || {},
    )) {
      const nt = this.parseNodeType(nodeType, `preferred for node ${node}`);
      if (nt === undefined) {
        continue;
      }

      this.preferredForNode.set(node.toLowerCase(), nt);
    }
  }

  public static getReverseSwapNode = (
    currency: Currency,
    reverseSwap: ReverseSwap,
  ): LightningClient => {
    return NodeSwitch.fallback(
      currency,
      NodeSwitch.switchOnNodeType(currency, reverseSwap.node),
    );
  };

  public static hasClient = (currency: Currency, type?: NodeType): boolean => {
    return [currency.lndClient, currency.clnClient].some(
      (client?: LightningClient) => {
        if (type !== undefined) {
          return client?.type === type;
        }

        return client !== undefined;
      },
    );
  };

  public updateClnThresholds = (
    thresholds: { type: SwapType; threshold: number }[],
  ) => {
    if (thresholds.some((t) => t.type === SwapType.Chain)) {
      throw new Error('cannot be set for chain swaps');
    }

    for (const threshold of thresholds) {
      this.clnAmountThreshold[threshold.type] = threshold.threshold;
    }

    this.logClnThresholds();
  };

  public getSwapNode = async (
    currency: Currency,
    decoded: DecodedInvoice,
    swap: {
      id?: string;
      referral?: string;
    },
  ): Promise<LightningClient> => {
    const selectNode = (preferredNode?: NodeType) => {
      return NodeSwitch.fallback(
        currency,
        decoded.type === InvoiceType.Bolt11
          ? preferredNode !== undefined
            ? NodeSwitch.switchOnNodeType(currency, preferredNode)
            : this.switch(
                currency,
                SwapType.Submarine,
                msatToSat(decoded.amountMsat),
                swap.referral,
              )
          : currency.clnClient,
      );
    };

    let client = selectNode(this.getPreferredNode(decoded));

    // Go easy on CLN xpay
    if (client.type === NodeType.CLN && decoded.type === InvoiceType.Bolt11) {
      if (decoded.paymentHash !== undefined) {
        const existingPayment =
          await LightningPaymentRepository.findByPreimageHashAndNode(
            getHexString(decoded.paymentHash),
            client.type,
          );

        if (
          existingPayment?.retries !== null &&
          existingPayment?.retries !== undefined &&
          existingPayment.retries >= NodeSwitch.maxClnRetries
        ) {
          const identifier =
            swap.id !== undefined
              ? `of ${swapTypeToPrettyString(SwapType.Submarine)} Swap ${swap.id}`
              : `with hash ${getHexString(decoded.paymentHash)}`;
          this.logger.debug(
            `Max CLN retries reached for invoice ${identifier}; preferring LND`,
          );
          client = selectNode(NodeType.LND);
        }
      }
    }

    if (swap.id !== undefined) {
      this.logger.debug(
        `Using node ${client.serviceName()} for Swap ${swap.id}`,
      );
    }

    return client;
  };

  public getNodeForReverseSwap = (
    id: string,
    currency: Currency,
    holdInvoiceAmount: number,
    referralId?: string,
  ): { nodeType: NodeType; lightningClient: LightningClient } => {
    const client = NodeSwitch.fallback(
      currency,
      this.switch(
        currency,
        SwapType.ReverseSubmarine,
        holdInvoiceAmount,
        referralId,
      ),
    );
    this.logger.debug(
      `Using node ${client.serviceName()} for Reverse Swap ${id}`,
    );

    return {
      lightningClient: client,
      nodeType: client === currency.lndClient ? NodeType.LND : NodeType.CLN,
    };
  };

  private switch = (
    currency: Currency,
    swapType: SwapType.Submarine | SwapType.ReverseSubmarine,
    amount?: number,
    referralId?: string,
  ): LightningClient => {
    if (referralId && this.referralIds.has(referralId)) {
      return NodeSwitch.fallback(
        currency,
        NodeSwitch.switchOnNodeType(
          currency,
          this.referralIds.get(referralId)!,
        ),
      );
    }

    return NodeSwitch.fallback(
      currency,
      (amount || 0) > this.clnAmountThreshold[swapType]
        ? currency.lndClient
        : currency.clnClient,
    );
  };

  private getPreferredNode = (
    invoice: DecodedInvoice,
  ): NodeType | undefined => {
    const nodes = invoice.routingHints.flat().map((h) => h.nodeId);
    if (invoice.payee !== undefined) {
      nodes.push(getHexString(invoice.payee!));
    }

    for (const node of nodes) {
      const nt = this.preferredForNode.get(node);
      if (nt !== undefined) {
        this.logger.debug(
          `Preferring node ${nodeTypeToPrettyString(nt)} because of ${node}`,
        );
        return nt;
      }
    }

    return this.swapNode;
  };

  private parseNodeType = (
    nodeType: any,
    valueContext: string,
  ): NodeType | undefined => {
    const nt = NodeType[nodeType as string];
    if (nt === undefined || typeof nodeType !== 'string') {
      this.logger.warn(
        `Invalid node type for ${valueContext}: "${nodeType}"; available options are: [${Object.values(
          NodeType,
        )
          .filter((val) => typeof val === 'string')
          .join(', ')}]`,
      );
      return;
    }

    return nt;
  };

  public static fallback = (
    currency: Currency,
    client?: LightningClient,
  ): LightningClient => {
    const clients = [client, currency.lndClient, currency.clnClient]
      .filter((client): client is LightningClient => client !== undefined)
      .filter((client) => client.isConnected());

    if (clients.length === 0) {
      throw Errors.NO_AVAILABLE_LIGHTNING_CLIENT();
    }

    return clients[0]!;
  };

  private static switchOnNodeType = (
    currency: Currency,
    nodeType: NodeType,
  ): LightningClient | undefined => {
    return nodeType === NodeType.LND ? currency.lndClient : currency.clnClient;
  };

  private logClnThresholds = () => {
    this.logger.info(
      `CLN invoice thresholds: ${stringify({
        [swapTypeToPrettyString(SwapType.Submarine)]:
          this.clnAmountThreshold[SwapType.Submarine],
        [swapTypeToPrettyString(SwapType.ReverseSubmarine)]:
          this.clnAmountThreshold[SwapType.ReverseSubmarine],
      })}`,
    );
  };
}

export default NodeSwitch;
export { NodeSwitchConfig };
