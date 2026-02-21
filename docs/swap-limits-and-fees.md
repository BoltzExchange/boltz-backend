# 💰 Swap Limits & Fees

Understanding how fees and limits work is essential for building a reliable
Boltz integration. This guide covers the fee structure, amount calculations, and
important considerations for all swap types.

## Fee Overview

Every swap involves two types of fees: percentage fees and miner fees. Boltz
covers all Lightning routing fees for you.

### Percentage Fee

A variable fee calculated as a percentage of the swap amount. The rate varies by
swap type and pair; check the `/v2/swap/{submarine,reverse,chain}` endpoints for
current rates.

The percentage fee basis differs by swap type:

- **Submarine**: calculated on the **Lightning invoice amount**
- **Reverse**: calculated on the **onchain amount**
- **Chain**: calculated on the **server lock amount**

### Miner Fee

Miner fees cover blockchain transaction costs. These are calculated from
transaction sizes and current network fee rates.

| Swap Type     | Deducted From Your Amount                                      |
| ------------- | -------------------------------------------------------------- |
| **Submarine** | Claim fee (included in the amount you send)                    |
| **Reverse**   | Lockup fee (deducted from onchain amount you receive)          |
| **Chain**     | Server fee (Boltz's lockup + claim, deducted from your amount) |

Additionally, you pay transaction fees when broadcasting your own transactions:

| Swap Type     | You Broadcast & Pay For                          |
| ------------- | ------------------------------------------------ |
| **Submarine** | Lockup transaction (sending onchain funds)       |
| **Reverse**   | Claim transaction (receiving onchain funds)      |
| **Chain**     | Lockup (sending chain) + Claim (receiving chain) |

::: info

For reverse swaps, the `onchainAmount` in the API response already has the
lockup fee subtracted—this is the exact amount Boltz will send to the HTLC. The
`claimFee` is an estimate to help you budget for the claim transaction you'll
broadcast.

:::

### Extra Fees

You can optionally add extra fees on top of the base fees when creating a swap.
This is useful if you're building an integration and want to charge your own
markup. The extra fee percentage is added to the base percentage fee.

To add extra fees, include an `extraFees` object when creating a swap:

```json
{
  "from": "BTC",
  "to": "BTC",
  "invoice": "lnbc...",
  "extraFees": {
    "id": "my-integration",
    "percentage": 0.5
  }
}
```

| Field        | Type   | Required | Description                                          |
| ------------ | ------ | -------- | ---------------------------------------------------- |
| `id`         | string | Yes      | Identifier for the extra fee (e.g., your app's name) |
| `percentage` | number | No       | Additional fee percentage (0-10). Defaults to 0      |

**How it works:**

The extra fee percentage is added to Boltz's base percentage fee. For example,
if Boltz charges 0.1% and you add 0.5% extra, the total percentage fee becomes
0.6%.

::: warning

Maximum extra fee is **10%**. Requests with a higher percentage will be
rejected.

:::

## Swap Limits

Each pair has limits that define acceptable swap amounts. Check the pair
endpoints for current limits.

Limits are enforced on the following amounts:

| Swap Type     | Enforced On      |
| ------------- | ---------------- |
| **Submarine** | Invoice amount   |
| **Reverse**   | Invoice amount   |
| **Chain**     | User lock amount |

### Minimum Amount

The minimum ensures the swap covers miner fees with sufficient margin. Minimums
may be adjusted dynamically based on current network fee rates to ensure swaps
remain economically viable.

For submarine swaps, there may be two minimums:

- **Standard minimum** (`minimal`): For regular claims
- **Batched minimum** (`minimalBatched`): Lower minimum when swaps are
  aggregated into a single claim transaction

If a swap amount is below the standard minimum but above the batched minimum, it
will only be processed as part of a batch.

### Maximum Amount

The per-swap limit representing the largest single swap Boltz will accept for a
pair.

### Zero-Confirmation Limit

Transactions at or below this amount may be accepted without blockchain
confirmations, provided they meet these criteria:

- The transaction doesn't signal RBF (Replace-By-Fee)
- The fee rate is adequate
- The swap amount is within the zero-confirmation limit

## Calculating Amounts

All calculations use integer arithmetic (satoshis). Percentage fees are always
rounded up using `ceil()`.

::: info

All Bitcoin trading pairs use a rate of 1:1. The formulas below reflect this; no
exchange rate conversion is needed.

:::

### Submarine Swaps

For submarine swaps, the backend calculates the invoice amount from the onchain
amount:

```
invoiceAmount = floor((onchainAmount - minerFee) / (1 + percentageFeeRate))
```

**Given an invoice amount**, calculate the onchain amount to send:

```
percentageFee = ceil(invoiceAmount × percentageFeeRate)
amountToSend = invoiceAmount + minerFee + percentageFee
```

**Example:**

- Invoice: 100,000 sats
- Miner fee: 4,379 sats
- Percentage fee rate: 0.1% (0.001)

```
percentageFee = ceil(100,000 × 0.001) = 100
amountToSend = 100,000 + 4,379 + 100 = 104,479 sats
```

::: info

For submarine swaps, the percentage fee is calculated on the **invoice amount**,
not the total send amount. This differs from reverse and chain swaps.

:::

### Reverse Swaps

You can specify either an invoice amount or a desired onchain amount.

**Given invoice amount:**

```
percentageFee = ceil(invoiceAmount × percentageFeeRate)
onchainAmount = floor(invoiceAmount - percentageFee - minerFeeLockup)
```

**Example:**

- Invoice: 100,000 sats
- Miner fee (lockup): 2,772 sats
- Percentage fee rate: 0.5% (0.005)

```
percentageFee = ceil(100,000 × 0.005) = 500
onchainAmount = floor(100,000 - 500 - 2,772) = 96,728 sats
```

**Given onchain amount:**

```
invoiceAmount = ceil((onchainAmount + minerFeeLockup) / (1 - percentageFeeRate))
percentageFee = ceil(invoiceAmount × percentageFeeRate)
```

**Example:**

- Desired onchain: 96,728 sats
- Miner fee (lockup): 2,772 sats
- Percentage fee rate: 0.5% (0.005)

```
invoiceAmount = ceil((96,728 + 2,772) / 0.995) = ceil(100,000) = 100,000 sats
percentageFee = ceil(100,000 × 0.005) = 500
```

### Chain Swaps

You can specify either a user lock amount or a desired server lock amount.

**Given user lock amount:**

```
percentageFee = ceil(userLockAmount × percentageFeeRate)
serverLockAmount = floor(userLockAmount - percentageFee - serverMinerFee)
```

**Example:**

- User locks: 100,000 sats
- Server miner fee: 7,035 sats
- Percentage fee rate: 0.5% (0.005)

```
percentageFee = ceil(100,000 × 0.005) = 500
serverLockAmount = floor(100,000 - 500 - 7,035) = 92,465 sats
```

**Given server lock amount:**

```
userLockAmount = ceil((serverLockAmount + serverMinerFee) / (1 - percentageFeeRate))
percentageFee = ceil(userLockAmount × percentageFeeRate)
```

**Example:**

- Desired server lock: 92,465 sats
- Server miner fee: 7,035 sats
- Percentage fee rate: 0.5% (0.005)

```
userLockAmount = ceil((92,465 + 7,035) / 0.995) = ceil(100,000) = 100,000 sats
percentageFee = ceil(100,000 × 0.005) = 500
```

::: info

For chain swaps, the server miner fee (deducted from your amount) covers Boltz's
transactions. You also broadcast and pay for your own lockup and claim
transactions. The API response shows estimated fees for your transactions under
`fees.user`.

:::

## Pair Hash Validation

Each pair response includes a hash representing the current fees and limits. The
hash is a SHA-256 digest of the JSON-serialized pair data (rate, fees, and
limits).

Including the hash when creating swaps is **optional but recommended**:

```json
{
  "from": "BTC",
  "to": "BTC",
  "invoice": "lnbc...",
  "pairHash": "90ab5c8e6ece5db52173e9423a0dd3071f5894dc8d35ed592a439ccabcdebbd5"
}
```

If provided and the hash doesn't match the current configuration, you'll receive
an `invalid pair hash` error, indicating the fee data is outdated.

::: warning

Always fetch fresh pair data before creating swaps. Fee rates and miner fees can
change based on network conditions. Using the pair hash ensures the user sees
accurate fee information.

:::

## Important Notes

### Fee Precision

All fee calculations use integer arithmetic (satoshis/wei). Key rounding rules:

- Percentage fees: always rounded **up** (`ceil`)
- Received amounts: always rounded **down** (`floor`)
- Send-side invoice/lock amounts (reverse invoices, chain user locks): always
  rounded **up** (`ceil`)

This ensures Boltz always receives sufficient funds to cover fees.

### Lightning Routing Fees

**Boltz covers all Lightning routing fees** when paying invoices in submarine
swaps. You don't need to account for routing fees in your calculations.

### Zero-Amount Swaps

Chain swaps support zero-amount creation where no amounts are specified upfront.
Fees are calculated when you lock funds, and Boltz responds with a quote for how
much it will lock in return. See [Renegotiating](./renegotiating.md) for more
details.

### Dynamic Fee Updates

Miner fees are updated periodically based on network conditions. For ERC20
tokens, fees also depend on exchange rates between the token and the native
currency. Always fetch fresh pair data before displaying fees to users.
