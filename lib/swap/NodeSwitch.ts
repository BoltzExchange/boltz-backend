import Logger from '../Logger';
import ReverseSwap, { NodeType } from '../db/models/ReverseSwap';
import { LightningClient } from '../lightning/LightningClient';
import { InvoiceType } from '../sidecar/DecodedInvoice';
import { Currency } from '../wallet/WalletManager';
import Errors from './Errors';

type NodeSwitchConfig = {
  clnAmountThreshold?: number;

  swapNode?: string;
  referralsIds?: Record<string, string>;
};

class NodeSwitch {
  private static readonly defaultClnAmountThreshold = 1_000_000;

  private readonly clnAmountThreshold: number;
  private readonly referralIds = new Map<string, NodeType>();

  private readonly swapNode?: NodeType;

  constructor(
    private logger: Logger,
    cfg?: NodeSwitchConfig,
  ) {
    this.clnAmountThreshold =
      cfg?.clnAmountThreshold || NodeSwitch.defaultClnAmountThreshold;
    this.logger.info(`CLN invoice threshold: ${this.clnAmountThreshold} sat`);

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

  public static hasClient = (currency: Currency): boolean => {
    return [currency.lndClient, currency.clnClient].some(
      (client) => client !== undefined,
    );
  };

  public getSwapNode = (
    currency: Currency,
    invoiceType: InvoiceType,
    swap: { id?: string; invoiceAmount?: number; referral?: string },
  ): LightningClient => {
    const client = NodeSwitch.fallback(
      currency,
      invoiceType === InvoiceType.Bolt11
        ? this.swapNode !== undefined
          ? NodeSwitch.switchOnNodeType(currency, this.swapNode)
          : this.switch(currency, swap.invoiceAmount, swap.referral)
        : currency.clnClient,
    );

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
      this.switch(currency, holdInvoiceAmount, referralId),
    );
    this.logger.debug(
      `Using node ${client.serviceName()} for Reverse Swap ${id}`,
    );

    return {
      lightningClient: client,
      nodeType: client === currency.lndClient ? NodeType.LND : NodeType.CLN,
    };
  };

  public switch = (
    currency: Currency,
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
      (amount || 0) > this.clnAmountThreshold
        ? currency.lndClient
        : currency.clnClient,
    );
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
}

export default NodeSwitch;
export { NodeSwitchConfig };
