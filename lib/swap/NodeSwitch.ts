import type Logger from '../Logger';
import { getHexString, stringify } from '../Utils';
import { SwapType, swapTypeToPrettyString } from '../consts/Enums';
import type ReverseSwap from '../db/models/ReverseSwap';
import { NodeType } from '../db/models/ReverseSwap';
import LightningPaymentRepository from '../db/repositories/LightningPaymentRepository';
import { msatToSat } from '../lightning/ChannelUtils';
import type { LightningClient } from '../lightning/LightningClient';
import type DecodedInvoice from '../sidecar/DecodedInvoice';
import { InvoiceType } from '../sidecar/DecodedInvoice';
import {
  type Currency,
  getLightningClientById,
  getLightningClients,
} from '../wallet/WalletManager';
import Errors from './Errors';
import InvoicePaymentHook from './hooks/InvoicePaymentHook';

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

  public readonly paymentHook: InvoicePaymentHook;

  private static readonly defaultClnAmountThreshold = 1_000_000;
  private static readonly maxClnRetries = 1;

  private readonly referralIds = new Map<string, string>();

  private readonly swapNode?: string;
  private readonly preferredForNode = new Map<string, string>();

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
        ? this.parseNodeId(cfg.swapNode, 'swap node')
        : undefined;
    if (swapNode !== undefined) {
      this.logger.info(`Using ${swapNode} for paying invoices of Swaps`);
      this.swapNode = swapNode;
    }

    for (const [referralId, nodeId] of Object.entries(
      cfg?.referralsIds || {},
    )) {
      const parsed = this.parseNodeId(nodeId, `referral id ${referralId}`);
      if (parsed === undefined) {
        continue;
      }

      this.referralIds.set(referralId, parsed);
    }

    for (const [node, nodeId] of Object.entries(cfg?.preferredForNode || {})) {
      const parsed = this.parseNodeId(nodeId, `preferred for node ${node}`);
      if (parsed === undefined) {
        continue;
      }

      this.preferredForNode.set(node.toLowerCase(), parsed);
    }

    this.paymentHook = new InvoicePaymentHook(this.logger);
  }

  public static getReverseSwapNode = (
    currency: Currency,
    reverseSwap: ReverseSwap,
  ): {
    nodeId: string;
    nodeType: NodeType;
    lightningClient: LightningClient;
  } => {
    const client = getLightningClientById(currency, reverseSwap.nodeId!);
    if (client === undefined) {
      throw Errors.NO_AVAILABLE_LIGHTNING_CLIENT(
        `node ${reverseSwap.nodeId} not found for reverse swap ${reverseSwap.id}`,
      );
    }

    if (!client.isConnected()) {
      throw Errors.NO_AVAILABLE_LIGHTNING_CLIENT(
        `node ${reverseSwap.nodeId} is not connected for reverse swap ${reverseSwap.id}`,
      );
    }

    return {
      nodeId: client.id,
      nodeType: client.type,
      lightningClient: client,
    };
  };

  public static getClients = (currency: Currency): LightningClient[] =>
    getLightningClients(currency);

  public static hasClient = (currency: Currency, type?: NodeType): boolean => {
    if (type === NodeType.LND) {
      return currency.lndClients.size > 0;
    }

    if (type === NodeType.CLN) {
      return currency.clnClient !== undefined;
    }

    return currency.lndClients.size > 0 || currency.clnClient !== undefined;
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
    const preferredNodeId = this.getPreferredNode(decoded);
    const referralNodeId =
      preferredNodeId === undefined
        ? this.referralIds.get(swap.referral || '')
        : undefined;
    const requestedNodeId = preferredNodeId ?? referralNodeId;

    let requestedClient: LightningClient | undefined = undefined;
    if (requestedNodeId !== undefined) {
      requestedClient = getLightningClientById(currency, requestedNodeId);
      if (requestedClient === undefined) {
        this.logger.warn(
          `Requested node ${requestedNodeId} not configured for ${currency.symbol}; falling back`,
        );
      }
    }

    let client: LightningClient;
    if (decoded.type !== InvoiceType.Bolt11) {
      if (requestedClient && requestedClient.type === NodeType.CLN) {
        client = NodeSwitch.fallback(currency, requestedClient);
      } else {
        if (requestedClient && requestedClient.type !== NodeType.CLN) {
          this.logger.warn(
            `Ignoring non-CLN override ${requestedClient.id} for ${decoded.typePretty} invoice`,
          );
        }

        client = NodeSwitch.fallback(currency, currency.clnClient);
      }
    } else {
      // Bolt11: check amount threshold for CLN preference
      if (requestedClient !== undefined) {
        client = NodeSwitch.fallback(currency, requestedClient);
      } else {
        const amount =
          decoded.amountMsat !== undefined ? msatToSat(decoded.amountMsat) : 0;

        if (
          amount <= this.clnAmountThreshold[SwapType.Submarine] &&
          currency.clnClient?.isConnected()
        ) {
          client = currency.clnClient;
        } else {
          client = NodeSwitch.fallback(currency);
        }
      }
    }

    // Go easy on CLN xpay
    if (client.type === NodeType.CLN && decoded.type === InvoiceType.Bolt11) {
      if (decoded.paymentHash !== undefined) {
        const existingPayment =
          await LightningPaymentRepository.findByPreimageHashAndNodeId(
            getHexString(decoded.paymentHash),
            client.id,
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
          client = NodeSwitch.fallback(currency);
        }
      }
    }

    if (swap.id !== undefined) {
      this.logger.debug(
        `Using node ${client.id} (${client.serviceName()}) for Swap ${swap.id}`,
      );
    }

    return client;
  };

  public invoicePaymentHook = async (
    currency: Currency,
    swap: { id: string; invoice: string },
    decoded: DecodedInvoice,
  ): Promise<
    { client?: LightningClient; timePreference?: number } | undefined
  > => {
    const res = await this.paymentHook.hook(swap.id, swap.invoice, decoded);
    if (!res) return undefined;

    if (res.nodeId !== undefined) {
      const requestedClient = getLightningClientById(currency, res.nodeId);
      if (requestedClient && requestedClient.isConnected()) {
        return { client: requestedClient, timePreference: res.timePreference };
      }

      this.logger.warn(
        `Invoice payment hook requested unavailable node ${res.nodeId} for ${currency.symbol}`,
      );
    }

    if (res.timePreference !== undefined) {
      return { timePreference: res.timePreference };
    }

    return undefined;
  };

  public getReverseSwapCandidates = (
    currency: Currency,
    holdInvoiceAmount: number,
    referralId?: string,
  ): {
    nodeType: NodeType;
    nodeId: string;
    lightningClient: LightningClient;
  }[] => {
    const preferredNodeId = this.referralIds.get(referralId || '');
    const candidates = this.getBolt11Candidates(currency, preferredNodeId);

    // If CLN threshold preference applies, move CLN to front
    if (
      preferredNodeId === undefined &&
      holdInvoiceAmount <= this.clnAmountThreshold[SwapType.ReverseSubmarine] &&
      currency.clnClient?.isConnected()
    ) {
      const clnCandidate = candidates.find((c) => c.nodeType === NodeType.CLN);
      if (clnCandidate) {
        return [
          clnCandidate,
          ...candidates.filter((c) => c.nodeId !== clnCandidate.nodeId),
        ];
      }
    }

    return candidates;
  };

  private getPreferredNode = (invoice: DecodedInvoice): string | undefined => {
    const nodes = invoice.routingHints.flat().map((h) => h.nodeId);
    if (invoice.payee !== undefined) {
      nodes.push(getHexString(invoice.payee!));
    }

    for (const node of nodes) {
      const preferred = this.preferredForNode.get(node.toLowerCase());
      if (preferred !== undefined) {
        this.logger.debug(`Preferring node ${preferred} because of ${node}`);
        return preferred;
      }
    }

    return this.swapNode;
  };

  private parseNodeId = (
    nodeId: any,
    valueContext: string,
  ): string | undefined => {
    if (typeof nodeId !== 'string' || nodeId.trim() === '') {
      this.logger.warn(`Invalid node id for ${valueContext}: "${nodeId}"`);
      return;
    }

    return nodeId;
  };

  private getBolt11Candidates = (
    currency: Currency,
    preferredNodeId?: string,
  ): {
    nodeType: NodeType;
    nodeId: string;
    lightningClient: LightningClient;
  }[] => {
    const ordered = this.getOrderedClients(currency, preferredNodeId);
    return ordered
      .filter((client) => client.isConnected())
      .map((client) => ({
        nodeId: client.id,
        nodeType: client.type,
        lightningClient: client,
      }));
  };

  private getOrderedClients = (
    currency: Currency,
    preferredNodeId?: string,
  ): LightningClient[] => {
    const ordered: LightningClient[] = Array.from(currency.lndClients.values());
    if (currency.clnClient) {
      ordered.push(currency.clnClient);
    }

    if (preferredNodeId === undefined) {
      return ordered;
    }

    const preferred = getLightningClientById(currency, preferredNodeId);
    if (preferred === undefined) {
      this.logger.warn(
        `Preferred node ${preferredNodeId} not configured for ${currency.symbol}; falling back`,
      );
      return ordered;
    }

    return [
      preferred,
      ...ordered.filter((client) => client.id !== preferred.id),
    ];
  };

  public static fallback = (
    currency: Currency,
    client?: LightningClient,
  ): LightningClient => {
    const ordered = [
      client,
      ...Array.from(currency.lndClients.values()),
      currency.clnClient,
    ].filter(
      (candidate): candidate is LightningClient => candidate !== undefined,
    );

    const unique = new Map<string, LightningClient>();
    ordered.forEach((candidate) => {
      if (!unique.has(candidate.id)) {
        unique.set(candidate.id, candidate);
      }
    });

    const clients = Array.from(unique.values()).filter((candidate) =>
      candidate.isConnected(),
    );

    if (clients.length === 0) {
      throw Errors.NO_AVAILABLE_LIGHTNING_CLIENT();
    }

    return clients[0]!;
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
