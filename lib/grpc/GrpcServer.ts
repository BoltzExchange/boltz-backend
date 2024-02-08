import { Server, ServerCredentials } from '@grpc/grpc-js';
import assert from 'assert';
import { GrpcConfig } from '../Config';
import Logger from '../Logger';
import { BoltzService } from '../proto/boltzrpc_grpc_pb';
import Errors from './Errors';
import GrpcService from './GrpcService';

class GrpcServer {
  private server: Server;

  constructor(
    private logger: Logger,
    private grpcConfig: GrpcConfig,
    grpcService: GrpcService,
  ) {
    this.server = new Server();

    this.server.addService(BoltzService, {
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
    });
  }

  public listen = (): Promise<void> => {
    const { port, host } = this.grpcConfig;

    assert(
      Number.isInteger(port) && port > 1023 && port < 65536,
      'port must be an integer between 1024 and 65536',
    );

    return new Promise<void>((resolve, reject) => {
      this.server.bindAsync(
        `${host}:${port}`,
        ServerCredentials.createInsecure(),
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

  public close = (): Promise<void> => {
    return new Promise((resolve) => {
      this.server.tryShutdown(() => {
        this.logger.info('gRPC server completed shutdown');
        resolve();
      });
    });
  };
}

export default GrpcServer;
export { GrpcConfig };
