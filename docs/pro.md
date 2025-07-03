# 🏅 Pro

Boltz Pro is a service designed to dynamically adjust swap fees based on
Boltz's liquidity needs, helping to maintain wallet and Lightning channel
balances.

Boltz Pro temporarily offers incentives, like 0% or even negative fees, to encourage users to conduct swaps that work in favor of our liquidity needs. It has much stricter limits, e.g. the available fee budget for routing on Lightning, or the time limit to fund swaps and is **not designed for regular payments**.

## Web Usage

A web app for Boltz Pro is available at [pro.boltz.exchange](https://pro.boltz.exchange/).

## API Usage

Boltz Pro can be accessed via API using the [same endpoints and methods](api-v2.md) as the regular Boltz API. To switch to Boltz Pro, API consumers need to:

* add a `Referral` header to all pair related `GET` requests and set it to `pro`
* set the `referralId` to `pro` when creating swaps

## API Client

We recommend using [Boltz Client](https://github.com/BoltzExchange/boltz-client) as API consumer for Boltz Pro, as it safely handles key generation and storage, refunds and many common edge cases. Boltz Client is our battle-tested swap client, powering e.g. the popular [Boltz BTCPay Plugin](https://github.com/BoltzExchange/boltz-btcpay-plugin).


Check [this section](https://docs.boltz.exchange/boltz-client/boltz-pro) for details on how to set up Boltz Client for usage with Boltz Pro.

::: warning
We strongly advise _against_ using Boltz Web App for automation of Boltz Pro, as updates might break integrations.
:::
