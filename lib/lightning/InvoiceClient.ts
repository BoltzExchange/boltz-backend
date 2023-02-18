import Logger from '../Logger';
import * as lndrpc from '../proto/lnd/rpc_pb';
import * as invoicesrpc from '../proto/lnd/invoices_pb';
import LndBaseClient, { LndBaseConfig } from './LndBaseClient';

interface IInvoiceClient {
  on(event: 'htlc.accepted', listener: (invoice: string) => void): this;
  emit(event: 'htlc.accepted', invoice: string): boolean;

  on(event: 'invoice.settled', listener: (invoice: string) => void): this;
  emit(event: 'invoice.settled', string: string): boolean;
}

class InvoiceClient extends LndBaseClient implements IInvoiceClient{
  public static readonly serviceName = 'LNDInvoicing';

  constructor(
    logger: Logger,
    public readonly symbol: string,
    private readonly needsRoutingHints: boolean,
    config: LndBaseConfig,
  ) {
    super(logger, symbol, InvoiceClient.serviceName, config);
  }

  public startSubscriptions = async () => {
    const info = await this.getInfo();
    this.logger.debug(`Using ${info.alias} (${info.identityPubkey}) for ${this.symbol} invoicing`);
  };

  public stopSubscriptions = (): void => {};

  /**
   * Creates an invoice
   */
  public addInvoice = async (
    value: number,
    expiry?: number,
    memo?: string,
    routingHints?: lndrpc.RouteHint[],
  ): Promise<lndrpc.AddInvoiceResponse.AsObject> => {
    const request = new lndrpc.Invoice();
    request.setValue(value);

    if (expiry) {
      request.setExpiry(expiry);
    }

    if (memo) {
      request.setMemo(memo);
    }

    await this.prepareRoutingHints(request, routingHints);

    return await this.unaryLightningCall<lndrpc.Invoice, lndrpc.AddInvoiceResponse.AsObject>('addInvoice', request);
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

    await this.prepareRoutingHints(request, routingHints);

    return await this.unaryInvoicesCall<invoicesrpc.AddHoldInvoiceRequest, invoicesrpc.AddHoldInvoiceResp.AsObject>(
      'addHoldInvoice',
      request,
    );
  };

  public lookupInvoice = (preimageHash: Buffer): Promise<lndrpc.Invoice.AsObject> => {
    const request = new lndrpc.PaymentHash();
    request.setRHash(preimageHash);

    return this.unaryLightningCall<lndrpc.PaymentHash, lndrpc.Invoice.AsObject>('lookupInvoice', request);
  };

  /**
   * Cancel a hold invoice
   */
  public cancelInvoice = (preimageHash: Buffer): Promise<invoicesrpc.CancelInvoiceResp.AsObject> => {
    const request = new invoicesrpc.CancelInvoiceMsg();
    request.setPaymentHash(Uint8Array.from(preimageHash));

    return this.unaryInvoicesCall<invoicesrpc.CancelInvoiceMsg, invoicesrpc.CancelInvoiceResp.AsObject>('cancelInvoice', request);
  };

  /**
   * Settle a hold invoice with an already accepted HTLC
   */
  public settleInvoice = (preimage: Buffer): Promise<invoicesrpc.SettleInvoiceResp.AsObject> => {
    const request = new invoicesrpc.SettleInvoiceMsg();
    request.setPreimage(Uint8Array.from(preimage));

    return this.unaryInvoicesCall<invoicesrpc.SettleInvoiceMsg, invoicesrpc.SettleInvoiceResp.AsObject>('settleInvoice', request);
  };

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
          this.logger.debug(`${InvoiceClient.serviceName} ${this.symbol} accepted ${invoice.getHtlcsList().length} HTLC${invoice.getHtlcsList().length > 1 ? 's' : ''} for invoice: ${invoice.getPaymentRequest()}`);

          this.emit('htlc.accepted', invoice.getPaymentRequest());

          deleteSubscription();
        } else if (invoice.getState() === lndrpc.Invoice.InvoiceState.SETTLED) {
          this.logger.debug(`${InvoiceClient.serviceName} ${this.symbol} invoice settled: ${invoice.getPaymentRequest()}`);
          this.emit('invoice.settled', invoice.getPaymentRequest());

          deleteSubscription();
        }
      })
      .on('end', () => deleteSubscription())
      .on('error', (error) => {
        this.logger.error(`${InvoiceClient.serviceName} ${this.symbol} invoice subscription errored: ${error.message}`);
        deleteSubscription();
      });
  };

  private prepareRoutingHints = async (
    req: lndrpc.Invoice | invoicesrpc.AddHoldInvoiceRequest,
    routingHints?: lndrpc.RouteHint[],
  ) => {
    if (routingHints) {
      req.setPrivate(true);
      req.setRouteHintsList(routingHints);
    } else if (this.needsRoutingHints) {
      req.setPrivate(true);

      for (const channel of (await this.listChannels()).channelsList) {
        const hopHint = new lndrpc.HopHint();

        hopHint.setChanId(channel.chanId);
        hopHint.setNodeId(channel.remotePubkey);

        const channelInfo = await this.getChannelInfo(channel.chanId);
        const channelPolicy = channelInfo.node1Pub === channel.remotePubkey ?
          channelInfo.node1Policy : channelInfo.node2Policy;

        hopHint.setFeeBaseMsat(channelPolicy!.feeBaseMsat);
        hopHint.setCltvExpiryDelta(channelPolicy!.timeLockDelta);
        hopHint.setFeeProportionalMillionths(channelPolicy!.feeRateMilliMsat);

        const routeHints = new lndrpc.RouteHint();
        routeHints.addHopHints(hopHint);
        req.addRouteHints(routeHints);
      }
    }
  };

  private listChannels = (): Promise<lndrpc.ListChannelsResponse.AsObject> => {
    const request = new lndrpc.ListChannelsRequest();
    request.setActiveOnly(true);
    request.setPrivateOnly(true);

    return this.unaryLightningCall<lndrpc.ListChannelsRequest, lndrpc.ListChannelsResponse.AsObject>('listChannels', request);
  };

  public getChannelInfo = (channelId: string): Promise<lndrpc.ChannelEdge.AsObject> => {
    const request = new lndrpc.ChanInfoRequest();
    request.setChanId(channelId);

    return this.unaryLightningCall<lndrpc.ChanInfoRequest, lndrpc.ChannelEdge.AsObject>('getChanInfo', request);
  };
}

export default InvoiceClient;
export { IInvoiceClient };
