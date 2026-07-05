# Swap-response attestation

Reverse swap responses include a Boltz-node-signed commitment to the on-chain
HTLC parameters. This lets a client whose signer sits behind a separate
coordinator process — a routing-node control plane, a wallet backend, a
signer-in-enclave setup — cryptographically verify that the swap's
`claimPublicKey`, `lockupAddress`, `timeoutBlockHeight` and `onchainAmount`
weren't tampered with by the coordinator on the way to the signer.

TLS is not sufficient here: TLS proves things to the endpoint that terminates
the connection. If that endpoint is a compromised coordinator forwarding to a
signer behind it, the signer sees only what the coordinator chooses to relay. A
signature under the LN node key survives the coordinator unchanged because it's
anchored to the same key that signs the swap's Bolt11 invoice.

## Response shape

Present on the reverse-swap creation response
([`POST /v2/swap/reverse`](./api-v2.md)) whenever the client supplied a
`claimPublicKey` for a UTXO-based reverse swap:

```json
{
  "id": "...",
  "invoice": "lnbc...",
  "lockupAddress": "bc1p...",
  "swapTree": { ... },
  "refundPublicKey": "02...",
  "timeoutBlockHeight": 820000,
  "onchainAmount": 250000,
  "attestation": {
    "version": 1,
    "signature": "zbase32-encoded-compact-ecdsa-with-recovery"
  }
}
```

## Commitment layout

The signed input is `sha256(commitment)`, hex-encoded, where `commitment` is a
fixed-order byte concatenation:

```
tag                (variable UTF-8)   "BOLTZ-SWAP-v1|REVERSE"
len(swap_id)       (uint16 BE)
swap_id            (variable UTF-8)
payment_hash       (32 bytes)
len(pubkey)        (uint8)
client_pubkey      (33 bytes compressed, or 32 bytes x-only)
len(address)       (uint16 BE)
lockup_address     (variable UTF-8)
timeout            (uint32 BE)
onchain_amount     (uint64 BE, satoshis)
```

The tag domain-separates reverse from submarine so no attestation from one
direction can be replayed as the other.

## Signing key

The commitment hash (hex-encoded) is signed with the Boltz LN node's identity
key using the "Lightning Signed Message" convention. Both LND
(`lnrpc.SignMessage`) and CLN (`signmessage`) natively expose this — the
wire-format signature is a zbase32-encoded 65-byte compact ECDSA-with-recovery
signature over `sha256d("Lightning Signed Message:" || commitment_hex)`.

For a reverse swap, the signing node is the same LN node that will receive the
invoice payment — i.e., the same node whose pubkey signs the Bolt11 invoice
returned in the swap response. Verifiers can extract the expected pubkey
directly from the invoice.

## Verifying

Pseudocode. A production implementation would use a real `bitcoinjs-message` /
`zbase32` library and reject any attestation whose `version` doesn't match a
known value.

```typescript
import { crypto } from 'bitcoinjs-lib';
import { verify } from 'bitcoinjs-message';
// BIP-137-style verify
import { decode as bolt11Decode } from 'bolt11';

function verifySwapAttestation(
  response: ReverseSwapResponse,
  yourClientPubkey: Buffer,
): boolean {
  if (response.attestation === undefined) return false;
  if (response.attestation.version !== 1) return false;

  const { payeeNodeKey } = bolt11Decode(response.invoice);

  // Reconstruct the exact commitment Boltz signed.
  const commitment = computeReverseSwapCommitment({
    swapId: response.id,
    paymentHash: paymentHashFromInvoice(response.invoice),
    clientPubkey: yourClientPubkey, // your own value, not from response
    lockupAddress: response.lockupAddress,
    timeoutBlockHeight: response.timeoutBlockHeight,
    onchainAmountSat: response.onchainAmount,
  });

  // The signMessage convention: recover the pubkey via BIP-137
  // and match against the invoice payee.
  return verify(
    commitment.toString('hex'),
    payeeNodeKey,
    response.attestation.signature,
  );
}
```

The critical detail: verifiers pass `yourClientPubkey` from **their own
independent view** of the swap request — the pubkey they intended to use, not
the one echoed back in the response. If a coordinator between client and Boltz
substituted a different pubkey, the reconstructed commitment differs from what
Boltz signed and verification fails.

## Version negotiation

`version` starts at `1`. Any future change to the commitment layout bumps it.
Verifiers should refuse to interpret attestations with an unknown `version`
rather than silently upgrading their commitment computation — otherwise a
downgrade attack on the version field would let a coordinator serve a
stale-format attestation over new-format swap params.

## Submarine swaps

Not yet emitted. Submarine swaps have a similar exfil vector via the
`refundPublicKey`, but the LN node that will pay the invoice isn't picked at
swap-creation time — it's decided when the client submits the invoice via
`setInvoice`. Signing there is a natural follow-up.

## What this does NOT protect against

- **A compromised Boltz.** The attestation is signed with Boltz's own key; a
  compromised Boltz can sign anything they want. This is defense against
  coordinators between the client and Boltz, not against Boltz itself.
- **A verifier that trusts the coordinator's copy of the `claimPublicKey`.** The
  whole point is that verifiers must generate the pubkey they expect
  independently. A verifier that pulls the pubkey from the response and passes
  it into `computeCommitment` is checking the response against itself.
