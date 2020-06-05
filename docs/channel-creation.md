# Channel Creation Docs

The Boltz Submarine Swaps can be configured to create a channel to your node before paying the invoice. This document elaborates on the way we do this and how you can enforce that the requested channel is actually opened.

## Enforcing a Channel Creation

As of writing this, no Lightning implementation does support setting the channel through which an invoice should be paid or even specifying that an invoice has to be paid through a new channel to a specific node. Therefore you will have to get creative if you want to enforce that the channel Boltz agreed to open is really created.

### External Daemon

One way to enforce that the invoice is paid through a freshly created channel with the requested properties and balances is by using [hold invoices](https://wiki.ion.radar.tech/tech/research/hodl-invoice) in combination with an external daemon. Such a daemon should have all the information required to enforce the channel creation. This is the hold invoice that should be paid, the preimage of said hold invoice and the properties of the channel that should be created. If the invoice is paid through a new channel with the aspired properties, the daemon should settle the invoice.

Such a daemon could also utilize the [ChannelAcceptor of LND](https://api.lightning.community/#channelacceptor) to prevent channels with properties other than the requested ones being opened.

### Modifying the Lightning Client

Another way is incorporating a logic similar to the one of the external daemon directly into the Lightning implementation. This can be done by modifying the source code of the client or by creating a plugin. We have built a [c-lightning](https://github.com/ElementsProject/lightning) plugin for this exact use case. The full source code for this plugin can be found in [this repository](https://github.com/BoltzExchange/channel-creation-plugin).
