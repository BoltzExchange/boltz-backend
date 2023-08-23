import { scheduleJob, Job } from 'node-schedule';
import Logger from '../Logger';
import ClnClient from '../lightning/ClnClient';
import LndClient from '../lightning/LndClient';
import { Currency } from '../wallet/WalletManager';
import NodeSwitch from '../swap/NodeSwitch';

type LndNodeInfo = {
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
  private uris = new Map<string, LndNodeInfo>();
  private stats = new Map<string, Stats>();

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

  public getStats = () => {
    return this.stats;
  };

  public getUris = () => {
    return this.uris;
  };

  private update = async () => {
    for (const [symbol, currency] of this.currencies) {
      if (!NodeSwitch.hasClient(currency)) {
        continue;
      }

      const clients = [currency.lndClient, currency.clnClient].filter(
        (client): client is LndClient | ClnClient => client !== undefined,
      );

      const infos = await Promise.all(
        clients.map((client) => client.getInfo()),
      );

      // TODO: how to handle both, lnd and cln
      this.uris.set(symbol, {
        uris: infos[0].uris,
        nodeKey: infos[0].pubkey,
      });

      const channelInfos = await Promise.all(
        clients.map((client) => client?.listChannels()),
      );
      const channels = channelInfos.flatMap((infos) => infos);

      const publicChannels = channels.filter((chan) => !chan.private);

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

      this.stats.set(symbol, {
        channels: publicChannels.length,
        oldestChannel: oldestChannelBlockTime,
        peers: infos.reduce((sum, info) => sum + info.peers, 0),
        capacity: publicChannels.reduce((sum, chan) => sum + chan.capacity, 0),
      });
    }
  };
}

export default NodeInfo;
export { LndNodeInfo, Stats };
