import fs from 'fs';
import bolt11 from 'bolt11';
import {
  ChannelCredentials,
  ClientReadableStream,
  credentials,
  Metadata,
} from '@grpc/grpc-js';
import Errors from './Errors';
import Logger from '../Logger';
import BaseClient from '../BaseClient';
import { ClientStatus } from '../consts/Enums';
import * as noderpc from '../proto/cln/node_pb';
import { ListfundsOutputs } from '../proto/cln/node_pb';
import * as holdrpc from '../proto/hold/hold_pb';
import { grpcOptions, unaryCall } from './GrpcUtils';
import { NodeClient } from '../proto/cln/node_grpc_pb';
import { HoldClient } from '../proto/hold/hold_grpc_pb';
import * as primitivesrpc from '../proto/cln/primitives_pb';
import { decodeInvoice, formatError, getHexString } from '../Utils';
import { WalletBalance } from '../wallet/providers/WalletProviderInterface';
import {
  msatToSat,
  satToMsat,
  scidClnToLnd,
  scidLndToCln,
} from './ChannelUtils';
import {
  calculatePaymentFee,
  ChannelInfo,
  DecodedInvoice,
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
  RoutingHintsProvider,
} from './LightningClient';

type BaseConfig = {
  host: string;
  port: number;

  rootCertPath: string;
  privateKeyPath: string;
  certChainPath: string;
};

type ClnConfig = BaseConfig & {
  maxPaymentFeeRatio: number;

  hold: BaseConfig;
};

class ClnClient
  extends BaseClient
  implements LightningClient, RoutingHintsProvider
{
  public static readonly serviceName = 'CLN';
  public static readonly serviceNameHold = 'hold';

  private static readonly paymentMinFee = 121;
  private static readonly pendingTimeout = 120;
  private static readonly paymentTimeout = 300;

  private readonly maxPaymentFeeRatio!: number;

  private readonly nodeUri: string;
  private readonly holdUri: string;

  private nodeClient?: NodeClient;
  private readonly nodeCreds: ChannelCredentials;
  private readonly nodeMeta = new Metadata();

  private holdClient?: HoldClient;
  private readonly holdCreds: ChannelCredentials;
  private readonly holdMeta = new Metadata();

  private trackAllSubscription?: ClientReadableStream<holdrpc.TrackAllResponse>;

  constructor(
    private logger: Logger,
    public readonly symbol: string,
    config: ClnConfig,
  ) {
    super();

    this.maxPaymentFeeRatio =
      config.maxPaymentFeeRatio > 0 ? config.maxPaymentFeeRatio : 0.01;

    this.nodeCreds = this.createSsl(config);
    this.holdCreds = this.createSsl(config.hold);

    this.nodeUri = `${config.host}:${config.port}`;
    this.holdUri = `${config.hold.host}:${config.hold.port}`;
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
    return err.includes('WIRE_INCORRECT_OR_UNKNOWN_PAYMENT_DETAILS');
  };

  public serviceName = (): string => {
    return ClnClient.serviceName;
  };

  public connect = async (startSubscriptions = true): Promise<boolean> => {
    if (!this.isConnected()) {
      this.nodeClient = new NodeClient(this.nodeUri, this.nodeCreds, {
        ...grpcOptions,
        'grpc.ssl_target_name_override': 'cln',
      });

      this.holdClient = new HoldClient(this.holdUri, this.holdCreds, {
        ...grpcOptions,
        'grpc.ssl_target_name_override': 'hold',
      });

      try {
        await this.getInfo();

        if (startSubscriptions) {
          this.subscribeTrackHoldInvoices();
        }

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
      await this.getInfo();

      this.logger.info(
        `Reestablished connection to ${ClnClient.serviceName} ${this.symbol}`,
      );

      this.clearReconnectTimer();

      this.subscribeTrackHoldInvoices();

      this.setClientStatus(ClientStatus.Connected);
      this.emit('subscription.reconnected');
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
    >('getinfo', new noderpc.GetinfoRequest(), false);

    return {
      version: info.getVersion(),
      pubkey: getHexString(Buffer.from(info.getId_asU8())),
      uris: [],
      peers: info.getNumPeers(),
      blockHeight: info.getBlockheight(),
      channels: {
        active: info.getNumActiveChannels(),
        inactive: info.getNumInactiveChannels(),
        pending: info.getNumPendingChannels(),
      },
    };
  };

  public getBalance = async (): Promise<WalletBalance> => {
    const sumOutputs = (
      outs: ListfundsOutputs.AsObject[],
      status: ListfundsOutputs.ListfundsOutputsStatus,
    ) =>
      outs
        .filter((out) => !out.reserved)
        .filter((out) => out.status === status)
        .reduce((sum, out) => sum + msatToSat(out.amountMsat!.msat), 0);

    const res = await this.listFunds();

    return {
      confirmedBalance: sumOutputs(
        res.outputsList,
        ListfundsOutputs.ListfundsOutputsStatus.CONFIRMED,
      ),
      unconfirmedBalance: sumOutputs(
        res.outputsList,
        ListfundsOutputs.ListfundsOutputsStatus.UNCONFIRMED,
      ),
    };
  };

  public listFunds = (): Promise<noderpc.ListfundsResponse.AsObject> => {
    const req = new noderpc.ListfundsRequest();
    req.setSpent(false);

    return this.unaryNodeCall<
      noderpc.ListfundsRequest,
      noderpc.ListfundsResponse.AsObject
    >('listFunds', req);
  };

  public getHoldInfo = (): Promise<holdrpc.GetInfoResponse.AsObject> => {
    return this.unaryHoldCall<
      holdrpc.GetInfoRequest,
      holdrpc.GetInfoResponse.AsObject
    >('getInfo', new holdrpc.GetInfoRequest());
  };

  public listChannels = async (
    activeOnly = false,
    privateOnly = false,
  ): Promise<ChannelInfo[]> => {
    const res = await this.unaryNodeCall<
      noderpc.ListpeerchannelsRequest,
      noderpc.ListpeerchannelsResponse
    >('listPeerChannels', new noderpc.ListpeerchannelsRequest(), false);

    return res
      .getChannelsList()
      .filter(
        (chan) =>
          chan.getShortChannelId() !== undefined &&
          chan.getShortChannelId() !== '',
      )
      .filter(
        (chan) =>
          !activeOnly ||
          (chan.getPeerConnected() &&
            chan.getState() ===
              noderpc.ListpeerchannelsChannels.ListpeerchannelsChannelsState
                .CHANNELD_NORMAL),
      )
      .filter((chan) => !privateOnly || chan.getPrivate())
      .map((chan) => {
        return {
          private: chan.getPrivate()!,
          fundingTransactionId: getHexString(
            Buffer.from(chan.getFundingTxid_asU8()),
          ),
          capacity: msatToSat(chan.getTotalMsat()!.getMsat()),
          chanId: scidClnToLnd(chan.getShortChannelId()!),
          fundingTransactionVout: chan.getFundingOutnum()!,
          localBalance: msatToSat(chan.getSpendableMsat()!.getMsat()),
          remoteBalance: msatToSat(chan.getReceivableMsat()!.getMsat()),
          remotePubkey: getHexString(Buffer.from(chan.getPeerId_asU8())),
        };
      });
  };

  public stop = (): void => {
    // Just here for interface compatibility;
  };

  public routingHints = async (node: string): Promise<HopHint[][]> => {
    const req = new holdrpc.RoutingHintsRequest();
    req.setNode(node);

    const res = await this.unaryHoldCall<
      holdrpc.RoutingHintsRequest,
      holdrpc.RoutingHintsResponse.AsObject
    >('routingHints', req);
    return ClnClient.routingHintsFromGrpc(res.hintsList);
  };

  public addHoldInvoice = async (
    value: number,
    preimageHash: Buffer,
    cltvExpiry?: number,
    expiry?: number,
    memo?: string,
    routingHints?: HopHint[][],
  ): Promise<string> => {
    const req = new holdrpc.InvoiceRequest();
    req.setAmountMsat(satToMsat(value));
    req.setPaymentHash(getHexString(preimageHash));

    if (cltvExpiry) {
      req.setMinFinalCltvExpiry(cltvExpiry);
    }

    if (expiry) {
      req.setExpiry(expiry);
    }

    if (memo) {
      req.setDescription(memo);
    }

    if (routingHints) {
      req.setRoutingHintsList(ClnClient.routingHintsToGrpc(routingHints));
    }

    return (
      await this.unaryHoldCall<
        holdrpc.InvoiceRequest,
        holdrpc.InvoiceResponse.AsObject
      >('invoice', req)
    ).bolt11;
  };

  public lookupHoldInvoice = async (preimageHash: Buffer): Promise<Invoice> => {
    const req = new holdrpc.ListRequest();
    req.setPaymentHash(getHexString(preimageHash));

    const res = await this.unaryHoldCall<
      holdrpc.ListRequest,
      holdrpc.ListResponse.AsObject
    >('list', req);
    if (res.invoicesList.length === 0) {
      throw Errors.INVOICE_NOT_FOUND();
    }

    const invoice = res.invoicesList[0];

    return {
      state: ClnClient.invoiceStateFromGrpc(invoice.state),
      htlcs: invoice.htlcsList.map(ClnClient.htlcFromGrpc),
    };
  };

  public cancelHoldInvoice = async (preimageHash: Buffer): Promise<void> => {
    const req = new holdrpc.CancelRequest();
    req.setPaymentHash(getHexString(preimageHash));

    await this.unaryHoldCall<
      holdrpc.CancelRequest,
      holdrpc.CancelRequest.AsObject
    >('cancel', req);
  };

  public settleHoldInvoice = async (preimage: Buffer): Promise<void> => {
    const req = new holdrpc.SettleRequest();
    req.setPaymentPreimage(getHexString(preimage));

    await this.unaryHoldCall<
      holdrpc.SettleRequest,
      holdrpc.SettleRequest.AsObject
    >('settle', req);
  };

  public decodeInvoice = async (invoice: string): Promise<DecodedInvoice> => {
    // Just to make sure CLN can parse the invoice
    const req = new noderpc.DecodeRequest();
    req.setString(invoice);

    const clnRes = await this.unaryNodeCall<
      noderpc.DecodeRequest,
      noderpc.DecodeResponse.AsObject
    >('decode', req);

    const features = new Set<InvoiceFeature>();

    const dec = bolt11.decode(invoice);
    const featureBits = dec.tags.find((e) => e.tagName === 'feature_bits');
    if (featureBits && featureBits.data) {
      const mpp = (featureBits.data as any)['basic_mpp'];
      if (mpp.supported || mpp.required) {
        features.add(InvoiceFeature.MPP);
      }
    }

    const routingHints: HopHint[][] = [];

    // TODO: routing hints with multiple hops?
    const routingHintsTag = dec.tags.find((e) => e.tagName === 'routing_info');
    if (routingHintsTag && routingHintsTag.data) {
      (routingHintsTag.data as any).forEach(
        (route: {
          pubkey: string;
          fee_base_msat: number;
          short_channel_id: string;
          cltv_expiry_delta: number;
          fee_proportional_millionths: number;
        }) => {
          const chanId = BigInt(`0x${route.short_channel_id}`).toString();
          routingHints.push([
            {
              chanId,
              nodeId: route.pubkey,
              feeBaseMsat: route.fee_base_msat,
              cltvExpiryDelta: route.cltv_expiry_delta,
              feeProportionalMillionths: route.fee_proportional_millionths,
            },
          ]);
        },
      );
    }

    return {
      features,
      routingHints,
      value: dec.satoshis || 0,
      destination: dec.payeeNodeKey!,
      cltvExpiry: clnRes.minFinalCltvExpiry || 0,
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
      this.queryRoute(destination, amt, cltvLimit, finalCltvDelta),
    ];

    if (routingHints) {
      routingHints.forEach((hint) => {
        const hintCtlvs = hint.reduce(
          (sum, hint) => sum + hint.cltvExpiryDelta,
          0,
        );
        prms.push(
          this.queryRoute(
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _?: string,
  ): Promise<PaymentResponse> => {
    const payStatus = await this.checkPayStatus(invoice);
    if (payStatus !== undefined) {
      return payStatus;
    }

    const req = new noderpc.PayRequest();

    req.setBolt11(invoice);
    req.setRetryFor(ClnClient.paymentTimeout);

    const feeAmount = new primitivesrpc.Amount();
    feeAmount.setMsat(
      satToMsat(
        calculatePaymentFee(
          invoice,
          this.maxPaymentFeeRatio,
          ClnClient.paymentMinFee,
        ),
      ),
    );
    req.setMaxfee(feeAmount);

    if (cltvDelta) {
      req.setMaxdelay(cltvDelta);
    }

    const res = await this.unaryNodeCall<
      noderpc.PayRequest,
      noderpc.PayResponse
    >('pay', req, false);

    if (res.getStatus() !== noderpc.PayResponse.PayStatus.COMPLETE) {
      // TODO: error message?
      throw 'payment failed';
    }

    const fee =
      BigInt(res.getAmountSentMsat()!.getMsat()) -
      BigInt(res.getAmountMsat()!.getMsat());

    return {
      feeMsat: Number(fee),
      preimage: Buffer.from(res.getPaymentPreimage_asU8()),
    };
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public subscribeSingleInvoice = (_: Buffer): void => {
    // Just here for interface compatibility;
    // with CLN we can subscribe to all hold invoice with one gRPC subscription
    return;
  };

  private static routingHintsToGrpc = (
    routingHints: HopHint[][],
  ): holdrpc.RoutingHint[] => {
    return routingHints.map((hints) => {
      const routeHint = new holdrpc.RoutingHint();
      for (const hint of hints) {
        const hopHint = new holdrpc.Hop();
        hopHint.setPublicKey(hint.nodeId);
        hopHint.setShortChannelId(scidLndToCln(hint.chanId));
        hopHint.setBaseFee(hint.feeBaseMsat);
        hopHint.setPpmFee(hint.feeProportionalMillionths);
        hopHint.setCltvExpiryDelta(hint.cltvExpiryDelta);

        routeHint.addHops(hopHint);
      }

      return routeHint;
    });
  };

  private static routingHintsFromGrpc = (
    routingHints: holdrpc.RoutingHint.AsObject[],
  ): HopHint[][] => {
    return routingHints.map((hint) =>
      hint.hopsList.map((hop) => ({
        nodeId: hop.publicKey,
        chanId: hop.shortChannelId,
        feeBaseMsat: hop.baseFee,
        feeProportionalMillionths: hop.ppmFee,
        cltvExpiryDelta: hop.cltvExpiryDelta,
      })),
    );
  };

  private static invoiceStateFromGrpc = (
    state: holdrpc.InvoiceState,
  ): InvoiceState => {
    switch (state) {
      case holdrpc.InvoiceState.INVOICE_UNPAID:
        return InvoiceState.Open;
      case holdrpc.InvoiceState.INVOICE_ACCEPTED:
        return InvoiceState.Accepted;
      case holdrpc.InvoiceState.INVOICE_CANCELLED:
        return InvoiceState.Cancelled;
      case holdrpc.InvoiceState.INVOICE_PAID:
        return InvoiceState.Settled;
    }
  };

  private static htlcFromGrpc = (htlc: holdrpc.Htlc.AsObject): Htlc => {
    return {
      state: ClnClient.htlcStateFromGrpc(htlc.state),
      valueMsat: htlc.msat,
    };
  };

  private static htlcStateFromGrpc = (state: holdrpc.HtlcState): HtlcState => {
    switch (state) {
      case holdrpc.HtlcState.HTLC_ACCEPTED:
        return HtlcState.Accepted;
      case holdrpc.HtlcState.HTLC_CANCELLED:
        return HtlcState.Cancelled;
      case holdrpc.HtlcState.HTLC_SETTLED:
        return HtlcState.Settled;
    }
  };

  private checkPayStatus = async (
    invoice: string,
  ): Promise<PaymentResponse | undefined> => {
    const res = await this.payStatus(invoice);

    // Check if the payment succeeded...
    for (const pay of res.statusList) {
      for (const attempt of pay.attemptsList) {
        if (attempt.success?.paymentPreimage === undefined) {
          continue;
        }

        const listPayReq = new noderpc.ListpaysRequest();
        listPayReq.setBolt11(invoice);
        listPayReq.setStatus(noderpc.ListpaysRequest.ListpaysStatus.COMPLETE);

        const payStatusRes = await this.unaryNodeCall<
          noderpc.ListpaysRequest,
          noderpc.ListpaysResponse
        >('listPays', listPayReq, false);
        const payStatus = payStatusRes
          .getPaysList()
          .find((status) => status.getAmountSentMsat() !== undefined);
        if (payStatus === undefined) {
          break;
        }

        const fee =
          BigInt(payStatus.getAmountSentMsat()!.getMsat()) -
          BigInt(payStatus.getAmountMsat()!.getMsat());

        return {
          feeMsat: Number(fee),
          preimage: Buffer.from(payStatus.getPreimage_asU8()),
        };
      }
    }

    // ... has failed
    for (const pay of res.statusList) {
      for (const attempt of pay.attemptsList) {
        if (
          attempt.state ===
            holdrpc.PayStatusResponse.PayStatus.Attempt.AttemptState
              .ATTEMPT_PENDING ||
          attempt.failure === undefined
        ) {
          continue;
        }

        if (ClnClient.errIsIncorrectPaymentDetails(attempt.failure.message)) {
          throw attempt.failure.message;
        }
      }
    }

    // ... or is still pending
    const pending = res.statusList.filter((pay) =>
      pay.attemptsList.some(
        (attempt) =>
          attempt.state ===
          holdrpc.PayStatusResponse.PayStatus.Attempt.AttemptState
            .ATTEMPT_PENDING,
      ),
    );

    if (pending.length > 0) {
      const channels = await this.unaryNodeCall<
        noderpc.ListpeerchannelsRequest,
        noderpc.ListpeerchannelsResponse
      >('listPeerChannels', new noderpc.ListpeerchannelsRequest(), false);

      const pendingHtlcs = new Set<string>(
        channels
          .getChannelsList()
          .flatMap((channel) =>
            channel
              .getHtlcsList()
              .map((htlc) =>
                getHexString(Buffer.from(htlc.getPaymentHash_asU8())),
              ),
          ),
      );

      if (
        pending.filter((pay) => {
          const { paymentHash } = decodeInvoice(invoice);

          return pay.attemptsList.some(
            (attempt) =>
              attempt.ageInSeconds < ClnClient.pendingTimeout ||
              pendingHtlcs.has(paymentHash!),
          );
        }).length > 0
      ) {
        throw 'payment already pending';
      }
    }

    return undefined;
  };

  private payStatus = (invoice: string) => {
    const req = new holdrpc.PayStatusRequest();
    req.setBolt11(invoice);

    return this.unaryHoldCall<
      holdrpc.PayStatusRequest,
      holdrpc.PayStatusResponse.AsObject
    >('payStatus', req);
  };

  private queryRoute = async (
    destination: string,
    amt: number,
    cltvLimit?: number,
    finalCltvDelta?: number,
  ): Promise<Route> => {
    const req = new holdrpc.GetRouteRequest();
    req.setDestination(destination);
    req.setRiskFactor(0);
    req.setAmountMsat(amt);

    if (cltvLimit) {
      req.setMaxCltv(cltvLimit);
    }

    if (finalCltvDelta) {
      req.setFinalCltvDelta(finalCltvDelta);
    }

    const res = await this.unaryHoldCall<
      holdrpc.GetRouteRequest,
      holdrpc.GetRouteResponse.AsObject
    >('getRoute', req);

    return {
      ctlv: res.hopsList[0].delay,
      feesMsat: res.feesMsat,
    };
  };

  private subscribeTrackHoldInvoices = () => {
    if (this.trackAllSubscription) {
      this.trackAllSubscription.cancel();
    }

    this.trackAllSubscription = this.holdClient!.trackAll(
      new holdrpc.TrackAllRequest(),
    );

    this.trackAllSubscription.on('data', (update: holdrpc.TrackAllResponse) => {
      switch (update.getState()) {
        case holdrpc.InvoiceState.INVOICE_ACCEPTED:
          this.logger.debug(
            `${ClnClient.serviceName} ${
              this.symbol
            } accepted invoice: ${update.getBolt11()}`,
          );

          this.emit('htlc.accepted', update.getBolt11());
          break;

        case holdrpc.InvoiceState.INVOICE_PAID:
          this.logger.debug(
            `${ClnClient.serviceName} ${
              this.symbol
            } invoice settled: ${update.getBolt11()}`,
          );
          this.emit('invoice.settled', update.getBolt11());

          break;
      }
    });
    this.trackAllSubscription.on('error', async (error) => {
      await this.handleSubscriptionError('track hold invoices', error);
    });
  };

  private unaryNodeCall = <T, U>(
    methodName: keyof NodeClient,
    params: T,
    toObject = true,
  ): Promise<U> => {
    return unaryCall(
      this.nodeClient,
      methodName,
      params,
      this.nodeMeta,
      toObject,
    );
  };

  private unaryHoldCall = <T, U>(
    methodName: keyof HoldClient,
    params: T,
  ): Promise<U> => {
    return unaryCall(this.holdClient, methodName, params, this.holdMeta, true);
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

    if (this.status === ClientStatus.Connected) {
      this.emit('subscription.error');
      setTimeout(() => this.reconnect(), this.RECONNECT_INTERVAL);
    }
  };

  private createSsl = (config: BaseConfig): ChannelCredentials => {
    const certFiles = [
      config.rootCertPath,
      config.privateKeyPath,
      config.certChainPath,
    ];

    if (
      !certFiles.map((file) => fs.existsSync(file)).every((exists) => exists)
    ) {
      throw Errors.COULD_NOT_FIND_FILES(this.symbol, ClnClient.serviceName);
    }

    const [rootCert, privateKey, certChain] = certFiles.map((file) =>
      fs.readFileSync(file),
    );
    return credentials.createSsl(rootCert, privateKey, certChain);
  };
}

export default ClnClient;
export { ClnConfig };
