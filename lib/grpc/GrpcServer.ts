import fs from 'fs';
import grpc, { Server } from 'grpc';
import Logger from '../Logger';
import Errors from './Errors';
import GrpcService from './GrpcService';
import Service from '../service/Service';
import { BoltzService } from '../proto/boltzrpc_grpc_pb';
import assert from 'assert';

type GrpcConfig = {
  host: string,
  port: number,
  certpath: string,
  keypath: string,
};

class GrpcServer {
  private server: Server;

  constructor(private logger: Logger, service: Service, private grpcConfig: GrpcConfig) {
    this.server = new grpc.Server();

    const grpcService = new GrpcService(service);
    this.server.addService(BoltzService, {
      getInfo: grpcService.getInfo,
      getBalance: grpcService.getBalance,
      newAddress: grpcService.newAddress,
      getTransaction: grpcService.getTransaction,
      broadcastTransaction: grpcService.broadcastTransaction,
      listenOnAddress: grpcService.listenOnAddress,
      subscribeTransactions: grpcService.subscribeTransactions,
      createSwap: grpcService.createSwap,
      createReverseSwap: grpcService.createReverseSwap,
    });
  }

  public listen = async () => {
    const { port, host, certpath, keypath } = this.grpcConfig;
    const cert = fs.readFileSync(certpath);
    const key = fs.readFileSync(keypath);

    assert(Number.isInteger(port) && port > 1023 && port < 65536, 'port must be an integer between 1024 and 65536');
    // tslint:disable-next-line:no-null-keyword
    const serverCert = grpc.ServerCredentials.createSsl(null,
      [{
        cert_chain: cert,
        private_key: key,
      }], false);
    const bindCode = this.server.bind(`${host}:${port}`, serverCert);

    if (bindCode !== port) {
      throw Errors.COULD_NOT_BIND(host, port);
    } else {
      this.server.start();
      this.logger.info(`gRPC server listening on: ${host}:${port}`);
    }
  }

  public close = async () => {
    return new Promise((resolve) => {
      this.server.tryShutdown(() => {
        this.logger.info('GRPC server completed shutdown');
        resolve();
      });
    });
  }
}

export default GrpcServer;
export { GrpcConfig };
