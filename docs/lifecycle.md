---
description: >-
  Boltz offers several different swap types. This document describes the types
  and different states a particular swap type traverses.
---

# 🔁 Swap Types & States

## Swap Types

Boltz currently offers two types of [Atomic Swaps](https://en.bitcoin.it/wiki/Atomic\_swap):

* [Normal Submarine Swaps](lifecycle.md#normal-submarine-swaps) (Chain -> Lightning)
* [Reverse Submarine Swaps](lifecycle.md#reverse-submarine-swaps) (Lightning -> Chain)

## Swap States

### Normal Submarine Swaps

Normal Submarine Swaps move bitcoin from the **chain to Lightning**. "Chain" can be the Bitcoin mainchain or, for instance, the Liquid sidechain. Typically, the user creates a Lightning invoice for Boltz, sends bitcoin to a _neutral_ lockup address on the chain and Boltz sets up the Lightning payment. Once the Lightning payment was settled by the user's wallet/node, Boltz can use the revealed preimage to claim the bitcoin in the lockup address to complete the swap.

When a Normal Submarine Swap is created, it passes through the following states:

1. `swap.created`: initial state of the swap; _optionally_ the initial state can also be `invoice.set` in case the invoice was already specified in the `/createswap` request. [Boltz Web App](https://github.com/BoltzExchange/boltz-web-app) is an example for a client that sets the invoice with `/createswap` already.
2. `transaction.mempool`: a transaction that sends bitcoin to the chain address is found in the mempool, meaning user sent funds to the lockup chain address.
3. `transaction.confirmed`: the lockup transaction was included in a block. For mainchain swaps, Boltz always waits for one confirmation before continuing with the swap. The [`getpairs`](api-v1.md#supported-pairs) call provides amount limits for which Boltz accepts [0-conf](0-conf.md) per pair.
4. `invoice.set`: if the invoice was _not_ set as part of the `/createswap` request, this state confirms that an invoice with the correct amount and hash was set.
5. Once the user's lockup transaction is included in a block (or found in the mempool if [0-conf](0-conf.md) applies), Boltz will try to pay the invoice provided by the user. When successful, Boltz obtains the preimage needed to claim the chain bitcoin. State of the Lightning payment is either:
   * `invoice.pending`: if paying the invoice is in progress
   * `invoice.paid`: if paying the invoice was successful or
   * `invoice.failedToPay`: if paying the invoice failed. In this case the user needs to broadcast a refund transaction to reclaim the locked up chain bitcoin.
6. `transaction.claim.pending`: This status indicates that Boltz is ready for the creation of a cooperative signature for a keypath spend. Taproot Swaps are not claimed immediately by Boltz after the invoice has been paid, but instead Boltz waits for the API client to post a signature for a key path spend. If the API client does not cooperate in a key path spend, Boltz will eventually claim via the script path.
7. `transaction.claimed`: indicates that after the invoice was successfully paid, the chain Bitcoin were successfully claimed _by Boltz_. This is the final status of a successful Normal Submarine Swap.

If the user doesn't send chain bitcoin and the swap expires (approximately 24h), Boltz will set the state of the swap to `swap.expired` , which means that it was cancelled and chain bitcoin shouldn't be sent anymore. In case of the states `invoice.failedToPay` or `swap.expired` but bitcoin were sent or `transaction.lockupFailed` , which usually is set if the user sent too little, the user needs to submit a refund transaction to reclaim their locked chain bitcoin. For more information about how Boltz API clients can construct & submit refund transactions for users, check the [Claiming Swaps & Refunds](claiming-swaps.md) section. The states `invoice.failedToPay` and `swap.expired` are final since Boltz is _not_ monitoring refund transactions on the chain.

### Reverse Submarine Swaps

Reverse Submarine Swaps move bitcoin from **Lightning to the chain**. Again, "chain" can refer to the Bitcoin mainchain or, for instance, the Liquid sidechain. Reverse Submarine Swaps start with the client generating a preimage, then calculating the SHA256 hash of it and sending that hash to Boltz. With this hash, Boltz creates a hold invoice that can only be settled when the preimage is revealed by the user. The user pays the invoice, but the Lightning payment doesn't execute, because Boltz doesn't know the preimage yet. Next, Boltz locks up chain bitcoin using the same hash so that these can be claimed with the previously generated preimage by the client. Once the claim transaction for the chain bitcoin is broadcasted by the user's Boltz API client, Boltz detects the preimage in this transaction and in turn claims its bitcoin by settling the Lightning invoice. The [Claiming Swaps & Refunds](claiming-swaps.md) section contains details about how Boltz API clients can construct claim transactions for their users.

The following states are traversed in the course of a Reverse Submarine Swap:

1. `swap.created`: initial state of a newly created Reverse Submarine Swap
2. `minerfee.paid`: optional and currently not enabled on Boltz. If Boltz requires prepaying miner fees via a separate Lightning invoice, this state is set when the miner fee invoice was successfully paid
3. `transaction.mempool`: Boltz's lockup transaction is found in the mempool which will only happen after the user paid the Lightning hold invoice
4. `transaction.confirmed`: the lockup transaction was included in a block. This state is skipped, if the client optionally accepts the transaction without confirmation. Boltz broadcasts chain transactions non-RBF only.
5. `invoice.settled`: the transaction claiming chain Bitcoin was broadcasted by the user's client and Boltz used the preimage of this transaction to settle the Lightning invoice. This is the final status of a successful Reverse Submarine Swap.

The status `invoice.expired` is set when the invoice of Boltz expired and pending HTLCs are cancelled. Boltz invoices currently expire after 50% of the swap timeout window. If the swap expires without the lightning invoice being paid, the final status of the swap will be `swap.expired`.

In the unlikely event that Boltz is unable to send the agreed amount of chain bitcoin after the user set up the payment to the provided Lightning invoice, the status of the swap will be `transaction.failed` and the pending Lightning HTLC will be cancelled. The Lightning bitcoin automatically bounce back to the user, no further action or refund is required and the user didn't pay any fees.

If the user successfully set up the Lightning payment and Boltz successfully locked up bitcoin on the chain, but the Boltz API Client did not claim the locked chain bitcoin until swap expiry, Boltz will automatically refund its own locked chain Bitcoin. The final status of such a swap will be `transaction.refunded`.

{% hint style="info" %}
It is important to design Boltz API clients, especially on mobile, in a way that they can come online and are able to broadcast reverse swap claim transactions before a swap expires.
{% endhint %}
