# 🐳 Backend Development

This document describes how to set up a Docker regtest environment for Boltz
Backend development.

## Getting Started

- The latest
  [Node.js LTS and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
  installed. We recommend using
  [nvm](https://github.com/nvm-sh/nvm#install--update-script) to manage npm
  installs: `nvm install --lts`
- [Docker](https://docs.docker.com/engine/install/)

The regtest environment of the Boltz Backend is based on
[boltz-regtest](https://github.com/BoltzExchange/boltz-regtest). To start the
regtest environment run `npm run regtest:start` and to stop it again use
`npm run regtest:stop`.

To use the nodes in the container with the Boltz Backend, use a configuration
file in `~/.boltz/boltz.conf` similar to this one:

<<< @/boltz.conf{toml} [Boltz configuration]

## boltzr-cli

The `boltzr-cli` tool allows you to interact with a running backend over gRPC.
It can be useful for backend development and to perform maintenance tasks. It is
available on the `bin` folder after compiling the backend.
