---
description: >-
  This page introduces Boltz API v2, the latest and recommended API for all
  integrations.
---

# 🤖 REST API v2

## REST Endpoints

The Swagger specifications of the latest Boltz REST API can be found
:point_right: [here](https://api.boltz.exchange/swagger) :point_left: !

## WebSocket

Instead of polling for swap status updates, clients can subscribe to updates
with a WebSocket. The endpoints are available at:

- Testnet: `wss://api.testnet.boltz.exchange/v2/ws`
- Mainnet: `wss://api.boltz.exchange/v2/ws`

To subscribe to swap status updates, send a message like below. `args` is a list
of swap ids to subscribe to.

```json
{
  "op": "subscribe",
  "channel": "swap.update",
  "args": ["swap id 1", "swap id 2"]
}
```

Boltz API will respond with a message like below, to confirm that the
subscription was created successfully.

```json
{
  "event": "subscribe",
  "channel": "swap.update",
  "args": ["swap id 1", "swap id 2"]
}
```

After the initial subscription confirmation message and whenever a swap status
is updated, Boltz API will send a message containing details about the status
update.

`args` is a list of objects. These objects correspond to responses of
`GET /swap/{id}`, but additionally contain the id of the swap.

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

To unsubscribe from the updates of one or more swaps, send an `unsubscribe`
message.

```json
{
  "op": "unsubscribe",
  "channel": "swap.update",
  "args": ["swap id 1"]
}
```

The backend will respond with a message that contains all swap ids the WebSocket
is still subscribed to.

```json
{
  "op": "unsubscribe",
  "channel": "swap.update",
  "args": ["swap id 2"]
}
```

## Examples

Below are some examples covering the flow of a given swap type from beginning to
end, using API v2 and its WebSocket.

## Submarine Swap (Chain -> Lightning)

{% tabs %} {% tab title="TypeScript Bitcoin" %}

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
const webSocketEndpoint = 'ws://127.0.0.1:9004';

// The invoice you want to have paid
const invoice = '<invoice that should be paid>';

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
  const webSocket = new ws(`${webSocketEndpoint}/v2/ws`);
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

{% endtab %}

{% tab title="TypeScript Liquid" %}

```typescript
import zkpInit from '@vulpemventures/secp256k1-zkp';
import axios from 'axios';
import { crypto } from 'bitcoinjs-lib';
import bolt11 from 'bolt11';
import { Musig, SwapTreeSerializer } from 'boltz-core';
import { TaprootUtils } from 'boltz-core/dist/lib/liquid';
import { randomBytes } from 'crypto';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import ws from 'ws';

// Endpoint of the Boltz instance to be used
const endpoint = 'http://127.0.0.1:9001';
const webSocketEndpoint = 'ws://127.0.0.1:9004';

// The invoice you want to have paid
const invoice = '<invoice that should be paid>';

const submarineSwap = async () => {
  const keys = ECPairFactory(ecc).makeRandom();

  // Create a Submarine Swap
  const createdResponse = (
    await axios.post(`${endpoint}/v2/swap/submarine`, {
      invoice,
      to: 'BTC',
      from: 'L-BTC',
      refundPublicKey: keys.publicKey.toString('hex'),
    })
  ).data;

  console.log('Created swap');
  console.log(createdResponse);
  console.log();

  // Create a WebSocket and subscribe to updates for the created swap
  const webSocket = new ws(`${webSocketEndpoint}/v2/ws`);
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

      // Create a partial signature to allow Boltz to do a key path spend to claim the Liquid bitcoin
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

{% endtab %}

{% tab title="TypeScript RBTC" %}

```typescript
import axios from 'axios';
import bolt11 from 'bolt11';
import EtherSwapArtifact from 'boltz-core/out/EtherSwap.sol/EtherSwap.json';
import { EtherSwap } from 'boltz-core/typechain/EtherSwap';
import { Contract, JsonRpcProvider, Wallet } from 'ethers';
import ws from 'ws';

const satoshiWeiFactor = 10n ** 10n;

// Endpoint of the Boltz instance to be used
const endpoint = 'http://127.0.0.1:9001';
const webSocketEndpoint = 'ws://127.0.0.1:9004';

// EVM config
const providerEndpoint = 'http://127.0.0.1:8545';
const signerMnemonic =
  'test test test test test test test test test test test junk';

// The invoice you want to have paid
const invoice =
  'lnbcrt1m1pnkl4sppp5vc2zmdw9x2xr63nngr73da6u863kfhmxc68nm7eycarwq760xgdqdqqcqzzsxqyz5vqsp5vz26y0ckx205lrm2d3mz23ynkp26kshumn0zjvc7xgkjtfh7l8mq9qxpqysgqn45lz8rn990f77ftrk3rvg03dlmnj9ze2ue9p3eypzau84w3wluz2g25ydj94kefur0v8ln6e4f76n29jsqjraatpq0mdazrl5klpdcp5v4dg8';

const submarineSwap = async () => {
  // Create a Submarine Swap
  const createdResponse = (
    await axios.post(`${endpoint}/v2/swap/submarine`, {
      invoice,
      to: 'BTC',
      from: 'RBTC',
    })
  ).data;

  console.log('Created swap');
  console.log(createdResponse);
  console.log();

  // Create a WebSocket and subscribe to updates for the created swap
  const webSocket = new ws(`${webSocketEndpoint}/v2/ws`);
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
        const provider = new JsonRpcProvider(providerEndpoint);

        const contracts = (
          await axios.get(`${endpoint}/v2/chain/RBTC/contracts`)
        ).data;
        const contract = new Contract(
          contracts.swapContracts.EtherSwap,
          EtherSwapArtifact.abi,
          Wallet.fromPhrase(signerMnemonic).connect(provider),
        ) as unknown as EtherSwap;

        const invoicePreimageHash = Buffer.from(
          bolt11
            .decode(invoice)
            .tags.find((tag) => tag.tagName === 'payment_hash')!.data as string,
          'hex',
        );

        const tx = await contract.lock(
          invoicePreimageHash,
          createdResponse.claimAddress,
          createdResponse.timeoutBlockHeight,
          {
            value: BigInt(createdResponse.expectedAmount) * satoshiWeiFactor,
          },
        );
        console.log(`Sent RBTC in: ${tx.hash}`);
        break;
      }

      case 'transaction.claimed':
      // Boltz is batch claiming on EVM chains, so we can treat this status as success
      case 'transaction.claim.pending':
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

{% endtab %}

{% tab title="Go Bitcoin" %}

```go
package main

import (
	"bytes"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"github.com/btcsuite/btcd/btcec/v2"
	"os"

	"github.com/BoltzExchange/boltz-client/v2/pkg/boltz"
	"github.com/lightningnetwork/lnd/zpay32"
)

const endpoint = "<Boltz API endpoint>"
const invoice = "<the invoice you want to pay"

var network = boltz.Regtest

func printJson(v any) {
	b, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}

	fmt.Println(string(b))
}

func submarineSwap() error {
	keys, err := btcec.NewPrivateKey()
	if err != nil {
		return err
	}

	boltzApi := &boltz.Api{URL: endpoint}

	swap, err := boltzApi.CreateSwap(boltz.CreateSwapRequest{
		From:            boltz.CurrencyBtc,
		To:              boltz.CurrencyBtc,
		RefundPublicKey: keys.PubKey().SerializeCompressed(),
		Invoice:         invoice,
	})
	if err != nil {
		return fmt.Errorf("Could not create swap: %s", err)
	}

	boltzPubKey, err := btcec.ParsePubKey(swap.ClaimPublicKey)
	if err != nil {
		return err
	}

	tree := swap.SwapTree.Deserialize()
	if err := tree.Init(boltz.CurrencyBtc, false, keys, boltzPubKey); err != nil {
		return err
	}

	decodedInvoice, err := zpay32.Decode(invoice, network.Btc)
	if err != nil {
		return fmt.Errorf("could not decode swap invoice: %s", err)
	}

	// Check the scripts of the Taptree to make sure Boltz is not cheating
	if err := tree.Check(boltz.NormalSwap, swap.TimeoutBlockHeight, decodedInvoice.PaymentHash[:]); err != nil {
		return err
	}

	// Verify that Boltz is giving us the correct address
	if err := tree.CheckAddress(swap.Address, network, nil); err != nil {
		return err
	}

	fmt.Println("Swap created")
	printJson(swap)

	boltzWs := boltzApi.NewWebsocket()
	if err := boltzWs.Connect(); err != nil {
		return fmt.Errorf("Could not connect to Boltz websocket: %s", err)
	}

	if err := boltzWs.Subscribe([]string{swap.Id}); err != nil {
		return err
	}

	for update := range boltzWs.Updates {
		parsedStatus := boltz.ParseEvent(update.Status)

		printJson(update)

		switch parsedStatus {
		case boltz.InvoiceSet:
			fmt.Println("Waiting for onchain transaction")
			break

		case boltz.TransactionMempool:
			fmt.Println("Boltz found transaction in mempool")
			break

		case boltz.TransactionConfirmed:
			fmt.Println("Boltz found transaction in blockchain")
			break

		case boltz.TransactionClaimPending:
			// Create a partial signature to allow Boltz to do a key path spend to claim the onchain coins
			claimDetails, err := boltzApi.GetSwapClaimDetails(swap.Id)
			if err != nil {
				return fmt.Errorf("Could not get claim details from Boltz: %s", err)
			}

			// Verify that the invoice was actually paid
			preimageHash := sha256.Sum256(claimDetails.Preimage)
			if !bytes.Equal(decodedInvoice.PaymentHash[:], preimageHash[:]) {
				return fmt.Errorf("Boltz returned wrong preimage: %x", claimDetails.Preimage)
			}

			session, err := boltz.NewSigningSession(tree)
			partial, err := session.Sign(claimDetails.TransactionHash, claimDetails.PubNonce)
			if err != nil {
				return fmt.Errorf("could not create partial signature: %s", err)
			}

			if err := boltzApi.SendSwapClaimSignature(swap.Id, partial); err != nil {
				return fmt.Errorf("could not send partial signature to Boltz: %s", err)
			}
			break

		case boltz.TransactionClaimed:
			fmt.Println("Swap succeeded", swap.Id)
			if err := boltzWs.Close(); err != nil {
				return err
			}
			break
		}

	}

	return nil
}

func main() {
	if err := submarineSwap(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}
```

{% endtab %} {% endtabs %}

## Reverse Swap (Lightning -> Chain)

{% tabs %} {% tab title="TypeScript Bitcoin" %}

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
const webSocketEndpoint = 'ws://127.0.0.1:9004';

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

  // Create a Reverse Swap
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
  const webSocket = new ws(`${webSocketEndpoint}/v2/ws`);
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

      // "transaction.mempool" means that Boltz sent an onchain transaction
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

{% endtab %}

{% tab title="TypeScript Liquid" %}

```typescript
import zkpInit from '@vulpemventures/secp256k1-zkp';
import axios from 'axios';
import {
  Musig,
  OutputType,
  SwapTreeSerializer,
  detectSwap,
  targetFee,
} from 'boltz-core';
import {
  TaprootUtils,
  constructClaimTransaction,
  init,
} from 'boltz-core/dist/lib/liquid';
import { randomBytes } from 'crypto';
import { ECPairFactory } from 'ecpair';
import { Transaction, address, crypto, networks } from 'liquidjs-lib';
import * as ecc from 'tiny-secp256k1';
import ws from 'ws';

// Endpoint of the Boltz instance to be used
const endpoint = 'http://127.0.0.1:9001';
const webSocketEndpoint = 'ws://127.0.0.1:9004';

// Amount you want to swap
const invoiceAmount = 100_000;

// Address to which the swap should be claimed
const destinationAddress = '<Liquid address>';

const network = networks.regtest;

const reverseSwap = async () => {
  const zkp = await zkpInit();
  init(zkp);

  // Create a random preimage for the swap; has to have a length of 32 bytes
  const preimage = randomBytes(32);
  const keys = ECPairFactory(ecc).makeRandom();

  // Create a Reverse Swap
  const createdResponse = (
    await axios.post(`${endpoint}/v2/swap/reverse`, {
      invoiceAmount,
      to: 'L-BTC',
      from: 'BTC',
      claimPublicKey: keys.publicKey.toString('hex'),
      preimageHash: crypto.sha256(preimage).toString('hex'),
    })
  ).data;

  console.log('Created swap');
  console.log(createdResponse);
  console.log();

  // Create a WebSocket and subscribe to updates for the created swap
  const webSocket = new ws(`${webSocketEndpoint}/v2/ws`);
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

      // "transaction.mempool" means that Boltz sent an onchain transaction
      case 'transaction.mempool': {
        console.log('Creating claim transaction');

        const boltzPublicKey = Buffer.from(
          createdResponse.refundPublicKey,
          'hex',
        );

        // Create a musig signing session and tweak it with the Taptree of the swap scripts
        const musig = new Musig(zkp, keys, randomBytes(32), [
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
        const claimTx = targetFee(0.1, (fee) =>
          constructClaimTransaction(
            [
              {
                ...swapOutput,
                keys,
                preimage,
                cooperative: true,
                type: OutputType.Taproot,
                txHash: lockupTx.getHash(),
                blindingPrivateKey: Buffer.from(
                  createdResponse.blindingKey,
                  'hex',
                ),
              },
            ],
            address.toOutputScript(destinationAddress, network),
            fee,
            false,
            network,
            address.fromConfidential(destinationAddress).blindingKey,
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
            [{ value: swapOutput.value, asset: swapOutput.asset }],
            Transaction.SIGHASH_DEFAULT,
            network.genesisBlockHash,
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
        await axios.post(`${endpoint}/v2/chain/L-BTC/transaction`, {
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

{% endtab %}

{% tab title="TypeScript RBTC" %}

```typescript
import axios from 'axios';
import { crypto } from 'bitcoinjs-lib';
import EtherSwapArtifact from 'boltz-core/out/EtherSwap.sol/EtherSwap.json';
import { EtherSwap } from 'boltz-core/typechain/EtherSwap';
import { randomBytes } from 'crypto';
import { Contract, JsonRpcProvider, Wallet } from 'ethers';
import ws from 'ws';

const satoshiWeiFactor = 10n ** 10n;

// Endpoint of the Boltz instance to be used
const endpoint = 'http://127.0.0.1:9001';
const webSocketEndpoint = 'ws://127.0.0.1:9004';

// EVM config
const providerEndpoint = 'http://127.0.0.1:8545';
const signerMnemonic =
  'test test test test test test test test test test test junk';

// Amount you want to swap
const invoiceAmount = 100_000;

const reverseSwap = async () => {
  // Create a random preimage for the swap; has to have a length of 32 bytes
  const preimage = randomBytes(32);

  const signer = Wallet.fromPhrase(signerMnemonic);

  // Create a Reverse Swap
  const createdResponse = (
    await axios.post(`${endpoint}/v2/swap/reverse`, {
      invoiceAmount,
      to: 'RBTC',
      from: 'BTC',
      claimAddress: await signer.getAddress(),
      preimageHash: crypto.sha256(preimage).toString('hex'),
    })
  ).data;

  console.log('Created swap');
  console.log(createdResponse);
  console.log();

  // Create a WebSocket and subscribe to updates for the created swap
  const webSocket = new ws(`${webSocketEndpoint}/v2/ws`);
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
      case 'swap.created': {
        console.log('Waiting for invoice to be paid');
        break;
      }

      // "transaction.confirmed" means we can claim the RBTC
      case 'transaction.confirmed': {
        const provider = new JsonRpcProvider(providerEndpoint);

        const contracts = (
          await axios.get(`${endpoint}/v2/chain/RBTC/contracts`)
        ).data;
        const contract = new Contract(
          contracts.swapContracts.EtherSwap,
          EtherSwapArtifact.abi,
          signer.connect(provider),
        ) as unknown as EtherSwap;

        const tx = await contract['claim(bytes32,uint256,address,uint256)'](
          preimage,
          BigInt(createdResponse.onchainAmount) * satoshiWeiFactor,
          createdResponse.refundAddress,
          createdResponse.timeoutBlockHeight,
        );
        console.log(`Claimed RBTC in: ${tx.hash}`);
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

{% endtab %}

{% tab title="Go Bitcoin" %}

```go
package main

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"os"

	"github.com/BoltzExchange/boltz-client/v2/pkg/boltz"
	"github.com/btcsuite/btcd/btcec/v2"
)

const endpoint = "<Boltz API endpoint>"
const invoiceAmount = 100000
const destinationAddress = "<address to which the swap should be claimed>"

// Swap from Lightning to BTC mainchain
var toCurrency = boltz.CurrencyBtc

var network = boltz.Regtest

func printJson(v interface{}) {
	b, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}

	fmt.Println(string(b))
}

func reverseSwap() error {
	ourKeys, err := btcec.NewPrivateKey()
	if err != nil {
		return err
	}

	preimage := make([]byte, 32)
	_, err = rand.Read(preimage)
	if err != nil {
		return err
	}
	preimageHash := sha256.Sum256(preimage)

	boltzApi := &boltz.Api{URL: endpoint}

	swap, err := boltzApi.CreateReverseSwap(boltz.CreateReverseSwapRequest{
		From:           boltz.CurrencyBtc,
		To:             toCurrency,
		ClaimPublicKey: ourKeys.PubKey().SerializeCompressed(),
		PreimageHash:   preimageHash[:],
		InvoiceAmount:  invoiceAmount,
	})
	if err != nil {
		return fmt.Errorf("Could not create swap: %s", err)
	}

	boltzPubKey, err := btcec.ParsePubKey(swap.RefundPublicKey)
	if err != nil {
		return err
	}

	tree := swap.SwapTree.Deserialize()
	if err := tree.Init(toCurrency, false, ourKeys, boltzPubKey); err != nil {
		return err
	}

	if err := tree.Check(boltz.ReverseSwap, swap.TimeoutBlockHeight, preimageHash[:]); err != nil {
		return err
	}

	fmt.Println("Swap created")
	printJson(swap)

	boltzWs := boltzApi.NewWebsocket()
	if err := boltzWs.Connect(); err != nil {
		return fmt.Errorf("Could not connect to Boltz websocket: %w", err)
	}

	if err := boltzWs.Subscribe([]string{swap.Id}); err != nil {
		return err
	}

	for update := range boltzWs.Updates {
		parsedStatus := boltz.ParseEvent(update.Status)

		printJson(update)

		switch parsedStatus {
		case boltz.SwapCreated:
			fmt.Println("Waiting for invoice to be paid")
			break

		case boltz.TransactionMempool:
			lockupTransaction, err := boltz.NewTxFromHex(toCurrency, update.Transaction.Hex, nil)
			if err != nil {
				return err
			}

			vout, _, err := lockupTransaction.FindVout(network, swap.LockupAddress)
			if err != nil {
				return err
			}

			satPerVbyte := float64(2)
			claimTransaction, _, err := boltz.ConstructTransaction(
				network,
				boltz.CurrencyBtc,
				[]boltz.OutputDetails{
					{
						SwapId:            swap.Id,
						SwapType:          boltz.ReverseSwap,
						Address:           destinationAddress,
						LockupTransaction: lockupTransaction,
						Vout:              vout,
						Preimage:          preimage,
						PrivateKey:        ourKeys,
						SwapTree:          tree,
						Cooperative:       true,
					},
				},
				satPerVbyte,
				boltzApi,
			)
			if err != nil {
				return fmt.Errorf("could not create claim transaction: %w", err)
			}

			txHex, err := claimTransaction.Serialize()
			if err != nil {
				return fmt.Errorf("could not serialize claim transaction: %w", err)
			}

			txId, err := boltzApi.BroadcastTransaction(toCurrency, txHex)
			if err != nil {
				return fmt.Errorf("could not broadcast transaction: %w", err)
			}

			fmt.Printf("Broadcast claim transaction: %s\n", txId)
			break

		case boltz.InvoiceSettled:
			fmt.Println("Swap succeeded", swap.Id)
			if err := boltzWs.Close(); err != nil {
				return err
			}
			break
		}
	}
	return nil
}

func main() {
	if err := reverseSwap(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}
```

{% endtab %} {% endtabs %}

## Chain Swap (Chain -> Chain)

{% tabs %} {% tab title="TypeScript Bitcoin -> Liquid" %}

```typescript
import zkpInit, { Secp256k1ZKP } from '@vulpemventures/secp256k1-zkp';
import axios from 'axios';
import {
  Musig,
  OutputType,
  SwapTreeSerializer,
  TaprootUtils,
  detectSwap,
  targetFee,
} from 'boltz-core';
import {
  TaprootUtils as LiquidTaprootUtils,
  constructClaimTransaction,
  init,
} from 'boltz-core/dist/lib/liquid';
import { randomBytes } from 'crypto';
import { ECPairFactory, ECPairInterface } from 'ecpair';
import { Transaction, address, crypto, networks } from 'liquidjs-lib';
import * as ecc from 'tiny-secp256k1';
import ws from 'ws';

// Endpoint of the Boltz instance to be used
const endpoint = 'http://127.0.0.1:9001';
const webSocketEndpoint = 'ws://127.0.0.1:9004';

// Amount you want to swap
const userLockAmount = 100_000;

// Address to which the swap should be claimed
const destinationAddress = '<Liquid address>';

const network = networks.regtest;

const createClaimTransaction = (
  zkp: Secp256k1ZKP,
  claimKeys: ECPairInterface,
  preimage: Buffer,
  createdResponse: any,
  lockupTransactionHex: string,
) => {
  const boltzPublicKey = Buffer.from(
    createdResponse.claimDetails.serverPublicKey,
    'hex',
  );

  // Create a musig signing session and tweak it with the Taptree of the swap scripts
  const musig = new Musig(zkp, claimKeys, randomBytes(32), [
    boltzPublicKey,
    claimKeys.publicKey,
  ]);
  const tweakedKey = LiquidTaprootUtils.tweakMusig(
    musig,
    SwapTreeSerializer.deserializeSwapTree(
      createdResponse.claimDetails.swapTree,
    ).tree,
  );

  // Parse the lockup transaction and find the output relevant for the swap
  const lockupTx = Transaction.fromHex(lockupTransactionHex);
  const swapOutput = detectSwap(tweakedKey, lockupTx);
  if (swapOutput === undefined) {
    throw 'No swap output found in lockup transaction';
  }

  // Create a claim transaction to be signed cooperatively via a key path spend
  const transaction = targetFee(2, (fee) =>
    constructClaimTransaction(
      [
        {
          ...swapOutput,
          preimage,
          keys: claimKeys,
          cooperative: true,
          type: OutputType.Taproot,
          txHash: lockupTx.getHash(),
          blindingPrivateKey: Buffer.from(
            createdResponse.claimDetails.blindingKey,
            'hex',
          ),
        },
      ],
      address.toOutputScript(destinationAddress, network),
      fee,
      false,
      network,
      address.fromConfidential(destinationAddress).blindingKey,
    ),
  );

  return { musig, transaction, swapOutput, boltzPublicKey };
};

const getBoltzPartialSignature = async (
  zkp: Secp256k1ZKP,
  refundKeys: ECPairInterface,
  preimage: Buffer,
  createdResponse: any,
  claimPubNonce: Buffer,
  claimTransaction: Transaction,
) => {
  const serverClaimDetails = (
    await axios.get(`${endpoint}/v2/swap/chain/${createdResponse.id}/claim`)
  ).data;

  // Sign the claim transaction of the server
  const boltzPublicKey = Buffer.from(
    createdResponse.lockupDetails.serverPublicKey,
    'hex',
  );

  const musig = new Musig(zkp, refundKeys, randomBytes(32), [
    boltzPublicKey,
    refundKeys.publicKey,
  ]);
  TaprootUtils.tweakMusig(
    musig,
    SwapTreeSerializer.deserializeSwapTree(
      createdResponse.lockupDetails.swapTree,
    ).tree,
  );

  musig.aggregateNonces([
    [boltzPublicKey, Buffer.from(serverClaimDetails.pubNonce, 'hex')],
  ]);
  musig.initializeSession(
    Buffer.from(serverClaimDetails.transactionHash, 'hex'),
  );
  const partialSig = musig.signPartial();

  // When the server is happy with our signature, we get its partial signature
  // for our transaction in return
  const ourClaimDetails = (
    await axios.post(`${endpoint}/v2/swap/chain/${createdResponse.id}/claim`, {
      preimage: preimage.toString('hex'),
      signature: {
        partialSignature: Buffer.from(partialSig).toString('hex'),
        pubNonce: Buffer.from(musig.getPublicNonce()).toString('hex'),
      },
      toSign: {
        index: 0,
        transaction: claimTransaction.toHex(),
        pubNonce: claimPubNonce.toString('hex'),
      },
    })
  ).data;

  return {
    pubNonce: Buffer.from(ourClaimDetails.pubNonce, 'hex'),
    partialSignature: Buffer.from(ourClaimDetails.partialSignature, 'hex'),
  };
};

const chainSwap = async () => {
  const zkp = await zkpInit();
  init(zkp);

  // Create a random preimage for the swap; has to have a length of 32 bytes
  const preimage = randomBytes(32);
  const claimKeys = ECPairFactory(ecc).makeRandom();
  const refundKeys = ECPairFactory(ecc).makeRandom();

  // Create a Chain Swap
  const createdResponse = (
    await axios.post(`${endpoint}/v2/swap/chain`, {
      userLockAmount,
      to: 'L-BTC',
      from: 'BTC',
      preimageHash: crypto.sha256(preimage).toString('hex'),
      claimPublicKey: claimKeys.publicKey.toString('hex'),
      refundPublicKey: refundKeys.publicKey.toString('hex'),
    })
  ).data;

  console.log('Created swap');
  console.log(createdResponse);
  console.log();

  // Create a WebSocket and subscribe to updates for the created swap
  const webSocket = new ws(`${webSocketEndpoint}/v2/ws`);
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
      // "swap.created" means Boltz is waiting for coins to be locked
      case 'swap.created': {
        console.log('Waiting for coins to be locked');
        break;
      }

      // "transaction.server.mempool" means that Boltz sent an onchain transaction
      case 'transaction.server.mempool': {
        console.log('Creating claim transaction');

        const claimDetails = createClaimTransaction(
          zkp,
          claimKeys,
          preimage,
          createdResponse,
          msg.args[0].transaction.hex,
        );

        // Get the partial signature from Boltz
        const boltzPartialSig = await getBoltzPartialSignature(
          zkp,
          refundKeys,
          preimage,
          createdResponse,
          Buffer.from(claimDetails.musig.getPublicNonce()),
          claimDetails.transaction,
        );

        // Aggregate the nonces
        claimDetails.musig.aggregateNonces([
          [claimDetails.boltzPublicKey, boltzPartialSig.pubNonce],
        ]);

        // Initialize the session to sign the claim transaction
        claimDetails.musig.initializeSession(
          claimDetails.transaction.hashForWitnessV1(
            0,
            [claimDetails.swapOutput.script],
            [
              {
                value: claimDetails.swapOutput.value,
                asset: claimDetails.swapOutput.asset,
              },
            ],
            Transaction.SIGHASH_DEFAULT,
            network.genesisBlockHash,
          ),
        );

        // Add the partial signature from Boltz
        claimDetails.musig.addPartial(
          claimDetails.boltzPublicKey,
          boltzPartialSig.partialSignature,
        );

        // Create our partial signature
        claimDetails.musig.signPartial();

        // Witness of the input to the aggregated signature
        claimDetails.transaction.ins[0].witness = [
          claimDetails.musig.aggregatePartials(),
        ];

        // Broadcast the finalized transaction
        await axios.post(`${endpoint}/v2/chain/L-BTC/transaction`, {
          hex: claimDetails.transaction.toHex(),
        });

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
  await chainSwap();
})();
```

{% endtab %}

{% tab title="TypeScript Bitcoin -> RBTC" %}

```typescript
import zkpInit from '@vulpemventures/secp256k1-zkp';
import axios from 'axios';
import { crypto } from 'bitcoinjs-lib';
import { Musig, SwapTreeSerializer, TaprootUtils } from 'boltz-core';
import EtherSwapArtifact from 'boltz-core/out/EtherSwap.sol/EtherSwap.json';
import { EtherSwap } from 'boltz-core/typechain/EtherSwap';
import { randomBytes } from 'crypto';
import ECPairFactory from 'ecpair';
import { Contract, JsonRpcProvider, Wallet } from 'ethers';
import * as ecc from 'tiny-secp256k1';
import ws from 'ws';

const satoshiWeiFactor = 10n ** 10n;

// Endpoint of the Boltz instance to be used
const endpoint = 'http://127.0.0.1:9001';
const webSocketEndpoint = 'ws://127.0.0.1:9004';

// Amount you want to swap
const userLockAmount = 100_000;

// EVM config
const providerEndpoint = 'http://127.0.0.1:8545';
const signerMnemonic =
  'test test test test test test test test test test test junk';

const chainSwap = async () => {
  // Create a random preimage for the swap; has to have a length of 32 bytes
  const preimage = randomBytes(32);

  const refundKeys = ECPairFactory(ecc).makeRandom();

  const signer = Wallet.fromPhrase(signerMnemonic);

  const createdResponse = (
    await axios.post(`${endpoint}/v2/swap/chain`, {
      userLockAmount,
      to: 'RBTC',
      from: 'BTC',
      claimAddress: await signer.getAddress(),
      preimageHash: crypto.sha256(preimage).toString('hex'),
      refundPublicKey: refundKeys.publicKey.toString('hex'),
    })
  ).data;

  console.log('Created swap');
  console.log(createdResponse);
  console.log();

  const webSocket = new ws(`${webSocketEndpoint}/v2/ws`);
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
      case 'swap.created': {
        console.log('Waiting for coins to be locked');
        break;
      }

      // "transaction.server.confirmed" means we can claim the RBTC
      case 'transaction.server.confirmed': {
        const provider = new JsonRpcProvider(providerEndpoint);

        const contracts = (
          await axios.get(`${endpoint}/v2/chain/RBTC/contracts`)
        ).data;
        const contract = new Contract(
          contracts.swapContracts.EtherSwap,
          EtherSwapArtifact.abi,
          signer.connect(provider),
        ) as unknown as EtherSwap;

        const tx = await contract['claim(bytes32,uint256,address,uint256)'](
          preimage,
          BigInt(createdResponse.claimDetails.amount) * satoshiWeiFactor,
          createdResponse.claimDetails.refundAddress,
          createdResponse.claimDetails.timeoutBlockHeight,
        );
        console.log(`Claimed RBTC in: ${tx.hash}`);
        break;
      }

      // We can help the server claim the BTC cooperatively in this status,
      // else the server will batch claim via script path on interval
      case 'transaction.claim.pending': {
        const claimDetails = (
          await axios.get(
            `${endpoint}/v2/swap/chain/${createdResponse.id}/claim`,
          )
        ).data;
        const boltzPubicKey = Buffer.from(claimDetails.publicKey, 'hex');

        const musig = new Musig(await zkpInit(), refundKeys, randomBytes(32), [
          boltzPubicKey,
          refundKeys.publicKey,
        ]);
        TaprootUtils.tweakMusig(
          musig,
          SwapTreeSerializer.deserializeSwapTree(
            createdResponse.lockupDetails.swapTree,
          ).tree,
        );
        musig.aggregateNonces([
          [boltzPubicKey, Buffer.from(claimDetails.pubNonce, 'hex')],
        ]);
        musig.initializeSession(
          Buffer.from(claimDetails.transactionHash, 'hex'),
        );

        const partialSignature = musig.signPartial();

        await axios.post(
          `${endpoint}/v2/swap/chain/${createdResponse.id}/claim`,
          {
            signature: {
              pubNonce: Buffer.from(musig.getPublicNonce()).toString('hex'),
              partialSignature: Buffer.from(partialSignature).toString('hex'),
            },
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
  await chainSwap();
})();
```

{% endtab %} {% endtabs %}
