import { KeyCertPair, Server, ServerCredentials } from '@grpc/grpc-js';
import { GrpcConfig } from '../Config';
import Logger from '../Logger';
import { BoltzService } from '../proto/boltzrpc_grpc_pb';
import { CertificatePrefix, getCertificate } from './Certificates';
import Errors from './Errors';
import GrpcService from './GrpcService';
import { loggingInterceptor } from './Interceptors';

class GrpcServer {
  public static readonly certificateSubject = 'boltz';

  private readonly server: Server;

  constructor(
    private logger: Logger,
    private config: GrpcConfig,
    grpcService: GrpcService,
  ) {
    this.server = new Server({
      interceptors: [loggingInterceptor(this.logger)],
    });

    this.server.addService(BoltzService, {
      stop: grpcService.stop,
      getInfo: grpcService.getInfo,
      getBalance: grpcService.getBalance,
      deriveKeys: grpcService.deriveKeys,
      deriveBlindingKeys: grpcService.deriveBlindingKeys,
      unblindOutputs: grpcService.unblindOutputs,
      getAddress: grpcService.getAddress,
      sendCoins: grpcService.sendCoins,
      updateTimeoutBlockDelta: grpcService.updateTimeoutBlockDelta,
      addReferral: grpcService.addReferral,
      sweepSwaps: grpcService.sweepSwaps,
      listSwaps: grpcService.listSwaps,
      rescan: grpcService.rescan,
      setSwapStatus: grpcService.setSwapStatus,
      allowRefund: grpcService.allowRefund,
      devHeapDump: grpcService.devHeapDump,
      getLockedFunds: grpcService.getLockedFunds,
      getPendingSweeps: grpcService.getPendingSweeps,
      getLabel: grpcService.getLabel,
      setLogLevel: grpcService.setLogLevel,
      calculateTransactionFee: grpcService.calculateTransactionFee,
      getReferrals: grpcService.getReferrals,
      setReferral: grpcService.setReferral,
    });
  }

  public listen = async () => {
    const { port, host } = this.config;

    if (!Number.isInteger(port) || port > 65535) {
      throw 'invalid port for gRPC server';
    }

    await new Promise<void>((resolve, reject) => {
      let credentials: ServerCredentials;

      if (this.config.disableSsl) {
        this.logger.warn('Creating insecure gRPC server');
        credentials = ServerCredentials.createInsecure();
      } else {
        this.logger.debug('Creating gRPC server with SSL authentication');
        const { rootCert, serverCert } = this.loadCertificates();
        credentials = ServerCredentials.createSsl(rootCert, [serverCert], true);
      }

      this.server.bindAsync(
        `${host}:${port}`,
        credentials,
        (error, bindPort) => {
          if (error) {
            reject(Errors.COULD_NOT_BIND(host, port, error.message));
          } else {
            this.logger.info(`gRPC server listening on: ${host}:${bindPort}`);
            resolve();
          }
        },
      );
    });
  };

  public close = () => {
    return new Promise<void>((resolve, reject) => {
      this.server.tryShutdown((error) => {
        if (error) {
          reject(error);
        } else {
          this.logger.info('Shut down gRPC server');
          resolve();
        }
      });
    });
  };

  private loadCertificates = (): {
    rootCert: Buffer;
    serverCert: KeyCertPair;
  } => {
    const caCert = getCertificate(
      this.logger,
      GrpcServer.certificateSubject,
      this.config.certificates,
      CertificatePrefix.CA,
    );
    const serverCert = getCertificate(
      this.logger,
      GrpcServer.certificateSubject,
      this.config.certificates,
      CertificatePrefix.Server,
      caCert,
    );

    // Not being used but called to create them
    getCertificate(
      this.logger,
      GrpcServer.certificateSubject,
      this.config.certificates,
      CertificatePrefix.Client,
      caCert,
    );

    return {
      serverCert,
      rootCert: caCert.cert_chain,
    };
  };
}

export default GrpcServer;
export { GrpcConfig };
