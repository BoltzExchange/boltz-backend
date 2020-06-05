# Setting up the Docker environment

Prerequisites:

* Node.js version `v12.18.0` or higher (preferably the latest LTS)
* Docker

To use the [regtest Docker image](https://hub.docker.com/r/boltz/regtest) for other purposes than running the integration tests execute `npm run docker:start`. This command will create a new container with a prepared regtest environment.

When you are done run `npm run docker:stop` to stop and remove the container.

To use the nodes in the container with `boltz-backend` use a configuration similar to this one:

```toml
[[pairs]]
base = "LTC"
quote = "BTC"
fee = 2
timeoutDelta = 400

[[pairs]]
base = "BTC"
quote = "BTC"
rate = 1
fee = 0.5
timeoutDelta = 1_440

[[pairs]]
base = "LTC"
quote = "LTC"
rate = 1
fee = 0.5
timeoutDelta = 1_440

[[currencies]]
symbol = "BTC"
network = "bitcoinRegtest"
minWalletBalance = 10_000_000
minChannelBalance = 10_000_000
maxSwapAmount = 4_294_967
minSwapAmount = 10_000
maxZeroConfAmount = 10_000_000

  [currencies.chain]
  host = "127.0.0.1"
  port = 18_443
  rpcuser = "kek"
  rpcpass = "kek"

  [currencies.lnd]
  host = "127.0.0.1"
  port = 10_009
  certpath = "docker/regtest/data/lnd/certificates/tls.cert"
  macaroonpath = "docker/regtest/data/lnd/macaroons/admin.macaroon"

[[currencies]]
symbol = "LTC"
network = "litecoinRegtest"
minWalletBalance = 110_000_000
minChannelBalance = 110_000_000
maxSwapAmount = 2000_000_000
minSwapAmount = 100_000
maxZeroConfAmount = 0

  [currencies.chain]
  host = "127.0.0.1"
  port = 19_443
  rpcuser = "kek"
  rpcpass = "kek"

  [currencies.lnd]
  host = "127.0.0.1"
  port = 11_009
  certpath = "docker/regtest/data/lnd/certificates/tls.cert"
  macaroonpath = "docker/regtest/data/lnd/macaroons/admin.macaroon"
```

It is really handy to have the executables of Boltz and some aliases to control the nodes in your path. Therefore it is recommended to add the following to your `.bashrc`.

In case you have Bitcoin Core, Litecoin Core and LND installed locally (the advantage is that local executables startup *a little bit faster*):

```bash
# Boltz Docker regtest
boltzDir="<path to the cloned repository>"
boltzDataDir="$boltzDir/docker/regtest/data/"

alias bitcoin-cli-sim='bitcoin-cli --regtest --rpcuser=kek --rpcpassword=kek'
alias litecoin-cli-sim='litecoin-cli --regtest --rpcuser=kek --rpcpassword=kek'

lndCert="$boltzDataDir/lnd/certificates/tls.cert"
lndMacaroon="$boltzDataDir/lnd/macaroons/admin.macaroon"

alias lnclibtc='lncli --rpcserver=127.0.0.1:10009 --tlscertpath=$lndCert --macaroonpath=$lndMacaroon'
alias lnclibtc2='lncli --rpcserver=127.0.0.1:10011 --tlscertpath=$lndCert --macaroonpath=$lndMacaroon'

alias lncliltc='lncli --rpcserver=127.0.0.1:11009 --tlscertpath=$lndCert --macaroonpath=$lndMacaroon'
alias lncliltc2='lncli --rpcserver=127.0.0.1:11010 --tlscertpath=$lndCert --macaroonpath=$lndMacaroon'

# Add the Boltz executables to the path
export PATH="$boltzDir/bin:$PATH"
```

If not you can also use the executables in the Docker image:

```bash
# Boltz Docker regtest
boltzDir="<path to the cloned repository>"
boltzDataDir="$boltzDir/docker/regtest/data/"

alias bitcoin-cli='docker exec -it regtest bitcoin-cli'
alias litecoin-cli='docker exec -it regtest litecoin-cli'

lndCert="/root/.lnd-btc/tls.cert"
lndMacaroon="/root/.lnd-btc/data/chain/bitcoin/regtest/admin.macaroon"

alias lnclibtc='docker exec -it regtest lncli --rpcserver=127.0.0.1:10009 --tlscertpath=$lndCert --macaroonpath=$lndMacaroon'
alias lnclibtc2='docker exec -it regtest lncli --rpcserver=127.0.0.1:10011 --tlscertpath=$lndCert --macaroonpath=$lndMacaroon'

alias lncliltc='docker exec -it regtest lncli --rpcserver=127.0.0.1:11009 --tlscertpath=$lndCert --macaroonpath=$lndMacaroon'
alias lncliltc2='docker exec -it regtest lncli --rpcserver=127.0.0.1:11010 --tlscertpath=$lndCert --macaroonpath=$lndMacaroon'

# Add the Boltz executables to the path
export PATH="$boltzDir/bin:$PATH"
```
