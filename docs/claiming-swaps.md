---
description: >-
  This document gives an overview of how Boltz API clients craft claim & refund
  transactions and touches on emergency procedures for rescuing funds of failed
  swaps.
---

# 🙋♂ Claim & Refund Transactions

## Reverse Swaps: Claim Transactions

Boltz API clients need to craft and broadcast **claim transactions** in order to claim chain bitcoin and successfully complete **Reverse Submarine Swaps**.

### UTXO Chains

Boltz currently supports two types of outputs:

* [P2SH nested P2WSH](https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki#user-content-P2WSH\_nested\_in\_BIP16\_P2SH) for Normal Submarine Swaps
* [P2WSH](https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki#user-content-P2WSH) for Reverse Submarine Swaps

Claiming works a little different for every output type, but you always need the preimage, private key and original redeem script. Hence, Boltz API clients need to ensure a safe way to store these values until the swap reaches a [final state](lifecycle.md). The witness script of the input always looks like this:

```
<signature>
<preimage>
<redeem script>
```

#### P2SH nested P2WSH

When spending a P2SH nested P2WSH output, the signature, preimage and original reedem script are added to the witness of the input and one adds the OP code `OP_0` and the SHA256 hash of the redeem script to the signature script of the input.

#### P2WSH

To spend a P2WSH output, signature, preimage and original redeem script have to be added to the _witness_ of the input.

#### Examples

Examples for all output types can be found in the [`boltz-core`](https://github.com/BoltzExchange/boltz-core/blob/master/lib/swap/Claim.ts#L23) reference library.

### EVM Chains

The HTLCs that Boltz uses on EVM chains are not single use scripts, but contracts. The source of the contracts can be found [`here`](https://github.com/BoltzExchange/boltz-core/tree/master/contracts).

## Normal Swaps: Refund transactions

Similar to claim transactions, Boltz API clients need to be able to craft and broadcast **refund transactions** for failed **Normal Submarine Swaps**. This section provides an overview of what refunds are, how they work and touches on the low-level scripting for your Boltz API client to successfully submit a refund.

> The concept of refunds currently only exists for failed Normal Submarine Swaps. In case of a failed Reverse Submarine Swaps, Lightning funds automatically bounce back to the user, no active refunding is needed.

### UTXO Chains

Refunding an output works just like claiming. Since the refund process doesn't know the preimage (or knows it but can't use it since that would require the claim keys) any value apart from the actual preimage can be used but there has to be a value to prevent the signature from being hashed and compared to the preimage hash. To save on transaction fees, we recommend using a 0 value.

There is one more difference when compared to claim transactions: the `nLockTime` of the transaction has to be set to a value equal to or greater than the timeout block height of the HTLC. Otherwise, the Bitcoin network will not accept your transaction.

#### Examples

An example can be found in the [`boltz-core`](https://github.com/BoltzExchange/boltz-core/blob/master/lib/swap/Refund.ts) reference library. The function uses the claim function but requires the timeout block height as argument and sets an empty preimage.

### EVM Chains

The HTLCs that Boltz uses on EVM chains are not single use scripts, but contracts. In order to submit a refund, one calls the `refund` function of the contract. Similar to UTXO chains, Boltz API clients need to ensure a safe way to store the required values until the swap reaches a [final state](lifecycle.md). The source of the contracts can be found [`here`](https://github.com/BoltzExchange/boltz-core/tree/master/contracts).

### Emergency Procedures

#### UTXO Chains

For UTXO chains we recommend providing a so-called **refund file** as a last layer of defense against loss of funds to end users. This refund file contains all necessary information to successfully craft a refund transaction in case refund info stored by the API client is lost.

All clients that offer the option for users to save refund files should format them in a standardized way. This is necessary for refunds to not only work in a client, but also but also with [Boltz](https://boltz.exchange/refund) directly.

The refund files Boltz Web App generates are `JSON` on Desktop and `PNG` QR codes on mobile (because iOS browsers don't allow any other files than images to be downloaded). Boltz parses files with other extension than `.json` and `.png` and treats them as raw `JSON`.

The data that should be in the file or encoded in the QR code is a `JSON` object with the following values:

* `id`: the ID of the swap
* `currency`: symbol of the chain on which bitcoin were locked up
* `redeemScript`: the redeem script of the lockup address
* `privateKey`: the private key of the refund key pair
* `timeoutBlockHeight`: block height at which the swap times out

The values of `id`, `redeemScript` and `timeoutBlockHeight` are returned by the Boltz API when the Swap is created. `currency` and `privateKey` are known by the client already.

Example:

```json
{
  "id": "qZf1Zb",
  "currency": "BTC",
  "redeemScript": "a9146a24b142de20b50871a247c1c66a6e41ee199017876321038ce1d1be5a22b396ccafc109c86717bc081301fe58d1958546d5aba647047af3670381a81ab1752102d23a7d39395f40a71a490cf79e0f2df5da2fb006fdab660bc0c78ef0c9ba457668ac",
  "privateKey": "1736eb52267524619289a5c9b58dab9339b2bb389764ad5c5be8955d9aadeeab",
  "timeoutBlockHeight": 1747073
}
```

If a user lost all refund information, but still has access to the lightning invoice and can extract the preimage, this can be used to claim the locked bitcoin back to a user-controlled address. Feel free to [contact us](https://discord.gg/QBvZGcW) should you be in such a situation. We are happy to help!

#### EVM Chains

If refund information is lost involving an EVM Chain, one can retrieve the required values to call `refund` via contract call logs.
