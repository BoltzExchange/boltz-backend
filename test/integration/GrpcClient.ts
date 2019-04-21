import fs from 'fs';
import { credentials, Metadata, ServiceError } from 'grpc';
import { GrpcConfig } from '../../lib/grpc/GrpcServer';
import { BoltzClient } from '../../lib/proto/boltzrpc_grpc_pb';

interface GrpcResponse {
  toObject: Function;
}

interface BoltzMethodIndex extends BoltzClient {
  [methodName: string]: Function;
}

class GrpcClient {
  public boltz!: BoltzClient;
  public meta = new Metadata();

  constructor(private grpcConfig: GrpcConfig) {}

  public init = () => {
    this.boltz = new BoltzClient(
      `${this.grpcConfig.host}:${this.grpcConfig.port}`,
      credentials.createSsl(fs.readFileSync(this.grpcConfig.certpath),
    ));
  }

  public unaryCall = <T, U>(methodName: string, params: T): Promise<U> => {
    return new Promise((resolve, reject) => {
      (this.boltz as BoltzMethodIndex)[methodName](params, this.meta, (err: ServiceError, response: GrpcResponse) => {
        if (err) {
          reject(err);
        } else {
          resolve(response.toObject());
        }
      });
    });
  }
}

export default GrpcClient;
