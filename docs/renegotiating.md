# ♻️ Renegotiating Chain Swaps

Renegotiation allows Chain Swaps that failed due to an incorrect lockup amount
to be salvaged instead of requiring a refund. It applies only to Chain Swaps,
not Submarine or Reverse Swaps.

## What is Renegotiation?

Renegotiation enables Chain Swaps that entered `transaction.lockupFailed`
because the lockup amount was incorrect to continue.

Instead of refunding the locked funds and creating a new swap, the client can
request a new quote from Boltz based on the actual amount sent, and if accepted,
the swap proceeds as normal.

A Chain Swap becomes eligible for renegotiation when the user sends **less** or
**more** than the expected amount. In both cases, the swap enters the
`transaction.lockupFailed` status because the locked amount doesn't match what
was originally quoted. Renegotiation allows Boltz to recalculate the appropriate
amount to lock on the destination chain based on the actual amount received,
rather than failing the swap entirely.

## Why is Renegotiation Useful?

Renegotiation offers several advantages over refunding and creating a new swap:

- **Lower fees**: Avoids additional on-chain transaction fees by avoiding refund
  transactions
- **Simpler workflow**: No need to generate new preimages or derive new keys
- **Better UX**: Users can recover from mistakes without starting over

## When Can Renegotiation Be Used?

A Chain Swap can only be renegotiated if **all** of the following conditions are
met:

### Correct Failure Reason

The swap must have failed specifically because of an amount mismatch. The
failure reason must indicate either:

- Underpayment: `locked X is less than expected Y`
- Overpayment: `locked X is greater than expected Y`

Other failure reasons (such as invalid address, invalid timelock, etc.) do not
qualify for renegotiation.

### No Refund Signature Created

A refund signature must not have been created for the swap yet. Once a refund
transaction is signed, renegotiation is no longer possible.

### Sufficient Time Remaining

At least **60 minutes** must remain until the swap expires. This ensures
sufficient time for quote validation and acceptance, server lockup transaction
broadcasting, and client claim transaction creation. Swaps closer to expiry must
be refunded instead.

### Amount Within Pair Limits

The actual locked amount must fall within the pair's minimum and maximum limits.
Boltz also validates liquidity availability before accepting renegotiation. If
the new amount exceeds pair limits or liquidity is insufficient, renegotiation
is not possible.

## API

Renegotiation uses two endpoints:

- `GET /v2/swap/chain/{id}/quote` - Request a new quote based on the actual
  locked amount
- `POST /v2/swap/chain/{id}/quote` - Accept the quote to continue the swap

See the [REST API v2](./api-v2) documentation for details.
