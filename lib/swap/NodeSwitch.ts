import Logger from '../Logger';
import { getHexString } from '../Utils';
import { SwapType, swapTypeToPrettyString } from '../consts/Enums';
import ReverseSwap, { NodeType } from '../db/models/ReverseSwap';
import LightningPaymentRepository from '../db/repositories/LightningPaymentRepository';
import { msatToSat } from '../lightning/ChannelUtils';
import { LightningClient } from '../lightning/LightningClient';
import DecodedInvoice, { InvoiceType } from '../sidecar/DecodedInvoice';
import { Currency } from '../wallet/WalletManager';
import Errors from './Errors';

type NodeSwitchConfig = {
  clnAmountThreshold?: number;

  swapNode?: string;
  referralsIds?: Record<string, string>;
};

class NodeSwitch {
  private static readonly defaultClnAmountThreshold = 1_000_000;
  private static readonly maxClnRetries = 1;

  private readonly clnAmountThreshold: number;
  private readonly referralIds = new Map<string, NodeType>();

  private readonly swapNode?: NodeType;

  constructor(
    private readonly logger: Logger,
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
                msatToSat(decoded.amountMsat),
                swap.referral,
              )
          : currency.clnClient,
      );
    };

    let client = selectNode(this.swapNode);

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
