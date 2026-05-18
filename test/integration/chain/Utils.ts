import { sha256 } from '@noble/hashes/sha2.js';
import { randomBytes } from 'crypto';
import type ArkClient from '../../../lib/chain/ArkClient';

export const createVHtlc = async (
  arkClient: ArkClient,
  refundDelay: number = 20,
  claimPublicKey?: Buffer,
  refundPublicKey?: Buffer,
) => {
  const preimage = randomBytes(32);

  const { vHtlc, timeouts } = await arkClient.createVHtlc(
    Buffer.from(sha256(preimage)),
    refundDelay,
    claimPublicKey,
    refundPublicKey,
  );

  return {
    vHtlc,
    timeouts,
    preimage,
  };
};
