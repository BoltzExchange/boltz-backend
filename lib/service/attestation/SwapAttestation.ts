import { crypto } from 'bitcoinjs-lib';
import type { LightningClient } from '../../lightning/LightningClient';

/**
 * Swap-response attestation — a Boltz-node-signed commitment to the
 * chain-side parameters of a newly created swap.
 *
 * # Why this exists
 *
 * The Bolt11 invoice a client pays for a Boltz swap is signed by the
 * Boltz LN node's identity key, so LN routing safety is anchored to
 * that key. But the invoice explicitly does not commit to the swap's
 * on-chain parameters: for a reverse swap the client's `claimPublicKey`
 * is embedded in the Taproot HTLC Boltz builds off-chain; for a
 * submarine swap the client's `refundPublicKey` plays the same role.
 *
 * Any coordinator between the client's signer and Boltz (a wallet
 * backend, a routing-node control plane, an enterprise TLS-intercepting
 * proxy) that gets compromised can substitute the client's pubkey when
 * relaying the create-swap request to Boltz. The client's signer then
 * approves the LN payment against on-chain custody it does not actually
 * control, and the compromised coordinator sweeps the on-chain leg.
 * HTTPS does not close this gap — TLS proves things to the coordinator
 * (which terminates the connection), not to the signer behind it.
 *
 * A signature over the swap parameters under the same LN identity key
 * closes the loop: the signer already trusts that key (it verifies the
 * invoice against it), it can reconstruct the commitment from its own
 * view of the request, and it can refuse to route the LN payment on a
 * mismatch. The one signature works for both LND and CLN-backed Boltz
 * instances because both natively expose `SignMessage` under the node
 * identity key.
 *
 * # Commitment layout
 *
 * The signed input is the UTF-8 hex encoding (lowercase, no `0x`) of
 * `sha256(tag || fields...)`. Hex-encoding lets us send it through
 * CLN's string-typed `signmessage` RPC without character-set concerns,
 * and matches the LND path (which passes the same UTF-8 bytes to
 * `lnrpc.SignMessage`). The signature format follows the standard
 * "Lightning Signed Message" convention both backends emit — zbase32
 * of a 65-byte compact ECDSA-with-recovery signature over
 * `sha256d("Lightning Signed Message:" || commitment_hex)`.
 *
 * Distinct tags per swap direction prevent cross-direction replay.
 * Every field the client verifier needs to bind is committed to; nothing
 * else. Ordering is fixed: any future field additions bump `version`.
 */

/** Tag prefix pinning attestations to the reverse-swap direction. */
export const ATTESTATION_TAG_REVERSE = 'BOLTZ-SWAP-v1|REVERSE';

/** Tag prefix pinning attestations to the submarine-swap direction. */
export const ATTESTATION_TAG_SUBMARINE = 'BOLTZ-SWAP-v1|SUBMARINE';

/** Attestation format version — bumped on any commitment-layout change. */
export const ATTESTATION_VERSION = 1;

/** Common fields committed to by every swap-response attestation. */
export type SwapAttestationInput = {
  /** Boltz-side swap id. Prevents replay across sibling swaps. */
  swapId: string;
  /**
   * sha256 preimage hash — same value that appears as `payment_hash` on
   * the Bolt11 invoice and as the hashlock in the on-chain HTLC.
   */
  paymentHash: Buffer;
  /**
   * The client-supplied pubkey embedded in the HTLC's claim leaf
   * (reverse) or refund leaf (submarine). This is the field a
   * compromised coordinator would substitute; the attestation is what
   * makes that substitution detectable by the client's signer.
   */
  clientPubkey: Buffer;
  /** P2TR lockup address Boltz returned for this swap. */
  lockupAddress: string;
  /** Timeout height Boltz committed to in the HTLC's refund path. */
  timeoutBlockHeight: number;
  /**
   * On-chain amount the lockup output will (reverse) or is expected to
   * (submarine) carry. Committed so amount-tampering by a coordinator
   * would fail signer-side verification.
   */
  onchainAmountSat: number;
};

/**
 * Compute the 32-byte commitment hash for a swap-response attestation.
 * Exposed for tests + for library consumers that want to reproduce the
 * commitment client-side without re-implementing the concatenation.
 */
export const computeAttestationCommitment = (
  direction: 'reverse' | 'submarine',
  input: SwapAttestationInput,
): Buffer => {
  const tag =
    direction === 'reverse'
      ? ATTESTATION_TAG_REVERSE
      : ATTESTATION_TAG_SUBMARINE;

  // Fixed-order concatenation with length-prefixes on variable-length
  // fields so no ambiguity is possible at parse time. All integers are
  // big-endian, matching Bitcoin's on-wire convention.
  const parts: Buffer[] = [];
  parts.push(Buffer.from(tag, 'utf8'));

  const swapIdBytes = Buffer.from(input.swapId, 'utf8');
  const swapIdLen = Buffer.alloc(2);
  swapIdLen.writeUInt16BE(swapIdBytes.length, 0);
  parts.push(swapIdLen, swapIdBytes);

  if (input.paymentHash.length !== 32) {
    throw new Error(
      `attestation: paymentHash must be 32 bytes, got ${input.paymentHash.length}`,
    );
  }
  parts.push(input.paymentHash);

  if (input.clientPubkey.length !== 33 && input.clientPubkey.length !== 32) {
    throw new Error(
      'attestation: clientPubkey must be 32 (x-only) or 33 (compressed) ' +
        `bytes, got ${input.clientPubkey.length}`,
    );
  }
  const pubkeyLen = Buffer.alloc(1);
  pubkeyLen.writeUInt8(input.clientPubkey.length, 0);
  parts.push(pubkeyLen, input.clientPubkey);

  const lockupBytes = Buffer.from(input.lockupAddress, 'utf8');
  const lockupLen = Buffer.alloc(2);
  lockupLen.writeUInt16BE(lockupBytes.length, 0);
  parts.push(lockupLen, lockupBytes);

  const timeout = Buffer.alloc(4);
  timeout.writeUInt32BE(input.timeoutBlockHeight >>> 0, 0);
  parts.push(timeout);

  const onchain = Buffer.alloc(8);
  // Amount fits in a JS number for any realistic BTC total (< 2^53).
  onchain.writeBigUInt64BE(BigInt(input.onchainAmountSat), 0);
  parts.push(onchain);

  return crypto.sha256(Buffer.concat(parts));
};

/** Attestation payload attached to a swap-creation response. */
export type SwapAttestation = {
  /**
   * Format version — currently `1`. Verifiers should refuse to
   * interpret attestations with an unknown version rather than
   * silently upgrading their commitment layout.
   */
  version: number;
  /**
   * zbase32-encoded compact ECDSA-with-recovery signature over
   * `sha256d("Lightning Signed Message:" || commitment_hex)`. Verify
   * by recovering the pubkey and matching against the invoice's payee
   * (reverse) or the swap response's `claimPublicKey` node identity
   * (submarine).
   */
  signature: string;
};

/**
 * Compute the commitment for a swap and sign it under the LN node key
 * associated with `client`, producing the attestation payload the
 * router should attach to the swap-creation response.
 */
export const createSwapAttestation = async (
  client: LightningClient,
  direction: 'reverse' | 'submarine',
  input: SwapAttestationInput,
): Promise<SwapAttestation> => {
  const commitment = computeAttestationCommitment(direction, input);
  const signature = await client.signMessage(commitment.toString('hex'));
  return { version: ATTESTATION_VERSION, signature };
};
