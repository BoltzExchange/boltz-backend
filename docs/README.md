---
description: >-
  Boltz exposes a RESTful HTTP API that can be used to query information like
  supported pairs and to create & monitor swaps.
cover: .gitbook/assets/boltz-backend_header.png
coverY: 0
---

# 👋 Introduction

## Instances

We offer Boltz on [testnet](https://testnet.boltz.exchange) for development & testing purposes and our production service on [mainnet](https://boltz.exchange).

The corresponding REST APIs can be accessed at:

* Testnet: `https://testnet.boltz.exchange/api/`
* Mainnet: `https://api.boltz.exchange/`
* Mainnet via [Tor](https://www.torproject.org/): `http://boltzzzbnus4m7mta3cxmflnps4fp7dueu2tgurstbvrbt6xswzcocyd.onion/api/`

> Note: To test API accessibility via browser, simply append an [endpoint](api.md) to the address, e.g.:
>
> [`https://api.boltz.exchange/version`](https://api.boltz.exchange/version)

In the following sections we'll describe the REST API, walk through swap types & states, how to craft transactions, handle refunds and more.
