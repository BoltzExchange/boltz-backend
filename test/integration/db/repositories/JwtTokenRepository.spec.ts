import { randomUUID } from 'crypto';
import type Database from '../../../../lib/db/Database';
import JwtToken from '../../../../lib/db/models/JwtToken';
import JwtTokenRepository from '../../../../lib/db/repositories/JwtTokenRepository';
import { getPostgresDatabase } from '../../../Utils';

describe('JwtTokenRepository', () => {
  let database: Database;

  beforeAll(async () => {
    database = getPostgresDatabase();
    await database.init();
    await JwtToken.drop({ cascade: true });
    await JwtToken.sync();
  });

  beforeEach(async () => {
    await JwtToken.truncate();
  });

  afterAll(async () => {
    await JwtToken.drop({ cascade: true });
    await database.close();
  });

  const issue = (
    overrides: Partial<Parameters<typeof JwtTokenRepository.issue>[0]> = {},
  ) =>
    JwtTokenRepository.issue({
      label: 'tester',
      allowedMethods: ['/boltzrpc.Boltz/GetInfo'],
      issuedAt: new Date(),
      ...overrides,
    });

  test('issue persists row and round-trips', async () => {
    const row = await issue();

    expect(row.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(row.label).toBe('tester');
    expect(row.allowedMethods).toEqual(['/boltzrpc.Boltz/GetInfo']);
    expect(row.revokedAt).toBeNull();
    expect(row.expiresAt).toBeNull();
  });

  test('getActive returns row for non-revoked, non-expired token', async () => {
    const issued = await issue();
    const row = await JwtTokenRepository.getActive(issued.id);
    expect(row).not.toBeNull();
    expect(row!.id).toBe(issued.id);
  });

  test('getActive returns null for unknown jti', async () => {
    expect(await JwtTokenRepository.getActive(randomUUID())).toBeNull();
  });

  test('getActive returns null for expired token', async () => {
    const issued = await issue({ expiresAt: new Date(Date.now() - 1_000) });
    expect(await JwtTokenRepository.getActive(issued.id)).toBeNull();
  });

  test('getActive returns row when expiresAt is in the future', async () => {
    const issued = await issue({ expiresAt: new Date(Date.now() + 60_000) });
    expect(await JwtTokenRepository.getActive(issued.id)).not.toBeNull();
  });

  test('revoke marks token and getActive returns null', async () => {
    const issued = await issue();
    const revoked = await JwtTokenRepository.revoke(issued.id);
    expect(revoked).not.toBeNull();
    expect(revoked!.revokedAt).toBeInstanceOf(Date);

    expect(await JwtTokenRepository.getActive(issued.id)).toBeNull();
  });

  test('revoke is idempotent (does not bump revokedAt)', async () => {
    const issued = await issue();
    const first = await JwtTokenRepository.revoke(issued.id);
    const ts = first!.revokedAt!.getTime();
    const second = await JwtTokenRepository.revoke(issued.id);
    expect(second!.revokedAt!.getTime()).toBe(ts);
  });

  test('revoke returns null for unknown jti', async () => {
    expect(await JwtTokenRepository.revoke(randomUUID())).toBeNull();
  });

  test('list returns all rows newest-first', async () => {
    const older = await issue({ issuedAt: new Date(2024, 0, 1) });
    const newer = await issue({ issuedAt: new Date(2024, 0, 2) });

    const rows = await JwtTokenRepository.list();
    expect(rows.map((r) => r.id)).toEqual([newer.id, older.id]);
  });
});
