# Swap files

All applications that save files for Swaps to the disk should format them in a standardized way. This is especially important for Normal Submarine Swaps so that they can be refunded not only in the application but also in our Boltz frontend.

## Refund Files

The refund files our frontend generates are PNG QR codes because iOS browsers don't allow any other files than images to be downloaded to the device. This might not be applicable to you and therefore our frontend also parses files with any other extension and treats them as raw JSON.

The data that should be in the file or encoded in the QR code is a JSON object with the following values:
 
 - `id`: the ID of the swap
 - `currency`: symbol of the chain on which coins were locked up
 - `redeemScript`: the redeem script of the lockup address
 - `privateKey`: the private key of the refund key pair
 - `timeoutBlockHeight`: block height at which the Swaps times out
 
The values of `id`, `redeemScript` and `timeoutBlockHeight` are returned by the Boltz API when the Swap gets created. `currency` and `privateKey` are obviously known by the application anyways.
 
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
