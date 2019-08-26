# Setting up the Docker environment

Prerequisites:

* Node.js version `v10.16.0` or higher (preferably the latest LTS)
* Docker

To use the [regtest Docker image](https://cloud.docker.com/u/boltz/repository/docker/boltz/regtest) for other purposes than running the integration tests execute `npm run docker:start`. This command will create a new container with a prepared regtest environment.

When you are done run `npm run docker:stop` to stop and remove the container.

To use the nodes in the container with `boltz-backend` use a configuration similar to this one:

```toml
[[currencies]]
  symbol = "BTC"
  network = "bitcoinRegtest"

  [currencies.chain]
    host = "127.0.0.1"
    port = 18443
    rpcuser = "kek"
    rpcpass = "kek"

  [currencies.lnd]
    host = "127.0.0.1"
    port = 10009
    certpath = "docker/regtest/data/lnd/certificates/tls.cert"
    macaroonpath = "docker/regtest/data/lnd/macaroons/admin.macaroon"

[[currencies]]
  symbol = "LTC"
  network = "litecoinRegtest"

  [currencies.chain]
    host = "127.0.0.1"
    port = 19443
    rpcuser = "kek"
    rpcpass = "kek"

  [currencies.lnd]
    host = "127.0.0.1"
    port = 11009
    certpath = "docker/regtest/data/lnd/certificates/tls.cert"
    macaroonpath = "docker/regtest/data/lnd/macaroons/admin.macaroon"
```

It is really handy to have the executables of `boltz-backend` and some aliases to control the nodes in your path. Therefore it is recommended to add this to your `.bashrc`:

```bash
# Boltz Docker regtest
boltzDir="<path to the cloned repository>"
boltzDataDir="$boltzDir/docker/regtest/data/"

alias bitcoin-cli-sim='bitcoin-cli --regtest --rpcuser=kek --rpcpassword=kek'
alias litecoin-cli-sim='litecoin-cli --regtest --rpcuser=kek --rpcpassword=kek'

lndCert="$boltzDataDir/lnd/certificates/tls.cert"
lndMacaroon="$boltzDataDir/lnd/macaroons/admin.macaroon"

alias lnclibtc='lncli --rpcserver=127.0.0.1:10009 --tlscertpath=$lndCert --macaroonpath=$lndMacaroon'
alias lnclibtc2='lncli --rpcserver=127.0.0.1:10010 --tlscertpath=$lndCert --macaroonpath=$lndMacaroon'

alias lncliltc='lncli --rpcserver=127.0.0.1:11009 --tlscertpath=$lndCert --macaroonpath=$lndMacaroon'
alias lncliltc2='lncli --rpcserver=127.0.0.1:11010 --tlscertpath=$lndCert --macaroonpath=$lndMacaroon'

# Add the Boltz executables to the path
export PATH="$boltzDir/bin:$PATH"
```

Please note that these aliases require you to have [Bitcoin Core](https://github.com/bitcoin/bitcoin), [Litecoin Core](https://github.com/litecoin-project/litecoin) and [LND](https://github.com/lightningnetwork/lnd/) installed natively. Although running the commands with the executables in the regtest image would be possible, CLI tools which are installed locally are way more responsive and have a lower startup time.
