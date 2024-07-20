import { Metadata } from '@grpc/grpc-js';
import { Status } from '@grpc/grpc-js/build/src/constants';
import child_process from 'node:child_process';
import path from 'path';
import BaseClient from '../BaseClient';
import { ConfigType } from '../Config';
import Logger from '../Logger';
import { formatError, getVersion } from '../Utils';
import { ClientStatus, SwapUpdateEvent } from '../consts/Enums';
import { grpcOptions, unaryCall } from '../lightning/GrpcUtils';
import { createSsl } from '../lightning/cln/Types';
import { BoltzRClient } from '../proto/sidecar/boltzr_grpc_pb';
import * as sidecarrpc from '../proto/sidecar/boltzr_pb';

type SidecarConfig = {
  path?: string;

  config?: string;
  logFile?: string;

  grpc: {
    host: string;
    port: number;
    certificates: string;
  };
};

class Sidecar extends BaseClient {
  public static readonly symbol = 'Boltz';
  public static readonly serviceName = 'sidecar';

  private static childProcess?: child_process.ChildProcessWithoutNullStreams;

  private static maxConnectRetries = 5;
  private static connectRetryTimeout = 500;

  private client?: BoltzRClient;
  private readonly clientMeta = new Metadata();

  constructor(
    logger: Logger,
    private config: SidecarConfig,
  ) {
    super(logger, Sidecar.symbol);
  }

  public static start = (logger: Logger, config: ConfigType) => {
    const sidecarBuildType =
      process.env.NODE_ENV === 'production' ? 'release' : 'debug';
    logger.info(`Starting ${sidecarBuildType} sidecar`);

    this.childProcess = child_process.spawn(
      config.sidecar.path ||
        path.join(
          path.resolve(__dirname, '..', '..', '..'),
          `boltzr/target/${sidecarBuildType}/boltzr`,
        ),
      [
        '--config',
        config.sidecar?.config || config.configpath,
        '--log-level',
        config.loglevel === 'silly' ? 'trace' : config.loglevel,
      ],
    );
    Sidecar.childProcess!.stdout.pipe(process.stdout);
    Sidecar.childProcess!.stderr.pipe(process.stderr);
  };

  public static stop = async () => {
    if (Sidecar.childProcess) {
      Sidecar.childProcess.kill('SIGINT');
      await new Promise<void>((resolve) => {
        Sidecar.childProcess!.once('exit', resolve);
      });
    }
  };

  public serviceName(): string {
    return Sidecar.serviceName;
  }

  public connect = async (): Promise<boolean> => {
    if (this.isConnected()) {
      return true;
    }

    for (let i = 0; i < Sidecar.maxConnectRetries; i++) {
      try {
        return await this.tryConnect();
      } catch (e) {
        if (i === Sidecar.maxConnectRetries - 1) {
          throw e;
        }

        this.logger.warn(
          `Connection to ${this.serviceName()} failed: ${formatError(e)}`,
        );
        this.logger.warn(
          `Retrying connecting to ${this.serviceName()} in: ${Sidecar.connectRetryTimeout / 1_000}s`,
        );
        await new Promise<void>((resolve) => {
          setTimeout(resolve, Sidecar.connectRetryTimeout);
        });
      }
    }

    return false;
  };

  public disconnect = (): void => {
    this.clearReconnectTimer();

    this.client?.close();
    this.removeAllListeners();

    this.setClientStatus(ClientStatus.Disconnected);
  };

  public start = async () => {
    await this.unaryNodeCall<
      sidecarrpc.StartWebHookRetriesRequest,
      sidecarrpc.StartWebHookRetriesResponse
    >('startWebHookRetries', new sidecarrpc.StartWebHookRetriesRequest());
  };

  public getInfo = () =>
    this.unaryNodeCall<
      sidecarrpc.GetInfoRequest,
      sidecarrpc.GetInfoResponse.AsObject
    >('getInfo', new sidecarrpc.GetInfoRequest(), true);

  public validateVersion = async () => {
    const sidecarInfo = await this.getInfo();
    if (sidecarInfo.version !== getVersion()) {
      throw `sidecar version incompatible: ${sidecarInfo.version} vs ${getVersion()}`;
    }
  };

  public createWebHook = async (
    swapId: string,
    url: string,
    hashSwapId?: boolean,
  ) => {
    const req = new sidecarrpc.CreateWebHookRequest();
    req.setId(swapId);
    req.setUrl(url);
    req.setHashSwapId(hashSwapId || false);

    await this.unaryNodeCall<
      sidecarrpc.CreateWebHookRequest,
      sidecarrpc.CreateWebHookResponse
    >('createWebHook', req);
  };

  public sendWebHook = async (swapId: string, status: SwapUpdateEvent) => {
    const req = new sidecarrpc.SendWebHookRequest();
    req.setId(swapId);
    req.setStatus(status);

    try {
      const res = await this.unaryNodeCall<
        sidecarrpc.SendWebHookRequest,
        sidecarrpc.SendWebHookResponse
      >('sendWebHook', req, false);
      return res.getOk();
    } catch (e) {
      // Ignore not found errors
      if ((e as any).code === Status.NOT_FOUND) {
        return true;
      }

      throw e;
    }
  };

  private tryConnect = async () => {
    this.client = new BoltzRClient(
      `${this.config.grpc.host}:${this.config.grpc.port}`,
      createSsl(Sidecar.serviceName, Sidecar.symbol, {
        rootCertPath: path.join(this.config.grpc.certificates, 'ca.pem'),
        certChainPath: path.join(this.config.grpc.certificates, 'client.pem'),
        privateKeyPath: path.join(
          this.config.grpc.certificates,
          'client-key.pem',
        ),
      }),
      {
        ...grpcOptions,
        'grpc.ssl_target_name_override': 'sidecar',
      },
    );

    try {
      await this.getInfo();
      this.setClientStatus(ClientStatus.Connected);
    } catch (error) {
      this.setClientStatus(ClientStatus.Disconnected);
      throw error;
    }

    return true;
  };

  private unaryNodeCall = <T, U>(
    methodName: keyof BoltzRClient,
    params: T,
    toObject = true,
  ): Promise<U> => {
    return unaryCall(
      this.client,
      methodName,
      params,
      this.clientMeta,
      toObject,
    );
  };
}

export default Sidecar;
export { SidecarConfig };
