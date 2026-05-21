import { status } from '@grpc/grpc-js';
import fs from 'fs';
import os from 'os';
import path from 'path';
import Logger from '../../../lib/Logger';
import type Api from '../../../lib/api/Api';
import Database from '../../../lib/db/Database';
import JwtToken from '../../../lib/db/models/JwtToken';
import JwtTokenRepository from '../../../lib/db/repositories/JwtTokenRepository';
import GrpcService from '../../../lib/grpc/GrpcService';
import JwtSigner from '../../../lib/grpc/JwtSigner';
import type * as boltzrpc from '../../../lib/proto/boltzrpc';
import type Service from '../../../lib/service/Service';

const callUnary = <Req, Res>(
  method: (
    call: any,
    cb: (err: any, res: Res | null | undefined) => void,
  ) => void,
  request: Req,
): Promise<Res> =>
  new Promise((resolve, reject) => {
    method({ request }, (err, res) => {
      if (err) reject(err);
      else resolve(res!);
    });
  });

describe('JWT handlers', () => {
  let dir: string;
  let database: Database;
  let signer: JwtSigner;
  let grpcService: GrpcService;

  beforeAll(async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'boltz-jwt-handlers-'));
    database = new Database(Logger.disabledLogger, Database.memoryDatabase);
    await database.init();
    signer = new JwtSigner(Logger.disabledLogger, { certificates: dir });
    grpcService = new GrpcService(
      Logger.disabledLogger,
      {} as Service,
      {} as Api,
      signer,
    );
  });

  afterAll(async () => {
    await database.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  beforeEach(async () => {
    await JwtToken.truncate();
  });

  describe('issueJwt', () => {
    test('happy path: persists row, returns verifiable token', async () => {
      const res = await callUnary<
        boltzrpc.IssueJwtRequest,
        boltzrpc.IssueJwtResponse
      >(grpcService.issueJwt, {
        label: 'ops-dashboard',
        allowedMethods: ['/boltzrpc.Boltz/GetInfo'],
      });

      // crypto.randomUUID() emits v4
      expect(res.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
      expect(res.token.split('.')).toHaveLength(3);

      const { jti } = await signer.verify(res.token);
      expect(jti).toBe(res.id);

      const row = await JwtToken.findOne({ where: { id: res.id } });
      expect(row).not.toBeNull();
      expect(row!.label).toBe('ops-dashboard');
      expect(row!.allowedMethods).toEqual(['/boltzrpc.Boltz/GetInfo']);
      expect(row!.expiresAt).toBeNull();
      expect(row!.revokedAt).toBeNull();
    });

    test('expiresInSeconds round-trips to row + JWT exp', async () => {
      const res = await callUnary<
        boltzrpc.IssueJwtRequest,
        boltzrpc.IssueJwtResponse
      >(grpcService.issueJwt, {
        label: 'temp',
        allowedMethods: ['*'],
        expiresInSeconds: '3600',
      });

      const decoded = await signer.verify(res.token);
      expect(decoded.exp).toBeDefined();
      expect(decoded.exp! - decoded.iat).toBe(3600);

      const row = await JwtToken.findOne({ where: { id: res.id } });
      expect(row!.expiresAt).toBeInstanceOf(Date);
      const diff = row!.expiresAt!.getTime() - row!.issuedAt.getTime();
      expect(Math.round(diff / 1000)).toBe(3600);
    });

    test('omitting expiresInSeconds = no expiry', async () => {
      const res = await callUnary<
        boltzrpc.IssueJwtRequest,
        boltzrpc.IssueJwtResponse
      >(grpcService.issueJwt, {
        label: 'forever',
        allowedMethods: ['*'],
      });

      const decoded = await signer.verify(res.token);
      expect(decoded.exp).toBeUndefined();
    });

    test.each([['*'], ['/boltzrpc.Boltz/*'], ['/boltzrpc.Boltz/GetInfo']])(
      'accepts %s',
      async (method) => {
        await expect(
          callUnary<boltzrpc.IssueJwtRequest, boltzrpc.IssueJwtResponse>(
            grpcService.issueJwt,
            { label: 'x', allowedMethods: [method] },
          ),
        ).resolves.toBeDefined();
      },
    );

    test('rejects empty label with INVALID_ARGUMENT', async () => {
      await expect(
        callUnary(grpcService.issueJwt, {
          label: '',
          allowedMethods: ['*'],
        }),
      ).rejects.toMatchObject({
        code: status.INVALID_ARGUMENT,
        details: 'label must not be empty',
      });
    });

    test('rejects empty allowedMethods with INVALID_ARGUMENT', async () => {
      await expect(
        callUnary(grpcService.issueJwt, {
          label: 'x',
          allowedMethods: [],
        }),
      ).rejects.toMatchObject({
        code: status.INVALID_ARGUMENT,
        details: 'allowedMethods must not be empty',
      });
    });

    test('rejects unknown method paths with INVALID_ARGUMENT', async () => {
      await expect(
        callUnary(grpcService.issueJwt, {
          label: 'x',
          allowedMethods: ['/boltzrpc.Boltz/GetInfo', '/wrong/path'],
        }),
      ).rejects.toMatchObject({
        code: status.INVALID_ARGUMENT,
        details: expect.stringContaining('/wrong/path'),
      });
    });

    test('reports every invalid method path, not just the first', async () => {
      await expect(
        callUnary(grpcService.issueJwt, {
          label: 'x',
          allowedMethods: ['/bogus/a', '/bogus/b', '/bogus/c'],
        }),
      ).rejects.toMatchObject({
        details: expect.stringMatching(/\/bogus\/a.*\/bogus\/b.*\/bogus\/c/),
      });
    });

    test('rejects negative expiresInSeconds with INVALID_ARGUMENT', async () => {
      await expect(
        callUnary(grpcService.issueJwt, {
          label: 'x',
          allowedMethods: ['*'],
          expiresInSeconds: '-1',
        }),
      ).rejects.toMatchObject({ code: status.INVALID_ARGUMENT });
    });

    test('rejects non-numeric expiresInSeconds with INVALID_ARGUMENT', async () => {
      await expect(
        callUnary(grpcService.issueJwt, {
          label: 'x',
          allowedMethods: ['*'],
          expiresInSeconds: 'forever',
        }),
      ).rejects.toMatchObject({ code: status.INVALID_ARGUMENT });
    });

    test('does NOT persist a row when validation fails', async () => {
      await expect(
        callUnary(grpcService.issueJwt, {
          label: '',
          allowedMethods: ['*'],
        }),
      ).rejects.toBeDefined();

      expect(await JwtToken.count()).toBe(0);
    });
  });

  describe('revokeJwt', () => {
    test('marks the row revoked and returns revokedAt', async () => {
      const issued = await JwtTokenRepository.issue({
        label: 'x',
        allowedMethods: ['*'],
        issuedAt: new Date(),
        expiresAt: null,
      });

      const res = await callUnary<
        boltzrpc.RevokeJwtRequest,
        boltzrpc.RevokeJwtResponse
      >(grpcService.revokeJwt, { id: issued.id });

      expect(Number(res.revokedAt)).toBeGreaterThan(0);
      const row = await JwtToken.findOne({ where: { id: issued.id } });
      expect(row!.revokedAt).not.toBeNull();
    });

    test('rejects empty id with INVALID_ARGUMENT', async () => {
      await expect(
        callUnary(grpcService.revokeJwt, { id: '' }),
      ).rejects.toMatchObject({ code: status.INVALID_ARGUMENT });
    });

    test('rejects unknown id with NOT_FOUND', async () => {
      await expect(
        callUnary(grpcService.revokeJwt, { id: 'nope' }),
      ).rejects.toMatchObject({ code: status.NOT_FOUND });
    });

    test('idempotent: second revoke returns the same revokedAt', async () => {
      const issued = await JwtTokenRepository.issue({
        label: 'x',
        allowedMethods: ['*'],
        issuedAt: new Date(),
        expiresAt: null,
      });

      const first = await callUnary<
        boltzrpc.RevokeJwtRequest,
        boltzrpc.RevokeJwtResponse
      >(grpcService.revokeJwt, { id: issued.id });

      await new Promise((r) => setTimeout(r, 1100));

      const second = await callUnary<
        boltzrpc.RevokeJwtRequest,
        boltzrpc.RevokeJwtResponse
      >(grpcService.revokeJwt, { id: issued.id });

      expect(second.revokedAt).toBe(first.revokedAt);
    });
  });

  describe('listJwts', () => {
    test('returns metadata only; no token string ever appears in the response', async () => {
      const issueRes = await callUnary<
        boltzrpc.IssueJwtRequest,
        boltzrpc.IssueJwtResponse
      >(grpcService.issueJwt, { label: 'one', allowedMethods: ['*'] });

      const listRes = await callUnary<
        boltzrpc.ListJwtsRequest,
        boltzrpc.ListJwtsResponse
      >(grpcService.listJwts, {});

      expect(listRes.tokens).toHaveLength(1);
      const entry = listRes.tokens[0];
      expect(entry.id).toBe(issueRes.id);
      expect(entry.label).toBe('one');
      expect(entry.allowedMethods).toEqual(['*']);

      const haystack = JSON.stringify(listRes);
      expect(haystack).not.toContain(issueRes.token);
    });

    test('reports revokedAt + expiresAt when set', async () => {
      const r = await callUnary<
        boltzrpc.IssueJwtRequest,
        boltzrpc.IssueJwtResponse
      >(grpcService.issueJwt, {
        label: 'temp',
        allowedMethods: ['*'],
        expiresInSeconds: '60',
      });

      await callUnary(grpcService.revokeJwt, { id: r.id });

      const list = await callUnary<
        boltzrpc.ListJwtsRequest,
        boltzrpc.ListJwtsResponse
      >(grpcService.listJwts, {});

      expect(list.tokens[0].expiresAt).toBeDefined();
      expect(list.tokens[0].revokedAt).toBeDefined();
    });

    test('empty when no tokens', async () => {
      const r = await callUnary<
        boltzrpc.ListJwtsRequest,
        boltzrpc.ListJwtsResponse
      >(grpcService.listJwts, {});
      expect(r.tokens).toEqual([]);
    });
  });

  describe('listMethods', () => {
    test('returns the BoltzService method set + wildcards', async () => {
      const r = await callUnary<
        boltzrpc.ListMethodsRequest,
        boltzrpc.ListMethodsResponse
      >(grpcService.listMethods, {});

      expect(r.methods).toContain('/boltzrpc.Boltz/GetInfo');
      expect(r.methods).toContain('/boltzrpc.Boltz/IssueJwt');
      expect(r.methods).toContain('/boltzrpc.Boltz/ListMethods');
      expect(new Set(r.methods).size).toBe(r.methods.length);
      expect(r.methods).toEqual([...r.methods].sort());

      expect(r.wildcards[0]).toBe('*');
      expect(r.wildcards).toContain('/boltzrpc.Boltz/*');
    });

    test('returned method set matches what issueJwt accepts', async () => {
      const r = await callUnary<
        boltzrpc.ListMethodsRequest,
        boltzrpc.ListMethodsResponse
      >(grpcService.listMethods, {});

      for (const m of r.methods.slice(0, 3)) {
        await expect(
          callUnary(grpcService.issueJwt, {
            label: `accepts-${m}`,
            allowedMethods: [m],
          }),
        ).resolves.toBeDefined();
      }
    });
  });
});
