import type { ServiceError, sendUnaryData } from '@grpc/grpc-js';
import fs from 'fs';
import { createServer } from 'net';
import path from 'path';
import Logger from '../../../lib/Logger';
import { loadBoltzClient } from '../../../lib/cli/Command';
import {
  CertificatePrefix,
  getCertificate,
} from '../../../lib/grpc/Certificates';
import GrpcServer from '../../../lib/grpc/GrpcServer';
import type GrpcService from '../../../lib/grpc/GrpcService';
import type { BoltzClient } from '../../../lib/proto/boltzrpc_grpc_pb';
import * as boltzrpc from '../../../lib/proto/boltzrpc_pb';
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

describe('GrpcServer', () => {
  const grpcService = {
    getInfo: jest
      .fn()
      .mockImplementation(
        (_, callback: sendUnaryData<boltzrpc.GetInfoResponse>) => {
          const res = new boltzrpc.GetInfoResponse();
          res.setVersion('1');
          callback(null, res);
        },
      ),
  } as unknown as GrpcService;

  const certsDir = path.join(__dirname, 'serverCertificates');

  const cleanup = () => {
    if (fs.existsSync(certsDir)) {
      fs.rmSync(certsDir, { recursive: true });
    }
  };

  beforeEach(() => {
    cleanup();
  });

  afterAll(() => {
    cleanup();
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

    const client = loadBoltzClient({
      rpc: {
        port,
        host: '127.0.0.1',
        certificates: certsDir,
        'disable-ssl': true,
      },
    });

    expect(
      (
        await promisifyCall<boltzrpc.GetInfoRequest, boltzrpc.GetInfoResponse>(
          client,
          'getInfo',
          new boltzrpc.GetInfoRequest(),
        )
      ).getVersion(),
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

    const client = loadBoltzClient({
      rpc: {
        port,
        host: '127.0.0.1',
        'disable-ssl': false,
        certificates: certsDir,
      },
    });

    expect(
      (
        await promisifyCall<boltzrpc.GetInfoRequest, boltzrpc.GetInfoResponse>(
          client,
          'getInfo',
          new boltzrpc.GetInfoRequest(),
        )
      ).getVersion(),
    ).toEqual('1');

    client.close();
    await server.close();
  });

  test('should not regenerate existing certificates', async () => {
    const port = await getPort();
    let server = new GrpcServer(
      Logger.disabledLogger,
      {
        port,
        host: '127.0.0.1',
        certificates: certsDir,
      },
      grpcService,
    );
    await server.listen();
    await server.close();

    const preRestartServerPem = fs.readFileSync(
      path.join(certsDir, 'server.pem'),
    );

    server = new GrpcServer(
      Logger.disabledLogger,
      {
        port,
        host: '127.0.0.1',
        certificates: certsDir,
      },
      grpcService,
    );
    await server.listen();
    await server.close();

    expect(preRestartServerPem).toEqual(
      fs.readFileSync(path.join(certsDir, 'server.pem')),
    );
  }, 10_000);

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

    // Create an invalid client certificate
    cleanup();
    const caCert = getCertificate(
      Logger.disabledLogger,
      GrpcServer.certificateSubject,
      certsDir,
      CertificatePrefix.CA,
    );
    getCertificate(
      Logger.disabledLogger,
      GrpcServer.certificateSubject,
      certsDir,
      CertificatePrefix.Client,
      caCert,
    );

    const client = loadBoltzClient({
      rpc: {
        port,
        host: '127.0.0.1',
        'disable-ssl': false,
        certificates: certsDir,
      },
    });

    await expect(
      promisifyCall<boltzrpc.GetInfoRequest, boltzrpc.GetInfoResponse>(
        client,
        'getInfo',
        new boltzrpc.GetInfoRequest(),
      ),
    ).rejects.toEqual(expect.anything());

    client.close();
    await server.close();
  }, 10_000);

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
    collisionServer.listen(port, host, () => {});

    await expect(server.listen()).rejects.toEqual(expect.anything());

    await server.close();
    await new Promise<void>((resolve) => {
      collisionServer.close(() => {
        resolve();
      });
    });
  }, 10_000);
});
