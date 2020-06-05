# Scripting

Boltz theoretically supports three types of outputs and addresses:

- P2SH
- P2SH nested P2WSH
- P2WSH

Our instances are using *P2SH nested P2WSH* addresses for Submarine Swaps and *P2WSH* addresses for Reverse ones. The address type for Submarine Swaps is [configurable](deployment.md) and can be either *P2WSH* or *P2SH nested P2WSH*.

## Address Generation

The Boltz API returns a redeem script and an address for locking up coins. After verifying that the redeem script is valid (checking preimage hash, public key, timeout block height of the HTLC and OP codes), the correctness of the address should be double-checked.

A list of all OP codes and their meanings can be found on the [Bitcoin Wiki](https://en.bitcoin.it/wiki/Script).

### P2SH

To generate a P2SH address you have to hash the redeem script first with SHA256 and then with RIPEMD-160. The output script for P2SH address looks like this:

```
OP_HASH160
<hash of the redeem script>
OP_EQUAL
```

### P2WSH

In P2WSH addresses the reedem script is only hashed with SHA256. The output script is also a little simpler:

```
OP_0
<hash of the redeem script>
```

### P2SH nested P2WSH

Although the output script of the P2SH nested P2WSH addresses is the same as the one of plain P2SH addresses, other data is hashed. Here not the plain redeem script is hashed, but a P2WSH output script is constructed and hashed first with SHA256 and then with RIPEMD-160 as if it was the redeem script. The output script will look like this:

```
OP_HASH160
<hash of the P2WSH output script>
OP_EQUAL
```

### Examples

Examples for generating all of these addresses with Node.js can be found in the [`boltz-core` repository](https://github.com/BoltzExchange/boltz-core/blob/master/lib/swap/Scripts.ts).

## Claim transactions

Claiming works a little different for every output type, but you always need the preimage, private key and original redeem script, and the signature script or witness script of the input looks like this in all cases:

```
<signature>
<preimage>
<redeem script>
```

### P2SH

Spending a P2SH output is relatively simple. The signature, preimage and original redeem script have to be added to the signature script of the input that spends the HTLC UTXO.

### P2WSH

Spending a P2WSH output is similar to the P2SH ones. But here those values are added to the witness of the input instead of the signature script.

### P2SH nested P2WSH

When spending a P2SH nested P2WSH output the signature, preimage and original reedem script are added to the witness of the input as if the output was a P2WSH one, but you also have to add the OP code `OP_0` and the SHA256 hash of the redeem script to the signature script of the input. 

### Examples

Examples for all three output types can be found in the [`boltz-core` repository](https://github.com/BoltzExchange/boltz-core/blob/master/lib/swap/Claim.ts#L23).

## Refund transactions

Refunding an output works just like claiming. Since the refunder doesn't know the preimage (or knows it but can't use it since that would require the claim keys) any value apart from the actual preimage can be used but there has to be a value to prevent the signature from being hashed and compared to the preimage hash. To save transaction fees, a 0 value should be used.

There is one more difference when compared to claim transactions: the `nLockTime` of the transaction has to be set to a value equal to or greater than the timeout block height of the HTLC. Else the bitcoin network will not accept your transaction.

### Examples

An example for this can be found in the [`boltz-core` repository](https://github.com/BoltzExchange/boltz-core/blob/master/lib/swap/Refund.ts#L20). The linked function uses the claim function from above but requires the timeout block height as argument and sets an empty preimage.
