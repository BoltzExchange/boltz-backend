import type { ChannelCredentials, ClientReadableStream } from '@grpc/grpc-js';
import { Metadata, credentials } from '@grpc/grpc-js';
import fs from 'fs';
import BaseClient from '../BaseClient';
import type Logger from '../Logger';
import {
  formatError,
  fromProtoInt,
  getHexBuffer,
  splitChannelPoint,
  toOptionalProtoInt,
  toProtoInt,
} from '../Utils';
import { ClientStatus } from '../consts/Enums';
import { NodeType } from '../db/models/ReverseSwap';
import { InvoicesClient } from '../proto/lnd/invoices';
import * as invoicesrpc from '../proto/lnd/invoices';
import { RouterClient } from '../proto/lnd/router';
import * as routerrpc from '../proto/lnd/router';
import { LightningClient as LndLightningClient } from '../proto/lnd/rpc';
import * as lndrpc from '../proto/lnd/rpc';
import type Sidecar from '../sidecar/Sidecar';
import type { WalletBalance } from '../wallet/providers/WalletProviderInterface';
import { msatToSat } from './ChannelUtils';
import Errors from './Errors';
import { grpcOptions, unaryCall } from './GrpcUtils';
import type {
  ChannelInfo,
  DecodedInvoice,
  EventTypes,
  HopHint,
  Htlc,
  Invoice,
  LightningClient,
  NodeInfo,
  PaymentResponse,
  Route,
} from './LightningClient';
import { HtlcState, InvoiceFeature, InvoiceState } from './LightningClient';
import type RoutingFee from './RoutingFee';

/**
 * The configurable options for the LND client
 */
type LndConfig = {
  host: string;
  port: number;
  certpath: string;
  macaroonpath: string;
  sslTargetNameOverride?: string;
};

/**
 * A class representing a client to interact with LND
 */
class LndClient extends BaseClient<EventTypes> implements LightningClient {
  public static readonly serviceName = 'LND';

  public static readonly paymentMaxParts = 6;

  private static readonly paymentTimeout = 300;
  private static readonly paymentTimePreference = 0.9;

  private readonly uri!: string;
  private readonly credentials!: ChannelCredentials;

  private readonly meta!: Metadata;

  private router?: RouterClient;
  private invoices?: InvoicesClient;
  private lightning?: LndLightningClient;

  private peerEventSubscription?: ClientReadableStream<lndrpc.PeerEvent>;
  private channelEventSubscription?: ClientReadableStream<lndrpc.ChannelEventUpdate>;

  public id: string;

  /**
   * Create an LND client
   */
  constructor(
    logger: Logger,
    public readonly symbol: string,
    private readonly config: LndConfig,
    private readonly sidecar: Sidecar,
    private readonly routingFee: RoutingFee,
  ) {
    super(logger, symbol);

    this.id = '';
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

  public get type() {
    return NodeType.LND;
  }

  private throwFilesNotFound = () => {
    throw Errors.COULD_NOT_FIND_FILES(this.symbol, LndClient.serviceName);
  };

  public serviceName = (): string => {
    return LndClient.serviceName;
  };

  private formatNodeLabel = (): string => {
    return `${this.serviceName()}-${this.id || 'unknown'}`;
  };

  /**
   * Returns a boolean determines whether LND is ready or not
   */
  public connect = async (startSubscriptions = true): Promise<boolean> => {
    if (!this.isConnected()) {
      this.router = new RouterClient(
        this.uri,
        this.credentials,
        grpcOptions(this.config.sslTargetNameOverride),
      );
      this.invoices = new InvoicesClient(
        this.uri,
        this.credentials,
        grpcOptions(this.config.sslTargetNameOverride),
      );
      this.lightning = new LndLightningClient(
        this.uri,
        this.credentials,
        grpcOptions(this.config.sslTargetNameOverride),
      );

      try {
        const info = await this.getInfo();
        this.id = info.pubkey;

        if (startSubscriptions) {
          this.subscribePeerEvents();
          this.subscribeChannelEvents();
        }

        this.clearReconnectTimer();
        this.setClientStatus(ClientStatus.Connected);
      } catch (error) {
        this.setClientStatus(ClientStatus.Disconnected);

        this.logger.error(
          `Could not connect ${this.formatNodeLabel()} at ${this.uri}: ${formatError(error)}`,
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
      const info = await this.getInfo();
      this.id = info.pubkey;

      this.logger.info(`Reestablished connection to ${this.formatNodeLabel()}`);

      this.clearReconnectTimer();

      this.subscribePeerEvents();
      this.subscribeChannelEvents();

      this.setClientStatus(ClientStatus.Connected);
      this.emit('subscription.reconnected', null);
    } catch (err) {
      this.setClientStatus(ClientStatus.Disconnected);

      this.logger.error(
        `Could not reconnect ${this.formatNodeLabel()}: ${err}`,
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
    return unaryCall(this.invoices!, methodName, params, this.meta);
  };

  private unaryRouterCall = <T, U>(
    methodName: keyof RouterClient,
    params: T,
  ): Promise<U> => {
    return unaryCall(this.router!, methodName, params, this.meta);
  };

  private unaryLightningCall = <T, U>(
    methodName: keyof LndLightningClient,
    params: T,
  ): Promise<U> => {
    return unaryCall(this.lightning!, methodName, params, this.meta);
  };

  public getInfo = async (): Promise<NodeInfo> => {
    const info = await this.unaryLightningCall<
      lndrpc.GetInfoRequest,
      lndrpc.GetInfoResponse
    >('getInfo', {});

    return {
      version: info.version,
      pubkey: info.identityPubkey,
      uris: info.uris,
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
  ): Promise<lndrpc.AddInvoiceResponse> => {
    const request = lndrpc.Invoice.create({
      value: toProtoInt(value),
      expiry: toOptionalProtoInt(expiry),
      memo: memo ?? '',
      routeHints: routingHints
        ? LndClient.routingHintsToGrpc(routingHints)
        : [],
    });

    return this.unaryLightningCall<lndrpc.Invoice, lndrpc.AddInvoiceResponse>(
      'addInvoice',
      request,
    );
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
    const request = invoicesrpc.AddHoldInvoiceRequest.create({
      value: toProtoInt(value),
      hash: Buffer.from(preimageHash),
      cltvExpiry: toOptionalProtoInt(cltvExpiry),
      expiry: toOptionalProtoInt(expiry),
      memo: memo ?? '',
      descriptionHash: descriptionHash ?? Buffer.alloc(0),
      routeHints: routingHints
        ? LndClient.routingHintsToGrpc(routingHints)
        : [],
    });

    return (
      await this.unaryInvoicesCall<
        invoicesrpc.AddHoldInvoiceRequest,
        invoicesrpc.AddHoldInvoiceResp
      >('addHoldInvoice', request)
    ).paymentRequest;
  };

  public lookupHoldInvoice = async (preimageHash: Buffer): Promise<Invoice> => {
    const res = await this.lookupInvoice(preimageHash);
    return {
      state: LndClient.invoiceStateFromGrpc(res.state),
      htlcs: res.htlcs.map(LndClient.htlcFromGrpc),
    };
  };

  public lookupInvoice = (preimageHash: Buffer): Promise<lndrpc.Invoice> => {
    const request: lndrpc.PaymentHash = {
      ...lndrpc.PaymentHash.create(),
      rHash: preimageHash,
    };

    return this.unaryLightningCall<lndrpc.PaymentHash, lndrpc.Invoice>(
      'lookupInvoice',
      request,
    );
  };

  public trackPayment = (
    preimageHash: Buffer,
    streamUntilFinalStatus: boolean = false,
  ): Promise<lndrpc.Payment> => {
    return new Promise<lndrpc.Payment>((resolve, reject) => {
      const request: routerrpc.TrackPaymentRequest = {
        noInflightUpdates: streamUntilFinalStatus,
        paymentHash: preimageHash,
      };

      const stream = this.router!.trackPaymentV2(request, this.meta);

      const endStream = () => {
        stream.removeAllListeners();
        stream.destroy();
      };

      stream.on('data', (response: lndrpc.Payment) => {
        endStream();
        resolve(response);
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
    timePreference?: number,
  ): Promise<PaymentResponse> => {
    const decoded = await this.sidecar.decodeInvoiceOrOffer(invoice);

    return new Promise<PaymentResponse>((resolve, reject) => {
      const request = routerrpc.SendPaymentRequest.create({
        maxParts: LndClient.paymentMaxParts,
        timeoutSeconds: LndClient.paymentTimeout,
        timePref: timePreference || LndClient.paymentTimePreference,
        feeLimitSat: toProtoInt(
          msatToSat(this.routingFee.calculateFee(decoded, maxPaymentFeeRatio)),
        ),
        paymentRequest: invoice,
        cltvLimit: cltvDelta ?? 0,
        outgoingChanId: outgoingChannelId
          ? toOptionalProtoInt(Number.parseInt(outgoingChannelId, 10))
          : undefined,
      });

      const stream = this.router!.sendPaymentV2(request, this.meta);

      stream.on('data', (response: lndrpc.Payment) => {
        switch (response.status) {
          case lndrpc.Payment_PaymentStatus.SUCCEEDED:
            stream.removeAllListeners();
            stream.destroy();
            resolve({
              feeMsat: fromProtoInt(response.feeMsat),
              preimage: getHexBuffer(response.paymentPreimage),
            });
            return;

          case lndrpc.Payment_PaymentStatus.FAILED:
            stream.removeAllListeners();
            stream.destroy();
            reject(response.failureReason);
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
      routerrpc.ResetMissionControlResponse
    >('resetMissionControl', {});
  };

  /**
   * Cancel a hold invoice
   */
  public cancelHoldInvoice = async (preimageHash: Buffer): Promise<void> => {
    const request: invoicesrpc.CancelInvoiceMsg = {
      ...invoicesrpc.CancelInvoiceMsg.create(),
      paymentHash: Buffer.from(preimageHash),
    };

    await this.unaryInvoicesCall<
      invoicesrpc.CancelInvoiceMsg,
      invoicesrpc.CancelInvoiceResp
    >('cancelInvoice', request);
  };

  /**
   * Settle a hold invoice with an already accepted HTLC
   */
  public settleHoldInvoice = async (preimage: Buffer): Promise<void> => {
    const request: invoicesrpc.SettleInvoiceMsg = {
      ...invoicesrpc.SettleInvoiceMsg.create(),
      preimage: Buffer.from(preimage),
    };

    await this.unaryInvoicesCall<
      invoicesrpc.SettleInvoiceMsg,
      invoicesrpc.SettleInvoiceResp
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
    const request: lndrpc.QueryRoutesRequest = {
      ...lndrpc.QueryRoutesRequest.create(),
      amt: toProtoInt(amt),
      pubKey: destination,
      useMissionControl: true,
      timePref: LndClient.paymentTimePreference,
      cltvLimit: cltvLimit ?? 0,
      finalCltvDelta: finalCltvDelta ?? 0,
      routeHints: routingHints
        ? LndClient.routingHintsToGrpc(routingHints)
        : [],
    };

    const res = await this.unaryLightningCall<
      lndrpc.QueryRoutesRequest,
      lndrpc.QueryRoutesResponse
    >('queryRoutes', request);

    return res.routes.map((route) => ({
      ctlv: route.totalTimeLock,
      feesMsat: fromProtoInt(route.totalFeesMsat),
    }));
  };

  public decodeInvoice = async (invoice: string): Promise<DecodedInvoice> => {
    const res = await this.decodePayReq(invoice);

    const features = new Set<InvoiceFeature>();
    for (const feature of Object.values(res.features)) {
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
      value: fromProtoInt(res.numSatoshis),
      cltvExpiry: fromProtoInt(res.cltvExpiry),
      destination: res.destination,
      paymentHash: getHexBuffer(res.paymentHash),
      routingHints: LndClient.routingHintsFromGrpc(res.routeHints),
    };
  };

  /**
   * Decode an encoded payment request
   *
   * @param paymentRequest encoded payment request
   */
  public decodePayReq = (paymentRequest: string): Promise<lndrpc.PayReq> => {
    const request: lndrpc.PayReqString = {
      payReq: paymentRequest,
    };

    return this.unaryLightningCall<lndrpc.PayReqString, lndrpc.PayReq>(
      'decodePayReq',
      request,
    );
  };

  public decodePayReqRawResponse = (
    paymentRequest: string,
  ): Promise<lndrpc.PayReq> => {
    return this.decodePayReq(paymentRequest);
  };

  /**
   * Returns the latest advertised, aggregated, and authenticated channel information
   * for the specified node identified by its public key
   */
  public getNodeInfo = (publicKey: string): Promise<lndrpc.NodeInfo> => {
    const request: lndrpc.NodeInfoRequest = {
      ...lndrpc.NodeInfoRequest.create(),
      pubKey: publicKey,
      includeChannels: false,
      includeAuthProof: false,
    };

    return this.unaryLightningCall<lndrpc.NodeInfoRequest, lndrpc.NodeInfo>(
      'getNodeInfo',
      request,
    );
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
  ): Promise<lndrpc.ConnectPeerResponse> => {
    const request: lndrpc.ConnectPeerRequest = {
      ...lndrpc.ConnectPeerRequest.create(),
      addr: {
        pubkey: pubKey,
        host,
      },
    };

    return this.unaryLightningCall<
      lndrpc.ConnectPeerRequest,
      lndrpc.ConnectPeerResponse
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
  ): Promise<lndrpc.SendCoinsResponse> => {
    const request = lndrpc.SendCoinsRequest.create({
      addr: address,
      amount: toProtoInt(amount),
      label,
      satPerByte: toOptionalProtoInt(satPerByte),
    });

    return this.unaryLightningCall<
      lndrpc.SendCoinsRequest,
      lndrpc.SendCoinsResponse
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
  ): Promise<lndrpc.SendCoinsResponse> => {
    const request = lndrpc.SendCoinsRequest.create({
      addr: address,
      sendAll: true,
      label,
      satPerByte: toOptionalProtoInt(satPerByte),
    });

    return this.unaryLightningCall<
      lndrpc.SendCoinsRequest,
      lndrpc.SendCoinsResponse
    >('sendCoins', request);
  };

  /**
   * Returns a list describing all the known transactions relevant to the wallet
   */
  public getOnchainTransactions = (
    startHeight: number,
  ): Promise<lndrpc.TransactionDetails> => {
    const request: lndrpc.GetTransactionsRequest = {
      ...lndrpc.GetTransactionsRequest.create(),
      startHeight,
    };

    return this.unaryLightningCall<
      lndrpc.GetTransactionsRequest,
      lndrpc.TransactionDetails
    >('getTransactions', request);
  };

  /**
   * Creates a new address
   *
   * @param addressType type of the address
   */
  public newAddress = (
    addressType: lndrpc.AddressType = lndrpc.AddressType.NESTED_PUBKEY_HASH,
  ): Promise<lndrpc.NewAddressResponse> => {
    const request: lndrpc.NewAddressRequest = {
      ...lndrpc.NewAddressRequest.create(),
      type: addressType,
      account: '',
    };

    return this.unaryLightningCall<
      lndrpc.NewAddressRequest,
      lndrpc.NewAddressResponse
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
  ): Promise<lndrpc.ChannelPoint> => {
    const request: lndrpc.OpenChannelRequest = {
      ...lndrpc.OpenChannelRequest.create(),
      private: privateChannel,
      nodePubkeyString: pubKey,
      localFundingAmount: toProtoInt(fundingAmount),
      satPerByte: toProtoInt(satPerByte),
    };

    return this.unaryLightningCall<
      lndrpc.OpenChannelRequest,
      lndrpc.ChannelPoint
    >('openChannelSync', request);
  };

  /**
   * Gets a list of all open channels
   */
  public listChannels = async (
    activeOnly = false,
    privateOnly = false,
  ): Promise<ChannelInfo[]> => {
    const request: lndrpc.ListChannelsRequest = {
      ...lndrpc.ListChannelsRequest.create(),
      activeOnly,
      privateOnly,
    };

    const res = await this.unaryLightningCall<
      lndrpc.ListChannelsRequest,
      lndrpc.ListChannelsResponse
    >('listChannels', request);

    return res.channels.map((chan) => {
      const { id, vout } = splitChannelPoint(chan.channelPoint);
      return {
        chanId: chan.chanId.toString(),
        capacity: fromProtoInt(chan.capacity),
        private: chan.private,
        fundingTransactionId: id,
        fundingTransactionVout: vout,
        remotePubkey: chan.remotePubkey,
        localBalance: fromProtoInt(chan.localBalance),
        remoteBalance: fromProtoInt(chan.remoteBalance),
        htlcs: chan.pendingHtlcs.map((htlc) => ({
          preimageHash: Buffer.from(htlc.hashLock),
        })),
      };
    });
  };

  /**
   * Gets the latest routing information of a given channel
   */
  public getChannelInfo = (channelId: string): Promise<lndrpc.ChannelEdge> => {
    const request: lndrpc.ChanInfoRequest = {
      ...lndrpc.ChanInfoRequest.create(),
      chanId: channelId,
      includeAuthProof: false,
    };

    return this.unaryLightningCall<lndrpc.ChanInfoRequest, lndrpc.ChannelEdge>(
      'getChanInfo',
      request,
    );
  };

  /**
   * Gets a list of all peers
   */
  public listPeers = (): Promise<lndrpc.ListPeersResponse> => {
    return this.unaryLightningCall<
      lndrpc.ListPeersRequest,
      lndrpc.ListPeersResponse
    >('listPeers', lndrpc.ListPeersRequest.create());
  };

  public getBalance = async (): Promise<WalletBalance> => {
    const res = await this.getWalletBalance();

    return {
      confirmedBalance: fromProtoInt(res.confirmedBalance),
      unconfirmedBalance: fromProtoInt(res.unconfirmedBalance),
    };
  };

  /**
   * Gets the balance of the onchain wallet
   */
  public getWalletBalance = (): Promise<lndrpc.WalletBalanceResponse> => {
    return this.unaryLightningCall<
      lndrpc.WalletBalanceRequest,
      lndrpc.WalletBalanceResponse
    >('walletBalance', lndrpc.WalletBalanceRequest.create());
  };

  /**
   * Subscribe to events for a single invoice
   */
  public subscribeSingleInvoice = (preimageHash: Buffer): void => {
    const request: invoicesrpc.SubscribeSingleInvoiceRequest = {
      ...invoicesrpc.SubscribeSingleInvoiceRequest.create(),
      rHash: Buffer.from(preimageHash),
    };

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
        if (invoice.state === lndrpc.Invoice_InvoiceState.ACCEPTED) {
          const acceptedHtlcs = invoice.htlcs.filter(
            (htlc) => htlc.state === lndrpc.InvoiceHTLCState.ACCEPTED,
          );

          this.logger.debug(
            `${this.formatNodeLabel()} accepted ${acceptedHtlcs.length} HTLC${
              acceptedHtlcs.length > 1 ? 's' : ''
            } for invoice: ${invoice.paymentRequest}`,
          );

          this.emit('htlc.accepted', invoice.paymentRequest);

          deleteSubscription();
        } else if (invoice.state === lndrpc.Invoice_InvoiceState.SETTLED) {
          this.logger.debug(
            `${this.formatNodeLabel()} invoice settled: ${invoice.paymentRequest}`,
          );
          this.emit('invoice.settled', invoice.paymentRequest);

          deleteSubscription();
        }
      })
      .on('end', () => deleteSubscription())
      .on('error', (error) => {
        this.logger.error(
          `${this.formatNodeLabel()} invoice subscription errored: ${error.message}`,
        );
        deleteSubscription();
      });
  };

  private static routingHintsToGrpc = (
    routingHints: HopHint[][],
  ): lndrpc.RouteHint[] => {
    return routingHints.map((hints) => ({
      hopHints: hints.map((hint) => ({
        nodeId: hint.nodeId,
        chanId: hint.chanId,
        feeBaseMsat: hint.feeBaseMsat,
        feeProportionalMillionths: hint.feeProportionalMillionths,
        cltvExpiryDelta: hint.cltvExpiryDelta,
      })),
    }));
  };

  private static routingHintsFromGrpc = (
    hints: lndrpc.RouteHint[],
  ): HopHint[][] => {
    return hints.map((hint) =>
      hint.hopHints.map((hop) => ({
        nodeId: hop.nodeId,
        chanId: hop.chanId.toString(),
        feeBaseMsat: hop.feeBaseMsat,
        feeProportionalMillionths: hop.feeProportionalMillionths,
        cltvExpiryDelta: hop.cltvExpiryDelta,
      })),
    );
  };

  private static invoiceStateFromGrpc = (
    state: lndrpc.Invoice_InvoiceState,
  ): InvoiceState => {
    switch (state) {
      case lndrpc.Invoice_InvoiceState.OPEN:
        return InvoiceState.Open;
      case lndrpc.Invoice_InvoiceState.ACCEPTED:
        return InvoiceState.Accepted;
      case lndrpc.Invoice_InvoiceState.CANCELED:
        return InvoiceState.Cancelled;
      case lndrpc.Invoice_InvoiceState.SETTLED:
        return InvoiceState.Settled;
      case lndrpc.Invoice_InvoiceState.UNRECOGNIZED:
        throw new Error('unknown invoice state');
    }
  };

  private static htlcFromGrpc = (htlc: lndrpc.InvoiceHTLC): Htlc => {
    return {
      valueMsat: fromProtoInt(htlc.amtMsat),
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
      case lndrpc.InvoiceHTLCState.UNRECOGNIZED:
        throw new Error('unknown HTLC state');
    }
  };

  private handleSubscriptionError = async (
    subscriptionName: string,
    error: any,
  ) => {
    this.logger.error(
      `${this.formatNodeLabel()} ${subscriptionName} subscription errored: ${formatError(error)}`,
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
      {},
      this.meta,
    )
      .on('data', (event: lndrpc.PeerEvent) => {
        if (event.type === lndrpc.PeerEvent_EventType.PEER_ONLINE) {
          this.emit('peer.online', event.pubKey);
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
      {},
      this.meta,
    )
      .on('data', (event: lndrpc.ChannelEventUpdate) => {
        if (
          event.type === lndrpc.ChannelEventUpdate_UpdateType.ACTIVE_CHANNEL
        ) {
          this.emit('channel.active', event.activeChannel!);
        }
      })
      .on('error', async (error) => {
        await this.handleSubscriptionError('channel event', error);
      });
  };
}

export default LndClient;
export { LndConfig };
