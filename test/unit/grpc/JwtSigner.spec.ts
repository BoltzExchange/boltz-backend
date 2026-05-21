import { createHmac, randomUUID } from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import Logger from '../../../lib/Logger';
import Database from '../../../lib/db/Database';
import JwtToken from '../../../lib/db/models/JwtToken';
import JwtTokenRepository from '../../../lib/db/repositories/JwtTokenRepository';
import JwtSigner from '../../../lib/grpc/JwtSigner';

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
  const signingInput = `${h}.${p}`;
  let sig: string;
  if (secret) {
    sig = createHmac('sha256', secret).update(signingInput).digest('base64url');
  } else {
    sig = forceSig ?? '';
  }
  return `${signingInput}.${sig}`;
};

const readSecret = (keyPath: string): Buffer =>
  Buffer.from(fs.readFileSync(keyPath, 'utf-8').trim(), 'hex');

describe('JwtSigner', () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'boltz-jwtsigner-'));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  test('generates a hex-encoded 32-byte secret file at 0600 when missing', () => {
    const keyPath = path.join(dir, 'jwt.key');
    new JwtSigner(Logger.disabledLogger, {
      certificates: dir,
      jwt: { secretFile: keyPath },
    });

    expect(fs.existsSync(keyPath)).toBe(true);
    expect(fs.statSync(keyPath).mode & 0o777).toBe(0o600);

    const text = fs.readFileSync(keyPath, 'utf-8');
    expect(text).toMatch(/^[0-9a-f]{64}\n?$/);
    expect(Buffer.from(text.trim(), 'hex').length).toBe(32);
  });

  test('reuses an existing secret', async () => {
    const keyPath = path.join(dir, 'jwt.key');
    const a = new JwtSigner(Logger.disabledLogger, {
      certificates: dir,
      jwt: { secretFile: keyPath },
    });
    const before = fs.readFileSync(keyPath);

    const token = await a.sign('abc', new Date());

    const b = new JwtSigner(Logger.disabledLogger, {
      certificates: dir,
      jwt: { secretFile: keyPath },
    });
    const after = fs.readFileSync(keyPath);
    expect(after).toEqual(before);

    const { jti } = await b.verify(token);
    expect(jti).toBe('abc');
  });

  test('rejects a secret file of unexpected length', () => {
    const keyPath = path.join(dir, 'jwt.key');
    fs.writeFileSync(keyPath, '00'.repeat(16));

    expect(
      () =>
        new JwtSigner(Logger.disabledLogger, {
          certificates: dir,
          jwt: { secretFile: keyPath },
        }),
    ).toThrow(/unexpected length 16/);
  });

  test('rejects a secret file with non-hex content', () => {
    const keyPath = path.join(dir, 'jwt.key');
    fs.writeFileSync(keyPath, 'this-is-not-hex');

    expect(
      () =>
        new JwtSigner(Logger.disabledLogger, {
          certificates: dir,
          jwt: { secretFile: keyPath },
        }),
    ).toThrow(/unexpected length/);
  });

  test('rejects a token signed by a different secret', async () => {
    const a = new JwtSigner(Logger.disabledLogger, {
      certificates: dir,
      jwt: { secretFile: path.join(dir, 'a.key') },
    });
    const b = new JwtSigner(Logger.disabledLogger, {
      certificates: dir,
      jwt: { secretFile: path.join(dir, 'b.key') },
    });
    const token = await a.sign('abc', new Date());

    await expect(b.verify(token)).rejects.toThrow();
  });

  test('rejects expired tokens', async () => {
    const signer = new JwtSigner(Logger.disabledLogger, { certificates: dir });
    const issuedAt = new Date(Date.now() - 60_000);
    const expiresAt = new Date(Date.now() - 1_000);
    const token = await signer.sign('abc', issuedAt, expiresAt);

    await expect(signer.verify(token)).rejects.toThrow();
  });

  test('round-trips jti and exp', async () => {
    const signer = new JwtSigner(Logger.disabledLogger, { certificates: dir });
    const issuedAt = new Date(1_700_000_000_000);
    const expiresAt = new Date(2_000_000_000_000);

    const token = await signer.sign('token-id', issuedAt, expiresAt);
    const { jti, iat, exp } = await signer.verify(token);

    expect(jti).toBe('token-id');
    expect(iat).toBe(Math.floor(issuedAt.getTime() / 1000));
    expect(exp).toBe(Math.floor(expiresAt.getTime() / 1000));
  });

  describe('attacks', () => {
    let keyPath: string;
    let signer: JwtSigner;

    beforeEach(() => {
      keyPath = path.join(dir, 'jwt.key');
      signer = new JwtSigner(Logger.disabledLogger, {
        certificates: dir,
        jwt: { secretFile: keyPath },
      });
    });

    test('rejects alg:none (no signature)', async () => {
      const token = forgeJwt(
        { alg: 'none', typ: 'JWT' },
        { jti: 'attacker', iat: Math.floor(Date.now() / 1000) },
      );
      await expect(signer.verify(token)).rejects.toThrow();
    });

    test('rejects alg:none with present-but-empty signature', async () => {
      const token = forgeJwt(
        { alg: 'none', typ: 'JWT' },
        { jti: 'attacker', iat: Math.floor(Date.now() / 1000) },
        undefined,
        '',
      );
      await expect(signer.verify(token)).rejects.toThrow();
    });

    test('rejects alg:RS256 (algorithm confusion)', async () => {
      const token = forgeJwt(
        { alg: 'RS256', typ: 'JWT' },
        { jti: 'attacker', iat: Math.floor(Date.now() / 1000) },
        readSecret(keyPath),
      );
      await expect(signer.verify(token)).rejects.toThrow();
    });

    test('rejects alg:HS384 / HS512 (downgrade / wrong family)', async () => {
      for (const alg of ['HS384', 'HS512']) {
        const token = forgeJwt(
          { alg, typ: 'JWT' },
          { jti: 'attacker', iat: Math.floor(Date.now() / 1000) },
          readSecret(keyPath),
        );
        await expect(signer.verify(token)).rejects.toThrow();
      }
    });

    test('rejects token with tampered signature', async () => {
      const real = await signer.sign('real', new Date());
      const parts = real.split('.');
      // Flip a bit in the signature
      const sig = Buffer.from(parts[2], 'base64url');
      sig[0] ^= 0x01;
      const tampered = `${parts[0]}.${parts[1]}.${sig.toString('base64url')}`;
      await expect(signer.verify(tampered)).rejects.toThrow();
    });

    test('rejects token with tampered payload (jti mutated)', async () => {
      const real = await signer.sign('real', new Date());
      const parts = real.split('.');
      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64url').toString('utf-8'),
      );
      payload.jti = 'forged';
      const tampered = `${parts[0]}.${b64url(JSON.stringify(payload))}.${parts[2]}`;
      await expect(signer.verify(tampered)).rejects.toThrow();
    });

    test('rejects token missing jti claim', async () => {
      const token = forgeJwt(
        { alg: 'HS256', typ: 'JWT' },
        { iat: Math.floor(Date.now() / 1000) },
        readSecret(keyPath),
      );
      await expect(signer.verify(token)).rejects.toThrow(/jti/);
    });

    test('rejects token with empty-string jti', async () => {
      const token = forgeJwt(
        { alg: 'HS256', typ: 'JWT' },
        { jti: '', iat: Math.floor(Date.now() / 1000) },
        readSecret(keyPath),
      );
      await expect(signer.verify(token)).rejects.toThrow(/jti/);
    });

    test('rejects token missing iat claim', async () => {
      const token = forgeJwt(
        { alg: 'HS256', typ: 'JWT' },
        { jti: 'real' },
        readSecret(keyPath),
      );
      await expect(signer.verify(token)).rejects.toThrow(/iat/);
    });

    test('rejects token whose nbf is in the future', async () => {
      const token = forgeJwt(
        { alg: 'HS256', typ: 'JWT' },
        {
          jti: 'real',
          iat: Math.floor(Date.now() / 1000),
          nbf: Math.floor(Date.now() / 1000) + 600,
        },
        readSecret(keyPath),
      );
      await expect(signer.verify(token)).rejects.toThrow();
    });

    test('rejects garbage tokens', async () => {
      for (const bad of [
        '',
        'a',
        'a.b',
        'a.b.c',
        'eyJ.eyJ.',
        '...',
        'not-a-jwt',
      ]) {
        await expect(signer.verify(bad)).rejects.toThrow();
      }
    });
  });

  describe('ensureAdminToken', () => {
    let signer: JwtSigner;
    let tokenPath: string;
    let database: Database;

    const makeSigner = (certs: string, adminTokenFile?: string): JwtSigner =>
      new JwtSigner(Logger.disabledLogger, {
        certificates: certs,
        jwt: adminTokenFile ? { adminTokenFile } : undefined,
      });

    beforeAll(async () => {
      database = new Database(Logger.disabledLogger, Database.memoryDatabase);
      await database.init();
    });

    afterAll(async () => {
      await database.close();
    });

    beforeEach(async () => {
      tokenPath = path.join(dir, 'admin.jwt');
      signer = makeSigner(dir);
      await JwtToken.truncate();
    });

    test('mints + writes a fresh token when the file is missing', async () => {
      await signer.ensureAdminToken();

      expect(fs.existsSync(tokenPath)).toBe(true);
      const token = fs.readFileSync(tokenPath, 'utf-8');
      const { jti } = await signer.verify(token);

      const rows = await JwtToken.findAll();
      expect(rows).toHaveLength(1);
      expect(rows[0].id).toBe(jti);
      expect(rows[0].label).toBe('bootstrap-admin');
      expect(rows[0].allowedMethods).toEqual(['*']);
      expect(rows[0].expiresAt).toBeNull();
      expect(rows[0].revokedAt).toBeNull();
    });

    test('writes the token file at mode 0600', async () => {
      await signer.ensureAdminToken();
      const mode = fs.statSync(tokenPath).mode & 0o777;
      expect(mode).toBe(0o600);
    });

    test('creates the target directory if it does not exist', async () => {
      const nested = path.join(dir, 'nested', 'deeper', 'admin.jwt');
      const nestedSigner = makeSigner(dir, nested);
      await nestedSigner.ensureAdminToken();
      expect(fs.existsSync(nested)).toBe(true);
    });

    test('is a no-op when the existing file is valid + active', async () => {
      await signer.ensureAdminToken();
      const tokenBefore = fs.readFileSync(tokenPath, 'utf-8');

      await signer.ensureAdminToken();
      const tokenAfter = fs.readFileSync(tokenPath, 'utf-8');

      expect(tokenAfter).toBe(tokenBefore);
      const rows = await JwtToken.findAll();
      expect(rows).toHaveLength(1);
    });

    test('re-mints when the file is corrupt (not a JWT)', async () => {
      fs.writeFileSync(tokenPath, 'not-a-jwt', { mode: 0o600 });

      await signer.ensureAdminToken();

      const newToken = fs.readFileSync(tokenPath, 'utf-8');
      expect(newToken).not.toBe('not-a-jwt');
      await expect(signer.verify(newToken)).resolves.toBeDefined();
      expect(await JwtToken.count()).toBe(1);
    });

    test('re-mints when the file is empty', async () => {
      fs.writeFileSync(tokenPath, '', { mode: 0o600 });

      await signer.ensureAdminToken();

      const newToken = fs.readFileSync(tokenPath, 'utf-8');
      expect(newToken.length).toBeGreaterThan(0);
      await expect(signer.verify(newToken)).resolves.toBeDefined();
    });

    test('re-mints when the file is signed by a different secret', async () => {
      const other = new JwtSigner(Logger.disabledLogger, {
        certificates: dir,
        jwt: { secretFile: path.join(dir, 'other.key') },
      });
      const foreign = await other.sign(randomUUID(), new Date());
      fs.writeFileSync(tokenPath, foreign, { mode: 0o600 });

      await signer.ensureAdminToken();

      const newToken = fs.readFileSync(tokenPath, 'utf-8');
      expect(newToken).not.toBe(foreign);
      await expect(signer.verify(newToken)).resolves.toBeDefined();
    });

    test('re-mints when the file references a jti that has no DB row', async () => {
      const orphanJti = randomUUID();
      const orphan = await signer.sign(orphanJti, new Date());
      fs.writeFileSync(tokenPath, orphan, { mode: 0o600 });

      await signer.ensureAdminToken();

      const newToken = fs.readFileSync(tokenPath, 'utf-8');
      expect(newToken).not.toBe(orphan);
      const { jti } = await signer.verify(newToken);
      expect(jti).not.toBe(orphanJti);
      expect(await JwtTokenRepository.getActive(jti)).not.toBeNull();
    });

    test('re-mints when the file references a revoked DB row', async () => {
      const issuedAt = new Date();
      const row = await JwtTokenRepository.issue({
        label: 'bootstrap-admin',
        allowedMethods: ['*'],
        issuedAt,
        expiresAt: null,
      });
      await JwtTokenRepository.revoke(row.id);
      const oldToken = await signer.sign(row.id, issuedAt);
      fs.writeFileSync(tokenPath, oldToken, { mode: 0o600 });

      await signer.ensureAdminToken();

      const newToken = fs.readFileSync(tokenPath, 'utf-8');
      expect(newToken).not.toBe(oldToken);
      const { jti: newJti } = await signer.verify(newToken);
      expect(newJti).not.toBe(row.id);

      const oldRow = await JwtToken.findOne({ where: { id: row.id } });
      expect(oldRow!.revokedAt).not.toBeNull();
      expect(await JwtTokenRepository.getActive(newJti)).not.toBeNull();
    });

    test('does not delete unrelated rows when re-minting', async () => {
      const userRow = await JwtTokenRepository.issue({
        label: 'pre-existing',
        allowedMethods: ['/boltzrpc.Boltz/GetInfo'],
        issuedAt: new Date(),
        expiresAt: null,
      });

      await signer.ensureAdminToken();

      expect(await JwtToken.count()).toBe(2);
      expect(await JwtTokenRepository.getActive(userRow.id)).not.toBeNull();
    });

    test('idempotent across many calls', async () => {
      await signer.ensureAdminToken();
      const firstToken = fs.readFileSync(tokenPath, 'utf-8');
      const firstCount = await JwtToken.count();

      for (let i = 0; i < 5; i += 1) {
        await signer.ensureAdminToken();
      }

      const lastToken = fs.readFileSync(tokenPath, 'utf-8');
      expect(lastToken).toBe(firstToken);
      expect(await JwtToken.count()).toBe(firstCount);
    });

    test('minted token has allowedMethods=["*"] and label=bootstrap-admin', async () => {
      await signer.ensureAdminToken();
      const token = fs.readFileSync(tokenPath, 'utf-8');
      const { jti } = await signer.verify(token);
      const row = await JwtToken.findOne({ where: { id: jti } });
      expect(row!.label).toBe('bootstrap-admin');
      expect(row!.allowedMethods).toEqual(['*']);
    });
  });
});
