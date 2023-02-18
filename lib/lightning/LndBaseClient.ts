import fs from 'fs';
import { ChannelCredentials, credentials, Metadata, ServiceError } from '@grpc/grpc-js';
import Errors from './Errors';
import Logger from '../Logger';
import BaseClient from '../BaseClient';
import { formatError } from '../Utils';
import * as lndrpc from '../proto/lnd/rpc_pb';
import { ClientStatus } from '../consts/Enums';
import { RouterClient } from '../proto/lnd/router_grpc_pb';
import { LightningClient } from '../proto/lnd/rpc_grpc_pb';
import { InvoicesClient } from '../proto/lnd/invoices_grpc_pb';

/**
 * The configurable options for the LND client
 */
type LndBaseConfig = {
  host: string;
  port: number;
  certpath: string;
  macaroonpath: string;
  maxPaymentFeeRatio: number;
};

type LndMethodFunction = (params: any, meta: Metadata, listener) => any;

interface GrpcResponse {
  toObject: () => any;
}

interface ILndBaseClient {
  on(event: 'subscription.error', listener: (subscription?: string) => void): this;
  emit(event: 'subscription.error', subscription?: string): boolean;

  on(event: 'subscription.reconnected', listener: () => void): this;
  emit(event: 'subscription.reconnected'): boolean;
}

abstract class LndBaseClient extends BaseClient implements ILndBaseClient {
  protected router?: RouterClient;
  protected invoices?: InvoicesClient;
  protected lightning?: LightningClient;

  protected readonly meta!: Metadata;

  private static readonly grpcOptions = {
    // 200 MB which is the same value lncli uses: https://github.com/lightningnetwork/lnd/commit/7470f696aebc51b4ab354324e6536f54446538e1
    'grpc.max_receive_message_length': 1024 * 1024 * 200,
  };

  private readonly uri!: string;
  private readonly credentials!: ChannelCredentials;

  protected constructor(
    protected logger: Logger,
    public readonly symbol: string,
    private readonly serviceName: string,
    config: LndBaseConfig,
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

  /**
   * Return general information concerning the lightning node including its identity pubkey, alias, the chains it
   * is connected to, and information concerning the number of open+pending channels
   */
  public getInfo = (): Promise<lndrpc.GetInfoResponse.AsObject> => {
    return this.unaryLightningCall<lndrpc.GetInfoRequest, lndrpc.GetInfoResponse.AsObject>('getInfo', new lndrpc.GetInfoRequest());
  };

  abstract startSubscriptions(): Promise<void>;
  abstract stopSubscriptions(): void;

  /**
   * Returns a boolean determines whether LND is ready or not
   */
  public connect = async (startSubscriptions = true) => {
    if (!this.isConnected()) {
      this.router = new RouterClient(this.uri, this.credentials, LndBaseClient.grpcOptions);
      this.invoices = new InvoicesClient(this.uri, this.credentials, LndBaseClient.grpcOptions);
      this.lightning = new LightningClient(this.uri, this.credentials, LndBaseClient.grpcOptions);

      try {
        await this.getInfo();

        if (startSubscriptions) {
          await this.startSubscriptions();
        }

        this.clearReconnectTimer();
        this.setClientStatus(ClientStatus.Connected);
      } catch (error) {
        this.setClientStatus(ClientStatus.Disconnected);

        this.logger.error(`Could not connect to ${this.serviceName} ${this.symbol} at ${this.uri}: ${formatError(error)}`);
        this.logger.info(`Retrying in ${this.RECONNECT_INTERVAL} ms`);

        this.reconnectionTimer = setTimeout(this.connect, this.RECONNECT_INTERVAL);

        return false;
      }
    }

    return true;
  };

  /**
   * End all subscriptions and reconnection attempts.
   */
  public disconnect = () => {
    this.clearReconnectTimer();

    this.stopSubscriptions();

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

    this.setClientStatus(ClientStatus.Disconnected);
  };

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

  protected reconnect = async () => {
    this.setClientStatus(ClientStatus.Disconnected);

    try {
      await this.getInfo();

      this.logger.info(`Reestablished connection to ${this.serviceName} ${this.symbol}`);

      this.clearReconnectTimer();
      await this.startSubscriptions();

      this.setClientStatus(ClientStatus.Connected);
      this.emit('subscription.reconnected');
    } catch (err) {
      this.setClientStatus(ClientStatus.Disconnected);

      this.logger.error(`Could not reconnect to ${this.serviceName} ${this.symbol}: ${err}`);
      this.logger.info(`Retrying in ${this.RECONNECT_INTERVAL} ms`);

      this.reconnectionTimer = setTimeout(this.reconnect, this.RECONNECT_INTERVAL);
    }
  };

  protected unaryInvoicesCall = <T, U>(methodName: keyof InvoicesClient, params: T): Promise<U> => {
    return this.unaryCall(this.invoices, methodName, params);
  };

  protected unaryLightningCall = <T, U>(methodName: keyof LightningClient, params: T): Promise<U> => {
    return this.unaryCall(this.lightning, methodName, params);
  };

  private throwFilesNotFound = () => {
    throw(Errors.COULD_NOT_FIND_FILES(this.symbol));
  };

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
  };
}

export default LndBaseClient;
export { LndBaseConfig };
