import {
  ChannelCredentials,
  ClientReadableStream,
  Metadata,
  credentials,
} from '@grpc/grpc-js';
import fs from 'fs';
import BaseClient from '../BaseClient';
import Logger from '../Logger';
import { formatError, getHexBuffer, splitChannelPoint } from '../Utils';
import { ClientStatus } from '../consts/Enums';
import { NodeType } from '../db/models/ReverseSwap';
import { InvoicesClient } from '../proto/lnd/invoices_grpc_pb';
import * as invoicesrpc from '../proto/lnd/invoices_pb';
import { RouterClient } from '../proto/lnd/router_grpc_pb';
import * as routerrpc from '../proto/lnd/router_pb';
import { LightningClient as LndLightningClient } from '../proto/lnd/rpc_grpc_pb';
import * as lndrpc from '../proto/lnd/rpc_pb';
import { WalletBalance } from '../wallet/providers/WalletProviderInterface';
import { satToMsat } from './ChannelUtils';
import Errors from './Errors';
import { grpcOptions, unaryCall } from './GrpcUtils';
import {
  ChannelInfo,
  DecodedInvoice,
  EventTypes,
  HopHint,
  Htlc,
  HtlcState,
  Invoice,
  InvoiceFeature,
  InvoiceState,
  LightningClient,
  NodeInfo,
  PaymentResponse,
  Route,
  calculatePaymentFee,
} from './LightningClient';

/**
 * The configurable options for the LND client
 */
type LndConfig = {
  host: string;
  port: number;
  certpath: string;
  macaroonpath: string;
  maxPaymentFeeRatio: number;
};

/**
 * A class representing a client to interact with LND
 */
class LndClient extends BaseClient<EventTypes> implements LightningClient {
  public static readonly serviceName = 'LND';

  public static readonly paymentMinFee = 121;
  public static readonly paymentMaxParts = 5;

  private static readonly paymentTimeout = 300;
  private static readonly paymentTimePreference = 0.9;

  public readonly maxPaymentFeeRatio!: number;

  private readonly uri!: string;
  private readonly credentials!: ChannelCredentials;

  private readonly meta!: Metadata;

  private router?: RouterClient;
  private invoices?: InvoicesClient;
  private lightning?: LndLightningClient;

  private peerEventSubscription?: ClientReadableStream<lndrpc.PeerEvent>;
  private channelEventSubscription?: ClientReadableStream<lndrpc.ChannelEventUpdate>;

  /**
   * Create an LND client
   */
  constructor(
    logger: Logger,
    public readonly symbol: string,
    config: LndConfig,
  ) {
    super(logger, symbol);

    const { host, port, certpath, macaroonpath, maxPaymentFeeRatio } = config;

    this.maxPaymentFeeRatio =
      maxPaymentFeeRatio > 0 ? maxPaymentFeeRatio : 0.01;

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

  public get type() {
    return NodeType.LND;
  }

  private throwFilesNotFound = () => {
    throw Errors.COULD_NOT_FIND_FILES(this.symbol, LndClient.serviceName);
  };

  public serviceName = (): string => {
    return LndClient.serviceName;
  };

  /**
   * Returns a boolean determines whether LND is ready or not
   */
  public connect = async (startSubscriptions = true): Promise<boolean> => {
    if (!this.isConnected()) {
      this.router = new RouterClient(this.uri, this.credentials, grpcOptions);
      this.invoices = new InvoicesClient(
        this.uri,
        this.credentials,
        grpcOptions,
      );
      this.lightning = new LndLightningClient(
        this.uri,
        this.credentials,
        grpcOptions,
      );

      try {
        await this.getInfo();

        if (startSubscriptions) {
          this.subscribePeerEvents();
          this.subscribeChannelEvents();
        }

        this.clearReconnectTimer();
        this.setClientStatus(ClientStatus.Connected);
      } catch (error) {
        this.setClientStatus(ClientStatus.Disconnected);

        this.logger.error(
          `Could not connect to ${LndClient.serviceName} ${this.symbol} at ${
            this.uri
          }: ${formatError(error)}`,
        );
        this.logger.info(`Retrying in ${this.RECONNECT_INTERVAL} ms`);

        this.reconnectionTimer = setTimeout(
          this.connect,
          this.RECONNECT_INTERVAL,
        );

        return false;
      }
    }

    return true;
  };

  private reconnect = async () => {
    this.setClientStatus(ClientStatus.Disconnected);

    try {
      await this.getInfo();

      this.logger.info(
        `Reestablished connection to ${LndClient.serviceName} ${this.symbol}`,
      );

      this.clearReconnectTimer();

      this.subscribePeerEvents();
      this.subscribeChannelEvents();

      this.setClientStatus(ClientStatus.Connected);
      this.emit('subscription.reconnected', null);
    } catch (err) {
      this.setClientStatus(ClientStatus.Disconnected);

      this.logger.error(
        `Could not reconnect to ${LndClient.serviceName} ${this.symbol}: ${err}`,
      );
      this.logger.info(`Retrying in ${this.RECONNECT_INTERVAL} ms`);

      this.reconnectionTimer = setTimeout(
        this.reconnect,
        this.RECONNECT_INTERVAL,
      );
    }
  };

  /**
   * End all subscriptions and reconnection attempts.
   */
  public disconnect = (): void => {
    this.clearReconnectTimer();

    if (this.peerEventSubscription) {
      this.peerEventSubscription.cancel();
      this.peerEventSubscription = undefined;
    }

    if (this.channelEventSubscription) {
      this.channelEventSubscription.cancel();
      this.channelEventSubscription = undefined;
    }

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

    this.removeAllListeners();

    this.setClientStatus(ClientStatus.Disconnected);
  };

  private unaryInvoicesCall = <T, U>(
    methodName: keyof InvoicesClient,
    params: T,
  ): Promise<U> => {
    return unaryCall(this.invoices, methodName, params, this.meta, true);
  };

  private unaryRouterCall = <T, U>(
    methodName: keyof RouterClient,
    params: T,
  ): Promise<U> => {
    return unaryCall(this.router, methodName, params, this.meta, true);
  };

  private unaryLightningCall = <T, U>(
    methodName: keyof LndLightningClient,
    params: T,
    toObject = true,
  ): Promise<U> => {
    return unaryCall(this.lightning, methodName, params, this.meta, toObject);
  };

  public getInfo = async (): Promise<NodeInfo> => {
    const info = await this.unaryLightningCall<
      lndrpc.GetInfoRequest,
      lndrpc.GetInfoResponse.AsObject
    >('getInfo', new lndrpc.GetInfoRequest());

    return {
      version: info.version,
      pubkey: info.identityPubkey,
      uris: info.urisList,
      peers: info.numPeers,
      blockHeight: info.blockHeight,
      channels: {
        active: info.numActiveChannels,
        inactive: info.numInactiveChannels,
        pending: info.numPendingChannels,
      },
    };
  };

  /**
   * Creates an invoice
   */
  public addInvoice = (
    value: number,
    expiry?: number,
    memo?: string,
    routingHints?: HopHint[][],
  ): Promise<lndrpc.AddInvoiceResponse.AsObject> => {
    const request = new lndrpc.Invoice();
    request.setValue(value);

    if (expiry) {
      request.setExpiry(expiry);
    }

    if (memo) {
      request.setMemo(memo);
    }

    if (routingHints) {
      request.setRouteHintsList(LndClient.routingHintsToGrpc(routingHints));
    }

    return this.unaryLightningCall<
      lndrpc.Invoice,
      lndrpc.AddInvoiceResponse.AsObject
    >('addInvoice', request);
  };

  /**
   * Creates a hold invoice with the supplied preimage hash
   */
  public addHoldInvoice = async (
    value: number,
    preimageHash: Buffer,
    cltvExpiry?: number,
    expiry?: number,
    memo?: string,
    descriptionHash?: Buffer,
    routingHints?: HopHint[][],
  ): Promise<string> => {
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

    if (descriptionHash) {
      request.setDescriptionHash(descriptionHash);
    }

    if (routingHints) {
      request.setRouteHintsList(LndClient.routingHintsToGrpc(routingHints));
    }

    return (
      await this.unaryInvoicesCall<
        invoicesrpc.AddHoldInvoiceRequest,
        invoicesrpc.AddHoldInvoiceResp.AsObject
      >('addHoldInvoice', request)
    ).paymentRequest;
  };

  public lookupHoldInvoice = async (preimageHash: Buffer): Promise<Invoice> => {
    const res = await this.lookupInvoice(preimageHash);
    return {
      state: LndClient.invoiceStateFromGrpc(res.state),
      htlcs: res.htlcsList.map(LndClient.htlcFromGrpc),
    };
  };

  public lookupInvoice = (
    preimageHash: Buffer,
  ): Promise<lndrpc.Invoice.AsObject> => {
    const request = new lndrpc.PaymentHash();
    request.setRHash(preimageHash);

    return this.unaryLightningCall<lndrpc.PaymentHash, lndrpc.Invoice.AsObject>(
      'lookupInvoice',
      request,
    );
  };

  public trackPayment = (
    preimageHash: Buffer,
    streamUntilFinalStatus: boolean = false,
  ): Promise<lndrpc.Payment.AsObject> => {
    return new Promise<lndrpc.Payment.AsObject>((resolve, reject) => {
      const request = new routerrpc.TrackPaymentRequest();
      request.setNoInflightUpdates(streamUntilFinalStatus);
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
  };

  /**
   * Pay an invoice through the Lightning Network.
   *
   * @param invoice an invoice for a payment within the Lightning Network
   * @param cltvDelta CLTV delta limit for the payment
   * @param outgoingChannelId channel through which the invoice should be paid
   * @param maxPaymentFeeRatio max payment fee ratio to override the default of the client
   */
  public sendPayment = async (
    invoice: string,
    cltvDelta?: number,
    outgoingChannelId?: string,
    maxPaymentFeeRatio?: number,
  ): Promise<PaymentResponse> => {
    const decoded = await this.decodeInvoice(invoice);

    return new Promise<PaymentResponse>((resolve, reject) => {
      const request = new routerrpc.SendPaymentRequest();

      request.setMaxParts(LndClient.paymentMaxParts);
      request.setTimeoutSeconds(LndClient.paymentTimeout);
      request.setTimePref(LndClient.paymentTimePreference);
      request.setFeeLimitSat(
        calculatePaymentFee(
          satToMsat(decoded.value),
          maxPaymentFeeRatio || this.maxPaymentFeeRatio,
          LndClient.paymentMinFee,
        ),
      );

      request.setPaymentRequest(invoice);

      if (cltvDelta) {
        request.setCltvLimit(cltvDelta);
      }

      if (outgoingChannelId) {
        request.setOutgoingChanId(outgoingChannelId);
      }

      const stream = this.router!.sendPaymentV2(request, this.meta);

      stream.on('data', (response: lndrpc.Payment) => {
        switch (response.getStatus()) {
          case lndrpc.Payment.PaymentStatus.SUCCEEDED:
            stream.removeAllListeners();
            stream.destroy();
            resolve({
              feeMsat: response.getFeeMsat(),
              preimage: getHexBuffer(response.getPaymentPreimage()),
            });
            return;

          case lndrpc.Payment.PaymentStatus.FAILED:
            stream.removeAllListeners();
            stream.destroy();
            reject(response.getFailureReason());
            break;
        }
      });

      stream.on('end', () => {
        stream.removeAllListeners();
        stream.destroy();
      });

      stream.on('error', (error) => {
        stream.removeAllListeners();
        stream.destroy();
        reject(error);
      });
    });
  };

  public static formatPaymentFailureReason = (
    reason: lndrpc.PaymentFailureReason,
  ): string => {
    switch (reason) {
      case lndrpc.PaymentFailureReason.FAILURE_REASON_TIMEOUT:
        return 'timeout';
      case lndrpc.PaymentFailureReason.FAILURE_REASON_NO_ROUTE:
        return 'no route';
      case lndrpc.PaymentFailureReason.FAILURE_REASON_INSUFFICIENT_BALANCE:
        return 'insufficient balance';
      case lndrpc.PaymentFailureReason.FAILURE_REASON_INCORRECT_PAYMENT_DETAILS:
        return 'incorrect payment details';
      default:
        return `unknown reason: ${reason.toString()}`;
    }
  };

  public resetMissionControl = () => {
    return this.unaryRouterCall<
      routerrpc.ResetMissionControlRequest,
      routerrpc.ResetMissionControlResponse.AsObject
    >('resetMissionControl', new routerrpc.ResetMissionControlRequest());
  };

  /**
   * Cancel a hold invoice
   */
  public cancelHoldInvoice = async (preimageHash: Buffer): Promise<void> => {
    const request = new invoicesrpc.CancelInvoiceMsg();
    request.setPaymentHash(Uint8Array.from(preimageHash));

    await this.unaryInvoicesCall<
      invoicesrpc.CancelInvoiceMsg,
      invoicesrpc.CancelInvoiceResp.AsObject
    >('cancelInvoice', request);
  };

  /**
   * Settle a hold invoice with an already accepted HTLC
   */
  public settleHoldInvoice = async (preimage: Buffer): Promise<void> => {
    const request = new invoicesrpc.SettleInvoiceMsg();
    request.setPreimage(Uint8Array.from(preimage));

    await this.unaryInvoicesCall<
      invoicesrpc.SettleInvoiceMsg,
      invoicesrpc.SettleInvoiceResp.AsObject
    >('settleInvoice', request);
  };

  /**
   * Queries for a possible route to the target destination
   */
  public queryRoutes = async (
    destination: string,
    amt: number,
    cltvLimit?: number,
    finalCltvDelta?: number,
    routingHints?: HopHint[][],
  ): Promise<Route[]> => {
    const request = new lndrpc.QueryRoutesRequest();
    request.setAmt(amt);
    request.setPubKey(destination);
    request.setUseMissionControl(true);
    request.setTimePref(LndClient.paymentTimePreference);

    if (cltvLimit) {
      request.setCltvLimit(cltvLimit);
    }

    if (finalCltvDelta) {
      request.setFinalCltvDelta(finalCltvDelta);
    }

    if (routingHints) {
      request.setRouteHintsList(LndClient.routingHintsToGrpc(routingHints));
    }

    const res = await this.unaryLightningCall<
      lndrpc.QueryRoutesRequest,
      lndrpc.QueryRoutesResponse.AsObject
    >('queryRoutes', request);

    return res.routesList.map((route) => ({
      ctlv: route.totalTimeLock,
      feesMsat: route.totalFeesMsat,
    }));
  };

  public decodeInvoice = async (invoice: string): Promise<DecodedInvoice> => {
    const res = await this.decodePayReq(invoice);

    const features = new Set<InvoiceFeature>();
    for (const [, feature] of res.featuresMap) {
      switch (feature.name) {
        case 'amp':
          features.add(InvoiceFeature.AMP);
          break;

        case 'multi-path-payments':
          features.add(InvoiceFeature.MPP);
          break;
      }
    }

    return {
      features,
      value: res.numSatoshis,
      cltvExpiry: res.cltvExpiry,
      destination: res.destination,
      paymentHash: getHexBuffer(res.paymentHash),
      routingHints: LndClient.routingHintsFromGrpc(res.routeHintsList),
    };
  };

  /**
   * Decode an encoded payment request
   *
   * @param paymentRequest encoded payment request
   */
  public decodePayReq = (
    paymentRequest: string,
  ): Promise<lndrpc.PayReq.AsObject> => {
    const request = new lndrpc.PayReqString();
    request.setPayReq(paymentRequest);

    return this.unaryLightningCall<lndrpc.PayReqString, lndrpc.PayReq.AsObject>(
      'decodePayReq',
      request,
    );
  };

  public decodePayReqRawResponse = (
    paymentRequest: string,
  ): Promise<lndrpc.PayReq> => {
    const request = new lndrpc.PayReqString();
    request.setPayReq(paymentRequest);

    return this.unaryLightningCall<lndrpc.PayReqString, lndrpc.PayReq>(
      'decodePayReq',
      request,
      false,
    );
  };

  /**
   * Returns the latest advertised, aggregated, and authenticated channel information
   * for the specified node identified by its public key
   */
  public getNodeInfo = (
    publicKey: string,
  ): Promise<lndrpc.NodeInfo.AsObject> => {
    const request = new lndrpc.NodeInfoRequest();
    request.setPubKey(publicKey);
    request.setIncludeChannels(false);

    return this.unaryLightningCall<
      lndrpc.NodeInfoRequest,
      lndrpc.NodeInfo.AsObject
    >('getNodeInfo', request);
  };

  /**
   * Establish a connection to a remote peer
   *
   * @param pubKey identity public key of the remote peer
   * @param host host of the remote peer
   */
  public connectPeer = (
    pubKey: string,
    host: string,
  ): Promise<lndrpc.ConnectPeerResponse.AsObject> => {
    const address = new lndrpc.LightningAddress();
    address.setPubkey(pubKey);
    address.setHost(host);

    const request = new lndrpc.ConnectPeerRequest();
    request.setAddr(address);

    return this.unaryLightningCall<
      lndrpc.ConnectPeerRequest,
      lndrpc.ConnectPeerResponse.AsObject
    >('connectPeer', request);
  };

  /**
   * Sends coins to a particular address
   *
   * @param address address to which coins should be sent
   * @param amount number of satoshis to send
   * @param satPerByte sat/vbyte fee
   * @param label extra comment saved alongside the transaction in the wallet
   */
  public sendCoins = (
    address: string,
    amount: number,
    satPerByte: number | undefined,
    label: string,
  ): Promise<lndrpc.SendCoinsResponse.AsObject> => {
    const request = new lndrpc.SendCoinsRequest();
    request.setAddr(address);
    request.setAmount(amount);
    request.setLabel(label);

    if (satPerByte) {
      request.setSatPerByte(satPerByte);
    }

    return this.unaryLightningCall<
      lndrpc.SendCoinsRequest,
      lndrpc.SendCoinsResponse.AsObject
    >('sendCoins', request);
  };

  /**
   * Sends all coins of the wallet to a particular address
   *
   * @param address address to which coins should be sent
   * @param satPerByte sat/vbyte fee
   * @param label extra comment saved alongside the transaction in the wallet
   */
  public sweepWallet = (
    address: string,
    satPerByte: number | undefined,
    label: string,
  ): Promise<lndrpc.SendCoinsResponse.AsObject> => {
    const request = new lndrpc.SendCoinsRequest();
    request.setAddr(address);
    request.setSendAll(true);
    request.setLabel(label);

    if (satPerByte) {
      request.setSatPerByte(satPerByte);
    }

    return this.unaryLightningCall<
      lndrpc.SendCoinsRequest,
      lndrpc.SendCoinsResponse.AsObject
    >('sendCoins', request);
  };

  /**
   * Returns a list describing all the known transactions relevant to the wallet
   */
  public getOnchainTransactions = (
    startHeight: number,
  ): Promise<lndrpc.TransactionDetails.AsObject> => {
    const request = new lndrpc.GetTransactionsRequest();
    request.setStartHeight(startHeight);

    return this.unaryLightningCall<
      lndrpc.GetTransactionsRequest,
      lndrpc.TransactionDetails.AsObject
    >('getTransactions', request);
  };

  /**
   * Creates a new address
   *
   * @param addressType type of the address
   */
  public newAddress = (
    addressType: lndrpc.AddressType = lndrpc.AddressType.NESTED_PUBKEY_HASH,
  ): Promise<lndrpc.NewAddressResponse.AsObject> => {
    const request = new lndrpc.NewAddressRequest();
    request.setType(addressType);

    return this.unaryLightningCall<
      lndrpc.NewAddressRequest,
      lndrpc.NewAddressResponse.AsObject
    >('newAddress', request);
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

    return this.unaryLightningCall<
      lndrpc.OpenChannelRequest,
      lndrpc.ChannelPoint.AsObject
    >('openChannelSync', request);
  };

  /**
   * Gets a list of all open channels
   */
  public listChannels = async (
    activeOnly = false,
    privateOnly = false,
  ): Promise<ChannelInfo[]> => {
    const request = new lndrpc.ListChannelsRequest();
    request.setActiveOnly(activeOnly);
    request.setPrivateOnly(privateOnly);

    const res = await this.unaryLightningCall<
      lndrpc.ListChannelsRequest,
      lndrpc.ListChannelsResponse.AsObject
    >('listChannels', request);

    return res.channelsList.map((chan) => {
      const { id, vout } = splitChannelPoint(chan.channelPoint);
      return {
        chanId: chan.chanId,
        capacity: chan.capacity,
        private: chan.pb_private,
        fundingTransactionId: id,
        fundingTransactionVout: vout,
        remotePubkey: chan.remotePubkey,
        localBalance: chan.localBalance,
        remoteBalance: chan.remoteBalance,
      };
    });
  };

  /**
   * Gets the latest routing information of a given channel
   */
  public getChannelInfo = (
    channelId: string,
  ): Promise<lndrpc.ChannelEdge.AsObject> => {
    const request = new lndrpc.ChanInfoRequest();
    request.setChanId(channelId);

    return this.unaryLightningCall<
      lndrpc.ChanInfoRequest,
      lndrpc.ChannelEdge.AsObject
    >('getChanInfo', request);
  };

  /**
   * Gets a list of all peers
   */
  public listPeers = (): Promise<lndrpc.ListPeersResponse.AsObject> => {
    return this.unaryLightningCall<
      lndrpc.ListPeersRequest,
      lndrpc.ListPeersResponse.AsObject
    >('listPeers', new lndrpc.ListPeersRequest());
  };

  public getBalance = async (): Promise<WalletBalance> => {
    const res = await this.getWalletBalance();

    return {
      confirmedBalance: res.confirmedBalance,
      unconfirmedBalance: res.unconfirmedBalance,
    };
  };

  /**
   * Gets the balance of the onchain wallet
   */
  public getWalletBalance =
    (): Promise<lndrpc.WalletBalanceResponse.AsObject> => {
      const request = new lndrpc.WalletBalanceRequest();

      return this.unaryLightningCall<
        lndrpc.WalletBalanceRequest,
        lndrpc.WalletBalanceResponse.AsObject
      >('walletBalance', request);
    };

  /**
   * Subscribe to events for a single invoice
   */
  public subscribeSingleInvoice = (preimageHash: Buffer): void => {
    const request = new invoicesrpc.SubscribeSingleInvoiceRequest();
    request.setRHash(Uint8Array.from(preimageHash));

    const invoiceSubscription = this.invoices!.subscribeSingleInvoice(
      request,
      this.meta,
    );

    const deleteSubscription = () => {
      invoiceSubscription.removeAllListeners();
      invoiceSubscription.destroy();
    };

    invoiceSubscription
      .on('data', (invoice: lndrpc.Invoice) => {
        if (invoice.getState() === lndrpc.Invoice.InvoiceState.ACCEPTED) {
          const acceptedHtlcs = invoice
            .getHtlcsList()
            .filter(
              (htlc) => htlc.getState() === lndrpc.InvoiceHTLCState.ACCEPTED,
            );

          this.logger.debug(
            `${LndClient.serviceName} ${this.symbol} accepted ${
              acceptedHtlcs.length
            } HTLC${
              acceptedHtlcs.length > 1 ? 's' : ''
            } for invoice: ${invoice.getPaymentRequest()}`,
          );

          this.emit('htlc.accepted', invoice.getPaymentRequest());

          deleteSubscription();
        } else if (invoice.getState() === lndrpc.Invoice.InvoiceState.SETTLED) {
          this.logger.debug(
            `${LndClient.serviceName} ${
              this.symbol
            } invoice settled: ${invoice.getPaymentRequest()}`,
          );
          this.emit('invoice.settled', invoice.getPaymentRequest());

          deleteSubscription();
        }
      })
      .on('end', () => deleteSubscription())
      .on('error', (error) => {
        this.logger.error(
          `${LndClient.serviceName} ${this.symbol} invoice subscription errored: ${error.message}`,
        );
        deleteSubscription();
      });
  };

  private static routingHintsToGrpc = (
    routingHints: HopHint[][],
  ): lndrpc.RouteHint[] => {
    return routingHints.map((hints) => {
      const routeHint = new lndrpc.RouteHint();
      for (const hint of hints) {
        const hopHint = new lndrpc.HopHint();
        hopHint.setNodeId(hint.nodeId);
        hopHint.setChanId(hint.chanId);
        hopHint.setFeeBaseMsat(hint.feeBaseMsat);
        hopHint.setFeeProportionalMillionths(hint.feeProportionalMillionths);
        hopHint.setCltvExpiryDelta(hint.cltvExpiryDelta);

        routeHint.addHopHints(hopHint);
      }

      return routeHint;
    });
  };

  private static routingHintsFromGrpc = (
    hints: lndrpc.RouteHint.AsObject[],
  ): HopHint[][] => {
    return hints.map((hint) => hint.hopHintsList.map((hop) => hop));
  };

  private static invoiceStateFromGrpc = (
    state: lndrpc.Invoice.InvoiceState,
  ): InvoiceState => {
    switch (state) {
      case lndrpc.Invoice.InvoiceState.OPEN:
        return InvoiceState.Open;
      case lndrpc.Invoice.InvoiceState.ACCEPTED:
        return InvoiceState.Accepted;
      case lndrpc.Invoice.InvoiceState.CANCELED:
        return InvoiceState.Cancelled;
      case lndrpc.Invoice.InvoiceState.SETTLED:
        return InvoiceState.Settled;
    }
  };

  private static htlcFromGrpc = (htlc: lndrpc.InvoiceHTLC.AsObject): Htlc => {
    return {
      valueMsat: htlc.amtMsat,
      state: LndClient.htlcStateFromGrpc(htlc.state),
    };
  };

  private static htlcStateFromGrpc = (
    state: lndrpc.InvoiceHTLCState,
  ): HtlcState => {
    switch (state) {
      case lndrpc.InvoiceHTLCState.ACCEPTED:
        return HtlcState.Accepted;
      case lndrpc.InvoiceHTLCState.CANCELED:
        return HtlcState.Cancelled;
      case lndrpc.InvoiceHTLCState.SETTLED:
        return HtlcState.Settled;
    }
  };

  private handleSubscriptionError = async (
    subscriptionName: string,
    error: any,
  ) => {
    this.logger.error(
      `${LndClient.serviceName} ${
        this.symbol
      } ${subscriptionName} subscription errored: ${formatError(error)}`,
    );

    if (this.isConnected()) {
      this.emit('subscription.error', subscriptionName);
      await this.reconnect();
    }
  };

  private subscribePeerEvents = () => {
    if (this.peerEventSubscription) {
      this.peerEventSubscription.cancel();
    }

    this.peerEventSubscription = this.lightning!.subscribePeerEvents(
      new lndrpc.PeerEventSubscription(),
      this.meta,
    )
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

    this.channelEventSubscription = this.lightning!.subscribeChannelEvents(
      new lndrpc.ChannelEventSubscription(),
      this.meta,
    )
      .on('data', (event: lndrpc.ChannelEventUpdate) => {
        if (
          event.getType() ===
          lndrpc.ChannelEventUpdate.UpdateType.ACTIVE_CHANNEL
        ) {
          this.emit('channel.active', event.getActiveChannel()!.toObject());
        }
      })
      .on('error', async (error) => {
        await this.handleSubscriptionError('channel event', error);
      });
  };
}

export default LndClient;
export { LndConfig };
