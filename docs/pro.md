---
description: >-
  Boltz Pro is the same as our main site, but with the crucial difference that
  fees are variable and set based on our liquidity needs
---

# 🏅 Pro

Boltz Pro is an experimental service designed to dynamically adjust swap fees based on our liquidity needs, helping maintain balance between our wallets and Lightning channels. We temporarily offer incentives (like 0% or even negative fees) to encourage users to conduct swaps that work in favor of our liquidity needs.

## Web Usage

A web app for Boltz Pro is available on [pro.boltz.exchange](https://pro.boltz.exchange/).

### API Usage

The Boltz Pro API uses the [exact same endpoints and methods as the normal one](api-v2.md). Only two things need to be done to use Pro:

* add a `Referral` header to all pair related `GET` requests and set it to `pro`
* set the `referralId` to `pro` when creating swaps
