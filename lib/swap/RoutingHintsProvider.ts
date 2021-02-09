import Logger from '../Logger';
import LndClient from '../lightning/LndClient';
import { minutesToMilliseconds } from '../Utils';
import { Channel, ChannelEdge, HopHint, RouteHint } from '../proto/lnd/rpc_pb';

type ChannelWithRoutingInfo = {
  channel: Channel.AsObject;
  routingInfo: ChannelEdge.AsObject;
}

class RoutingHintsProvider {
  // How often the channel lists should be updated in minutes
  private static readonly channelFetchInterval = 5;

  private interval: any;

  private channels = new Map<string, ChannelWithRoutingInfo[]>();

  constructor(
    private logger: Logger,
    private lndClients: LndClient[],
  ) {
    const lndSymbols: string[] = [];
    this.lndClients.forEach((client) => lndSymbols.push(client.symbol));

    this.logger.debug(`Initializing routing hints provider for LND clients: ${lndSymbols.join(', ')}`);
  }

  public start = async (): Promise<void> => {
    await this.updateChannels();

    this.logger.debug(`Fetching channels for routing hints provider every ${RoutingHintsProvider.channelFetchInterval} minutes`);

    this.interval = setInterval(async () => {
      await this.updateChannels();
    }, minutesToMilliseconds(RoutingHintsProvider.channelFetchInterval));
  }

  public stop = (): void => {
    if (this.interval !== undefined) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }

  public getRoutingHints = (symbol: string, nodeId: string): RouteHint[] => {
    const relevantChannels = this.channels.get(symbol)!.filter(
      (channelInfo) => channelInfo.channel.remotePubkey === nodeId,
    );

    const routeHints: RouteHint[] = [];

    for (const channelInfo of relevantChannels) {
      const routeHint = new RouteHint();

      const { channel, routingInfo } = channelInfo;

      const remotePolicy = routingInfo.node1Pub === nodeId ? routingInfo.node1Policy! : routingInfo.node2Policy!;

      const hopHint = new HopHint();

      hopHint.setNodeId(nodeId);
      hopHint.setChanId(channel.chanId);
      hopHint.setFeeBaseMsat(remotePolicy.feeBaseMsat);
      hopHint.setCltvExpiryDelta(remotePolicy.timeLockDelta);
      hopHint.setFeeProportionalMillionths(remotePolicy.feeRateMilliMsat);

      routeHint.addHopHints(hopHint);

      routeHints.push(routeHint);
    }

    return routeHints;
  }

  private updateChannels = async () => {
    this.logger.silly('Updating channel lists for routing hint provider');

    for (const client of this.lndClients) {
      const channelInfos: ChannelWithRoutingInfo[] = [];

      const channels = await client.listChannels(true, true);

      for (const channel of channels.channelsList) {
        channelInfos.push({
          channel,
          routingInfo: await client.getChannelInfo(channel.chanId),
        });
      }

      this.logger.silly(`Found ${channelInfos.length} private ${client.symbol} channels`);
      this.channels.set(client.symbol, channelInfos);
    }
  }
}

export default RoutingHintsProvider;
