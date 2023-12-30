import { scheduleJob, Job } from 'node-schedule';
import Logger from '../Logger';
import NodeSwitch from '../swap/NodeSwitch';
import ClnClient from '../lightning/ClnClient';
import LndClient from '../lightning/LndClient';
import { Currency } from '../wallet/WalletManager';
import {
  ChannelInfo,
  NodeInfo as INodeInfo,
} from '../lightning/LightningClient';

type LightningNodeInfo = {
  nodeKey: string;
  uris: string[];
};

type Stats = {
  channels: number;
  peers: number;
  capacity: number;
  oldestChannel?: number;
};

class NodeInfo {
  public static readonly totalStats = 'total';

  public readonly stats = new Map<string, Map<'total' | string, Stats>>();
  public readonly uris = new Map<string, Map<string, LightningNodeInfo>>();

  private readonly pubkeys = new Set<string>();

  private job?: Job;

  constructor(
    private logger: Logger,
    private currencies: Map<string, Currency>,
  ) {}

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

  private update = async () => {
    for (const [symbol, currency] of this.currencies) {
      if (!NodeSwitch.hasClient(currency)) {
        continue;
      }

      const clients = [currency.lndClient, currency.clnClient].filter(
        (client): client is LndClient | ClnClient => client !== undefined,
      );

      const infos: [string, INodeInfo, ChannelInfo[]][] = await Promise.all(
        clients.map(async (client) => [
          client.serviceName(),
          await client.getInfo(),
          await client?.listChannels(),
        ]),
      );

      infos.forEach(([, info]) => this.pubkeys.add(info.pubkey));
      this.uris.set(
        symbol,
        new Map<string, LightningNodeInfo>(
          infos.map(([name, info]) => [
            name,
            {
              uris: info.uris,
              nodeKey: info.pubkey,
            },
          ]),
        ),
      );

      const stats: [string, Stats][] = await Promise.all(
        infos.map(async ([name, info, channels]) => [
          name,
          await this.calculateNodeStats(currency, channels, info.peers),
        ]),
      );
      stats.push([
        NodeInfo.totalStats,
        {
          capacity: stats.reduce((sum, [, stat]) => sum + stat.capacity, 0),
          channels: stats.reduce((sum, [, stat]) => sum + stat.channels, 0),
          peers: stats.reduce((sum, [, stat]) => sum + stat.peers, 0),
          oldestChannel: stats.reduce(
            (oldest: number | undefined, [, stat]) => {
              if (stat.oldestChannel === undefined) {
                return oldest;
              }

              if (oldest === undefined) {
                return stat.oldestChannel;
              }

              return oldest < stat.oldestChannel ? oldest : stat.oldestChannel;
            },
            undefined,
          ),
        },
      ]);

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
