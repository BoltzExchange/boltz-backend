# 🛟 Swap Restore

Swap Restore is an emergency, last‑resort recovery flow for situations where all
local swap state and any client backups have been lost. Swap Restore works only
when swap keys were originally derived from an xpub.

This mechanism primarily targets UTXO‑based chains. On EVM networks, swap
parameters are persisted on‑chain in contract event logs. Recovery on EVM is
performed by reading those logs instead of using Swap Restore.

## What Swap Restore Does

At a high level, Swap Restore means the client deterministically creates swap
keys using BIP32, derives and submits only the xpub to `/v2/swap/restore`,
receives all associated swaps, and reconstructs the local data. With that state
recreated, the app can perform claims or refunds as needed. For claims to work,
the client also needs to be able to deterministically derive preimages too. One
option for that is hashing the private keys.

## Trust Model

The mnemonic never leaves the device and private keys remain client‑side. The
backend only receives the xpub, which cannot be used to derive private keys or
spend funds. All transaction signing happens locally. Sharing an xpub links your
swap history to the backend for matching purposes, but the backend cannot spend
your funds.

## API

Call `POST /v2/swap/restore` with the xpub in the body:

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
derive the account at `m/44/0/0/0` (the default path) and export its neutered
form (the xpub) for server‑side swap matching. Individual swap keys are derived
at `m/44/0/0/0/{index}`. This default path must be used for implementations to
work with the Web App, though a different derivation path can be specified when
using the API directly.

### Preimages

We deterministically create preimages with `sha256(privateKey(index))`. This
allows swaps to be fully restored from the mnemonic alone. Using deterministic
preimages in this exact way is necessary for restored swaps to be able to be
claimed in our Web App.
