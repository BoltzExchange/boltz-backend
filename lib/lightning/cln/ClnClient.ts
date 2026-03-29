import type { ChannelCredentials, ClientReadableStream } from '@grpc/grpc-js';
import { Metadata } from '@grpc/grpc-js';
import BaseClient from '../../BaseClient';
import type Logger from '../../Logger';
import {
  formatError,
  fromOptionalProtoInt,
  fromProtoInt,
  getHexBuffer,
  getHexString,
  toOptionalProtoInt,
  toProtoInt,
} from '../../Utils';
import { ClientStatus } from '../../consts/Enums';
import { NodeType } from '../../db/models/ReverseSwap';
import {
  ListfundsOutputs_ListfundsOutputsStatus,
  ListpaysPays_ListpaysPaysStatus,
  NodeClient,
} from '../../proto/cln/node';
import type * as noderpc from '../../proto/cln/node';
import * as primitivesrpc from '../../proto/cln/primitives';
import { HoldClient } from '../../proto/hold/hold';
import * as holdrpc from '../../proto/hold/hold';
import type Sidecar from '../../sidecar/Sidecar';
import type { WalletBalance } from '../../wallet/providers/WalletProviderInterface';
import { msatToSat, satToMsat, scidClnToLnd } from '../ChannelUtils';
import Errors from '../Errors';
import { grpcOptions, unaryCall } from '../GrpcUtils';
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
  RoutingHintsProvider,
} from '../LightningClient';
import { HtlcState, InvoiceFeature, InvoiceState } from '../LightningClient';
import type RoutingFee from '../RoutingFee';
import { getRoute } from './Router';
import { ClnConfig, createSsl } from './Types';

class ClnClient
  extends BaseClient<EventTypes>
  implements LightningClient, RoutingHintsProvider
{
  public static readonly serviceName = 'CLN';
  public static readonly serviceNameHold = 'hold';
  public static readonly moddedVersionSuffix = '-';

  public static readonly paymentPendingError = 'payment already pending';
  public static readonly paymentAllAttemptsFailed = 'all attempts failed';

  private static readonly paymentTimeout = 30;

  private readonly disableMpp: boolean;

  private readonly nodeUri: string;
  private readonly holdUri: string;

  private nodeClient?: NodeClient;
  private readonly nodeCreds: ChannelCredentials;
  private readonly nodeMeta = new Metadata();

  private holdClient?: HoldClient;
  private readonly holdCreds: ChannelCredentials;
  private readonly holdMeta = new Metadata();

  private trackAllSubscription?: ClientReadableStream<holdrpc.TrackAllResponse>;
  private holdInvoicesToSubscribe = new Set<string>();

  public id: string;

  constructor(
    logger: Logger,
    public readonly symbol: string,
    config: ClnConfig,
    private readonly sidecar: Sidecar,
    private readonly routingFee: RoutingFee,
  ) {
    super(logger, symbol);

    this.id = '';
    this.disableMpp = config.disableMpp ?? false;

    if (this.disableMpp) {
      this.logger.info(
        `Multi-path payments disabled for ${ClnClient.serviceName}`,
      );
    }

    this.nodeCreds = createSsl(ClnClient.serviceName, symbol, config);
    this.holdCreds = createSsl(ClnClient.serviceNameHold, symbol, config.hold);

    this.nodeUri = `${config.host}:${config.port}`;
    this.holdUri = `${config.hold.host}:${config.hold.port}`;
  }

  public get type() {
    return NodeType.CLN;
  }

  public static isRpcError = (error: any): boolean => {
    return (
      typeof error === 'object' &&
      typeof (error as any).details === 'string' &&
      (error as any).details !== ''
    );
  };

  public static formatPaymentFailureReason = (error: {
    details: string;
  }): string => {
    const split = error.details.split('"');
    if (split.length !== 3) {
      return error.details;
    }

    return split[1];
  };

  public static errIsIncorrectPaymentDetails = (err: string): boolean => {
    return (
      err.includes('WIRE_INCORRECT_OR_UNKNOWN_PAYMENT_DETAILS') ||
      err.includes('incorrect_or_unknown_payment_details')
    );
  };

  public serviceName = (): string => {
    return ClnClient.serviceName;
  };

  public connect = async (): Promise<boolean> => {
    if (!this.isConnected()) {
      this.nodeClient = new NodeClient(
        this.nodeUri,
        this.nodeCreds,
        grpcOptions('cln'),
      );

      this.holdClient = new HoldClient(
        this.holdUri,
        this.holdCreds,
        grpcOptions('hold'),
      );

      try {
        const info = await this.getInfo();
        this.id = info.pubkey;

        this.setClientStatus(ClientStatus.Connected);
      } catch (error) {
        this.setClientStatus(ClientStatus.Disconnected);

        this.logger.error(
          `Could not connect to ${ClnClient.serviceName} ${
            this.symbol
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

  public disconnect = (): void => {
    this.clearReconnectTimer();

    if (this.trackAllSubscription) {
      this.trackAllSubscription.cancel();
      this.trackAllSubscription = undefined;
    }

    if (this.holdClient) {
      this.holdClient.close();
      this.holdClient = undefined;
    }

    this.removeAllListeners();

    this.setClientStatus(ClientStatus.Disconnected);
  };

  private reconnect = async () => {
    this.setClientStatus(ClientStatus.Disconnected);

    try {
      const info = await this.getInfo();
      this.id = info.pubkey;

      this.logger.info(
        `Reestablished connection to ${ClnClient.serviceName} ${this.symbol}`,
      );

      this.clearReconnectTimer();

      this.subscribeTrackHoldInvoices();

      this.setClientStatus(ClientStatus.Connected);
      this.emit('subscription.reconnected', null);
    } catch (err) {
      this.setClientStatus(ClientStatus.Disconnected);

      this.logger.error(
        `Could not reconnect to ${ClnClient.serviceName} ${this.symbol}: ${err}`,
      );
      this.logger.info(`Retrying in ${this.RECONNECT_INTERVAL} ms`);

      this.reconnectionTimer = setTimeout(
        this.reconnect,
        this.RECONNECT_INTERVAL,
      );
    }
  };

  public getInfo = async (): Promise<NodeInfo> => {
    const info = await this.unaryNodeCall<
      noderpc.GetinfoRequest,
      noderpc.GetinfoResponse
    >('getinfo', {});

    const pubkey = getHexString(info.id);

    return {
      pubkey,
      version: info.version,
      uris: info.address
        .filter(
          (address) => address.address !== undefined && address.address !== '',
        )
        .map((address) => `${pubkey}@${address.address}:${address.port}`),
      peers: info.numPeers,
      blockHeight: info.blockheight,
      channels: {
        active: info.numActiveChannels,
        inactive: info.numInactiveChannels,
        pending: info.numPendingChannels,
      },
    };
  };

  public getBalance = async (): Promise<WalletBalance> => {
    const sumOutputs = (
      outs: noderpc.ListfundsOutputs[],
      status: ListfundsOutputs_ListfundsOutputsStatus,
    ) =>
      outs
        .filter((out) => !out.reserved)
        .filter((out) => out.status === status)
        .reduce(
          (sum, out) =>
            sum + msatToSat(fromProtoInt(out.amountMsat?.msat ?? 0)),
          0,
        );

    const res = await this.listFunds();

    return {
      confirmedBalance: sumOutputs(
        res.outputs,
        ListfundsOutputs_ListfundsOutputsStatus.CONFIRMED,
      ),
      unconfirmedBalance: sumOutputs(
        res.outputs,
        ListfundsOutputs_ListfundsOutputsStatus.UNCONFIRMED,
      ),
    };
  };

  public listFunds = (): Promise<noderpc.ListfundsResponse> => {
    const req: noderpc.ListfundsRequest = {
      spent: false,
    };

    return this.unaryNodeCall<
      noderpc.ListfundsRequest,
      noderpc.ListfundsResponse
    >('listFunds', req);
  };

  public getHoldInfo = (): Promise<holdrpc.GetInfoResponse> => {
    return this.unaryHoldCall<holdrpc.GetInfoRequest, holdrpc.GetInfoResponse>(
      'getInfo',
      {},
    );
  };

  public listChannels = async (
    activeOnly = false,
    privateOnly = false,
  ): Promise<ChannelInfo[]> => {
    const res = await this.unaryNodeCall<
      noderpc.ListpeerchannelsRequest,
      noderpc.ListpeerchannelsResponse
    >('listPeerChannels', {});

    return res.channels
      .filter(
        (chan) =>
          chan.shortChannelId !== undefined && chan.shortChannelId !== '',
      )
      .filter(
        (chan) =>
          !activeOnly ||
          (chan.peerConnected &&
            chan.state === primitivesrpc.ChannelState.ChanneldNormal),
      )
      .filter((chan) => !privateOnly || chan.private)
      .map((chan) => {
        return {
          private: chan.private ?? false,
          fundingTransactionId: getHexString(
            chan.fundingTxid ?? Buffer.alloc(0),
          ),
          capacity: msatToSat(fromProtoInt(chan.totalMsat?.msat ?? 0)),
          chanId: scidClnToLnd(chan.shortChannelId!),
          fundingTransactionVout: chan.fundingOutnum!,
          localBalance: msatToSat(fromProtoInt(chan.spendableMsat?.msat ?? 0)),
          remoteBalance: msatToSat(
            fromProtoInt(chan.receivableMsat?.msat ?? 0),
          ),
          remotePubkey: getHexString(chan.peerId),
          htlcs: chan.htlcs.map((htlc) => ({
            preimageHash: htlc.paymentHash,
          })),
        };
      });
  };

  public stop = (): void => {
    // Just here for interface compatibility
  };

  public routingHints = async (node: string): Promise<HopHint[][]> => {
    const req: noderpc.ListpeerchannelsRequest = {
      id: getHexBuffer(node),
    };

    const channels = await this.unaryNodeCall<
      noderpc.ListpeerchannelsRequest,
      noderpc.ListpeerchannelsResponse
    >('listPeerChannels', req);

    return channels.channels
      .filter((chan) => chan.private)
      .map((channel) => [
        {
          nodeId: node,
          chanId: scidClnToLnd(channel.shortChannelId!),
          feeBaseMsat:
            fromOptionalProtoInt(channel.updates?.remote?.feeBaseMsat?.msat) ||
            0,
          feeProportionalMillionths:
            channel.updates?.remote?.feeProportionalMillionths || 0,
          cltvExpiryDelta: channel.updates?.remote?.cltvExpiryDelta || 0,
        },
      ]);
  };

  public addHoldInvoice = async (
    value: number,
    preimageHash: Buffer,
    cltvExpiry?: number,
    expiry?: number,
    memo?: string,
    descriptionHash?: Buffer,
    routingHints?: HopHint[][],
  ): Promise<string> => {
    const req = holdrpc.InvoiceRequest.create({
      paymentHash: preimageHash,
      amountMsat: toProtoInt(satToMsat(value)),
      memo,
      hash: descriptionHash,
      expiry: toOptionalProtoInt(expiry),
      minFinalCltvExpiry: toOptionalProtoInt(cltvExpiry),
      routingHints: routingHints
        ? ClnClient.routingHintsToGrpc(routingHints)
        : [],
    });

    return (
      await this.unaryHoldCall<holdrpc.InvoiceRequest, holdrpc.InvoiceResponse>(
        'invoice',
        req,
      )
    ).bolt11;
  };

  public lookupHoldInvoice = async (preimageHash: Buffer): Promise<Invoice> => {
    const req: holdrpc.ListRequest = {
      paymentHash: preimageHash,
    };

    const res = await this.unaryHoldCall<
      holdrpc.ListRequest,
      holdrpc.ListResponse
    >('list', req);
    if (res.invoices.length === 0) {
      throw Errors.INVOICE_NOT_FOUND();
    }

    const invoice = res.invoices[0];

    return {
      state: ClnClient.invoiceStateFromGrpc(invoice.state),
      htlcs: invoice.htlcs.map(ClnClient.htlcFromGrpc),
    };
  };

  public cancelHoldInvoice = async (preimageHash: Buffer): Promise<void> => {
    const req: holdrpc.CancelRequest = {
      paymentHash: preimageHash,
    };

    await this.unaryHoldCall<holdrpc.CancelRequest, holdrpc.CancelResponse>(
      'cancel',
      req,
    );
  };

  public settleHoldInvoice = async (preimage: Buffer): Promise<void> => {
    const req: holdrpc.SettleRequest = {
      paymentPreimage: preimage,
    };

    await this.unaryHoldCall<holdrpc.SettleRequest, holdrpc.SettleResponse>(
      'settle',
      req,
    );
  };

  public injectHoldInvoice = async (invoice: string, minCltvExpiry: number) => {
    const req = holdrpc.InjectRequest.create({
      invoice,
      minCltvExpiry: toOptionalProtoInt(minCltvExpiry),
    });

    await this.unaryHoldCall<holdrpc.InjectRequest, holdrpc.InjectResponse>(
      'inject',
      req,
    );
  };

  public decodeInvoice = async (
    invoice: string,
  ): Promise<
    DecodedInvoice & {
      type: noderpc.DecodeResponse_DecodeType;
      valueMsat: number;
    }
  > => {
    // Just to make sure CLN can parse the invoice
    const req: noderpc.DecodeRequest = {
      string: invoice,
    };

    const dec = await this.unaryNodeCall<
      noderpc.DecodeRequest,
      noderpc.DecodeResponse
    >('decode', req);

    const features = new Set<InvoiceFeature>();
    // We can assume that everyone supports MPP now
    features.add(InvoiceFeature.MPP);

    const routingHints: HopHint[][] = (dec.routes?.hints || []).map((route) =>
      route.hops.map((hint) => ({
        cltvExpiryDelta: hint.cltvExpiryDelta,
        feeBaseMsat: fromOptionalProtoInt(hint.feeBaseMsat?.msat) || 0,
        chanId: scidClnToLnd(hint.shortChannelId),
        feeProportionalMillionths: hint.feeProportionalMillionths,
        nodeId: getHexString(hint.pubkey),
      })),
    );

    const valueMsat =
      fromOptionalProtoInt(
        dec.amountMsat?.msat ||
          dec.invoiceAmountMsat?.msat ||
          dec.invreqAmountMsat?.msat,
      ) || 0;

    return {
      features,
      valueMsat,
      routingHints,
      type: dec.itemType,
      value: msatToSat(valueMsat || 0),
      cltvExpiry: dec.minFinalCltvExpiry || 0,
      destination: getHexString(
        dec.payee || dec.offerIssuerId || dec.invoiceNodeId || Buffer.alloc(0),
      ),
      paymentHash: dec.paymentHash ?? Buffer.alloc(0),
    };
  };

  public queryRoutes = async (
    destination: string,
    amt: number,
    cltvLimit?: number,
    finalCltvDelta?: number,
    routingHints?: HopHint[][],
  ): Promise<Route[]> => {
    const prms: Promise<Route>[] = [
      getRoute(this.unaryNodeCall, destination, amt, cltvLimit, finalCltvDelta),
    ];

    if (routingHints) {
      routingHints.forEach((hint) => {
        const hintCtlvs = hint.reduce(
          (sum, hint) => sum + hint.cltvExpiryDelta,
          0,
        );
        prms.push(
          getRoute(
            this.unaryNodeCall,
            hint[0].nodeId,
            amt,
            cltvLimit,
            (finalCltvDelta || 0) + hintCtlvs,
          ),
        );
      });
    }

    const routes = (await Promise.allSettled(prms))
      .filter(
        (res): res is PromiseFulfilledResult<Route> =>
          res.status === 'fulfilled',
      )
      .map((res) => res.value);

    if (routes.length === 0) {
      throw Errors.NO_ROUTE();
    }

    return routes;
  };

  // TODO: support for setting outgoing channel id
  public sendPayment = async (
    invoice: string,
    cltvDelta?: number,
    _?: string,
    maxPaymentFeeRatio?: number,
  ): Promise<PaymentResponse> => {
    try {
      const payStatus = await this.checkPayStatus(invoice);
      if (payStatus !== undefined) {
        return payStatus;
      }
    } catch (e) {
      // When all attempts failed, we are ready for another try
      if (e !== ClnClient.paymentAllAttemptsFailed) {
        throw e;
      }
    }

    const decoded = await this.sidecar.decodeInvoiceOrOffer(invoice);

    const req: noderpc.XpayRequest = {
      invstring: invoice,
      retryFor: ClnClient.paymentTimeout,
      layers: this.disableMpp ? ['auto.no_mpp_support'] : [],
      maxfee: {
        msat: toProtoInt(
          this.routingFee.calculateFee(decoded, maxPaymentFeeRatio),
        ),
      },
      maxdelay: cltvDelta,
    };

    try {
      const res = await this.unaryNodeCall<
        noderpc.XpayRequest,
        noderpc.XpayResponse
      >('xpay', req);

      const fee =
        BigInt(res.amountSentMsat?.msat ?? 0) - BigInt(decoded.amountMsat);

      return {
        feeMsat: Number(fee),
        preimage: res.paymentPreimage,
      };
    } catch (e) {
      throw this.parseError(e);
    }
  };

  public subscribeSingleInvoice = (preimageHash: Buffer): void => {
    // That call is only used to get the last update of relevant invoices
    // when starting the subscription for *all* hold invoices
    if (this.trackAllSubscription !== undefined) {
      return;
    }

    this.holdInvoicesToSubscribe.add(
      ClnClient.holdInvoiceSubscriptionKey(preimageHash),
    );
  };

  private static routingHintsToGrpc = (
    routingHints: HopHint[][],
  ): holdrpc.RoutingHint[] => {
    return routingHints.map((hints) => ({
      hops: hints.map((hint) => ({
        publicKey: getHexBuffer(hint.nodeId),
        shortChannelId: hint.chanId,
        baseFee: toProtoInt(hint.feeBaseMsat),
        ppmFee: toProtoInt(hint.feeProportionalMillionths),
        cltvExpiryDelta: toProtoInt(hint.cltvExpiryDelta),
      })),
    }));
  };

  private static invoiceStateFromGrpc = (
    state: holdrpc.InvoiceState,
  ): InvoiceState => {
    switch (state) {
      case holdrpc.InvoiceState.UNPAID:
        return InvoiceState.Open;
      case holdrpc.InvoiceState.ACCEPTED:
        return InvoiceState.Accepted;
      case holdrpc.InvoiceState.CANCELLED:
        return InvoiceState.Cancelled;
      case holdrpc.InvoiceState.PAID:
        return InvoiceState.Settled;
      case holdrpc.InvoiceState.UNRECOGNIZED:
        throw new Error('unknown invoice state');
    }
  };

  private static htlcFromGrpc = (htlc: holdrpc.Htlc): Htlc => {
    return {
      valueMsat: fromProtoInt(htlc.msat),
      state: ClnClient.htlcStateFromGrpc(htlc.state),
    };
  };

  private static htlcStateFromGrpc = (
    state: holdrpc.InvoiceState,
  ): HtlcState => {
    switch (state) {
      case holdrpc.InvoiceState.UNPAID:
        throw new Error('invalid HTLC state');
      case holdrpc.InvoiceState.ACCEPTED:
        return HtlcState.Accepted;
      case holdrpc.InvoiceState.CANCELLED:
        return HtlcState.Cancelled;
      case holdrpc.InvoiceState.PAID:
        return HtlcState.Settled;
      case holdrpc.InvoiceState.UNRECOGNIZED:
        throw new Error('unknown HTLC state');
    }
  };

  public checkPayStatus = async (
    invoice: string,
  ): Promise<PaymentResponse | undefined> => {
    const { decoded, pays } = await this.listPays(invoice);
    return this.checkListPaysStatus(decoded, pays);
  };

  public checkListPaysStatus = async (
    decoded: Awaited<ReturnType<typeof this.decodeInvoice>>,
    pays: noderpc.ListpaysPays[],
  ): Promise<PaymentResponse | undefined> => {
    // Check if the payment succeeded, ...
    const completedAttempts = pays.filter(
      (attempt) => attempt.status === ListpaysPays_ListpaysPaysStatus.COMPLETE,
    );
    if (completedAttempts.length > 0) {
      const fee =
        completedAttempts.reduce(
          (sum, attempt) => sum + BigInt(attempt.amountSentMsat?.msat || 0),
          0n,
        ) - BigInt(decoded.valueMsat);

      return {
        feeMsat: Number(fee),
        preimage: completedAttempts[0].preimage!,
      };
    }

    // ... is still pending ...
    const hasPendingPayments = pays.some(
      (pay) => pay.status === ListpaysPays_ListpaysPaysStatus.PENDING,
    );

    if (hasPendingPayments) {
      const channels = await this.unaryNodeCall<
        noderpc.ListpeerchannelsRequest,
        noderpc.ListpeerchannelsResponse
      >('listPeerChannels', {});

      const hasPendingHtlc = channels.channels.some((channel) =>
        channel.htlcs.some((htlc) =>
          decoded.paymentHash.equals(htlc.paymentHash),
        ),
      );

      if (hasPendingHtlc) {
        throw ClnClient.paymentPendingError;
      }
    }

    // ... or has failed
    // TODO: update when xpay persists errors from previous attempts
    if (
      pays.length > 0 &&
      pays.every((pay) => pay.status === ListpaysPays_ListpaysPaysStatus.FAILED)
    ) {
      throw ClnClient.paymentAllAttemptsFailed;
    }

    return undefined;
  };

  public listPays = async (invoice: string) => {
    const decoded = await this.decodeInvoice(invoice);

    const listPayReq: noderpc.ListpaysRequest = {
      bolt11: invoice,
    };

    const pays = (
      await this.unaryNodeCall<
        noderpc.ListpaysRequest,
        noderpc.ListpaysResponse
      >('listPays', listPayReq)
    ).pays;

    return {
      pays,
      decoded,
    };
  };

  public subscribeTrackHoldInvoices = () => {
    if (this.trackAllSubscription) {
      this.trackAllSubscription.cancel();
    }

    const req: holdrpc.TrackAllRequest = {
      paymentHashes: Array.from(this.holdInvoicesToSubscribe.values()).map(
        (paymentHash) => getHexBuffer(paymentHash),
      ),
    };
    this.holdInvoicesToSubscribe.clear();

    this.trackAllSubscription = this.holdClient!.trackAll(req);

    this.trackAllSubscription.on('data', (update: holdrpc.TrackAllResponse) => {
      switch (update.state) {
        case holdrpc.InvoiceState.ACCEPTED:
          this.logger.debug(
            `${ClnClient.serviceName} ${
              this.symbol
            } accepted invoice: ${update.bolt11}`,
          );

          this.emit('htlc.accepted', update.bolt11);
          break;

        case holdrpc.InvoiceState.PAID:
          this.logger.debug(
            `${ClnClient.serviceName} ${
              this.symbol
            } invoice settled: ${update.bolt11}`,
          );
          this.emit('invoice.settled', update.bolt11);

          break;
      }
    });
    this.trackAllSubscription.on('error', async (error) => {
      await this.handleSubscriptionError('track hold invoices', error);
    });
  };

  private static holdInvoiceSubscriptionKey = (paymentHash: Buffer): string => {
    return getHexString(paymentHash);
  };

  private unaryNodeCall = <T, U>(
    methodName: keyof NodeClient,
    params: T,
  ): Promise<U> => {
    return unaryCall(this.nodeClient!, methodName, params, this.nodeMeta);
  };

  private unaryHoldCall = <T, U>(
    methodName: keyof HoldClient,
    params: T,
  ): Promise<U> => {
    return unaryCall(this.holdClient!, methodName, params, this.holdMeta);
  };

  private handleSubscriptionError = async (
    subscriptionName: string,
    error: any,
  ) => {
    this.logger.error(
      `${ClnClient.serviceName} ${
        this.symbol
      } ${subscriptionName} subscription errored: ${formatError(error)}`,
    );

    if (this.isConnected()) {
      this.emit('subscription.error', subscriptionName);
      setTimeout(() => this.reconnect(), this.RECONNECT_INTERVAL);
    }
  };

  private parseError = (error: unknown) => {
    if (
      typeof error === 'object' &&
      'message' in error! &&
      typeof error.message === 'string'
    ) {
      const msg = error.message as string;
      const messagePrefix = 'message: "';
      const messageSuffix = '", data:';

      if (msg.includes(messagePrefix)) {
        return msg.slice(
          msg.indexOf(messagePrefix) + messagePrefix.length,
          msg.indexOf(messageSuffix),
        );
      }
    }

    return formatError(error);
  };
}

export default ClnClient;
export { ClnConfig };
