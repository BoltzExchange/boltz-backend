---
description: >-
  Boltz exposes a RESTful HTTP API that can be used to query information like
  supported pairs as well as to create and monitor swaps.
cover: .gitbook/assets/Screenshot from 2023-07-27 16-48-01.png
coverY: 0
---

# 👋 Introduction

## Instances

We offer Boltz on [testnet](https://testnet.boltz.exchange) for development & testing purposes and our production service on [mainnet](https://boltz.exchange).

The corresponding REST APIs can be accessed at:

* Testnet: `https://testnet.boltz.exchange/api/`
* Mainnet: `https://api.boltz.exchange/`

> Note: To test API accessibility via browser, simply append an [endpoint](api.md) to the address, e.g.:
>
> [`https://api.boltz.exchange/version`](https://api.boltz.exchange/version)

In the following sections we'll walk through existing swap types & states, describe the REST API, how to handle refunds and more.
