# 🐳 Backend Development

This document describes how to set up a Docker regtest environment for Boltz
Backend development.

## Getting Started

- The latest
  [Node.js LTS and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
  installed. We recommend using
  [nvm](https://github.com/nvm-sh/nvm#install--update-script) to manage npm
  installs: `nvm install --lts`
- [Docker](https://docs.docker.com/engine/install/) or
  [Orbstack](https://orbstack.dev/) for Apple Silicon Macs

The regtest environment of the Boltz Backend is based on
[boltz-regtest](https://github.com/BoltzExchange/boltz-regtest). To start the
regtest environment run `npm run regtest:start` and to stop it again use
`npm run regtest:stop`.

To use the nodes in the container with the Boltz Backend, use a configuration
file in `~/.boltz/boltz.conf` similar to this one:

<<< @/boltz.conf{toml} [Boltz configuration]

We recommend adding aliases to control executables of Boltz and nodes to your
`.bashrc`:

```bash
# Boltz Docker regtest
boltzDir="<path to the cloned repository>"
boltzDataDir="$boltzDir/docker/regtest/data"

alias bitcoin-cli-sim='bitcoin-cli --regtest --rpcport=18443 -rpcuser=boltz -rpcpassword=anoVB0m1KvX0SmpPxvaLVADg0UQVLQTEx3jCD3qtuRI'
alias elements-cli-sim='elements-cli --regtest --rpcport=18884 -rpcuser=boltz -rpcpassword=anoVB0m1KvX0SmpPxvaLVADg0UQVLQTEx3jCD3qtuRI'

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

## boltzr-cli

The `boltzr-cli` tool allows you to interact with a running backend over gRPC.
It can be useful for backend development and to perform maintenance tasks. It is
available on the `bin` folder after compiling the backend.
