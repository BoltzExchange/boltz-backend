import { ClientReadableStream } from '@grpc/grpc-js';
import Logger from '../Logger';
import { ClientStatus } from '../consts/Enums';
import * as lndrpc from '../proto/lnd/rpc_pb';
import {formatError, getHexString} from '../Utils';
import LndBaseClient, { LndBaseConfig } from './LndBaseClient';

interface IRouterClient {
  on(event: 'peer.online', listener: (publicKey: string) => void): this;
  emit(event: 'peer.online', publicKey: string): boolean;

  on(even: 'channel.active', listener: (channel: lndrpc.ChannelPoint.AsObject) => void): this;
  emit(even: 'channel.active', channel: lndrpc.ChannelPoint.AsObject): boolean;

  on(event: 'channel.backup', listener: (channelBackup: string) => void): this;
  emit(event: 'channel.backup', channelBackup: string): boolean;
}

class RouterClient extends LndBaseClient implements IRouterClient {
  public static readonly serviceName = 'LNDRouter';

  private peerEventSubscription?: ClientReadableStream<lndrpc.PeerEvent>;
  private channelEventSubscription?: ClientReadableStream<lndrpc.ChannelEventUpdate>;
  private channelBackupSubscription?: ClientReadableStream<lndrpc.ChanBackupSnapshot>;

  constructor(
    logger: Logger,
    public readonly symbol: string,
    config: LndBaseConfig,
  ) {
    super(logger, symbol, RouterClient.serviceName, config);
  }

  public startSubscriptions = async () => {
    this.subscribePeerEvents();
    this.subscribeChannelEvents();
    this.subscribeChannelBackups();
  };

  public stopSubscriptions = (): void => {
    if (this.peerEventSubscription) {
      this.peerEventSubscription.cancel();
      this.peerEventSubscription = undefined;
    }

    if (this.channelEventSubscription) {
      this.channelEventSubscription.cancel();
      this.channelEventSubscription = undefined;
    }

    if (this.channelBackupSubscription) {
      this.channelBackupSubscription.cancel();
      this.channelBackupSubscription = undefined;
    }

    this.removeAllListeners();
  };

  /**
   * Decode an encoded payment request
   *
   * @param paymentRequest encoded payment request
   */
  public decodePayReq = (paymentRequest: string): Promise<lndrpc.PayReq.AsObject> => {
    const request = new lndrpc.PayReqString();
    request.setPayReq(paymentRequest);

    return this.unaryLightningCall<lndrpc.PayReqString, lndrpc.PayReq.AsObject>('decodePayReq', request);
  };

  /**
   * Returns the latest advertised, aggregated, and authenticated channel information for the specified node identified by its public key
   */
  public getNodeInfo = (publicKey: string): Promise<lndrpc.NodeInfo.AsObject> => {
    const request = new lndrpc.NodeInfoRequest();
    request.setPubKey(publicKey);
    request.setIncludeChannels(false);

    return this.unaryLightningCall<lndrpc.NodeInfoRequest, lndrpc.NodeInfo.AsObject>('getNodeInfo', request);
  };

  /**
   * Establish a connection to a remote peer
   *
   * @param pubKey identity public key of the remote peer
   * @param host host of the remote peer
   */
  public connectPeer = (pubKey: string, host: string): Promise<lndrpc.ConnectPeerResponse.AsObject> => {
    const address = new lndrpc.LightningAddress();
    address.setPubkey(pubKey);
    address.setHost(host);

    const request = new lndrpc.ConnectPeerRequest();
    request.setAddr(address);

    return this.unaryLightningCall<lndrpc.ConnectPeerRequest, lndrpc.ConnectPeerResponse.AsObject>('connectPeer', request);
  };

  /**
   * Sends coins to a particular address
   *
   * @param address address to which coins should be sent
   * @param amount number of satoshis or litoshis to send
   * @param satPerByte satoshis or litoshis per byte that should be sent as fee
   */
  public sendCoins = (address: string, amount: number, satPerByte?: number): Promise<lndrpc.SendCoinsResponse.AsObject> => {
    const request = new lndrpc.SendCoinsRequest();
    request.setAddr(address);
    request.setAmount(amount);

    if (satPerByte) {
      request.setSatPerByte(satPerByte);
    }

    return this.unaryLightningCall<lndrpc.SendCoinsRequest, lndrpc.SendCoinsResponse.AsObject>('sendCoins', request);
  };

  /**
   * Sends all coins of the wallet to a particular address
   *
   * @param address address to which coins should be sent
   * @param satPerByte satoshis or litoshis per byte that should be sent as fee
   */
  public sweepWallet = (address: string, satPerByte?: number): Promise<lndrpc.SendCoinsResponse.AsObject> => {
    const request = new lndrpc.SendCoinsRequest();
    request.setAddr(address);
    request.setSendAll(true);

    if (satPerByte) {
      request.setSatPerByte(satPerByte);
    }

    return this.unaryLightningCall<lndrpc.SendCoinsRequest, lndrpc.SendCoinsResponse.AsObject>('sendCoins', request);
  };

  /**
   * Returns a list describing all the known transactions relevant to the wallet
   */
  public getOnchainTransactions = (startHeight: number): Promise<lndrpc.TransactionDetails.AsObject> => {
    const request = new lndrpc.GetTransactionsRequest();
    request.setStartHeight(startHeight);

    return this.unaryLightningCall<lndrpc.GetTransactionsRequest, lndrpc.TransactionDetails.AsObject>('getTransactions', request);
  };

  /**
   * Creates a new address
   *
   * @param addressType type of the address
   */
  public newAddress = (
    addressType: lndrpc.AddressTypeMap[keyof lndrpc.AddressTypeMap] = lndrpc.AddressType.TAPROOT_PUBKEY,
  ): Promise<lndrpc.NewAddressResponse.AsObject> => {
    const request = new lndrpc.NewAddressRequest();
    request.setType(addressType);

    return this.unaryLightningCall<lndrpc.NewAddressRequest, lndrpc.NewAddressResponse.AsObject>('newAddress', request);
  };

  /**
   * Attempts to open a channel to a remote peer
   *
   * @param pubKey identity public key of the remote peer
   * @param fundingAmount the number of satoshis the local wallet should commit
   * @param privateChannel whether the channel should be private
   * @param satPerByte sat/vbyte fee of the funding transaction
   */
  public openChannel = (
    pubKey: string,
    fundingAmount: number,
    privateChannel: boolean,
    satPerByte: number,
  ): Promise<lndrpc.ChannelPoint.AsObject> => {
    const request = new lndrpc.OpenChannelRequest();
    request.setPrivate(privateChannel);
    request.setNodePubkeyString(pubKey);
    request.setLocalFundingAmount(fundingAmount);

    if (satPerByte) {
      request.setSatPerByte(satPerByte);
    }

    return this.unaryLightningCall<lndrpc.OpenChannelRequest, lndrpc.ChannelPoint.AsObject>('openChannelSync', request);
  };

  /**
   * Gets a list of all open channels
   */
  public listChannels = (activeOnly = false, privateOnly = false): Promise<lndrpc.ListChannelsResponse.AsObject> => {
    const request = new lndrpc.ListChannelsRequest();
    request.setActiveOnly(activeOnly);
    request.setPrivateOnly(privateOnly);

    return this.unaryLightningCall<lndrpc.ListChannelsRequest, lndrpc.ListChannelsResponse.AsObject>('listChannels', request);
  };

  /**
   * Gets the latest routing information of a given channel
   */
  public getChannelInfo = (channelId: string): Promise<lndrpc.ChannelEdge.AsObject> => {
    const request = new lndrpc.ChanInfoRequest();
    request.setChanId(channelId);

    return this.unaryLightningCall<lndrpc.ChanInfoRequest, lndrpc.ChannelEdge.AsObject>('getChanInfo', request);
  };

  /**
   * Gets a list of all peers
   */
  public listPeers = (): Promise<lndrpc.ListPeersResponse.AsObject> => {
    return this.unaryLightningCall<lndrpc.ListPeersRequest, lndrpc.ListPeersResponse.AsObject>('listPeers', new lndrpc.ListPeersRequest());
  };

  /**
   * Gets the balance of the onchain wallet
   */
  public getWalletBalance = (): Promise<lndrpc.WalletBalanceResponse.AsObject> => {
    const request = new lndrpc.WalletBalanceRequest();

    return this.unaryLightningCall<lndrpc.WalletBalanceRequest, lndrpc.WalletBalanceResponse.AsObject>('walletBalance', request);
  };

  private handleSubscriptionError = async (subscriptionName: string, error: any) => {
    this.logger.error(`${RouterClient.serviceName} ${this.symbol} ${subscriptionName} subscription errored: ${formatError(error)}`);

    if (this.status === ClientStatus.Connected) {
      this.emit('subscription.error');
      await this.reconnect();
    }
  };

  private subscribePeerEvents = () => {
    if (this.peerEventSubscription) {
      this.peerEventSubscription.cancel();
    }

    this.peerEventSubscription = this.lightning!.subscribePeerEvents(new lndrpc.PeerEventSubscription(), this.meta)
      .on('data', (event: lndrpc.PeerEvent) => {
        if (event.getType() === lndrpc.PeerEvent.EventType.PEER_ONLINE) {
          this.emit('peer.online', event.getPubKey());
        }
      })
      .on('error', async (error) => {
        await this.handleSubscriptionError('peer event', error);
      });
  };

  private subscribeChannelEvents = () => {
    if (this.channelEventSubscription) {
      this.channelEventSubscription.cancel();
    }

    this.channelEventSubscription = this.lightning!.subscribeChannelEvents(new lndrpc.ChannelEventSubscription(), this.meta)
      .on('data', (event: lndrpc.ChannelEventUpdate) => {
        if (event.getType() === lndrpc.ChannelEventUpdate.UpdateType.ACTIVE_CHANNEL) {
          this.emit('channel.active', event.getActiveChannel()!.toObject());
        }
      })
      .on('error', async(error) => {
        await this.handleSubscriptionError('channel event', error);
      });
  };

  private subscribeChannelBackups = () => {
    if (this.channelBackupSubscription) {
      this.channelBackupSubscription.cancel();
    }

    this.channelBackupSubscription = this.lightning!.subscribeChannelBackups(new lndrpc.ChannelBackupSubscription(), this.meta)
      .on('data', (backupSnapshot: lndrpc.ChanBackupSnapshot) => {
        const multiBackup = backupSnapshot.getMultiChanBackup();

        if (multiBackup) {
          const decodedBackup = Buffer.from(multiBackup.getMultiChanBackup_asB64(), 'base64');
          this.emit('channel.backup', getHexString(decodedBackup));
        }
      })
      .on('error', async (error) => {
        this.logger.error(`${RouterClient.serviceName} ${this.symbol} channel backup subscription errored: ${formatError(error)}`);
        this.emit('subscription.error', 'channel backup');
      });
  };
}

export default RouterClient;
export { IRouterClient };
