---
description: >-
  The use of 0-conf can make swaps a lot faster by utilizing transactions that
  are not included in a block yet. But accepting 0-conf transactions doesn't
  come without unwarranted risk.
---

# ⏩ 0-conf

As a precautionary measure, Boltz enforces a few rules when it comes to 0-conf.

It is important to note that for:

* In Normal Submarine Swaps in which the user sends the onchain transaction, Boltz is taking the risk by accepting unconfirmed transactions
* In Reverse Submarine Swaps where the user receives the onchain coins from Boltz, the user is at risk for accepting the unconfirmed transaction

_0-conf Swaps are subject to network conditions and generally only available on UTXO chains like Bitcoin._

## Limits

When it comes to accepting 0-conf transactions, Boltz has configurable limits in place. These limits can be found via the [`getpairs` endpoint](../api/#getting-pairs) and are enforced only for Normal Submarine Swaps. When the user receives onchain coins from Boltz, the acceptance and amounts are entirely up to the user.

## BIP 125 - Replace-By-Fee

If a transaction locking up coins is signalling Replace-By-Fee either explicitly or inherently (unconfirmed inputs of the transaction signal RBF) Boltz will not accept 0-conf for that transaction. Boltz never sends transactions that signal RBF. For more information about RBF please read the [BIP 125 - Opt-in Full Replace-by-Fee Signaling](https://github.com/bitcoin/bips/blob/master/bip-0125.mediawiki). [Growing support for `-mempoolfullrbf`](https://github.com/bitcoin/bitcoin/pull/28132) `in Bitcoin Core` might make it unfeasible to support 0-conf down the road.

## Miner fees

Swaps on Boltz are based on HTLCs (_Hash Time Locked Contracts_). In order to be able to deal with the _time locked_ component of these contracts, in scenarios where not all transactions from the mempool are getting included in the very next block all the time, transactions locking and claiming coins from such contracts have to pay a _reasonably high miner fee_ in order to be included in a block quickly.

Boltz considers fees that are equal or higher than 80% of the `sat/vbyte` estimations of the [`getfeeestimation`](../api/#getting-fee-estimations) endpoint as _reasonably high_. If the miner fee paid by the transaction is less than that, Boltz will not accept 0-conf and wait for the transaction to be included in a block.
