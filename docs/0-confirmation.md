---
description: >-
  The use of 0-conf can make swaps a lot faster by utilizing transactions that
  are not included in a block yet. But accepting 0-conf transactions doesn't
  come without unwarranted risk.
---

# ⏩ 0-conf

As a precautionary measure, Boltz enforces a few rules when it comes to 0-conf.

It is important to note that:

* In **Normal Submarine Swaps** in which the user sends the chain transaction, _Boltz_ is taking the risk by accepting unconfirmed transactions
* In **Reverse Submarine Swaps** where the user receives the chain transaction from Boltz, _the user_ is at risk for accepting the unconfirmed transaction

_0-conf Swaps are subject to network conditions and generally only available on UTXO chains like Bitcoin._

> Note: Because of [growing support for `-mempoolfullrbf`](https://github.com/bitcoin/bitcoin/pull/28132) in Bitcoin Core and support from some miners who are processing such transactions already, Boltz had to set limits for the Bitcoin mainchain to 0, effectively not accepting 0-conf transactions for Normal Submarine Swaps as of now. It might be unfeasible for Boltz to accept 0-conf on the Bitcoin mainchain in the future.

## Limits

When it comes to accepting 0-conf transactions, Boltz has configurable limits in place. These limits can be found via the [`getpairs`](api.md#supported-pairs) endpoint and are enforced only for Normal Submarine Swaps. When the user receives a chain transaction from Boltz, the acceptance and amounts are entirely up to the client and user.

## BIP 125 - Replace-By-Fee

If a transaction locking up bitcoin is signalling Replace-By-Fee either explicitly or inherently (unconfirmed inputs of the transaction signal RBF), Boltz will not accept 0-conf for that transaction in Normal Submarine Swaps. Also note, that Boltz never sends transactions that signal RBF. For more information about RBF please read [BIP 125 - Opt-in Full Replace-by-Fee Signaling](https://github.com/bitcoin/bips/blob/master/bip-0125.mediawiki).

## Miner fees

Swaps on Boltz are based on HTLCs (_Hash Time Locked Contracts_). In order to be able to deal with the _time locked_ component of these contracts, transactions locking and claiming coins from such contracts have to pay a _reasonably high miner fee_ in order to be included in a block timely.

Boltz considers fees that are equal or higher than 80% of the `sat/vbyte` estimations of the [`getfeeestimation`](api.md#fee-estimations) endpoint as _reasonably high_. If the miner fee paid by the transaction is less than that, Boltz will not accept 0-conf and wait for the transaction to be included in a block.
