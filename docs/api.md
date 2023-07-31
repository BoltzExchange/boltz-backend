---
description: >-
  Boltz exposes a RESTful HTTP API that can be used to query information like
  supported pairs and to create as well as monitor swaps. This page lists all
  available endpoints and shows how to use them.
---

# 🤖 REST API

### Response and request encoding

All the responses to all calls are encoded as `JSON` objects. If endpoints require the client to provide any kind of arguments these also have to be encoded as `JSON` and sent in the body of a `POST` request. Make sure to set the `Content-Type` header of your `POST` requests to `application/json` if you are sending `JSON` encoded data in the body of the request.

### Error handling

If a call fails for some reason the returned [HTTP status code](https://en.wikipedia.org/wiki/List\_of\_HTTP\_status\_codes) will indicate that, and an object will be returned that looks like this and gives the reason why the call failed:

```json
{
  "error": "message explaining why the call failed"
}
```

## Backend Version

Returns the version of [Boltz Backend](https://github.com/BoltzExchange/boltz-backend).

| URL            | Response    |
| -------------- | ----------- |
| `GET /version` | JSON object |

Status Codes:

* `200 OK`

Response object:

* `version`: the deployed version of Boltz Backend

**Examples:**

`GET /version`

```json
{
  "version":"3.2.1-7c38088"
}
```

## Supported Pairs

In order to create a swap, one first has to know which pairs are supported and what kind of rates, limits and fees are applied when creating a new swap. The following call returns this information.

| URL             | Response    |
| --------------- | ----------- |
| `GET /getpairs` | JSON object |

Status Codes:

* `200 OK`

Response object:

* `info`: contains information about special configuration parameters of the Boltz Backend deployment. As of writing this there is only one possible value:
  * `prepay.minerfee`: If the array contains this value, the corresponding Boltz instance requires a small invoice for the miner fee to be paid before the actual hold invoice of a Reverse Swap is revealed. As of writing, our [mainnet instance](https://boltz.exchange/) does not require this prepayment and thus returns an empty array.
* `warnings`: an array of strings that indicate that some feature of Boltz might me disabled or restricted. An example of a warning is:
  * `reverse.swaps.disabled`: Means that all reverse swaps (from Lightning to the chain) are disabled.
* `pairs`: an object containing the supported pairs. The keys of the values are the IDs of the pairs (`BTC/BTC` is a special case with mainchain Bitcoin as _base asset_ and Lightning Bitcoin as _quote asset_) and the values itself contain information about the pair:
  * `hash`: SHA256 hash of the `JSON` encoded data in the pair object.
  * `rate`: The exchange rate of the pair.
  * `limits`: a `JSON` Object containing the minimal and maximal amount of the pair's swap. The numbers are denominated **10 \*\* -8** of the _quote asset._
    * `maximalZeroConf`: The maximal amounts that will be accepted without chain confirmations by Boltz.
  * `fees`: A `JSON` object that contains different kinds of fees:
    * `percentage`: The percentage of the "send amount" that is charged by Boltz as "Boltz Fee" for swaps from quote to base asset (e.g. Lightning -> Bitcoin).
    * `percentageSwapIn`: The percentage of the "send amount" that is charged by Boltz as "Boltz Fee" for a swap from base to quote asset (e.g. Bitcoin -> Lightning).
    * `minerFees`: The network fees charged for locking up and claiming funds onchain. These values are absolute, denominated in **10 \*\* -8** of the quote asset.

**Examples:**

`GET /getpairs`

Response:

```json
{
  "info": [],
  "warnings": [],
  "pairs": {
    "BTC/BTC": {
      "hash": "05d0f522ef08dd66fa0f87f167cc1380eaf7e5227e698941ecb44876e0736cb8",
      "rate": 1,
      "limits": {
        "maximal": 10000000,
        "minimal": 50000,
        "maximalZeroConf": {
          "baseAsset": 0,
          "quoteAsset": 0
        }
      },
      "fees": {
        "percentage": 0.5,
        "percentageSwapIn": 0.1,
        "minerFees": {
          "baseAsset": {
            "normal": 1360,
            "reverse": {
              "claim": 1104,
              "lockup": 1224
            }
          },
          "quoteAsset": {
            "normal": 1360,
            "reverse": {
              "claim": 1104,
              "lockup": 1224
            }
          }
        }
      }
    },
    "L-BTC/BTC": {
      "hash": "769215ae0f8cb14d250374a77de530ac2887c927dc08f8efce74f3634df03171",
      "rate": 1,
      "limits": {
        "maximal": 10000000,
        "minimal": 10000,
        "maximalZeroConf": {
          "baseAsset": 0,
          "quoteAsset": 0
        }
      },
      "fees": {
        "percentage": 0.25,
        "percentageSwapIn": 0.1,
        "minerFees": {
          "baseAsset": {
            "normal": 147,
            "reverse": {
              "claim": 152,
              "lockup": 276
            }
          },
          "quoteAsset": {
            "normal": 1360,
            "reverse": {
              "claim": 1104,
              "lockup": 1224
            }
          }
        }
      }
    }
  }
}
```

## Creating Normal Submarine Swaps

Requests creating Normal Submarine Swaps (Chain -> Lightning) differ slightly depending on the kind of Bitcoin that are swapped, more information below. **Please note that Boltz works with 10 \*\* -8 decimals internally** and all amounts in the API endpoints follow this denomination. All requests to create swaps have the following common values in the API request:

* `type`: type of the swap to create. For Normal Submarine Swaps this is  `submarine` .
* `pairId`: the pair of which the swap should be created, for more check [#supported-pairs](api.md#supported-pairs "mention")
* `orderSide`: currently we recommend using `sell` across all pairs of swap type `submarine`. The value `buy` for e.g. the `L-BTC/BTC` pair signifies a swap from mainchain Bitcoin to Liquid Lightning. As of writing, this is not supported and the backend will return `"error": "L-BTC has no lightning support"`

Normal Submarine Swaps: If you already know the amount to be swapped, you should also set `invoice`.

* `invoice`: the invoice of the user that should be paid

If the amount is **not** known yet, a **preimage hash has be specified**. The invoice that is provided later[ during the lifecycle of the Submarine Swap](api.md#setting-the-invoice-of-a-swap) has to have the _same preimage hash_ as the one specified here.

* `preimageHash`: hash of a preimage that will be used for the invoice that is set later on

We recommend verifing that pair data fetched previously is still accurate by additionally passing the `pairHash` argument in this call.

* `pairHash`: `hash` string in the pair object of [`/getpairs`](api.md#getting-pairs)

_Note: Channel creation is currently disabled!_

~~Boltz also supports opening a channel to your node before paying your invoice. To ensure that this service works as advertised **make sure to connect your Lightning node to ours** before creating the swap. You can either query the URIs of our Lightning nodes with~~ [~~`/getnodes`~~](api.md#getting-lightning-nodes)~~, find them in the FAQ section of our website or on Lightning explorers like~~ [~~1ML~~](https://1ml.com) ~~under the query "Boltz". To let Boltz open a channel to you have to set a couple more values in the request when creating a swap:~~

* ~~`channel`: a JSON object that contains all the information relevant to the creation of the channel~~
  * ~~`auto`: whether Boltz should dynamically decide if a channel should be created based on whether the invoice you provided can be paid without opening a channel. More modes will be added in the future~~
  * ~~`private`: whether the channel to your node should be private~~
  * ~~`inboundLiquidity`: percentage of the channel balance that Boltz should provide as inbound liquidity for your node. The maximal value here is `50`, which means that the channel will be perfectly balanced 50/50~~

~~To find out how to enforce that the requested channel was actually opened and the invoice paid through it have a look at~~ [~~this document where we wrote down some possible solutions~~](channel-creation.md)~~.~~

| URL                | Response    |
| ------------------ | ----------- |
| `POST /createswap` | JSON object |

Status Codes:

* `201 Created`
* `400 Bad Request`: if the swap could not be created. Check the `error` string in the `JSON` object of the body of the response for more information

Response objects:

Response objects of all swaps have these value in common:

* `id`: id of the newly created swap
* `timeoutBlockHeight`: base asset block height at which the swap will expire and be cancelled
* `address`: address in which the coins will be locked up. For UTXO chains this is a SegWit `P2SHP2WSH` (`P2WSH` nested in a `P2SH`) for the sake of compatibility and for RSK it is the address of the contract that needs to be used

If a lightning invoice is set in this call, one will also find the following values in the response:

* `acceptZeroConf`: whether Boltz will accept 0-conf for this swap
* `expectedAmount`: the amount that Boltz expects to be locked onchain

### UTXO Chains

Normal Submarine Swaps from UTXO chains like Bitcoin work by deriving an address based on the preimage hash (of the invoice) and the refund public key of the user. Boltz then waits until the user sent coins to the generated address.

Requests for these kind of swaps have to contain one additional parameter:

* `refundPublicKey`: public key of a keypair that will allow the user to refund the locked up coins once the time lock is expired. This keypair has to be generated and stored by the client integrating Boltz API.

Responses also contain one additional value:

* `redeemScript`: redeem script from which the `address` is derived. The redeem script can (and should!) be used to verify that the Boltz didn't try to cheat by providing an address without HTLC

In case the address is for the Liquid Network, it will be blinded by a key that is also in the response:

* `blindingKey`: hex encoded private key with which the address was blinded

If the invoice has been set, you will also get this value:

* `bip21`: a [BIP21 payment request](https://github.com/bitcoin/bips/blob/master/bip-0021.mediawiki) for the `expectedAmount` and the `address`

**Examples:**

`POST /createswap`

Request body:

```json
{
  "type": "submarine",
  "pairId": "BTC/BTC",
  "orderSide": "sell",
  "refundPublicKey": "AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBGBkraVi05Eyn6slRQV5h+fX6rtpudOq0LqPEnbnbxRshMdhS56vKWawUNLkLZZ4hKsTdbJZvgTtO/rDc2WI/Gw",
  "invoice": "lntb1m1pjv0dt5pp5y9dl3z50c5g6p26a86g432zdzvdlx6a565hk55a2ellz3t9f84jsdqqcqzzsxqyz5vqsp5a4k0f59u62na3fngv24nv5xjuxyf6qjnnj806se373h4gt9fmejq9qyyssqpeh42yy72pqzfwdfehvuru9s735vrgg324lxdp9gg8w6m379w8ajd3sxyy6f0qqfqa6vhk5k4pqfz6nys3u5xf68wcjyjygykn7za6cqf6flce"
}
```

Response:

```json
{
	"id": "E63LC4",
	"bip21": "bitcoin:2NBBYeBZgY64nJKiibnGokwrBBPjoQeMzyx?amount=0.0010054&label=Send%20to%20BTC%20lightning",
	"address": "2NBBYeBZgY64nJKiibnGokwrBBPjoQeMzyx",
	"redeemScript": "a9148f8d01a3e1a794024fa78bd9c81d5ae9bb1c56d287632102bba4fbfe50ea8caf880cb367f7b0083c7e91c2bc2808c817823bd36385e3a376670319b125b17503aaaae268ac",
	"acceptZeroConf": false,
	"expectedAmount": 100540,
	"timeoutBlockHeight": 2470169
}
```

_Submarine Swap that includes the_ [_creation of a new channel_](channel-creation.md)_:_

`POST /createswap`

Request body:

```json
{
  "type": "submarine",
  "pairId": "BTC/BTC",
  "orderSide": "sell",
  "refundPublicKey": "AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBGBkraVi05Eyn6slRQV5h+fX6rtpudOq0LqPEnbnbxRshMdhS56vKWawUNLkLZZ4hKsTdbJZvgTtO/rDc2WI/Gw",
  "invoice": "lntb10m1pjv0w7jpp5upaf56avdlkjv9h602m9heaa004reuc36yjf2hwzcv3tk0kjaekqdqqcqzzsxqyz5vqsp5klkwplct9kuzp8whrmjvqxqjhnga907aa953xdeaqypa8mn6chtq9qyyssqlywerx9cdqxukf640kphw2rtz6uamtc0g94h7jt99jpspjxn653h6gn30a6ejndh4xuxuf2gxn2sndgqhvs33s5ayg70z4p4f7n267gp4tytl0",
  "channel": {
  "auto": true,
    "private": false,
    "inboundLiquidity": 30
  }
}
```

Response:

```json
{
	"id": "e1Qtxa",
	"bip21": "bitcoin:2Muq74He81w8Ts4n3zhPFd1JZbuWC62czux?amount=0.0100234&label=Send%20to%20BTC%20lightning",
	"address": "2Muq74He81w8Ts4n3zhPFd1JZbuWC62czux",
	"redeemScript": "a91479674970eaa348958799f6fc41ef379d00f9060f8763210385ad894cdd1f27f4c88ef403100420eed6cc006965a3a58e277cb05c6f469d6667031ab125b17503aaaae268ac",
	"acceptZeroConf": false,
	"expectedAmount": 1002340,
	"timeoutBlockHeight": 2470170
}
```

### EVM Chains (In Development!)

Swaps from account-based EVM chains like RSK do not require a new address for every swap. `/createswap` takes the details of the swap (like lightning invoice and pair) and Boltz waits until the user locked e.g. rBTC in the contract. The addresses of those contracts can be queried with [`/getcontracts`](http://localhost:8000/api/#getting-contracts) and the address of the contract that needs to be used for the swap is also returned in the response of this request.

The request does not require any additional values.

But the response has one additional value:

* `claimAddress`: which is e.g. the RSK address of Boltz. It is specified in the`lock` function of the swap contract

**Examples:**

`POST /createswap`

Request body:

```json
{
  "type": "submarine",
  "pairId": "BTC/RBTC",
  "orderSide": "buy",
  "invoice": "lnbcrt1m1p0c26rvpp5hctw8zukj00tsxay5436y43qxc5gwvdc6k9zcxnce4zer7p5a4eqdqqcqzpgsp59mwcr4cj6wq68qj6pzyjtq2j89vnpumsejdmhw5uy4yukq3vd64s9qy9qsq2537ph4kt4xryq27g5juc27v2tkx9y90hpweyqluku9rt5zfexfj6n2fqcgy7g8xx72fklr6r7qul27jd0jzvssvrhxmwth7w4lrq7sqgyv0m7"
}
```

Response:

```json
{
  "id": "7PSEtx",
  "address": "0xD104195e630A2E26D33c8B215710E940Ca041351",
  "claimAddress": "0xe20fC13bad486fEB7F0C87Cad42bC74aAc319684",
  "acceptZeroConf": false,
  "expectedAmount": 1387707329,
  "timeoutBlockHeight": 2006
}
```

### Swap Rates

When sending onchain Bitcoin, before setting the invoice of a Submarine Swap, you'll need to use this endpoint to figure out what the amount of the invoice you set should be. Send a `POST` request with a `JSON` encoded body with this value:

* `id`: id of the Submarine Swap

| URL               | Response    |
| ----------------- | ----------- |
| `POST /swaprates` | JSON object |

Status Codes:

* `200 OK`
* `400 Bad Request`: if the invoice amount could not be calculated. Check the `error` string in the `JSON` object of the body of the response for more information. A common case is where the user did not lock up onchain Bitcoin yet, which is a requirement in order to calculate an invoice amount: `"error": "no coins were locked up yet"`

Response object:

* `invoiceAmount`: amount of the invoice that should be set with [/setinvoice](api.md#setting-the-invoice-of-a-swap)

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

### Setting an Invoice

In case the amount to be swapped is not known when creating a Normal Submarine Swap, the invoice can be set afterwards; even if the chain Bitcoin were sent already. Please keep in mind that the invoice **has to have the same preimage hash** that was specified when creating the swap. Although the invoice can be changed after setting it initially, this endpoint will only work if Boltz did not try to pay the initial invoice yet. Requests to this endpoint have to be `POST` and should have the following values in its JSON encoded body:

* `id`: id of the swap for which the invoice should be set
* `invoice`: invoice of the user that should be paid

| URL                | Response    |
| ------------------ | ----------- |
| `POST /setinvoice` | JSON object |

Status Codes:

* `200 OK`
* `400 Bad Request`: if the invoice could not be set. Check the `error` string in the JSON object of the body of the response for more information

Response objects:

What is returned when the invoice is set depends on the status of the Submarine Swap. If no funds were sent (status [`swap.created`](<README (1).md#normal-submarine-swaps>)) the endpoint will return a `JSON` object with these values:

* `acceptZeroConf`: whether Boltz will accept 0-conf for this swap
* `expectedAmount`: the amount that Boltz expects you to lock in the onchain HTLC
* `bip21`: a [BIP21 payment request](https://github.com/bitcoin/bips/blob/master/bip-0021.mediawiki) for the `expectedAmount` of coins and the `address` (only set when swapping from UTXO based chains)

If chain Bitcoin were sent already (status [`transaction.mempool`](<README (1).md#normal-submarine-swaps>) or [`transaction.confirmed`](<README (1).md#normal-submarine-swaps>)) the endpoint will return an empty `JSON` object, signifying success.

In case this endpoint is called again after an invoice was set and Boltz tried to pay it already:

* `error`: error message explaining that Boltz tried to pay the invoice already and that it cannot be changed anymore
* `invoice`: the invoice that was set and that will be used for the swap

**Examples:**

_If no Bitcoin were sent yet:_

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
  "bip21": "bitcoin:QNaGS7WM31xANXQCbmrhXfnxUjxiGFpFwM?amount=0.01359564&label=Submarine%20Swap%20to%20BTC"
}
```

_If Bitcoin were sent already:_

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

_If the invoice was previously set and Boltz tried to pay it already:_

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

## Creating Reverse Submarine Swaps

Creating Reverse Submarine Swaps (Lightning -> Chain) is similar to creating Normal Submarine Swaps. Similarly, the requests and responses change slightly depending on the kind of Bitcoin involved in the swap. Keep in mind, **Boltz uses 10 \*\* -8 as denomination** for responses in the API.

All requests bodies extend from:

* `type`: type of the swap to create. For Reverse Submarine Swaps this is `reversesubmarine`.
* `pairId`: the pair of which the swap should be created, for more check [#supported-pairs](api.md#supported-pairs "mention")
* `orderSide`: currently we recommend using `buy` across all pairs of swap type `reversesubmarine`. The value `sell` for e.g. the `L-BTC/BTC` pair signifies a swap from mainchain Bitcoin to Lightning on Liquid. As of writing, this is not supported and the backend will return `"error": "L-BTC has no lightning support"`
* `preimageHash`: the SHA256 hash of a preimage that was generated by the client. The size of that preimage has to be 32 bytes or claiming will fail

There are two ways to set the amount of a Reverse Swap. Either by specifying the amount of the invoice Boltz will generate:

* `invoiceAmount`: amount of the invoice that will be generated by Boltz

Or by setting the amount that will be locked in the onchain HTLC. That amount is _not_ what you will actually receive because of transaction fees required to claim the HTLC. But those can be approximated easily in advance and when overestimating a little, a quick confirmation of the claim transaction can be ensured.

* `onchainAmount`: amount Boltz will lock in the onchain HTLC

We recommend verifing that pair data fetched previously is still accurate by additionally passing the `pairHash` argument in this call.

* `pairHash`: `hash` string in the pair object of [`/getpairs`](api.md#getting-pairs)

| URL                | Response    |
| ------------------ | ----------- |
| `POST /createswap` | JSON object |

Status Codes:

* `201 Created`
* `400 Bad Request`: if the swap could not be created. Check the `error` string in the `JSON` object of the body of the response for more information

The `JSON` object in the response extends from:

* `id`: id of the newly created swap
* `lockupAddress`: address derived from the `redeemScript` or contract to which Boltz will lock up coins
* `invoice`: hold invoice that needs to be paid before Boltz locks up coins
* `timeoutBlockHeight`: block height at which the Reverse Swap will be cancelled

In case the invoice amount was specified, the amount that will be locked in the onchain HTLC is also returned:

* `onchainAmount`: amount of onchain coins that will be locked by Boltz

Boltz backend also supports a different protocol that requires an invoice for miner fees to be paid before the actual hold `invoice` of the Reverse Submarine Swap. If that protocol is enabled, the response object will also contain a `minerFeeInvoice`. Once the `minerFeeInvoice` is paid, Boltz will send the event `minerfee.paid` and when the actual hold `invoice` is paid, the onchain coins will be sent.

### UTXO based chains

The request has to contain one additional value:

* `claimPublicKey`: public key of a keypair that will allow the user to claim the locked up coins with the preimage. This keypair has to be generated and stored by the client integrating Boltz API.

And so has the response:

* `redeemScript`: redeem script from which the lockup address was derived. The redeem script can (and should!) be used to verify that the Boltz instance didn't try to cheat by creating an address without a HTLC

In case the lockup address is on the Liquid Network, it will be blinded by a key that is also in the response:

* `blindingKey`: hex encoded private key with which the address was blinded

**Examples:**

`POST /createswap`

Request body:

```json
{
  "type": "reversesubmarine",
  "pairId": "L-BTC/BTC",
  "orderSide": "buy",
  "invoiceAmount": 1000000,
  "preimageHash": "51a05b15e66ecd12bf6b1b62a678e63add0185bc5f41d2cd013611f7a4b6703f",
  "claimPublicKey": "03b76c1fe14bab50e52a026f35287fda75b9304bcf311ee85b4d32482400a436f5"
}
```

Response:

```json
{
  "id": "v3CfMa",
  "invoice": "lntb10m1pjvsy8ppp52xs9k90xdmx390mtrd32v78x8twsrpdutaqa9ngpxcgl0f9kwqlsdpz2djkuepqw3hjqnpdgf2yxgrpv3j8yetnwvcqz95xqrrsssp5hzcjq972f9cl8c6u3zechepm65hjceaqvlzye6kc23qkz5rhva6q9qyyssq4kkw9fwjq7n9cm4j3ajj2a92ka0zyeg3sxppfy932c62pnsqkw7nhvg9rrxztszw37wqtal4cchw2f4s09qe48pngsl9euv7wjlz93qqrfx60s",
  "blindingKey": "897034f717beb12a3c2b7ae8c08c5c4def7bc7cfb6efa3713c617f28d90d1419",
  "redeemScript": "8201208763a914be1abd8e8d7ef7e64a9c6e1e2f498f3a92e078a2882103b76c1fe14bab50e52a026f35287fda75b9304bcf311ee85b4d32482400a436f5677503dbf40eb175210330fd4cfd53b5c20886415c1b67d2daa87bce2761b9be009e9d1f9eec4419ba5968ac",
  "lockupAddress": "tlq1qqdd0v79wcqnpvujf5mfp88d5cz8rynk0awr6m84ca8pzn39kwagsh4z204s9d5sww3cxckd47wjxlqwl3u6tgdqfa877txqt9m8wgk22qwyp5yzxaf40",
  "timeoutBlockHeight": 980187,
  "onchainAmount": 995724
}
```

_In case the prepay miner fee protocol is enabled:_

Request body:

```json
{
  "type": "reversesubmarine",
  "pairId": "BTC/BTC",
  "orderSide": "buy",
  "claimPublicKey": "0391fbaf549578fd7c2cb26b216441825bd780d85dba1f3d706e2f206587e96266",
  "invoiceAmount": 100000,
  "preimageHash": "2215034def003b63b2717fccd4ce8259f4807a39318c14e2bdd42639ca989a45"
}
```

Response body:

```json
{
  "id": "mVSKyF",
  "invoice": "lnbcrt996940n1p0dhjr3pp5yg2sxn00qqak8vn30lxdfn5zt86gq73exxxpfc4a6snrnj5cnfzsdql2djkuepqw3hjqsj5gvsxzerywfjhxuccqzy0sp5hjcvwl2glrq9n3vzm8072cdruz3hhz70edml8g0u76gryve6np4q9qy9qsqzw5w8ulxjgrg478hz4enjrw0a9tedl8s3n879xqh3mhn0pxrvajrz9qnnsr58twx4a30gk57d4fykm7x3v2vcamw7k4ny9fkpwl65vcpw8v5em",
  "redeemScript": "8201208763a914fb75ff5dc4272c2da33d744615905f54b62de41588210391fbaf549578fd7c2cb26b216441825bd780d85dba1f3d706e2f206587e962666775028e01b1752102c22801bd7dd3a6afb780671c1c983fcd91fa46826eadd82e325e7e13bb348a9768ac",
  "lockupAddress": "bcrt1qweryu6nk8gn5lj8ar5kjdy476wynheszg0lumu6jx83l2v6f435stlel03",
  "onchainAmount": 98694,
  "timeoutBlockHeight": 398,
  "minerFeeInvoice": "lnbcrt3060n1p0dhjr3pp5sk2u4rt0z8rrl6jj62d6szqvsdejj8kjcxa8tdt4dau5rtyskj6qdp4f45kuetjypnx2efqvehhygznwashqgr5dusyy4zrypskgerjv4ehxcqzpgsp5qtsm5vfy9yq8kjpthla67jagmcxnj529pm3edk94npf6fekq2sxq9qy9qsqmun0z8ed4kp9dhp7lthvzdrx3ngmjs32smx6l4hvyyktv92mf348aftgrwf44sl94ewywr3sw8dc4acy63yamxxpjtd4pkkr2uw2h5gpqc3d3y"
}
```

### EVM Chains (In Development!)

Requests to create swaps for Reverse Submarine Swaps from account-based EVM chains like RSK  have to contain one additional value:

* `claimAddress`: address from which the coins will be claimed

The response also has one more property:

* `refundAddress`: the address of Boltz which is specified as refund address when it is locking up funds

Also, Boltz offers an optional protocol called EVM prepay miner fee that allows the user to pay an additional lightning invoice to pay for gas on the EVM chain to claim funds. In this process, Boltz sends some e.g. rBTC to the `claimAddress` in the lockup process in case the user's `claimAddress` does not have enough rBTC to pay gas to claim the funds. To use that protocol set the following property in the request body to `true`.

* `prepayMinerFee`: if the Ethereum prepay miner fee protocol should be used for the Reverse Swap

When the Ethereum prepay miner fee protocol is used the response will contain two more values. One is the amount of Ether that will be sent to `claimAddress` in the lockup process. The other is an invoice for the Ether sent. Only when both invoices are paid the onchain coins will get locked.

* `prepayMinerFeeAmount`: amount of e.g. rBTC that will be sent to the `claimAddress` with the lockup transaction from Boltz
* `minerFeeInvoice`: invoice that pays for the Ether sent in the lockup process

**Examples:**

`POST /createswap`

Request body:

```json
{
  "type": "reversesubmarine",
  "pairId": "rBTC/BTC",
  "orderSide": "sell",
  "claimAddress": "0x88532974EC20559608681A53F4Ac8C34dd5e2804",
  "invoiceAmount": 100000,
  "preimageHash": "295b93a766959d607861ab7b7a6bf9e178e7c69c3cc4ca715065dfe9d6eea351"
}
```

Response body:

```json
{
  "id": "1H6eCx",
  "invoice": "lnbcrt1m1p0ega6epp599de8fmxjkwkq7rp4dah56leu9uw035u8nzv5u2svh07n4hw5dgsdpq2djkuepqw3hjq42ng32zqctyv3ex2umncqzphsp5gxshtrx3y0mt3llm3537qqy0ylf722hykv2zm777dwap9e60glfq9qy9qsqa93q725njkt9dupu9cddtchwcmyg7zsltrw8gcyzsc4tv74ss26y00z7tutrqks8wgh8s286ayy2tmrul0q0ysvxjzv793ylcdr553gqjhgny2",
  "refundAddress": "0xe20fC13bad486fEB7F0C87Cad42bC74aAc319684",
  "lockupAddress": "0xD104195e630A2E26D33c8B215710E940Ca041351",
  "onchainAmount": 1210297576,
  "timeoutBlockHeight": 2006
}
```

## Lightning Node Info

This endpoint allows you to query info like public keys and URIs of the lightning nodes operated by Boltz.

| URL             | Response    |
| --------------- | ----------- |
| `GET /getnodes` | JSON object |

Status Codes:

* `200 OK`

Response object:

* `nodes`: a JSON with the symbol of the chain on which the Lightning node is running as key, and a JSON object as key
  * `nodeKey`: public key of the lightning node
  * `uris`: array of the URIs on which the lightning node is reachable

**Examples:**

`GET /getnodes`

Response:

```json
{
  "nodes": {
    "BTC": {
      "uris": [
        "026165850492521f4ac8abd9bd8088123446d126f648ca35e60f88177dc149ceb2@45.86.229.190:9735",
        "026165850492521f4ac8abd9bd8088123446d126f648ca35e60f88177dc149ceb2@d7kak4gpnbamm3b4ufq54aatgm3alhx3jwmu6kyy2bgjaauinkipz3id.onion:9735"
      ],
      "nodeKey": "026165850492521f4ac8abd9bd8088123446d126f648ca35e60f88177dc149ceb2"
    }
  }
}
```

## Lightning Node Statistics

For display purposes on our website, basic statistics about our lightning nodes are exposed via the following endpoint:

| URL              | Response    |
| ---------------- | ----------- |
| `GET /nodestats` | JSON object |

Status Codes:

* `200 OK`

Response object:

* `nodes`: a JSON with the symbol of the chain on which the Lightning node is running as key, and a JSON object as key
  * `peers`: number of peers
  * `channels`: number of public channels
  * `oldestChannel`: UNIX timestamp of the block in which the opening transaction of the oldest channel was included
  * `capacity`: sum of the capacity of all public channels

**Examples:**

`GET /nodestats`

Response:

```json
{
  "nodes": {
    "BTC": {
      "peers": 79,
      "channels": 103,
      "oldestChannel": 1590772669,
      "capacity": 369879555
    }
  }
}
```

## Swap Timeouts

Boltz Swaps have different timeouts for each pair. This endpoint allows querying those timeouts denominated in blocks of the base and quote chain.

| URL             | Response    |
| --------------- | ----------- |
| `GET /timeouts` | JSON object |

Status Codes:

* `200 OK`

Response object:

* `timeouts`: a `JSON` object with the pairs as keys and a `JSON` object with the timeouts as values

**Examples:**

`GET /timeouts`

Response:

```json
{
  "timeouts": {
    "BTC/BTC": {
      "base": {
        "reverse": 144,
        "swapMinimal": 144,
        "swapMaximal": 288
      },
      "quote": {
        "reverse": 144,
        "swapMinimal": 144,
        "swapMaximal": 288
      }
    },
    "L-BTC/BTC": {
      "base": {
        "reverse": 1440,
        "swapMinimal": 1440,
        "swapMaximal": 2880
      },
      "quote": {
        "reverse": 144,
        "swapMinimal": 144,
        "swapMaximal": 288
      }
    }
  }
}
```

## Swap Contracts (In Development)

To query the addresses of contracts used by Boltz for swaps on EVM chains like [RSK](https://rootstock.io/), the following endpoint can be queried:

| URL                 | Response    |
| ------------------- | ----------- |
| `GET /getcontracts` | JSON object |

Status Codes:

* `200 OK`

Response object:

* `rsk`: a `JSON` object that contains all relevant RSK addresses
  * `network`: `JSON` object that contains information about the network
    * `chainId`: id of the RSK chain
    * `name`: if the RSK network of the backend is public, this property will be set to its name. Else this value stays `undefined`.
  * `swapContracts`: `JSON` object containing swap contract addresses as values
  * `tokens`: `JSON` object with the ticker symbol of the supported token as key and its address as value

**Examples:**

`GET /getcontracts`

Response:

```json
{
  "rsk": {
    "network": {
      "chainId": 1337
    },
    "swapContracts": {
      "rBTCSwap": "0x0",
      "TokenSwap": "0x0"
    },
    "tokens": {
    }
  }
}
```

## Fee Estimations

Boltz provides an API endpoint that returns fee estimations for all supported chains. These fee estimations are _not_ enforced by Boltz and merely represent a recommendation.

For UTXO chains like Bitcoin it is important to mention that if 0-conf is accepted by Boltz  for a particular pair (see [section](api.md#getting-pairs) above) and to be used with Normal Submarine Swaps, the lockup transaction has to have at least 80% of the recommended `sat/vbyte` value. One can read more about the what and why in the [0-conf docs](0-confirmation.md).

| URL                     | Response    |
| ----------------------- | ----------- |
| `GET /getfeeestimation` | JSON object |

Status Codes:

* `200 OK`

Response object:

This endpoint returns a `JSON` object of which each key is the symbol of a chain and each value the estimated fee for that chain denominated in `sat/vbyte` for UTXO chains like Bitcoin or `GWEI` for EVM chains like RSK.

**Examples:**

`GET /getfeeestimation`

Response:

```json
{
  "BTC": 16,
  "L-BTC": 0.11
}
```

## Raw Transactions

Boltz API also allows for querying raw transactions of all supported UTXO chains, irrespective of whether the transactions are still in the mempool or already included in a block. Note, that Boltz does _not_ provide any kind of cryptographic proof that the transaction was included in a block. Also this call is primarily kept for backward compatibility with older integrations, it is _not_ needed to construct transactions as the response of [`/swapstatus`](api.md#status-of-a-swap) provides all necessary info.

Requests querying for transactions have to be `POST` and contain two arguments in its JSON encoded body:

* `currency`: which chain should be queried for the transaction
* `transactionId`: the id of the transaction that should be queried

| URL                    | Response    |
| ---------------------- | ----------- |
| `POST /gettransaction` | JSON object |

Status Codes:

* `200 OK`
* `400 Bad Request`: if an argument wasn't provided or the transaction can't be found

Response object:

* `transactionHex`: the requested transaction encoded in hex

**Examples:**

`POST /gettransaction`

Request body:

```json
{
  "currency": "BTC",
  "transactionId": "0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098"
}
```

Response:

```json
{
	"transactionHex": "01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff0704ffff001d0104ffffffff0100f2052a0100000043410496b538e853519c726a2c91e61ec11600ae1390813a627c66fb8be7947be63c52da7589379515d4e0a604f8141781e62294721166bf621e73a82cbf2342c858eeac00000000"
}
```

## Lockup Transactions

The following endpoint can be used to query the user's lockup transaction of a Normal Submarine Swap on UTXO chains. The request has to be `POST` and contain the following argument in the `JSON` encoded body:

* `id`: id of the Submarine Swap

| URL                        | Response    |
| -------------------------- | ----------- |
| `POST /getswaptransaction` | JSON object |

Status Codes:

* `200 OK`
* `400 Bad Request`: if an argument wasn't provided, or the Submarine Swap can't be found

Response object:

* `transactionHex`: the lockup transaction of the Normal Submarine Swap encoded in hex
* `timeoutBlockHeight`: block height at which the HTLC in the lockup transaction will time out

If the HTLC has not timed out yet, there will be an additional value in the response:

* `timeoutEta`: UNIX timestamp at which the HTLC is expected to time out

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

This call works for Normal Submarine Swaps only. If used for Reverse Submarine Swaps, the response will be:

```json
{
	"error": "could not find swap with id: CR8XaB"
}
```

## Broadcasting transactions

This endpoint is used to broadcast transactions on UTXO chains. It is similar to [`/gettransaction`](api.md#raw-transactions) but instead of getting the hex representation of existing transactions on the chain, this call broadcasts _new_ transactions to the network. It is mainly intended to be used to broadcast refund transactions on user's behalf. It returns the id of the broacasted transaction,which can be used to verify that the refund transaction was broadcasted successfully.

Requests broadcasting transactions have to be `POST` and contain two arguments in the JSON encoded body:

* `currency`: to which network the transaction should be broadcasted
* `transactionHex`: the HEX encoded transaction itself

| URL                          | Response    |
| ---------------------------- | ----------- |
| `POST /broadcasttransaction` | JSON object |

Status Codes:

* `200 OK`
* `400 Bad Request`: if an argument wasn't provided or the node that should broadcast the transaction returns an error

Response object:

* `transactionId`: the id of the transaction that was broadcasted

**Example:**

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

There is one special case: when trying to broadcast a refund transaction for a swap that has not timed out yet, the backend will return some additional information in addition to the `error` in the `JSON` encoded response:

* `error`: the reason for which the broadcasting failed. In this special case always: `non-mandatory-script-verify-flag (Locktime requirement not satisfied) (code 64)`
* `timeoutEta`: UNIX timestamp at which the HTLC is expected to time out
* `timeoutBlockHeight`: block height at which the HTLC in the lockup transaction will time out

**Example:**

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

## Swap Status

_Before handling status events of this method it is recommended to read:_ [_Swap Types & States_](<README (1).md>)

To query the status of a swap one can use this endpoint which returns a `JSON` object containing the status of the swap. Possible states and status events are documented in the section [Swap Types & States](<README (1).md>)_._

Requests querying the status of a swap have to be `POST` and contain a single value in its JSON encoded body:

* `id`: the id of the swap of which the status should be queried

| URL                | Response    |
| ------------------ | ----------- |
| `POST /swapstatus` | JSON object |

Status Codes:

* `200 OK`
* `404 Not Found`: if the swap with the provided id couldn't be found
* `400 Bad Request`: if the `id` argument wasn't provided

Response object:

* `status`: status of the swap, e.g. `transaction.mempool` & `transaction.claimed` for successful Normal Submarine Swaps and `transaction.mempool` and `transaction.confirmed` for successful Reverse Submarine Swaps
* `transaction`: for Reverse Submarine Swaps, this field contains lockup transaction details in the states`transaction.mempool` and `transaction.confirmed`
  * `id`: id of the lockup transaction
  * `hex`: hex encoded lockup transaction (only set for transactions on UTXO chains)
  * `eta`: if the status is `transaction.mempool`, this value is the estimated time of arrival (ETA) in blocks of when the transaction will be confirmed. Only set for transactions on UTXO chains.
* `zeroConfRejected`: set to `true` for Swaps with the status `transaction.mempool` and a lockup transaction that is not eligible for [0-conf](0-confirmation.md)
* `failureReason`: set when it's necessary to further clarify the failure reason

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

`POST /swapstatus`

Request body:

```json
{
  "id": "gnIthU"
}
```

Response:

```json
{
  "status": "transaction.lockupFailed",
  "failureReason": "locked 1396075383 is less than expected 1396075384"
}
```

## Swap Status Stream

To avoid querying the [`/swapstatus`](api.md#swap-status) endpoint regularly to get the latest swap status, this endpoint streams swap status updates via [Server-Side Events](https://www.w3schools.com/html/html5\_serversentevents.asp).

Requests to this endpoint have to provide the required swap `id` parameter via an URL parameter because all requests have to be of the method `GET`.

Every event in the Server-Side stream has data that is encoded exactly like the JSON object of the `/swapstatus` endpoint. Please have a look at the examples below for a reference implementation in JavaScript of handling the stream.

| URL                     | Response                 |
| ----------------------- | ------------------------ |
| `GET /streamswapstatus` | Server-Side event stream |

**Examples:**

Server-Side event streams have to be handled differently from regular HTTP responses. Below is a sample implementation in JavaScript and also what a raw response of a Server-Side event stream looks like.

Sample implementation in JavaScript:

```javascript
var stream = new EventSource(boltzApi + '/streamswapstatus?id=' + swapId);

source.onmessage = function(event) {
  const data = JSON.parse(event.data);

  console.log('Swap status update:' + data.status);
};
```

Raw response:

```
data: {"status":"transaction.mempool"}

data: {"status":"invoice.paid"}
```

##

## Authentication

Boltz API does not require any sort of authentication to perform swaps. However, some API endpoints like [querying referral fees](api.md#querying-referral-fees) for members of our partner program, do.

To authenticate your API request, three request headers have to be set:

* `TS`: current UNIX timestamp (can only deviate from server time by 1 minute at most)
* `API-KEY`: your API key
* `API-HMAC`: SHA256 HMAC encoded as HEX of the following values:
  * value of the `TS` header
  * method of the HTTP request (e.g. `GET` or `POST`)
  * request path, including the leading slash (e.g. `/referrals/query`)
  * if the request method is `POST`, the body of the request

TypeScript Node.js example:

```typescript
import axios from 'axios';
import { createHmac } from 'crypto';

const path = '/referrals/query';

const ts = Math.round(new Date().getTime() / 1000);
const hmac = createHmac('sha256', argv.secret)
  .update(`${ts}GET${path}`)
  .digest('hex');

try {
  const res = await axios.get(`https://${argv.rest.host}:${argv.rest.port}${path}`, {
    headers: {
      'TS': ts,
      'API-KEY': argv.key,
      'API-HMAC': hmac,
    },
  });

  console.log(JSON.stringify(res.data, undefined, 2));
} catch (e) {
  const error = e as any;
  console.log(`${error.message}: ${JSON.stringify(error.response.data)}`);
}
```

## Querying referral fees

Members of the Boltz partner program can request a referral key ([hi@bol.tz](mailto:hi@bol.tz)) to get a percentage of the fees earned from Swaps through their integration. To query for their referrals, they can send an [authenticated](api.md#authentication) request to this endpoint.

| URL                    | Response    |
| ---------------------- | ----------- |
| `GET /referrals/query` | JSON object |

Status Codes:

* `200 OK`
* `401 Unauthorized`: missing or invalid request authentication

Response object:

The response of a valid request is grouped by year, month and referral key.

**Examples:**

`GET /referrals/query`

Response:

```json
{
  "2021": {
    "9": {
      "cliTest": {
        "BTC": 60
      }
    }
  }
}
```
