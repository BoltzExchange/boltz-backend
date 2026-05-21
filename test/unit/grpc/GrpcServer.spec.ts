import {
  Metadata,
  type ServiceError,
  credentials,
  type sendUnaryData,
  status,
} from '@grpc/grpc-js';
import fs from 'fs';
import { createServer } from 'net';
import os from 'os';
import path from 'path';
import Logger from '../../../lib/Logger';
import Database from '../../../lib/db/Database';
import {
  CertificatePrefix,
  getCertificate,
} from '../../../lib/grpc/Certificates';
import GrpcServer from '../../../lib/grpc/GrpcServer';
import type GrpcService from '../../../lib/grpc/GrpcService';
import JwtSigner from '../../../lib/grpc/JwtSigner';
import { grpcOptions } from '../../../lib/lightning/GrpcUtils';
import { createSsl } from '../../../lib/lightning/cln/Types';
import { BoltzClient } from '../../../lib/proto/boltzrpc';
import type * as boltzrpc from '../../../lib/proto/boltzrpc';
import { getPort } from '../../Utils';

const promisifyCall = <K, T>(
  client: BoltzClient,
  method: keyof BoltzClient,
  params: K,
  metadata?: Metadata,
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const cb = (err: ServiceError, response: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(response);
      }
    };
    if (metadata) {
      client[method as any](params, metadata, cb);
    } else {
      client[method as any](params, cb);
    }
  });
};

const bearerMetadata = (token: string): Metadata => {
  const md = new Metadata();
  md.set('authorization', `Bearer ${token}`);
  return md;
};

const readAdminToken = (certsDir: string): string =>
  fs.readFileSync(path.join(certsDir, 'admin.jwt'), 'utf-8').trim();

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
  let database: Database;
  let signer: JwtSigner;

  beforeAll(async () => {
    certsDir = mkTempDir();
    populateCerts(certsDir);

    // Separate dir with a different CA so its client cert is rejected by the server
    invalidCertsDir = mkTempDir();
    populateCerts(invalidCertsDir);

    database = new Database(Logger.disabledLogger, Database.memoryDatabase);
    await database.init();
    signer = new JwtSigner(Logger.disabledLogger, { certificates: certsDir });
  }, 30_000);

  afterAll(async () => {
    rmDir(certsDir);
    rmDir(invalidCertsDir);
    await database.close();
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
      signer,
    );
    await server.listen();

    const client = loadBoltzClient('127.0.0.1', port);
    const auth = bearerMetadata(readAdminToken(certsDir));

    expect(
      (
        await promisifyCall<boltzrpc.GetInfoRequest, boltzrpc.GetInfoResponse>(
          client,
          'getInfo',
          {},
          auth,
        )
      ).version,
    ).toEqual('1');

    client.close();
    await server.close();
  });

  test('should reject calls without authorization metadata', async () => {
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
      signer,
    );
    await server.listen();

    const client = loadBoltzClient('127.0.0.1', port);

    await expect(
      promisifyCall<boltzrpc.GetInfoRequest, boltzrpc.GetInfoResponse>(
        client,
        'getInfo',
        {},
      ),
    ).rejects.toMatchObject({ code: status.UNAUTHENTICATED });

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
      signer,
    );
    await server.listen();

    const client = loadBoltzClient('127.0.0.1', port, certsDir);
    const auth = bearerMetadata(readAdminToken(certsDir));

    expect(
      (
        await promisifyCall<boltzrpc.GetInfoRequest, boltzrpc.GetInfoResponse>(
          client,
          'getInfo',
          {},
          auth,
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
      signer,
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
      signer,
    );
    await server.listen();

    const client = loadBoltzClient('127.0.0.1', port, invalidCertsDir);
    const auth = bearerMetadata(readAdminToken(certsDir));

    await expect(
      promisifyCall<boltzrpc.GetInfoRequest, boltzrpc.GetInfoResponse>(
        client,
        'getInfo',
        {},
        auth,
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
      signer,
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
      signer,
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
