import Logger from '../Logger';
import Swap from '../db/models/Swap';
import { Currency } from '../wallet/WalletManager';
import { LightningClient } from '../lightning/LightningClient';
import ReverseSwap, { NodeType } from '../db/models/ReverseSwap';

class NodeSwitch {
  private static readonly clnAmountThreshold = 1_000_000;

  public static getSwapNode = (
    logger: Logger,
    currency: Currency,
    swap: Swap,
  ): LightningClient => {
    const client = NodeSwitch.fallback(
      currency,
      NodeSwitch.switch(currency, swap.invoiceAmount),
    );
    logger.debug(`Using node ${client.serviceName()} for Swap ${swap.id}`);

    return client;
  };

  public static getReverseSwapNode = (
    currency: Currency,
    reverseSwap: ReverseSwap,
  ): LightningClient => {
    return reverseSwap.node === NodeType.LND
      ? currency.lndClient!
      : currency.clnClient!;
  };

  public static getNodeForReverseSwap = (
    logger: Logger,
    id: string,
    currency: Currency,
    holdInvoiceAmount: number,
  ): { nodeType: NodeType; lightningClient: LightningClient } => {
    const client = NodeSwitch.fallback(
      currency,
      NodeSwitch.switch(currency, holdInvoiceAmount),
    );
    logger.debug(
      `Using node ${client.serviceName()} for Reverse Swap Swap ${id}`,
    );

    return {
      lightningClient: client,
      nodeType: client === currency.lndClient ? NodeType.LND : NodeType.CLN,
    };
  };

  public static hasClient = (currency: Currency): boolean => {
    return currency.lndClient !== undefined || currency.clnClient !== undefined;
  };

  private static switch = (
    currency: Currency,
    amount?: number,
  ): LightningClient | undefined => {
    return (amount || 0) > NodeSwitch.clnAmountThreshold
      ? currency.lndClient
      : currency.clnClient;
  };

  private static fallback = (
    currency: Currency,
    client?: LightningClient,
  ): LightningClient => {
    return (client || currency.lndClient || currency.clnClient)!;
  };
}

export default NodeSwitch;
