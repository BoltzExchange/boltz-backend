# 🤖 REST API (latest)

This page introduces Boltz API v2, the latest and recommended API for all
integrations.

## REST Endpoints

The Swagger specifications of the latest Boltz REST API can be found
:point_right: [here](https://api.boltz.exchange/swagger) :point_left:!

## Examples

Below are some examples covering the flow of a given swap type from beginning to
end, using API v2 and its WebSocket. **The examples are not feature-complete, do
not cover all edge cases and are not to be used in production as-is.**

<!-- TODO: import code snippets from type checked and tested files -->

### Submarine Swap (Chain -> Lightning)

::: code-group

```typescript [TypeScript Bitcoin]
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

```typescript [TypeScript Liquid]
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

```typescript [TypeScript RBTC]
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

<<< @/fetched/submarine.go [Go Bitcoin]

:::

### Reverse Swap (Lightning -> Chain)

::: code-group

```typescript [TypeScript Bitcoin]
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

```typescript [TypeScript Liquid]
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

```typescript [TypeScript RBTC]
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

<<< @/fetched/reverse.go [Go Bitcoin]

:::

### Chain Swap (Chain -> Chain)

::: code-group

```typescript [TypeScript Bitcoin -> Liquid]
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

```typescript [TypeScript Bitcoin -> RBTC]
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

:::

## WebSocket

The mainnet endpoint is available at: `wss://api.boltz.exchange/v2/ws`

### Swap Updates

Instead of polling for swap status updates, clients can subscribe to updates
with a WebSocket.

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

### BOLT12 Invoice Requests

Clients can subscribe to invoice requests for BOLT12 offers they created via
WebSockets. That is alternative to webhook calls for environments that can't
receive webhook calls.

To subscribe to invoice requests for specific offers, send a message like below.
`args` is a list of objects, each containing the BOLT12 `offer` string and a
schnorr signature by the signing key of the offer of the SHA256 hash of
`SUBSCRIBE` serialized as HEX.

```json
{
  "op": "subscribe",
  "channel": "invoice.request",
  "args": [
    {
      "offer": "lno1...",
      "signature": "0fcdee..."
    }
  ]
}
```

Boltz API will respond with a message like below to confirm the subscription,
echoing the subscribed offers.

```json
{
  "event": "subscribe",
  "channel": "invoice.request",
  "args": ["lno1..."]
}
```

When an invoice for one of the subscribed offers is requested, it will send an
`invoice.request` event. This message includes an unique `id` for this specific
request, the `offer` for which an invoice is requested and the `invoiceRequest`
itself serialized as HEX.

```json
{
  "event": "request",
  "channel": "invoice.request",
  "args": [
    {
      "id": "1234567890123456789",
      "offer": "lno1...",
      "invoiceRequest": "0010fbb94b0461..."
    }
  ]
}
```

The client must then generate the requested BOLT12 invoice and send it back
using the `invoice` operation, referencing the `id` of the invoice request.

```json
{
  "op": "invoice",
  "id": "1234567890123456789",
  "invoice": "lni1..."
}
```

In case the client can't create the BOLT12 invoice, it should send an error with
a message that will be passed through to the requester of the invoice.

```json
{
  "op": "invoice.error",
  "id": "1234567890123456789",
  "error": "could not create invoice"
}
```

To unsubscribe from invoice requests for specific offers, send an `unsubscribe`
message. `args` should contain the offer strings to unsubscribe from.

```json
{
  "op": "unsubscribe",
  "channel": "invoice.request",
  "args": ["lno1..."]
}
```

The backend will respond with a message containing all offer ids the WebSocket
is still subscribed to for invoice requests.

```json
{
  "op": "unsubscribe",
  "channel": "invoice.request",
  "args": ["lno2..."]
}
```

### Magic Routing Hints

To help clients detect transactions to a magic routing hint address as quickly
as possible, we emit an event whenever we observe a transaction to the magic
routing hint in the mempool of a swap the client is subscribed to.

```json
{
  "event": "update",
  "channel": "swap.update",
  "args": [
    {
      "id": "<swap id>",
      "status": "transaction.direct",
      "transaction": {
        "id": "<transaction id>",
        "hex": "<raw transaction encoded as HEX>"
      }
    }
  ],
  "timestamp": "1751717655632"
}
```

### Application Level Pings

To ensure the connection is alive, besides the native WebSocket pings, Boltz API
will also respond to application-level pings, which is useful when the WebSocket
client cannot control the low-level WebSocket connection (like on browsers). To
send a ping, send a message like below.

```json
{
  "op": "ping"
}
```

The backend will respond with a `pong` message.

```json
{
  "event": "pong"
}
```

## Authentication

Referral-related API endpoints require authentication using HMAC-based request
signing. This authentication mechanism is used to ensure secure access to
sensitive referral data and statistics.

### Authentication Headers

Authenticated requests must include three headers:

- `API-KEY` - The unique API key identifier
- `TS` - Unix timestamp (in seconds) of when the request is made
- `API-HMAC` - HMAC signature of the request

### HMAC Signature Generation

The HMAC signature is generated using the HMAC-SHA256 algorithm with the API
secret as the key. The message to be signed is constructed as follows:

For GET requests: `timestamp + method + path`

For POST requests: `timestamp + method + path + body`

Where:

- `timestamp` is the same Unix timestamp sent in the `TS` header
- `method` is the HTTP method in uppercase (e.g., `GET`, `POST`)
- `path` is the full request path including query parameters
- `body` is the raw request body (only for POST requests)

The resulting HMAC digest should be encoded as a hexadecimal string and sent in
the `API-HMAC` header.

### Timestamp Validation

The timestamp in the `TS` header must be within 60 seconds of the server's
current time. Requests with timestamps outside this window will be rejected to
prevent replay attacks.

### Examples

::: code-group

```typescript [TypeScript]
import axios from 'axios';
import { createHmac } from 'crypto';

const endpoint = 'https://api.boltz.exchange';
const apiKey = '<your API key>';
const apiSecret = '<your API secret>';

const sendAuthenticatedRequest = async (path: string) => {
  // Get current Unix timestamp in seconds
  const ts = Math.floor(Date.now() / 1000);

  // Create HMAC signature: timestamp + method + path
  const hmac = createHmac('sha256', apiSecret)
    .update(`${ts}GET${path}`)
    .digest('hex');

  // Send request with authentication headers
  return axios.get(`${endpoint}${path}`, {
    headers: {
      TS: ts.toString(),
      'API-KEY': apiKey,
      'API-HMAC': hmac,
    },
  });
};

// Example: Query referral stats
const response = await sendAuthenticatedRequest('/v2/referral/stats');
console.log(JSON.stringify(response.data, undefined, 2));
```

```rust [Rust]
use hmac::{Hmac, Mac};
use reqwest::Client;
use sha2::Sha256;
use std::time::{SystemTime, UNIX_EPOCH};

const ENDPOINT: &str = "https://api.boltz.exchange";
const API_KEY: &str = "<your API key>";
const API_SECRET: &str = "<your API secret>";

async fn send_authenticated_request(client: &Client, path: &str) -> Result<serde_json::Value, Box<dyn std::error::Error>> {
    // Get current Unix timestamp in seconds
    let ts = SystemTime::now()
        .duration_since(UNIX_EPOCH)?
        .as_secs();

    // Create HMAC signature: timestamp + method + path
    let mut mac = Hmac::<Sha256>::new_from_slice(API_SECRET.as_bytes())?;
    mac.update(format!("{}GET{}", ts, path).as_bytes());
    let hmac = hex::encode(mac.finalize().into_bytes());

    // Send request with authentication headers
    let response = client
        .get(format!("{}{}", ENDPOINT, path))
        .header("TS", ts.to_string())
        .header("API-KEY", API_KEY)
        .header("API-HMAC", hmac)
        .send()
        .await?;

    let json: serde_json::Value = response.json().await?;
    Ok(json)
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::new();

    // Example: Query referral stats
    let response = send_authenticated_request(&client, "/v2/referral/stats").await?;
    println!("{}", serde_json::to_string_pretty(&response)?);

    Ok(())
}
```

```go [Go]
package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const endpoint = "https://api.boltz.exchange"
const apiKey = "<your API key>"
const apiSecret = "<your API secret>"

func sendAuthenticatedRequest(path string) (map[string]any, error) {
	// Get current Unix timestamp in seconds
	ts := time.Now().Unix()

	// Create HMAC signature: timestamp + method + path
	message := fmt.Sprintf("%dGET%s", ts, path)
	mac := hmac.New(sha256.New, []byte(apiSecret))
	mac.Write([]byte(message))
	hmacSignature := hex.EncodeToString(mac.Sum(nil))

	// Create HTTP client and request
	client := &http.Client{}
	req, err := http.NewRequest("GET", endpoint+path, nil)
	if err != nil {
		return nil, err
	}

	// Add authentication headers
	req.Header.Set("TS", fmt.Sprintf("%d", ts))
	req.Header.Set("API-KEY", apiKey)
	req.Header.Set("API-HMAC", hmacSignature)

	// Send request
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	// Read and parse JSON response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var jsonResponse map[string]any
	if err := json.Unmarshal(body, &jsonResponse); err != nil {
		return nil, err
	}

	return jsonResponse, nil
}

func main() {
	// Example: Query referral stats
	response, err := sendAuthenticatedRequest("/v2/referral/stats")
	if err != nil {
		panic(err)
	}

	// Pretty print JSON response
	prettyJSON, err := json.MarshalIndent(response, "", "  ")
	if err != nil {
		panic(err)
	}

	fmt.Println(string(prettyJSON))
}

```

:::
