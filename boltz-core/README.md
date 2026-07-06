# boltz-core

[![crates.io](https://img.shields.io/crates/v/boltz-core.svg)](https://crates.io/crates/boltz-core)
[![docs.rs](https://docs.rs/boltz-core/badge.svg)](https://docs.rs/boltz-core)

Atomic swap primitives for **Bitcoin** and **Liquid** (Elements), used by the
[Boltz](https://boltz.exchange) backend.

`boltz-core` is the low-level cryptographic toolkit for building and settling
atomic swaps on-chain. It is the swap cryptography on its own — not a Boltz API
client and not the swap state machine. If you just want to perform swaps, use an
[official SDK](https://api.docs.boltz.exchange/libraries.html) instead.

## What it does

A swap locks funds in an HTLC-like output with two spending paths: a **claim**
path, spent by revealing a preimage whose hash is committed in the script, and a
**refund** path, spent by the funder after an absolute timelock expires. Boltz
uses this in two directions — _submarine_ swaps (on-chain to Lightning) and
_reverse_ swaps (Lightning to on-chain) — across both Bitcoin and Liquid.

The crate provides the pieces needed to construct, sign, and rescue those swaps:

- **Swap scripts and trees** — submarine and reverse layouts for both
  pre-Taproot (P2SH / P2WSH / nested-SegWit) and Taproot outputs, on Bitcoin and
  Liquid.
- **Transaction construction** — builds, signs, and finalizes claim and refund
  transactions across every output type and either an absolute or a relative
  (sat/vB) fee target.
- **MuSig2 cooperative signing** — a typed-state builder that wraps
  `secp256k1`'s MuSig2 primitives so the compiler enforces the 2-of-2 signing
  protocol order. This backs the cooperative Taproot key-path spend, the happy
  path for a swap.
- **Preimage detection** — extracts the revealed preimage from a claim
  transaction, so a watcher can learn the secret when a counterparty claims.
- **A chain-agnostic facade** — work with Bitcoin or Liquid through one set of
  address, network, and transaction types instead of branching on chain
  everywhere.
- **Liquid extras** — confidential-transaction blinding, covenant claim leaves
  built from Elements introspection opcodes, and asset rescue for recovering a
  non-L-BTC asset accidentally sent to a swap address.

## Features

The `bitcoin`, `elements`, and `musig` Cargo features are enabled by default.
Disable default features to opt out of a chain or of MuSig2 — for example, to
pull in only the Bitcoin scripts and transactions without Liquid or the
`secp256k1` dependency. The chain-agnostic address and wrapper modules require
both `bitcoin` and `elements`.

## Installation

```toml
[dependencies]
boltz-core = "0.1"
```

## Documentation

Full API reference and examples are on [docs.rs](https://docs.rs/boltz-core).

## License

[MIT](./LICENSE)
