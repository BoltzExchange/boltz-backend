# 🛟 Swap Restore

Swap Restore is a recovery flow for situations where all local swap state and
any client backups have been lost. Swap Restore enables refunding failed swaps
as well as resuming ongoing swaps. It works only when swap keys were originally
derived from an xpub.

This mechanism targets UTXO‑based chains. On EVM chains, swap parameters are
persisted on‑chain in contract event logs. Recovery on EVM is performed by
reading those logs instead of using Swap Restore. For more details, see the
[EVM contract logs section](./claiming-swaps.md#evm-chains).

## What Swap Restore Does

At a high level, Swap Restore means the client submits the xpub used for
[key derivation](#key-derivation) to `/v2/swap/restore`, receives all associated
swaps, and reconstructs the local data. With that state restored, the app can
perform claims for ongoing swaps or refunds for failed ones as needed. For
claims to work, the client also needs to be able to deterministically derive
preimages. One option to do that is to
[hash the private key of a swap and use that hash as the preimage](#preimages).

## Trust Model

The private keys never leave the device and remain client‑side. The backend only
receives the xpub, which cannot be used to derive private keys or spend funds.
All transaction signing happens locally. Sharing an xpub links your swap history
to the Boltz Backend, but it cannot spend your funds.

## API

Call
[`POST /v2/swap/restore`](https://api.boltz.exchange/swagger#/Swap/post_swap_restore)
with the xpub in the request body:

```json
{
  "xpub": "xpub6C..."
}
```

The API will respond with an array of swaps belonging to that xpub. A simplified
example shape is shown below:

```json
[
  {
    "id": "abc123",
    "type": "submarine|reverse|chain",
    "status": "transaction.lockupFailed",
    "from": "BTC",
    "to": "LBTC",
    ...
  }
]
```

## Key Derivation

Starting from a mnemonic, derive a seed and then a BIP32 root. From there,
derive the account at `m/44/0/0/0` (the default path) and export its xpub for
server‑side swap matching. Individual swap keys are derived at
`m/44/0/0/0/{index}`. This default path must be used for implementations to work
with Boltz Web App, though a different derivation path can be specified when
using Boltz API directly.

### BIP85: Avoiding Derivation Path Collisions

For wallets that already use standard derivation paths like `m/44/0/0/0` for
regular transactions, using the same path for swap keys creates a risk of
derivation path collisions. If the wallet later generates keys at the same
indices for regular spending, it could inadvertently reuse keys that were
previously used in swaps, compromising privacy and potentially security.

[BIP85](https://github.com/bitcoin/bips/blob/master/bip-0085.mediawiki) provides
a solution by deriving application-specific entropy from a master seed. This
entropy can then be used to create a child seed exclusively for Boltz swaps,
isolating swap keys from the wallet's main key derivation tree while not adding
any additional information to back up for end users.

#### Implementation

1. Derive entropy from the master seed via BIP85 using the application number
   for Boltz (e.g., `26589` for "BOLTZ" in T9)
2. Use the derived entropy to create a seed
3. From this derived child seed, derive the swap account at `m/44/0/0/0` and
   export its xpub
4. All swap keys and preimages are then derived from this isolated child seed

This approach ensures that:

- Swap keys never collide with the main wallet's key derivation
- The entire swap key hierarchy is deterministically recoverable from the master
  mnemonic
- Privacy is preserved by separating swap activity from regular wallet activity
- The same master mnemonic can safely be used across both regular wallet
  operations and Boltz swaps

### Preimages

We recommend deriving preimages deterministically with
`sha256(privateKey(index))`. This allows swaps to be fully restored from the
mnemonic alone. Using deterministic preimages in this exact way is necessary for
restored swaps to be claimable in our Web App.
