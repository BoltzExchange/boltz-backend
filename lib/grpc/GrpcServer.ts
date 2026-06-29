import type { KeyCertPair } from '@grpc/grpc-js';
import { Server, ServerCredentials } from '@grpc/grpc-js';
import { GrpcConfig } from '../Config';
import type Logger from '../Logger';
import { BoltzService } from '../proto/boltzrpc';
import { CertificatePrefix, getCertificate } from './Certificates';
import Errors from './Errors';
import type GrpcService from './GrpcService';
import type JwtSigner from './JwtSigner';
import { authInterceptor } from './interceptors/AuthInterceptor';
import { loggingInterceptor } from './interceptors/LoggingInterceptor';

class GrpcServer {
  public static readonly certificateSubject = 'boltz';

  private readonly server: Server;

  constructor(
    private logger: Logger,
    private config: GrpcConfig,
    grpcService: GrpcService,
    private jwtSigner: JwtSigner,
  ) {
    const interceptors = [loggingInterceptor(this.logger)];
    if (!this.config.jwt?.disable) {
      interceptors.push(authInterceptor(this.logger, this.jwtSigner));
    } else {
      this.logger.warn('gRPC JWT authentication is disabled');
    }
    this.server = new Server({ interceptors });

    this.server.addService(BoltzService, {
      stop: grpcService.stop,
      getInfo: grpcService.getInfo,
      getBalance: grpcService.getBalance,
      deriveKeys: grpcService.deriveKeys,
      deriveBlindingKeys: grpcService.deriveBlindingKeys,
      unblindOutputs: grpcService.unblindOutputs,
      getAddress: grpcService.getAddress,
      sendCoins: grpcService.sendCoins,
      addReferral: grpcService.addReferral,
      rotateReferralKeys: grpcService.rotateReferralKeys,
      sweepSwaps: grpcService.sweepSwaps,
      listSwaps: grpcService.listSwaps,
      rescan: grpcService.rescan,
      checkTransaction: grpcService.checkTransaction,
      setSwapStatus: grpcService.setSwapStatus,
      allowRefund: grpcService.allowRefund,
      disableSigners: grpcService.disableSigners,
      enableSigners: grpcService.enableSigners,
      getDisabledSigners: grpcService.getDisabledSigners,
      devHeapDump: grpcService.devHeapDump,
      getLockedFunds: grpcService.getLockedFunds,
      getPendingSweeps: grpcService.getPendingSweeps,
      getLabel: grpcService.getLabel,
      getPendingEvmTransactions: grpcService.getPendingEvmTransactions,
      setLogLevel: grpcService.setLogLevel,
      calculateTransactionFee: grpcService.calculateTransactionFee,
      swapCreationHook: grpcService.swapCreationHook,
      invoiceCreationHook: grpcService.invoiceCreationHook,
      transactionHook: grpcService.transactionHook,
      sendApprovalHook: grpcService.sendApprovalHook,
      invoicePaymentHook: grpcService.invoicePaymentHook,
      getReferrals: grpcService.getReferrals,
      setReferral: grpcService.setReferral,
      invoiceClnThreshold: grpcService.invoiceClnThreshold,
      devClearSwapUpdateCache: grpcService.devClearSwapUpdateCache,
      devRefreshBalanceCache: grpcService.devRefreshBalanceCache,
      issueJwt: grpcService.issueJwt,
      revokeJwt: grpcService.revokeJwt,
      listJwts: grpcService.listJwts,
      listMethods: grpcService.listMethods,
    });
  }

  public listen = async () => {
    const { port, host } = this.config;

    if (!Number.isInteger(port) || port > 65535) {
      throw 'invalid port for gRPC server';
    }

    if (!this.config.jwt?.disable) {
      await this.jwtSigner.ensureAdminToken();
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
