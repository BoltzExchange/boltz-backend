# ⛑️ Asset Rescue

Asset Rescue enables cooperative recovery of Liquid assets accidentally sent to
swap lockup addresses.

## What is Asset Rescue?

Boltz only accepts L-BTC for Liquid swaps. However, users sometimes accidentally
send the wrong asset (like USDt or other Liquid tokens) to a swap lockup
address. These tokens become stuck because refunding them requires L-BTC to pay
transaction fees, which the lockup output doesn't contain.

Asset Rescue solves this by having Boltz cooperatively sign a rescue transaction
with the client using MuSig2. Boltz provides the L-BTC needed for fees, and the
accidentally locked asset is sent to the client's destination address.

## Why is Asset Rescue Useful?

Asset Rescue enables recovery of accidentally locked tokens:

- **Recovers stuck assets**: Without cooperative signing, tokens accidentally
  sent to lockup addresses would be unspendable since spending them requires
  L-BTC for fees
- **No additional funds needed**: Boltz provides the L-BTC for transaction fees
- **Simple flow**: Two API calls handle the entire recovery process

## When Can Asset Rescue Be Used?

A swap can only use Asset Rescue if **all** of the following conditions are met:

### Correct Swap Status

The swap must be in one of these states:

- `transaction.lockupFailed` - The lockup transaction was invalid (e.g., wrong
  asset was sent)
- `swap.expired` - The swap timed out before completion

### Taproot Swap

The swap must be a Taproot swap. Legacy swaps do not support Asset Rescue
because they lack MuSig2 key-spend paths.

### Non-L-BTC Liquid Asset

The accidentally locked asset must **not** be L-BTC. L-BTC lockups can use the
standard refund flow since L-BTC can pay for its own fees. Asset Rescue is
specifically for other Liquid tokens that were sent by mistake.

### Submarine or Chain Swap from Liquid

Asset Rescue works for swaps where the user locks funds on Liquid:

- Submarine swaps (user locks on Liquid, receives on Lightning)
- Chain swaps where the sending side is Liquid

## How It Works

Asset Rescue uses MuSig2 cooperative signing to spend the locked output via the
key-spend path:

1. **Setup**: Client calls the setup endpoint with the swap ID, lockup
   transaction details, and destination address. Boltz creates a rescue
   transaction, selects an L-BTC UTXO to pay fees, and returns the unsigned
   transaction along with MuSig2 signing data.

2. **Sign**: Client verifies the transaction sends the asset to their
   destination, generates their MuSig2 nonce, and creates a partial signature.

3. **Broadcast**: Client sends their nonce and partial signature to the
   broadcast endpoint. Boltz aggregates the signatures, signs the L-BTC fee
   input, and broadcasts the transaction.

## API

Asset Rescue uses two endpoints:

- `POST /v2/asset/{currency}/rescue/setup` - Create a rescue transaction and get
  MuSig2 signing data
- `POST /v2/asset/{currency}/rescue/broadcast` - Submit partial signature and
  broadcast the transaction

See the [REST API v2](./api-v2) documentation for details.
