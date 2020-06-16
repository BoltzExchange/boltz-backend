# Swap Lifecycle

## Introduction

There are two types of [Atomic Swaps](https://en.bitcoin.it/wiki/Atomic_swap):

- [Normal Submarine Swaps](#normal-submarine-swaps)
- [Reverse Submarine Swaps](#reverse-submarine-swaps)

## Normal Submarine Swaps

Normal swaps are from onchain coins to lightning ones. Which means the user creates an invoice, sends coins to an provided onchain address and Boltz takes care of everything else. When a normal swap is created it doesn't have a status until:

1. `swap.created`: initial status of the Submarine Swap; the initial status could also be `invoice.set` in case the invoice was specified in the request creating the swap
2. `transaction.mempool`: a transaction that sends coins to the onchain address of the swap is found in the mempool
3. `transaction.confirmed`: that transaction was included in a block
4. `invoice.set`: when the invoice of the Submarine Swap was set
5. once the said transaction is included in a block (or found in the mempool in case of [0-confirmation](0-confirmation.md)) Boltz will try to pay the invoice provided by the user in order to claim the onchain coins
    - `invoice.paid`: if paying the invoice was successful
    - `invoice.failedToPay`: if paying the invoice failed. In which case the locked up onchain coins should be refunded
6. `transaction.claimed`: indicates that the invoice was successfully paid for and that the onchain coins were claimed by the Boltz instance

If the user doesn't send onchain coins until the time lock is expired, Boltz will set the status of the swap to `swap.expired` which means that it was abandoned and sending onchain coins will have no effect.

For more information about the refunding onchain coins, checkout the [scripting docs](scripting.md).

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

Reverse swaps are from lightning to onchain coins. In this scenario the user generates a preimage, creates SHA256 hash of it and sends that hash to Boltz. With that hash Boltz creates a hold invoice, that can only be settled when the preimage is revealed to the boltz backend. The user pays that invoice, but the lightning coins are not transferred to Boltz yet because it doesn't know the preimage. Therefore, the backend locks up onchain coins using the same hash so that these can be claimed with the preimage. When the claim transaction is broadcasted by the user, Boltz detects the preimage and in turn claims the lightning coins.

The [scripting docs](scripting.md) contain details about constructing claim transactions.

1. `swap.created`: initial status of the Reverse Submarine Swap
2. `minerfee.paid`: only if the instance requires prepaying miner fees (our official instance do not); event is sent when the miner fee invoice is paid 
3. `transaction.mempool`: the lockup transaction is found in the mempool which will happen after the user pay the hold invoice
4. `transaction.confirmed`: the lockup transaction is included in a block. This status can and will be skipped if the user wants to accept a 0-conf transaction
5. `invoice.settled`: the transaction claiming the onchain coins was broadcasted and Boltz received the offchain coins

If Boltz is unable to send the agreed amount of onchain coins after the invoice is paid, the status of the status will become `transaction.failed` and the pending lightning HTLC will be cancelled.

In case of the timelock expiring, Boltz will automatically refund its locked up coins. The status of the reverse swap will change to `transaction.refunded` and paying the invoice becomes futile because the locked up coins were already spent by the refunding transaction and only cause a pending HTLC in one of the channels of the user. If the reverse swap expires before the invoice is paid, the status of the swap will change to `swap.expired`.
