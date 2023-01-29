import bolt11 from '@boltz/bolt11';
import Logger from '../Logger';
import * as lndrpc from '../proto/lnd/rpc_pb';
import * as routerrpc from '../proto/lnd/router_pb';
import LndBaseClient, { LndBaseConfig } from './LndBaseClient';

class PaymentClient extends LndBaseClient {
  public static readonly serviceName = 'LndPayments';

  public static readonly paymentMaxParts = 5;

  private static readonly minPaymentFee = 42;
  private static readonly paymentTimeout = 120;
  private static readonly defaultPaymentFeeRatio = 0.03;

  private readonly maxPaymentFeeRatio!: number;

  constructor(
    logger: Logger,
    public readonly symbol: string,
    config: LndBaseConfig,
  ) {
    super(logger, symbol, PaymentClient.serviceName, config);

    const { maxPaymentFeeRatio } = config;
    this.maxPaymentFeeRatio = maxPaymentFeeRatio > 0 ? maxPaymentFeeRatio : PaymentClient.defaultPaymentFeeRatio;
  }

  public startSubscriptions = async () => {};
  public stopSubscriptions = () => {};

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
  };

  /**
   * Pay an invoice through the Lightning Network.
   *
   * @param invoice an invoice for a payment within the Lightning Network
   * @param outgoingChannelId channel through which the invoice should be paid
   */
  public sendPayment = (invoice: string, outgoingChannelId?: string): Promise<lndrpc.Payment.AsObject> => {
    return new Promise<lndrpc.Payment.AsObject>((resolve, reject) => {
      const request = new routerrpc.SendPaymentRequest();

      request.setMaxParts(PaymentClient.paymentMaxParts);
      request.setTimeoutSeconds(PaymentClient.paymentTimeout);
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
  };

  /**
   * Queries for a possible route to the target destination
   */
  public queryRoutes = (destination: string, amt: number): Promise<lndrpc.QueryRoutesResponse.AsObject> => {
    const request = new lndrpc.QueryRoutesRequest();
    request.setPubKey(destination);
    request.setAmt(amt);

    return this.unaryLightningCall<lndrpc.QueryRoutesRequest, lndrpc.QueryRoutesResponse.AsObject>('queryRoutes', request);
  };

  public static formatPaymentFailureReason = (reason: lndrpc.PaymentFailureReasonMap[keyof lndrpc.PaymentFailureReasonMap]): string => {
    switch (reason) {
      case lndrpc.PaymentFailureReason.FAILURE_REASON_TIMEOUT: return 'timeout';
      case lndrpc.PaymentFailureReason.FAILURE_REASON_NO_ROUTE: return 'no route';
      case lndrpc.PaymentFailureReason.FAILURE_REASON_INSUFFICIENT_BALANCE: return 'insufficient balance';
      case lndrpc.PaymentFailureReason.FAILURE_REASON_INCORRECT_PAYMENT_DETAILS: return 'incorrect payment details';
      default: return 'unknown reason';
    }
  };


  private calculatePaymentFee = (invoice: string): number => {
    const invoiceAmt = bolt11.decode(invoice).satoshis || 0;

    return Math.max(
      Math.ceil(invoiceAmt * this.maxPaymentFeeRatio),
      PaymentClient.minPaymentFee,
    );
  };
}

export default PaymentClient;