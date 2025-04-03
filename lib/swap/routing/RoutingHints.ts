import type Logger from '../../Logger';
import { NodeType } from '../../db/models/ReverseSwap';
import type {
  HopHint,
  RoutingHintsProvider,
} from '../../lightning/LightningClient';
import type LndClient from '../../lightning/LndClient';
import type ClnClient from '../../lightning/cln/ClnClient';
import type { Currency } from '../../wallet/WalletManager';
import RoutingHintsLnd from './RoutingHintsLnd';

type Providers = { lnd?: RoutingHintsLnd; cln?: ClnClient };

class RoutingHints {
  private providers = new Map<string, Providers>();

  constructor(
    private logger: Logger,
    currencies: Currency[],
  ) {
    currencies
      .filter(
        (cur) => cur.lndClient !== undefined || cur.clnClient !== undefined,
      )
      .forEach((cur) => {
        this.providers.set(cur.symbol, {
          lnd:
            cur.lndClient !== undefined
              ? new RoutingHintsLnd(this.logger, cur.lndClient as LndClient)
              : undefined,
          cln: cur.clnClient,
        });
      });

    this.logger.debug(
      `Initializing routing hints provider for: ${Array.from(
        this.providers.keys(),
      ).join(', ')}`,
    );
  }

  public start = async (): Promise<void> => {
    const startPromises = Array.from(this.providers.values())
      .filter((prov) => prov.lnd !== undefined)
      .map((prov) => prov.lnd?.start());

    await Promise.all(startPromises);
  };

  public stop = (): void => {
    Array.from(this.providers.values())
      .flatMap((prov) => [prov.lnd, prov.cln])
      .filter((prov): prov is RoutingHintsLnd => prov !== undefined)
      .forEach((prov) => prov.stop());
  };

  public getRoutingHints = async (
    symbol: string,
    nodeId: string,
    nodeType?: NodeType,
  ): Promise<HopHint[][]> => {
    const providers = this.providers.get(symbol);
    if (providers === undefined) {
      return [];
    }

    // Prefer the LND routing hints provider
    return (
      (
        RoutingHints.getProviderForNodeType(providers, nodeType) ||
        providers.lnd ||
        providers.cln
      )?.routingHints(nodeId) || []
    );
  };

  private static getProviderForNodeType = (
    providers: Providers,
    nodeType?: NodeType,
  ): RoutingHintsProvider | undefined => {
    switch (nodeType) {
      case NodeType.LND:
        return providers.lnd;

      case NodeType.CLN:
        return providers.cln;
    }

    return undefined;
  };
}

export default RoutingHints;
