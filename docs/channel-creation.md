---
description: >-
  Normal Submarine Swaps can be configured to create a channel to your node
  before paying the invoice. This document elaborates how this works and how to
  enforce the channel opening.
---

# ✨ Channel Creation

> Note: Channel Creation is currently disabled on Boltz

## Enforcing a Channel Creation

As of writing, no Lightning implementation supports enforcing invoice payment through a new channel natively. However, the following solutions exist:

### CLN - Plugin

One way is to incorporate a logic similar to the one of the external daemon described below directly into the Lightning implementation. This can be done by modifying the source code of the client or by creating a plugin. We provide a [Core Lightning](https://github.com/ElementsProject/lightning) plugin for this use case. The full source code of the plugin can be found in [this repository](https://github.com/BoltzExchange/channel-creation-plugin).

### LND - External Daemon

Another way to enforce that the invoice is paid through a newly created channel with the requested properties and balances is by using [hold invoices](https://bitcoinops.org/en/topics/hold-invoices/) in combination with an external daemon. Such a daemon should have all the information required to enforce the channel creation. This is the hold invoice that should be paid, the preimage of said hold invoice and the properties of the channel that should be created. If the invoice is paid through a new channel with the aspired properties, the daemon should settle the invoice.

Such a daemon could also utilize the [ChannelAcceptor of LND](https://lightning.engineering/api-docs/api/lnd/lightning/channel-acceptor) to prevent channels with properties other than the requested ones being opened.
