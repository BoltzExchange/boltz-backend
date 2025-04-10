---
description: >-
  This document describes how to set up a Docker regtest environment for Boltz
  Backend development.
---

# 🐳 Regtest Environment

Prerequisites:

* The latest [Node.js LTS and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) installed. We recommend using [nvm](https://github.com/nvm-sh/nvm#install--update-script) to manage npm installs: `nvm install --lts`
* [Docker](https://docs.docker.com/engine/install/) or [Orbstack](https://orbstack.dev/) for Apple Silicon Macs

The regtest environment of the Boltz Backend is based on [boltz/regtest](https://hub.docker.com/r/boltz/regtest). To start the images run `npm run docker:start` and to stop them again use `npm run docker:stop` to stop and remove the containers.

To use the nodes in the container with the Boltz Backend, use a configuration file in `~/.boltz/boltz.conf` similar to this one:

```toml
[postgres]
host = "127.0.0.1"
port = 5432
database = "boltz"
username = "boltz"
password = "boltz"

[nodeSwitch]
clnAmountThreshold = 1_000_000

[swap]
deferredClaimSymbols = ["BTC", "L-BTC"]

[[pairs]]
base = "BTC"
quote = "BTC"
rate = 1
fee = 0.4
swapInFee = 0.2

invoiceExpiry = 361

maxSwapAmount = 4_294_967
minSwapAmount = 50_000

    [pairs.timeoutDelta]
    reverse = 1440
    swapMinimal = 1440
    swapMaximal = 2880
    swapTaproot = 10080

[[pairs]]
base = "RBTC"
quote = "BTC"
rate = 1
fee = 0.5

maxSwapAmount = 4_294_967
minSwapAmount = 50_000

    [pairs.timeoutDelta]
    reverse = 1440
    swapMinimal = 1440
    swapMaximal = 2880
    swapTaproot = 10080

[[pairs]]
base = "L-BTC"
quote = "BTC"
fee = 0.25
swapInFee = 0.1
rate = 1

maxSwapAmount = 4_294_967
minSwapAmount = 10_000

    [pairs.timeoutDelta]
    reverse = 1440
    swapMinimal = 1400
    swapMaximal = 2880
    swapTaproot = 10080

[[currencies]]
symbol = "BTC"
network = "bitcoinRegtest"
minWalletBalance = 10_000_000
minLocalBalance = 10_000_000
minRemoteBalance = 10_000_000
maxSwapAmount = 4_294_967
minSwapAmount = 50_000
maxZeroConfAmount = 0
preferredWallet = "core"

    [currencies.chain]
    host = "127.0.0.1"
    port = 18_443
    cookie = "docker/regtest/data/core/cookies/.bitcoin-cookie"

    [currencies.lnd]
    host = "127.0.0.1"
    port = 10_009
    certpath = "docker/regtest/data/lnd/certificates/tls.cert"
    macaroonpath = "docker/regtest/data/lnd/macaroons/admin.macaroon"

    [currencies.cln]
    host = "127.0.0.1"
    port = 9291
    rootCertPath = "docker/regtest/data/cln/certs/ca.pem"
    privateKeyPath = "docker/regtest/data/cln/certs/client-key.pem"
    certChainPath = "docker/regtest/data/cln/certs/client.pem"

        [currencies.cln.hold]
        host = "127.0.0.1"
        port = 9292
        rootCertPath = "docker/regtest/data/cln/hold/ca.pem"
        privateKeyPath = "docker/regtest/data/cln/hold/client-key.pem"
        certChainPath = "docker/regtest/data/cln/hold/client.pem"

        [currencies.cln.mpay]
        host = "127.0.0.1"
        port = 9293
        rootCertPath = "docker/regtest/data/cln/mpay/ca.pem"
        privateKeyPath = "docker/regtest/data/cln/mpay/client-key.pem"
        certChainPath = "docker/regtest/data/cln/mpay/client.pem"

[liquid]
symbol = "L-BTC"
network = "liquidRegtest"

maxSwapAmount = 4_294_967
minSwapAmount = 10_000

minWalletBalance = 100_000_000

    [liquid.chain]
    host = "127.0.0.1"
    port = 18884
    cookie = "docker/regtest/data/core/cookies/.elements-cookie"

[rsk]
providerEndpoint = "http://127.0.0.1:8545"

etherSwapAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
erc20SwapAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"

    [[rsk.tokens]]
    symbol = "RBTC"

    maxSwapAmount = 4_294_96700
    minSwapAmount = 10000

    minWalletBalance = 100_000_000

    [[rsk.tokens]]
    symbol = "USDT"
    decimals = 18
    contractAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"

    maxSwapAmount = 4_294_96700000
    minSwapAmount = 10000

    minWalletBalance = 400_000_000_000
    maxWalletBalance = 500_000_000_000
```

We recommend adding aliases to control executables of Boltz and nodes to your `.bashrc`:

```bash
# Boltz Docker regtest
boltzDir="<path to the cloned repository>"
boltzDataDir="$boltzDir/docker/regtest/data"

cookieDir="$boltzDataDir/core/cookies"

alias bitcoin-cli-sim='bitcoin-cli --regtest --rpccookiefile=$cookieDir/.bitcoin-cookie'
alias elements-cli-sim='elements-cli --regtest --rpcport=18884 --rpccookiefile=$cookieDir/.elements-cookie'

lndCert="$boltzDataDir/lnd/certificates/tls.cert"
lndMacaroon="$boltzDataDir/lnd/macaroons/admin.macaroon"

alias lnclibtc='lncli --rpcserver=127.0.0.1:10009 --tlscertpath=$lndCert --macaroonpath=$lndMacaroon'
alias lnclibtc2='lncli --rpcserver=127.0.0.1:10011 --tlscertpath=$lndCert --macaroonpath=$lndMacaroon'

alias lncliltc='lncli --rpcserver=127.0.0.1:11009 --tlscertpath=$lndCert --macaroonpath=$lndMacaroon'
alias lncliltc2='lncli --rpcserver=127.0.0.1:11010 --tlscertpath=$lndCert --macaroonpath=$lndMacaroon'

alias lightning-cli-sim='docker exec -it regtest lightning-cli'

# Add the Boltz executables to the path
export PATH="$boltzDir/bin:$PATH"
```
