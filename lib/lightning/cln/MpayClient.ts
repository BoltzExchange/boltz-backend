import { ChannelCredentials, Metadata } from '@grpc/grpc-js';
import BaseClient from '../../BaseClient';
import Logger from '../../Logger';
import { formatError, getHexBuffer } from '../../Utils';
import { ClientStatus } from '../../consts/Enums';
import { MpayClient } from '../../proto/mpay/mpay_grpc_pb';
import * as mpayrpc from '../../proto/mpay/mpay_pb';
import { grpcOptions, unaryCall } from '../GrpcUtils';
import { PaymentResponse } from '../LightningClient';
import { BaseConfig, createSsl } from './Types';

class Mpay extends BaseClient {
  public static readonly serviceName = 'mpay';

  private client?: MpayClient;

  private readonly uri: string;
  private readonly creds: ChannelCredentials;
  private readonly meta = new Metadata();

  constructor(
    logger: Logger,
    public readonly symbol: string,
    config: BaseConfig,
  ) {
    super(logger, symbol);

    this.uri = `${config.host}:${config.port}`;
    this.creds = createSsl(Mpay.serviceName, this.symbol, config);
  }

  public serviceName = () => Mpay.serviceName;

  public connect = async (): Promise<boolean> => {
    if (this.isConnected()) {
      return true;
    }

    this.client = new MpayClient(this.uri, this.creds, {
      ...grpcOptions,
      'grpc.ssl_target_name_override': 'mpay',
    });

    try {
      await this.getInfo();

      this.setClientStatus(ClientStatus.Connected);
    } catch (error) {
      this.setClientStatus(ClientStatus.Disconnected);

      this.logger.error(
        `Could not connect to ${Mpay.serviceName} ${
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

    return true;
  };

  public disconnect = () => {
    this.clearReconnectTimer();

    this.removeAllListeners();
    this.setClientStatus(ClientStatus.Disconnected);
    this.client?.close();
  };

  public getInfo = (): Promise<mpayrpc.GetInfoResponse.AsObject> =>
    this.unaryNodeCall('getInfo', new mpayrpc.GetInfoRequest());

  public sendPayment = async (
    invoice: string,
    maxFeeMsat: number,
    timeout: number,
    maxDelay?: number,
  ): Promise<PaymentResponse> => {
    const req = new mpayrpc.PayRequest();
    req.setBolt11(invoice);
    req.setTimeout(timeout);
    req.setMaxFeeMsat(maxFeeMsat);

    if (maxDelay) {
      req.setMaxDelay(maxDelay);
    }

    const res = await this.unaryNodeCall<
      mpayrpc.PayRequest,
      mpayrpc.PayResponse
    >('pay', req, false);

    return {
      feeMsat: res.getFeeMsat(),
      preimage: getHexBuffer(res.getPaymentPreimage()),
    };
  };

  public resetPathMemory = () =>
    this.unaryNodeCall<
      mpayrpc.ResetPathMemoryRequest,
      mpayrpc.ResetPathMemoryResponse
    >('resetPathMemory', new mpayrpc.ResetPathMemoryRequest());

  private unaryNodeCall = <T, U>(
    methodName: keyof MpayClient,
    params: T,
    toObject = true,
  ): Promise<U> => {
    return unaryCall(this.client, methodName, params, this.meta, toObject);
  };
}

export default Mpay;
