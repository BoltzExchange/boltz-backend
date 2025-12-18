import { credentials } from '@grpc/grpc-js';
import * as console from 'console';
import path from 'path';
import { coinsToSatoshis } from '../DenominationConverter';
import { stringify } from '../Utils';
import { CertificatePrefix } from '../grpc/Certificates';
import GrpcServer from '../grpc/GrpcServer';
import { grpcOptions } from '../lightning/GrpcUtils';
import { createSsl } from '../lightning/cln/Types';
import { BoltzClient } from '../proto/boltzrpc_grpc_pb';
import type { RpcType } from './BuilderComponents';

const invalidAmountError = new Error('invalid amount');

export interface GrpcResponse {
  toObject: () => any;
}

export const loadBoltzClient = (argv: RpcType): BoltzClient => {
  const address = `${argv.rpc.host}:${argv.rpc.port}`;

  if (argv.rpc['disable-ssl']) {
    return new BoltzClient(address, credentials.createInsecure());
  } else {
    const creds = createSsl('Boltz', 'gRPC', {
      rootCertPath: path.join(
        argv.rpc.certificates,
        `${CertificatePrefix.CA}.pem`,
      ),
      certChainPath: path.join(
        argv.rpc.certificates,
        `${CertificatePrefix.Client}.pem`,
      ),
      privateKeyPath: path.join(
        argv.rpc.certificates,
        `${CertificatePrefix.Client}-key.pem`,
      ),
    });
    return new BoltzClient(
      address,
      creds,
      grpcOptions(GrpcServer.certificateSubject),
    );
  }
};

export const callback = <T extends GrpcResponse>(
  formatter?: (res: T) => any,
): ((error: Error | null, response: T) => void) => {
  return (error: Error | null, response: T) => {
    if (error) {
      printError(error);

      // eslint-disable-next-line n/no-process-exit
      process.exit(1);
    } else {
      const responseObj = response.toObject();

      if (Object.keys(responseObj).length === 0) {
        console.log('success');
      } else {
        printResponse(
          formatter !== undefined ? formatter(response) : responseObj,
        );
      }
    }
  };
};

export const printResponse = (response: unknown): void => {
  console.log(stringify(response));
};

export const printError = (error: Error): void => {
  console.error(`${error.name}: ${error.message}`);
};

export const parseAmount = (amount: string) => {
  const trimmed = amount.trim();
  if (trimmed.length === 0) {
    throw invalidAmountError;
  }

  let parsed = Number(trimmed);

  if (isNaN(parsed) || !Number.isFinite(parsed)) {
    throw invalidAmountError;
  }

  // Treat inputs that contain a decimal point or have a fractional part as coin amounts
  if (parsed % 1 !== 0 || trimmed.includes('.')) {
    parsed = Math.round(coinsToSatoshis(parsed));
  }

  if (!Number.isSafeInteger(parsed)) {
    throw invalidAmountError;
  }

  return Math.round(parsed);
};
