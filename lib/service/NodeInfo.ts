import { scheduleJob, Job } from 'node-schedule';
import Logger from '../Logger';
import { splitChannelPoint } from '../Utils';
import { Currency } from '../wallet/WalletManager';

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
      if (currency.lndClient === undefined) {
        return;
      }

      const lndInfo = await currency.lndClient.getInfo();
      this.uris.set(symbol, {
        uris: lndInfo.urisList,
        nodeKey: lndInfo.identityPubkey,
      });

      const channels = await currency.lndClient.listChannels();
      const publicChannels = channels.channelsList.filter(
        (chan) => !chan.pb_private,
      );

      let oldestChannelBlockTime: number | undefined;

      if (channels.channelsList.length > 0) {
        const oldestChannel = channels.channelsList.reduce((prev, cur) => {
          return Number(prev.chanId) < Number(cur.chanId) ? prev : cur;
        });
        oldestChannelBlockTime = (
          await currency.chainClient!.getRawTransactionVerbose(
            splitChannelPoint(oldestChannel.channelPoint).id,
          )
        ).blocktime;
      }

      this.stats.set(symbol, {
        peers: lndInfo.numPeers,
        channels: publicChannels.length,
        oldestChannel: oldestChannelBlockTime,
        capacity: publicChannels.reduce((sum, chan) => sum + chan.capacity, 0),
      });
    }
  };
}

export default NodeInfo;
export { LndNodeInfo, Stats };
