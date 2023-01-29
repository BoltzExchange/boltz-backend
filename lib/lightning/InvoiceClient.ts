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
    config: LndBaseConfig,
  ) {
    super(logger, symbol, InvoiceClient.serviceName, config);
  }

  public startSubscriptions = (): void => {};
  public stopSubscriptions = (): void => {};

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
  };

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
}

export default InvoiceClient;
export { IInvoiceClient };
