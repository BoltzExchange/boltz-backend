---
description: >-
  Boltz offers several different swap types. This document describes the phases
  and states a particular swap type traverses.
---

# 🔁 Swap Types & Phases

## Swap Types

As of today, Boltz offers two types of [Atomic Swaps](https://en.bitcoin.it/wiki/Atomic\_swap):

* [Normal Submarine Swaps](<README (1).md#normal-submarine-swaps>) (Chain -> Lightning)
* [Reverse Submarine Swaps](<README (1).md#reverse-submarine-swaps>) (Lightning -> Chain)

## Normal Submarine Swaps

"Normal Submarine Swaps" move Bitcoin from chain to lightning. "Chain" can be the Bitcoin mainchain or, for instance, the Liquid sidechain. Typically the user creates a lightning invoice, sends coins to a provided chain address and Boltz takes care of everything else. When a Normal Submarine Swap is created, its first status is:

1. `swap.created`: initial status of the Submarine Swap; optionally the initial status _can_ also be `invoice.set` in case the invoice was already specified in the `/createswap` request. E.g. [Boltz Web App](https://github.com/BoltzExchange/boltz-web-app) specifies the invoice in the `/createswap` request.
2. `transaction.mempool`: a transaction that sends Bitcoin to the chain address is found in the mempool, meaning user send funds to the lockup chain address.
3. `transaction.confirmed`: lockup transaction was included in a block. For mainchain swaps, Boltz always waits for one confirmation before continuing with the swap for security reasons.
4. `invoice.set`: if the invoice was _not_ set as part of the `/createswap` request, this status confirms when an invoice with the correct amount and hash was set for the user to receive funds on.
5. Once said lockup transaction is included in a block (or found in the mempool in case of [0-confirmation](0-confirmation.md)) Boltz will try to pay the invoice provided by the user in order to obtain the preimage needed to claim the chain Bitcoin. Status of the lightning payment can be:
   * `invoice.paid`: if paying the invoice was successful
   * `invoice.failedToPay`: if paying the invoice failed. In which case the locked up onchain coins should be refunded by the user
6. `transaction.claimed`: indicates that the invoice was successfully paid and that the chain coins were successfully claimed by Boltz. This is the final state of a successful Normal Submarine swap.

If the user doesn't send chain Bitcoin until the timelock is expired (approximately 24h), Boltz will set the status of the swap to `swap.expired` , which means that it was abandoned and chain Bitcoin shouldn't be sent anymore. In case of `invoice.failedToPay` or `swap.expired` but Bitcoin were sent, the user needs to actively refund his Bitcoin.

For more information about how to refund chain coins, check out the [Scripting](scripting.md) section.

When a Channel Creation is involved in the Swap protocol, the backend will send the event `channel.created` after `transaction.confirmed`. This event means that a channel has been opened to the requested node. Alongside the status update, the JSON object `channel` is sent, which contains information about the funding transaction of the opened channel:

```json
{
  "status": "channel.created",
  "channel": {
    "fundingTransactionId": "80a3718319b576b0422ab407a5766df052a89eccf9789d90e0d250e3fc2734f7",
    "fundingTransactionVout": 0
  }
}
```

## Reverse Submarine Swaps

"Reverse Submarine Swaps" move Bitcoin from lightning to chain. In this scenario the user generates a preimage, creates a SHA256 hash of it and sends that hash to Boltz. With that hash Boltz creates a hold invoice, that can only be settled when the preimage is revealed. The user pays the invoice, but the lightning payment doesn't execute because Boltz doesn't know the preimage. Therefore, Boltz locks up chain Bitcoin using the same hash so that these can be claimed with the user's preimage. When the claim transaction for the chain Bitcoin is broadcasted by the user, Boltz detects the preimage and in turn claims the lightning Bitcoin. The [Scripting](scripting.md) section contain details about how to construct claim transactions.

The following phases are traversed in the course of a Reverse Submarine Swap:

1. `swap.created`: initial status of the Reverse Submarine Swap
2. `minerfee.paid`: optional and currently not enabled on Boltz. If Boltz requires prepaying miner fees via a separate lightning invoice, this event is sent when the miner fee invoice is paid
3. `transaction.mempool`: Boltz's lockup transaction is found in the mempool which will only happen after the user paid the hold invoice
4. `transaction.confirmed`: the lockup transaction was included in a block. This status is skipped if the user accepts a 0-conf transaction. Boltz broadcasts transactions non-RBF only.
5. `invoice.settled`: the transaction claiming chain coins was broadcasted and Boltz received the lightning Bitcoin. This is the final state of a successful Reverse Submarine Swap.

The status update `invoice.expired` is sent when the invoice(s) of Boltz expired and pending HTLCs are cancelled. If the swap expires without the lightning invoice being paid, the status of the swap will change to `swap.expired`.

If Boltz is unable to send the agreed amount of chain Bitcoin after the invoice is paid, the status of the swap will change to `transaction.failed` and the pending lightning HTLC will be cancelled. The lightning Bitcoin automatically bounce back to the user, no further action or refund is required.

In case of the chain timelock expiring, Boltz will automatically refund its locked up chain coins. The status of the swap will change to `transaction.refunded` and paying the invoice becomes futile because the locked up coins were already spent by the refunding transaction and only cause a pending lightning HTLC for the user, the payment won't execute.&#x20;
