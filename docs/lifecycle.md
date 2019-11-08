# Swap Lifecycle

## Introduction

Boltz supports three types of [atomic swaps](https://en.bitcoin.it/wiki/Atomic_swap):

- [Normal Submarine Swaps](#normal-submarine-swaps)
- [Reverse Submarine Swaps](#reverse-submarine-swaps)
- [Chain to Chain Swaps](#chain-to-chain-swaps)

## Normal Submarine Swaps

Normal swaps are from onchain coins to lightning ones. Which means the user creates an invoice, sends coins to an provided onchain address and Boltz takes care of everything else. When a normal swap is created it doesn't have a status until:

1. `transaction.mempool`: a transaction that sends coins to the onchain address of the swap is found in the mempool
2. `transaction.confirmed`: that transaction was included in a block
3. once the said transaction is included in a block (or found in the mempool in case [0-confirmation](0-confirmation.md) is accepted) Boltz will try to pay the invoice provided by the user in order to claim the onchain coins
    - `invoice.paid`: if paying the invoice was successful
    - `invoice.failedToPay`: if paying the invoice failed. In which case the locked up onchain coins should be refunded
4. `transaction.claimed`: indicates that the invoice was successfully paid for and that the onchain coins were claimed by the Boltz instance

If the user doesn't send onchain coins until the time lock is expired, Boltz will set the status of the swap to `swap.expired` which means that it was abandoned and sending onchain coins will have no effect.

## Reverse Submarine Swaps

Reverse swaps are from lightning to onchain coins. In this scenario, Boltz locks up coins and provides an invoice that has to be paid in order to claim those coins.

1. `boltz.transaction.mempool`: the lockup transaction is found in the mempool which is immediately after the reverse swap was created
2. `boltz.transaction.confirmed`: the lockup transaction is included in a block. This status can be skipped if the user wants to accept a 0-conf transaction
3. `invoice.settled`: the provided invoice was paid by the user which means the onchain coins that were locked up can be claimed now

In case of the timelock expiring, Boltz will automatically refund its locked up coins. The status of the reverse swap will change to `boltz.transaction.refunded` and paying the invoice becomes futile because the locked up coins were already spent by the refunding transaction.

## Chain to Chain Swaps

Chain to Chain swaps are, as the name indicates, swaps between two blockchains. The protocol starts with the user genrating a preimage, hashing it, sending that hash to Boltz, and finally, locking up coins which will cause Boltz to also lockup coins. Once the user claims the coins locked up by Boltz, the preimage can be retrieved from that claim transaction, which results in Boltz also claiming the coins locked up by the user.

1. `transaction.waiting`: in this state Boltz is waiting for the user lockup coins
2. `transaction.mempool`: the lockup transaction of the user is found in the mempool
3. `transaction.confirmed`: the lockup transcation transaction of the user was found in a block (you won't get this even if `zeroConfAccepted` was `true` in `transaction.mempool`)
4. `boltz.transaction.mempool`: the Boltz lockup transaction was found in the mempool. For this and the `boltz.transaction.confirmed` events the lockup transaction id is encoded in the JSON object of the status update as `lockupTransactionId`
5. `boltz.transaction.confirmed`: the Boltz lockup transaction was found in a blocks
6. `transaction.claimed`: the lockup transaction of the user was claimed and the swap succesful

If one of the timelocks on one of the two chains expires before Boltz locks up coins, the swap will have the status `swap.expired`, if Boltz did already lockup coins, those will be refunded and the swap will have the status `boltz.transaction.refunded`.
