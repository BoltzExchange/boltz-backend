import type Logger from '../../Logger';
import type {
  HopHint,
  RoutingHintsProvider,
} from '../../lightning/LightningClient';
import type ClnClient from '../../lightning/cln/ClnClient';
import type { Currency } from '../../wallet/WalletManager';
import RoutingHintsLnd from './RoutingHintsLnd';

type Providers = { lnds: Map<string, RoutingHintsLnd>; cln?: ClnClient };

class RoutingHints {
  private providers = new Map<string, Providers>();

  constructor(
    private logger: Logger,
    currencies: Currency[],
  ) {
    currencies
      .filter((cur) => cur.lndClients.size > 0 || cur.clnClient !== undefined)
      .forEach((cur) => {
        const lndProviders = new Map<string, RoutingHintsLnd>();
        for (const [nodeId, client] of cur.lndClients.entries()) {
          lndProviders.set(nodeId, new RoutingHintsLnd(this.logger, client));
        }

        this.providers.set(cur.symbol, {
          lnds: lndProviders,
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
      .flatMap((prov) => Array.from(prov.lnds.values()))
      .map((prov) => prov.start());

    await Promise.all(startPromises);
  };

  public stop = (): void => {
    Array.from(this.providers.values())
      .flatMap((prov) => Array.from(prov.lnds.values()))
      .forEach((prov) => prov.stop());
  };

  public getRoutingHints = async (
    symbol: string,
    routingNode: string,
    nodeId?: string,
  ): Promise<HopHint[][]> => {
    const providers = this.providers.get(symbol);
    if (providers === undefined) {
      return [];
    }

    let provider: RoutingHintsProvider | undefined;

    if (nodeId !== undefined) {
      provider =
        providers.lnds.get(nodeId) ||
        (providers.cln?.id === nodeId ? providers.cln : undefined);

      if (provider === undefined) {
        this.logger.warn(
          `Routing hints requested for unknown node ${nodeId} (${symbol}); falling back`,
        );
      }
    }

    if (provider === undefined) {
      provider = providers.lnds.values().next().value || providers.cln;
    }

    return (await provider?.routingHints(routingNode)) || [];
  };
}

export default RoutingHints;
