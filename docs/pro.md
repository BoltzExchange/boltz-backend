---
description: Boltz Pro is a non-custodial way to earn sats with swaps on Boltz.
---

# 🏅 Pro

Boltz Pro is an experimental service designed to dynamically adjust swap fees based on our liquidity needs, helping to maintain our wallet and Lightning channel balances. We temporarily offer incentives (like 0% or even negative fees) to encourage users to conduct swaps that work in favor of our liquidity needs.

## Web Usage

A web app for Boltz Pro is available on [pro.boltz.exchange](https://pro.boltz.exchange/).

### API Usage

Boltz Pro can be accessed via API using the [same endpoints and methods ](api-v2.md)as the regular Boltz API. To switch to Pro, API consumers simply need to:

* add a `Referral` header to all pair related `GET` requests and set it to `pro`
* set the `referralId` to `pro` when creating swaps
