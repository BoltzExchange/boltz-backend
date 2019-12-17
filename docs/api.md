# REST API Documentation

## Introduction

Boltz exposes a Restful HTTP API that can not only be used to query information about the Boltz instance and the pairs it supports but also to create swaps and interact with the blockchains that are configured on that specific instance. This page lists all of the available endpoints and shows how to use them correctly.

### Response and request encoding

All of the responses to all calls are encoded as JSON objects. If endpoints require the client to provide any kind of arguments these also have to be encoded as JSON and sent in the body of a POST request.

Please make sure to set the `Content-Type` header of your `POST` requests to `application/json` if you are sending JSON encoded data in the body of the request.

### Error handling

If a call fails for some reason the returned [HTTP status code](https://en.wikipedia.org/wiki/List_of_HTTP_status_codes) will indicate that and an object will be returned that looks like this and gives the reason for which the call errored:

```json
{
  "error": "some message explaining why the call failed"
}
```

## Getting version

To get the version of the deployed Boltz backed instance one has to query this API endpoint.

| URL            | Response
|----------------|------------
| `GET /version` | JSON object

Status Codes:

- `200 OK`

Response object:

- `version`: the deployed version of the Boltz backend

**Examples:**

`GET /version`

```json
{
  "version": "2.1.0-beta-d3ddba0-dirty"
}
```

## Getting pairs

To work with the instance one first has to know what pairs are supported and what kind of rates, limits and fees can be expected when creating a new swap. To get that kind of information the following call is used.

| URL             | Response
|-----------------|------------
| `GET /getpairs` | JSON object

Status Codes:

- `200 OK`

Response object:

- `warnings`: an array of strings that can indicate that some feature of Boltz might me disabled or restricted. Currently there is only a single warning that could be in that array:
    - `reverse.swaps.disabled`: means that all reverse swaps (from Lightning to the chain) are disabled
- `pairs`: an object containing of the supported pairs of that particular Bolt instance. The keys of the values are the id's of the pairs and the values itself contain information about the trading pair:
    - `rate`: the exchange rate of the pair
    - `limits`: a JSON object containing the minimal and maximal amount that a swap of that pair is allowed to have. The numbers are denominated in the *quote currency* and in *satoshis for BTC and litoshis for LTC* (10^-8)
        - `maximalZeroConf`: the maximal amounts that will be accepted as 0-confirmation by Boltz
    - `fees`: is a JSON object that has two different kinds of fees:
        - `percentage`: the configured percentage fee that is charged by Boltz
        - `minerFees`: are the miner fees that can be expected when locking up or claiming funds. These values are denominated in `sat/vbyte` and just estimations that are not actually enforced

**Examples:**

`GET /getpairs`

Response:

```json
{
  "warnings": [],
  "pairs": {
    "LTC/BTC": {
      "rate": 0.00715,
      "limits": {
        "maximal": 715000000,
        "minimal": 1000,
        "maximalZeroConf": {
          "baseAsset": 1000000000,
          "quoteAsset": 1000000
        }
      },
      "fees": {
        "percentage": 5,
        "minerFees": {
          "baseAsset": {
            "normal": 340,
            "reverse": {
              "lockup": 306,
              "claim": 276
            }
          },
          "quoteAsset": {
            "normal": 3400,
            "reverse": {
              "lockup": 3060,
              "claim": 2760
            }
          }
        }
      }
    }
  }
}
```

## Getting fee estimations

Boltz provides an API endpoint that returns fee estimations for all chains that are configured on that instance. These fee estimations are *not* enforced by Boltz and are just a recommendation. It is important to mention that if 0-conf wants to be used with normal swaps, the lockup transaction has to have at least 80% of the recommended `sat/vbyte` value. One can read more about the what and why in the [0-confirmation docs](0-confirmation.md).

| URL                     | Response
|-------------------------|------------
| `GET /getfeeestimation` | JSON object

Status Codes:

- `200 OK`

Response object:

This endpoint returns a JSON object of which each `key` is the symbol of a chain and each `value` the estimated fee for that chain denominated in `sat/vbyte`.

**Examples:**

`GET /getfeeestimation`

Response:

```json
{
  "BTC": 34,
  "LTC": 2
}
```

## Querying transactions

The Boltz API also allows for querying raw transactions for all configured chains. Irrespective of whether the transactions are still in the mempool or already included in a block; Boltz should find them either way. But it should be noted that unlike SPV and Neutrino servers, Boltz doesn't provide any kind of proof that the transaction was included in a block.

Requests querying for transactions have to be `POST` and contain two arguments in its JSON encoded body:

- `currency`: which chain should be queried for the transaction
- `transactionId`: the id of the transaction that should be queried

| URL                    | Response
|------------------------|------------
| `POST /gettransaction` | JSON object

Status Codes:

- `200 OK`
- `400 Bad Request`: if an argument wasn't provided or the transaction can't be found

Response object:

- `transactionHex`: the requested transaction encoded in hex

**Examples:**

`POST /gettransaction`

Request body:

```json
{
  "currency": "BTC",
  "transactionId": "52ff6682b0bff109e6c6d97de6b6d075f7241c9ac364e02de6315281e423d816"
}
```

Response:

```json
{
  "transactionHex": "02000000000101f7ddc247aad2c1e91b2495cf6814aa183b46785cf21f44f43a3c3419c09d377201000000171600142a805e4cfaa6fb79360917a5b0b9c5fcb0dfe6e9ffffffff02938601000000000017a9141137c50104d0814e8663ded75b43ddaa7b9d192b87e8cc96000000000017a9148f6df517d00e650d8c5e6bfa0986b775b256609e870247304402202e8a8572ce3cb232a7b48483bdc280feba7f9cf8c163ac2df091e54dfcf90bb6022042ba2b3e4d89220b3b39b52a444dff2010b22144099aaa348d83301f2ae456be01210341720559e7375a409b03e814415a6c15fc142c5a9e78a83831ff6fe4706d352900000000"
}
```

## Broadcasting transactions

This endpoint is really similar to the one for querying transactions. But instead of getting existing transactions this one will broadcast new ones to the network. Also it returns the id of the broacasted transaction.

Requests broadcasting transactions have to be `POST` and contain two arguments in its JSON encoded body:

- `currency`: to which network the transaction should be broadcasted
- `transactionHex`: the HEX encoded transaction itself

| URL                          | Response
|------------------------------|------------
| `POST /broadcasttransaction` | JSON object

Status Codes:

- `200 OK`
- `400 Bad Request`: if an argument wasn't provided or the node that should broadcast the transaction returns an error

Response object:

- `transactionId`: the id of the transaction that was broadcasted

**Examples:**

`POST /broadcasttransaction`

Request body:

```json
{
  "currency": "BTC",
  "transactionHex": "02000000000101f7ddc247aad2c1e91b2495cf6814aa183b46785cf21f44f43a3c3419c09d377201000000171600142a805e4cfaa6fb79360917a5b0b9c5fcb0dfe6e9ffffffff02938601000000000017a9141137c50104d0814e8663ded75b43ddaa7b9d192b87e8cc96000000000017a9148f6df517d00e650d8c5e6bfa0986b775b256609e870247304402202e8a8572ce3cb232a7b48483bdc280feba7f9cf8c163ac2df091e54dfcf90bb6022042ba2b3e4d89220b3b39b52a444dff2010b22144099aaa348d83301f2ae456be01210341720559e7375a409b03e814415a6c15fc142c5a9e78a83831ff6fe4706d352900000000"
}
```

Response:

```json
{
  "transactionId": "52ff6682b0bff109e6c6d97de6b6d075f7241c9ac364e02de6315281e423d816"
}
```

## Getting status of a swap

**Before being able to handle the status events of this method it is recommended to read: [Swap lifecycle](lifecycle.md)**

To query the status of a swap one can use this endpoint which returns a JSON object containing the status of the swap. All of the possible status events are documented [here](lifecycle.md).

Requests querying the status of a swap have to be `POST` and contain a single value in its JSON encoded body:

- `id`: the id of the swap of which the status should be queried

| URL                | Response
|--------------------|------------
| `POST /swapstatus` | JSON object

Status Codes:

- `200 OK`
- `404 Not Found`: if the swap with the provided id couldn't be found
- `400 Bad Request`: if the `id` argument wasn't provided

Response object:

- `status`: status of the swap
- `preimage`: if the `status` is `invoice.settled`, the JSON object will also contain this value so that the client interacting with the Boltz API doesn't necessarily have to be connected to the lightning node that paid the invoice. This, of course, requires that the Boltz instance is honest and trustworthy.

**Examples:**

`POST /swapstatus`

Request body:

```json
{
  "id": "Asnj2Y"
}
```

Response:

```json
{
  "status": "invoice.paid"
}
```

If the status is `invoice.settled` there will be another string in the body of the HTTP response. `preimage` is the hex encoded preimage of the invoice that was paid by the user. This is helpful in the case of the client not being able to query the lightning node for the preimage directly.

`POST /swapstatus`

Request body:

```json
{
  "id": "ryUK9G"
}
```

Response:

```json
{
  "status": "invoice.settled",
  "preimage": "aab7a9ee7ebadadc3e052d7aa0aff0651dec24d8b72d1c0f6d01fa3fd5a3a5c6"
}
```

## Streaming status updates of a swap

To not having to query the [`/swapstatus`](#getting-status-of-a-swap) endpoint regularly in order to always have the lastet swap status there is a seperate endpoint for streaming swap status updates via [Server-Side events](https://www.w3schools.com/html/html5_serversentevents.asp).

Requests to this enpoint have to provide the required `id` parameter via an URL parameter because all requests have to be of the method `GET`.

Every event in the Server-Side stream has data that is encoded exactly like the JSON object of the [`/swapstatus`](#getting-status-of-a-swap) endpoint. Please have a look at the examples below for a reference implementation in JavaScript of hanlding the stream.

| URL                     | Response
|-------------------------|-------------------------
| `GET /streamswapstatus` | Server-Side event stream

**Examples:**

Server-Side event streams have to be handled differently than normal HTTP reponses. Below is a sample implementation in JavaScript and also what a raw response of a Server-Side event stream looks like.

Sample implementation in JavaScript:

```javascript
var stream = new EventSource(boltzApi + '/streamswapstatus?id=' + swapId);

source.onmessage = function(event) {
  const data = JSON.parse(event.data);

  console.log('Swap status update:' + data.status);
};
```

Raw response:

```json
data: {"status":"transaction.mempool"}

data: {"status":"invoice.paid"}
```

## Creating Swaps

To create a swap from onchain coins to lightning ones just a single request has to be sent. This `POST` request has to have the following values in its JSON encoded body:

- `type`: type of the swap to create; always `submarine` for normal swaps
- `pairId`: the pair on which the swap should be created
- `orderSide`: either `buy` or `sell` depending on what the user wants
- `invoice`: the invoice of the user that should be paid
- `refundPublicKey`: public key of a keypair that will allow the user to refund the locked up coins once the time lock is expired

| URL                | Response
|--------------------|------------
| `POST /createswap` | JSON object

Status Codes:

- `200 OK`
- `400 Bad Request`: if the swap could not be created. Check the `error` string in the JSON object of the body of the response for more information

Response object:

- `id`: id of the freshly created swap
- `acceptZeroConf`: whether Boltz will accept 0-conf for this swap
- `redeemScript`: redeem script from which the `address` is derived. The redeem script can and should be used to verify that the Boltz instance didn't try to cheat by providing an address without a HTLC
- `address`: address in which the coins will be locked up. Currently this is a P2SHP2WSH (P2WSH nested in a P2SH) for the sake of compatibility
- `expectedAmount`: the amount of satohis or litoshis that is expected to be sent to the `address`
- `timeoutBlockHeight`: block height at which the swap will be cancelled
- `bip21`: a [BIP21 ayment request](https://github.com/bitcoin/bips/blob/master/bip-0021.mediawiki) for the `expectedAmount` of coins and the `address`

**Examples:**

`POST /createswap`

Request body:

```json
{
  "type": "submarine",
  "pairId": "LTC/BTC",
  "orderSide": "sell",
  "refundPublicKey": "a9142f7150b969c9c9fb9094a187f8fb41d617a65e20876300670171b1752102e317e5607e757e9c4448fe458876d7e361222d2cbee33ece9e3a7b2e2359be4d68ac",
  "invoice": "lnbcrt100u1pw54eudpp5e42ls0apxfm2790aesc92v5kppkr5dluvv0545v6zr593498s8zsdqqcqzpgpyaz550xmqkr6v5x8cn3qxyxmuxp7xa28xlr7qhkxlde3xm8xjyyqqurx5nq8tdeejvm4jnuw468lxjtnfj8v49hsg8tkhjz9haj65sps8xdv0"
}
```

Response:

```json
{
  "id": "SWxaMe",
  "acceptZeroConf": true,
  "expectedAmount": 1359564,
  "timeoutBlockHeight": 120,
  "address": "QNaGS7WM31xANXQCbmrhXfnxUjxiGFpFwM",
  "bip21": "litecoin:QNaGS7WM31xANXQCbmrhXfnxUjxiGFpFwM?amount=0.01359564&label=Submarine%20Swap%20to%20BTC",
  "redeemScript": "a9140b8d541b172265d880331130438e69661cc5303487632102ea2e82321fd8cfa4efc3615fe3cb2675d75f0964d033d2853c37fbd99ced363d670178b17542a9142f7150b969c9c9fb9094a187f8fb41d617a65e20876300670171b1752102e317e5607e757e9c4448fe458876d7e361222d2cbee33ece9e3a7b2e2359be4d68ac68ac"
}
```

## Creating Reverse Swaps

Creating reverse swaps (lightning to onchain coins) is pretty similar to creating normal ones. The JSON encoded body of the `POST` request has to contain:

- `type`: type of the swap to create; always `reversesubmarine` for reverse swaps
- `pairId`: the pair on which the swap should be created
- `orderSide`: either `buy` or `sell` depending on what the user wants
- `invoiceAmount`: amount of the invoice that will be generate by Boltz
- `preimageHash`: the SHA256 hash of a preimage that was generate locally by the client. The size of that preimage has to be 32 bytes or none of locked the coins can get claimed
- `claimPublicKey`: public key of a keypair that will allow the user to claim the locked up coins with the preimage

| URL                | Response
|--------------------|------------
| `POST /createswap` | JSON object

Status Codes:

- `200 OK`
- `400 Bad Request`: if the swap could not be created. Check the `error` string in the JSON object of the body of the response for more information

Response object:

- `id`: id of the freshly created swap
- `redeemScript`: redeem script from which the lockup address was derived. The redeem script can and should be used to verify that the Boltz instance didn't try to cheat by creating an address without a HTLC
- `lockupTransaction`: hex transaction in which the coins were locked up
- `lockupTransactionId`: id of the `lockupTransaction`
- `invoice`: invoice that is expected to be paid by the user in order to get the preimage to claim the coins that were locked up in `lockupTransaction`
- `timeoutBlockHeight`: block height at which the swap will be cancelled
- `onchainAmount`: amount of satohis or litoshis that were locked up onchain in the `lockupTransaction`

**Examples:**

`POST /createswap`

Request body:

```json
{
  "type": "reversesubmarine",
  "pairId": "LTC/BTC",
  "orderSide": "buy",
  "invoiceAmount": 1000000,
  "preimageHash": "51a05b15e66ecd12bf6b1b62a678e63add0185bc5f41d2cd013611f7a4b6704f",
  "claimPublicKey": "a9142f7150b969c9c9fb9094a187f8fb41d617a65e20876300670171b1752102e317e5607e757e9c4448fe458876d7e361222d2cbee33ece9e3a7b2e2359be4d68ac"
}
```

Response:

```json
{
  "id": "AgRip5",
  "invoice": "lnbcrt1m1pwcuv4hpp5d5ydjvllqn9l9lxqxkjrmead28p4h8c7mhykygwcw39cfkn4y9hqdql2fjhvetjwdjjq5mhv9czqar0ypp9gsccqzpggtrxt78s655f4cfysav46rpv20u320ctswy5gx04xqvq3qjqn8a9vvkhgzeyjzs2dx9g90ge7jr9u8n42n8htf09spkudks8skds67cqklcf7k",
  "redeemScript": "a914382c733f81adfd13010d2dd72da83d019cf4f13787632103e25b3f3bb7f9978410d52b4c763e3c8fe6d43cf462e91138c5b0f61b92c93d70670178b17521036721e5267bb2c4741fa1da1835dbe579ad296395c13ff954bfdbf17474d2a2ab68ac",
  "onchainAmount": 99194,
  "timeoutBlockHeight": 120,
  "lockupAddress": "bcrt1qxelh2k86skcncmzmm6059az0n0h02d7pvhylgvdevh59u0t8rl5qycus9p"
}
```
