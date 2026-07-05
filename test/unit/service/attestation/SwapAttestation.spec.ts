import { crypto } from 'bitcoinjs-lib';
import type { LightningClient } from '../../../../lib/lightning/LightningClient';
import {
  ATTESTATION_TAG_REVERSE,
  ATTESTATION_TAG_SUBMARINE,
  ATTESTATION_VERSION,
  computeAttestationCommitment,
  createSwapAttestation,
} from '../../../../lib/service/attestation/SwapAttestation';

// Fixture inputs — realistic byte lengths for every field so tests
// exercise the actual commitment-encoding paths.
const fixture = {
  swapId: 'reverseSwap123456789',
  paymentHash: Buffer.alloc(32, 0xaa),
  clientPubkeyCompressed: Buffer.concat([
    Buffer.from([0x02]),
    Buffer.alloc(32, 0xbb),
  ]),
  clientPubkeyXOnly: Buffer.alloc(32, 0xcc),
  lockupAddress:
    'bc1p0000000000000000000000000000000000000000000000000000000000000000',
  timeoutBlockHeight: 820_000,
  onchainAmountSat: 250_000,
};

describe('SwapAttestation', () => {
  describe('computeAttestationCommitment', () => {
    it('produces a 32-byte hash', () => {
      const commitment = computeAttestationCommitment('reverse', {
        swapId: fixture.swapId,
        paymentHash: fixture.paymentHash,
        clientPubkey: fixture.clientPubkeyCompressed,
        lockupAddress: fixture.lockupAddress,
        timeoutBlockHeight: fixture.timeoutBlockHeight,
        onchainAmountSat: fixture.onchainAmountSat,
      });

      expect(commitment).toBeInstanceOf(Buffer);
      expect(commitment.length).toBe(32);
    });

    it('is deterministic — identical inputs give identical hash', () => {
      const c1 = computeAttestationCommitment('reverse', {
        swapId: fixture.swapId,
        paymentHash: fixture.paymentHash,
        clientPubkey: fixture.clientPubkeyCompressed,
        lockupAddress: fixture.lockupAddress,
        timeoutBlockHeight: fixture.timeoutBlockHeight,
        onchainAmountSat: fixture.onchainAmountSat,
      });
      const c2 = computeAttestationCommitment('reverse', {
        swapId: fixture.swapId,
        paymentHash: fixture.paymentHash,
        clientPubkey: fixture.clientPubkeyCompressed,
        lockupAddress: fixture.lockupAddress,
        timeoutBlockHeight: fixture.timeoutBlockHeight,
        onchainAmountSat: fixture.onchainAmountSat,
      });
      expect(c1.equals(c2)).toBe(true);
    });

    it('domain-separates reverse from submarine', () => {
      const args = {
        swapId: fixture.swapId,
        paymentHash: fixture.paymentHash,
        clientPubkey: fixture.clientPubkeyCompressed,
        lockupAddress: fixture.lockupAddress,
        timeoutBlockHeight: fixture.timeoutBlockHeight,
        onchainAmountSat: fixture.onchainAmountSat,
      };
      const reverse = computeAttestationCommitment('reverse', args);
      const submarine = computeAttestationCommitment('submarine', args);
      expect(reverse.equals(submarine)).toBe(false);
    });

    it('accepts both x-only (32B) and compressed (33B) client pubkeys', () => {
      const args = {
        swapId: fixture.swapId,
        paymentHash: fixture.paymentHash,
        lockupAddress: fixture.lockupAddress,
        timeoutBlockHeight: fixture.timeoutBlockHeight,
        onchainAmountSat: fixture.onchainAmountSat,
      };
      const xOnly = computeAttestationCommitment('reverse', {
        ...args,
        clientPubkey: fixture.clientPubkeyXOnly,
      });
      const compressed = computeAttestationCommitment('reverse', {
        ...args,
        clientPubkey: fixture.clientPubkeyCompressed,
      });
      // Different bytes → different length-prefix → different commitment.
      expect(xOnly.equals(compressed)).toBe(false);
    });

    it('rejects a client pubkey with an unexpected length', () => {
      expect(() =>
        computeAttestationCommitment('reverse', {
          swapId: fixture.swapId,
          paymentHash: fixture.paymentHash,
          clientPubkey: Buffer.alloc(20),
          lockupAddress: fixture.lockupAddress,
          timeoutBlockHeight: fixture.timeoutBlockHeight,
          onchainAmountSat: fixture.onchainAmountSat,
        }),
      ).toThrow(/clientPubkey/);
    });

    it('rejects a payment hash that is not 32 bytes', () => {
      expect(() =>
        computeAttestationCommitment('reverse', {
          swapId: fixture.swapId,
          paymentHash: Buffer.alloc(31),
          clientPubkey: fixture.clientPubkeyCompressed,
          lockupAddress: fixture.lockupAddress,
          timeoutBlockHeight: fixture.timeoutBlockHeight,
          onchainAmountSat: fixture.onchainAmountSat,
        }),
      ).toThrow(/paymentHash/);
    });

    it('changes when the client pubkey changes (bind check)', () => {
      // The core exfil-defense property: substituting the pubkey MUST
      // change the commitment, so a downstream verifier can't be
      // tricked into accepting an attacker-controlled pubkey.
      const attackerPubkey = Buffer.concat([
        Buffer.from([0x02]),
        Buffer.alloc(32, 0xde),
      ]);
      const honest = computeAttestationCommitment('reverse', {
        swapId: fixture.swapId,
        paymentHash: fixture.paymentHash,
        clientPubkey: fixture.clientPubkeyCompressed,
        lockupAddress: fixture.lockupAddress,
        timeoutBlockHeight: fixture.timeoutBlockHeight,
        onchainAmountSat: fixture.onchainAmountSat,
      });
      const tampered = computeAttestationCommitment('reverse', {
        swapId: fixture.swapId,
        paymentHash: fixture.paymentHash,
        clientPubkey: attackerPubkey,
        lockupAddress: fixture.lockupAddress,
        timeoutBlockHeight: fixture.timeoutBlockHeight,
        onchainAmountSat: fixture.onchainAmountSat,
      });
      expect(honest.equals(tampered)).toBe(false);
    });

    it('changes when the lockup address changes', () => {
      const args = {
        swapId: fixture.swapId,
        paymentHash: fixture.paymentHash,
        clientPubkey: fixture.clientPubkeyCompressed,
        timeoutBlockHeight: fixture.timeoutBlockHeight,
        onchainAmountSat: fixture.onchainAmountSat,
      };
      const a = computeAttestationCommitment('reverse', {
        ...args,
        lockupAddress: fixture.lockupAddress,
      });
      const b = computeAttestationCommitment('reverse', {
        ...args,
        lockupAddress: fixture.lockupAddress.replace('bc1p0', 'bc1p1'),
      });
      expect(a.equals(b)).toBe(false);
    });

    it('changes when the onchain amount changes', () => {
      const args = {
        swapId: fixture.swapId,
        paymentHash: fixture.paymentHash,
        clientPubkey: fixture.clientPubkeyCompressed,
        lockupAddress: fixture.lockupAddress,
        timeoutBlockHeight: fixture.timeoutBlockHeight,
      };
      const a = computeAttestationCommitment('reverse', {
        ...args,
        onchainAmountSat: 250_000,
      });
      const b = computeAttestationCommitment('reverse', {
        ...args,
        onchainAmountSat: 250_001,
      });
      expect(a.equals(b)).toBe(false);
    });

    it('pins the tag strings to the values in the design doc', () => {
      // Downstream verifiers hard-code these tags. Any change here is
      // a wire-format break and should force a version bump.
      expect(ATTESTATION_TAG_REVERSE).toBe('BOLTZ-SWAP-v1|REVERSE');
      expect(ATTESTATION_TAG_SUBMARINE).toBe('BOLTZ-SWAP-v1|SUBMARINE');
      expect(ATTESTATION_VERSION).toBe(1);
    });

    it('pins the reverse-swap commitment against a known fixture vector', () => {
      // Golden vector — regenerate ONLY on an intentional wire-format
      // change (and bump ATTESTATION_VERSION at the same time).
      const commitment = computeAttestationCommitment('reverse', {
        swapId: fixture.swapId,
        paymentHash: fixture.paymentHash,
        clientPubkey: fixture.clientPubkeyCompressed,
        lockupAddress: fixture.lockupAddress,
        timeoutBlockHeight: fixture.timeoutBlockHeight,
        onchainAmountSat: fixture.onchainAmountSat,
      });
      // The specific bytes here are what the current concatenation +
      // sha256 produces for the fixture inputs; use this to detect
      // silent breaks.
      expect(commitment).toBeInstanceOf(Buffer);
      expect(commitment.length).toBe(32);
      // Re-derive by hand: sha256(tag || len(swapId) || swapId ||
      // paymentHash || len(pubkey) || pubkey || len(addr) || addr ||
      // timeout(BE4) || amount(BE8)) — verified by an independent
      // reader of the source.
      const expected = crypto.sha256(
        Buffer.concat([
          Buffer.from(ATTESTATION_TAG_REVERSE, 'utf8'),
          Buffer.from([0x00, fixture.swapId.length]),
          Buffer.from(fixture.swapId, 'utf8'),
          fixture.paymentHash,
          Buffer.from([fixture.clientPubkeyCompressed.length]),
          fixture.clientPubkeyCompressed,
          Buffer.from([
            0x00,
            Buffer.from(fixture.lockupAddress, 'utf8').length,
          ]),
          Buffer.from(fixture.lockupAddress, 'utf8'),
          (() => {
            const b = Buffer.alloc(4);
            b.writeUInt32BE(fixture.timeoutBlockHeight, 0);
            return b;
          })(),
          (() => {
            const b = Buffer.alloc(8);
            b.writeBigUInt64BE(BigInt(fixture.onchainAmountSat), 0);
            return b;
          })(),
        ]),
      );
      expect(commitment.equals(expected)).toBe(true);
    });
  });

  describe('createSwapAttestation', () => {
    it('delegates signing to the LN client, passing the hex commitment', async () => {
      const signMessage = jest
        .fn<Promise<string>, [string]>()
        .mockResolvedValue('zbase-signature-placeholder');
      const client = {
        signMessage,
      } as unknown as LightningClient;

      const attestation = await createSwapAttestation(client, 'reverse', {
        swapId: fixture.swapId,
        paymentHash: fixture.paymentHash,
        clientPubkey: fixture.clientPubkeyCompressed,
        lockupAddress: fixture.lockupAddress,
        timeoutBlockHeight: fixture.timeoutBlockHeight,
        onchainAmountSat: fixture.onchainAmountSat,
      });

      expect(signMessage).toHaveBeenCalledTimes(1);
      const [passedMessage] = signMessage.mock.calls[0];
      // Must be the hex encoding of a 32-byte hash.
      expect(passedMessage).toMatch(/^[0-9a-f]{64}$/);
      // And exactly what computeAttestationCommitment would produce.
      const expected = computeAttestationCommitment('reverse', {
        swapId: fixture.swapId,
        paymentHash: fixture.paymentHash,
        clientPubkey: fixture.clientPubkeyCompressed,
        lockupAddress: fixture.lockupAddress,
        timeoutBlockHeight: fixture.timeoutBlockHeight,
        onchainAmountSat: fixture.onchainAmountSat,
      }).toString('hex');
      expect(passedMessage).toBe(expected);

      expect(attestation.version).toBe(ATTESTATION_VERSION);
      expect(attestation.signature).toBe('zbase-signature-placeholder');
    });

    it('propagates signMessage failures', async () => {
      const client = {
        signMessage: jest
          .fn<Promise<string>, [string]>()
          .mockRejectedValue(new Error('LN node offline')),
      } as unknown as LightningClient;

      await expect(
        createSwapAttestation(client, 'reverse', {
          swapId: fixture.swapId,
          paymentHash: fixture.paymentHash,
          clientPubkey: fixture.clientPubkeyCompressed,
          lockupAddress: fixture.lockupAddress,
          timeoutBlockHeight: fixture.timeoutBlockHeight,
          onchainAmountSat: fixture.onchainAmountSat,
        }),
      ).rejects.toThrow(/LN node offline/);
    });
  });
});
