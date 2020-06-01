# REST API Documentation

## Introduction

Boltz exposes a Restful HTTP API that cannot only be used to query information about the Boltz instance, and the pairs it supports but also to create swaps and interact with the blockchains that are configured on that specific instance. This page lists all the available endpoints and shows how to use them correctly.

### Response and request encoding

All the responses to all calls are encoded as JSON objects. If endpoints require the client to provide any kind of arguments these also have to be encoded as JSON and sent in the body of a POST request.

Please make sure to set the `Content-Type` header of your `POST` requests to `application/json` if you are sending JSON encoded data in the body of the request.

### Error handling

If a call fails for some reason the returned [HTTP status code](https://en.wikipedia.org/wiki/List_of_HTTP_status_codes) will indicate that, and an object will be returned that looks like this and gives the reason for which the call errored:

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

- `warnings`: an array of strings that can indicate that some feature of Boltz might me disabled or restricted. Currently, there is only a single warning that could be in that array:
    - `reverse.swaps.disabled`: means that all reverse swaps (from Lightning to the chain) are disabled
- `pairs`: an object containing of the supported pairs of that particular Bolt instance. The keys of the values are the id's of the pairs and the values itself contain information about the trading pair:
    - `rate`: the exchange rate of the pair
    - `limits`: a JSON object containing the minimal and maximal amount that a swap of that pair is allowed to have. The numbers are denominated in the *quote currency* and in *satoshis for BTC and litoshis for LTC* (10^-8)
        - `maximalZeroConf`: the maximal amounts that will be accepted as 0-confirmation by Boltz
    - `fees`: is a JSON object that has two different kinds of fees:
        - `percentage`: the configured percentage fee that is charged by Boltz
        - `minerFees`: are the miner fees that can be expected when locking up or claiming funds. These values are absolute and denominated in satoshis or litoshis and just estimations that are not actually enforced

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

## Getting Lightning nodes

This endpoint allows you to query the node public keys and URIs of the Lightning nodes run by Boltz.

| URL             | Response
|-----------------|------------
| `GET /getnodes` | JSON object

Status Codes:

- `200 OK`

Response object:

- `nodes`: a JSON with the symbol of the chain on which the Lightning node is running as key, and a JSON object as key
    - `nodeKey`: public key of the Lightning node
    - `uris`: array of the URIs to which the LND node listens

**Examples:**

`GET /getnodes`

Response:

```json
{
  "nodes": {
    "BTC": {
      "nodeKey": "03be597bb2c8e5ff2592b226f4433b557c34158a95699384fcadc7a2f153e7272b",
      "uris": [
        "03f060953bef5b777dc77e44afa3859d022fc1a77c55138deb232ad7255e869c00@35.237.24.136:9735",
        "03f060953bef5b777dc77e44afa3859d022fc1a77c55138deb232ad7255e869c00@idz7qlezif6hgmjkpmuelnsssyxea2lwan562a5gla7jmlxsl5cb2cad.onion:9735"
      ]    },
    "LTC": {
      "nodeKey": "0278d27617616c156c879dd51d61313795e3782abda2cd7a37d9d24ece6c309064",
      "uris": [
        "0278d27617616c156c879dd51d61313795e3782abda2cd7a37d9d24ece6c309064@35.237.24.136:10735",
        "03f060953bef5b777dc77e44afa3859d022fc1a77c55138deb232ad7255e869c00@idz7qlezif6hgmjkpmuelnsssyxea2lwan562a5gla7jmlxsl5cb2cad.onion:9735"
      ]
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

This endpoint returns a JSON object of which each key is the symbol of a chain and each value the estimated fee for that chain denominated in `sat/vbyte`.

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

## Querying Lockup Transactions

Requests querying the lockup transactions of Submarine Swaps have to be `POST` and contain one argument in its JSON encoded body:

- `id`: id of the Submarine Swap

| URL                        | Response
| ---------------------------|------------
| `POST /getswaptransaction` | JSON object

Status Codes:

- `200 OK`
- `400 Bad Request`: if an argument wasn't provided, or the Submarine Swap can't be found

Response object:

- `transactionHex`: the lockup transaction of the Submarine Swap encoded in hex
- `timeoutBlockHeight`: block height at which the HTLC in the lockup transaction will time out

If the HTLC has not timed out yet, there will be an additional value in the response:

- `timeoutEta`: UNIX timestamp at which the HTLC is expected to time out

**Examples:**

`POST /getswaptransaction`

Request body:

```json
{
  "id": "KR8XaB"
}
```

Response:

```json
{
  "transactionHex": "020000000001015bf3fe03071edae971276831963d45821ce6bc95c567fd7832bee3b1848254ba0000000000feffffff02b82a75e80000000017a914ca9b26af0865c2a59f0d6c41ede68f03264a52398700e1f5050000000017a914d2271732308baf018a1c2c751a3afb197f2a2e7e870247304402200206ae10cd66267caea1c6e0fca0275924a85fa377572f599304c1abb6a3a97302204335eed108151048de7ba56fd644352831e3d453b412547d8b762f4e96ee1e310121035b6440fe45a8bf7c1d9d238fa39a128ee78b58df73377bfeb1d6d752849714c800000000",
  "timeoutBlockHeight": 252,
  "timeoutEta": 1586353245
}
```

`POST /getswaptransaction`

Request body:

```json
{
  "id": "KR8XaB"
}
```

Response:

```json
{
  "transactionHex": "020000000001015bf3fe03071edae971276831963d45821ce6bc95c567fd7832bee3b1848254ba0000000000feffffff02b82a75e80000000017a914ca9b26af0865c2a59f0d6c41ede68f03264a52398700e1f5050000000017a914d2271732308baf018a1c2c751a3afb197f2a2e7e870247304402200206ae10cd66267caea1c6e0fca0275924a85fa377572f599304c1abb6a3a97302204335eed108151048de7ba56fd644352831e3d453b412547d8b762f4e96ee1e310121035b6440fe45a8bf7c1d9d238fa39a128ee78b58df73377bfeb1d6d752849714c800000000",
  "timeoutBlockHeight": 252
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

There is one special case when trying to broadcast a refund transaction for a Submarine Swap that has not timed out yet: the backend will not only return `error` in the JSON encoded response but also some information alongside that error to make your life a little bit easier:

- `error`: the reason for which the broadcasting failed. In this special case always: `non-mandatory-script-verify-flag (Locktime requirement not satisfied) (code 64)`
- `timeoutEta`: UNIX timestamp at which the HTLC is expected to time out
- `timeoutBlockHeight`: block height at which the HTLC in the lockup transaction will time out

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

*Special case when broadcasting a refund for a Submarine Swap that has not timed out yet:*

`POST /broadcasttransaction`

Request body:

```json
{
  "currency": "BTC",
  "transactionHex": "0100000000010113a19f721bc15b17a63700a7bf0056b7640b2c80239577f7ee95618baa34958f0100000023220020e1088f54c6d46e861bf4c5590bdff35c6f277b10e4e2787e1a5df23f1e540a3dfdffffff01bcdff5050000000016001486590ca595782212ce4fe0a4be8855f55f7f288603483045022100c142b9616659ba1728c254d8e275a304dc31c9139f005f9a97938cb1606c370e0220686d4e6166a7adab916f9af823c2f173aa9bd7f47a581909bda95881e1c00e07010064a9146aad1375552e58e9d4281a331caf271d0d160e3c8763210396ed47336687c51bc7e2bd32d0fc7a377d33c888f02a0647a7f1156761614a0d6702c401b1752103ffb18860cbe08060bd93a17abe4b436c46d0ee5b43fd0c24ba5bd65d6f42beb568ac00000000"
}
```

Response:

```json
{
  "timeoutEta": 1586374147,
  "timeoutBlockHeight": 452,
  "error": "non-mandatory-script-verify-flag (Locktime requirement not satisfied) (code 64)"
}
```

## Getting status of a Swap

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
- `transaction`: in case of a reverse swap the lockup transaction details are not in the response of the call which creates the swap. Therefore, the events `transaction.mempool` and `transaction.confirmed` contain it
    - `id`: id of the lockup transaction
    - `hex`: hex encoded lockup transaction
    - `eta`: if the status is `transaction.mempool`, this value is the estimated time of arrival (ETA) in blocks of when the transaction will be confirmed

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
  "status": "transaction.mempool",
  "transaction": {
    "id": "31fcddf287d985eef85211b75976cd903dba3008a8e13b597e1b54941278c29f",
    "hex": "01000000000101618cd5c50221577a1b98ae4a73f652917f9d2e343b9bc6a978239da78dfcbc630000000000ffffffff02b878010000000000220020ddc8dd3bcb45660e421fc3129bfdcb317446c27ce909369d4c8cb17bbd6d4951c718393b00000000160014ea9e0fc9432fc8b6831e94ac3974d46d1ba1c62f024830450221008b14ecce2eebb2ec7e56c53de4796603fbd22cfd269f3a5249446b79987dec36022059b68568a57ebfbd50cc792af3d514c507af20e795ff5f0bf2a02d2fc44be223012103a1ad2a3891018e856700a20a4dea6bea9f4bba58ab3ca7cbaefaa06e805770d100000000",
    "eta": 2
  }
}
```

## Streaming status updates of a Swap

To not having to query the [`/swapstatus`](#getting-status-of-a-swap) endpoint regularly in order to always have the lastet swap status there is a seperate endpoint for streaming swap status updates via [Server-Side events](https://www.w3schools.com/html/html5_serversentevents.asp).

Requests to this enpoint have to provide the required `id` parameter via an URL parameter because all requests have to be of the method `GET`.

Every event in the Server-Side stream has data that is encoded exactly like the JSON object of the [`/swapstatus`](#getting-status-of-a-swap) endpoint. Please have a look at the examples below for a reference implementation in JavaScript of hanlding the stream.

| URL                     | Response
|-------------------------|-------------------------
| `GET /streamswapstatus` | Server-Side event stream

**Examples:**

Server-Side event streams have to be handled differently than normal HTTP responses. Below is a sample implementation in JavaScript and also what a raw response of a Server-Side event stream looks like.

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
- `refundPublicKey`: public key of a keypair that will allow the user to refund the locked up coins once the time lock is expired

If you already know the amount you want to swap you should also set `invoice`.

- `invoice`: the invoice of the user that should be paid

If the amount is **not** known, a **preimage hash should be specified**. The invoice that is [set during the lifecycle of the Submarine Swap](#setting-the-invoice-of-a-swap) has to have the same preimage hash as the one specified when creating the swap.

- `preimageHash`: hash of a preimage that will be used for the invoice that is set later on

Boltz also supports opening a channel to your node before paying your invoice. To ensure that this service works as advertised **make sure to connect your Lightning node to ours** before creating the swap. You can either query the URIs of our Lightning nodes with [`/getnodes`](#getting-lightning-nodes), find them in the FAQ section of our website or on Lightning explorers like [1ML](https://1ml.com) under the query "Boltz". To let Boltz open a channel to you have to set a couple more values in the request when creating a swap:

- `channel`: a JSON object that contains all the information relevant to the creation of the channel
    - `auto`: whether Boltz should dynamically decide if a channel should be created based on whether the invoice you provided can be paid without opening a channel. More modes will be added in the future
    - `private`: whether the channel to your node should be private
    - `inboundLiquidity`: percentage of the channel balance that Boltz should provide as inbound liquidity for your node. The maximal value here is `50`, which means that the channel will be perfectly balanced 50/50

To find out how to enforce that the requested channel was actually opened and the invoice paid through it have a look at [this document where we wrote down some possible solutions](channel-creation.md).

| URL                | Response
|--------------------|------------
| `POST /createswap` | JSON object

Status Codes:

- `201 Created`
- `400 Bad Request`: if the swap could not be created. Check the `error` string in the JSON object of the body of the response for more information

Response objects:

You will always have these values in the response object:

- `id`: id of the freshly created swap
- `timeoutBlockHeight`: block height at which the swap will be cancelled
- `address`: address in which the coins will be locked up. Currently, this is a SegWit P2SHP2WSH (P2WSH nested in a P2SH) for the sake of compatibility
- `redeemScript`: redeem script from which the `address` is derived. The redeem script can and should be used to verify that the Boltz instance didn't try to cheat by providing an address without a HTLC

If you set the invoice you will also have these values in the response:

- `acceptZeroConf`: whether Boltz will accept 0-conf for this swap
- `expectedAmount`: the amount of satoshis or litoshis that is expected to be sent to the `address`
- `bip21`: a [BIP21 payment request](https://github.com/bitcoin/bips/blob/master/bip-0021.mediawiki) for the `expectedAmount` of coins and the `address`

**Examples:**

`POST /createswap`

Request body:

```json
{
  "type": "submarine",
  "pairId": "LTC/BTC",
  "orderSide": "sell",
  "refundPublicKey": "03b76c1fe14bab50e52a026f35287fda75b9304bcf311ee85b4d32482400a436f5",
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

*Submarine Swap that includes the creation of a new channel:*

`POST /createswap`

Request body:

```json
{
  "type": "submarine",
  "pairId": "LTC/BTC",
  "orderSide": "sell",
  "refundPublicKey": "03b76c1fe14bab50e52a026f35287fda75b9304bcf311ee85b4d32482400a436f5",
  "invoice": "lnbcrt100u1pw54eudpp5e42ls0apxfm2790aesc92v5kppkr5dluvv0545v6zr593498s8zsdqqcqzpgpyaz550xmqkr6v5x8cn3qxyxmuxp7xa28xlr7qhkxlde3xm8xjyyqqurx5nq8tdeejvm4jnuw468lxjtnfj8v49hsg8tkhjz9haj65sps8xdv0",
  "channel": {
    "private": true,
    "inboundLiquidity": 30
  }
}
```

Response:

```json
{
  "id": "SIqEW9",
  "acceptZeroConf": true,
  "expectedAmount": 1005340,
  "timeoutBlockHeight": 252,
  "address": "2NBFGsAUUa9qgoMFPLrmAquCLv2qunUPDAU",
  "bip21": "bitcoin:2NBFGsAUUa9qgoMFPLrmAquCLv2qunUPDAU?amount=0.0100534&label=Send%20to%20BTC%20lightning",
  "redeemScript": "a9141384278c2be432627fd934e0f13b3e0c3edbbe458763210250035e2afeb9b2213d01f8374afabff4e4bdfee71909c3cd28ba37571d7a289e6702fc00b1752103e25b3f3bb7f9978410d52b4c763e3c8fe6d43cf462e91138c5b0f61b92c93d7068ac"
}
```

## Getting Swap rates

When sending onchain coins before setting the invoice of a Submarine Swap, you need to use this endpoint to figure out what the amount of the invoice you set should be. Send a `POST` request with a JSON encoded body with this value:

- `id`: id of the Submarine Swap

| URL               | Response
|-------------------|------------
| `POST /swaprates` | JSON object

Status Codes:

- `200 OK`
- `400 Bad Request`: if the invoice amount could not be calculated. Check the `error` string in the JSON object of the body of the response for more information

Response object:

- `invoiceAmount`: amount of the invoice that should be set with [/setinvoice](#setting-the-invoice-of-a-swap)

**Examples:**

Request body:

```json
{
  "id": "BY8asG"
}
```

Response:

```json
{
  "invoiceAmount": 15713393
}
```

## Setting the invoice of a Swap

In case the amount to be swapped is not known when creating the Submarine Swap, the invoice can be set afterward and even if the onchain coins were sent already. Please keep in mind that the invoice of a Submarine Swap **has to have the same preimage hash** that was specified when creating the Submarine Swap. Although the invoice can be changed after setting it initially, this enpoint will only work if Boltz did not try to pay the initial invoice yet. Requests to this endpoint have to be `POST` and should have the following values in its JSON encoded body:

- `id`: id of the Submarine Swap for which the invoice should be set
- `invoice`: invoice of the user that should be paid

| URL                | Response
|--------------------|------------
| `POST /setinvoice` | JSON object

Status Codes:

- `200 OK`
- `400 Bad Request`: if the invoice could not be set. Check the `error` string in the JSON object of the body of the response for more information

Response objects:

What is returned when the invoice is set depends on the status of the Submarine Swap. If no coins were sent already (status [`swap.created`](lifecycle.md#normal-submarine-swaps)) the endpoint will return a JSON object with these values:

- `acceptZeroConf`: whether Boltz will accept 0-conf for this swap
- `expectedAmount`: the amount of satoshis or litoshis that is expected to be sent to the `address`
- `bip21`: a [BIP21 payment request](https://github.com/bitcoin/bips/blob/master/bip-0021.mediawiki) for the `expectedAmount` of coins and the `address`

If onchain coins were sent already (status [`transaction.mempool`](lifecycle.md#normal-submarine-swaps) or [``transaction.confirmed``](lifecycle.md#normal-submarine-swaps)) the endpoint will return an empty JSON object.

In case this endpoint is called again after an invoice was set and Boltz tried to pay it already:

- `error`: error message explaining that Boltz tried to pay the invoice already and that it cannot be changed anymore
- `invoice`: the invoice that set by the client and will be used for the Submarine Swap

**Examples:**

*If no coins were sent yet:*

`POST /setinvoice`

Request body:

```json
{
  "id": "UwHIPg",
  "invoice": "lnbcrt1m1p08epqjpp5yvv222x7te9asyzuhmjym083lwqpp5vlem09ewfeufyrp6f76w2sdql2djkuepqw3hjqnz5gvsxzerywfjhxuccqzpgsp5u6kxgf9daf64ptvl2ht74m6duc2neywx3ecvwxs07vf7egw5dy5s9qy9qsqakms0e7ww46q9cq2fa2ymrcx6nucfknjalkm5w4ywvjpfxdp5ya82drvdvxhqzzt2ysysh5u7rellzjse37fng3vsqafuwwz3kv4ykcquy8k29"
}
```

Response:

```json
{
  "acceptZeroConf": true,
  "expectedAmount": 1359564,
  "bip21": "litecoin:QNaGS7WM31xANXQCbmrhXfnxUjxiGFpFwM?amount=0.01359564&label=Submarine%20Swap%20to%20BTC"
}
```

*If coins were sent to the lockup address already:*

`POST /setinvoice`

Request body:

```json
{
  "id": "UwHIPg",
  "invoice": "lnbcrt1m1p08epqjpp5yvv222x7te9asyzuhmjym083lwqpp5vlem09ewfeufyrp6f76w2sdql2djkuepqw3hjqnz5gvsxzerywfjhxuccqzpgsp5u6kxgf9daf64ptvl2ht74m6duc2neywx3ecvwxs07vf7egw5dy5s9qy9qsqakms0e7ww46q9cq2fa2ymrcx6nucfknjalkm5w4ywvjpfxdp5ya82drvdvxhqzzt2ysysh5u7rellzjse37fng3vsqafuwwz3kv4ykcquy8k29"
}
```

Response:

```json
{}
```

*If the invoice was set and Boltz tried to pay it already:*

`POST /setinvoice`

Request body:

```json
{
  "id": "UwHIPg",
  "invoice": "lnbcrt100u1p0gv8hjpp5j0vs0te6wykahrp3aammm46m73n2afzk6a87ezfp3p58qpcpu4wqdqqcqzpgsp5j6wue634lac577xnupy8auvq7n9062vshvvc6xszq4jt5q9phhzq9qy9qsqhs7zrs98tu669xz7w0gqy96g5pvs9p6lssmyseg7a92kpjlzramk8khyzkd8x4nl2zasekmwt45z6pe78rk032lkmshjdnesw2vukwgqtglt89"
}
```

Response:

```json
{
  "error": "lightning payment in progress already",
  "invoice": "lnbcrt1m1p08epqjpp5yvv222x7te9asyzuhmjym083lwqpp5vlem09ewfeufyrp6f76w2sdql2djkuepqw3hjqnz5gvsxzerywfjhxuccqzpgsp5u6kxgf9daf64ptvl2ht74m6duc2neywx3ecvwxs07vf7egw5dy5s9qy9qsqakms0e7ww46q9cq2fa2ymrcx6nucfknjalkm5w4ywvjpfxdp5ya82drvdvxhqzzt2ysysh5u7rellzjse37fng3vsqafuwwz3kv4ykcquy8k29"
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

- `201 Created`
- `400 Bad Request`: if the swap could not be created. Check the `error` string in the JSON object of the body of the response for more information

Response object:

- `id`: id of the freshly created swap
- `redeemScript`: redeem script from which the lockup address was derived. The redeem script can and should be used to verify that the Boltz instance didn't try to cheat by creating an address without a HTLC
- `lockupTransaction`: hex transaction in which the coins were locked up
- `lockupTransactionId`: id of the `lockupTransaction`
- `invoice`: invoice that is expected to be paid by the user in order to get the preimage to claim the coins that were locked up in `lockupTransaction`
- `timeoutBlockHeight`: block height at which the swap will be cancelled
- `onchainAmount`: amount of satoshis or litoshis that were locked up onchain in the `lockupTransaction`

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
  "claimPublicKey": "03b76c1fe14bab50e52a026f35287fda75b9304bcf311ee85b4d32482400a436f5"
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
