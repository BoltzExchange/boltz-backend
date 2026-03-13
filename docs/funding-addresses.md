# 🏦 Funding Addresses

Funding Addresses are standalone onchain lockup addresses that can be created
before a swap exists. They let clients receive or pre-fund coins first and only
later attach those funds to an eligible swap.

They are especially useful for **Submarine Swaps**, where the client has to
create a Lightning invoice up front and the swap amount is fixed at creation
time. If the user does not already know the exact onchain amount they will lock,
Funding Addresses allow receiving the coins first and only creating the swap
once the amount is known.

Another benefit, especially relevant for Bitcoin, is that the funding
transaction can confirm before swap creation. That allows the later swap to
continue immediately once it is linked.

They are available on Bitcoin and Liquid and use the same Taproot + MuSig2 model
as other cooperative Boltz flows.

## What Are Funding Addresses?

When creating a Funding Address, the client provides a refund public key and
Boltz derives its own public key. Together they define a Taproot output that:

- can be spent **cooperatively** via the key path to fund a swap lockup
- can be **unilaterally** refunded by the client after a timeout if the server
  disappears or does not cooperate.

Unlike a normal swap lockup address, a Funding Address exists independently of
any specific swap.

## How It Works

1. **Create**: the client creates a Funding Address for a chain and stores the
   returned metadata, especially the `id`, `tree`, `serverPublicKey`, timeout
   and, on Liquid, the `blindingKey`.
2. **Fund**: the user sends coins to the Funding Address. Boltz tracks the
   funding transaction and exposes status updates via polling and WebSocket.
3. **Link**: once the client has an eligible swap, it requests signing details,
   verifies the presigned transaction, and signs it with the key derived for the
   Funding Address. After submitting the signature, the swap will emit a
   `transaction.mempool` or `transaction.confirmed` status update depending on
   the funding transaction.

If you replace the funding transaction of a Funding Address that was previously
linked to a swap, the swap is delinked and the client has to go through the
signing flow again.

## Statuses

Funding Addresses have their own lifecycle:

- `created`: the address exists but no funding transaction was detected yet
- `transaction.mempool`: a funding transaction was detected in the mempool
- `transaction.confirmed`: the funding transaction confirmed onchain
- `transaction.claimed`: a linked swap completed and the Funding Address was
  claimed successfully
- `transaction.refunded`: Boltz signed the cooperative refund flow for the
  Funding Address
- `expired`: the timeout was reached without the Funding Address being spent

## Claims, Refunds and Restore

The exact claim, refund, and cooperative signing flow for Funding Address-backed
swaps is documented in [Claims & Refunds](./claiming-swaps.md).

### Restore

Funding Addresses are also covered by [Swap Restore](./swap-restore.md). They
should use the same deterministic key derivation and backup model as swaps so
their keys can be recovered in exactly the same way.

## API

Funding Addresses are exposed through dedicated REST endpoints for creation,
status lookup, linking/signing, and refunds. For exact request and response
schemas, see the [REST API v2](./api-v2.md) page and the
[Swagger spec](https://api.boltz.exchange/swagger/).

## WebSocket

Funding Address updates can be subscribed to via the `funding.update` WebSocket
channel. This is the easiest way to learn when a Funding Address was funded,
linked, claimed, refunded, or expired.

See [Funding Address Updates](./api-v2.md#funding-address-updates) in the
[REST API v2](./api-v2.md) documentation for the subscription format.
