---
description: This page introduces Boltz API v2
---

# 🤖 REST API v2

## REST endpoints

The Swagger specifications of the latest Boltz REST API can be found [here](https://api.boltz.exchange/swagger).

## WebSocket

Instead of polling for swap status updates, clients can subscribe to updates with a WebSocket. The endpoints are available at:

* Testnet: `wss://api.testnet.boltz.exchange/v2/ws`
* Mainnet: `wss://api.boltz.exchange/v2/ws`

To subscribe to swap status updates, send a message like below. `args` is a list of swap ids to subscribe to.

```json
{
  "op": "subscribe",
  "channel": "swap.update",
  "args": [
    "swap id 1",
    "swap id 2"
  ]
}
```

Boltz API will respond with a message like below, to confirm that the subscription was created successfully.

```json
{
  "event": "subscribe",
  "channel": "swap.update",
  "args": [
    "swap id 1",
    "swap id 2"
  ]
}
```

After the initial subscription confirmation message and whenever a swap status is updated, Boltz API will send a message containing details about the status update.

```json
{
  "event": "update",
  "channel": "swap.update",
  "args": [
    {
      "id": "swap id 1",
      "status": "invoice.set"
    }
  ]
}
```

`args` is a list of objects. These objects correspond to responses of `GET /swap/{id}`, but additionally contain the id of the swap.

## Examples

Below are some examples covering the flow of a given swap type from beginning to end, using API v2 and its WebSocket. The provided examples are written in [TypeScript](https://www.typescriptlang.org/) and can be run with [Node.js](https://nodejs.org/).

## Submarine Swap

Swap from the Bitcoin mainchain to Lightning.

```typescript
import zkpInit from '@vulpemventures/secp256k1-zkp';
import axios from 'axios';
import { crypto } from 'bitcoinjs-lib';
import bolt11 from 'bolt11';
import { Musig, SwapTreeSerializer, TaprootUtils } from 'boltz-core';
import { randomBytes } from 'crypto';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import ws from 'ws';

// Endpoint of the Boltz instance to be used
const endpoint = 'http://127.0.0.1:9001';

// The invoice you want to have paid
const invoice = '<invoice that should be pair>';

const submarineSwap = async () => {
  const keys = ECPairFactory(ecc).makeRandom();

  // Create a Submarine Swap
  const createdResponse = (
    await axios.post(`${endpoint}/v2/swap/submarine`, {
      invoice,
      to: 'BTC',
      from: 'BTC',
      refundPublicKey: keys.publicKey.toString('hex'),
    })
  ).data;

  console.log('Created swap');
  console.log(createdResponse);
  console.log();

  // Create a WebSocket and subscribe to updates for the created swap
  const webSocket = new ws(`${endpoint.replace('http://', 'ws://')}/v2/ws`);
  webSocket.on('open', () => {
    webSocket.send(
      JSON.stringify({
        op: 'subscribe',
        channel: 'swap.update',
        args: [createdResponse.id],
      }),
    );
  });

  webSocket.on('message', async (rawMsg) => {
    const msg = JSON.parse(rawMsg.toString('utf-8'));
    if (msg.event !== 'update') {
      return;
    }

    console.log('Got WebSocket update');
    console.log(msg);
    console.log();

    switch (msg.args[0].status) {
      // "invoice.set" means Boltz is waiting for an onchain transaction to be sent
      case 'invoice.set': {
        console.log('Waiting for onchain transaction');
        break;
      }

      // Create a partial signature to allow Boltz to do a key path spend to claim the mainchain coins
      case 'transaction.claim.pending': {
        console.log('Creating cooperative claim transaction');

        // Get the information request to create a partial signature
        const claimTxDetails = (
          await axios.get(
            `${endpoint}/v2/swap/submarine/${createdResponse.id}/claim`,
          )
        ).data;

        // Verify that Boltz actually paid the invoice by comparing the preimage hash
        // of the invoice to the SHA256 hash of the preimage from the response
        const invoicePreimageHash = Buffer.from(
          bolt11
            .decode(invoice)
            .tags.find((tag) => tag.tagName === 'payment_hash')!.data as string,
          'hex',
        );
        if (
          !crypto
            .sha256(Buffer.from(claimTxDetails.preimage, 'hex'))
            .equals(invoicePreimageHash)
        ) {
          console.error('Boltz provided invalid preimage');
          return;
        }

        const boltzPublicKey = Buffer.from(
          createdResponse.claimPublicKey,
          'hex',
        );

        // Create a musig signing instance
        const musig = new Musig(await zkpInit(), keys, randomBytes(32), [
          boltzPublicKey,
          keys.publicKey,
        ]);
        // Tweak that musig with the Taptree of the swap scripts
        TaprootUtils.tweakMusig(
          musig,
          SwapTreeSerializer.deserializeSwapTree(createdResponse.swapTree).tree,
        );

        // Aggregate the nonces
        musig.aggregateNonces([
          [boltzPublicKey, Buffer.from(claimTxDetails.pubNonce, 'hex')],
        ]);
        // Initialize the session to sign the transaction hash from the response
        musig.initializeSession(
          Buffer.from(claimTxDetails.transactionHash, 'hex'),
        );

        // Give our public nonce and the partial signature to Boltz
        await axios.post(
          `${endpoint}/v2/swap/submarine/${createdResponse.id}/claim`,
          {
            pubNonce: Buffer.from(musig.getPublicNonce()).toString('hex'),
            partialSignature: Buffer.from(musig.signPartial()).toString('hex'),
          },
        );

        break;
      }

      case 'transaction.claimed':
        console.log('Swap successful');
        webSocket.close();
        break;
    }
  });
};

(async () => {
  await submarineSwap();
})();
```

## Reverse Swap

Swap from Lightning to the Bitcoin mainchain.

```typescript
import zkpInit from '@vulpemventures/secp256k1-zkp';
import axios from 'axios';
import {
  Transaction,
  address,
  crypto,
  initEccLib,
  networks,
} from 'bitcoinjs-lib';
import {
  Musig,
  OutputType,
  SwapTreeSerializer,
  TaprootUtils,
  constructClaimTransaction,
  detectSwap,
  targetFee,
} from 'boltz-core';
import { randomBytes } from 'crypto';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import ws from 'ws';

// Endpoint of the Boltz instance to be used
const endpoint = 'http://127.0.0.1:9001';

// Amount you want to swap
const invoiceAmount = 100_000;

// Address to which the swap should be claimed
const destinationAddress = '<Bitcoin address>';

const network = networks.regtest;

const reverseSwap = async () => {
  initEccLib(ecc);

  // Create a random preimage for the swap; has to have a length of 32 bytes
  const preimage = randomBytes(32);
  const keys = ECPairFactory(ecc).makeRandom();

  // Create a Submarine Swap
  const createdResponse = (
    await axios.post(`${endpoint}/v2/swap/reverse`, {
      invoiceAmount,
      to: 'BTC',
      from: 'BTC',
      claimPublicKey: keys.publicKey.toString('hex'),
      preimageHash: crypto.sha256(preimage).toString('hex'),
    })
  ).data;

  console.log('Created swap');
  console.log(createdResponse);
  console.log();

  // Create a WebSocket and subscribe to updates for the created swap
  const webSocket = new ws(`${endpoint.replace('http://', 'ws://')}/v2/ws`);
  webSocket.on('open', () => {
    webSocket.send(
      JSON.stringify({
        op: 'subscribe',
        channel: 'swap.update',
        args: [createdResponse.id],
      }),
    );
  });

  webSocket.on('message', async (rawMsg) => {
    const msg = JSON.parse(rawMsg.toString('utf-8'));
    if (msg.event !== 'update') {
      return;
    }

    console.log('Got WebSocket update');
    console.log(msg);
    console.log();

    switch (msg.args[0].status) {
      // "swap.created" means Boltz is waiting for the invoice to be paid
      case 'swap.created': {
        console.log('Waiting invoice to be paid');
        break;
      }

      // "transaction.mempool" means that Boltz send an onchain transaction
      case 'transaction.mempool': {
        console.log('Creating claim transaction');

        const boltzPublicKey = Buffer.from(
          createdResponse.refundPublicKey,
          'hex',
        );

        // Create a musig signing session and tweak it with the Taptree of the swap scripts
        const musig = new Musig(await zkpInit(), keys, randomBytes(32), [
          boltzPublicKey,
          keys.publicKey,
        ]);
        const tweakedKey = TaprootUtils.tweakMusig(
          musig,
          SwapTreeSerializer.deserializeSwapTree(createdResponse.swapTree).tree,
        );

        // Parse the lockup transaction and find the output relevant for the swap
        const lockupTx = Transaction.fromHex(msg.args[0].transaction.hex);
        const swapOutput = detectSwap(tweakedKey, lockupTx);
        if (swapOutput === undefined) {
          console.error('No swap output found in lockup transaction');
          return;
        }

        // Create a claim transaction to be signed cooperatively via a key path spend
        const claimTx = targetFee(2, (fee) =>
          constructClaimTransaction(
            [
              {
                ...swapOutput,
                keys,
                preimage,
                cooperative: true,
                type: OutputType.Taproot,
                txHash: lockupTx.getHash(),
              },
            ],
            address.toOutputScript(destinationAddress, network),
            fee,
          ),
        );

        // Get the partial signature from Boltz
        const boltzSig = (
          await axios.post(
            `${endpoint}/v2/swap/reverse/${createdResponse.id}/claim`,
            {
              index: 0,
              transaction: claimTx.toHex(),
              preimage: preimage.toString('hex'),
              pubNonce: Buffer.from(musig.getPublicNonce()).toString('hex'),
            },
          )
        ).data;

        // Aggregate the nonces
        musig.aggregateNonces([
          [boltzPublicKey, Buffer.from(boltzSig.pubNonce, 'hex')],
        ]);

        // Initialize the session to sign the claim transaction
        musig.initializeSession(
          claimTx.hashForWitnessV1(
            0,
            [swapOutput.script],
            [swapOutput.value],
            Transaction.SIGHASH_DEFAULT,
          ),
        );

        // Add the partial signature from Boltz
        musig.addPartial(
          boltzPublicKey,
          Buffer.from(boltzSig.partialSignature, 'hex'),
        );

        // Create our partial signature
        musig.signPartial();

        // Witness of the input to the aggregated signature
        claimTx.ins[0].witness = [musig.aggregatePartials()];

        // Broadcast the finalized transaction
        await axios.post(`${endpoint}/v2/chain/BTC/transaction`, {
          hex: claimTx.toHex(),
        });

        break;
      }

      case 'invoice.settled':
        console.log('Swap successful');
        webSocket.close();
        break;
    }
  });
};

(async () => {
  await reverseSwap();
})();
```