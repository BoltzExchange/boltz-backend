import { secp256k1 } from '@noble/curves/secp256k1.js';
import { hmac } from '@noble/hashes/hmac.js';
import { sha256, sha512 } from '@noble/hashes/sha2.js';

/**
 * Reimplementation of slip77 (https://github.com/vulpemventures/slip77) using the
 * @noble/hashes + @noble/curves stack
 */

const DOMAIN = Buffer.from('Symmetric key seed');
const LABEL = Buffer.from('SLIP-0077');
const PREFIX = Buffer.alloc(1, 0);

const concatBytes = (chunks: Uint8Array[]): Uint8Array => {
  const total = chunks.reduce((acc, c) => acc + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
};

export type Slip77Node = {
  masterKey: Buffer;
  derive: (script: Uint8Array) => {
    masterKey: Buffer;
    privateKey: Buffer;
    publicKey: Buffer;
    script: Buffer;
  };
};

export const slip77FromSeed = (seed: Uint8Array | string): Slip77Node => {
  const slip77Seed: Uint8Array =
    typeof seed === 'string' ? Buffer.from(seed, 'hex') : seed;

  const root = hmac(sha512, DOMAIN, slip77Seed);
  const expanded = hmac(
    sha512,
    root.subarray(0, 32),
    concatBytes([PREFIX, LABEL]),
  );
  // SLIP-0077 spec: master blinding key = last 32 bytes of the expanded HMAC.
  // The npm `slip77` package's `fromSeed` does the same via `masterKey.slice(32)`.
  const masterKey = Buffer.from(expanded.subarray(32));

  return {
    masterKey,
    derive: (script: Uint8Array) => {
      const scriptBuf: Buffer = Buffer.isBuffer(script)
        ? script
        : Buffer.from(script);
      const privateKey = Buffer.from(hmac(sha256, masterKey, scriptBuf));
      const publicKey = Buffer.from(secp256k1.getPublicKey(privateKey, true));
      return { masterKey, privateKey, publicKey, script: scriptBuf };
    },
  };
};
