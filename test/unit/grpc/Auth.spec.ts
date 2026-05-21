import {
  Metadata,
  type ServiceError,
  credentials,
  type sendUnaryData,
  status,
} from '@grpc/grpc-js';
import { createHmac } from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import Logger from '../../../lib/Logger';
import Database from '../../../lib/db/Database';
import JwtToken from '../../../lib/db/models/JwtToken';
import JwtTokenRepository from '../../../lib/db/repositories/JwtTokenRepository';
import GrpcServer from '../../../lib/grpc/GrpcServer';
import type GrpcService from '../../../lib/grpc/GrpcService';
import JwtSigner from '../../../lib/grpc/JwtSigner';
import { BoltzClient } from '../../../lib/proto/boltzrpc';
import type * as boltzrpc from '../../../lib/proto/boltzrpc';
import { getPort } from '../../Utils';

const b64url = (input: string | Buffer): string =>
  Buffer.from(input).toString('base64url');

const forgeJwt = (
  header: Record<string, unknown>,
  payload: Record<string, unknown>,
  secret?: Buffer,
  forceSig?: string,
): string => {
  const h = b64url(JSON.stringify(header));
  const p = b64url(JSON.stringify(payload));
  const input = `${h}.${p}`;
  let sig: string;
  if (secret) {
    sig = createHmac('sha256', secret).update(input).digest('base64url');
  } else {
    sig = forceSig ?? '';
  }
  return `${input}.${sig}`;
};

const promisifyCall = <K, T>(
  client: BoltzClient,
  method: keyof BoltzClient,
  params: K,
  metadata?: Metadata,
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const cb = (err: ServiceError | null, response: any) => {
      if (err) reject(err);
      else resolve(response);
    };
    if (metadata) {
      client[method as any](params, metadata, cb);
    } else {
      client[method as any](params, cb);
    }
  });
};

const bearer = (token: string): Metadata => {
  const md = new Metadata();
  md.set('authorization', `Bearer ${token}`);
  return md;
};

const raw = (header: string): Metadata => {
  const md = new Metadata();
  md.set('authorization', header);
  return md;
};

describe('auth (end-to-end)', () => {
  const getInfoImpl = jest
    .fn()
    .mockImplementation(
      (_: any, callback: sendUnaryData<boltzrpc.GetInfoResponse>) => {
        callback(null, { version: 'ok', chains: {} });
      },
    );
  const getBalanceImpl = jest
    .fn()
    .mockImplementation(
      (_: any, callback: sendUnaryData<boltzrpc.GetBalanceResponse>) => {
        callback(null, { balances: {} });
      },
    );
  const grpcService = {
    getInfo: getInfoImpl,
    getBalance: getBalanceImpl,
  } as unknown as GrpcService;

  let dir: string;
  let database: Database;
  let signer: JwtSigner;
  let server: GrpcServer;
  let client: BoltzClient;
  let secret: Buffer;

  beforeAll(async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'boltz-auth-spec-'));

    database = new Database(Logger.disabledLogger, Database.memoryDatabase);
    await database.init();

    signer = new JwtSigner(Logger.disabledLogger, { certificates: dir });
    secret = fs.readFileSync(path.join(dir, 'jwt.key'));

    const port = await getPort();
    server = new GrpcServer(
      Logger.disabledLogger,
      {
        port,
        host: '127.0.0.1',
        disableSsl: true,
        certificates: dir,
      },
      grpcService,
      signer,
    );
    await server.listen();

    client = new BoltzClient(`127.0.0.1:${port}`, credentials.createInsecure());
  });

  afterAll(async () => {
    client.close();
    await server.close();
    await database.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  beforeEach(async () => {
    await JwtToken.truncate();
    jest.clearAllMocks();
  });

  const issue = async (
    overrides: Partial<{
      label: string;
      allowedMethods: string[];
      expiresAt: Date | null;
      revokedAt: Date | null;
    }> = {},
  ): Promise<string> => {
    const issuedAt = new Date();
    const row = await JwtTokenRepository.issue({
      label: overrides.label ?? 'test',
      allowedMethods: overrides.allowedMethods ?? ['*'],
      issuedAt,
      expiresAt: overrides.expiresAt ?? null,
    });
    if (overrides.revokedAt !== undefined && overrides.revokedAt !== null) {
      await row.update({ revokedAt: overrides.revokedAt });
    }
    return signer.sign(row.id, issuedAt, overrides.expiresAt);
  };

  const callGetInfo = (md?: Metadata) =>
    promisifyCall<boltzrpc.GetInfoRequest, boltzrpc.GetInfoResponse>(
      client,
      'getInfo',
      {},
      md,
    );

  const callGetBalance = (md?: Metadata) =>
    promisifyCall<boltzrpc.GetBalanceRequest, boltzrpc.GetBalanceResponse>(
      client,
      'getBalance',
      {},
      md,
    );

  describe('rejections (UNAUTHENTICATED)', () => {
    test('no authorization metadata', async () => {
      await expect(callGetInfo()).rejects.toMatchObject({
        code: status.UNAUTHENTICATED,
      });
      expect(getInfoImpl).not.toHaveBeenCalled();
    });

    test('empty authorization header', async () => {
      await expect(callGetInfo(raw(''))).rejects.toMatchObject({
        code: status.UNAUTHENTICATED,
      });
      expect(getInfoImpl).not.toHaveBeenCalled();
    });

    test('wrong scheme (Basic)', async () => {
      await expect(callGetInfo(raw('Basic xxx'))).rejects.toMatchObject({
        code: status.UNAUTHENTICATED,
      });
    });

    test('Bearer with empty token', async () => {
      await expect(callGetInfo(raw('Bearer '))).rejects.toMatchObject({
        code: status.UNAUTHENTICATED,
      });
    });

    test('garbage token', async () => {
      await expect(callGetInfo(bearer('not-a-jwt'))).rejects.toMatchObject({
        code: status.UNAUTHENTICATED,
      });
    });

    test('alg:none token (header claims no signature)', async () => {
      const token = forgeJwt(
        { alg: 'none', typ: 'JWT' },
        { jti: 'attacker', iat: Math.floor(Date.now() / 1000) },
      );
      await expect(callGetInfo(bearer(token))).rejects.toMatchObject({
        code: status.UNAUTHENTICATED,
      });
    });

    test('alg:RS256 token (algorithm confusion)', async () => {
      const token = forgeJwt(
        { alg: 'RS256', typ: 'JWT' },
        { jti: 'attacker', iat: Math.floor(Date.now() / 1000) },
        secret,
      );
      await expect(callGetInfo(bearer(token))).rejects.toMatchObject({
        code: status.UNAUTHENTICATED,
      });
    });

    test('tampered signature', async () => {
      const token = await issue();
      const parts = token.split('.');
      const sig = Buffer.from(parts[2], 'base64url');
      sig[0] ^= 0x01;
      const tampered = `${parts[0]}.${parts[1]}.${sig.toString('base64url')}`;
      await expect(callGetInfo(bearer(tampered))).rejects.toMatchObject({
        code: status.UNAUTHENTICATED,
      });
    });

    test('tampered payload (jti swapped post-signature)', async () => {
      const real = await issue();
      const evil = await issue();
      // Splice real signature onto evil payload
      const realParts = real.split('.');
      const evilParts = evil.split('.');
      const tampered = `${realParts[0]}.${evilParts[1]}.${realParts[2]}`;
      await expect(callGetInfo(bearer(tampered))).rejects.toMatchObject({
        code: status.UNAUTHENTICATED,
      });
    });

    test('expired token (exp in the past)', async () => {
      const token = await issue({
        expiresAt: new Date(Date.now() - 60_000),
      });
      await expect(callGetInfo(bearer(token))).rejects.toMatchObject({
        code: status.UNAUTHENTICATED,
      });
    });

    test('unknown jti (signed correctly but no DB row)', async () => {
      const token = await signer.sign('phantom-no-row', new Date());
      await expect(callGetInfo(bearer(token))).rejects.toMatchObject({
        code: status.UNAUTHENTICATED,
      });
    });

    test('revoked token', async () => {
      const token = await issue({ revokedAt: new Date() });
      await expect(callGetInfo(bearer(token))).rejects.toMatchObject({
        code: status.UNAUTHENTICATED,
      });
    });

    test('token signed with a different secret', async () => {
      const otherSigner = new JwtSigner(Logger.disabledLogger, {
        certificates: dir,
        jwt: { secretFile: path.join(dir, 'other.key') },
      });
      const issuedAt = new Date();
      const row = await JwtTokenRepository.issue({
        label: 'attacker',
        allowedMethods: ['*'],
        issuedAt,
        expiresAt: null,
      });
      const token = await otherSigner.sign(row.id, issuedAt);
      await expect(callGetInfo(bearer(token))).rejects.toMatchObject({
        code: status.UNAUTHENTICATED,
      });
    });
  });

  describe('internal errors', () => {
    test('DB failure during getActive sends INTERNAL instead of hanging', async () => {
      const token = await issue({ allowedMethods: ['*'] });
      const spy = jest
        .spyOn(JwtTokenRepository, 'getActive')
        .mockRejectedValueOnce(new Error('db boom'));

      await expect(callGetInfo(bearer(token))).rejects.toMatchObject({
        code: status.INTERNAL,
      });
      expect(getInfoImpl).not.toHaveBeenCalled();

      spy.mockRestore();
    });
  });

  describe('rejections (PERMISSION_DENIED)', () => {
    test('allowedMethods does not include the called path', async () => {
      const token = await issue({
        allowedMethods: ['/boltzrpc.Boltz/GetBalance'],
      });
      await expect(callGetInfo(bearer(token))).rejects.toMatchObject({
        code: status.PERMISSION_DENIED,
      });
      expect(getInfoImpl).not.toHaveBeenCalled();
    });

    test('allowedMethods is empty', async () => {
      const token = await issue({ allowedMethods: [] });
      await expect(callGetInfo(bearer(token))).rejects.toMatchObject({
        code: status.PERMISSION_DENIED,
      });
    });

    test('service wildcard does not cross packages', async () => {
      const token = await issue({
        allowedMethods: ['/different.Service/*'],
      });
      await expect(callGetInfo(bearer(token))).rejects.toMatchObject({
        code: status.PERMISSION_DENIED,
      });
    });
  });

  describe('accepts (OK)', () => {
    test('global wildcard "*"', async () => {
      const token = await issue({ allowedMethods: ['*'] });
      const r = await callGetInfo(bearer(token));
      expect(r.version).toBe('ok');
      expect(getInfoImpl).toHaveBeenCalledTimes(1);
    });

    test('service wildcard for the right service', async () => {
      const token = await issue({ allowedMethods: ['/boltzrpc.Boltz/*'] });
      const r1 = await callGetInfo(bearer(token));
      const r2 = await callGetBalance(bearer(token));
      expect(r1.version).toBe('ok');
      expect(r2.balances).toEqual({});
    });

    test('exact method match', async () => {
      const token = await issue({
        allowedMethods: ['/boltzrpc.Boltz/GetInfo'],
      });
      const r = await callGetInfo(bearer(token));
      expect(r.version).toBe('ok');
    });

    test('exact method match denies other methods on the same token', async () => {
      const token = await issue({
        allowedMethods: ['/boltzrpc.Boltz/GetInfo'],
      });
      await callGetInfo(bearer(token));
      await expect(callGetBalance(bearer(token))).rejects.toMatchObject({
        code: status.PERMISSION_DENIED,
      });
    });

    test('multiple exact paths', async () => {
      const token = await issue({
        allowedMethods: [
          '/boltzrpc.Boltz/GetInfo',
          '/boltzrpc.Boltz/GetBalance',
        ],
      });
      await callGetInfo(bearer(token));
      await callGetBalance(bearer(token));
    });
  });

  describe('jwt.disable config knob', () => {
    let disabledDir: string;
    let disabledServer: GrpcServer;
    let disabledClient: BoltzClient;
    let disabledPort: number;

    beforeAll(async () => {
      disabledDir = fs.mkdtempSync(
        path.join(os.tmpdir(), 'boltz-auth-disabled-'),
      );
      const disabledSigner = new JwtSigner(Logger.disabledLogger, {
        certificates: disabledDir,
      });
      disabledPort = await getPort();
      disabledServer = new GrpcServer(
        Logger.disabledLogger,
        {
          port: disabledPort,
          host: '127.0.0.1',
          disableSsl: true,
          certificates: disabledDir,
          jwt: { disable: true },
        },
        grpcService,
        disabledSigner,
      );
      await disabledServer.listen();
      disabledClient = new BoltzClient(
        `127.0.0.1:${disabledPort}`,
        credentials.createInsecure(),
      );
    });

    afterAll(async () => {
      disabledClient.close();
      await disabledServer.close();
      fs.rmSync(disabledDir, { recursive: true, force: true });
    });

    const callDisabledGetInfo = (md?: Metadata) =>
      promisifyCall<boltzrpc.GetInfoRequest, boltzrpc.GetInfoResponse>(
        disabledClient,
        'getInfo',
        {},
        md,
      );

    test('accepts calls with no authorization metadata', async () => {
      const r = await callDisabledGetInfo();
      expect(r.version).toBe('ok');
    });

    test('accepts calls with a garbage authorization header', async () => {
      const r = await callDisabledGetInfo(bearer('garbage-not-a-jwt'));
      expect(r.version).toBe('ok');
    });

    test('does not bootstrap an admin token file', async () => {
      expect(fs.existsSync(path.join(disabledDir, 'admin.jwt'))).toBe(false);
    });
  });

  describe('lifecycle', () => {
    test('revoking a token mid-session blocks subsequent calls', async () => {
      const token = await issue({ allowedMethods: ['*'] });
      await callGetInfo(bearer(token));
      const decoded = await signer.verify(token);
      await JwtTokenRepository.revoke(decoded.jti);
      await expect(callGetInfo(bearer(token))).rejects.toMatchObject({
        code: status.UNAUTHENTICATED,
      });
    });

    test('expiring a token (via DB update) blocks subsequent calls before JWT exp', async () => {
      const token = await issue({ allowedMethods: ['*'] });
      await callGetInfo(bearer(token));

      const decoded = await signer.verify(token);
      const row = await JwtToken.findOne({ where: { id: decoded.jti } });
      await row!.update({ expiresAt: new Date(Date.now() - 1_000) });

      await expect(callGetInfo(bearer(token))).rejects.toMatchObject({
        code: status.UNAUTHENTICATED,
      });
    });

    test('updating allowedMethods on an existing row takes effect immediately', async () => {
      const token = await issue({
        allowedMethods: ['/boltzrpc.Boltz/GetInfo'],
      });
      await callGetInfo(bearer(token));
      await expect(callGetBalance(bearer(token))).rejects.toMatchObject({
        code: status.PERMISSION_DENIED,
      });

      const decoded = await signer.verify(token);
      const row = await JwtToken.findOne({ where: { id: decoded.jti } });
      await row!.update({ allowedMethods: ['*'] });

      // Now allowed
      await callGetBalance(bearer(token));
    });
  });
});
