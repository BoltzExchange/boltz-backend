import fs from 'fs';
import grpc, { ClientReadableStream } from 'grpc';
import Errors from './Errors';
import Logger from '../Logger';
import BaseClient from '../BaseClient';
import * as lndrpc from '../proto/lndrpc_pb';
import { ClientStatus } from '../consts/Enums';
import LightningClient from './LightningClient';
import { LightningClient as GrpcClient } from '../proto/lndrpc_grpc_pb';

/**
 * The configurable options for the lnd client
 */
type LndConfig = {
  host: string;
  port: number;
  certpath: string;
  macaroonpath: string;
};

/**
 * General information about the state of this lnd client
 */
type Info = {
  version: string;
  syncedtochain: boolean;
  chainsList: string[];
  channels: ChannelCount;
  blockheight: number;
  uris?: string[];
};

type ChannelCount = {
  active: number,
  inactive?: number,
  pending: number,
};

interface GrpcResponse {
  toObject: Function;
}

interface LndClient {
  on(event: 'invoice.paid', listener: (invoice: string) => void): this;
  emit(event: 'invoice.paid', invoice: string): boolean;

  on(event: 'invoice.failed', listener: (invoice: string) => void): this;
  emit(event: 'invoice.failed', invoice: string): boolean;

  on(event: 'invoice.settled', listener: (invoice: string, preimage: string) => void): this;
  emit(event: 'invoice.settled', string: string, preimage: string): boolean;
}

interface LightningMethodIndex extends GrpcClient {
  [methodName: string]: Function;
}

/**
 * A class representing a client to interact with LND
 */
class LndClient extends BaseClient implements LightningClient {
  public static readonly serviceName = 'LND';
  private uri!: string;
  private credentials!: grpc.ChannelCredentials;

  private lightning!: GrpcClient | LightningMethodIndex;
  private meta!: grpc.Metadata;
  private invoiceSubscription?: ClientReadableStream<lndrpc.InvoiceSubscription>;

  /**
   * Create an LND client
   *
   * @param config the lnd configuration
   */
  constructor(private logger: Logger, config: LndConfig, public readonly symbol: string) {
    super();

    const { host, port, certpath, macaroonpath } = config;

    if (fs.existsSync(certpath)) {
      this.uri = `${host}:${port}`;

      const lndCert = fs.readFileSync(certpath);
      this.credentials = grpc.credentials.createSsl(lndCert);

      this.meta = new grpc.Metadata();

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
  public connect = async (): Promise<boolean> => {
    if (!this.isConnected()) {
      this.lightning = new GrpcClient(this.uri, this.credentials);

      try {
        await this.getInfo();

        this.setClientStatus(ClientStatus.Connected);
        this.subscribeInvoices();

        this.clearReconnectTimer();

        return true;
      } catch (error) {
        this.setClientStatus(ClientStatus.Disconnected);
        this.logger.error(`could not connect to ${LndClient.serviceName} ${this.symbol} at ${this.uri}` +
        ` because: "${error.details}", retrying in ${this.RECONNECT_INTERVAL} ms`);
        this.reconnectionTimer = setTimeout(this.connect, this.RECONNECT_INTERVAL);

        return false;
      }
    }

    return true;
  }

  private reconnect = async () => {
    try {
      await this.getInfo();

      this.logger.info(`Reestablished connection to ${LndClient.serviceName} ${this.symbol}`);

      this.setClientStatus(ClientStatus.Connected);
      this.clearReconnectTimer();

      this.subscribeInvoices();
    } catch (err) {
      this.logger.error(`Could not reconnect to ${LndClient.serviceName} ${this.symbol}: ${err}`);
      this.logger.info(`Retrying in ${this.RECONNECT_INTERVAL} ms`);

      this.setClientStatus(ClientStatus.Disconnected);
      this.reconnectionTimer = setTimeout(this.reconnect, this.RECONNECT_INTERVAL);
    }
  }

  /**
   * End all subscriptions and reconnection attempts.
   */
  public disconnect = () => {
    this.clearReconnectTimer();

    if (this.invoiceSubscription) {
      this.invoiceSubscription.cancel();
    }
  }

  private unaryCall = <T, U>(methodName: string, params: T): Promise<U> => {
    return new Promise((resolve, reject) => {
      (this.lightning as LightningMethodIndex)[methodName](params, this.meta, (err: grpc.ServiceError, response: GrpcResponse) => {
        if (err) {
          reject(err);
        } else {
          resolve(response.toObject());
        }
      });
    });
  }

  /**
   * Return general information concerning the lightning node including it’s identity pubkey, alias, the chains it
   * is connected to, and information concerning the number of open+pending channels
   */
  public getInfo = (): Promise<lndrpc.GetInfoResponse.AsObject> => {
    return this.unaryCall<lndrpc.GetInfoRequest, lndrpc.GetInfoResponse.AsObject>('getInfo', new lndrpc.GetInfoRequest());
  }

  /**
   * Attempt to add a new invoice to the lnd invoice database
   *
   * @param value the value of this invoice in satoshis
   */
  public addInvoice = (value: number): Promise<lndrpc.AddInvoiceResponse.AsObject> => {
    const request = new lndrpc.Invoice();
    request.setValue(value);
    return this.unaryCall<lndrpc.Invoice, lndrpc.AddInvoiceResponse.AsObject>('addInvoice', request);
  }

  /**
   * Pay an invoice through the Lightning Network.
   *
   * @param invoice an invoice for a payment within the Lightning Network
   */
  public payInvoice = async (invoice: string) => {
    const request = new lndrpc.SendRequest();
    request.setPaymentRequest(invoice);

    const response = await this.unaryCall<lndrpc.SendRequest, lndrpc.SendResponse.AsObject>('sendPaymentSync', request);

    if (response.paymentError === '') {
      this.emit('invoice.paid', invoice);
    } else {
      this.emit('invoice.failed', invoice);
    }

    return response;
  }

  /**
   * Decode an encoded payment request
   *
   * @param paymentRequest encoded payment request
   */
  public decodePayReq = (paymentRequest: string): Promise<lndrpc.PayReq.AsObject> => {
    const request = new lndrpc.PayReqString();
    request.setPayReq(paymentRequest);
    return this.unaryCall<lndrpc.PayReqString, lndrpc.PayReq.AsObject>('decodePayReq', request);
  }

  /**
   * Establish a connection to a remote peer
   *
   * @param pubKey identity public key of the remote peer
   * @param host host of the remote peer
   */
  public connectPeer = (pubKey: string, host: string): Promise<lndrpc.ConnectPeerResponse.AsObject> => {
    const request = new lndrpc.ConnectPeerRequest();
    const address = new lndrpc.LightningAddress();
    address.setPubkey(pubKey);
    address.setHost(host);
    request.setAddr(address);

    return this.unaryCall<lndrpc.ConnectPeerRequest, lndrpc.ConnectPeerResponse.AsObject>('connectPeer', request);
  }

  /**
   * Sends coins to a particular address
   *
   * @param address address to which coins should be sent
   * @param amount number of satoshis to send
   */
  public sendCoins = (address: string, amount: number): Promise<lndrpc.SendCoinsResponse.AsObject> => {
    const request = new lndrpc.SendCoinsRequest();
    request.setAddr(address);
    request.setAmount(amount);

    return this.unaryCall<lndrpc.SendCoinsRequest, lndrpc.SendCoinsResponse.AsObject>('sendCoins', request);
  }

  /**
   * Creates a new address
   *
   * @param addressType type of the address
   */
  public newAddress = (addressType = lndrpc.AddressType.NESTED_PUBKEY_HASH): Promise<lndrpc.NewAddressResponse.AsObject> => {
    const request = new lndrpc.NewAddressRequest();
    request.setType(addressType);

    return this.unaryCall<lndrpc.NewAddressRequest, lndrpc.NewAddressResponse.AsObject>('newAddress', request);
  }

  /**
   * Attempts to open a channel to a remote peer
   *
   * @param pubKey identity public key of the remote peer
   * @param fundingAmount the number of satohis the local wallet should commit
   * @param pushSat the number of satoshis that should be pushed to the remote side
   */
  public openChannel = (pubKey: string, fundingAmount: number, pushSat?: number): Promise<lndrpc.ChannelPoint.AsObject> => {
    const request = new lndrpc.OpenChannelRequest();
    request.setNodePubkeyString(pubKey);
    request.setLocalFundingAmount(fundingAmount);

    if (pushSat) {
      request.setPushSat(pushSat);
    }

    return this.unaryCall<lndrpc.OpenChannelRequest, lndrpc.ChannelPoint.AsObject>('openChannelSync', request);
  }

  /**
   * Gets a list of all open channels
   */
  public listChannels = () => {
    const request = new lndrpc.ListChannelsRequest();

    return this.unaryCall<lndrpc.ListChannelsRequest, lndrpc.ListChannelsResponse.AsObject>('listChannels', request);
  }

  /**
   * Subscribe to events for when invoices are settled.
   */
  private subscribeInvoices = (): void => {
    if (this.invoiceSubscription) {
      this.invoiceSubscription.cancel();
    }

    this.invoiceSubscription = this.lightning.subscribeInvoices(new lndrpc.InvoiceSubscription(), this.meta)
      .on('data', (invoice: lndrpc.Invoice) => {
        if (invoice.getSettled()) {
          const paymentReq = invoice.getPaymentRequest();

          this.logger.silly(`${this.symbol} LND invoice settled: ${paymentReq}`);
          this.emit('invoice.settled', paymentReq, invoice.getRPreimage_asB64());
        }
      })
      .on('error', async (error) => {
        if (error.message !== '1 CANCELLED: Cancelled') {
          this.logger.error(`Invoice subscription ended: ${error}`);
        }
        await this.reconnect();
      });
  }
}

export default LndClient;
export { LndConfig, Info };
