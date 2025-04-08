---
description: >-
  This document gives an overview of how Boltz API clients craft claim and
  refund transactions and touches on emergency procedures for rescuing funds of
  failed swaps.
---

# 🙋‍♂️ Claim & Refund Transactions

Boltz API clients need to craft and broadcast

* **claim transactions** for **Reverse Submarine Swaps** and **Chain Swaps**.
* **refund transactions** to claim refunds for failed **Normal Submarine Swaps** and **Chain Swaps**.

## Taproot

{% hint style="info" %}
If you are not familiar with Taproot yet, or want to refresh your memory, we recommend watching the [Taproot workshop of Bitcoin Optech](https://bitcoinops.org/en/schorr-taproot-workshop/).
{% endhint %}

Boltz Taproot Swaps are using tweaked public keys aggregated with [Musig2](https://github.com/bitcoin/bips/blob/master/bip-0327.mediawiki). When a swap is created, the client provides its public key in the request and Boltz returns its public key in the response. These two public keys are aggregated with **Boltz's public key always coming first**. The aggregated public key is then tweaked with the tagged hash of the Taptree of the scripts of the swap. The result is the public key used in the [P2TR address](https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki) of the swap.

```
OP_1
<tweaked aggregated public key>
```

Key path spends should be preferred over script path spends. One reason is the smaller chain footprint and thus cheaper miner fees and another reason is because key path spends are better for privacy as they don't reveal anything about the atomic swap on the chain.

Examples for constructing Taproot Swap transactions can be found in [boltz-core](https://github.com/BoltzExchange/boltz-core/blob/v2.1.0/lib/swap/Claim.ts#L124).

{% hint style="info" %}
Partial signatures from Boltz use `SIGHASH_DEFAULT`.
{% endhint %}

### Submarine Swaps

#### Claim

In order for Boltz to claim Submarine Swaps cooperatively, use `GET /swap/submarine/{id}/claim` to obtain the necessary information to create a partial signature. Provide your partial signature to Boltz with `POST /swap/submarine/{id}/claim` and Boltz will broadcast the key path spend claim transaction.

In case the client does not cooperate, Boltz will eventually broadcast a script path claim transaction to sweep the UTXO.

#### Refund

If a Submarine Swap failed (e.g. status `invoice.failedToPay` or `transaction.lockupFailed`), a key path refund can be done. Get a partial signature from Boltz with `POST /swap/submarine/{id}/refund`, aggregate the partials and broadcast the transaction.

{% hint style="info" %}
Key path refunds can be done immediately after a swap failed, there is no need to wait until the time lock expires.
{% endhint %}

Script path refunds are also possible after the time lock expired. Set the locktime of the transaction to >= the time lock of the swap and make sure to not use the max sequence in the inputs. Structure the input witness like this:

```
<signature>
<refund script>
<control block>
```

### Reverse Swaps

Calling `POST /swap/reverse/{id}/claim` returns the values required to create an aggregated signature and broadcast a key path spend.

In case Boltz is not cooperating, a script path spend can be done via a witness structured like this:

```
<signature>
<preimage>
<claim script>
<control block>
```

### Chain Swaps

#### Claim

To create a cooperative claim transaction for a Chain Swap, the client has to call `GET /swap/chain/{id}/claim` to fetch the details of the claim transaction the server would like to do. After creating a partial signature for the transaction of the server and creating its own unsigned claim transaction, it calls `POST /swap/chain/{id}/claim`.

When the server is not cooperating, the script path spend is the same as for Reverse Swaps. The witness of the input will look like this:

```
<signature>
<preimage>
<claim script>
<control block>
```

#### Refund

Refunds of Chain Swaps can be done cooperatively by calling `POST /swap/chain/{id}/refund` with the refund transaction the client would like to do.

In case the server refuses to create a partial signature for the refund of the client, a script path spend can be done in the same way as for Submarine Swaps. After the time lock has expired the locked coins can be spent with a witness structured like this:

```
<signature>
<refund script>
<control block>
```

## EVM

On EVM chains, a contract is used for enforcing swaps onchain. The source code of Boltz's contracts can be found [here](https://github.com/BoltzExchange/boltz-core/tree/v2.1.3/contracts). To fetch the current addresses of Boltz's swap contracts, use [`GET /chain/contracts`](https://api.boltz.exchange/swagger#/Chain/get_chain_contracts).

### Submarine Swaps

The `lock` function of the swap contract is used to lock up coins for a Submarine Swap. All values for the parameters required to call the function of the contract are returned in the API response when creating the swap.

With the `refund` function of the contract, locked coins can be refunded in case the swap fails. This function takes similar parameters as `lock`, so the values from the response of the swap creation should be stored. If this information is not available, all parameters required for a refund can also be queried from the `Lockup` event logs of the contract. The event logs are indexed by `refundAddress`, which is the address with which the client locked the coins.

To refund before the time lock of the swap has expired, an EIP-712 signature can be requested from Boltz. Use [`GET /swap/submarine/{id}/refund`](https://api.boltz.exchange/swagger#/Submarine/get_swap_submarine__id__refund) to get this signature and use it in the `refundCooperative` function of the contract. Similarly to cooperative Taproot refunds, Boltz will only return such a signature if the swap has failed already.

### Reverse Swaps

To claim coins locked in the contract, use the function `claim`. All parameters apart from the `preimage` are returned in the response when creating the swap. The API client is responsible for securely storing the preimage after creating the swap.

## Legacy Swaps

Boltz supports two non-Taproot output types:

* [P2SH nested P2WSH](https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki#user-content-P2WSH_nested_in_BIP16_P2SH) for Normal Submarine Swaps
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

{% hint style="info" %}
The concept of refunds exists for failed Normal Submarine Swaps and Chain Swaps. For failed Reverse Submarine Swaps, Lightning funds automatically bounce back to the user once the payment expired; no active refunding is needed.
{% endhint %}

Refunding an output works just like claiming. Since the refund process doesn't need the preimage (or knows it but can't use it since that would require the claim keys) any value apart from the actual preimage can be used but there has to be a value to prevent the signature from being hashed and compared to the preimage hash. To save on transaction fees, we recommend using a 0 value.

There is one more difference when compared to claim transactions: the `nLockTime` of the transaction has to be set to a value equal to or greater than the timeout block height in the redeem script. Otherwise, the Bitcoin network will not accept your transaction.

#### Examples

An example can be found in the [`boltz-core`](https://github.com/BoltzExchange/boltz-core/blob/v2.0.1/lib/swap/Refund.ts) reference library. The function uses the claim function but requires the timeout block height as argument and sets an empty preimage.

## Emergency Procedures

### UTXO Chains

For UTXO chains we recommend providing a so-called **refund file** as a last layer of defense against loss of funds to end users. This refund file contains all necessary information to successfully craft a refund transaction in case refund info stored by the API client is lost.

All clients that offer the option for users to save refund files should format them in a standardized way. This is necessary for refunds to not only work in a client, but also with [Boltz](https://boltz.exchange/refund) directly.

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

If a user lost all refund information but still has access to the lightning invoice and can extract the preimage, this can be used to claim the locked bitcoin back to a user-controlled address. Feel free to [contact us](https://discord.gg/QBvZGcW) should you be in such a situation. We are happy to help!
