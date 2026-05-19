import {
  type ServiceError,
  credentials,
  type sendUnaryData,
} from '@grpc/grpc-js';
import fs from 'fs';
import { createServer } from 'net';
import os from 'os';
import path from 'path';
import Logger from '../../../lib/Logger';
import {
  CertificatePrefix,
  getCertificate,
} from '../../../lib/grpc/Certificates';
import GrpcServer from '../../../lib/grpc/GrpcServer';
import type GrpcService from '../../../lib/grpc/GrpcService';
import { grpcOptions } from '../../../lib/lightning/GrpcUtils';
import { createSsl } from '../../../lib/lightning/cln/Types';
import { BoltzClient } from '../../../lib/proto/boltzrpc';
import type * as boltzrpc from '../../../lib/proto/boltzrpc';
import { getPort } from '../../Utils';

const promisifyCall = <K, T>(
  client: BoltzClient,
  method: keyof BoltzClient,
  params: K,
): Promise<T> => {
  return new Promise((resolve, reject) => {
    client[method as any](params, (err: ServiceError, response: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(response);
      }
    });
  });
};

const loadBoltzClient = (
  host: string,
  port: number,
  certificates?: string,
): BoltzClient => {
  const address = `${host}:${port}`;

  if (certificates !== undefined) {
    const creds = createSsl('Boltz', 'gRPC', {
      rootCertPath: path.join(certificates, `${CertificatePrefix.CA}.pem`),
      certChainPath: path.join(certificates, `${CertificatePrefix.Client}.pem`),
      privateKeyPath: path.join(
        certificates,
        `${CertificatePrefix.Client}-key.pem`,
      ),
    });

    return new BoltzClient(
      address,
      creds,
      grpcOptions(GrpcServer.certificateSubject),
    );
  } else {
    return new BoltzClient(address, credentials.createInsecure());
  }
};

const mkTempDir = () =>
  fs.mkdtempSync(path.join(os.tmpdir(), 'boltz-grpcserver-test-'));

const rmDir = (dir: string) => {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true });
  }
};

// Generating RSA keypairs via node-forge is ~1.5s each, and each gRPC
// server start materializes CA + server + client certs. Generate them once
// in beforeAll and reuse across tests that only need a working SSL handshake
const populateCerts = (dir: string) => {
  const caCert = getCertificate(
    Logger.disabledLogger,
    GrpcServer.certificateSubject,
    dir,
    CertificatePrefix.CA,
  );
  getCertificate(
    Logger.disabledLogger,
    GrpcServer.certificateSubject,
    dir,
    CertificatePrefix.Server,
    caCert,
  );
  getCertificate(
    Logger.disabledLogger,
    GrpcServer.certificateSubject,
    dir,
    CertificatePrefix.Client,
    caCert,
  );
};

describe('GrpcServer', () => {
  const grpcService = {
    getInfo: jest
      .fn()
      .mockImplementation(
        (_, callback: sendUnaryData<boltzrpc.GetInfoResponse>) => {
          callback(null, { version: '1', chains: {} });
        },
      ),
  } as unknown as GrpcService;

  let certsDir: string;
  let invalidCertsDir: string;

  beforeAll(() => {
    certsDir = mkTempDir();
    populateCerts(certsDir);

    // Separate dir with a different CA so its client cert is rejected by the server
    invalidCertsDir = mkTempDir();
    populateCerts(invalidCertsDir);
  }, 30_000);

  afterAll(() => {
    rmDir(certsDir);
    rmDir(invalidCertsDir);
  });

  test('should create insecure server', async () => {
    const port = await getPort();
    const server = new GrpcServer(
      Logger.disabledLogger,
      {
        port,
        disableSsl: true,
        host: '127.0.0.1',
        certificates: certsDir,
      },
      grpcService,
    );
    await server.listen();

    const client = loadBoltzClient('127.0.0.1', port);

    expect(
      (
        await promisifyCall<boltzrpc.GetInfoRequest, boltzrpc.GetInfoResponse>(
          client,
          'getInfo',
          {},
        )
      ).version,
    ).toEqual('1');

    client.close();
    await server.close();
  });

  test('should create secure server', async () => {
    const port = await getPort();
    const server = new GrpcServer(
      Logger.disabledLogger,
      {
        port,
        host: '127.0.0.1',
        certificates: certsDir,
      },
      grpcService,
    );
    await server.listen();

    const client = loadBoltzClient('127.0.0.1', port, certsDir);

    expect(
      (
        await promisifyCall<boltzrpc.GetInfoRequest, boltzrpc.GetInfoResponse>(
          client,
          'getInfo',
          {},
        )
      ).version,
    ).toEqual('1');

    client.close();
    await server.close();
  });

  test('should not regenerate existing certificates', async () => {
    const port = await getPort();
    const server = new GrpcServer(
      Logger.disabledLogger,
      {
        port,
        host: '127.0.0.1',
        certificates: certsDir,
      },
      grpcService,
    );

    const preServerPem = fs.readFileSync(path.join(certsDir, 'server.pem'));
    await server.listen();
    await server.close();

    expect(fs.readFileSync(path.join(certsDir, 'server.pem'))).toEqual(
      preServerPem,
    );
  });

  test('should not allow clients with invalid certificates', async () => {
    const port = await getPort();
    const server = new GrpcServer(
      Logger.disabledLogger,
      {
        port,
        host: '127.0.0.1',
        certificates: certsDir,
      },
      grpcService,
    );
    await server.listen();

    const client = loadBoltzClient('127.0.0.1', port, invalidCertsDir);

    await expect(
      promisifyCall<boltzrpc.GetInfoRequest, boltzrpc.GetInfoResponse>(
        client,
        'getInfo',
        {},
      ),
    ).rejects.toEqual(expect.anything());

    client.close();
    await server.close();
  });

  test('should throw when trying to bind to impossible port', async () => {
    const server = new GrpcServer(
      Logger.disabledLogger,
      {
        port: 65535 + 1,
        host: '127.0.0.1',
        certificates: certsDir,
      },
      grpcService,
    );
    await expect(server.listen()).rejects.toEqual(
      'invalid port for gRPC server',
    );
  });

  test('should throw when binding to port fails', async () => {
    const port = await getPort();
    const host = '127.0.0.1';
    const server = new GrpcServer(
      Logger.disabledLogger,
      {
        port,
        host,
        certificates: certsDir,
      },
      grpcService,
    );

    // Have something else use the port
    const collisionServer = createServer();
    await new Promise<void>((resolve) => {
      collisionServer.listen(port, host, () => resolve());
    });

    await expect(server.listen()).rejects.toEqual(expect.anything());

    await server.close();
    await new Promise<void>((resolve) => {
      collisionServer.close(() => {
        resolve();
      });
    });
  });
});
