# 📜 Claim Covenants

To reduce the interactivity requirements of Reverse Swaps, one can make use of
covenants.

Covenants are available, e.g., on the [Liquid Network](https://liquid.net/) in
the form of
[introspection opcodes](https://github.com/ElementsProject/elements/blob/master/doc/tapscript_opcodes.md#new-opcodes-for-additional-functionality).
These opcodes allow the script in the witness to inspect the inputs, outputs,
and other properties of the transaction in which it is executed.

## Disclaimer

Claim covenants have different trust assumptions depending on how they are used.
Below are two common use cases with their respective trust implications.

### Invoice-based Creation & Validation of Swaps

When using claim covenants with an **on-demand invoice creation and validation
workflow**, they can be used in a trust-minimized manner:

The client initiates the swap and immediately receives and validates the
covenant script setup. Since the client can verify that the covenant is properly
configured before sharing payment details, this approach maintains minimal trust
assumptions.

**This is the recommended way to use claim covenants.**

### LNURL/LN-Address Spontaneous Offline Payments

When using claim covenants for **spontaneous payments via LNURL or Lightning
addresses** while the swap client is offline, they **cannot** be used in a
trust-minimized manner:

In this scenario, the sender pulls payment details on-demand (e.g., via LNURL or
a Lightning address), but the receiving client is offline and cannot validate
the covenant script setup. The swap creator retains sole control over the actual
claiming conditions, and the offline recipient has no way to verify correctness.
From a trust perspective, this is similar to providing an xpub or wallet
descriptor as the swap destination directly to the swap creator.

**We do NOT recommend using claim covenants this way.**

### General Considerations

When handing over the preimage of a Reverse Swap to the swap creator, which is
usually a third party like a mobile wallet provider, you have to rely on this
party not to collude with the Lightning node that accepts HTLCs for the hold
invoice. If that happens, the covenant script path spend would not be executed,
while the Lightning HTLCs are resolved and eventually, the coins locked on
Liquid will be refunded. A workaround could be using multiple servers that
enforce covenant claims for the swap client.

Additionally, note that Liquid swap transactions need to be unblinded for
covenants and therefore cannot leverage the privacy benefits of
[Confidential Transactions](https://glossary.blockstream.com/confidential-transactions/).

## Boltz API

Boltz API clients can ask for a covenant to be included in the Taptree of a
Reverse Swap. With that new leaf in the tree, the coins locked for the Reverse
Swap can be claimed by revealing the preimage and sending the expected asset
with the expected amount to an address of the client in the 0th output of the
transaction. This is what the script looks like:

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
<output script of the address of the client>
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

This example registers a covenant to be claimed with the reference
implementation [covclaim](https://github.com/BoltzExchange/covclaim/) running
locally at port 1234:

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

  const address = '<L-BTC address on the network used>';

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
