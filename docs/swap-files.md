---
description: >-
  Rescue files are files users download that let them reclaim funds of a failed
  swap. They exist as a 2nd layer of defense against loss of funds, in case the
  swap info stored by the client is lost.
---

# 📩 Rescue Files

All applications that save rescue files for Swaps should format them in a standardized way. This is especially important for Normal Submarine Swaps so that they can be refunded not only in the application but also with the [official Boltz Web App](https://boltz.exchange/).

## Rescue Files

The rescue files Boltz Web App generates are `JSON` on Desktop and `PNG` QR codes on mobile because iOS browsers don't allow any other files than images to be downloaded to the device. Boltz parses files with any other extension and treats them as raw `JSON`.

The data that should be in the file or encoded in the QR code is a `JSON` object with the following values:

* `id`: the ID of the swap
* `currency`: symbol of the chain on which bitcoin were locked up
* `redeemScript`: the redeem script of the lockup address
* `privateKey`: the private key of the refund key pair
* `timeoutBlockHeight`: block height at which the swap times out

The values of `id`, `redeemScript` and `timeoutBlockHeight` are returned by the Boltz API when the Swap is created. `currency` and `privateKey` are known by the application already.

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
