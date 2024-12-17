---
description: >-
  Boltz exposes a RESTful HTTP API that can be used to query information like
  supported pairs as well as to create and monitor swaps. All swap clients, like
  Boltz Web App, use Boltz API under the hood.
cover: .gitbook/assets/boltz-backend_header.png
coverY: 0
---

# 👋 Introduction

## Instances

We offer Boltz on [testnet](https://testnet.boltz.exchange) for development &
testing purposes and our production service on
[mainnet](https://boltz.exchange).

The corresponding REST APIs can be accessed at:

- Testnet: `https://api.testnet.boltz.exchange/`
- Mainnet: `https://api.boltz.exchange/`
- Mainnet via [Tor](https://www.torproject.org/):
  `http://boltzzzbnus4m7mta3cxmflnps4fp7dueu2tgurstbvrbt6xswzcocyd.onion/api/`

## Lightning Nodes

We operate several lightning nodes on testnet and mainnet:

- Testnet:
  [CLN](https://mempool.space/testnet/lightning/node/029040945df331e634fba152ce6a21e3dfca87b68d275e078caeee4753f43e9acb)
  |
  [LND](https://mempool.space/testnet/lightning/node/03f060953bef5b777dc77e44afa3859d022fc1a77c55138deb232ad7255e869c00)
- Mainnet:
  [CLN](https://mempool.space/lightning/node/02d96eadea3d780104449aca5c93461ce67c1564e2e1d73225fa67dd3b997a6018)
  |
  [LND](https://mempool.space/lightning/node/026165850492521f4ac8abd9bd8088123446d126f648ca35e60f88177dc149ceb2)

For reliable swapping _on testnet_ it's advisable to open a direct channel with
us.

In the following sections we'll describe the available libraries for our API,
the REST API itself, walk through swap types & states, how to craft
transactions, handle refunds and more.
