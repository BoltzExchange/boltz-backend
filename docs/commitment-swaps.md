# 🔐 Commitment Swaps

Commitment swaps allow locking funds first and committing to a swap after,
without knowing the amount when creating the swap. This document explains how
commitment swaps work, when to use them, and how to integrate them into your
application.

## Overview

In standard EVM swaps, you must know the exact amount when creating the swap
because the preimage hash is included in the lockup. This creates a problem when
the amount isn't known until the transaction executes.

Commitment swaps solve this by:

1. Locking funds with `bytes32(0)` as the preimage hash instead of the actual
   hash
2. Providing an EIP-712 signature that commits to the real preimage hash and the
   actual locked amount
3. Allowing claims only when both the preimage and the commitment signature are
   provided

This decouples the lockup from the swap creation, enabling flexible amount
handling while maintaining the security guarantees of the atomic swap.

## When to Use Commitment Swaps

Commitment swaps are beneficial when:

- **Sweeping wallets**: Send your entire balance without needing to calculate
  the exact amount minus fees upfront
- **DEX trade outputs**: Lock the output of a DEX swap where slippage means the
  exact amount isn't known until execution
- **Multi-step transactions**: Any scenario where the amount to lock depends on
  prior transaction results

## Contract Support

Commitment swaps require contract version 5 or higher. You can verify contract
support by checking the `features` array returned by the contracts endpoint:

```json
{
  "supportedContracts": {
    "5": {
      "EtherSwap": "0x...",
      "ERC20Swap": "0x...",
      "features": ["BatchClaim", "CommitmentSwap"]
    }
  }
}
```

## How It Works

### Standard Swap vs Commitment Swap

| Aspect                | Standard Swap                  | Commitment Swap                          |
| --------------------- | ------------------------------ | ---------------------------------------- |
| Amount known          | Must know exact amount upfront | Can lock any amount, commit afterward    |
| Lockup `preimageHash` | SHA256 hash of preimage        | `bytes32(0)`                             |
| Claim requirement     | Preimage only                  | Preimage + EIP-712 commitment signature  |
| Contract version      | Any                            | Version 5+ with `CommitmentSwap` feature |

### EIP-712 Commitment Signature

The commitment is an EIP-712 typed signature. The type hash differs between
EtherSwap (native currency) and ERC20Swap (tokens):

**EtherSwap:**

```solidity
bytes32 public constant TYPEHASH_COMMIT = keccak256(
    "Commit(bytes32 preimageHash,uint256 amount,address claimAddress,address refundAddress,uint256 timelock)"
);
```

**ERC20Swap:**

```solidity
bytes32 public constant TYPEHASH_COMMIT = keccak256(
    "Commit(bytes32 preimageHash,uint256 amount,address tokenAddress,address claimAddress,address refundAddress,uint256 timelock)"
);
```

The signature must be created by the `refundAddress` (the address that locked
the funds) and commits to:

- `preimageHash`: The actual SHA256 hash of the preimage (not `bytes32(0)`)
- `amount`: The amount you locked (in wei for ETH, or smallest token units for
  ERC20)
- `tokenAddress`: (ERC20 only) The address of the token contract
- `claimAddress`: Boltz's claim address
- `refundAddress`: Your address that locked the funds
- `timelock`: The block height after which refunds are possible

## API Reference

### Get Lockup Details

Before creating a commitment swap, fetch the lockup parameters from Boltz:

```
GET /v2/commitment/{currency}/details
```

**Response:**

```json
{
  "contract": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  "claimAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "timelock": 20160
}
```

| Field          | Description                                      |
| -------------- | ------------------------------------------------ |
| `contract`     | Address of the swap contract to lock funds in    |
| `claimAddress` | Boltz's address that will claim the locked funds |
| `timelock`     | Suggested block height for the commitment lockup |

::: warning

The `timelock` returned by this endpoint is a suggested value that should be
safely above the highest swap timeout. Always use this value or higher to ensure
your commitment has a longer timeout than the swap you create for it.

:::

### Submit Commitment

After locking funds and creating a swap, submit the commitment signature:

```
POST /v2/commitment/{currency}
```

**Request Body:**

```json
{
  "swapId": "abc123",
  "signature": "0x...",
  "transactionHash": "0x...",
  "logIndex": 0
}
```

| Field             | Required | Description                                            |
| ----------------- | -------- | ------------------------------------------------------ |
| `swapId`          | Yes      | ID of the swap this commitment is for                  |
| `signature`       | Yes      | EIP-712 commitment signature (hex encoded)             |
| `transactionHash` | Yes      | Transaction hash containing the lockup                 |
| `logIndex`        | No       | Log index if multiple lockups exist in the transaction |

**Response:** `201 Created` with empty object `{}`

## Integration Guide

### Submarine Swaps (Chain → Lightning)

For Submarine Swaps where you send EVM assets to receive Lightning:

1. **Create the swap** via `POST /v2/swap/submarine` as usual

2. **Get commitment lockup details**:

   ```
   GET /v2/commitment/{currency}/details
   ```

3. **Lock funds** by calling the contract's `lock` function:

   **For EtherSwap (native currency like RBTC):**
   - `preimageHash`: `bytes32(0)` (32 zero bytes)
   - `claimAddress`: The `claimAddress` from step 2
   - `timelock`: The `timelock` from step 2 (or higher)
   - `value`: Any amount you want to swap (sent as transaction value)

   **For ERC20Swap (tokens):**
   - `preimageHash`: `bytes32(0)` (32 zero bytes)
   - `amount`: Any amount you want to swap (in smallest token units)
   - `tokenAddress`: Address of the token contract
   - `claimAddress`: The `claimAddress` from step 2
   - `timelock`: The `timelock` from step 2 (or higher)

   Note: For ERC20 tokens, you must first approve the swap contract to spend
   your tokens.

4. **Create the commitment signature** using EIP-712 with the actual locked
   amount

5. **Submit the commitment**:

   ```
   POST /v2/commitment/{currency}
   {
     "swapId": "...",
     "signature": "0x...",
     "transactionHash": "0x...",
     "logIndex": 0
   }
   ```

6. The swap proceeds as normal once the commitment is accepted

### Chain Swaps (Chain → Chain)

For Chain Swaps where you send EVM assets to receive assets on another chain:

The flow is identical to Submarine Swaps above. Create the Chain Swap first,
then follow steps 2-6 to lock with a commitment instead of the actual preimage
hash.

## Refunding Commitment Swaps

Refunds work the same as standard EVM swaps:

- **After timelock expires**: Call `refund` with the lockup parameters
- **Cooperative refund**: Request an EIP-712 refund signature from Boltz via
  `GET /v2/swap/submarine/{id}/refund` and use `refundCooperative`
