import type { Job } from 'node-schedule';
import { scheduleJob } from 'node-schedule';
import type { CurrencyConfig } from '../Config';
import type Logger from '../Logger';
import { stringify } from '../Utils';
import type {
  ChannelInfo,
  NodeInfo as INodeInfo,
  LightningClient,
} from '../lightning/LightningClient';
import NodeSwitch from '../swap/NodeSwitch';
import { type Currency, getLightningClients } from '../wallet/WalletManager';

type LightningNodeInfo = {
  nodeKey: string;
  uris: string[];
  nodeType: LightningClient['type'];
};

type Stats = {
  channels: number;
  peers: number;
  capacity: number;
  oldestChannel?: number;
};

class NodeInfo {
  public readonly stats = new Map<string, Map<string, Stats>>();
  public readonly uris = new Map<string, Map<string, LightningNodeInfo>>();

  private readonly pubkeys = new Set<string>();
  private readonly noRoutes = new Map<string, Set<string>>();

  private job?: Job;

  constructor(
    private logger: Logger,
    private currencies: Map<string, Currency>,
    currencyConfigs: CurrencyConfig[],
  ) {
    for (const currency of currencyConfigs) {
      const noRouteList = (currency.noRoute || []).map((pubkey) =>
        pubkey.toLowerCase(),
      );
      if (noRouteList.length === 0) {
        continue;
      }

      this.logger.verbose(
        `No route list for ${currency.symbol}: ${stringify(noRouteList)}`,
      );
      this.noRoutes.set(currency.symbol, new Set(noRouteList));
    }
  }

  public init = () => {
    this.job = scheduleJob('0 0 * * *', async () => {
      this.logger.debug('Updating lightning node stats');
      await this.update();
    });

    return this.update();
  };

  public stopSchedule = () => {
    if (this.job) {
      this.job.cancel();
      this.job = undefined;
    }
  };

  public isOurNode = (pubkey: string): boolean => this.pubkeys.has(pubkey);

  public isNoRoute = (symbol: string, pubkey: string): boolean => {
    const noRouteList = this.noRoutes.get(symbol);
    if (noRouteList === undefined || pubkey === undefined) {
      return false;
    }

    return noRouteList.has(pubkey.toLowerCase());
  };

  private update = async () => {
    for (const [symbol, currency] of this.currencies) {
      if (!NodeSwitch.hasClient(currency)) {
        continue;
      }

      const clients = getLightningClients(currency);

      const infos: [string, LightningClient, INodeInfo, ChannelInfo[]][] =
        await Promise.all(
          clients.map(async (client) => [
            client.id,
            client,
            await client.getInfo(),
            await client?.listChannels(),
          ]),
        );

      infos.forEach(([, , info]) => this.pubkeys.add(info.pubkey));
      this.uris.set(
        symbol,
        new Map<string, LightningNodeInfo>(
          infos.map(([nodeId, client, info]) => [
            nodeId,
            {
              uris: info.uris,
              nodeKey: info.pubkey,
              nodeType: client.type,
            },
          ]),
        ),
      );

      const stats: [string, Stats][] = await Promise.all(
        infos.map(async ([nodeId, , info, channels]) => [
          nodeId,
          await this.calculateNodeStats(currency, channels, info.peers),
        ]),
      );

      this.stats.set(symbol, new Map<string, Stats>(stats));
    }
  };

  private calculateNodeStats = async (
    currency: Currency,
    channels: ChannelInfo[],
    peers: number,
  ): Promise<Stats> => {
    let oldestChannelBlockTime: number | undefined;

    if (channels.length > 0) {
      const oldestChannel = channels.reduce((prev, cur) => {
        return Number(prev.chanId) < Number(cur.chanId) ? prev : cur;
      });
      oldestChannelBlockTime = (
        await currency.chainClient!.getRawTransactionVerbose(
          oldestChannel.fundingTransactionId,
        )
      ).blocktime;
    }

    const publicChannels = channels.filter((chan) => !chan.private);

    return {
      capacity: publicChannels.reduce((sum, chan) => sum + chan.capacity, 0),
      channels: publicChannels.length,
      peers: peers,
      oldestChannel: oldestChannelBlockTime,
    };
  };
}

export default NodeInfo;
export { LightningNodeInfo, Stats };
