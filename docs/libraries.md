# 📙 Clients, SDKs & Libraries

::: danger ⚠️ DO NOT INTEGRATE BOLTZ API FROM SCRATCH ⚠️

Securely integrating Boltz API from scratch is extremely involved. Based on our
experience, integration is complex, error-prone, and likely a multi-month effort
with numerous edge cases to cover, which will result in **loss of funds** if not
handled correctly. Therefore, we strongly recommend using one of the official
clients, SDKs, or libraries listed below instead.

**If the libraries below do not serve your needs and you are absolutely
committed to the task, do not integrate Boltz API directly without first
contacting us via [Support Chat](https://boltz.exchange/) or
[Email](mailto:hi@bol.tz).**

**We do not provide support for custom integrations that we were not involved
with.**

:::

## Server-Side Integrations

### [Boltz Client](https://github.com/BoltzExchange/boltz-client) ⭐ Recommended

**Covers most server-side use cases (e.g., swap server creating swaps for
clients).** Our battle-tested reference client for accepting Lightning payments
without running a node and rebalancing existing Lightning nodes; it also
provides a full-fledged Go library for Boltz API. Used by e.g.:
[Boltz BTCPay Plugin](https://github.com/BoltzExchange/boltz-btcpay-plugin/)

Supported currencies: Bitcoin, Lightning, Liquid

## Client-Side Integrations

### [Breez SDK - Nodeless](https://github.com/breez/breez-sdk-liquid) ⭐ Recommended

**Covers most client-side use cases (e.g., mobile or browser app).** A polished
end-to-end solution for developers that includes a wallet, notification system,
WebAssembly support, and bindings for Kotlin, Flutter, Python, React Native, and
Swift. Used by e.g.: [Klever Wallet](https://klever.io/) and
[Misty Breez](https://breez.technology/misty/)

Supported currencies: Bitcoin, Lightning, Liquid

## Other Libraries

### [Boltz Core](https://github.com/BoltzExchange/boltz-core) (TypeScript)

Our reference library in TypeScript. Used by e.g.:
[Boltz Web App](https://github.com/BoltzExchange/boltz-web-app) and
[Boltz Backend](https://github.com/BoltzExchange/boltz-backend)

Supported currencies: Bitcoin, Lightning, Liquid, Rootstock

### [Boltz Rust](https://github.com/SatoshiPortal/boltz-rust) (Rust)

Our reference library in Rust, developed and maintained by the amazing folks at
[Bull Bitcoin](https://www.bullbitcoin.com/) and Boltz. Features bindings for
Python. Used by e.g.:
[Bull Bitcoin Mobile](https://github.com/SatoshiPortal/bullbitcoin-mobile) and
[Aqua Wallet](https://github.com/AquaWallet/aqua-wallet) via
[Boltz Dart](https://github.com/SatoshiPortal/boltz-dart)

Supported currencies: Bitcoin, Lightning, Liquid
