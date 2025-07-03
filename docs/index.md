# 👋 Introduction

Boltz exposes a RESTful HTTP API that can be used to query information like
supported pairs as well as to create and monitor swaps. All swap clients, like
Boltz Web App, use Boltz API under the hood.

## Instances

We offer Boltz on [regtest](https://github.com/BoltzExchange/regtest) for development & testing purposes and our production service on [mainnet](https://boltz.exchange). Our testnet deployment is deprecated and we currently do not provide support for it.

Our REST APIs can be accessed at:

* Mainnet: `https://api.boltz.exchange/`
* Mainnet via [Tor](https://www.torproject.org/): `http://boltzzzbnus4m7mta3cxmflnps4fp7dueu2tgurstbvrbt6xswzcocyd.onion/api/`

## Lightning Nodes

We operate the following lightning nodes: [CLN](https://amboss.space/node/02d96eadea3d780104449aca5c93461ce67c1564e2e1d73225fa67dd3b997a6018) | [LND](https://amboss.space/node/026165850492521f4ac8abd9bd8088123446d126f648ca35e60f88177dc149ceb2)

In the following sections we'll describe the available libraries for our API, the REST API itself, walk through swap types & states, how to craft transactions, handle refunds and more.
