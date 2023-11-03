---
description: >-
  This document describes how to set up a Docker regtest environment for
  development purposes.
---

# 🐳 Regtest Environment

Prerequisites:

* The latest [Node.js LTS and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) installed. We recommend using [nvm](https://github.com/nvm-sh/nvm#install--update-script) to manage npm installs: `nvm install --lts`
* [Docker](https://docs.docker.com/engine/install/)

The regtest environment of Boltz Backend is based on [boltz/regtest](https://hub.docker.com/r/boltz/regtest). To start the images run `npm run docker:start` and to stop them again use `npm run docker:stop` to stop and remove the containers.

To use the nodes in the container with Boltz Backend, use a configuration similar to this one:

```toml
[[pairs]]
base = "BTC"
quote = "BTC"
rate = 1
fee = 0.5
timeoutDelta = 1_440
maxSwapAmount = 4_294_967
minSwapAmount = 10_000

[[pairs]]
base = "L-BTC"
quote = "BTC"
rate = 1
fee = 0.5
timeoutDelta = 1_440
maxSwapAmount = 2_000_000_000
minSwapAmount = 100_000

[[currencies]]
symbol = "BTC"
network = "bitcoinRegtest"
minWalletBalance = 10_000_000
minChannelBalance = 10_000_000
maxZeroConfAmount = 10_000_000

  [currencies.chain]
  host = "127.0.0.1"
  port = 18_443
  cookie = "docker/regtest/data/core/cookies/.bitcoin-cookie"
  rpcuser = "kek"
  rpcpass = "kek"

  [currencies.lnd]
  host = "127.0.0.1"
  port = 10_009
  certpath = "docker/regtest/data/lnd/certificates/tls.cert"
  macaroonpath = "docker/regtest/data/lnd/macaroons/admin.macaroon"
  maxPaymentFeeRatio = 0.03

[liquid]
symbol = "L-BTC"
network = "liquidRegtest"
minWalletBalance = 10_000_000

  [liquid.chain]
  host = "127.0.0.1"
  port = 18884
  cookie = "docker/regtest/data/core/cookies/.elements-cookie"
```

We recommend adding aliases to control executables of Boltz and nodes to your `.bashrc`:

```bash
# Boltz Docker regtest
boltzDir="<path to the cloned repository>"
boltzDataDir="$boltzDir/docker/regtest/data/"

cookieDir="$boltzDataDir/core/cookies"

alias bitcoin-cli-sim='bitcoin-cli --regtest --rpccookiefile=$cookieDir/.bitcoin-cookie'
lndCert="$boltzDataDir/lnd/certificates/tls.cert"
lndMacaroon="$boltzDataDir/lnd/macaroons/admin.macaroon"

alias lnclibtc='lncli --rpcserver=127.0.0.1:10009 --tlscertpath=$lndCert --macaroonpath=$lndMacaroon'
alias lnclibtc2='lncli --rpcserver=127.0.0.1:10011 --tlscertpath=$lndCert --macaroonpath=$lndMacaroon'

# Add the Boltz executables to the path
export PATH="$boltzDir/bin:$PATH"
```
