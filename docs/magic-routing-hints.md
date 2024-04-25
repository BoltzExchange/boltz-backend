# Magic Routing hints

We do not allow paying invoices for Reverse Swaps with Submarine Swaps.
That causes an UX problem for wallets that show users Lightning invoices from Reverse Swaps and allow
them to pay invoices with Submarine Swaps.
To work around that problem and minimize the number of transactions that need to be done, the Swaps can be skipped
entirely and the sender can pay the receiver directly.

The only data that the receiver and sender share is the Lightning invoice.
Encoding arbitrary data in an invoice is impractical, therefore we only hint at the possibility of the ability
to fetch an onchain address of the recipient in the invoice.
That hint is in the routing hints of the invoice with a specific channel id.
There is no real channel with that id, that routing hint only signals to supporting wallets that the magic routing
hint feature has been used by the recipient.
The node public key in the routing hint is the same public key with which the receiver would need to sign
to enforce the claim of the Reverse Swap.

When creating a Reverse Swap with a magic routing hint, there a couple extra steps for the receiver:
- pass an onchain address of the wallet for the chain on which the Reverse Swap would be claimed in the API call to create swap
- also pass a signature of the SHA-256 hash of that address signed by the private key the Reverse Swap would be claimed with
- when the API call returns, check the invoice for the magic routing hint with the constant channel id and the claim public key in the node public key field

When a wallet tries to pay a Lightning invoice via a Submarine Swap, there are two options.
Check for the existence of a magic routing hint, if it does not exist, proceed with the Submarine Swap.
When one is found:
- parse the public key in the magic routing hint
- send a [request to our API](https://api.boltz.exchange/swagger#/Reverse/get_swap_reverse__invoice__bip21) to fetch the onchain address of the recipient
- extract the address from the BIP-21
- hash the address and verify the signature that is also returned in the API call against the public key in the magic routing hint
- either use that address directly or verify the amount and, in the case of Liquid, asset id of the BIP-21 and use that to pay

## Example code

```typescript
import axios from 'axios';
import { crypto } from 'bitcoinjs-lib';
import bolt11 from 'bolt11';
import { randomBytes } from 'crypto';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';

const ECPair = ECPairFactory(ecc);

const endpoint = 'https://api.testnet.boltz.exchange';

const magicRoutingHintConstant = '0846c900051c0000';
const lbtcAssetHash =
  '144c654344aa716d6f3abcc1ca90e5641e4e2a7f633bc09fe3baf64585819a49';

const findMagicRoutingHint = (invoice: string) => {
  const decodedInvoice = bolt11.decode(invoice);
  const routingInfo = decodedInvoice.tags.find(
    (tag) => tag.tagName === 'routing_info',
  );
  if (routingInfo === undefined) {
    return { decodedInvoice };
  }

  const magicRoutingHint = (routingInfo.data as any[]).find(
    (hint) => hint.short_channel_id === magicRoutingHintConstant,
  );
  if (magicRoutingHint === undefined) {
    return { decodedInvoice };
  }

  return { magicRoutingHint, decodedInvoice };
};

const receiverSide = async () => {
  const preimage = randomBytes(32);
  const claimKeys = ECPair.makeRandom();

  const address =
    'tlq1qq090wdhdz8s2pydq3g5whw248exqydax2w05sv3fat7dsdz4088rg9yzha2lh8rcr2wq4ek244ug77al8ps27shp59e588azj';

  const addressHash = crypto.sha256(Buffer.from(address, 'utf-8'));
  const addressSignature = claimKeys.signSchnorr(addressHash);

  const swapRes = (
    await axios.post(`${endpoint}/v2/swap/reverse`, {
      address,
      from: 'BTC',
      to: 'L-BTC',
      invoiceAmount: 10_000,
      addressSignature: addressSignature.toString('hex'),
      claimPublicKey: claimKeys.publicKey.toString('hex'),
      preimageHash: crypto.sha256(preimage).toString('hex'),
    })
  ).data;

  // Other verification checks skipped

  const { magicRoutingHint } = findMagicRoutingHint(swapRes.invoice);
  if (magicRoutingHint === undefined) {
    throw 'no magic routing hint';
  }

  if (magicRoutingHint.pubkey !== claimKeys.publicKey.toString('hex')) {
    throw 'invalid public key in magic routing hint';
  }

  return swapRes.invoice;
};

const senderSide = async (invoice: string) => {
  const { magicRoutingHint, decodedInvoice } = findMagicRoutingHint(invoice);
  if (magicRoutingHint === undefined) {
    // Pay via Swap
    console.log('no magic routing hint found');
    return;
  }

  const bip21Res = (
    await axios.get(`${endpoint}/v2/swap/reverse/${invoice}/bip21`)
  ).data;

  const receiverPublicKey = ECPair.fromPublicKey(
    Buffer.from(magicRoutingHint.pubkey, 'hex'),
  );
  const receiverSignature = Buffer.from(bip21Res.signature, 'hex');

  const bip21Decoded = new URL(bip21Res.bip21);
  const bip21Address = bip21Decoded.pathname;

  const addressHash = crypto.sha256(Buffer.from(bip21Address, 'utf-8'));

  if (!receiverPublicKey.verifySchnorr(addressHash, receiverSignature)) {
    throw 'invalid address signature';
  }

  if (bip21Decoded.searchParams.get('assetid') !== lbtcAssetHash) {
    throw 'invalid BIP-21 asset';
  }

  // Amount in the BIP-21 is the amount the recipient will actually receive
  // The invoice amount includes service and swap onchain fees
  if (
    Number(bip21Decoded.searchParams.get('amount')) * 10 ** 8 >
    Number(decodedInvoice.satoshis)
  ) {
    throw 'invalid BIP-21 amount';
  }

  // Pay on Liquid
};

(async () => {
  try {
    const invoice = await receiverSide();
    await senderSide(invoice);
  } catch (e) {
    console.error(e);
  }
})();
```