import Logger from '../../Logger';
import RoutingHintsLnd from './RoutingHintsLnd';
import ClnClient from '../../lightning/ClnClient';
import LndClient from '../../lightning/LndClient';
import { Currency } from '../../wallet/WalletManager';
import { HopHint } from '../../lightning/LightningClient';

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
      .map((prov) => prov.lnd)
      .filter((prov): prov is RoutingHintsLnd => prov !== undefined)
      .forEach((prov) => prov.stop());
  };

  public getRoutingHints = async (
    symbol: string,
    nodeId: string,
  ): Promise<HopHint[][]> => {
    const providers = this.providers.get(symbol);
    if (providers === undefined) {
      return [];
    }

    // Prefer the LND routing hints provider
    return (providers.lnd || providers.cln)?.routingHints(nodeId) || [];
  };
}

export default RoutingHints;
