---
description: >-
  Boltz offers several different swap types. This document describes the types
  and different states a particular swap type traverses.
---

# 🔁 Swap Types & States

## Swap Types

Boltz currently offers two types of [Atomic Swaps](https://en.bitcoin.it/wiki/Atomic\_swap):

* [Normal Submarine Swaps](<README (1).md#normal-submarine-swaps>) (Chain -> Lightning)
* [Reverse Submarine Swaps](<README (1).md#reverse-submarine-swaps>) (Lightning -> Chain)

## Swap States

### Normal Submarine Swaps

"Normal Submarine Swaps" move bitcoin from the chain to Lightning. "Chain" can be the Bitcoin mainchain or, for instance, the Liquid sidechain. Typically the user creates a Lightning invoice, sends bitcoin to a provided chain address and Boltz takes care of everything else.

When a Normal Submarine Swap is created, it passes through the following states:

1. `swap.created`: initial state of the swap; _optionally_ the initial state can also be `invoice.set` in case the invoice was already specified in the `/createswap` request. [Boltz Web App](https://github.com/BoltzExchange/boltz-web-app) is an example for a client that sets the invoice with `/createswap` already.
2. `transaction.mempool`: a transaction that sends bitcoin to the chain address is found in the mempool, meaning user sent funds to the lockup chain address.
3. `transaction.confirmed`: the lockup transaction was included in a block. For mainchain swaps, Boltz always waits for one confirmation before continuing with the swap. The [`getpairs`](api.md#supported-pairs) call provides amount limits for which Boltz accepts [0-conf](0-confirmation.md#limits) per pair.
4. `invoice.set`: if the invoice was _not_ set as part of the `/createswap` request, this state confirms that an invoice with the correct amount and hash was set.
5. Once the user's lockup transaction is included in a block (or found in the mempool in case [0-conf](0-confirmation.md) applies), Boltz will try to pay the invoice provided by the user. When successful, Boltz obtains the preimage needed to claim the chain bitcoin. State of the Lightning payment is either:
   * `invoice.paid`: if paying the invoice was successful or
   * `invoice.failedToPay`: if paying the invoice failed. In this case the user needs to broadcast a refund transaction to reclaim the locked up chain bitcoin
6. `transaction.claimed`: indicates that after the invoice was successfully paid, the chain Bitcoin were successfully claimed _by Boltz_. This is the final status of a successful Normal Submarine swap.

If the user doesn't send chain bitcoin and the swap expires (approximately 24h), Boltz will set the state of the swap to `swap.expired` , which means that it was cancelled and chain bitcoin shouldn't be sent anymore. In case of `invoice.failedToPay` or `swap.expired` but bitcoin were sent, the user needs to submit a refund transaction to reclaim their locked chain bitcoin. For more information about how clients can construct & submit refund transactions for users, check out the [scripting](scripting.md) section.

When a "Channel Creation" is involved in the swap protocol, Boltz will send the event `channel.created` after `transaction.confirmed`. This event means that a channel has been opened to the requested node. Alongside the state update, the `JSON` object `channel` is sent, which contains information about the funding transaction of the opened channel:

```json
{
  "status": "channel.created",
  "channel": {
    "fundingTransactionId": "80a3718319b576b0422ab407a5766df052a89eccf9789d90e0d250e3fc2734f7",
    "fundingTransactionVout": 0
  }
}
```

### Reverse Submarine Swaps

"Reverse Submarine Swaps" move bitcoin from Lightning to the chain. Again, "chain" can refer to the Bitcoin mainchain or, for instance, the Liquid sidechain. "Reverse Submarine Swaps" start with the client generating a preimage, then a SHA256 hash of it and sending that hash to Boltz. With this hash Boltz creates a hold invoice, that can only be settled when the preimage is revealed. The user pays the invoice, but the Lightning payment doesn't execute yet because Boltz doesn't know the preimage to claim it. Next, Boltz locks up chain bitcoin using the same hash so that these can be claimed with the previously generated preimage by the client. When the claim transaction for the chain bitcoin is broadcasted by the user, Boltz detects the preimage and in turn claims the lightning bitcoin. The [scripting](scripting.md) section contains details about how clients can construct claim transactions for their users.

The following states are traversed in the course of a Reverse Submarine Swap:

1. `swap.created`: initial state of the Reverse Submarine Swap
2. `minerfee.paid`: optional and currently not enabled on Boltz. If Boltz requires prepaying miner fees via a separate Lightning invoice, this event is sent when the miner fee invoice is paid
3. `transaction.mempool`: Boltz's lockup transaction is found in the mempool which will only happen after the user paid the Lightning hold invoice
4. `transaction.confirmed`: the lockup transaction was included in a block. This state is skipped if the client optionally accepts the transaction without confirmation. Boltz broadcasts chain transactions non-RBF only.
5. `invoice.settled`: the transaction claiming chain Bitcoin was broadcasted and Boltz received the Lightning bitcoin. This is the final status of a successful Reverse Submarine Swap.

The status `invoice.expired` is set when the invoice of Boltz expired and pending HTLCs are cancelled. If the swap expires without the lightning invoice being paid, the status of the swap will be `swap.expired`.

If Boltz for some reason is unable to send the agreed amount of chain bitcoin after the user paid the Lightning invoice, the status of the swap will be `transaction.failed` and the pending lightning HTLC will be cancelled. The Lightning bitcoin automatically bounce back to the user, no further action or refund is required and the user didn't pay any fees.

In case of the chain timelock expiring, Boltz will automatically refund its own locked chain Bitcoin. The status of the swap will be `transaction.refunded` and paying the invoice becomes futile because the locked up Bitcoin were already claimed back by Boltz and only cause a pending Lightning HTLC for the user, the payment won't execute.
