---
description: >-
  To reduce the interactivity requirements of Reverse Swaps, one can make use of
  covenants.
---

# 📜 Claim Covenants

Covenants are available on [Liquid](https://liquid.net/) in the form of [direction introspection](https://github.com/ElementsProject/elements/blob/master/doc/tapscript_opcodes.md#new-opcodes-for-additional-functionality). These opcodes allow the script in the witness to inspect the inputs, outputs and other properties of the transaction it is executed in.

## Disclaimer

In most cases, claim covenants do **not** allow Boltz Swap clients to trustlessly receive Lightning payments when offline.

While a swap can be restricted to a specific claiming address, potentially giving this impression, it is crucial to acknowledge that the swap creator retains sole control over the actual claiming conditions. If the receiving client cannot validate the swap's covenant setup after the swap was created (because they are offline), they are inherently trusting the entity that created the swap to configure it correctly. From a trust perspective, this is similar to providing an xpub or wallet descriptor as swap destination directly to the swap creator.

Further, when handing over the preimage of a Reverse Swap to a third party like a mobile wallet provider, you have to rely on this party not to collude with the Lightning node that accepts HTLCs for the hold invoice. If that happens, the covenant script path spend would not be executed, but the Lightning HTLCs resolved and eventually, the coins locked on Liquid will be refunded. A work around could be access to multiple servers that enforce covenant claims for the swap client.

Also, Liquid swap transactions need to be unblinded for covenants and therefore cannot leverage the privacy benefits of [Confidential Transactions](https://glossary.blockstream.com/confidential-transactions/).

Therefore, we currently do not recommend claim covenants for use in production.

## Boltz API

Boltz API clients can ask for a covenant to be included in the Taptree of a Reverse Swap. With that new leaf in the tree, the coins locked for the Reverse Swap can be claimed by revealing the preimage and sending the expected asset with expected amount to an address of the client in the 0th output of the transaction. This is what the script looks like:

```
OP_SIZE
32
OP_EQUALVERIFY
OP_HASH160
<RIPEMD-160 hash of the SHA-256 hash of the preimage>
OP_EQUALVERIFY

0
OP_INSPECTOUTPUTSCRIPTPUBKEY
<version of the output script of the address of the client>
OP_EQUALVERIFY
<output script of the output script of the address of the client>
OP_EQUALVERIFY

0
OP_INSPECTOUTPUTASSET
OP_1
OP_EQUALVERIFY
<asset hash of Liquid Bitcoin>
OP_EQUALVERIFY

0
OP_INSPECTOUTPUTVALUE
OP_DROP
<amount the user is expecting to receive>
OP_EQUAL
```

## Example Code

This example registers a covenant to be claimed with the reference implementation [covclaim](https://github.com/BoltzExchange/covclaim/) running locally at port 1234:

```typescript
import axios from 'axios';
import { crypto } from 'bitcoinjs-lib';
import { SwapTreeSerializer, Types } from 'boltz-core';
import { randomBytes } from 'crypto';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';

const ECPair = ECPairFactory(ecc);

type CovenantParams = {
  claimPublicKey: Buffer;
  refundPublicKey: Buffer;
  preimage: Buffer;
  blindingKey: Buffer;
  address: string;
  tree: Types.SwapTree;
};

const endpoint = '<Boltz API endpoint>';
const covenantEndpoint = 'http://127.0.0.1:1234';

const createSwap = async (): Promise<CovenantParams> => {
  const preimage = randomBytes(32);
  const claimKeys = ECPair.makeRandom();

  const address =
    '<L-BTC address on the network used>';

  const swapRes = (
    await axios.post(`${endpoint}/v2/swap/reverse`, {
      address,
      from: 'BTC',
      to: 'L-BTC',
      claimCovenant: true,
      invoiceAmount: 10_000,
      preimageHash: crypto.sha256(preimage).toString('hex'),
      claimPublicKey: claimKeys.publicKey.toString('hex'),
    })
  ).data;

  // Verification checks skipped

  return {
    address,
    preimage,
    claimPublicKey: claimKeys.publicKey,
    blindingKey: Buffer.from(swapRes.blindingKey, 'hex'),
    refundPublicKey: Buffer.from(swapRes.refundPublicKey, 'hex'),
    tree: SwapTreeSerializer.deserializeSwapTree(swapRes.swapTree),
  };
};

const registerCovenant = async (params: CovenantParams) =>
  await axios.post(`${covenantEndpoint}/covenant`, {
    address: params.address,
    preimage: params.preimage.toString('hex'),
    tree: SwapTreeSerializer.serializeSwapTree(params.tree),
    blindingKey: params.blindingKey.toString('hex'),
    claimPublicKey: params.claimPublicKey.toString('hex'),
    refundPublicKey: params.refundPublicKey.toString('hex'),
  });

(async () => {
  try {
    const swap = await createSwap();
    await registerCovenant(swap);
  } catch (e) {
    console.error(e);
  }
})();
```
