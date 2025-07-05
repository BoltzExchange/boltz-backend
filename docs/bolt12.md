# ✨ BOLT12

Information about swaps with the new BOLT12 standard and some accompanying tips
& tricks for how to handle BOLT12 offers.

## Submarine Swaps

We allow swaps _to_ BOLT12 invoices in
[Submarine Swaps](lifecycle.md#normal-submarine-swaps). The flow is the same as
with BOLT11 invoices.

### Offers

To make it as easy as possible for clients to fetch BOLT12 invoices for offers,
we provide
[this API endpoint](https://api.boltz.exchange/swagger#/Lightning/post_lightning__currency__bolt12_fetch).

To verify the returned invoice belongs to the provided offer, the signing key of
the invoice has to be checked. That signing key has to be either:

- the signing key of the offer, if that is defined, or
- the public key of the last hop of one of the message paths

Reference implementations for checking the signing key:

- [Rust in boltz-client](https://github.com/BoltzExchange/boltz-client/blob/63a2bdd8a7729d45fe0c9b7a016a847bc5a83976/lightning/lib/bolt12/src/lib.rs#L113)
- [TypeScript in boltz-web-app](https://github.com/BoltzExchange/boltz-web-app/blob/f94e7cdb31946ccbc4bd5d2f4f29086ca63c7335/src/utils/invoice.ts#L261)

### BIP-353

A common way to share BOLT12 offers is via
[BIP-353](https://github.com/bitcoin/bips/blob/master/bip-0353.mediawiki). After
[resolving the BIP-353](https://github.com/bitcoin/bips/blob/master/bip-0353.mediawiki#resolution),
read the URL query parameters. BOLT12 offers are in the `lno` parameter, so if
it's set, a swap can be created by fetching an invoice and creating a Submarine
Swap with it.

## Reverse Swaps

To swap from a BOLT12 offer to onchain, the client needs to:

1. Create a BOLT12 offer
2. Register it with the Boltz API
3. Respond to invoice requests for the offer either via webhook or WebSocket
4. Follow the usual Reverse Swap protocol

Offers for Reverse Swaps can be registered with
[this API endpoint](https://api.boltz.exchange/swagger#/Lightning/post_lightning__currency__bolt12).
These offers have to include the CLN node of the API endpoint in a blinded
message path as entry point. Information about the lightning nodes of the API
can be queried from the
[`/nodes` endpoint](https://api.boltz.exchange/swagger#/Nodes/get_nodes). When
registering the offer, a webhook URL can be specified. That webhook will be
called when an invoice request for the offer is received:

```json
{
  "offer": "<offer for which an invoice was requested>",
  "invoiceRequest": "<invoice request encoded as HEX>"
}
```

As a response to that webhook call, an invoice in response to the request is
expected:

```json
{
  "invoice": "lni..."
}
```

In case webhook calls are not desired, those invoice requests can also be
delivered [via WebSocket](api-v2#bolt12-invoice-requests). There is also a
[`PATCH` endpoint to update the webhook URL](https://api.boltz.exchange/swagger#/Lightning/patch_lightning__currency__bolt12)
for an offer that is registered already.

When creating invoices in response to the requests,
[this endpoint](https://api.boltz.exchange/swagger#/Lightning/get_lightning__currency__bolt12__receiving_)
should be called to figure out parameters the API expects to be set in the
invoice. And the invoice should have the CLN node of the API as the entry point
of the blinded payment path.

_Before_ responding with the invoice, a Reverse Swap should be created with it.
The preimage hash is omitted from the call to create the swap and the `invoice`
property set instead. The rest of the Reverse Swap flow stays the exact same.

Magic Routing hints in those BOLT12 invoices are **_not_** signaled by including
a fake routing hint with the channel id constant. They are shown to the payer
when they fetch the invoice for the offer
[in the API](https://api.boltz.exchange/swagger#/Lightning/post_lightning__currency__bolt12_fetch).
