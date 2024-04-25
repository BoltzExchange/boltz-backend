# Claim covenants

To reduce the interactivity requirements of Reverse Swaps, covenants can be used.
Liquid offers covenants already in the form [direction introspection](https://github.com/ElementsProject/elements/blob/master/doc/tapscript_opcodes.md#new-opcodes-for-additional-functionality).
These allow the script in the witness to inspect the inputs, outputs and other properties of the transaction it is
executed in.

The API client can ask for a covenant to be included in the Taptree of the Reverse Swap.
With that new leaf in the tree, the coins locked for the Reverse Swap can be claimed by revealing the preimage
and sending the expected amount and asset to an address of the client in the 0th output of the transaction.
The script looks like this
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

The advantage this offers is that no signature is needed to sweep the locked funds to the address of the client.
They do not need to be online to sign a claim transaction.
Lightning HTLCs of the Reverse Swap are always resolved in a timely manner which is nice for the routing nodes
and reduces capital requirements.

## Trust assumptions

When giving the preimage of a Reverse Swap to a third party, you have to rely on them
to not collude with the Lightning node that accepts HTLCs for the hold invoice.
If that happens in the claim covenant case, the covenant script path spend would not be executed,
but Lightning HTLCs resolved and eventually, the coins locked on Liquid refunded.

To avoid that from happening, the client should come online sometime between invoice payment and timeout
of the onchain time-lock and potentially use multiple servers that enforce covenant claims for them.

## Example code

The example underneath registers a covenant to be claimed with the reference implementation [covclaim](https://github.com/BoltzExchange/covclaim/) running locally at port 1234.

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

const endpoint = 'https://api.testnet.boltz.exchange';
const covenantEndpoint = 'http://127.0.0.1:1234';

const createSwap = async (): Promise<CovenantParams> => {
  const preimage = randomBytes(32);
  const claimKeys = ECPair.makeRandom();

  const address =
    'tlq1qq090wdhdz8s2pydq3g5whw248exqydax2w05sv3fat7dsdz4088rg9yzha2lh8rcr2wq4ek244ug77al8ps27shp59e588azj';

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
