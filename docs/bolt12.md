---
description: >-
  Information about swaps with the new BOLT12 standard and some accompanying
  tips & tricks for how to handle BOLT12 offers.
---

# ⚡ BOLT12

## Swapping to BOLT12 invoices

We allow swaps _to_ BOLT12 invoices in [Submarine Swaps](lifecycle.md#normal-submarine-swaps). The flow is the same as with BOLT11 invoices. BOLT12 for [Reverse Swaps](lifecycle.md#reverse-submarine-swaps) is currently not supported, but [will be in future](https://github.com/BoltzExchange/boltz-backend/issues/708).

### Offers

To make it as easy as possible for clients to fetch BOLT12 invoices for offers, we provide [this API endpoint](https://api.boltz.exchange/swagger#/Lightning/post_lightning__currency__bolt12_fetch).

To verify the returned invoice belongs to the provided offer, the signing key of the invoice has to be checked. That singing key has to be either:

* the signing key of the offer, if that is defined, or
* the public key of the last hop of one of the message paths

Reference implementations for checking the signing key:

* [Rust in boltz-client](https://github.com/BoltzExchange/boltz-client/blob/63a2bdd8a7729d45fe0c9b7a016a847bc5a83976/lightning/lib/bolt12/src/lib.rs#L113)
* [TypeScript in boltz-web-app](https://github.com/BoltzExchange/boltz-web-app/blob/f94e7cdb31946ccbc4bd5d2f4f29086ca63c7335/src/utils/invoice.ts#L261)

## BIP-353

A common way to share BOLT12 offers is via [BIP-353](https://github.com/bitcoin/bips/blob/master/bip-0353.mediawiki). After [resolving the BIP-353](https://github.com/bitcoin/bips/blob/master/bip-0353.mediawiki#resolution), read the URL query parameters. BOLT12 offers are in the `lno` parameter, so if it's set, a swap can be created by fetching an invoice and creating a Submarine Swap with it.
