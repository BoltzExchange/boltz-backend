---
description: >-
  This document gives an overview of how Boltz API clients craft claim & refund
  transactions and touches on emergency procedures for rescuing funds of failed
  swaps.
---

# 🙋 Claim & Refund Transactions

Boltz API clients need to craft and broadcast in order to:

- **claim transactions** to claim chain bitcoin and successfully complete **Reverse Submarine Swaps**
- **refund transactions** to refund chain bitcoin to get back coins locked for failed **Submarine Swaps**

## Taproot

> In case you are not familiar with Taproot yet, or want to refresh your memory, we recommend watching the [Taproot workshop of Bitcoin Optech](https://bitcoinops.org/en/schorr-taproot-workshop/)

All Taproot swaps are using tweaked public keys aggregated with [Musig2](https://github.com/bitcoin/bips/blob/master/bip-0327.mediawiki).
When a swap is created, the client provides its public key in the request and Boltz returns one in the response.
Those two public keys are aggregated and the ***Boltz public key always comes first***.
That aggregated public key is tweaked by the tagged hash of the Taptree of the scripts of the swap.
The result is the public key used in the [P2TR address](https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki) of the swap.

```
OP_1
<tweaked aggregated public key>
```

Key path spends should always be preferred over using a script path spends.
Not only, to save on miner fees but also, because key path spends are better for privacy.
Partial signatures from Boltz are always using `SIGHASH_DEFAULT`.

Examples for constructing Taproot swap transactions can be found in [boltz-core](https://github.com/BoltzExchange/boltz-core/blob/v2.1.0/lib/swap/Claim.ts#L124).

### Submarine Swaps

#### Claim

To allow Boltz to claim Submarine Swaps cooperative, `GET /swap/submarine/{id}/claim` to obtain the necessary information to create a partial signature.
Give Boltz your partial signature with `POST /swap/submarine/{id}/claim` and it will broadcast the key path spend claim transaction.

In case the client does not cooperate, Boltz will eventually broadcast a script path claim transaction to sweep the UTXO.

#### Refund

In case the swap failed (e.g. status `invoice.failedToPay` or `transaction.lockupFailed`) a key path refund can be done.
Get a partial signature from Boltz with `POST /swap/submarine/{id}/refund`, aggregate the partials and broadcast the transaction.
This can be done *before* time lock of the swap has expired.

Script path refunds are also possible after the time lock did expire.
Set the locktime of the transaction to >= the time lock of the swap and make sure to not use the max sequence in the inputs.
Structure the input witness like this:

```
<signature>
<refund script>
<control block>
```

### Reverse Swaps

Using the endpoint `POST /swap/reverse/{id}/claim`, Boltz gives you the values required to create an aggregated signature and broadcast a key path spend.

In case Boltz is not cooperating, a script path spend can be done via witness structured like this:

```
<signature>
<preimage>
<claim script>
<control block>
```

## EVM

On EVM chains, a deployed contract is used for enforcing swaps onchain.
The code of our contracts can be found in [boltz-core](https://github.com/BoltzExchange/boltz-core/tree/v2.1.0/contracts).
To fetch the addresses of the swap contracts Boltz is using `GET /chain/contracts`.

### Submarine Swaps

The `lock` function of the swap contract is used to lockup coins for a Submarine Swap.
All the parameter values are returned in the response when creating the swap.

With the `refund` function of the contract, locked coins can be refunded in case the swap failed.
This function takes almost the same parameters as `lock`, so the data from the response of the swap creation should be stored after locking coins in case they are needed again for a refund.
In case that information is not available, all parameters required for a refund can be queried from the `Lockup` event logs of the contract.
Those event logs are indexed by `refundAddress` which is the address with which the client locked the coins.

To refund before the time lock of the swap expired, an EIP-712 signature can be requested from Boltz.
`GET /swap/submarine/{id}/refund` to obtain that signature and use it in the `refundCooperative` function of the contract.
Similarly to cooperative Taproot refunds, Boltz will only return such a signature in case the swap has failed already.

### Reverse Swaps

To claim coins locked in the contract, use the function `claim`.
All parameters apart from the `preimage` are returned in the response when creating the swap.
The client needs to make sure to securely store the preimage after creating the swap to make sure that claiming the coins locked for it is possible.

## Legacy

Boltz supports two non-Taproot output types:

* [P2SH nested P2WSH](https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki#user-content-P2WSH\_nested\_in\_BIP16\_P2SH) for Normal Submarine Swaps
* [P2WSH](https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki#user-content-P2WSH) for Reverse Submarine Swaps

Claiming works a little different for every output type, but you always need the preimage, private key and original redeem script. Hence, Boltz API clients need to ensure a safe way to store these values until the swap reaches a [final state](lifecycle.md). The witness script of the input always looks like this:

```
<signature>
<preimage>
<redeem script>
```

#### P2SH nested P2WSH

When spending a P2SH nested P2WSH output, the signature, preimage and original redeem script are added to the witness of the input and one adds the Opcode `OP_0` and the SHA256 hash of the redeem script to the signature script of the input.

#### P2WSH

To spend a P2WSH output, signature, preimage and original redeem script have to be added to the _witness_ of the input.

#### Examples

Examples for all output types can be found in the [`boltz-core`](https://github.com/BoltzExchange/boltz-core/blob/v2.0.1/lib/swap/Claim.ts#L83) reference library.

### Normal Swaps: Refund transactions

Similar to claim transactions, Boltz API clients need to be able to craft and broadcast **refund transactions** for failed **Normal Submarine Swaps**. This section provides an overview of what refunds are, how they work and touches on the low-level scripting for your Boltz API client to successfully submit a refund.

> The concept of refunds currently only exists for failed Normal Submarine Swaps. In case of a failed Reverse Submarine Swaps, Lightning funds automatically bounce back to the user, no active refunding is needed.

Refunding an output works just like claiming. Since the refund process doesn't need the preimage (or knows it but can't use it since that would require the claim keys) any value apart from the actual preimage can be used but there has to be a value to prevent the signature from being hashed and compared to the preimage hash. To save on transaction fees, we recommend using a 0 value.

There is one more difference when compared to claim transactions: the `nLockTime` of the transaction has to be set to a value equal to or greater than the timeout block height in the redeem script. Otherwise, the Bitcoin network will not accept your transaction.

#### Examples

An example can be found in the [`boltz-core`](https://github.com/BoltzExchange/boltz-core/blob/v2.0.1/lib/swap/Refund.ts) reference library. The function uses the claim function but requires the timeout block height as argument and sets an empty preimage.

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
