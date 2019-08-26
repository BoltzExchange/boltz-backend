# Swap Lifecycle

## Introduction

There are two types of [Atomic Swaps](https://en.bitcoin.it/wiki/Atomic_swap):

- [Normal Submarine Swaps](#normal-submarine-swaps)
- [Reverse Submarine Swaps](#reverse-submarine-swaps)

## Normal Submarine Swaps

Normal swaps are from onchain coins to lightning ones. Which means the user creates an invoice, sends coins to an provided onchain address and Boltz takes care of everything else. When a normal swap is created it doesn't have a status until:

1. `transaction.mempool`: a transaction that sends coins to the onchain address of the swap is found in the mempool
2. `transaction.confirmed`: that transaction was included in a block
3. once the said transaction is included in a block (or found in the mempool in case of [0-confirmation](0-confirmation.md)) Boltz will try to pay the invoice provided by the user in order to claim the onchain coins
    - `invoice.paid`: if paying the invoice was successful
    - `invoice.failedToPay`: if paying the invoice failed. In which case the locked up onchain coins should be refunded
4. `transaction.claimed`: indicates that the invoice was successfully paid for and that the onchain coins were claimed by the Boltz instance

If the user doesn't send onchain coins until the time lock is expired, Boltz will set the status of the swap to `swap.expired` which means that it was abandoned and sending onchain coins will have no effect.

## Reverse Submarine Swaps

Reverse swaps are from lightning to onchain coins. In this scenario, Boltz locks up coins and provides an invoice that has to be paid in order to claim those coins.

1. `transaction.mempool`: the lockup transaction is found in the mempool which is immediately after the reverse swap was created
2. `transaction.confirmed`: the lockup transaction is included in a block. This status can be skipped if the user wants to accept a 0-conf transaction
3. `invoice.settled`: the provided invoice was paid by the user which means the onchain coins that were locked up can be claimed now

In case of the timelock expiring, Boltz will automatically refund its locked up coins. The status of the reverse swap will change to `transaction.refunded` and paying the invoice becomes futile because the locked up coins were already spent by the refunding transaction.
