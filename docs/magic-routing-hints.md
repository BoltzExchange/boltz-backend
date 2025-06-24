---
description: >-
  This page describes the mechanism that encodes a BIP21 into the routing hints
  section of an invoice, mainly for Boltz-powered wallets like Aqua to pay each
  other directly without a Boltz swap.
---

# 🪄 Magic Routing Hints

We do not encourage paying invoices for Reverse Swaps with Submarine Swaps, as chaining two swaps can constitute a "self-payment". That causes a UX problem for wallets that show users Lightning invoices from Reverse Swaps and allow them to pay invoices with Submarine Swaps. To minimize the number of transactions and costs, swaps can be skipped entirely and the sender can pay the receiver directly. Similarly, Magic Routing Hints can also be used to switch to more efficient swaps and avoid chaining swaps. E.g. instead of chaining a Bitcoin -> Lightning Submarine Swap with a Lightning -> Liquid Reverse Swap, swap clients can fall back to a Bitcoin -> Liquid swap if it is supported by the client.

The only data that the receiver and sender share is the Lightning invoice. Encoding arbitrary data in an invoice is impractical, therefore we only add a hint that for this invoice one can fetch a chain address of the recipient. This hint is encoded in the routing hints section of the swap's Lightning invoice with a specific channel id. There is no actual channel with this id, just that this channel as routing hint signals to supporting wallets that the magic routing hint feature is enabled by the recipient. The node public key in the routing hint is the same public key with which the receiver would need to sign to enforce the claim of the Reverse Swap.

When creating a Reverse Swap with a magic routing hint, there are a couple of extra steps to be done for the receiver:

* Pass a chain address of the wallet for the chain on which the Reverse Swap would be claimed in the API call to create swap
* Pass a signature of the SHA-256 hash of that address signed by the private key the Reverse Swap would be claimed with
* When the API call returns, check the invoice for the magic routing hint with the specific channel id and the claim public key in the node public key field

When a wallet tries to pay a Lightning invoice via a Submarine Swap, there are two options. Check for the existence of a magic routing hint, if it does not exist, proceed with the Submarine Swap. If one is found:

* Parse the public key in the routing hint
* Send a [request to Boltz API](https://api.boltz.exchange/swagger#/Reverse/get_swap_reverse__invoice__bip21) to fetch the chain address of the recipient
* Extract the address from the BIP-21
* Hash the address and verify the signature that is also returned in the API call against the public key in the magic routing hint
* Either use that address directly or verify the amount and for Liquid additionally the asset id of the BIP21 before paying

## Example code

```typescript
import axios from 'axios';
import { crypto } from 'bitcoinjs-lib';
import bolt11 from 'bolt11';
import { randomBytes } from 'crypto';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';

const ECPair = ECPairFactory(ecc);

const endpoint = '<Boltz API endpoint>';

const magicRoutingHintConstant = '0846c900051c0000';
const lbtcAssetHash = '<L-BTC asset hash on the network used>';

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
    '<L-BTC address on the network used>';

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
