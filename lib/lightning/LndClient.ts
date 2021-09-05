import fs from 'fs';
import bolt11 from '@boltz/bolt11';
import { ChannelCredentials, ClientReadableStream, credentials, Metadata, ServiceError } from '@grpc/grpc-js';
import Errors from './Errors';
import Logger from '../Logger';
import BaseClient from '../BaseClient';
import * as lndrpc from '../proto/lnd/rpc_pb';
import { ClientStatus } from '../consts/Enums';
import * as routerrpc from '../proto/lnd/router_pb';
import { formatError, getHexString } from '../Utils';
import * as invoicesrpc from '../proto/lnd/invoices_pb';
import { RouterClient } from '../proto/lnd/router_grpc_pb';
import { LightningClient } from '../proto/lnd/rpc_grpc_pb';
import { InvoicesClient } from '../proto/lnd/invoices_grpc_pb';

/**
 * The configurable options for the LND client
 */
type LndConfig = {
  host: string;
  port: number;
  certpath: string;
  macaroonpath: string;
};

type LndMethodFunction = (params: any, meta: Metadata, listener) => any;

interface GrpcResponse {
  toObject: () => any;
}

interface LndClient {
  on(event: 'peer.online', listener: (publicKey: string) => void): this;
  emit(event: 'peer.online', publicKey: string): boolean;

  on(even: 'channel.active', listener: (channel: lndrpc.ChannelPoint.AsObject) => void): this;
  emit(even: 'channel.active', channel: lndrpc.ChannelPoint.AsObject): boolean;

  on(event: 'htlc.accepted', listener: (invoice: string) => void): this;
  emit(event: 'htlc.accepted', invoice: string): boolean;

  on(event: 'invoice.settled', listener: (invoice: string) => void): this;
  emit(event: 'invoice.settled', string: string): boolean;

  on(event: 'channel.backup', listener: (channelBackup: string) => void): this;
  emit(event: 'channel.backup', channelBackup: string): boolean;

  on(event: 'subscription.error', listener: () => void): this;
  emit(event: 'subscription.error'): this;

  on(event: 'subscription.reconnected', listener: () => void): this;
  emit(event: 'subscription.reconnected'): this;
}

/**
 * A class representing a client to interact with LND
 */
class LndClient extends BaseClient implements LndClient {
  public static readonly serviceName = 'LND';

  public static readonly paymentMaxParts = 3;
  public static readonly paymentTimeout = 15;

  private static readonly grpcOptions = {
    // 200 MB which is the same value lncli uses: https://github.com/lightningnetwork/lnd/commit/7470f696aebc51b4ab354324e6536f54446538e1
    'grpc.max_receive_message_length': 1024 * 1024 * 200,
  };

  private static readonly minPaymentFee = 21;
  private static readonly maxPaymentFeeRatio = 0.03;

  private readonly uri!: string;
  private readonly credentials!: ChannelCredentials;

  private readonly meta!: Metadata;

  private router?: RouterClient;
  private invoices?: InvoicesClient;
  private lightning?: LightningClient;

  private peerEventSubscription?: ClientReadableStream<lndrpc.PeerEvent>;
  private channelEventSubscription?: ClientReadableStream<lndrpc.ChannelEventUpdate>;
  private channelBackupSubscription?: ClientReadableStream<lndrpc.ChanBackupSnapshot>;

  /**
   * Create an LND client
   */
  constructor(
    private logger: Logger,
    public readonly symbol: string,
    config: LndConfig,
  ) {
    super();

    const { host, port, certpath, macaroonpath } = config;

    if (fs.existsSync(certpath)) {
      this.uri = `${host}:${port}`;

      const lndCert = fs.readFileSync(certpath);
      this.credentials = credentials.createSsl(lndCert);

      this.meta = new Metadata();

      if (macaroonpath !== '') {
        if (fs.existsSync(macaroonpath)) {
          const adminMacaroon = fs.readFileSync(macaroonpath);
          this.meta.add('macaroon', adminMacaroon.toString('hex'));
        } else {
          this.throwFilesNotFound();
        }
      }
    } else {
      this.throwFilesNotFound();
    }
  }

  private throwFilesNotFound = () => {
    throw(Errors.COULD_NOT_FIND_FILES(this.symbol));
  }

  /**
   * Returns a boolean determines whether LND is ready or not
   */
  public connect = async (startSubscriptions = true): Promise<boolean> => {
    if (!this.isConnected()) {
      this.router = new RouterClient(this.uri, this.credentials, LndClient.grpcOptions);
      this.invoices = new InvoicesClient(this.uri, this.credentials, LndClient.grpcOptions);
      this.lightning = new LightningClient(this.uri, this.credentials, LndClient.grpcOptions);

      try {
        await this.getInfo();

        if (startSubscriptions) {
          this.subscribePeerEvents();
          this.subscribeChannelEvents();
          this.subscribeChannelBackups();
        }

        this.clearReconnectTimer();
        this.setClientStatus(ClientStatus.Connected);
      } catch (error) {
        this.setClientStatus(ClientStatus.Disconnected);

        this.logger.error(`Could not connect to ${LndClient.serviceName} ${this.symbol} at ${this.uri}: ${formatError(error)}`);
        this.logger.info(`Retrying in ${this.RECONNECT_INTERVAL} ms`);

        this.reconnectionTimer = setTimeout(this.connect, this.RECONNECT_INTERVAL);

        return false;
      }
    }

    return true;
  }

  private reconnect = async () => {
    this.setClientStatus(ClientStatus.Disconnected);

    try {
      await this.getInfo();

      this.logger.info(`Reestablished connection to ${LndClient.serviceName} ${this.symbol}`);

      this.clearReconnectTimer();

      this.subscribePeerEvents();
      this.subscribeChannelEvents();
      this.subscribeChannelBackups();

      this.setClientStatus(ClientStatus.Connected);
      this.emit('subscription.reconnected');
    } catch (err) {
      this.setClientStatus(ClientStatus.Disconnected);

      this.logger.error(`Could not reconnect to ${LndClient.serviceName} ${this.symbol}: ${err}`);
      this.logger.info(`Retrying in ${this.RECONNECT_INTERVAL} ms`);

      this.reconnectionTimer = setTimeout(this.reconnect, this.RECONNECT_INTERVAL);
    }
  }

  /**
   * End all subscriptions and reconnection attempts.
   */
  public disconnect = (): void => {
    this.clearReconnectTimer();

    if (this.lightning) {
      this.lightning.close();
      this.lightning = undefined;
    }

    if (this.router) {
      this.router.close();
      this.router = undefined;
    }

    if (this.invoices) {
      this.invoices.close();
      this.invoices = undefined;
    }

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

    this.setClientStatus(ClientStatus.Disconnected);
  }

  private unaryCall = <T, U>(client: any, methodName: string, params: T): Promise<U> => {
    return new Promise((resolve, reject) => {
      (client[methodName] as LndMethodFunction)(params, this.meta, (err: ServiceError, response: GrpcResponse) => {
        if (err) {
          reject(err);
        } else {
          resolve(response.toObject());
        }
      });
    });
  }

  private unaryInvoicesCall = <T, U>(methodName: keyof InvoicesClient, params: T): Promise<U> => {
    return this.unaryCall(this.invoices, methodName, params);
  }

  private unaryLightningCall = <T, U>(methodName: keyof LightningClient, params: T): Promise<U> => {
    return this.unaryCall(this.lightning, methodName, params);
  }

  /**
   * Return general information concerning the lightning node including it’s identity pubkey, alias, the chains it
   * is connected to, and information concerning the number of open+pending channels
   */
  public getInfo = (): Promise<lndrpc.GetInfoResponse.AsObject> => {
    return this.unaryLightningCall<lndrpc.GetInfoRequest, lndrpc.GetInfoResponse.AsObject>('getInfo', new lndrpc.GetInfoRequest());
  }

  /**
   * Creates an invoice
   */
  public addInvoice = (value: number, expiry?: number, memo?: string, routingHints?: lndrpc.RouteHint[]): Promise<lndrpc.AddInvoiceResponse.AsObject> => {
    const request = new lndrpc.Invoice();
    request.setValue(value);

    if (expiry) {
      request.setExpiry(expiry);
    }

    if (memo) {
      request.setMemo(memo);
    }

    if (routingHints) {
      request.setRouteHintsList(routingHints);
    }

    return this.unaryLightningCall<lndrpc.Invoice, lndrpc.AddInvoiceResponse.AsObject>('addInvoice', request);
  }

  /**
   * Creates a hold invoice with the supplied preimage hash
   */
  public addHoldInvoice = (
    value: number,
    preimageHash: Buffer,
    cltvExpiry?: number,
    expiry?: number,
    memo?: string,
    routingHints?: lndrpc.RouteHint[],
  ): Promise<invoicesrpc.AddHoldInvoiceResp.AsObject> => {
    const request = new invoicesrpc.AddHoldInvoiceRequest();
    request.setValue(value);
    request.setHash(Uint8Array.from(preimageHash));

    if (cltvExpiry) {
      request.setCltvExpiry(cltvExpiry);
    }

    if (expiry) {
      request.setExpiry(expiry);
    }

    if (memo) {
      request.setMemo(memo);
    }

    if (routingHints) {
      request.setRouteHintsList(routingHints);
    }

    return this.unaryInvoicesCall<invoicesrpc.AddHoldInvoiceRequest, invoicesrpc.AddHoldInvoiceResp.AsObject>(
      'addHoldInvoice',
      request,
    );
  }

  public lookupInvoice = (preimageHash: Buffer): Promise<lndrpc.Invoice.AsObject> => {
    const request = new lndrpc.PaymentHash();
    request.setRHash(preimageHash);

    return this.unaryLightningCall<lndrpc.PaymentHash, lndrpc.Invoice.AsObject>('lookupInvoice', request);
  }

  public trackPayment = (preimageHash: Buffer): Promise<lndrpc.Payment.AsObject> => {
    return new Promise<lndrpc.Payment.AsObject>((resolve, reject) => {
      const request = new routerrpc.TrackPaymentRequest();
      request.setNoInflightUpdates(true);
      request.setPaymentHash(preimageHash);

      const stream = this.router!.trackPaymentV2(request, this.meta);

      const endStream = () => {
        stream.removeAllListeners();
        stream.destroy();
      };

      stream.on('data', (response: lndrpc.Payment) => {
        endStream();
        resolve(response.toObject());
      });

      stream.on('end', () => {
        endStream();
      });

      stream.on('error', (error) => {
        endStream();
        reject(error);
      });
    });
  }

  /**
   * Pay an invoice through the Lightning Network.
   *
   * @param invoice an invoice for a payment within the Lightning Network
   * @param outgoingChannelId channel through which the invoice should be paid
   */
  public sendPayment = (invoice: string, outgoingChannelId?: string): Promise<lndrpc.Payment.AsObject> => {
    return new Promise<lndrpc.Payment.AsObject>((resolve, reject) => {
      const request = new routerrpc.SendPaymentRequest();

      request.setMaxParts(LndClient.paymentMaxParts);
      request.setTimeoutSeconds(LndClient.paymentTimeout);
      request.setFeeLimitSat(this.calculatePaymentFee(invoice));

      request.setPaymentRequest(invoice);

      if (outgoingChannelId) {
        request.setOutgoingChanId(outgoingChannelId);
      }

      const stream = this.router!.sendPaymentV2(request, this.meta);

      stream.on('data', (response: lndrpc.Payment) => {
        switch (response.getStatus()) {
          case lndrpc.Payment.PaymentStatus.SUCCEEDED:
            stream.removeAllListeners();
            resolve(response.toObject());
            return;

          case lndrpc.Payment.PaymentStatus.FAILED:
            stream.removeAllListeners();
            reject(response.getFailureReason());
            break;
        }
      });

      stream.on('end', () => {
        stream.removeAllListeners();
      });

      stream.on('error', (error) => {
        stream.removeAllListeners();
        reject(error);
      });
    });
  }

  /**
   *
   */
  public static formatPaymentFailureReason = (reason: lndrpc.PaymentFailureReason): string => {
    switch (reason) {
      case lndrpc.PaymentFailureReason.FAILURE_REASON_TIMEOUT: return 'timeout';
      case lndrpc.PaymentFailureReason.FAILURE_REASON_NO_ROUTE: return 'no route';
      case lndrpc.PaymentFailureReason.FAILURE_REASON_INSUFFICIENT_BALANCE: return 'insufficient balance';
      case lndrpc.PaymentFailureReason.FAILURE_REASON_INCORRECT_PAYMENT_DETAILS: return 'incorrect payment details';
      default: return 'unknown reason';
    }
  }

  /**
   * Cancel a hold invoice
   */
  public cancelInvoice = (preimageHash: Buffer): Promise<invoicesrpc.CancelInvoiceResp.AsObject> => {
    const request = new invoicesrpc.CancelInvoiceMsg();
    request.setPaymentHash(Uint8Array.from(preimageHash));

    return this.unaryInvoicesCall<invoicesrpc.CancelInvoiceMsg, invoicesrpc.CancelInvoiceResp.AsObject>('cancelInvoice', request);
  }

  /**
   * Settle a hold invoice with an already accepted HTLC
   */
  public settleInvoice = (preimage: Buffer): Promise<invoicesrpc.SettleInvoiceResp.AsObject> => {
    const request = new invoicesrpc.SettleInvoiceMsg();
    request.setPreimage(Uint8Array.from(preimage));

    return this.unaryInvoicesCall<invoicesrpc.SettleInvoiceMsg, invoicesrpc.SettleInvoiceResp.AsObject>('settleInvoice', request);
  }

  /**
   * Queries for a possible route to the target destination
   */
  public queryRoutes = (destination: string, amt: number): Promise<lndrpc.QueryRoutesResponse.AsObject> => {
    const request = new lndrpc.QueryRoutesRequest();
    request.setPubKey(destination);
    request.setAmt(amt);

    return this.unaryLightningCall<lndrpc.QueryRoutesRequest, lndrpc.QueryRoutesResponse.AsObject>('queryRoutes', request);
  }

  /**
   * Decode an encoded payment request
   *
   * @param paymentRequest encoded payment request
   */
  public decodePayReq = (paymentRequest: string): Promise<lndrpc.PayReq.AsObject> => {
    const request = new lndrpc.PayReqString();
    request.setPayReq(paymentRequest);

    return this.unaryLightningCall<lndrpc.PayReqString, lndrpc.PayReq.AsObject>('decodePayReq', request);
  }

  /**
   * Returns the latest advertised, aggregated, and authenticated channel information for the specified node identified by its public key
   */
  public getNodeInfo = (publicKey: string): Promise<lndrpc.NodeInfo.AsObject> => {
    const request = new lndrpc.NodeInfoRequest();
    request.setPubKey(publicKey);
    request.setIncludeChannels(false);

    return this.unaryLightningCall<lndrpc.NodeInfoRequest, lndrpc.NodeInfo.AsObject>('getNodeInfo', request);
  }

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
  }

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
  }

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
  }

  /**
   * Returns a list describing all the known transactions relevant to the wallet
   */
  public getOnchainTransactions = (startHeight: number): Promise<lndrpc.TransactionDetails.AsObject> => {
    const request = new lndrpc.GetTransactionsRequest();
    request.setStartHeight(startHeight);

    return this.unaryLightningCall<lndrpc.GetTransactionsRequest, lndrpc.TransactionDetails.AsObject>('getTransactions', request);
  }

  /**
   * Creates a new address
   *
   * @param addressType type of the address
   */
  public newAddress = (addressType = lndrpc.AddressType.NESTED_PUBKEY_HASH): Promise<lndrpc.NewAddressResponse.AsObject> => {
    const request = new lndrpc.NewAddressRequest();
    request.setType(addressType);

    return this.unaryLightningCall<lndrpc.NewAddressRequest, lndrpc.NewAddressResponse.AsObject>('newAddress', request);
  }

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
  }

  /**
   * Gets a list of all open channels
   */
  public listChannels = (activeOnly = false, privateOnly = false): Promise<lndrpc.ListChannelsResponse.AsObject> => {
    const request = new lndrpc.ListChannelsRequest();
    request.setActiveOnly(activeOnly);
    request.setPrivateOnly(privateOnly);

    return this.unaryLightningCall<lndrpc.ListChannelsRequest, lndrpc.ListChannelsResponse.AsObject>('listChannels', request);
  }

  /**
   * Gets the latest routing information of a given channel
   */
  public getChannelInfo = (channelId: string): Promise<lndrpc.ChannelEdge.AsObject> => {
    const request = new lndrpc.ChanInfoRequest();
    request.setChanId(channelId);

    return this.unaryLightningCall<lndrpc.ChanInfoRequest, lndrpc.ChannelEdge.AsObject>('getChanInfo', request);
  }

  /**
   * Gets a list of all peers
   */
  public listPeers = (): Promise<lndrpc.ListPeersResponse.AsObject> => {
    return this.unaryLightningCall<lndrpc.ListPeersRequest, lndrpc.ListPeersResponse.AsObject>('listPeers', new lndrpc.ListPeersRequest());
  }

  /**
   * Gets the balance of the onchain wallet
   */
  public getWalletBalance = (): Promise<lndrpc.WalletBalanceResponse.AsObject> => {
    const request = new lndrpc.WalletBalanceRequest();

    return this.unaryLightningCall<lndrpc.WalletBalanceRequest, lndrpc.WalletBalanceResponse.AsObject>('walletBalance', request);
  }

  /**
   * Subscribe to events for a single invoice
   */
  public subscribeSingleInvoice = (preimageHash: Buffer): void => {
    const request = new invoicesrpc.SubscribeSingleInvoiceRequest();
    request.setRHash(Uint8Array.from(preimageHash));

    const invoiceSubscription = this.invoices!.subscribeSingleInvoice(request, this.meta);

    const deleteSubscription = () => {
      invoiceSubscription.removeAllListeners();
    };

    invoiceSubscription
      .on('data', (invoice: lndrpc.Invoice) => {
        if (invoice.getState() === lndrpc.Invoice.InvoiceState.ACCEPTED) {
          this.logger.debug(`${LndClient.serviceName} ${this.symbol} accepted ${invoice.getHtlcsList().length} HTLC${invoice.getHtlcsList().length > 1 ? 's' : ''} for invoice: ${invoice.getPaymentRequest()}`);

          this.emit('htlc.accepted', invoice.getPaymentRequest());

          deleteSubscription();
        } else if (invoice.getState() === lndrpc.Invoice.InvoiceState.SETTLED) {
          this.logger.debug(`${LndClient.serviceName} ${this.symbol} invoice settled: ${invoice.getPaymentRequest()}`);
          this.emit('invoice.settled', invoice.getPaymentRequest());

          deleteSubscription();
        }
      })
      .on('end', () => deleteSubscription())
      .on('error', (error) => {
        this.logger.error(`${LndClient.serviceName} ${this.symbol} invoice subscription errored: ${error.message}`);
        deleteSubscription();
      });
  }

  private handleSubscriptionError = async (subscriptionName: string, error: any) => {
    this.logger.error(`${LndClient.serviceName} ${this.symbol} ${subscriptionName} subscription errored: ${formatError(error)}`);

    if (this.status === ClientStatus.Connected) {
      this.emit('subscription.error');
      await this.reconnect();
    }
  }

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
  }

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
  }

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
        await this.handleSubscriptionError('channel backup', error);
      });
  }

  private calculatePaymentFee = (invoice: string): number => {
    const invoiceAmt = bolt11.decode(invoice).satoshis || 0;

    return Math.max(
      Math.ceil(invoiceAmt * LndClient.maxPaymentFeeRatio),
      LndClient.minPaymentFee,
    );
  }
}

export default LndClient;
export { LndConfig };
