import Logger from '../../Logger';
import LndClient from '../../lightning/LndClient';
import { minutesToMilliseconds } from '../../Utils';
import { HopHint, RoutingHintsProvider } from '../../lightning/LightningClient';

class RoutingHintsLnd implements RoutingHintsProvider {
  // How often the channel lists should be updated in minutes
  private static readonly channelFetchInterval = 15;

  private readonly name: string;

  private ourPubkey!: string;
  private interval: any;
  private channelInfos = new Map<string, HopHint[][]>();

  constructor(
    private logger: Logger,
    private lnd: LndClient,
  ) {
    this.name = `${this.lnd.symbol} ${LndClient.serviceName}`;
  }

  public start = async (): Promise<void> => {
    const info = await this.lnd.getInfo();
    this.ourPubkey = info.pubkey;

    await this.update();

    this.logger.debug(
      `Fetching channels for routing hints provider of ${this.name} every ${RoutingHintsLnd.channelFetchInterval} minutes`,
    );

    this.interval = setInterval(async () => {
      await this.update();
    }, minutesToMilliseconds(RoutingHintsLnd.channelFetchInterval));
  };

  public stop = (): void => {
    if (this.interval !== undefined) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  };

  public routingHints = async (nodeId: string): Promise<HopHint[][]> => {
    return this.channelInfos.get(nodeId) || [];
  };

  private update = async () => {
    this.logger.silly(
      `Updating channel list for ${this.name} routing hint provider`,
    );

    const channelInfos = new Map<string, HopHint[][]>();

    const channels = await this.lnd.listChannels(true, true);

    for (const channel of channels) {
      const routingInfo = await this.lnd.getChannelInfo(channel.chanId);
      const remotePolicy =
        routingInfo.node1Pub === this.ourPubkey
          ? routingInfo.node2Policy
          : routingInfo.node1Policy;

      if (remotePolicy === undefined) {
        continue;
      }

      if (!channelInfos.has(channel.remotePubkey)) {
        channelInfos.set(channel.remotePubkey, []);
      }

      channelInfos.get(channel.remotePubkey)!.push([
        {
          nodeId: channel.remotePubkey,
          chanId: channel.chanId,
          feeBaseMsat: remotePolicy.feeBaseMsat,
          cltvExpiryDelta: remotePolicy.timeLockDelta,
          feeProportionalMillionths: remotePolicy.feeRateMilliMsat,
        },
      ]);
    }

    this.logger.silly(
      `Found ${channelInfos.size} private ${this.name} channels`,
    );
    this.channelInfos = channelInfos;
  };
}

export default RoutingHintsLnd;
