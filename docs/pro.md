---
description:
  Boltz Pro is an experimental service designed to dynamically adjust swap fees based on our liquidity needs, helping to maintain our wallet and Lightning channel balances.
---

# 🏅 Pro

Boltz Pro temporarily offers incentives, like 0% or even negative fees, to encourage users to conduct swaps that work in favor of our liquidity needs. It has much stricter limits, e.g. the available fee budget for routing on Lightning, or the time limit to fund swaps and is not designed to be used for e.g. regular payments.

## Web Usage

A web app for Boltz Pro is available at [pro.boltz.exchange](https://pro.boltz.exchange/).

## API Usage

Boltz Pro can be accessed via API using the [same endpoints and methods](api-v2.md) as the regular Boltz API. To switch to Boltz Pro, API consumers need to:

- add a `Referral` header to all pair related `GET` requests and set it to `pro`
- set the `referralId` to `pro` when creating swaps

{% hint style="info" %}
We stronly recommend using [Boltz Client](https://github.com/BoltzExchange/boltz-client) as API consumer, which we are continuously expanding for usage with Pro. Please [open an issue](https://github.com/BoltzExchange/boltz-client/issues/new), if you are missing a feature. We advise against using Boltz Web App for automation, as updates might break integrations. 
{% endhint %}
