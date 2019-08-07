# 0-conf documentation

Using 0-conf can make swaps a lot faster by utilizing transactions that are not included in a block yet. But accepting 0-conf transactions doesn't come without risk. Therefore Boltz enforces a few rules when it comes to 0-conf.

It is important to know that for:

- normal swaps in which the user sends the onchain transaction, the risk is on Boltz by accepting the 0-conf transaction
- reverse swaps where the user receives the onchain coins from Boltz, the user is at risk for accepting the unconfirmed transaction

## Limits

Boltz has limits when it comes to accepting 0-conf transactions. These limits can be found in the [`getpairs` endpoint](/api/#getting-pairs) and are just enforced for normal swaps. When the user receives onchain coins from Boltz he can accept any amount of coins with 0-conf he is comfortable with.

## BIP 125 - Replace-By-Fee

If a transaction locking up coins is signalling Replace-By-Fee either explicitly or inherently (unconfimed inputs of the transaction signal RBF) Boltz will not accept 0-conf for that transaction. Boltz itself will never send transactions that signal RBF which means that the user doesn't have to worry about a lockup transaction of a reverse swap being replaceable.

For more information about RBF please read the [BIP 125 - Opt-in Full Replace-by-Fee Signaling](https://github.com/bitcoin/bips/blob/master/bip-0125.mediawiki)

## Miner fees

Swaps on Boltz are based on HTLCs (*Hash Time Locked Contracts*) and in order to be able to deal with the *time locked* component of these contracts in situations in which there aren't all transactions in the mempool included in the very next block block all time and a fee market starts ermerging, transactions locking and claiming coins from such contracts have to pay a *reasonable high miner fee* in order to be included in a block quickly.

Boltz considers fees that are equal or higher than 80% of the `sat/vbyte` estimations of the [`getfeeestimation`](/api/#getting-fee-estimations) endpoint as *reasonably high*. If the miner fee paid by the transaction is less than that, Boltz will not accept 0-conf and wait for the transaction to be included in a block.
