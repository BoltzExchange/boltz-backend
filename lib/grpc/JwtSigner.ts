import { randomBytes } from 'crypto';
import fs from 'fs';
import { SignJWT, jwtVerify } from 'jose';
import path from 'path';
import type { GrpcConfig } from '../Config';
import type Logger from '../Logger';
import JwtTokenRepository from '../db/repositories/JwtTokenRepository';
import { wildcardAll } from './MethodRegistry';

type JwtSignerConfig = Pick<GrpcConfig, 'certificates' | 'jwt'>;

const algo = 'HS256';
const secretBytes = 32;
const adminLabel = 'bootstrap-admin';
const adminAllowedMethods = [wildcardAll];

export type VerifiedToken = {
  jti: string;
  iat: number;
  exp?: number;
};

class JwtSigner {
  private readonly secret: Uint8Array;
  private readonly adminTokenPath: string;

  constructor(
    private readonly logger: Logger,
    config: JwtSignerConfig,
  ) {
    const secretPath =
      config.jwt?.secretFile ?? path.join(config.certificates, 'jwt.key');
    this.adminTokenPath =
      config.jwt?.adminTokenFile ?? path.join(config.certificates, 'admin.jwt');
    this.secret = JwtSigner.loadOrCreateSecret(this.logger, secretPath);
  }

  public sign = async (
    jti: string,
    issuedAt: Date,
    expiresAt?: Date | null,
  ): Promise<string> => {
    let builder = new SignJWT({})
      .setProtectedHeader({ alg: algo })
      .setJti(jti)
      .setIssuedAt(Math.floor(issuedAt.getTime() / 1000));

    if (expiresAt !== undefined && expiresAt !== null) {
      builder = builder.setExpirationTime(
        Math.floor(expiresAt.getTime() / 1000),
      );
    }

    return builder.sign(this.secret);
  };

  public verify = async (token: string): Promise<VerifiedToken> => {
    const { payload } = await jwtVerify(token, this.secret, {
      algorithms: [algo],
    });

    if (typeof payload.jti !== 'string' || payload.jti.length === 0) {
      throw new Error('jwt missing jti claim');
    }
    if (typeof payload.iat !== 'number') {
      throw new Error('jwt missing iat claim');
    }

    return {
      jti: payload.jti,
      iat: payload.iat,
      exp: typeof payload.exp === 'number' ? payload.exp : undefined,
    };
  };

  public ensureAdminToken = async (): Promise<void> => {
    const dir = path.dirname(this.adminTokenPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(this.adminTokenPath)) {
      const existing = fs.readFileSync(this.adminTokenPath, 'utf-8').trim();
      if (existing.length > 0) {
        try {
          const { jti } = await this.verify(existing);
          const row = await JwtTokenRepository.getActive(jti);
          if (row !== null) {
            this.logger.debug(
              `Admin JWT at ${this.adminTokenPath} is active (jti ${jti})`,
            );
            return;
          }
          this.logger.warn(
            `Admin JWT at ${this.adminTokenPath} is orphaned (jti ${jti}); re-issuing`,
          );
        } catch (error) {
          this.logger.warn(
            `Admin JWT at ${this.adminTokenPath} failed verification (${(error as Error).message}); re-issuing`,
          );
        }
      }
    }

    const issuedAt = new Date();
    const row = await JwtTokenRepository.issue({
      label: adminLabel,
      allowedMethods: adminAllowedMethods,
      issuedAt,
      expiresAt: null,
    });
    const token = await this.sign(row.id, issuedAt);
    fs.writeFileSync(this.adminTokenPath, token, { mode: 0o600 });
    this.logger.info(
      `Issued admin JWT (jti ${row.id}) to ${this.adminTokenPath}`,
    );
  };

  private static loadOrCreateSecret = (
    logger: Logger,
    secretPath: string,
  ): Uint8Array => {
    const dir = path.dirname(secretPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(secretPath)) {
      const text = fs.readFileSync(secretPath, 'utf-8').trim();
      const buf = Buffer.from(text, 'hex');
      if (buf.length !== secretBytes) {
        throw new Error(
          `JWT signing key at ${secretPath} has unexpected length ${buf.length} bytes (expected ${secretBytes} bytes of hex)`,
        );
      }
      return new Uint8Array(buf);
    }

    logger.debug(`Generating JWT signing key at ${secretPath}`);
    const secret = randomBytes(secretBytes);
    fs.writeFileSync(secretPath, `${secret.toString('hex')}\n`, {
      mode: 0o600,
    });
    return new Uint8Array(secret);
  };
}

export default JwtSigner;
