# 🐳 Docker Regtest Environment

Prerequisites:

* The latest `Node.js` LTS release
* Docker

The regtest environment of Boltz Backend is based on the [boltz/regtest](https://hub.docker.com/r/boltz/regtest)&#x20;

To start the images run `npm run docker:start` and to stop them again use `npm run docker:stop` to stop and remove the containers.

To use the nodes in the container with Boltz Backend, use a configuration similar to this one:

```toml
[[pairs]]
base = "LTC"
quote = "BTC"
fee = 2
timeoutDelta = 400
maxSwapAmount = 4_294_967
minSwapAmount = 10_000

[[pairs]]
base = "BTC"
quote = "BTC"
rate = 1
fee = 0.5
timeoutDelta = 1_440
maxSwapAmount = 4_294_967
minSwapAmount = 10_000

[[pairs]]
base = "LTC"
quote = "LTC"
rate = 1
fee = 0.5
timeoutDelta = 1_440
maxSwapAmount = 2_000_000_000
minSwapAmount = 100_000

[[pairs]]
base = "ETH"
quote = "BTC"
fee = 5
timeoutDelta = 180
maxSwapAmount = 4_294_967
minSwapAmount = 50_000

[[pairs]]
base = "BTC"
quote = "USDT"
fee = 5
timeoutDelta = 180
maxSwapAmount = 4_294_967
minSwapAmount = 50_000

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

[[currencies]]
symbol = "LTC"
network = "litecoinRegtest"
minWalletBalance = 110_000_000
minChannelBalance = 110_000_000
maxZeroConfAmount = 0

  [currencies.chain]
  host = "127.0.0.1"
  port = 19_443
  cookie = "docker/regtest/data/core/cookies/.litecoin-cookie"
  rpcuser = "kek"
  rpcpass = "kek"

  [currencies.lnd]
  host = "127.0.0.1"
  port = 11_009
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

[ethereum]
providerEndpoint = "http://127.0.0.1:8546"

etherSwapAddress = "0xc6105E7F62690cee5bf47f8d8A353403D93eCC6B"
erc20SwapAddress = "0x0Cd61AD302e9B2D76015050D44218eCF53cFadC9"

  [[ethereum.tokens]]
  symbol = "ETH"

  [[ethereum.tokens]]
  symbol = "USDT"
  decimals = 18
  contractAddress = "0x504eF817bFdE039b33189C7eb8aa8861c25392C1"
```

It is really handy to have the executables of Boltz and some aliases to control the nodes in your path. Therefore, it is recommended to add the following to your `.bashrc`:

```bash
# Boltz Docker regtest
boltzDir="<path to the cloned repository>"
boltzDataDir="$boltzDir/docker/regtest/data/"

cookieDir="$boltzDataDir/core/cookies"

alias bitcoin-cli-sim='bitcoin-cli --regtest --rpccookiefile=$cookieDir/.bitcoin-cookie'
alias litecoin-cli-sim='litecoin-cli --regtest --rpccookiefile=$cookieDir/.litecoin-cookie'

lndCert="$boltzDataDir/lnd/certificates/tls.cert"
lndMacaroon="$boltzDataDir/lnd/macaroons/admin.macaroon"

alias lnclibtc='lncli --rpcserver=127.0.0.1:10009 --tlscertpath=$lndCert --macaroonpath=$lndMacaroon'
alias lnclibtc2='lncli --rpcserver=127.0.0.1:10011 --tlscertpath=$lndCert --macaroonpath=$lndMacaroon'

alias lncliltc='lncli --rpcserver=127.0.0.1:11009 --tlscertpath=$lndCert --macaroonpath=$lndMacaroon'
alias lncliltc2='lncli --rpcserver=127.0.0.1:11010 --tlscertpath=$lndCert --macaroonpath=$lndMacaroon'

# Add the Boltz executables to the path
export PATH="$boltzDir/bin:$PATH"
```
